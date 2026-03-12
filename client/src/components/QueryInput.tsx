"use client";

import React, { useState, useRef, useEffect } from "react";

interface Datasource {
    id: string;
    name: string;
    type: string;
}

interface QueryInputProps {
    onSubmit: (prompt: string) => void;
    isLoading: boolean;
    datasources: Datasource[];
    selectedDatasource: string;
    onDatasourceChange: (id: string) => void;
}

export default function QueryInput({
    onSubmit,
    isLoading,
    datasources,
    selectedDatasource,
    onDatasourceChange,
}: QueryInputProps) {
    const [value, setValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0].transcript)
                    .join("");
                setValue(transcript);
            };

            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !isLoading) {
            onSubmit(value.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div
                className="glass flex items-center gap-3 px-4 py-3 transition-all duration-300"
                style={{
                    borderColor: isListening
                        ? "var(--accent-rose)"
                        : value
                            ? "var(--border-active)"
                            : undefined,
                    boxShadow: isListening
                        ? "0 0 30px rgba(244, 63, 94, 0.15)"
                        : value
                            ? "var(--shadow-glow)"
                            : undefined,
                }}
            >
                {/* Datasource selector */}
                <select
                    value={selectedDatasource}
                    onChange={(e) => onDatasourceChange(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none outline-none"
                    style={{
                        background: "var(--bg-glass)",
                        color: selectedDatasource
                            ? "var(--accent-cyan)"
                            : "var(--text-muted)",
                        border: "1px solid var(--border-glass)",
                        minWidth: "110px",
                    }}
                    id="datasource-selector"
                >
                    <option value="">Mock Data</option>
                    {datasources.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                            {ds.name}
                        </option>
                    ))}
                </select>

                {/* Divider */}
                <div
                    className="w-px h-6"
                    style={{ background: "var(--border-glass)" }}
                />

                {/* Search icon */}
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Ask your database anything..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    style={{
                        color: "var(--text-primary)",
                        fontFamily: "Inter, sans-serif",
                    }}
                    id="query-input"
                />

                {/* Voice button */}
                <button
                    type="button"
                    onClick={toggleVoice}
                    className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer border-none"
                    style={{
                        background: isListening ? "var(--accent-rose)" : "var(--bg-glass)",
                        color: isListening ? "#fff" : "var(--text-secondary)",
                    }}
                    title="Voice input"
                    id="voice-button"
                >
                    {isListening && (
                        <span className="absolute inset-0 rounded-full animate-pulse-ring" />
                    )}
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
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                </button>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={!value.trim() || isLoading}
                    className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer border-none"
                    style={{
                        background:
                            value.trim() && !isLoading
                                ? "var(--gradient-primary)"
                                : "var(--bg-glass)",
                        color: value.trim() && !isLoading ? "#fff" : "var(--text-muted)",
                        opacity: !value.trim() || isLoading ? 0.5 : 1,
                    }}
                    id="submit-button"
                >
                    {isLoading ? (
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="animate-spin-slow"
                        >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                    ) : (
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
                            <path d="m5 12 7-7 7 7" />
                            <path d="M12 19V5" />
                        </svg>
                    )}
                </button>
            </div>

            {isListening && (
                <p
                    className="mt-2 text-sm text-center animate-fade-in-up"
                    style={{ color: "var(--accent-rose)" }}
                >
                    🎙️ Listening... speak your query
                </p>
            )}
        </form>
    );
}
