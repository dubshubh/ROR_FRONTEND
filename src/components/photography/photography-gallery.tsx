"use client";

import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, Expand, Film, Play, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ContentItem } from "@/types/content";

type GalleryAsset = {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  caption: string;
  collection: number;
};

export function PhotographyGallery({ items }: { items: ContentItem[] }) {
  const assets = useMemo(() => flattenAssets(items), [items]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((value) => value === null ? null : (value + 1) % assets.length);
      if (event.key === "ArrowLeft") setActiveIndex((value) => value === null ? null : (value - 1 + assets.length) % assets.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [activeIndex, assets.length]);

  if (!assets.length) return <div className="photo-empty rebel-frame"><Camera className="h-11 w-11" /><h2>The next frame is loading.</h2><p>Photos and films published by the command center will appear here.</p></div>;

  const active = activeIndex === null ? null : assets[activeIndex];
  return <>
    <div className="photo-grid">{assets.map((asset, index) => <GalleryTile asset={asset} index={index} onOpen={() => setActiveIndex(index)} key={asset.id} />)}</div>
    {active ? <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`${active.title} media viewer`} onMouseDown={(event) => event.target === event.currentTarget && setActiveIndex(null)}>
      <button className="photo-lightbox-close" type="button" onClick={() => setActiveIndex(null)} aria-label="Close viewer"><X /></button>
      {assets.length > 1 ? <><button className="photo-lightbox-nav is-prev" type="button" onClick={() => setActiveIndex((activeIndex! - 1 + assets.length) % assets.length)} aria-label="Previous media"><ChevronLeft /></button><button className="photo-lightbox-nav is-next" type="button" onClick={() => setActiveIndex((activeIndex! + 1) % assets.length)} aria-label="Next media"><ChevronRight /></button></> : null}
      <div className="photo-lightbox-stage">{active.type === "image" ? <Image src={active.url} alt={active.title} fill sizes="100vw" className="object-contain" priority /> : <video src={active.url} controls autoPlay playsInline className="h-full w-full object-contain" />}</div>
      <div className="photo-lightbox-caption"><span>{String(activeIndex! + 1).padStart(2, "0")} / {String(assets.length).padStart(2, "0")}</span><div><strong>{active.title}</strong>{active.caption ? <p>{active.caption}</p> : null}</div></div>
    </div> : null}
  </>;
}

function GalleryTile({ asset, index, onOpen }: { asset: GalleryAsset; index: number; onOpen: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.classList.add("is-visible"); observer.disconnect(); } }, { threshold: .14, rootMargin: "0px 0px -30px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function moveSpotlight(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--spot-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--spot-y", `${y * 100}%`);
    event.currentTarget.style.setProperty("--tilt-x", `${(0.5 - y) * 3.2}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x - 0.5) * 3.2}deg`);
  }
  function resetSpotlight(event: React.PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }

  return <article ref={ref} className={`photo-tile photo-tile-${index % 7}`} style={{ "--photo-delay": `${Math.min(index % 6, 4) * 55}ms` } as React.CSSProperties} onPointerMove={moveSpotlight} onPointerLeave={resetSpotlight}>
    <button type="button" onClick={onOpen} aria-label={`Open ${asset.type}: ${asset.title}`}>
      {asset.type === "image" ? <Image src={asset.url} alt={asset.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="photo-tile-media" /> : <HoverVideo asset={asset} />}
      <span className="photo-tile-shade" />
      <span className="photo-tile-spotlight" aria-hidden="true" />
      <span className="photo-tile-scan" aria-hidden="true" />
      <span className="photo-tile-type">{asset.type === "video" ? <Film className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}{asset.type}</span>
      {asset.type === "video" ? <span className="photo-tile-play"><Play className="h-6 w-6 fill-current" /></span> : null}
      <span className="photo-tile-expand"><Expand className="h-4 w-4" /></span>
      <span className="photo-tile-copy"><small>Road archive · {String(asset.collection).padStart(2, "0")}</small><strong>{asset.title}</strong></span>
    </button>
  </article>;
}

function HoverVideo({ asset }: { asset: GalleryAsset }) {
  const ref = useRef<HTMLVideoElement>(null);
  return <video ref={ref} src={asset.url} muted loop playsInline preload="metadata" className="photo-tile-media" onPointerEnter={() => ref.current?.play().catch(() => undefined)} onPointerLeave={() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; } }} />;
}

function flattenAssets(items: ContentItem[]): GalleryAsset[] {
  return items.flatMap((item, collection) => {
    const images = item.images?.length ? item.images : item.image ? [item.image] : [];
    return [
      ...images.map((asset, index) => ({ id: `${item._id}-image-${asset.publicId || index}`, type: "image" as const, url: asset.url, title: item.title, caption: item.description, collection: collection + 1 })),
      ...(item.videos ?? []).map((asset, index) => ({ id: `${item._id}-video-${asset.publicId || index}`, type: "video" as const, url: asset.url, title: item.title, caption: item.description, collection: collection + 1 }))
    ];
  });
}
