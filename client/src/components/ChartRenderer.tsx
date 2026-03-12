"use client";

import React from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface ChartSpec {
    type: "bar" | "line" | "pie" | "area";
    x_axis: string;
    y_axis: string;
    title: string;
}

interface ChartRendererProps {
    data: Record<string, unknown>[];
    chart: ChartSpec;
}

const PALETTE = [
    "#7c3aed",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
];

const tooltipStyle = {
    contentStyle: {
        background: "rgba(22, 22, 40, 0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        backdropFilter: "blur(12px)",
        color: "#f0f0f5",
        fontSize: "13px",
        fontFamily: "Inter, sans-serif",
    },
    itemStyle: { color: "#9999b3" },
    labelStyle: { color: "#f0f0f5", fontWeight: 600 },
};

export default function ChartRenderer({ data, chart }: ChartRendererProps) {
    if (!data || data.length === 0) return null;

    const { type, x_axis, y_axis, title } = chart;

    const commonAxisProps = {
        stroke: "rgba(255,255,255,0.1)",
        tick: { fill: "#9999b3", fontSize: 12, fontFamily: "Inter" },
        axisLine: { stroke: "rgba(255,255,255,0.06)" },
    };

    const gridProps = {
        strokeDasharray: "3 3",
        stroke: "rgba(255,255,255,0.04)",
    };

    return (
        <div className="animate-fade-in-up" id="chart-container">
            {title && (
                <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "var(--text-primary)" }}
                >
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={380}>
                {type === "bar" ? (
                    <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey={x_axis} {...commonAxisProps} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ color: "#9999b3", fontSize: 13 }} />
                        <Bar
                            dataKey={y_axis}
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={56}
                        />
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                ) : type === "line" ? (
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey={x_axis} {...commonAxisProps} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ color: "#9999b3", fontSize: 13 }} />
                        <Line
                            type="monotone"
                            dataKey={y_axis}
                            stroke="#7c3aed"
                            strokeWidth={3}
                            dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5 }}
                            activeDot={{
                                r: 7,
                                fill: "#06b6d4",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                        />
                    </LineChart>
                ) : type === "pie" ? (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={y_axis}
                            nameKey={x_axis}
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            innerRadius={70}
                            paddingAngle={3}
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth={2}
                            label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={PALETTE[index % PALETTE.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ color: "#9999b3", fontSize: 13 }} />
                    </PieChart>
                ) : type === "area" ? (
                    <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey={x_axis} {...commonAxisProps} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ color: "#9999b3", fontSize: 13 }} />
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey={y_axis}
                            stroke="#7c3aed"
                            strokeWidth={2.5}
                            fill="url(#areaGradient)"
                            dot={{ fill: "#7c3aed", r: 4 }}
                            activeDot={{ r: 6, fill: "#06b6d4" }}
                        />
                    </AreaChart>
                ) : null}
            </ResponsiveContainer>
        </div>
    );
}
