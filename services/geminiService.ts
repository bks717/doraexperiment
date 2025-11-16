import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates, Route, ThoughtStep, Area, RouteAnalysisResult, KnowledgeResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const locationSchema = {
  type: Type.OBJECT,
  properties: {
    latitude: {
      type: Type.NUMBER,
      description: 'The latitude of the location, ranging from -90 to 90.',
    },
    longitude: {
      type: Type.NUMBER,
      description: 'The longitude of the location, ranging from -180 to 180.',
    },
  },
  required: ['latitude', 'longitude'],
};

export const getCoordinatesForPlace = async (placeName: string): Promise<Coordinates> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the geographic coordinates (latitude and longitude) for the following place: "${placeName}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: locationSchema,
      },
    });

    const jsonString = response.text;
    const parsedJson = JSON.parse(jsonString);
    
    if (typeof parsedJson.latitude !== 'number' || typeof parsedJson.longitude !== 'number') {
        throw new Error('Invalid coordinates received from API');
    }
    
    return parsedJson as Coordinates;
  } catch (error) {
    console.error(`Error fetching coordinates for ${placeName}:`, error);
    throw new Error(`Could not find coordinates for "${placeName}". Please try a different name.`);
  }
};

const areaSchema = {
    type: Type.OBJECT,
    properties: {
        area: {
            type: Type.ARRAY,
            description: 'An array of coordinate points that make up the boundary polygon.',
            items: locationSchema,
        },
    },
    required: ['area'],
};

export const getAreaForPlace = async (placeName: string): Promise<Area> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate an approximate boundary polygon for the following place: "${placeName}". The response must be a JSON object with a single key 'area', which is an array of numerous coordinate objects. Each object must have 'latitude' and 'longitude' properties. If the place is a point (like a specific address), you can return a small box-shaped polygon around it.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: areaSchema,
            },
        });

        const jsonString = response.text;
        const parsedJson = JSON.parse(jsonString);

        if (!Array.isArray(parsedJson.area) || parsedJson.area.length < 3) {
            throw new Error('Invalid area data received from API');
        }

        return parsedJson.area as Area;
    } catch (error) {
        console.error(`Error fetching area for ${placeName}:`, error);
        throw new Error(`Could not find an area for "${placeName}".`);
    }
};


type ProgressCallback = (step: Partial<ThoughtStep>) => void;

const chartDataSchema = {
    type: Type.OBJECT,
    description: "Data for a chart, if relevant. Omit if the query is not about quantifiable data (e.g., historical population, economic stats).",
    properties: {
        title: { type: Type.STRING, description: "A title for the chart." },
        type: { type: Type.STRING, description: "Type of chart. Only 'bar' is currently supported." },
        data: {
            type: Type.ARRAY,
            description: "Data points for the chart.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: "The label for the data point (e.g., a year)." },
                    value: { type: Type.NUMBER, description: "The numerical value." }
                },
                required: ["label", "value"]
            }
        },
        xAxisLabel: { type: Type.STRING, description: "Optional label for the X-axis." },
        yAxisLabel: { type: Type.STRING, description: "Optional label for the Y-axis." }
    },
    required: ["title", "type", "data"]
};

const knowledgeSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING, description: "The name of the primary geographical location identified in the query." },
        area: {
            type: Type.ARRAY,
            description: "An array of coordinate points that make up the boundary polygon for the identified location.",
            items: locationSchema
        },
        answer: { type: Type.STRING, description: "A concise, direct answer to the user's question about the location." },
        source: { type: Type.STRING, description: "The primary source URL or name (e.g., 'Wikipedia', 'World Bank Data') from which the answer was derived. Be as specific as possible." },
        reasoning: {
            type: Type.ARRAY,
            description: "A step-by-step breakdown of how the answer was derived.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A short title for the reasoning step (e.g., 'Identifying Location')." },
                    details: { type: Type.STRING, description: "A brief description of what was done in this step (e.g., 'Identified Bangalore, India')." }
                },
                required: ["title", "details"]
            }
        },
        chartData: chartDataSchema
    },
    required: ["locationName", "area", "answer", "reasoning", "source"]
};

