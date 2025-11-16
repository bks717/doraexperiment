import * as React from 'react';
import { ChartData } from '../types';

interface KnowledgeChartProps {
    chartData: ChartData;
}

const KnowledgeChart: React.FC<KnowledgeChartProps> = ({ chartData }) => {
    const { title, data, yAxisLabel } = chartData;

    // Chart dimensions and constants
    const svgWidth = 350;
    const svgHeight = 240; // Increased height for more label space
    const margin = { top: 20, right: 10, bottom: 70, left: 60 }; // Increased bottom and left margins
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    const barPadding = 0.2;

    if (!data || data.length === 0) {
        return null;
    }

    // Find data range
    const values = data.map(d => d.value);
    const yMax = Math.max(...values);
    const yMin = Math.min(...values) > 0 ? 0 : Math.min(...values);

    // Scaling functions
    const yScale = (value: number) => height - ((value - yMin) / (yMax - yMin)) * height;
    const barWidth = width / data.length;

    // Generate Y-axis ticks
    const tickCount = 5;
    const tickValues = Array.from({ length: tickCount + 1 }, (_, i) => {
        const value = yMin + (i / tickCount) * (yMax - yMin);
        return parseFloat(value.toPrecision(2));
    });

    const formatTick = (value: number) => {
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value;
    };

    return (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 w-80 md:w-[350px] flex flex-col pointer-events-auto max-h-[80vh] bg-gray-900/50 backdrop-blur-md rounded-lg border border-cyan-400/20 shadow-lg chart-container">
             <header className="px-4 py-2 border-b border-cyan-400/10">
                 <h3 className="text-lg font-semibold text-gray-200 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                    {title}
                </h3>
            </header>
            <div className="p-4">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto" aria-labelledby="chart-title">
                    <title id="chart-title">{title}</title>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {/* Y-axis */}
                        <g className="axis y-axis">
                            <line x1="0" y1="0" x2="0" y2={height} stroke="rgba(0, 255, 255, 0.2)" />
                             {yAxisLabel && (
                                <text transform={`rotate(-90)`} y={-margin.left + 20} x={-height / 2} textAnchor="middle" fill="rgba(0, 255, 255, 0.5)" fontSize="10" fontFamily="monospace">
                                    {yAxisLabel}
                                </text>
                            )}
                            {tickValues.map((tick, i) => (
                                <g key={i} transform={`translate(0, ${yScale(tick)})`}>
                                    <line x1="-5" y1="0" x2={width} y2="0" stroke="rgba(0, 255, 255, 0.1)" strokeDasharray="2,2"/>
                                    <text x="-10" y="4" textAnchor="end" fill="rgba(0, 255, 255, 0.5)" fontSize="10" fontFamily="monospace">
                                        {formatTick(tick)}
                                    </text>
                                </g>
                            ))}
                        </g>

                        {/* Bars and X-axis labels */}
                        {data.map((d, i) => {
                            const x = i * barWidth;
                            const y = yScale(d.value);
                            const barHeight = height - y;
                            return (
                                <g key={i}>
                                    <defs>
                                        <linearGradient id={`barGradient-${i}`} x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.8)" />
                                            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.8)" />
                                        </linearGradient>
                                    </defs>
                                    <rect
                                        className="bar"
                                        x={x + (barWidth * barPadding) / 2}
                                        y={y}
                                        width={barWidth * (1 - barPadding)}
                                        height={barHeight}
                                        fill={`url(#barGradient-${i})`}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    />
                                     <text 
                                        transform={`translate(${x + barWidth / 2}, ${height + 15}) rotate(-45)`}
                                        textAnchor="end" 
                                        fill="rgba(255, 255, 255, 0.7)" 
                                        fontSize="10"
                                        fontFamily="monospace"
                                    >
                                        {d.label}
                                    </text>
                                </g>
                            )
                        })}
                    </g>
                </svg>
            </div>
            <style>{`
                @keyframes slide-in-left {
                  0% {
                    transform: translate(-50px, -50%);
                    opacity: 0;
                  }
                  100% {
                    transform: translate(0, -50%);
                    opacity: 1;
                  }
                }
                .chart-container {
                     animation: slide-in-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                }

                @keyframes grow {
                    from {
                        transform: scaleY(0);
                    }
                    to {
                        transform: scaleY(1);
                    }
                }
                .bar {
                    transform-origin: bottom;
                    animation: grow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
            `}</style>
        </div>
    );
};

export default KnowledgeChart;