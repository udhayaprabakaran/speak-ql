"""
SpeakQL — MCP Server for PostgreSQL
=====================================
Model Context Protocol server that handles direct connections and secure
query execution against a PostgreSQL database.

Falls back to realistic mock data when no database is configured.
"""

from __future__ import annotations

import os
import random
from datetime import date, timedelta
from typing import Any


class PostgresMCPServer:
    """MCP-style server for PostgreSQL connections."""

    def __init__(self, dsn: str | None = None):
        self._pool = None
        self._conn = None
        self._dsn = dsn or os.getenv("POSTGRES_DSN", "")
        self._connected = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self):
        """Establish a connection to Postgres."""
        if self._dsn and "user:password" not in self._dsn:
            try:
                import asyncpg
                self._conn = await asyncpg.connect(self._dsn)
                self._connected = True
                print(f"[MCP/Postgres] Connected to {self._dsn.split('@')[-1]}")
            except Exception as e:
                print(f"[MCP/Postgres] Connection failed, using mock data: {e}")
                self._connected = False
        else:
            print("[MCP/Postgres] No DSN configured, using mock data")
            self._connected = False

    async def disconnect(self):
        """Close the connection."""
        if self._conn:
            await self._conn.close()
            print("[MCP/Postgres] Disconnected")

    # ------------------------------------------------------------------
    # Tools (MCP interface)
    # ------------------------------------------------------------------

    async def get_schema(self) -> str:
        """Return the database schema as a formatted string."""
        if self._connected and self._conn:
            rows = await self._conn.fetch(
                """
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
                """
            )
            schema_lines: list[str] = ["Tables:"]
            current_table = ""
            cols: list[str] = []
            for row in rows:
                if row["table_name"] != current_table:
                    if current_table and cols:
                        schema_lines.append(f"  - {current_table} ({', '.join(cols)})")
                    current_table = row["table_name"]
                    cols = []
                cols.append(f"{row['column_name']} {row['data_type']}")
            if current_table and cols:
                schema_lines.append(f"  - {current_table} ({', '.join(cols)})")
            return "\n".join(schema_lines)

        return "Tables: sales (id, product, category, amount, quantity, region, sale_date), customers (id, name, email, region, created_at), products (id, name, category, price, stock)"

    async def execute_query(self, sql: str) -> list[dict[str, Any]]:
        """Execute a SQL query and return rows as list of dicts."""
        if self._connected and self._conn:
            rows = await self._conn.fetch(sql)
            # Convert asyncpg Records to plain dicts with JSON-safe values
            result = []
            for row in rows:
                d = {}
                for key, val in dict(row).items():
                    if isinstance(val, (date,)):
                        d[key] = val.isoformat()
                    else:
                        d[key] = val
                result.append(d)
            return result

        # --- Mock data generation ---
        return self._generate_mock_data(sql)

    # ------------------------------------------------------------------
    # Mock data
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_mock_data(sql: str) -> list[dict[str, Any]]:
        """Generate realistic mock data based on the SQL query shape."""
        sql_lower = sql.lower()

        categories = ["Electronics", "Clothing", "Food & Beverage", "Home & Garden", "Sports", "Books", "Automotive"]
        regions = ["North", "South", "East", "West", "Central"]
        products = ["Laptop", "Headphones", "Camera", "Tablet", "Monitor", "Keyboard", "Mouse", "Speaker", "Watch", "Phone"]

        if "month" in sql_lower or "date_trunc" in sql_lower or "sale_date" in sql_lower:
            base = date(2025, 1, 1)
            return [
                {
                    "month": (base + timedelta(days=30 * i)).strftime("%Y-%m"),
                    "revenue": round(random.uniform(15000, 85000), 2),
                }
                for i in range(12)
            ]

        if "region" in sql_lower:
            return [
                {"region": r, "customer_count": random.randint(120, 900)}
                for r in regions
            ]

        if "product" in sql_lower:
            return [
                {
                    "product": p,
                    "units_sold": random.randint(50, 500),
                    "revenue": round(random.uniform(5000, 60000), 2),
                }
                for p in products[:7]
            ]

        return [
            {
                "category": c,
                "total_sales": round(random.uniform(10000, 90000), 2),
                "num_orders": random.randint(100, 1500),
            }
            for c in categories
        ]
