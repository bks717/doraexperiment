import * as React from 'react';
import SearchInput from './components/SearchInput';
import DirectionsInput from './components/DirectionsInput';
import GlobeComponent from './components/GlobeComponent';
import ChainOfThought from './components/ChainOfThought';
import KnowledgeChart from './components/KnowledgeChart';
import { getCoordinatesForPlace, getRouteForPlaces, getAreaForPlace, getKnowledgeForPlace, getKnowledgeForArea } from './services/geminiService';
import { Coordinates, RouteAnalysisResult, ThoughtStep, Area, ChartData } from './types';

type SearchMode = 'single' | 'directions' | 'knowledge' | 'draw';

const initialThoughtSteps: ThoughtStep[] = [
    { id: 'from_coords', title: 'Geocode Starting Point', status: 'pending', details: null },
    { id: 'to_coords', title: 'Geocode Destination', status: 'pending', details: null },
    { id: 'generate_route', title: 'Analyze All Routes', status: 'pending', details: null },
];

function App() {
  const [searchMode, setSearchMode] = React.useState<SearchMode>('single');
  const [coordinates, setCoordinates] = React.useState<Coordinates | null>(null);
  const [highlightedArea, setHighlightedArea] = React.useState<Area | null>(null);
  const [drawnArea, setDrawnArea] = React.useState<Area | null>(null);
  const [routeAnalysis, setRouteAnalysis] = React.useState<RouteAnalysisResult | null>(null);
  const [chartData, setChartData] = React.useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string>("Where would you like to explore today?");
  const [thoughtSteps, setThoughtSteps] = React.useState<ThoughtStep[]>([]);

  const resetState = () => {
      setError(null);
      setCoordinates(null);
      setHighlightedArea(null);
      setRouteAnalysis(null);
      setThoughtSteps([]);
      setChartData(null);
      setDrawnArea(null);
  }

  const handleSearch = React.useCallback(async (query: string) => {
    setIsLoading(true);
    resetState();
    setMessage(`Searching for ${query}...`);
    try {
      // First, try to get an area/polygon
      try {
        const area = await getAreaForPlace(query);
        setHighlightedArea(area);
        setMessage(`Showing area for ${query}.`);
      } catch (areaError) {
        // If getting an area fails, fall back to getting a single point
        console.warn(`Could not get area for "${query}", falling back to point.`, areaError);
        const coords = await getCoordinatesForPlace(query);
        setCoordinates(coords);
        setMessage(`Flying to ${query}...`);
      }
    } catch (err: any) {
      // This catches errors from the fallback call
      setError(err.message || 'An unknown error occurred.');
      setMessage("Could not find the location. Please try again.");
      setCoordinates(null);
      setHighlightedArea(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRouteSearch = React.useCallback(async (from: string, to: string) => {
    setIsLoading(true);
    resetState();
    
    // FIX: Explicitly type `stepsWithTitles` as `ThoughtStep[]` to prevent `status` from being inferred as `string`.
    const stepsWithTitles: ThoughtStep[] = initialThoughtSteps.map(step => ({
        ...step,
        title: step.id === 'from_coords' ? `Geocode '${from}'` : step.id === 'to_coords' ? `Geocode '${to}'` : step.title,
        status: 'pending'
    }));
    setThoughtSteps(stepsWithTitles);

    setMessage(`Calculating route from ${from} to ${to}...`);

    const onProgress = (stepUpdate: Partial<ThoughtStep>) => {
        setThoughtSteps(prevSteps => {
            const isError = stepUpdate.status === 'error';
            return prevSteps.map(s => {
                if (isError && s.id === stepUpdate.id) {
                     return { ...s, ...stepUpdate };
                }
                if (s.id === stepUpdate.id) {
                    return { ...s, ...stepUpdate };
                }
                return s;
            });
        });
    };

    try {
        const result = await getRouteForPlaces(from, to, onProgress);
        setRouteAnalysis(result);
        
        // Create detailed thought steps from the result
        const resultSteps: ThoughtStep[] = result.routes.map((route, index) => ({
            id: `route_${index}`,
            title: `Option ${index + 1}: ${route.name}`,
            status: 'success',
            details: `Distance: ${route.distance} | Time: ${route.time} | Traffic: ${route.traffic}`
        }));

        resultSteps.push({
            id: 'recommendation',
            title: 'AI Recommendation',
            status: 'success',
            details: `${result.recommendation.reason}`
        });
        
        // Prepend the initial steps to show the full history
        // FIX: Explicitly type `finalSteps` as `ThoughtStep[]` to prevent `status` from being inferred as `string`.
        const finalSteps: ThoughtStep[] = stepsWithTitles.map(s => 
            s.id === 'generate_route'
            ? {...s, status: 'success', details: `Found ${result.routes.length} options.` }
            : {...s, status: 'success'} // Mark geocoding as success
        );


        setThoughtSteps([...finalSteps, ...resultSteps]);
        setMessage(`Route analysis complete. Recommended route from ${from} to ${to} is highlighted.`);
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setMessage("Could not calculate the route. Please try again.");
        setRouteAnalysis(null);
         // Mark the final running step as failed
        // FIX: Cast `status: 'error'` to a valid `ThoughtStepStatus` literal type to avoid type inference issues.
        setThoughtSteps(prevSteps => prevSteps.map(s => s.status === 'running' ? {...s, status: 'error' as 'error', details: err.message} : s));
    } finally {
        setIsLoading(false);
    }
  }, []);
  
  const handleKnowledgeSearch = React.useCallback(async (query: string) => {
    setIsLoading(true);
    resetState();
    
    const initialStep: ThoughtStep = { id: 'analyze_query', title: `Analyzing "${query}"`, status: 'pending', details: null };
    setThoughtSteps([initialStep]);
    
    setMessage(`Thinking about ${query}...`);

    const onProgress = (stepUpdate: Partial<ThoughtStep>) => {
        setThoughtSteps(prevSteps => prevSteps.map(s => s.id === stepUpdate.id ? { ...s, ...stepUpdate } : s));
    };

    try {
        const result = await getKnowledgeForPlace(query, onProgress);
        
        setHighlightedArea(result.area);
        setMessage(result.answer); // Set the final answer as the message
        if (result.chartData) {
            setChartData(result.chartData);
        }

        const reasoningSteps: ThoughtStep[] = result.reasoning.map((step, index) => ({
            id: `reasoning_${index}`,
            title: step.title,
            status: 'success',
            details: step.details,
        }));

        reasoningSteps.push({
            id: 'final_answer',
            title: 'Answer',
            status: 'success',
            details: result.answer
        });

        if (result.source) {
            reasoningSteps.push({
                id: 'data_source',
                title: 'Data Source',
                status: 'success',
                details: result.source,
            });
        }
        
        const finalInitialStep: ThoughtStep = { ...initialStep, status: 'success', details: `Found answer for ${result.locationName}` };

        setThoughtSteps([finalInitialStep, ...reasoningSteps]);
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setMessage("Could not find an answer. Please try a different query.");
        setHighlightedArea(null);
        setThoughtSteps(prevSteps => prevSteps.map(s => s.status === 'running' ? {...s, status: 'error' as 'error', details: err.message} : s));
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleDrawnAreaSearch = React.useCallback(async (query: string) => {
    if (!drawnArea) {
        setError("Please draw an area on the map first.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setRouteAnalysis(null);
    setThoughtSteps([]);
    setChartData(null);
    setHighlightedArea(null);
    
    const initialStep: ThoughtStep = { id: 'analyze_query', title: `Analyzing your area for "${query}"`, status: 'pending', details: null };
    setThoughtSteps([initialStep]);
    setMessage(`Thinking about your drawn area...`);

    const onProgress = (stepUpdate: Partial<ThoughtStep>) => {
        setThoughtSteps(prevSteps => prevSteps.map(s => s.id === stepUpdate.id ? { ...s, ...stepUpdate } : s));
    };

    try {
        const result = await getKnowledgeForArea(drawnArea, query, onProgress);
        setMessage(result.answer);
        if (result.chartData) {
            setChartData(result.chartData);
        }

        const reasoningSteps: ThoughtStep[] = result.reasoning.map((step, index) => ({
            id: `reasoning_${index}`,
            title: step.title,
            status: 'success',
            details: step.details,
        }));
        reasoningSteps.push({id: 'final_answer', title: 'Answer', status: 'success', details: result.answer});
        if (result.source) {
            reasoningSteps.push({id: 'data_source', title: 'Data Source', status: 'success', details: result.source});
        }
        const finalInitialStep: ThoughtStep = { ...initialStep, status: 'success', details: `Found answer for ${result.locationName}` };
        setThoughtSteps([finalInitialStep, ...reasoningSteps]);

    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setMessage("Could not find an answer for the drawn area.");
        setThoughtSteps(prevSteps => prevSteps.map(s => s.status === 'running' ? {...s, status: 'error' as 'error', details: err.message} : s));
    } finally {
        setIsLoading(false);
    }
  }, [drawnArea]);
  
  const handleDrawComplete = React.useCallback((area: Area) => {
    setDrawnArea(area);
    setMessage("Area defined. Now ask a question about it below.");
  }, []);

  const handleModeChange = (mode: SearchMode) => {
      setSearchMode(mode);
      resetState();
      if (mode === 'single') {
          setMessage("Where would you like to explore today?");
      } else if (mode === 'directions') {
          setMessage("Enter a starting point and a destination.");
      } else if (mode === 'draw') {
          setMessage("Click on the map to draw a polygon. Click the first point to finish.");
      } else {
          setMessage("Ask a question about a place (e.g., 'population of Tokyo').");
      }
  }

  const activeModeClasses = "bg-blue-600 text-white";
  const inactiveModeClasses = "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50";
  
  const searchHandler = React.useCallback((query: string) => {
      if (searchMode === 'single') {
          handleSearch(query);
      } else if (searchMode === 'knowledge') {
          handleKnowledgeSearch(query);
      } else if (searchMode === 'draw') {
          handleDrawnAreaSearch(query);
      }
  }, [searchMode, handleSearch, handleKnowledgeSearch, handleDrawnAreaSearch]);

  const searchPlaceholder = 
    searchMode === 'single' ? "Enter a city, landmark, or address..." :
    searchMode === 'knowledge' ? "Ask about a place, e.g., 'Paris population'..." :
    "e.g., 'What is the main industry here?'";

  return (
    <main className="relative w-screen h-screen bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10 pointer-events-none" />
      <GlobeComponent 
        coordinates={coordinates} 
        routeAnalysis={routeAnalysis} 
        highlightedArea={highlightedArea} 
        drawnArea={drawnArea}
        isDrawingEnabled={searchMode === 'draw' && !drawnArea}
        onDrawComplete={handleDrawComplete}
      />

      <div className="relative z-20 flex flex-col items-center justify-between h-full p-4 md:p-8 pointer-events-none">
        <header className="w-full flex flex-col items-center text-center gap-4 pointer-events-auto">
            <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl max-w-2xl">
                 <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Dora the Explorer
                </h1>
                <p className="mt-2 text-gray-300 h-6">{message}</p>
                 {error && <p className="mt-2 text-red-400 animate-pulse">{error}</p>}
            </div>
            <div className="flex space-x-2 bg-black/30 backdrop-blur-sm p-1.5 rounded-full">
                <button onClick={() => handleModeChange('single')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${searchMode === 'single' ? activeModeClasses : inactiveModeClasses}`}>
                    Find a Place
                </button>
                 <button onClick={() => handleModeChange('directions')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${searchMode === 'directions' ? activeModeClasses : inactiveModeClasses}`}>
                    Get Directions
                </button>
                <button onClick={() => handleModeChange('knowledge')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${searchMode === 'knowledge' ? activeModeClasses : inactiveModeClasses}`}>
                    Know More
                </button>
                <button onClick={() => handleModeChange('draw')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${searchMode === 'draw' ? activeModeClasses : inactiveModeClasses}`}>
                    Draw & Ask
                </button>
            </div>
        </header>
        
        {chartData && <KnowledgeChart chartData={chartData} />}
        <ChainOfThought steps={thoughtSteps} />

        <footer className="w-full flex justify-center pointer-events-auto">
          <div className="w-full max-w-2xl flex flex-col items-center gap-4">
            {searchMode === 'directions' ? (
              <DirectionsInput onSearch={handleRouteSearch} isLoading={isLoading} />
            ) : (
              <>
                {searchMode === 'draw' && (
                  !drawnArea ? (
                    <p className="text-center text-gray-300 bg-black/30 p-3 rounded-lg backdrop-blur-sm">
                      Click on the map to draw a shape. Click the first point again to finish.
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <SearchInput 
                          onSearch={searchHandler} 
                          isLoading={isLoading}
                          placeholder={searchPlaceholder}
                      />
                      <button 
                        onClick={() => { setDrawnArea(null); setMessage("Drawing cleared. Click map to start again."); }}
                        className="px-4 py-1.5 bg-gray-700/50 text-xs text-gray-300 rounded-full hover:bg-gray-600/50 transition-colors"
                      >
                        Clear Drawing
                      </button>
                    </div>
                  )
                )}
                {(searchMode === 'single' || searchMode === 'knowledge') && (
                   <SearchInput 
                      onSearch={searchHandler} 
                      isLoading={isLoading}
                      placeholder={searchPlaceholder}
                  />
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}

export default App;