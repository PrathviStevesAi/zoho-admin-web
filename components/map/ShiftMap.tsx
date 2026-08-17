import { MapContainer, TileLayer, Circle, Polyline, Polygon, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

function ChangeView({
  center,
  onZoomChange
}: {
  center: [number, number];
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.panTo(center);
    }
  }, [center, map]);

  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null;
}

const customIcon = (color: string) => {
  return new L.DivIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const startIcon = new L.DivIcon({
  className: "custom-leaflet-icon",
  html: `
    <style>
      @keyframes pinPulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    </style>
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 32px; height: 32px;">
      <!-- Teardrop Pin -->
      <div style="
        background-color: #ef4444; 
        width: 22px; 
        height: 22px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: -6px;
      ">
        <!-- Center Core -->
        <div style="
          width: 8px; 
          height: 8px; 
          background-color: white; 
          border-radius: 50%;
        "></div>
      </div>
      <!-- Pulse Effect -->
      <div style="
        position: absolute;
        bottom: 0px;
        width: 12px;
        height: 4px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          animation: pinPulse 1.5s infinite ease-out;
          opacity: 0;
        "></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const guardIcon = new L.DivIcon({
  className: "custom-leaflet-icon",
  html: `
    <style>
      @keyframes guardPulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2.0); opacity: 0; }
      }
    </style>
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <!-- Outer Double Pulsing Rings -->
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        border: 2px solid #0064cb;
        border-radius: 50%;
        animation: guardPulse 2s infinite ease-out;
        opacity: 0;
        z-index: 1;
      "></div>
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        border: 1px solid #00d2ff;
        border-radius: 50%;
        animation: guardPulse 2s infinite ease-out;
        animation-delay: 0.8s;
        opacity: 0;
        z-index: 1;
      "></div>
      <!-- Inner Avatar Badge with White Background -->
      <div style="
        background: #ffffff;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1.5px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        overflow: hidden;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
          <!-- Left Shoulder & Right Shoulder / Uniform -->
          <path d="M15 88 C 15 72, 30 65, 50 65 C 70 65, 85 72, 85 88 Z" fill="#7fa9d6" stroke="#003057" stroke-width="4" stroke-linejoin="round" />
          <!-- Epaulets -->
          <path d="M19 71 L 28 67 C 30 66, 33 69, 31 71 L 25 76 C 24 77, 21 75, 19 71 Z" fill="#005da3" stroke="#003057" stroke-width="2.5" />
          <path d="M81 71 L 72 67 C 70 66, 67 69, 69 71 L 75 76 C 76 77, 79 75, 81 71 Z" fill="#005da3" stroke="#003057" stroke-width="2.5" />
          <!-- Tie -->
          <path d="M46 76 L 50 88 L 54 76 L 50 72 Z" fill="#005da3" stroke="#003057" stroke-width="2.5" stroke-linejoin="round" />
          <!-- Shirt V-neck / Collar -->
          <path d="M38 65 L 45 74 L 50 68 L 55 74 L 62 65" fill="none" stroke="#003057" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          
          <!-- Left Ear -->
          <path d="M30 46 C 25 46, 25 56, 30 56 Z" fill="#e8f1f7" stroke="#003057" stroke-width="4" />
          <!-- Right Ear -->
          <path d="M70 46 C 75 46, 75 56, 70 56 Z" fill="#e8f1f7" stroke="#003057" stroke-width="4" />
          
          <!-- Head/Neck -->
          <path d="M33 46 C 33 30, 67 30, 67 46 C 67 62, 58 66, 50 66 C 42 66, 33 62, 33 46 Z" fill="#e8f1f7" stroke="#003057" stroke-width="4" stroke-linejoin="round" />
          
          <!-- Policeman/Guard Cap -->
          <!-- Cap Top/Crown -->
          <path d="M27 34 C 23 20, 35 12, 50 12 C 65 12, 77 20, 73 34 Z" fill="#004b8d" stroke="#003057" stroke-width="4" stroke-linejoin="round" />
          <!-- Cap Badge (Shield) -->
          <path d="M50 20 C 47 20, 46 25, 50 29 C 54 25, 53 20, 50 20 Z" fill="#7fa9d6" stroke="#003057" stroke-width="2.5" />
          <!-- Cap Visor Band -->
          <path d="M28 34 C 38 31, 62 31, 72 34 C 74 38, 70 42, 50 42 C 30 42, 26 38, 28 34 Z" fill="#005da3" stroke="#003057" stroke-width="4" stroke-linejoin="round" />
          <!-- Cap Visor Peak shadow -->
          <path d="M32 38 C 40 45, 60 45, 68 38 C 65 42, 35 42, 32 38 Z" fill="#003057" />
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

