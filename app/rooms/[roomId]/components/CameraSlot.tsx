"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraSlot({
  seatNumber,
  nickname,
  avatar,
  isOccupied,
  isSelf,
  isHost,
  cameraOn,
  micOn,
  onToggleCamera,
  onToggleMic,
  onLeave,
  localTrack,
  remoteTrack,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showControls, setShowControls] = useState(false);

  /* -------------------------------------------------------
     🔥 ZORUNLU MOBİL FIX — autoplay + unmute
  ------------------------------------------------------- */
  async function safePlay(video: HTMLVideoElement) {
    try {
      await video.play();
    } catch {
      setTimeout(() => {
        video.play().catch(() => {});
      }, 300);
    }
  }

  /* -------------------------------------------------------
     🔥 ANA FIX — Tüm cihazlarda %100 senkron track attach
  ------------------------------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeTrack = isSelf ? localTrack : remoteTrack;

    // Kamera kapalıysa video gizle
    if (!cameraOn || !activeTrack) {
      if (videoRef.current) videoRef.current.style.display = "none";
      return;
    }

    // Video element yoksa oluştur
    if (!videoRef.current) {
      const v = document.createElement("video");

      v.autoplay = true;
      v.playsInline = true;
      v.muted = true; // autoplay için zorunlu
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "cover";
      v.style.transform = "scaleX(-1)";

      container.appendChild(v);
      videoRef.current = v;
    }

    const video = videoRef.current;

    // Tüm eski track bağlantılarını temizle
    try {
      localTrack?.detach(video);
    } catch {}
    try {
      remoteTrack?.detach(video);
    } catch {}

    // Yeni track'i bağla
    try {
      activeTrack.attach(video);
      video.style.display = "block";
    } catch (err) {
      console.warn("Video attach error:", err);
    }

    // Zorunlu play (mobil)
    safePlay(video);

    // Self değilse 200ms sonra unmute
    if (!isSelf) {
      setTimeout(() => {
        video.muted = false;
      }, 200);
    }

    return () => {
      try {
        activeTrack.detach(video);
      } catch {}
    };
  }, [localTrack, remoteTrack, cameraOn, isSelf]);

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className="relative w-[120px] h-[120px] rounded-xl bg-white/5 border border-white/20
                   overflow-hidden flex items-center justify-center"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={() => setShowControls(!showControls)}
      >
        <div ref={containerRef} className="absolute inset-0" />

        {/* BOŞ SLOT */}
        {!isOccupied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <p className="text-white/30 text-xs">{seatNumber}</p>
            <p className="text-white/40 text-[11px]">Boş</p>
          </div>
        )}

        {/* KAMERA KAPALI */}
        {isOccupied && !cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <p className="text-white/60 text-xs">Kamera Kapalı</p>
            )}
          </div>
        )}

        {/* KONTROLLER */}
        {isOccupied && isSelf && showControls && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm
                       flex items-center justify-center gap-3 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCamera?.();
              }}
            >
              {cameraOn ? "🎥" : "🚫"}
            </button>

            <button
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMic?.();
              }}
            >
              {micOn ? "🎙" : "🔇"}
            </button>

            <button
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-lg"
              onClick={(e) => {
                e.stopPropagation();
                onLeave?.();
              }}
            >
              ⏹
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-white/80 mt-1">
        {isOccupied ? nickname : `${seatNumber}. Koltuk`}
      </p>
    </div>
  );
}
