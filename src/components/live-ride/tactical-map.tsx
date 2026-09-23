"use client";

import { useEffect, useRef } from "react";
import type { Participant, ParticipantRole } from "@/types/live-ride";

type TacticalMapProps = {
  participants: Participant[];
  selectedParticipantId?: string | null;
  onSelectParticipant?: (id: string) => void;
  onEjectParticipant?: (id: string, name: string) => void;
  onRoleChange?: (id: string, role: ParticipantRole) => void;
  onDirectMessage?: (id: string, name: string) => void;
  readOnly?: boolean;
};

export function TacticalMap({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  onEjectParticipant,
  onRoleChange,
  onDirectMessage
  onDirectMessage,
  readOnly = false
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const initialFittedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

      // Check container still mounted
      if (!isMounted || !mapContainerRef.current) return;

      // Default centered on Dehradun, India
      const defaultCenter: [number, number] = [30.3165, 78.0322];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Clean, watermark-free GIS Dark Gray Canvas Base
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Rebels Radar',
        maxNativeZoom: 16,
        maxZoom: 19
      }).addTo(map);

      // Clean highway, road, and city labels overlay
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
        maxNativeZoom: 16,
        maxZoom: 19,
        opacity: 0.85
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when participants or selection change
  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current) return;
      const L = await import("leaflet");
      const map = mapInstanceRef.current;

      const currentIds = new Set(participants.map((p) => p._id));

      // Remove obsolete markers (e.g. ejected or deleted riders)
      for (const [id, marker] of markersRef.current.entries()) {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }

      const activeValidCoords: [number, number][] = [];

      participants.forEach((p) => {
        // Skip if coordinates are unset or participant is ejected/left
        if (!p.latitude || !p.longitude || p.status === "ejected" || p.status === "left") {
          if (markersRef.current.has(p._id)) {
            markersRef.current.get(p._id)!.remove();
            markersRef.current.delete(p._id);
          }
          return;
        }

        const latLng: [number, number] = [p.latitude, p.longitude];
        activeValidCoords.push(latLng);

        const isLead = p.role === "lead";
        const isMarshal = p.role === "marshal";
        const isSweeper = p.role === "sweeper";
        const isPillion = p.role === "pillion" || Boolean(p.isPillion);
        const isSelected = p._id === selectedParticipantId;

        // Offline detection: no ping in the last 45 seconds
        const lastPingMs = p.lastPingAt ? new Date(p.lastPingAt).getTime() : 0;
        const isOffline = !lastPingMs || Date.now() - lastPingMs > 45000;

        let timeAgoText = "just now";
        if (isOffline && lastPingMs > 0) {
          const diffSec = Math.floor((Date.now() - lastPingMs) / 1000);
          if (diffSec < 60) timeAgoText = `${diffSec}s ago`;
          else if (diffSec < 3600) timeAgoText = `${Math.floor(diffSec / 60)}m ago`;
          else timeAgoText = `${Math.floor(diffSec / 3600)}h ago`;
        }

        // Color coding: Lead (Gold), Marshal (Electric Cyan), Sweeper (Purple), Pillion (Orange), Rider (Rebel Red)
        const roleColor = isLead ? "#ffd700" : isMarshal ? "#00f0ff" : isSweeper ? "#a855f7" : isPillion ? "#f97316" : "#ff535b";
        const primaryColor = isOffline ? "#f59e0b" : roleColor;
        const roleLabel = isLead ? "LEAD CAPTAIN" : isMarshal ? "MARSHAL (DIRECTION)" : isSweeper ? "TAIL SWEEPER" : isPillion ? "PILLION PASSENGER" : "RIDER";
        const firstName = p.riderName.split(" ")[0] || p.riderName;

        const hasAvatar = Boolean(p.profileImage && p.profileImage.trim());

        const iconHtml = `
          <div class="relative flex flex-col items-center justify-center select-none cursor-pointer group" style="transform: translate(-50%, -50%);">
            <!-- Compass Heading Ring with Direction Pointer -->
            <div class="relative flex items-center justify-center transition-transform duration-300" style="transform: rotate(${p.heading || 0}deg);">
              <!-- Center Core: Avatar photo or Tactical Icon -->
              <div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.85)] transition-all duration-300 ${
                isSelected ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-black" : "group-hover:scale-110"
              }" style="background-color: #120e0e; border: 2.5px ${isOffline ? "dashed #f59e0b" : "solid " + primaryColor}; filter: ${isOffline ? "grayscale(40%)" : "none"}; opacity: ${isOffline ? "0.85" : "1"};">
                ${
                  hasAvatar
                    ? `<img src="${p.profileImage}" alt="${p.riderName}" class="w-full h-full object-cover rounded-full" />`
                    : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" style="color: ${primaryColor};" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
                      </svg>`
                }
              </div>
              <!-- Direction Nose Dot (heading pointer) -->
              <div class="absolute -top-1 w-2.5 h-2.5 rounded-full shadow" style="transform: translateY(-8px); background-color: ${primaryColor}; border: 1.5px solid #ffffff;"></div>
            </div>
            <!-- Rider Name Pill Badge right below marker -->
            <div class="mt-1 px-2 py-0.5 rounded-md bg-[#0e0a0a]/95 border ${isOffline ? "border-amber-500/50" : "border-[#552e2e]"} text-[10px] font-mono text-white font-bold whitespace-nowrap shadow-xl flex items-center gap-1 backdrop-blur-sm pointer-events-none">
              ${isLead ? '<span class="text-[#ffd700] text-[9px] font-bold">★</span>' : ""}
              ${isMarshal ? '<span class="text-[#00f0ff] text-[9px] font-bold">M</span>' : ""}
              ${isPillion ? '<span class="text-[#f97316] text-[9px] font-bold">P</span>' : ""}
              <span class="max-w-[75px] truncate">${firstName}</span>
              ${
                isOffline
                  ? `<span class="text-amber-400 font-mono text-[9px] font-bold">OFFLINE</span>`
                  : (p.speed > 0 ? `<span class="text-[#ff535b] font-mono font-bold">${p.speed}k</span>` : "")
              }
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-bike-marker",
          iconSize: [44, 64],
          iconAnchor: [22, 22]
        });

        let marker = markersRef.current.get(p._id);
        if (!marker) {
          marker = L.marker(latLng, { icon: customIcon }).addTo(map);
          marker.on("click", () => {
            onSelectParticipant?.(p._id);
          });
          markersRef.current.set(p._id, marker);
        } else {
          marker.setLatLng(latLng);
          marker.setIcon(customIcon);
        }

        // Expanded Rider Profile Card Popup
        const popupContent = document.createElement("div");
        popupContent.className = "p-2.5 min-w-[230px] max-w-[270px] text-[#e5e2e1] font-mono";
        popupContent.innerHTML = `
          <div class="flex items-center gap-2.5 border-b border-[#352323] pb-2.5 mb-2">
            ${
              hasAvatar
                ? `<img src="${p.profileImage}" alt="${p.riderName}" class="w-11 h-11 rounded-full object-cover shrink-0 border-2 shadow" style="border-color: ${primaryColor}; filter: ${isOffline ? "grayscale(30%)" : "none"};" />`
                : `<div class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base text-black shrink-0 shadow font-sans" style="background-color: ${primaryColor};">
                    ${(firstName[0] || "R").toUpperCase()}
                  </div>`
            }
            <div class="min-w-0 flex-1">
              <strong class="text-sm text-white font-sans truncate block leading-snug">${p.riderName}</strong>
              <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                <span class="text-[9px] uppercase px-1.5 py-0.5 rounded border font-bold" style="border-color: ${roleColor}; color: ${roleColor}">
                  ${roleLabel}
                </span>
                ${
                  isOffline
                    ? `<span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        ⚠️ Offline
                      </span>`
                    : `<span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live
                      </span>`
                }
              </div>
            </div>
          </div>

          <div class="text-[11px] space-y-1 text-[#aaa]">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Status:</span>
              <strong class="${isOffline ? "text-amber-400" : "text-emerald-400"} font-bold">
                ${isOffline ? `Offline (Last seen ${timeAgoText})` : "Live Signal"}
              </strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Bike:</span>
              <strong class="text-[#eee] truncate max-w-[140px]">${p.bikeModel} ${p.bikeNumber ? `(${p.bikeNumber})` : ""}${p.pillionRiderName ? ` · with ${p.pillionRiderName}` : ""}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">${isOffline ? "Last Speed:" : "Speed:"}</span>
              <strong class="text-[#ff535b] font-bold text-xs">${isOffline ? "0 (Stationary)" : `${p.speed} km/h`}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Last Coords:</span>
              <strong class="text-white text-[10px]">${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">GPS Accuracy:</span>
              <strong class="text-emerald-400">±${p.accuracy}m</strong>
            </div>
            ${
              p.phone
              !readOnly && p.phone
                ? `
                <div class="flex items-center justify-between pt-1 border-t border-[#2d1a1a]">
                  <span class="text-muted-foreground">Contact:</span>
                  <a href="tel:${p.phone}" class="text-[#00f0ff] hover:underline font-bold">${p.phone} 📞</a>
                </div>
              `
                : ""
            }
          </div>

          <div class="mt-2.5 pt-2 border-t border-[#352323] flex flex-col gap-1.5">
            <!-- 1-to-1 Whisper Direct Message Button -->
            <button id="btn-direct-${p._id}" class="w-full text-center py-1.5 px-2 bg-[#1b2b25] hover:bg-[#233b31] active:scale-[0.98] text-emerald-300 border border-emerald-500/50 rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer">
              <span>💬 Direct Message (Whisper)</span>
            </button>
          ${
            readOnly
              ? `
              <div class="mt-2.5 pt-2 border-t border-[#352323] text-center">
                <span class="text-[10px] font-mono text-[#a3908a] uppercase tracking-wider flex items-center justify-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full ${isOffline ? "bg-amber-400" : "bg-emerald-400"}"></span>
                  Rebels Squad Radar
                </span>
              </div>
            `
              : `
              <div class="mt-2.5 pt-2 border-t border-[#352323] flex flex-col gap-1.5">
                <!-- 1-to-1 Whisper Direct Message Button -->
                <button id="btn-direct-${p._id}" class="w-full text-center py-1.5 px-2 bg-[#1b2b25] hover:bg-[#233b31] active:scale-[0.98] text-emerald-300 border border-emerald-500/50 rounded font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer">
                  <span>💬 Direct Message (Whisper)</span>
                </button>

            <!-- Role and Eject Actions Grid -->
            <div class="grid grid-cols-2 gap-1.5">
              <button id="btn-marshal-${p._id}" class="text-[10px] font-mono uppercase px-2 py-1 bg-[#16272e] hover:bg-[#1f3742] text-[#00f0ff] border border-[#00f0ff]/40 rounded transition cursor-pointer">
                ${isMarshal ? "Demote" : "Make Marshal"}
              </button>
              <button id="btn-eject-${p._id}" class="text-[10px] font-mono uppercase px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 rounded transition cursor-pointer">
                Eject
              </button>
            </div>
          </div>
                <!-- Role and Eject Actions Grid -->
                <div class="grid grid-cols-2 gap-1.5">
                  <button id="btn-marshal-${p._id}" class="text-[10px] font-mono uppercase px-2 py-1 bg-[#16272e] hover:bg-[#1f3742] text-[#00f0ff] border border-[#00f0ff]/40 rounded transition cursor-pointer">
                    ${isMarshal ? "Demote" : "Make Marshal"}
                  </button>
                  <button id="btn-eject-${p._id}" class="text-[10px] font-mono uppercase px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 rounded transition cursor-pointer">
                    Eject
                  </button>
                </div>
              </div>
            `
          }
        `;

        // Wire popup button actions
        popupContent.querySelector(`#btn-direct-${p._id}`)?.addEventListener("click", () => {
          onDirectMessage?.(p._id, p.riderName);
          marker?.closePopup();
        });
        if (!readOnly) {
          popupContent.querySelector(`#btn-direct-${p._id}`)?.addEventListener("click", () => {
            onDirectMessage?.(p._id, p.riderName);
            marker?.closePopup();
          });

        popupContent.querySelector(`#btn-eject-${p._id}`)?.addEventListener("click", () => {
          onEjectParticipant?.(p._id, p.riderName);
          marker?.closePopup();
        });
          popupContent.querySelector(`#btn-eject-${p._id}`)?.addEventListener("click", () => {
            onEjectParticipant?.(p._id, p.riderName);
            marker?.closePopup();
          });

        popupContent.querySelector(`#btn-marshal-${p._id}`)?.addEventListener("click", () => {
          const nextRole: ParticipantRole = isMarshal ? "rider" : "marshal";
          onRoleChange?.(p._id, nextRole);
          marker?.closePopup();
        });
          popupContent.querySelector(`#btn-marshal-${p._id}`)?.addEventListener("click", () => {
            const nextRole: ParticipantRole = isMarshal ? "rider" : "marshal";
            onRoleChange?.(p._id, nextRole);
            marker?.closePopup();
          });
        }

        marker.bindPopup(popupContent, {
          className: "rebel-map-popup",
          closeButton: false
        });
      });

      // If a participant was focused/selected, pan to their coordinates
      if (selectedParticipantId && markersRef.current.has(selectedParticipantId)) {
        const targetMarker = markersRef.current.get(selectedParticipantId);
        if (targetMarker) {
          map.panTo(targetMarker.getLatLng(), { animate: true });
          targetMarker.openPopup();
        }
      } else if (activeValidCoords.length > 0 && !initialFittedRef.current) {
        // Automatically frame all riders on initial coordinate load
        if (activeValidCoords.length === 1) {
          map.setView(activeValidCoords[0], 15, { animate: true });
        } else {
          map.fitBounds(L.latLngBounds(activeValidCoords), { padding: [50, 50], maxZoom: 15 });
        }
        initialFittedRef.current = true;
      }
    }

    void updateMarkers();
  }, [participants, selectedParticipantId, onSelectParticipant, onEjectParticipant, onRoleChange, onDirectMessage]);
  }, [participants, selectedParticipantId, onSelectParticipant, onEjectParticipant, onRoleChange, onDirectMessage, readOnly]);

  const handleRecenter = async () => {
    if (!mapInstanceRef.current) return;
    const L = await import("leaflet");
    const activeValidCoords: [number, number][] = participants
      .filter((p) => p.latitude && p.longitude && p.status !== "ejected" && p.status !== "left")
      .map((p) => [p.latitude!, p.longitude!] as [number, number]);

    if (activeValidCoords.length === 1) {
      mapInstanceRef.current.setView(activeValidCoords[0], 15, { animate: true });
    } else if (activeValidCoords.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(activeValidCoords), { padding: [50, 50], animate: true });
    } else {
      mapInstanceRef.current.setView([30.3165, 78.0322], 13, { animate: true });
    }
  };

  const activeCount = participants.filter(
    (p) => p.status === "active" && p.lastPingAt && Date.now() - new Date(p.lastPingAt).getTime() <= 45000
  ).length;
  const activeWithSpeed = participants.filter(
    (p) => p.status === "active" && (p.speed || 0) > 0 && p.lastPingAt && Date.now() - new Date(p.lastPingAt).getTime() <= 45000
  );
  const avgSpeed = activeWithSpeed.length
    ? Math.round(activeWithSpeed.reduce((sum, p) => sum + (p.speed || 0), 0) / activeWithSpeed.length)
    : 0;

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[380px] bg-[#0c0c0c] overflow-hidden rounded-xl border border-[#442b2a]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating HUD Telemetry Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#120e0e]/95 text-[#ffdad8] border border-[#552e2e] shadow-xl px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-md select-none pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white font-bold">{activeCount} Live</span>
        <span className="text-[#552e2e]">·</span>
        <span className="text-[#d8c3bc]">{avgSpeed} km/h</span>
      </div>

      {/* Floating Fit Squad Button */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Fit All Squad Riders"
        className="absolute top-3 right-3 z-[1000] bg-[#161212]/95 hover:bg-[#261818] text-[#ffdad8] border border-[#552e2e] shadow-xl px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors backdrop-blur-md cursor-pointer active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#ff535b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        </svg>
        <span className="hidden xs:inline">Fit Squad</span>
      </button>
    </div>
  );
}
