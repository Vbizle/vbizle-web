"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioSlot({
  seatNumber,
  occupant,
  isSelf,
  isHost,
  onInvite,
  onKick,
  onToggleMic,
  onHostMute,
}) {
  const [talking, setTalking] = useState(false);

  // 🔥 Global audio element (track attach/detach için)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* -------------------------------------------------------
     🔥 MOBİL / AUTOPLAY FIX — play() zorla
  -------------------------------------------------------- */
  async function forcePlay(el: HTMLAudioElement) {
    try {
      await el.play();
    } catch (err) {
      console.warn("🔇 Audio play bloklandı, yeniden deneniyor...", err);
      setTimeout(() => {
        el.play().catch(() => {});
      }, 300);
    }
  }

  /* -------------------------------------------------------
     🔥 PROFESSIONAL AUDIO ATTACH / DETACH PIPELINE
     (TikTok/Bigo seviyesinde)
  -------------------------------------------------------- */
  useEffect(() => {
    const track = occupant?.audioTrack;
    if (!track) return;

    // Audio element yoksa oluştur
    if (!audioRef.current) {
      const el = document.createElement("audio");
      el.autoplay = true;
      el.playsInline = true;
      el.style.display = "none";

      // 🔊 Ses BEKLENİYOR (voice chat) → muted=false
      el.muted = false;

      document.body.appendChild(el);
      audioRef.current = el;
    }

    const el = audioRef.current;

    // Eski detach (farklı track'ten geldiyse)
    try {
      track.detach(el);
    } catch {}

    // Yeni attach
    try {
      track.attach(el);
    } catch {}

    // 🔥 HER attach sonrası play() zorla
    forcePlay(el);

    return () => {
      try {
        track.detach(el);
      } catch {}
    };
  }, [occupant?.audioTrack]);

  /* -------------------------------------------------------
     🔥 KONUŞMA ALGILAMA (ses seviyesi)
  -------------------------------------------------------- */
  useEffect(() => {
    if (!occupant?.audioTrack) return;

    const track = occupant.audioTrack;

    const interval = setInterval(() => {
      const level = track.getMonitorLevel?.() || 0;
      setTalking(level > 0.1); // threshold
    }, 200);

    return () => clearInterval(interval);
  }, [occupant?.audioTrack]);

  const isEmpty = !occupant;

  return (
    <div className="flex flex-col items-center select-none gap-1">
      {/* -------------------------------------------------
           SES SLOTU (40px) + Konuşma animasyonu
      -------------------------------------------------- */}
      <div
        className={`
          w-[40px] h-[40px]
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

      {/* -------------------------------------------------
           SELF — Kullanıcı kendi slotundaysa
      -------------------------------------------------- */}
      {!isEmpty && isSelf && (
        <div className="flex flex-row gap-1 mt-1">
          {/* Mikrofon */}
          <button
            onClick={onToggleMic}
            className="
              bg-black/40 hover:bg-black/60
              px-1 py-[2px]
              rounded-full
              text-white text-[10px]
            "
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
          >
            ⬇️
          </button>
        </div>
      )}

      {/* -------------------------------------------------
          HOST → Yönetim seçenekleri
      -------------------------------------------------- */}
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
          >
            ❌
          </button>
        </div>
      )}

      {/* -------------------------------------------------
          HOST — Boş slot → Davet Et
      -------------------------------------------------- */}
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