export const getKnowledgeForPlace = async (query: string, onProgress: ProgressCallback): Promise<KnowledgeResult> => {
    const runningStepId = 'analyze_query';
    try {
        onProgress({ id: runningStepId, status: 'running' });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a geographical knowledge expert AI. A user has asked: "${query}".
            Your task is to provide a complete analysis in a single JSON response.
            1.  **Identify Location**: Determine the primary geographical location in the query.
            2.  **Generate Boundary**: Create an approximate boundary polygon (an array of latitude/longitude points) for this location.
            3.  **Answer Question**: Formulate a concise, direct answer to the user's specific question about that location.
            4.  **Cite Source**: Provide the single, most authoritative source URL or name (e.g., Wikipedia, World Bank Data) for the answer.
            5.  **Provide Reasoning**: Detail your process in a series of 3-5 reasoning steps. Each step should have a title and details. For example: "Identifying Region -> Located in Karnataka, India", "Geocoding -> Found coordinates...", "Data Retrieval -> Fetched population data from trusted sources.".
            6.  **Generate Chart Data (Optional)**: If the user's query involves quantifiable data (e.g., population growth, economic data, climate statistics), provide data for a simple 'bar' chart. The chart should have a title, and data points with string labels and numerical values. If a chart is not relevant to the query (e.g., "what is the capital of France?"), omit the 'chartData' field entirely from the JSON response.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: knowledgeSchema,
            },
        });

        const jsonString = response.text;
        const parsedJson = JSON.parse(jsonString);

        if (!parsedJson.locationName || !parsedJson.area || !parsedJson.answer || !parsedJson.reasoning || !parsedJson.source) {
            throw new Error('Invalid knowledge data received from API');
        }

        onProgress({ id: runningStepId, status: 'success', details: `Analysis complete for ${parsedJson.locationName}.` });
        return parsedJson as KnowledgeResult;

    } catch (error: any) {
        console.error(`Error fetching knowledge for "${query}":`, error);
        onProgress({ id: runningStepId, status: 'error', details: error.message });
        throw new Error(`Could not process the request for "${query}".`);
    }
};

export const getKnowledgeForArea = async (area: Area, query: string, onProgress: ProgressCallback): Promise<KnowledgeResult> => {
    const runningStepId = 'analyze_query';
    try {
        onProgress({ id: runningStepId, status: 'running' });

        const areaString = JSON.stringify(area.map(c => ({lat: c.latitude, lon: c.longitude})));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a geographical knowledge expert AI. A user has defined a specific area on the map with the following boundary polygon (an array of latitude/longitude points): ${areaString}.
            The user has asked the following question about this specific, custom-defined area: "${query}".
            Your task is to provide a complete analysis in a single JSON response.
            1.  **Identify Location Name**: Give a descriptive name for the custom area, e.g., "Area in Downtown San Francisco". This is the 'locationName'.
            2.  **Use Boundary**: The boundary polygon for the 'area' field in your response should be the exact one provided by the user. Do not change it.
            3.  **Answer Question**: Formulate a concise, direct answer to the user's specific question strictly within the provided polygon boundaries.
            4.  **Cite Source**: Provide the single, most authoritative source URL or name (e.g., OpenStreetMap, Wikipedia) for the answer.
            5.  **Provide Reasoning**: Detail your process in a series of reasoning steps.
            6.  **Generate Chart Data (Optional)**: If the query involves quantifiable data within the area, provide data for a 'bar' chart. If not relevant, omit the 'chartData' field.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: knowledgeSchema,
            },
        });

        const jsonString = response.text;
        const parsedJson = JSON.parse(jsonString);

        if (!parsedJson.locationName || !parsedJson.area || !parsedJson.answer || !parsedJson.reasoning || !parsedJson.source) {
            throw new Error('Invalid knowledge data received from API');
        }

        onProgress({ id: runningStepId, status: 'success', details: `Analysis complete for ${parsedJson.locationName}.` });
        return parsedJson as KnowledgeResult;

    } catch (error: any) {
        console.error(`Error fetching knowledge for area query "${query}":`, error);
        onProgress({ id: runningStepId, status: 'error', details: error.message });
        throw new Error(`Could not process the request for the drawn area.`);
    }
};


const routeAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        routes: {
            type: Type.ARRAY,
            description: "An array of 2-3 distinct driving route options.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "A descriptive name for the route, e.g., 'Via I-5 N'." },
                    distance: { type: Type.STRING, description: "Total distance in kilometers, e.g., '52 km'." },
                    time: { type: Type.STRING, description: "Estimated travel time, e.g., '45 min'." },
                    traffic: { type: Type.STRING, description: "Current traffic conditions, e.g., 'Light', 'Moderate', 'Heavy'." },
                    path: {
                        type: Type.ARRAY,
                        description: "A detailed array of coordinate points for the route path.",
                        items: locationSchema
                    }
                },
                required: ["name", "distance", "time", "traffic", "path"]
            }
        },
        recommendation: {
            type: Type.OBJECT,
            description: "The AI's recommendation for the best route.",
            properties: {
                bestRouteIndex: { type: Type.INTEGER, description: "The 0-based index of the recommended route in the 'routes' array." },
                reason: { type: Type.STRING, description: "A brief explanation for why this route is recommended." }
            },
            required: ["bestRouteIndex", "reason"]
        }
    },
    required: ["routes", "recommendation"]
};


export const getRouteForPlaces = async (from: string, to: string, onProgress: ProgressCallback): Promise<RouteAnalysisResult> => {
    let runningStepId = '';
    try {
        // Step 1: Geocode the 'from' location
        runningStepId = 'from_coords';
        onProgress({ id: runningStepId, status: 'running' });
        const fromCoords = await getCoordinatesForPlace(from);
        onProgress({ id: runningStepId, status: 'success', details: `Found: ${fromCoords.latitude.toFixed(2)}, ${fromCoords.longitude.toFixed(2)}` });

        // Step 2: Geocode the 'to' location
        runningStepId = 'to_coords';
        onProgress({ id: runningStepId, status: 'running' });
        const toCoords = await getCoordinatesForPlace(to);
        onProgress({ id: runningStepId, status: 'success', details: `Found: ${toCoords.latitude.toFixed(2)}, ${toCoords.longitude.toFixed(2)}` });

        // Step 3: Generate and analyze routes
        runningStepId = 'generate_route';
        onProgress({ id: runningStepId, status: 'running' });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As an expert route planning AI, analyze and generate 2-3 distinct driving routes from [${fromCoords.latitude}, ${fromCoords.longitude}] to [${toCoords.latitude}, ${toCoords.longitude}]. For each route, provide a name, distance in kilometers, estimated time, current traffic, and a detailed coordinate path. Finally, recommend the best route with a reason.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: routeAnalysisSchema,
            },
        });
        
        const jsonString = response.text;
        const parsedJson = JSON.parse(jsonString);

        if (!parsedJson.routes || !parsedJson.recommendation || parsedJson.routes.length === 0) {
            throw new Error('Invalid route analysis data received from API');
        }
        
        onProgress({ id: runningStepId, status: 'success', details: `Analyzed ${parsedJson.routes.length} potential routes.` });
        return parsedJson as RouteAnalysisResult;

    } catch (error: any) {
        console.error(`Error fetching route from ${from} to ${to}:`, error);
        onProgress({ id: runningStepId, status: 'error', details: error.message });
        throw new Error(`Could not generate a route from "${from}" to "${to}".`);
    }
}