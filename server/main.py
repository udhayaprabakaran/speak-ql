"""
SpeakQL — FastAPI Backend
=========================
Receives natural-language prompts, translates them to SQL via an AI agent,
executes against the target datasource via MCP servers, and returns data + chart spec.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent.sql_agent import process_query
from datasources import (
    DatasourceConfig,
    DatasourceCreate,
    add_datasource,
    get_datasource,
    list_datasources,
    remove_datasource,
    test_datasource,
)
from mcp.postgres_server import PostgresMCPServer
from mcp.clickhouse_server import ClickHouseMCPServer

load_dotenv()

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SpeakQL API",
    description="Talk to your database. See the results.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class QueryRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural-language query")
    datasource_id: str = Field(
        default="",
        description="ID of configured datasource (empty = use mock data)",
    )


class ChartSpec(BaseModel):
    type: str = Field(..., description="Chart type: bar | line | pie | area")
    x_axis: str = Field(..., description="Column to use as X axis")
    y_axis: str = Field(..., description="Column to use as Y axis")
    title: str = Field(default="", description="Chart title")


class QueryResponse(BaseModel):
    sql: str
    data: list[dict]
    chart: ChartSpec


# ---------------------------------------------------------------------------
# Helper: get MCP server for a datasource config
# ---------------------------------------------------------------------------


async def _get_mcp_server(config: DatasourceConfig):
    """Instantiate and connect the appropriate MCP server for a datasource."""
    if config.type == "postgres":
        server = PostgresMCPServer(dsn=config.dsn)
    elif config.type == "clickhouse":
        server = ClickHouseMCPServer(
            host=config.host,
            port=config.port,
            user=config.user,
            password=config.password,
            database=config.database,
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {config.type}")
    await server.connect()
    return server


# ---------------------------------------------------------------------------
# Routes — Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Routes — Datasource CRUD
# ---------------------------------------------------------------------------


@app.get("/datasources")
async def api_list_datasources():
    """List all configured datasources."""
    sources = list_datasources()
    # Don't expose passwords to the frontend
    return [
        {**s.model_dump(), "password": "••••" if s.password else ""}
        for s in sources
    ]


@app.post("/datasources")
async def api_add_datasource(create: DatasourceCreate):
    """Add a new datasource configuration."""
    ds = add_datasource(create)
    return {**ds.model_dump(), "password": "••••" if ds.password else ""}


@app.delete("/datasources/{ds_id}")
async def api_remove_datasource(ds_id: str):
    """Remove a datasource by ID."""
    removed = remove_datasource(ds_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Datasource not found")
    return {"deleted": True}


@app.post("/datasources/test")
async def api_test_datasource(create: DatasourceCreate):
    """Test a datasource connection without saving it."""
    config = DatasourceConfig(**create.model_dump())
    result = await test_datasource(config)
    return result


# ---------------------------------------------------------------------------
# Routes — Query
# ---------------------------------------------------------------------------


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    """Accept a natural-language prompt and return SQL + data + chart spec."""
    try:
        config = None
        schema = None
        datasource_type = "postgres"

        # If a datasource ID is provided, look it up and get live schema
        if req.datasource_id:
            config = get_datasource(req.datasource_id)
            if config is None:
                raise HTTPException(status_code=404, detail="Datasource not found")
            datasource_type = config.type

        # 1. If we have a real datasource, grab its live schema
        server = None
        if config:
            server = await _get_mcp_server(config)
            try:
                schema = await server.get_schema()
            except Exception:
                schema = None  # fall back to built-in schema

        # 2. AI Agent: generate SQL + chart spec
        agent_result = await process_query(
            prompt=req.prompt,
            datasource=datasource_type,
            schema=schema,
        )

        # 3. Execute SQL via MCP server (or mock)
        if server:
            try:
                data = await server.execute_query(agent_result["sql"])
            finally:
                await server.disconnect()
        else:
            # No real datasource — use mock Postgres server
            mock_server = PostgresMCPServer()
            data = await mock_server.execute_query(agent_result["sql"])

        return QueryResponse(
            sql=agent_result["sql"],
            data=data,
            chart=ChartSpec(**agent_result["chart"]),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