interface ShiftMapProps {
  center?: [number, number];
  radius?: number;
  checkpoints?: [number, number][];
  shiftLocation?: [number, number];
  className?: string;
  heightClass?: string;
}

export default function ShiftMap({
  center,
  radius = 150,
  checkpoints,
  shiftLocation,
  className = "mt-6",
  heightClass = "h-[400px]"
}: ShiftMapProps) {
  const [zoomLevel, setZoomLevel] = useState(15);

  const fallbackCenter = shiftLocation || [35.4435, -80.8611];
  const actualCenter = center || (checkpoints && checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : fallbackCenter);

  const activeCheckpoints = checkpoints || [
    [35.4400, -80.8620],
    [35.4410, -80.8590],
    [35.4430, -80.8580],
    [35.4445, -80.8590],
    [35.4450, -80.8610],
    [35.4440, -80.8625],
  ] as [number, number][];

  const start = activeCheckpoints.length > 0 ? activeCheckpoints[0] : actualCenter;
  const end = activeCheckpoints.length > 0 ? activeCheckpoints[activeCheckpoints.length - 1] : actualCenter;
  const intermediates = activeCheckpoints.length > 2 ? activeCheckpoints.slice(1, -1) : [];

  const isFallback = actualCenter[0] === 35.4435 && actualCenter[1] === -80.8611;
  const mapKey = `${shiftLocation ? "geocoded" : "no-loc"}-${isFallback ? "fallback" : "ready"}-${radius}`;

  return (
    <Card className={`border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden p-1 relative z-0 ${className}`}>
      <div className={`${heightClass} w-full rounded-lg overflow-hidden relative z-0`}>
        <MapContainer
          key={mapKey}
          center={actualCenter}
          zoom={zoomLevel}
          className="h-full w-full relative z-0"
        >
          <ChangeView center={actualCenter} onZoomChange={setZoomLevel} />
          <TileLayer
            attribution="&copy; Google Maps"
            url="https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}"
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
          />

          <Circle
            center={shiftLocation || actualCenter}
            radius={radius}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '3, 3'
            }}
          />

          {activeCheckpoints.length > 2 && (
            <Polygon
              positions={activeCheckpoints}
              pathOptions={{
                color: '#0064cb',
                fillColor: '#0064cb',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '5, 5'
              }}
            />
          )}

          {activeCheckpoints.length > 1 && (
            <Polyline
              positions={activeCheckpoints}
              pathOptions={{ color: '#0064cb', weight: 4 }}
            />
          )}

          {(shiftLocation || !checkpoints) && (
            <Marker position={shiftLocation || actualCenter} icon={startIcon}>
              <Popup>Shift Location (Site Address)</Popup>
              <Tooltip direction="top" offset={[0, -32]}>Site Location</Tooltip>
            </Marker>
          )}

          {activeCheckpoints.length > 0 && checkpoints && (
            <Marker position={end} icon={guardIcon}>
              <Popup>Guard Live Position</Popup>
              <Tooltip direction="top" offset={[0, -18]}>Guard</Tooltip>
            </Marker>
          )}

          {activeCheckpoints.length > 0 && checkpoints && (
            <Marker position={start} icon={customIcon('#10b981')}>
              <Popup>Patrol Start Point</Popup>
            </Marker>
          )}

          {activeCheckpoints.length > 2 && checkpoints && intermediates.map((pos, idx) => (
            <Marker key={idx} position={pos} icon={customIcon('#3b82f6')}>
              <Popup>Checkpoint {idx + 1}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
