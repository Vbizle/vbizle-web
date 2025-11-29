"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  seatNumber: number;
  nickname: string;
  avatar?: string | null;

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
  remoteTrack
}: Props) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<any>(null);
  const [showControls, setShowControls] = useState(false);

  /* -------------------------------------------------------
     VIDEO DOM — sadece track varsa gösterilir
  ------------------------------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const track = isSelf ? localTrack : remoteTrack;

    // Kamera kapalı → video tamamen gizle
    if (!track || !cameraOn) {
      if (videoRef.current) videoRef.current.style.display = "none";
      return;
    }

    // Video element create
    if (!videoRef.current) {
      videoRef.current = document.createElement("video");
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = isSelf;
      videoRef.current.style.width = "100%";
      videoRef.current.style.height = "100%";
      videoRef.current.style.objectFit = "cover";
      videoRef.current.style.transform = "scaleX(-1)";
      container.appendChild(videoRef.current);
    }

    track.attach(videoRef.current);
    videoRef.current.style.display = "block";

  }, [localTrack, remoteTrack, cameraOn, isSelf]);


  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="flex flex-col items-center gap-2 select-none">

      <div
        className="
          relative
          w-[130px] h-[130px]
          rounded-xl               /* 🔥 Kare + hafif oval */
          bg-white/5
          border border-white/20
          overflow-hidden
          flex items-center justify-center
        "
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={() => setShowControls(!showControls)}
      >

        {/* CAM CONTAINER */}
        <div ref={containerRef} className="absolute inset-0" />

        {/* -------------------------------------------------------
            SLOT BOŞ → SEATNUMBER + "Boş"
        ------------------------------------------------------- */}
        {!isOccupied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <p className="text-white/30 text-xs">{seatNumber}</p>
            <p className="text-white/40 text-[11px]">Boş</p>
          </div>
        )}

        {/* -------------------------------------------------------
            SLOT DOLU AMA KAMERA KAPALI → AVATAR
        ------------------------------------------------------- */}
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

        {/* -------------------------------------------------------
            SELF CONTROLS
        ------------------------------------------------------- */}
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

      {/* -------------------------------------------------------
          NICKNAME (slot doluysa)
      ------------------------------------------------------- */}
      <p className="text-xs text-white/80 mt-1">
        {isOccupied ? nickname : `${seatNumber}. Koltuk`}
      </p>

    </div>
  );
}
