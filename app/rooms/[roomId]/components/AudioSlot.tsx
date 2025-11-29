// app/rooms/[roomId]/components/AudioSlot.tsx

"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioSlot({
  seatNumber,
  occupant,          // { uid, name, avatar, mic, audioTrack }
  isSelf,
  isHost,
  onInvite,
  onKick,
  onToggleMic,
}) {
  const [talking, setTalking] = useState(false);
  const audioLevelRef = useRef<any>(null);

  /* -------------------------------------------------------
     Aktif konuşma algılama
  -------------------------------------------------------- */
  useEffect(() => {
    if (!occupant?.audioTrack) return;

    const track = occupant.audioTrack;
    const interval = setInterval(() => {
      const level = track.getMonitorLevel?.() || 0;
      setTalking(level > 0.1);
    }, 200);

    return () => clearInterval(interval);
  }, [occupant?.audioTrack]);

  const isEmpty = !occupant;

  return (
    <div className="flex flex-col items-center select-none">
      
      {/* 🔵 SLOT ARTIK TAM YUVARLAK */}
      <div
        className={`
          w-[80px] h-[80px]
          rounded-full
          bg-white/5 border border-white/20
          flex items-center justify-center
          overflow-hidden relative
          ${talking ? "ring-2 ring-purple-400" : ""}
        `}
      >
        {/* BOŞ SLOT */}
        {isEmpty && (
          <div className="text-white/30 text-xs">
            Ses {seatNumber}
          </div>
        )}

        {/* DOLU SLOT */}
        {!isEmpty && (
          <>
            <img
              src={occupant.avatar}
              className="w-full h-full object-cover rounded-full"
            />

            {/* SELF → mikrofon ikonu */}
            {isSelf && onToggleMic && (
              <button
                onClick={onToggleMic}
                className="
                  absolute bottom-1 left-1
                  bg-black/40 hover:bg-black/60
                  p-1 rounded-md text-white text-sm
                "
              >
                {occupant.mic ? "🎙" : "🔇"}
              </button>
            )}

            {/* SELF → koltuktan in (⬇️) */}
            {isSelf && onKick && (
              <button
                onClick={() => onKick(seatNumber)}
                className="
                  absolute top-1 right-1
                  bg-white/20 hover:bg-white/30
                  text-white text-xs px-1.5 py-0.5 rounded
                "
              >
                ⬇️
              </button>
            )}

            {/* HOST → başkasını kaldır (✖) */}
            {isHost && !isSelf && onKick && (
              <button
                onClick={() => onKick(seatNumber)}
                className="
                  absolute top-1 right-1
                  bg-red-600 hover:bg-red-700
                  text-white text-xs px-1.5 py-0.5 rounded
                "
              >
                ✖
              </button>
            )}
          </>
        )}
      </div>

      {/* Kullanıcı adı */}
      <div className="text-xs text-white/70 mt-1">
        {isEmpty ? `Ses {seatNumber}` : occupant.name}
      </div>

      {/* SLOT BOŞSA - HOST DAVET */}
      {isHost && isEmpty && onInvite && (
        <button
          className="mt-1 px-3 py-1 text-xs bg-blue-600 rounded"
          onClick={() => onInvite(seatNumber)}
        >
          Davet Et
        </button>
      )}
    </div>
  );
}
