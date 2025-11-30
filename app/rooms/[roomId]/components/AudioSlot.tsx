"use client";

import { useEffect, useState } from "react";

export default function AudioSlot({
  seatNumber,
  occupant,        
  isSelf,
  isHost,
  onInvite,
  onKick,
  onToggleMic,
  onHostMute
}) {
  const [talking, setTalking] = useState(false);

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
    <div className="flex flex-col items-center select-none gap-1">

      {/* ------------------------- DÜŞÜRÜLMÜŞ SES SLOTU (40px) ------------------------- */}
      <div
        className={`
          w-[40px] h-[40px]        /* 🔥 50 → 40 */
          rounded-full
          bg-white/5 border border-white/20
          flex items-center justify-center
          overflow-hidden relative
          ${talking ? "ring-2 ring-purple-400" : ""}
        `}
      >
        {/* BOŞ SLOT */}
        {isEmpty && (
          <div className="text-white/30 text-[9px] text-center px-1 leading-[10px]">
            Ses {seatNumber}
          </div>
        )}

        {/* DOLU SLOT */}
        {!isEmpty && (
          <img
            src={occupant.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-full h-full object-cover rounded-full"
          />
        )}
      </div>

      {/* Kullanıcı adı */}
      <div className="text-[9px] text-white/70 mt-0.5 truncate w-[40px] text-center">
        {isEmpty ? `Ses ${seatNumber}` : occupant.name}
      </div>

      {/* -------------------------------------------------------
          SELF → ikonlar (küçültülmüş)
      -------------------------------------------------------- */}
      {!isEmpty && isSelf && (
        <div className="flex flex-row gap-1 mt-1">

          {/* 🎙 / 🔇 */}
          <button
            onClick={onToggleMic}
            className="
              bg-black/40 hover:bg-black/60
              px-1 py-[2px]
              rounded-full
              text-white text-[10px]
            "
            title="Mikrofon"
          >
            {occupant.mic ? "🎙" : "🔇"}
          </button>

          {/* Koltuktan in */}
          <button
            onClick={() => onKick(seatNumber)}
            className="
              bg-white/20 hover:bg-white/30
              px-1 py-[2px]
              rounded-full
              text-white text-[10px]
            "
            title="Koltuktan İn"
          >
            ⬇️
          </button>
        </div>
      )}

      {/* -------------------------------------------------------
          HOST → Sustur + Kaldır
      -------------------------------------------------------- */}
      {isHost && !isSelf && !isEmpty && (
        <div className="flex flex-row gap-1 mt-1">

          {/* Sustur */}
          <button
            onClick={() => onHostMute?.(occupant.uid)}
            className="
              bg-yellow-600 hover:bg-yellow-700
              px-1 py-[2px]
              rounded-full
              text-white text-[10px]
            "
            title="Sustur"
          >
            🔇
          </button>

          {/* Kaldır */}
          <button
            onClick={() => onKick(seatNumber)}
            className="
              bg-red-600 hover:bg-red-700
              px-1 py-[2px]
              rounded-full
              text-white text-[10px]
            "
            title="Kaldır"
          >
            ❌
          </button>
        </div>
      )}

      {/* -------------------------------------------------------
          Boş slot → Davet et
      -------------------------------------------------------- */}
      {isHost && isEmpty && onInvite && (
        <button
          className="mt-1 px-2 py-[2px] text-[9px] bg-blue-600 rounded"
          onClick={() => onInvite(seatNumber)}
        >
          Davet Et
        </button>
      )}
    </div>
  );
}
