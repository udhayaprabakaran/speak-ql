"""
SpeakQL — Datasource Configuration Manager
============================================
JSON-file-backed CRUD for database connection configs.
Stores datasource definitions in datasources.json alongside the server.
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

DATASOURCES_FILE = Path(__file__).parent / "datasources.json"

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class DatasourceConfig(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    name: str = Field(..., min_length=1, description="Human-friendly label")
    type: str = Field(..., description="postgres | clickhouse")
    host: str = Field(default="localhost")
    port: int = Field(default=5432)
    database: str = Field(default="")
    user: str = Field(default="")
    password: str = Field(default="")

    @property
    def dsn(self) -> str:
        if self.type == "postgres":
            return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"
        return ""


class DatasourceCreate(BaseModel):
    name: str
    type: str = "postgres"
    host: str = "localhost"
    port: int = 5432
    database: str = ""
    user: str = ""
    password: str = ""


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


def _load() -> list[dict[str, Any]]:
    if DATASOURCES_FILE.exists():
        return json.loads(DATASOURCES_FILE.read_text())
    return []


def _save(data: list[dict[str, Any]]) -> None:
    DATASOURCES_FILE.write_text(json.dumps(data, indent=2))


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


def list_datasources() -> list[DatasourceConfig]:
    return [DatasourceConfig(**d) for d in _load()]


def get_datasource(ds_id: str) -> DatasourceConfig | None:
    for d in _load():
        if d["id"] == ds_id:
            return DatasourceConfig(**d)
    return None


def add_datasource(create: DatasourceCreate) -> DatasourceConfig:
    ds = DatasourceConfig(**create.model_dump())
    data = _load()
    data.append(ds.model_dump())
    _save(data)
    return ds


def remove_datasource(ds_id: str) -> bool:
    data = _load()
    filtered = [d for d in data if d["id"] != ds_id]
    if len(filtered) == len(data):
        return False
    _save(filtered)
    return True


# ---------------------------------------------------------------------------
# Connection test
# ---------------------------------------------------------------------------


async def test_datasource(config: DatasourceConfig) -> dict[str, Any]:
    """Try connecting to the configured datasource. Returns status + message."""
    if config.type == "postgres":
        try:
            import asyncpg
            conn = await asyncpg.connect(config.dsn)
            version = await conn.fetchval("SELECT version()")
            await conn.close()
            return {"success": True, "message": f"Connected! {version}"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    if config.type == "clickhouse":
        try:
            import clickhouse_connect
            client = clickhouse_connect.get_client(
                host=config.host,
                port=config.port,
                username=config.user,
                password=config.password,
                database=config.database,
            )
            version = client.server_version
            client.close()
            return {"success": True, "message": f"Connected! ClickHouse {version}"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    return {"success": False, "message": f"Unknown type: {config.type}"}
