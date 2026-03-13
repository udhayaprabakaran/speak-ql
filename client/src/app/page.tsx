"use client";

import React, { useState, useEffect, useCallback } from "react";
import QueryInput from "@/components/QueryInput";
import ResultsPanel from "@/components/ResultsPanel";
import DatasourceSettings from "@/components/DatasourceSettings";

interface ChartSpec {
    type: "bar" | "line" | "pie" | "area";
    x_axis: string;
    y_axis: string;
    title: string;
}

interface QueryResult {
    sql: string;
    data: Record<string, unknown>[];
    chart: ChartSpec;
    summary: string;
}

interface Datasource {
    id: string;
    name: string;
    type: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EXAMPLE_QUERIES = [
    "Show me total sales by category",
    "What's the monthly revenue trend?",
    "Show customer distribution by region",
    "Compare top products by revenue",
];

export default function Home() {
    const [result, setResult] = useState<QueryResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastQuery, setLastQuery] = useState<string>("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [datasources, setDatasources] = useState<Datasource[]>([]);
    const [selectedDatasource, setSelectedDatasource] = useState("");

    const fetchDatasources = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/datasources`);
            if (res.ok) setDatasources(await res.json());
        } catch {
            /* server may not be running */
        }
    }, []);

    useEffect(() => {
        fetchDatasources();
    }, [fetchDatasources]);

    // Refresh datasources when settings panel closes
    useEffect(() => {
        if (!settingsOpen) fetchDatasources();
    }, [settingsOpen, fetchDatasources]);

    const handleQuery = async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        setLastQuery(prompt);

        try {
            const res = await fetch(`${API_URL}/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    datasource_id: selectedDatasource,
                }),
            });

            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ detail: "Request failed" }));
                throw new Error(err.detail || `HTTP ${res.status}`);
            }

            const data: QueryResult = await res.json();
            setResult(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to connect to backend. Is the server running?"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main
            className="relative flex flex-col items-center min-h-screen px-6 py-12"
            style={{ background: "var(--bg-primary)" }}
        >
            {/* Ambient glow */}
            <div className="ambient-glow" />

            {/* Header */}
            <div className="relative z-10 text-center mb-10 animate-fade-in-up">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "var(--gradient-primary)" }}
                    >
                        🎙️
                    </div>
                    <h1
                        className="text-4xl font-bold tracking-tight"
                        style={{
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        SpeakQL
                    </h1>

                    {/* Settings gear */}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none transition-all duration-200 hover:scale-110"
                        style={{
                            background: "var(--bg-glass)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-glass)",
                        }}
                        title="Configure datasources"
                        id="settings-button"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>
                </div>
                <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                    Talk to your database. See the results.
                </p>
            </div>

            {/* Query input */}
            <div
                className="relative z-10 w-full animate-fade-in-up"
                style={{ maxWidth: "720px", animationDelay: "0.1s" }}
            >
                <QueryInput
                    onSubmit={handleQuery}
                    isLoading={isLoading}
                    datasources={datasources}
                    selectedDatasource={selectedDatasource}
                    onDatasourceChange={setSelectedDatasource}
                />
            </div>

            {/* Example queries — shown when there's no result */}
            {!result && !isLoading && !error && (
                <div
                    className="relative z-10 mt-8 flex flex-wrap justify-center gap-2 animate-fade-in-up"
                    style={{ maxWidth: "720px", animationDelay: "0.2s" }}
                >
                    <p
                        className="w-full text-center text-xs mb-2"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Try an example
                    </p>
                    {EXAMPLE_QUERIES.map((q) => (
                        <button
                            key={q}
                            onClick={() => handleQuery(q)}
                            className="glass-sm px-4 py-2 text-sm transition-all duration-200 cursor-pointer hover:scale-105"
                            style={{
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-glass)",
                            }}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div
                    className="relative z-10 mt-12 text-center animate-fade-in-up"
                    style={{ maxWidth: "720px" }}
                >
                    <div className="glass p-8 flex flex-col items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-full animate-spin-slow"
                            style={{
                                border: "3px solid var(--border-glass)",
                                borderTopColor: "var(--accent-violet)",
                            }}
                        />
                        <p style={{ color: "var(--text-secondary)" }}>
                            Analyzing &ldquo;{lastQuery}&rdquo;...
                        </p>
                        <div
                            className="w-full h-1 rounded-full overflow-hidden"
                            style={{ background: "var(--bg-glass)" }}
                        >
                            <div
                                className="h-full rounded-full animate-shimmer"
                                style={{
                                    width: "60%",
                                    background: "var(--gradient-primary)",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div
                    className="relative z-10 mt-8 w-full animate-fade-in-up"
                    style={{ maxWidth: "720px" }}
                >
                    <div
                        className="glass p-6 text-center"
                        style={{ borderColor: "rgba(244, 63, 94, 0.3)" }}
                    >
                        <p
                            className="text-lg mb-2"
                            style={{ color: "var(--accent-rose)" }}
                        >
                            ⚠️ Something went wrong
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && !isLoading && (
                <div
                    className="relative z-10 mt-8 w-full animate-fade-in-up"
                    style={{ maxWidth: "920px" }}
                >
                    <ResultsPanel result={result} />
                </div>
            )}

            {/* Footer */}
            <footer
                className="relative z-10 mt-auto pt-12 pb-4 text-xs"
                style={{ color: "var(--text-muted)" }}
            >
                Built with FastAPI · LangChain · Gemini · Next.js · Recharts
            </footer>

            {/* Settings panel */}
            <DatasourceSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                apiUrl={API_URL}
            />
        </main>
    );
}
