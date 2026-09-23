"use client";

import { useEffect, useRef, useState } from "react";
import type { Participant, ParticipantRole } from "@/types/live-ride";

type TacticalMapProps = {
  participants: Participant[];
  selectedParticipantId?: string | null;
  onSelectParticipant?: (id: string) => void;
  onEjectParticipant?: (id: string, name: string) => void;
  onRoleChange?: (id: string, role: ParticipantRole) => void;
  onDirectMessage?: (id: string, name: string) => void;
  readOnly?: boolean;
  clockOffset?: number;
  myParticipantId?: string | null;
  className?: string;
};

export function TacticalMap({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  onEjectParticipant,
  onRoleChange,
  onDirectMessage,
  readOnly = false,
  clockOffset = 0,
  myParticipantId,
  className = ""
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const initialFittedRef = useRef(false);
  const prevSelectedIdRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      // Default center: Dehradun, India [30.3165, 78.0322]
      const defaultCenter: [number, number] = [30.3165, 78.0322];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Dark Gray Canvas Base
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxNativeZoom: 16,
          maxZoom: 19
        }
      ).addTo(map);

      // High-contrast Road Labels Overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          maxNativeZoom: 16,
          maxZoom: 19,
          opacity: 0.85
        }
      ).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
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

  // ResizeObserver: auto-invalidate map size on device orientation or container size change
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [mapReady]);

  // Update markers when participants or selection change
  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current) return;
      const L = await import("leaflet");
      const map = mapInstanceRef.current;

      const currentIds = new Set(participants.map((p) => p._id));

      // Remove obsolete markers
      for (const [id, marker] of markersRef.current.entries()) {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }

      const activeValidCoords: [number, number][] = [];

      participants.forEach((p, idx) => {
        // Skip only if participant is ejected or left
        if (p.status === "ejected" || p.status === "left") {
          if (markersRef.current.has(p._id)) {
            markersRef.current.get(p._id)!.remove();
            markersRef.current.delete(p._id);
          }
          return;
        }

        const hasLiveGps = Boolean(
          typeof p.latitude === "number" &&
            typeof p.longitude === "number" &&
            (p.latitude !== 0 || p.longitude !== 0)
        );
        const angle = (idx * 137.5 * Math.PI) / 180;
        const resolvedLat = hasLiveGps
          ? p.latitude!
          : Number((30.3165 + Math.cos(angle) * 0.0008).toFixed(6));
        const resolvedLng = hasLiveGps
          ? p.longitude!
          : Number((78.0322 + Math.sin(angle) * 0.0008).toFixed(6));

        const latLng: [number, number] = [resolvedLat, resolvedLng];
        activeValidCoords.push(latLng);

        const isMe = p._id === myParticipantId;
        const isLead = p.role === "lead";
        const isMarshal = p.role === "marshal";
        const isSweeper = p.role === "sweeper";
        const isPillion = p.role === "pillion" || Boolean(p.isPillion);
        const isSelected = p._id === selectedParticipantId;

        // Offline detection: no ping in the last 45 seconds (adjusted for server clock skew)
        const adjustedNow = Date.now() + (clockOffset || 0);
        const lastPingMs = p.lastPingAt ? new Date(p.lastPingAt).getTime() : 0;
        const diffMs = Math.max(0, adjustedNow - lastPingMs);
        const isOffline = !lastPingMs || diffMs > 45000;

        let timeAgoText = "just now";
        if (isOffline && lastPingMs > 0) {
          const diffSec = Math.floor(diffMs / 1000);
          if (diffSec < 60) timeAgoText = `${diffSec}s ago`;
          else if (diffSec < 3600) timeAgoText = `${Math.floor(diffSec / 60)}m ago`;
          else timeAgoText = `${Math.floor(diffSec / 3600)}h ago`;
        }

        // Color coding: Lead (Gold), Marshal (Cyan), Sweeper (Purple), Pillion (Orange), Me (Emerald), Rider (Rebel Red)
        const roleColor = isMe
          ? "#10b981"
          : isLead
          ? "#ffd700"
          : isMarshal
          ? "#00f0ff"
          : isSweeper
          ? "#a855f7"
          : isPillion
          ? "#f97316"
          : "#ff535b";

        const primaryColor = isOffline ? "#f59e0b" : roleColor;
        const roleLabel = isLead
          ? "LEAD CAPTAIN"
          : isMarshal
          ? "MARSHAL (DIRECTION)"
          : isSweeper
          ? "TAIL SWEEPER"
          : isPillion
          ? "PILLION PASSENGER"
          : "SQUAD RIDER";

        const firstName = p.riderName.split(" ")[0] || p.riderName;
        const hasAvatar = Boolean(p.profileImage && p.profileImage.trim());
        const isMoving = (p.speed || 0) >= 3;

        const iconHtml = `
          <div class="relative flex flex-col items-center justify-center select-none cursor-pointer group" style="touch-action: manipulation;">
            <!-- Outer Pulsing Radar Beacon (for current user 'YOU' or selected rider) -->
            ${
              isMe && !isOffline
                ? `<span class="absolute -top-1 w-12 h-12 rounded-full bg-emerald-500/25 animate-ping pointer-events-none"></span>`
                : isSelected
                ? `<span class="absolute -top-1 w-12 h-12 rounded-full bg-white/20 animate-ping pointer-events-none"></span>`
                : ""
            }

            <!-- Heading Pointer & Core Icon -->
            <div class="relative flex items-center justify-center transition-transform duration-300" style="transform: rotate(${p.heading || 0}deg);">
              <!-- Center Core Circle: Avatar Photo or Tactical Glyphs -->
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.9)] transition-all duration-200 ${
                isSelected
                  ? "scale-115 ring-2 ring-white ring-offset-2 ring-offset-black"
                  : "group-hover:scale-105"
              }" style="background-color: #120e0e; border: 2.5px ${
                isOffline ? "dashed #f59e0b" : `solid ${primaryColor}`
              }; filter: ${isOffline ? "grayscale(40%)" : "none"}; opacity: ${isOffline ? "0.85" : "1"};">
                ${
                  hasAvatar
                    ? `<img src="${p.profileImage}" alt="${p.riderName}" class="w-full h-full object-cover rounded-full" />`
                    : isLead
                    ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" style="color: ${primaryColor};" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>`
                    : isMarshal
                    ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" style="color: ${primaryColor};" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
                      </svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" style="color: ${primaryColor};" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="6"/>
                      </svg>`
                }
              </div>

              <!-- Direction Pointer Nose Chevron (oriented along heading when moving) -->
              ${
                isMoving
                  ? `<div class="absolute -top-2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] filter drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" style="border-bottom-color: ${primaryColor}; transform: translateY(-4px);"></div>`
                  : `<div class="absolute -top-1 w-2 h-2 rounded-full shadow" style="transform: translateY(-6px); background-color: ${primaryColor}; border: 1.5px solid #ffffff;"></div>`
              }
            </div>

            <!-- Rider Name Pill Badge (docked right under marker) -->
            <div class="mt-1 px-1.5 py-0.5 rounded-md bg-[#0a0808]/95 border ${
              isMe
                ? "border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : isOffline
                ? "border-amber-500/50"
                : "border-[#442b2b]"
            } text-[10px] font-mono text-white font-semibold whitespace-nowrap shadow-xl flex items-center gap-1 backdrop-blur-md pointer-events-none">
              ${isMe ? '<span class="text-emerald-400 font-extrabold text-[9px] tracking-wider">YOU</span>' : ""}
              ${!isMe && isLead ? '<span class="text-[#ffd700] text-[9px] font-bold">★</span>' : ""}
              ${!isMe && isMarshal ? '<span class="text-[#00f0ff] text-[9px] font-bold">M</span>' : ""}
              ${!isMe && isPillion ? '<span class="text-[#f97316] text-[9px] font-bold">P</span>' : ""}
              <span class="max-w-[70px] truncate">${isMe ? "" : firstName}</span>
              ${
                isOffline
                  ? `<span class="text-amber-400 font-mono text-[9px] font-bold">OFF</span>`
                  : p.speed > 0
                  ? `<span class="text-[#ff535b] font-mono font-bold">${p.speed}k</span>`
                  : ""
              }
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-bike-marker",
          iconSize: [44, 60],
          iconAnchor: [22, 20]
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
        popupContent.className = "p-3 min-w-[220px] max-w-[270px] text-[#e5e2e1] font-mono select-text";
        popupContent.innerHTML = `
          <div class="flex items-center gap-2.5 border-b border-[#352323] pb-2.5 mb-2.5">
            ${
              hasAvatar
                ? `<img src="${p.profileImage}" alt="${p.riderName}" class="w-10 h-10 rounded-full object-cover shrink-0 border-2 shadow" style="border-color: ${primaryColor}; filter: ${
                    isOffline ? "grayscale(30%)" : "none"
                  };" />`
                : `<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0 shadow font-sans" style="background-color: ${primaryColor};">
                    ${(firstName[0] || "R").toUpperCase()}
                  </div>`
            }
            <div class="min-w-0 flex-1">
              <strong class="text-sm text-white font-sans truncate block leading-snug">${
                p.riderName
              } ${isMe ? '<span class="text-emerald-400 text-xs font-mono font-normal">(You)</span>' : ""}</strong>
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
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
                      </span>`
                }
              </div>
            </div>
          </div>

          <div class="text-[11px] space-y-1.5 text-[#aaa]">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Status:</span>
              <strong class="${isOffline ? "text-amber-400" : "text-emerald-400"} font-bold">
                ${isOffline ? `Offline (${timeAgoText})` : "Live Signal"}
              </strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Bike:</span>
              <strong class="text-[#eee] truncate max-w-[130px]">${p.bikeModel} ${
          p.bikeNumber ? `(${p.bikeNumber})` : ""
        }${p.pillionRiderName ? ` · with ${p.pillionRiderName}` : ""}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">${isOffline ? "Last Speed:" : "Speed:"}</span>
              <strong class="text-[#ff535b] font-bold text-xs">${
                isOffline ? "0 km/h (Stationary)" : `${p.speed} km/h`
              }</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Coordinates:</span>
              <strong class="text-white text-[10px]">${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Accuracy:</span>
              <strong class="text-emerald-400">±${p.accuracy}m</strong>
            </div>
            ${
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

          ${
            readOnly
              ? `
              <div class="mt-2.5 pt-2 border-t border-[#352323] text-center">
                <span class="text-[10px] font-mono text-[#a3908a] uppercase tracking-wider flex items-center justify-center gap-1.5">
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
                  <button id="btn-marshal-${p._id}" class="text-[10px] font-mono uppercase px-2 py-1.5 bg-[#16272e] hover:bg-[#1f3742] text-[#00f0ff] border border-[#00f0ff]/40 rounded transition cursor-pointer">
                    ${isMarshal ? "Demote" : "Make Marshal"}
                  </button>
                  <button id="btn-eject-${p._id}" class="text-[10px] font-mono uppercase px-2 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/50 rounded transition cursor-pointer">
                    Eject
                  </button>
                </div>
              </div>
            `
          }
        `;

        if (!readOnly) {
          popupContent.querySelector(`#btn-direct-${p._id}`)?.addEventListener("click", () => {
            onDirectMessage?.(p._id, p.riderName);
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
        }

        marker.bindPopup(popupContent, {
          className: "rebel-map-popup",
          closeButton: false,
          autoPan: true,
          autoPanPaddingTopLeft: [24, 72],
          autoPanPaddingBottomRight: [24, 36]
        });
      });

      // Pan to selected participant ONLY when selection actively changes
      if (selectedParticipantId && markersRef.current.has(selectedParticipantId)) {
        if (prevSelectedIdRef.current !== selectedParticipantId) {
          prevSelectedIdRef.current = selectedParticipantId;
          const targetMarker = markersRef.current.get(selectedParticipantId);
          if (targetMarker) {
            map.setView(targetMarker.getLatLng(), 15, { animate: true });
            targetMarker.openPopup();
          }
        }
      } else if (!selectedParticipantId) {
        prevSelectedIdRef.current = null;
      }

      // Automatically frame all riders on initial coordinate load
      if (activeValidCoords.length > 0 && !initialFittedRef.current) {
        if (activeValidCoords.length === 1) {
          map.setView(activeValidCoords[0], 15, { animate: true });
        } else {
          map.fitBounds(L.latLngBounds(activeValidCoords), { padding: [40, 40], maxZoom: 15 });
        }
        initialFittedRef.current = true;
      }
    }

    void updateMarkers();
  }, [
    participants,
    selectedParticipantId,
    onSelectParticipant,
    onEjectParticipant,
    onRoleChange,
    onDirectMessage,
    readOnly,
    clockOffset,
    myParticipantId
  ]);

  // Center on current rider
  const handleCenterOnMe = () => {
    if (!mapInstanceRef.current || !myParticipantId) return;
    const targetMarker = markersRef.current.get(myParticipantId);
    if (targetMarker) {
      mapInstanceRef.current.setView(targetMarker.getLatLng(), 16, { animate: true });
      targetMarker.openPopup();
    }
  };

  // Fit all squad riders in view
  const handleRecenter = async () => {
    if (!mapInstanceRef.current) return;
    const L = await import("leaflet");
    const activeValidCoords: [number, number][] = [];
    for (const marker of markersRef.current.values()) {
      const ll = marker.getLatLng();
      activeValidCoords.push([ll.lat, ll.lng]);
    }

    if (activeValidCoords.length === 1) {
      mapInstanceRef.current.setView(activeValidCoords[0], 15, { animate: true });
    } else if (activeValidCoords.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(activeValidCoords), { padding: [40, 40], maxZoom: 16, animate: true });
    } else {
      mapInstanceRef.current.setView([30.3165, 78.0322], 14, { animate: true });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const adjustedNow = Date.now() + (clockOffset || 0);
  const activeCount = participants.filter(
    (p) => p.status === "active" && p.lastPingAt && Math.max(0, adjustedNow - new Date(p.lastPingAt).getTime()) <= 45000
  ).length;

  const activeWithSpeed = participants.filter(
    (p) =>
      p.status === "active" &&
      (p.speed || 0) > 0 &&
      p.lastPingAt &&
      Math.max(0, adjustedNow - new Date(p.lastPingAt).getTime()) <= 45000
  );

  const avgSpeed = activeWithSpeed.length
    ? Math.round(activeWithSpeed.reduce((sum, p) => sum + (p.speed || 0), 0) / activeWithSpeed.length)
    : 0;

  const hasMyCoords = Boolean(
    myParticipantId &&
      participants.some(
        (p) => p._id === myParticipantId && p.status !== "ejected" && p.status !== "left"
      )
  );

  return (
    <div
      className={`relative isolate z-0 w-full h-full min-h-[360px] bg-[#080707] overflow-hidden rounded-2xl border border-[#3e2424] shadow-2xl ${className}`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top-Left: Minimal Telemetry Chip */}
      <div className="absolute top-2.5 left-2.5 z-[1000] bg-[#0c0909]/90 text-[#ffdad8] border border-[#3e2424] shadow-xl px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-md select-none pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white font-bold">{activeCount} Live</span>
        <span className="text-[#552e2e]">·</span>
        <span className="text-[#d8c3bc]">{avgSpeed} km/h avg</span>
      </div>

      {/* Top-Right: Clean Floating Tactical Control Bar */}
      <div className="absolute top-2.5 right-2.5 z-[1000] flex items-center gap-1.5">
        {/* Re-center on user's bike (if coordinates available) */}
        {hasMyCoords && (
          <button
            type="button"
            onClick={handleCenterOnMe}
            title="Center on My Location"
            aria-label="Center on My Location"
            className="h-8 px-2.5 bg-[#0e0a0a]/90 hover:bg-[#1a1414] active:scale-95 text-emerald-400 border border-emerald-500/50 shadow-xl rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
            <span className="hidden xs:inline">You</span>
          </button>
        )}

        {/* Fit Squad View */}
        <button
          type="button"
          onClick={handleRecenter}
          title="Fit All Squad Riders"
          aria-label="Fit All Squad Riders"
          className="h-8 px-2.5 bg-[#0e0a0a]/90 hover:bg-[#1a1414] active:scale-95 text-[#ffdad8] border border-[#3e2424] hover:border-[#ff535b] shadow-xl rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-[#ff535b]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
          <span className="hidden xs:inline">Squad</span>
        </button>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center rounded-lg bg-[#0e0a0a]/90 border border-[#3e2424] shadow-xl overflow-hidden backdrop-blur-md">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom In"
            className="w-8 h-8 flex items-center justify-center text-[#ffdad8] hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer font-bold text-sm"
          >
            +
          </button>
          <div className="w-px h-4 bg-[#3e2424]" />
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom Out"
            className="w-8 h-8 flex items-center justify-center text-[#ffdad8] hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer font-bold text-sm"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
