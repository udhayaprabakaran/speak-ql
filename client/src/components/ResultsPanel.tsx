"use client";

import React, { useState } from "react";
import ChartRenderer from "./ChartRenderer";

interface ChartSpec {
    type: "bar" | "line" | "pie" | "area";
    x_axis: string;
    y_axis: string;
    title: string;
}

interface ResultData {
    sql: string;
    data: Record<string, unknown>[];
    chart: ChartSpec;
    summary: string;
}

interface ResultsPanelProps {
    result: ResultData;
}

type TabId = "summary" | "chart" | "sql" | "data";

export default function ResultsPanel({ result }: ResultsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabId>("summary");

    const tabs: { id: TabId; label: string; icon: string }[] = [
        { id: "summary", label: "Summary", icon: "💡" },
        { id: "chart", label: "Chart", icon: "📊" },
        { id: "sql", label: "SQL", icon: "🗂️" },
        { id: "data", label: "Data", icon: "📋" },
    ];

    const columns = result.data.length > 0 ? Object.keys(result.data[0]) : [];

    return (
        <div className="glass animate-fade-in-up" style={{ padding: "28px" }} id="results-panel">
            {/* Tab bar */}
            <div
                className="flex gap-1 p-1 mb-6 rounded-full w-fit"
                style={{ background: "var(--bg-glass)" }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border-none"
                        style={{
                            background:
                                activeTab === tab.id
                                    ? "var(--gradient-primary)"
                                    : "transparent",
                            color:
                                activeTab === tab.id
                                    ? "#fff"
                                    : "var(--text-secondary)",
                        }}
                        id={`tab-${tab.id}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Summary tab */}
            {activeTab === "summary" && (
                <div className="animate-fade-in-up" id="summary-content">
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{
                            background: "rgba(0, 0, 0, 0.2)",
                            border: "1px solid var(--border-glass)",
                        }}
                    >
                        <div
                            style={{
                                height: "3px",
                                background: "var(--gradient-primary)",
                            }}
                        />
                        <div className="p-6">
                            <p
                                className="text-xs font-medium uppercase tracking-wider mb-4"
                                style={{ color: "var(--text-muted)" }}
                            >
                                AI Insights
                            </p>
                            <ul
                                className="flex flex-col gap-3"
                                style={{ listStyle: "none", padding: 0, margin: 0 }}
                            >
                                {result.summary
                                    .split("\n")
                                    .map((line) => line.replace(/^[\u2022\-\*]\s*/, "").trim())
                                    .filter(Boolean)
                                    .map((point, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 text-sm leading-relaxed"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            <span
                                                className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full"
                                                style={{
                                                    background: "var(--gradient-primary)",
                                                }}
                                            />
                                            {point}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart tab */}
            {activeTab === "chart" && (
                <ChartRenderer data={result.data} chart={result.chart} />
            )}

            {/* SQL tab */}
            {activeTab === "sql" && (
                <div className="animate-fade-in-up">
                    <div className="flex items-center justify-between mb-3">
                        <span
                            className="text-xs font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Generated SQL
                        </span>
                        <button
                            onClick={() => navigator.clipboard.writeText(result.sql)}
                            className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none"
                            style={{
                                background: "var(--bg-glass)",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-glass)",
                            }}
                            id="copy-sql-button"
                        >
                            📋 Copy
                        </button>
                    </div>
                    <pre
                        className="p-5 rounded-xl overflow-x-auto text-sm leading-relaxed"
                        style={{
                            background: "rgba(0, 0, 0, 0.35)",
                            color: "var(--accent-cyan)",
                            fontFamily: "'JetBrains Mono', monospace",
                            border: "1px solid rgba(255,255,255,0.04)",
                        }}
                    >
                        <code>{result.sql}</code>
                    </pre>
                </div>
            )}

            {/* Data tab */}
            {activeTab === "data" && (
                <div className="animate-fade-in-up overflow-x-auto">
                    <p
                        className="text-xs mb-3"
                        style={{ color: "var(--text-muted)" }}
                    >
                        {result.data.length} rows returned
                    </p>
                    <table
                        className="w-full text-sm"
                        style={{
                            borderCollapse: "separate",
                            borderSpacing: 0,
                        }}
                    >
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                                        style={{
                                            color: "var(--text-muted)",
                                            borderBottom: "1px solid var(--border-glass)",
                                            background: "rgba(0, 0, 0, 0.2)",
                                        }}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map((row, i) => (
                                <tr
                                    key={i}
                                    style={{
                                        background:
                                            i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                                    }}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col}
                                            className="px-4 py-3"
                                            style={{
                                                color: "var(--text-secondary)",
                                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                                                fontFamily:
                                                    typeof row[col] === "number"
                                                        ? "'JetBrains Mono', monospace"
                                                        : "Inter, sans-serif",
                                            }}
                                        >
                                            {typeof row[col] === "number"
                                                ? (row[col] as number).toLocaleString()
                                                : String(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
