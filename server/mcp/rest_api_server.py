"""
SpeakQL — MCP Server for External REST APIs
=============================================
Stub MCP server for querying external REST API data sources.
"""

from __future__ import annotations

import random
from typing import Any


class RestAPIMCPServer:
    """MCP-style server for external REST API connections."""

    def __init__(self):
        self._connected = False

    async def connect(self):
        print("[MCP/REST] Initialized (stub)")
        self._connected = False

    async def disconnect(self):
        print("[MCP/REST] Disconnected (stub)")

    async def execute_query(self, endpoint: str) -> list[dict[str, Any]]:
        """
        In a real implementation, this would make an HTTP request to
        the specified endpoint and transform the response.
        """
        # Mock data
        return [
            {"endpoint": endpoint, "status": "mock", "records": random.randint(10, 100)}
        ]
