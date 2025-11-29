"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  nickname: string;
  isOccupied: boolean;
  isSelf: boolean;
  isHost: boolean;
  cameraOn: boolean;
  micOn: boolean;
  onToggleCamera?: () => void;
  onToggleMic?: () => void;
  onLeave?: () => void;

  localTrack?: any;
  remoteTrack?: any;
};

export default function CameraSlot({
  nickname,
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
}: Props) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<any>(null);
  const [showControls, setShowControls] = useState(false);

  /* ------------------------------------------------------------------
     FIX: Video DOM ASLA silinmez, sadece track değişince yeniden attach
  ------------------------------------------------------------------ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const track = isSelf ? localTrack : remoteTrack;
    if (!track || !cameraOn) {
      if (videoRef.current) videoRef.current.style.display = "none";
      return;
    }

    // Video elementi sadece bir kez oluşturulur
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = isSelf; // self video muted
      videoRef.current.style.width = "100%";
      videoRef.current.style.height = "100%";
      videoRef.current.style.objectFit = "cover";
      container.appendChild(videoRef.current);
    }

    // Mirror
    videoRef.current.style.transform = "scaleX(-1)";

    // Attach track
    track.attach(videoRef.current);

    videoRef.current.style.display = "block";

    return () => {};
  }, [localTrack, remoteTrack, cameraOn, isSelf]);


  return (
    <div className="flex flex-col items-center gap-2 select-none">

      <div
        className="
          relative
          w-[130px] h-[130px]
          rounded-full
          bg-white/5
          border border-white/20
          overflow-hidden
          flex items-center justify-center
        "
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={() => setShowControls(!showControls)}
      >

        <div ref={containerRef} className="absolute inset-0" />

        {/* Kamera kapalıysa yazı */}
        {isOccupied && !cameraOn && (
          <span className="text-[11px] text-white/60 z-10">
            Kamera Kapalı
          </span>
        )}

        {!isOccupied && (
          <span className="text-[11px] text-white/30 z-10">
            {isHost ? "Host Koltuğu" : "Misafir Koltuğu"}
          </span>
        )}

        {/* Overlay kontrol butonları */}
        {isOccupied && isSelf && showControls && (
          <div
            className="
              absolute inset-0
              bg-black/60 backdrop-blur-sm
              flex items-center justify-center gap-3 z-20
            "
          >
            <button
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCamera && onToggleCamera();
              }}
            >
              {cameraOn ? "🎥" : "🚫"}
            </button>

            <button
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMic && onToggleMic();
              }}
            >
              {micOn ? "🎙" : "🔇"}
            </button>

            <button
              className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-lg"
              onClick={(e) => {
                e.stopPropagation();
                onLeave && onLeave();
              }}
            >
              ⏹
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-white/80 mt-1">{nickname}</p>
    </div>
  );
}
