"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Datasource {
    id: string;
    name: string;
    type: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

interface DatasourceSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    apiUrl: string;
}

const EMPTY_FORM = {
    name: "",
    type: "postgres",
    host: "localhost",
    port: 5432,
    database: "",
    user: "",
    password: "",
};

export default function DatasourceSettings({
    isOpen,
    onClose,
    apiUrl,
}: DatasourceSettingsProps) {
    const [datasources, setDatasources] = useState<Datasource[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchDatasources = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/datasources`);
            if (res.ok) setDatasources(await res.json());
        } catch {
            /* ignore */
        }
    }, [apiUrl]);

    useEffect(() => {
        if (isOpen) fetchDatasources();
    }, [isOpen, fetchDatasources]);

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`${apiUrl}/datasources/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setTestResult(await res.json());
        } catch {
            setTestResult({ success: false, message: "Failed to reach server" });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${apiUrl}/datasources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setForm(EMPTY_FORM);
                setTestResult(null);
                await fetchDatasources();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await fetch(`${apiUrl}/datasources/${id}`, { method: "DELETE" });
        await fetchDatasources();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            />

            {/* Panel */}
            <div
                className="relative w-full h-full overflow-y-auto animate-fade-in-up"
                style={{
                    maxWidth: "480px",
                    background: "var(--bg-secondary)",
                    borderLeft: "1px solid var(--border-glass)",
                }}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2
                            className="text-xl font-bold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            ⚙️ Datasources
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none transition-all duration-200"
                            style={{
                                background: "var(--bg-glass)",
                                color: "var(--text-secondary)",
                            }}
                            id="close-settings"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Existing datasources */}
                    {datasources.length > 0 && (
                        <div className="mb-8">
                            <p
                                className="text-xs font-medium uppercase tracking-wider mb-3"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Configured
                            </p>
                            <div className="flex flex-col gap-2">
                                {datasources.map((ds) => (
                                    <div
                                        key={ds.id}
                                        className="glass-sm flex items-center justify-between px-4 py-3"
                                    >
                                        <div>
                                            <p
                                                className="text-sm font-medium"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                {ds.name}
                                            </p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {ds.type} · {ds.host}:{ds.port}/{ds.database}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(ds.id)}
                                            className="text-xs px-3 py-1 rounded-full cursor-pointer border-none transition-all duration-200"
                                            style={{
                                                background: "rgba(244,63,94,0.1)",
                                                color: "var(--accent-rose)",
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add new */}
                    <div>
                        <p
                            className="text-xs font-medium uppercase tracking-wider mb-4"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Add New Datasource
                        </p>

                        <div className="flex flex-col gap-3">
                            {/* Name */}
                            <input
                                type="text"
                                placeholder="Datasource name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg text-sm bg-transparent border outline-none"
                                style={{
                                    borderColor: "var(--border-glass)",
                                    color: "var(--text-primary)",
                                }}
                                id="ds-name"
                            />

                            {/* Type */}
                            <select
                                value={form.type}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        type: e.target.value,
                                        port: e.target.value === "clickhouse" ? 8123 : 5432,
                                    })
                                }
                                className="w-full px-4 py-2.5 rounded-lg text-sm border outline-none cursor-pointer"
                                style={{
                                    background: "var(--bg-card)",
                                    borderColor: "var(--border-glass)",
                                    color: "var(--text-primary)",
                                }}
                                id="ds-type"
                            >
                                <option value="postgres">PostgreSQL</option>
                                <option value="clickhouse">ClickHouse</option>
                            </select>

                            {/* Host + Port */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Host"
                                    value={form.host}
                                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-transparent border outline-none"
                                    style={{
                                        borderColor: "var(--border-glass)",
                                        color: "var(--text-primary)",
                                    }}
                                    id="ds-host"
                                />
                                <input
                                    type="number"
                                    placeholder="Port"
                                    value={form.port}
                                    onChange={(e) =>
                                        setForm({ ...form, port: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-24 px-4 py-2.5 rounded-lg text-sm bg-transparent border outline-none"
                                    style={{
                                        borderColor: "var(--border-glass)",
                                        color: "var(--text-primary)",
                                    }}
                                    id="ds-port"
                                />
                            </div>

                            {/* Database */}
                            <input
                                type="text"
                                placeholder="Database name"
                                value={form.database}
                                onChange={(e) =>
                                    setForm({ ...form, database: e.target.value })
                                }
                                className="w-full px-4 py-2.5 rounded-lg text-sm bg-transparent border outline-none"
                                style={{
                                    borderColor: "var(--border-glass)",
                                    color: "var(--text-primary)",
                                }}
                                id="ds-database"
                            />

                            {/* User + Password */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={form.user}
                                    onChange={(e) => setForm({ ...form, user: e.target.value })}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-transparent border outline-none"
                                    style={{
                                        borderColor: "var(--border-glass)",
                                        color: "var(--text-primary)",
                                    }}
                                    id="ds-user"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-transparent border outline-none"
                                    style={{
                                        borderColor: "var(--border-glass)",
                                        color: "var(--text-primary)",
                                    }}
                                    id="ds-password"
                                />
                            </div>

                            {/* Test result */}
                            {testResult && (
                                <div
                                    className="glass-sm px-4 py-3 text-sm animate-fade-in-up"
                                    style={{
                                        borderColor: testResult.success
                                            ? "rgba(16,185,129,0.3)"
                                            : "rgba(244,63,94,0.3)",
                                        color: testResult.success
                                            ? "var(--accent-emerald)"
                                            : "var(--accent-rose)",
                                    }}
                                >
                                    {testResult.success ? "✅" : "❌"} {testResult.message}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={handleTest}
                                    disabled={isTesting || !form.host}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none transition-all duration-200"
                                    style={{
                                        background: "var(--bg-glass)",
                                        color: "var(--text-secondary)",
                                        border: "1px solid var(--border-glass)",
                                        opacity: isTesting || !form.host ? 0.5 : 1,
                                    }}
                                    id="test-connection"
                                >
                                    {isTesting ? "Testing..." : "🔌 Test Connection"}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !form.name.trim()}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none transition-all duration-200"
                                    style={{
                                        background:
                                            form.name.trim() && !isSaving
                                                ? "var(--gradient-primary)"
                                                : "var(--bg-glass)",
                                        color:
                                            form.name.trim() && !isSaving
                                                ? "#fff"
                                                : "var(--text-muted)",
                                        opacity: isSaving || !form.name.trim() ? 0.5 : 1,
                                    }}
                                    id="save-datasource"
                                >
                                    {isSaving ? "Saving..." : "💾 Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
