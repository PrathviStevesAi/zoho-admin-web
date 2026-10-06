"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Minus, Crosshair } from "lucide-react";

interface GuardLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isEligible: boolean;
  distance?: string;
}

interface GuardsMapProps {
  center: [number, number];
  radiusMiles?: number;
  centerLocationName: string;
  guardsFoundCount: number;
  guards?: any[];
  locationType?: "radius" | "city" | "state" | "country" | "all" | "all_guard";
}

function MapController({
  center,
  radiusMiles = 30,
  locationType = "radius",
}: {
  center: [number, number];
  radiusMiles?: number;
  locationType?: "radius" | "city" | "state" | "country" | "all" | "all_guard";
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (center && center[0] && center[1]) {
      let zoom = 10;
      if (locationType === "country" || locationType === "all" || locationType === "all_guard") {
        zoom = 4;
      } else if (locationType === "state") {
        zoom = 7;
      } else if (locationType === "city") {
        zoom = 11;
      } else {
        if (radiusMiles <= 15) zoom = 11;
        else if (radiusMiles <= 35) zoom = 10;
        else if (radiusMiles <= 70) zoom = 9;
        else zoom = 8;
      }
      map.setView(center, zoom, { animate: true });
    }
  }, [center, radiusMiles, locationType, map]);

  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
      <div className="bg-white rounded-lg shadow-md border border-slate-200/80 flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200/80 overflow-hidden">
        <button
          type="button"
          onClick={() => map.panTo(center, { animate: true })}
          aria-label="Recenter"
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
}

