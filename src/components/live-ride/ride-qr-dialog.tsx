"use client";

import { Check, Download, ExternalLink, QrCode, Share2, Sparkles, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RideQrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideTitle: string;
  rideCode: string;
  startLocation?: string;
  destination?: string;
};

export function RideQrDialog({
  open,
  onOpenChange,
  rideTitle,
  rideCode,
  startLocation,
  destination
}: RideQrDialogProps) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setFullUrl(`${origin}/live-ride/${rideCode.toUpperCase()}`);
    }
  }, [rideCode]);

  if (!open) return null;

  function handleCopy() {
    if (!fullUrl) return;
    void navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      toast.success("Rider join link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Join Live Ride: ${rideTitle}`,
          text: `Join our live motorcycle formation radar on Rebels on Roads!\nRide Code: #${rideCode.toUpperCase()}`,
          url: fullUrl
        });
        return;
      } catch {
        // Fallback to copy if user cancelled share sheet
      }
    }
    handleCopy();
  }

  function handleDownloadQr() {
    try {
      const qrCanvas = qrContainerRef.current?.querySelector("canvas");
      if (!qrCanvas) {
        toast.error("QR Code canvas not found. Please try again.");
        return;
      }

      // Create a branded 640x800 flyer canvas for motorcycle squads
      const cardCanvas = document.createElement("canvas");
      cardCanvas.width = 640;
      cardCanvas.height = 800;
      const ctx = cardCanvas.getContext("2d");
      if (!ctx) return;

      // Dark Motorsport Background
      const grad = ctx.createLinearGradient(0, 0, 0, 800);
      grad.addColorStop(0, "#0e0a0a");
      grad.addColorStop(0.5, "#151010");
      grad.addColorStop(1, "#0a0707");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 800);

      // Outer Red Carbon Border
      ctx.strokeStyle = "#ff535b";
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 616, 776);

      // Inner Accent Framing
      ctx.strokeStyle = "#441a1c";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 20, 600, 760);

      // Brand Header
      ctx.fillStyle = "#ff535b";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("★ REBELS ON ROADS ★", 320, 65);

      ctx.fillStyle = "#cfbeb6";
      ctx.font = "13px monospace";
      ctx.fillText("TACTICAL LIVE FLEET RADAR", 320, 90);

      // Ride Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px sans-serif";
      const titleToDraw = rideTitle.length > 30 ? rideTitle.slice(0, 30) + "..." : rideTitle;
      ctx.fillText(titleToDraw, 320, 135);

      // Route if present
      if (startLocation || destination) {
        ctx.fillStyle = "#ffdad8";
        ctx.font = "14px monospace";
        const routeText = `${startLocation || "Start"}  →  ${destination || "Destination"}`;
        ctx.fillText(routeText, 320, 165);
      }

      // QR Code Container Box (White card with crisp shadow)
      const qrBoxSize = 350;
      const qrBoxX = (640 - qrBoxSize) / 2;
      const qrBoxY = 195;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 18);
      ctx.fill();

      // Draw QR Canvas onto White card
      const padding = 15;
      ctx.drawImage(
        qrCanvas,
        qrBoxX + padding,
        qrBoxY + padding,
        qrBoxSize - padding * 2,
        qrBoxSize - padding * 2
      );

      // Ride Code Pill
      ctx.fillStyle = "#1e1313";
      ctx.strokeStyle = "#ff535b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(140, 575, 360, 52, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`CODE: ${rideCode.toUpperCase()}`, 320, 608);

      // Instructions & Zero-Install Badge
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("Scan with Camera to Join Live Formation", 320, 665);

      ctx.fillStyle = "#a8958a";
      ctx.font = "12px monospace";
      ctx.fillText("Zero App Download · Runs directly in Chrome / Safari", 320, 692);

      // Footer Join Link
      ctx.fillStyle = "#ff535b";
      ctx.font = "12px monospace";
      const displayUrl = fullUrl.length > 50 ? fullUrl.slice(0, 50) + "..." : fullUrl;
      ctx.fillText(displayUrl, 320, 740);

      // Trigger Download
      const dataUrl = cardCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Rebels-Live-Ride-${rideCode.toUpperCase()}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(`Downloaded QR flyer for "${rideTitle}"!`);
    } catch (err) {
      console.error("QR Code download error:", err);
      toast.error("Failed to download QR code image");
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-lg sm:max-w-xl p-4 sm:p-5 bg-[#141010] border-[#552e2e] shadow-2xl rebel-frame rounded-2xl relative z-[10000] max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-[#3e2424] pb-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 shrink-0">
              <QrCode className="h-3 w-3" /> Live Formation QR
            </span>
            <span className="font-mono text-[10px] text-[#ffd700] font-bold bg-[#282010] px-1.5 py-0.5 rounded border border-[#554010] shrink-0">
              #{rideCode.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Scrollable Body: Side-by-Side on Desktop/Tablet, Clean Stack on Mobile */}
        <div className="overflow-y-auto pr-0.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[175px_1fr] gap-3.5 sm:gap-4 items-center">
            {/* Left Column: QR Code Display Card */}
            <div className="flex flex-col items-center justify-center p-3 bg-[#1b1414] border border-[#3e2424] rounded-xl shadow-inner">
              <div
                ref={qrContainerRef}
                className="p-2.5 bg-white rounded-xl shadow-[0_0_25px_rgba(255,83,91,0.2)] flex items-center justify-center"
              >
                <QRCodeCanvas
                  value={fullUrl || `https://rebelsonroads.com/live-ride/${rideCode}`}
                  size={155}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="text-center mt-2 space-y-0.5">
                <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider block">
                  Scan With Any Phone
                </span>
                <span className="text-[9px] font-mono text-[#a8958a] block">
                  Direct Safari / Chrome cockpit
                </span>
              </div>
            </div>

            {/* Right Column: Mission Details & Quick Actions */}
            <div className="space-y-2.5 font-mono text-xs min-w-0">
              {/* Title & Route */}
              <div>
                <h3 className="font-display text-lg sm:text-xl text-white truncate leading-tight">
                  {rideTitle}
                </h3>
                {(startLocation || destination) && (
                  <p className="text-[11px] text-[#ffb3b1] truncate mt-0.5 font-sans">
                    {startLocation || "Start"} → {destination || "Destination"}
                  </p>
                )}
              </div>

              {/* Action 1: Download Flyer Button */}
              <Button
                type="button"
                onClick={handleDownloadQr}
                className="w-full h-9 sm:h-10 bg-[#ff535b] hover:bg-[#ff3b44] text-white font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(255,83,91,0.25)] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download QR Code (PNG Flyer)
              </Button>

              {/* Action 2: Share / Copy Join Link */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase block font-bold">
                  Rider Join URL:
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 p-1.5 px-2 bg-[#0f0c0c] border border-[#442b2a] rounded text-[11px] text-[#ffdad8] truncate select-all">
                    {fullUrl}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="h-8 px-2.5 border-[#552e2e] text-[#ffdad8] hover:bg-[#251818] cursor-pointer shrink-0 text-xs flex items-center gap-1"
                    title="Copy or share link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5 text-[#ff535b]" />
                    )}
                    <span>{copied ? "Copied" : "Share"}</span>
                  </Button>
                </div>
              </div>

              {/* Action 3: Test Link */}
              <div className="pt-1.5 border-t border-[#352323] flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#00f0ff]" /> Live formation
                </span>
                <a
                  href={`/live-ride/${rideCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00f0ff] hover:text-[#5ce8ff] underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>Open Rider HUD</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
