"use client";

import { MapContainer, TileLayer, Circle, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";

// Fix leaflet icon issues in next.js
const customIcon = (color: string) => {
  return new L.DivIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const startIcon = new L.DivIcon({
  className: "custom-leaflet-icon",
  html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const endIcon = new L.DivIcon({
  className: "custom-leaflet-icon",
  html: `<div style="background-color: #f97316; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><div style="width: 4px; height: 4px; background-color: #3b82f6; border-radius: 50%;"></div></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

interface ShiftMapProps {
  center?: [number, number];
  radius?: number;
  checkpoints?: [number, number][];
}

export default function ShiftMap({
  center,
  radius = 600,
  checkpoints
}: ShiftMapProps) {
  // If checkpoints are provided, default to the first checkpoint; otherwise default center
  const actualCenter = center || (checkpoints && checkpoints.length > 0 ? checkpoints[0] : [35.4435, -80.8611]);
  const activeCheckpoints = checkpoints || [
    [35.4400, -80.8620], // Start fallback default checkpoints
    [35.4410, -80.8590],
    [35.4430, -80.8580],
    [35.4445, -80.8590],
    [35.4450, -80.8610],
    [35.4440, -80.8625], // End fallback
  ] as [number, number][];

  const start = activeCheckpoints.length > 0 ? activeCheckpoints[0] : actualCenter;
  const end = activeCheckpoints.length > 1 ? activeCheckpoints[activeCheckpoints.length - 1] : actualCenter;
  const intermediates = activeCheckpoints.length > 2 ? activeCheckpoints.slice(1, -1) : [];

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden p-1 mt-6 relative z-0">
      <div className="h-[400px] w-full rounded-lg overflow-hidden relative z-0">
        <MapContainer 
          key={actualCenter.join(",")} 
          center={actualCenter} 
          zoom={15} 
          className="h-full w-full relative z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Circle
            center={actualCenter}
            radius={radius}
            pathOptions={{ color: 'gray', fillColor: 'gray', fillOpacity: 0.2, weight: 2 }}
          />

          {activeCheckpoints.length > 0 && (
            <Polyline
              positions={activeCheckpoints}
              pathOptions={{ color: 'blue', weight: 3 }}
            />
          )}

          {activeCheckpoints.length === 0 && (
            <Marker position={actualCenter} icon={startIcon}>
              <Popup>Shift Location</Popup>
            </Marker>
          )}

          {activeCheckpoints.length > 0 && (
            <Marker position={start} icon={startIcon}>
              <Popup>Start Point</Popup>
            </Marker>
          )}

          {intermediates.map((pos, idx) => (
            <Marker key={idx} position={pos} icon={customIcon('#22c55e')}>
              <Popup>Checkpoint {idx + 1}</Popup>
            </Marker>
          ))}

          {activeCheckpoints.length > 1 && (
            <Marker position={end} icon={endIcon}>
              <Popup>End Point</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </Card>
  );
}
