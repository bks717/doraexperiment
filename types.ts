export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type Route = Coordinates[];
export type Area = Coordinates[];

// Represents a single analyzed route option
export interface RouteOption {
    name: string;
    distance: string;
    time: string;
    traffic: string;
    path: Route;
}

// Represents the entire analysis from the AI
export interface RouteAnalysisResult {
    routes: RouteOption[];
    recommendation: {
        bestRouteIndex: number;
        reason: string;
    };
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface ChartData {
    title: string;
    type: 'bar'; // For now, only bar charts
    data: ChartDataPoint[];
    xAxisLabel?: string;
    yAxisLabel?: string;
}

// Represents the result from a knowledge-based query
export interface KnowledgeResult {
    locationName: string;
    area: Area;
    answer: string;
    source?: string;
    reasoning: {
        title: string;
        details: string;
    }[];
    chartData?: ChartData;
}


// Types for Chain of Thought visualization
export type ThoughtStepStatus = 'pending' | 'running' | 'success' | 'error';

export interface ThoughtStep {
  id: string;
  title: string;
  status: ThoughtStepStatus;
  details?: string | null;
}