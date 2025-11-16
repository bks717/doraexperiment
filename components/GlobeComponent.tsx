import * as React from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, Area, RouteAnalysisResult } from '../types';

// Fix for default marker icon which can break in some module bundlers.
// We are explicitly setting the URLs for the marker images from a CDN.
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;


interface MapFlyToControllerProps {
  coordinates: Coordinates | null;
}

// This is a helper component that allows us to imperatively control the map.
const MapFlyToController: React.FC<MapFlyToControllerProps> = ({ coordinates }) => {
  const map = useMap();

  React.useEffect(() => {
    if (coordinates) {
      const { latitude, longitude } = coordinates;
      // Animate the map view to the new coordinates
      map.flyTo([latitude, longitude], 14, {
        animate: true,
        duration: 2.5, // Animation duration in seconds
      });
    }
  }, [coordinates, map]);

  return null; // This component does not render any visible elements
};

interface MapBoundsControllerProps {
    boundary: L.LatLngExpression[] | null;
}

const MapBoundsController: React.FC<MapBoundsControllerProps> = ({ boundary }) => {
    const map = useMap();

    React.useEffect(() => {
        if (boundary && boundary.length >= 2) {
            const bounds = L.latLngBounds(boundary);
            map.flyToBounds(bounds, {
                padding: [50, 50], // Add some padding around the bounds
                animate: true,
                duration: 2.0,
            });
        }
    }, [boundary, map]);

    return null;
}

// New component for handling drawing
interface DrawHandlerProps {
  onDrawComplete: (area: Area) => void;
}

const DrawHandler: React.FC<DrawHandlerProps> = ({ onDrawComplete }) => {
  const map = useMap();
  const [points, setPoints] = React.useState<L.LatLng[]>([]);
  const isDrawing = points.length > 0;

  useMapEvents({
    click(e) {
      if (!isDrawing) {
        setPoints([e.latlng]);
        map.getContainer().style.cursor = 'crosshair';
      } else {
        const firstPoint = points[0];
        const clickPoint = e.latlng;
        // Check if user clicked near the first point to close the polygon
        if (map.latLngToContainerPoint(firstPoint).distanceTo(map.latLngToContainerPoint(clickPoint)) < 25 && points.length > 2) {
          onDrawComplete(points.map(p => ({ latitude: p.lat, longitude: p.lng })));
          setPoints([]);
          map.getContainer().style.cursor = '';
        } else {
          setPoints(prevPoints => [...prevPoints, e.latlng]);
        }
      }
    },
  });
  
  // Clean up cursor on component unmount
  React.useEffect(() => {
    return () => {
        if(map.getContainer()){
            map.getContainer().style.cursor = '';
        }
    }
  }, [map]);

  return (
    <>
      {isDrawing && (
        <>
            {/* The line being drawn */}
            <Polyline positions={points} color="cyan" weight={3} dashArray="5, 5" />
            {/* Markers for vertices */}
            {points.map((point, index) => (
              <Marker key={index} position={point} icon={L.divIcon({
                  className: 'leaflet-draw-marker',
                  html: `<span>${index === 0 ? '🏁' : ''}</span>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
              })} />
            ))}
        </>
      )}
    </>
  );
};


interface GlobeComponentProps {
  coordinates: Coordinates | null;
  routeAnalysis: RouteAnalysisResult | null;
  highlightedArea: Area | null;
  drawnArea: Area | null;
  isDrawingEnabled: boolean;
  onDrawComplete: (area: Area) => void;
}

const GlobeComponent: React.FC<GlobeComponentProps> = ({ coordinates, routeAnalysis, highlightedArea, drawnArea, isDrawingEnabled, onDrawComplete }) => {
  const position: [number, number] | null = coordinates 
    ? [coordinates.latitude, coordinates.longitude] 
    : null;
    
  const areaPositions = highlightedArea ? highlightedArea.map(c => [c.latitude, c.longitude] as [number, number]) : null;
  const drawnAreaPositions = drawnArea ? drawnArea.map(c => [c.latitude, c.longitude] as [number, number]) : null;
  
  const allRoutePositions = routeAnalysis 
    ? routeAnalysis.routes.flatMap(r => r.path.map(c => [c.latitude, c.longitude] as L.LatLngExpression))
    : null;
    
  const recommendedRoute = routeAnalysis ? routeAnalysis.routes[routeAnalysis.recommendation.bestRouteIndex] : null;
  const startMarker = recommendedRoute ? [recommendedRoute.path[0].latitude, recommendedRoute.path[0].longitude] as [number, number] : null;
  const endMarker = recommendedRoute ? [recommendedRoute.path[recommendedRoute.path.length-1].latitude, recommendedRoute.path[recommendedRoute.path.length-1].longitude] as [number, number] : null;

  // Determine what to use for the bounds controller
  const boundary = allRoutePositions || areaPositions || drawnAreaPositions;

  return (
    <div className="absolute inset-0 z-0" aria-label="Map of the world">
      <style>{`
        .leaflet-draw-marker {
          background-color: rgba(0, 255, 255, 0.7);
          border: 1px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
      `}</style>
      <MapContainer
        center={[20, 0]} // Initial map center
        zoom={2} // Initial map zoom
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', backgroundColor: '#1a202c' }}
        worldCopyJump={true} // Allows the map to wrap around horizontally
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Display a marker for single-point search fallback */}
        {position && !highlightedArea && <Marker position={position} />}

        {/* Display AI-highlighted area */}
        {areaPositions && <Polygon pathOptions={{ color: 'cyan', weight: 2, fillColor: 'cyan', fillOpacity: 0.2 }} positions={areaPositions} />}
        
        {/* Display user-drawn area */}
        {drawnAreaPositions && <Polygon pathOptions={{ color: 'magenta', weight: 3, fillColor: 'magenta', fillOpacity: 0.2 }} positions={drawnAreaPositions} />}

        {/* Display all routes from the analysis */}
        {routeAnalysis && routeAnalysis.routes.map((route, index) => {
            const isRecommended = index === routeAnalysis.recommendation.bestRouteIndex;
            return (
                <Polyline 
                    key={route.name}
                    pathOptions={{
                        color: isRecommended ? 'cyan' : 'gray',
                        weight: isRecommended ? 5 : 3,
                        opacity: isRecommended ? 1 : 0.7,
                        dashArray: isRecommended ? undefined : '5, 10'
                    }} 
                    positions={route.path.map(c => [c.latitude, c.longitude])} 
                />
            );
        })}
        {startMarker && <Marker position={startMarker} />}
        {endMarker && <Marker position={endMarker} />}

        {/* Include the controllers to handle map movements */}
        <MapFlyToController coordinates={coordinates} />
        <MapBoundsController boundary={boundary} />
        {isDrawingEnabled && <DrawHandler onDrawComplete={onDrawComplete} />}

      </MapContainer>
    </div>
  );
};

export default GlobeComponent;