const createCenterIcon = () =>
  new L.DivIcon({
    className: "custom-leaflet-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 34px; height: 34px;">
        <div style="
          background-color: #0064cb; 
          width: 26px; 
          height: 26px; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          border: 2.5px solid white; 
          box-shadow: 0 3px 8px rgba(0,0,0,0.35); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin-top: -8px;
        ">
          <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

const createDistanceBadgeIcon = (text: string) =>
  new L.DivIcon({
    className: "custom-leaflet-icon",
    html: `
      <div style="
        background-color: #0064cb; 
        color: #ffffff; 
        font-size: 11px; 
        font-weight: 700; 
        padding: 3px 10px; 
        border-radius: 9999px; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.25); 
        white-space: nowrap; 
        border: 2px solid #ffffff;
        letter-spacing: 0.02em;
        transform: translate(-50%, -50%);
      ">
        ${text}
      </div>
    `,
    iconSize: [70, 24],
    iconAnchor: [35, 12],
  });

const createGuardMarkerIcon = (isEligible: boolean) => {
  const color = isEligible ? "#16a34a" : "#3b82f6";
  const glowColor = isEligible ? "rgba(22, 163, 74, 0.5)" : "rgba(59, 130, 246, 0.5)";

  return new L.DivIcon({
    className: "custom-leaflet-icon",
    html: `
      <style>
        @keyframes guardPinBlink {
          0%, 100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.3;
            transform: translateY(-2px) scale(0.92);
          }
        }
        @keyframes guardRadarPulse {
          0% {
            transform: scale(0.7);
            opacity: 0.85;
          }
          70%, 100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
      </style>
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 32px;
        height: 42px;
        cursor: pointer;
      ">
        <!-- Blinking Guard Icon Badge Above the Dot with Centered Right Tick -->
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px ${glowColor}, 0 1px 3px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: guardPinBlink 1.2s ease-in-out infinite;
          z-index: 2;
        ">
          <!-- Centered Right Tick SVG -->
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: auto;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <!-- Pointer triangle -->
        <div style="
          width: 0;
          height: 0;
          border-left: 3.5px solid transparent;
          border-right: 3.5px solid transparent;
          border-top: 4px solid ${color};
          margin-top: -1px;
          z-index: 1;
        "></div>

        <!-- Dot Container at coordinate position with radar ripple -->
        <div style="
          position: absolute;
          bottom: 2px;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Radar Pulse -->
          <div style="
            position: absolute;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: ${color};
            animation: guardRadarPulse 1.6s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            pointer-events: none;
          "></div>
          <!-- Center Dot -->
          <div style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
            z-index: 3;
          "></div>
        </div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 40],
  });
};

export default function GuardsMap({
  center,
  radiusMiles = 50,
  centerLocationName,
  guardsFoundCount,
  guards = [],
  locationType = "radius",
}: GuardsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[360px] w-full bg-slate-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0064cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isRadiusMode = locationType === "radius";
  const radiusMeters = radiusMiles * 1609.34;
  const badgePosition: [number, number] = [
    center[0] + radiusMiles / 69,
    center[1],
  ];

  const guardMarkers: GuardLocation[] = [];
  guards.forEach((g, idx) => {
    const lat = Number(g.latitude || g.lat);
    const lng = Number(g.longitude || g.lng);
    const name = `${g.first_name || ""} ${g.last_name || ""}`.trim() || g.name || `Guard #${idx + 1}`;
    const distance = g.distance_miles ? `${g.distance_miles} mi` : undefined;

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      guardMarkers.push({
        id: g.guard_id || `guard-${idx}`,
        name,
        lat,
        lng,
        isEligible: g.status !== false,
        distance,
      });
    }
  });

  const mapKey = `${center[0].toFixed(3)}-${center[1].toFixed(3)}-${locationType}-${radiusMiles}`;

  return (
    <div className="relative w-full h-[360px] overflow-hidden">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={locationType === "country" || locationType === "all" || locationType === "all_guard" ? 4 : locationType === "state" ? 7 : locationType === "city" ? 11 : 10}
        zoomControl={false}
        className="h-full w-full relative z-0"
      >
        <MapController center={center} radiusMiles={radiusMiles} locationType={locationType} />
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
        />

        <Marker position={center} icon={createCenterIcon()}>
          <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
            <span className="font-semibold text-xs">{centerLocationName}</span>
          </Tooltip>
        </Marker>

        {isRadiusMode && (
          <>
            <Circle
              center={center}
              radius={radiusMeters}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
                weight: 2,
                dashArray: "6, 6",
              }}
            />
            <Marker position={badgePosition} icon={createDistanceBadgeIcon(`${radiusMiles} miles`)} />
          </>
        )}

        {guardMarkers.map((gm) => (
          <Marker
            key={gm.id}
            position={[gm.lat, gm.lng]}
            icon={createGuardMarkerIcon(gm.isEligible)}
          >
            <Tooltip direction="top" offset={[0, -24]} opacity={0.95}>
              <div className="text-xs">
                <p className="font-bold text-slate-800">{gm.name}</p>
                <p className="text-[11px] text-slate-500">
                  {gm.isEligible ? "Eligible guard" : "Other guard"}
                  {gm.distance ? ` • ${gm.distance}` : ""}
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {guardMarkers.length > 0 && (
        <div className="absolute bottom-8 right-3 z-[1000] bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-lg shadow-md border border-slate-200/90 text-[11px] space-y-2 pointer-events-auto">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-4 h-4 rounded-full bg-[#16a34a] border border-white shadow-xs flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="block m-auto">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>Eligible guard</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-4 h-4 rounded-full bg-[#3b82f6] border border-white shadow-xs flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="block m-auto">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>Other guard</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-1.5 left-2.5 z-[1000] text-[12px] font-bold text-slate-500 tracking-tight select-none pointer-events-none opacity-80 flex items-center">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#4285F4]">g</span>
        <span className="text-[#34A853]">l</span>
        <span className="text-[#EA4335]">e</span>
      </div>

      <div className="absolute bottom-1 right-2 z-[990] text-[9.5px] text-slate-400 select-none pointer-events-none">
        Map data &copy;2026 Google &bull; Terms
      </div>
    </div>
  );
}
