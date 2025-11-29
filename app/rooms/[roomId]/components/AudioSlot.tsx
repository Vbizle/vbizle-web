// app/rooms/[roomId]/components/AudioSlot.tsx

"use client";

import { useEffect, useState } from "react";

export default function AudioSlot({
  seatNumber,
  occupant,          // { uid, name, avatar, mic, audioTrack }
  isSelf,
  isHost,
  onInvite,
  onKick,
  onToggleMic,        // self için mic toggle
  onHostMute          // HOST → diğer kullanıcıyı sustur
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
    <div className="flex flex-col items-center select-none">

      {/* 🔵 YUVARLAK SLOT */}
      <div
        className={`
          w-[70px] h-[70px]
          rounded-full
          bg-white/5 border border-white/20
          flex items-center justify-center
          overflow-hidden relative
          ${talking ? "ring-2 ring-purple-400" : ""}
        `}
      >
        {/* BOŞ SLOT */}
        {isEmpty && (
          <div className="text-white/30 text-xs text-center px-1">
            Ses {seatNumber}
          </div>
        )}

        {/* DOLU SLOT */}
        {!isEmpty && (
          <img
            src={occupant.avatar}
            className="w-full h-full object-cover rounded-full"
          />
        )}
      </div>

      {/* Kullanıcı adı */}
      <div className="text-xs text-white/70 mt-1 truncate w-[70px] text-center">
        {isEmpty ? `Ses ${seatNumber}` : occupant.name}
      </div>

      {/* ======================================================
          SELF → İKONLAR
      ====================================================== */}
      {!isEmpty && isSelf && (
        <div className="flex flex-row gap-2 mt-1">

          {/* 🎙 / 🔇 (KENDİ MİK) */}
          <button
            onClick={onToggleMic}
            className="
              bg-black/40 hover:bg-black/60
              p-1.5 rounded-full
              text-white text-sm
            "
            title="Mikrofon"
          >
            {occupant.mic ? "🎙" : "🔇"}
          </button>

          {/* ⬇️ Koltuktan in */}
          <button
            onClick={() => onKick(seatNumber)}
            className="
              bg-white/20 hover:bg-white/30
              p-1.5 rounded-full
              text-white text-sm
            "
            title="Koltuktan İn"
          >
            ⬇️
          </button>
        </div>
      )}

      {/* ======================================================
          HOST → SUSTUR & KALDIR İKONLARI
      ====================================================== */}
      {isHost && !isSelf && !isEmpty && (
        <div className="flex flex-row gap-2 mt-1">

          {/* 🔇 HOST → Sustur */}
          <button
            onClick={() => onHostMute?.(occupant.uid)}
            className="
              bg-yellow-600 hover:bg-yellow-700
              p-1.5 rounded-full
              text-white text-sm
            "
            title="Sustur"
          >
            🔇
          </button>

          {/* ❌ HOST → Kaldır */}
          <button
            onClick={() => onKick(seatNumber)}
            className="
              bg-red-600 hover:bg-red-700
              p-1.5 rounded-full
              text-white text-sm
            "
            title="Kaldır"
          >
            ❌
          </button>
        </div>
      )}

      {/* 🔵 BOŞ SLOT → DAVET ET */}
      {isHost && isEmpty && onInvite && (
        <button
          className="mt-2 px-3 py-1 text-xs bg-blue-600 rounded"
          onClick={() => onInvite(seatNumber)}
        >
          Davet Et
        </button>
      )}
    </div>
  );
}
