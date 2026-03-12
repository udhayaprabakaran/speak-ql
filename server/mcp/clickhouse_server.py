"""
SpeakQL — MCP Server for ClickHouse
=====================================
MCP server for ClickHouse. Accepts connection params dynamically.
Provides mock data when no ClickHouse instance is configured.
"""

from __future__ import annotations

import os
import random
from datetime import date, timedelta
from typing import Any


class ClickHouseMCPServer:
    """MCP-style server for ClickHouse connections."""

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        user: str | None = None,
        password: str | None = None,
        database: str | None = None,
    ):
        self._client = None
        self._connected = False
        self._host = host or os.getenv("CLICKHOUSE_HOST", "")
        self._port = port or int(os.getenv("CLICKHOUSE_PORT", "8123"))
        self._user = user or os.getenv("CLICKHOUSE_USER", "default")
        self._password = password or os.getenv("CLICKHOUSE_PASSWORD", "")
        self._database = database or os.getenv("CLICKHOUSE_DATABASE", "default")

    async def connect(self):
        if self._host:
            try:
                import clickhouse_connect
                self._client = clickhouse_connect.get_client(
                    host=self._host,
                    port=self._port,
                    username=self._user,
                    password=self._password,
                    database=self._database,
                )
                self._connected = True
                print(f"[MCP/ClickHouse] Connected to {self._host}")
            except Exception as e:
                print(f"[MCP/ClickHouse] Connection failed, using mock data: {e}")
                self._connected = False
        else:
            print("[MCP/ClickHouse] No host configured, using mock data")
            self._connected = False

    async def disconnect(self):
        if self._client:
            self._client.close()
            print("[MCP/ClickHouse] Disconnected")

    async def get_schema(self) -> str:
        if self._connected and self._client:
            result = self._client.query("SHOW TABLES")
            tables = [row[0] for row in result.result_rows]
            schema_parts = ["Tables:"]
            for table in tables:
                cols = self._client.query(f"DESCRIBE TABLE {table}")
                col_strs = [f"{r[0]} {r[1]}" for r in cols.result_rows]
                schema_parts.append(f"  - {table} ({', '.join(col_strs)})")
            return "\n".join(schema_parts)

        return "Tables: events (event_id UInt64, user_id UInt64, event_type String, page String, timestamp DateTime), metrics (date Date, metric_name String, value Float64, dimension String)"

    async def execute_query(self, sql: str) -> list[dict[str, Any]]:
        if self._connected and self._client:
            result = self._client.query(sql)
            columns = result.column_names
            return [dict(zip(columns, row)) for row in result.result_rows]

        sql_lower = sql.lower()

        if "event" in sql_lower:
            event_types = ["page_view", "click", "signup", "purchase", "logout"]
            return [
                {"event_type": et, "count": random.randint(1000, 50000)}
                for et in event_types
            ]

        if "metric" in sql_lower:
            base = date(2025, 1, 1)
            return [
                {
                    "date": (base + timedelta(days=i * 7)).isoformat(),
                    "value": round(random.uniform(50, 200), 2),
                }
                for i in range(12)
            ]

        return [
            {"dimension": f"dim_{i}", "value": round(random.uniform(100, 1000), 2)}
            for i in range(6)
        ]
