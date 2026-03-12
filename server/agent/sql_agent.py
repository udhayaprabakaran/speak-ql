"""
SpeakQL — AI Agent for Text-to-SQL
====================================
Takes a natural-language prompt + live database schema context,
and produces:
  1. A syntactically correct SQL query for the target datasource.
  2. A chart specification that best fits the expected result shape.

Uses LangChain + Google Gemini when a GOOGLE_API_KEY is available;
falls back to a deterministic mock path so the app runs without keys.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

# ---------------------------------------------------------------------------
# Mock fallback (no API key required)
# ---------------------------------------------------------------------------

FALLBACK_SCHEMA: dict[str, str] = {
    "postgres": "Tables: sales (id, product, category, amount, quantity, region, sale_date), customers (id, name, email, region, created_at), products (id, name, category, price, stock)",
    "clickhouse": "Tables: events (event_id, user_id, event_type, page, timestamp), metrics (date, metric_name, value, dimension)",
}

MOCK_RESPONSES: dict[str, dict[str, Any]] = {
    "default": {
        "sql": "SELECT category, SUM(amount) AS total_sales, COUNT(*) AS num_orders FROM sales GROUP BY category ORDER BY total_sales DESC;",
        "chart": {
            "type": "bar",
            "x_axis": "category",
            "y_axis": "total_sales",
            "title": "Total Sales by Category",
        },
    },
    "time": {
        "sql": "SELECT DATE_TRUNC('month', sale_date) AS month, SUM(amount) AS revenue FROM sales GROUP BY month ORDER BY month;",
        "chart": {
            "type": "line",
            "x_axis": "month",
            "y_axis": "revenue",
            "title": "Monthly Revenue Trend",
        },
    },
    "distribution": {
        "sql": "SELECT region, COUNT(*) AS customer_count FROM customers GROUP BY region;",
        "chart": {
            "type": "pie",
            "x_axis": "region",
            "y_axis": "customer_count",
            "title": "Customers by Region",
        },
    },
    "comparison": {
        "sql": "SELECT product, SUM(quantity) AS units_sold, SUM(amount) AS revenue FROM sales GROUP BY product ORDER BY revenue DESC LIMIT 10;",
        "chart": {
            "type": "area",
            "x_axis": "product",
            "y_axis": "revenue",
            "title": "Top 10 Products by Revenue",
        },
    },
}


def _classify_intent(prompt: str) -> str:
    """Simple keyword-based intent classifier for mock fallback."""
    lower = prompt.lower()
    if any(w in lower for w in ("trend", "time", "month", "year", "daily", "weekly", "growth", "over time")):
        return "time"
    if any(w in lower for w in ("distribution", "breakdown", "split", "proportion", "share", "pie")):
        return "distribution"
    if any(w in lower for w in ("compare", "comparison", "versus", "vs", "top")):
        return "comparison"
    return "default"


async def _mock_process(prompt: str) -> dict[str, Any]:
    """Return a canned response based on keyword intent matching."""
    intent = _classify_intent(prompt)
    return MOCK_RESPONSES[intent]


# ---------------------------------------------------------------------------
# LLM-powered path (requires GOOGLE_API_KEY)
# ---------------------------------------------------------------------------


async def _llm_process(prompt: str, datasource: str, schema: str) -> dict[str, Any]:
    """Use LangChain + Google Gemini to generate SQL and chart spec."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain.prompts import ChatPromptTemplate

    system_template = """You are SpeakQL, an expert data analyst AI.
Given a database schema and a user's natural-language question, you must return:
1. A syntactically correct SQL query for {datasource}.
2. A chart specification to visualise the results.

DATABASE SCHEMA:
{schema}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{{
  "sql": "<SQL query>",
  "chart": {{
    "type": "<bar|line|pie|area>",
    "x_axis": "<column name for X axis>",
    "y_axis": "<column name for Y axis>",
    "title": "<descriptive chart title>"
  }}
}}"""

    human_template = "{prompt}"

    chat_prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("human", human_template),
    ])

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )

    chain = chat_prompt | llm

    response = await chain.ainvoke({
        "datasource": datasource,
        "schema": schema,
        "prompt": prompt,
    })

    # Parse the JSON from the LLM response
    content = response.content.strip()
    # Strip markdown code fences if present
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)
    return json.loads(content)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def process_query(
    prompt: str,
    datasource: str = "postgres",
    schema: str | None = None,
) -> dict[str, Any]:
    """
    Main entry point for the AI agent.

    Args:
        prompt: Natural-language user question.
        datasource: Target DB type (postgres, clickhouse).
        schema: Live database schema string from MCP server.
                 Falls back to a built-in stub if not provided.

    Returns:
        { "sql": str, "chart": {"type", "x_axis", "y_axis", "title"} }
    """
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if api_key and not api_key.startswith("your-"):
        resolved_schema = schema or FALLBACK_SCHEMA.get(datasource, FALLBACK_SCHEMA["postgres"])
        return await _llm_process(prompt, datasource, resolved_schema)
    return await _mock_process(prompt)
