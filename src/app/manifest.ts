import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rebels on Roads - Live Convoy Radar",
    short_name: "Rebels Radar",
    description: "Real-time tactical convoy radar and rider cockpit for Rebels on Roads",
    start_url: "/",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#d91b1b",
    orientation: "portrait",
    icons: [
      {
        src: "/images/rebels-on-roads-3d.png",
        sizes: "192x192 512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
