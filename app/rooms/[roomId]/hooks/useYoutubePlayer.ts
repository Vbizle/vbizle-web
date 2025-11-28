"use client";

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useYoutubePlayer(room: any, user: any, roomId: string, containerRef: any) {
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const isHost = user?.uid === room?.ownerId;

  /* ------------------------------------------------
     1) API LOAD — MOBILE + RENDER SAFE
  ------------------------------------------------ */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    // Script varsa yenisini ekleme
    if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "yt-api-script";
      document.body.appendChild(tag);
    }

    // Fallback polling
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        setApiReady(true);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  /* ------------------------------------------------
     2) PLAYER INIT — MOBILE AUTOPLAY FIX
  ------------------------------------------------ */
  useEffect(() => {
    if (!apiReady) return;
    if (!room?.youtube) return;

    const el = containerRef.current;
    if (!el) return;

    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    playerRef.current = new window.YT.Player(el, {
      videoId: room.youtube,
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        controls: isHost ? 1 : 0,
        disablekb: isHost ? 0 : 1,
        rel: 0,
        modestbranding: 1,

        // 🔥 MOBİL AUTOPLAY İÇİN EN ÖNEMLİ KISIM
        mute: 1, // ilk açılışta sessiz (mobil policy)
      },

      events: {
        onReady: () => {
          setPlayerReady(true);

          try {
            if (room.videoTime) {
              playerRef.current.seekTo(room.videoTime, true);
            }

            playerRef.current.playVideo();

            // 🔥 Sessiz başlattık, host için 1 saniye sonra sesi geri açarız
            setTimeout(() => {
              if (isHost) {
                playerRef.current.unMute?.();
                playerRef.current.setVolume(room.videoVolume ?? 100);
              }
            }, 800);

          } catch {}
        },

        onStateChange: async (e: any) => {
          if (!isHost) return;

          const st = e.data;

          if (st === 1 || st === 2) {
            let cur = 0;

            try {
              cur = playerRef.current.getCurrentTime();
            } catch {}

            await updateDoc(doc(db, "rooms", roomId), {
              playerState: st,
              videoTime: cur,
              lastUpdate: serverTimestamp(),
            });
          }
        }
      }
    });

  }, [apiReady, room?.youtube]);

  /* ------------------------------------------------
     3) HOST VOLUME SYNC
  ------------------------------------------------ */
  useEffect(() => {
    if (!playerReady) return;
    if (!isHost) return;

    const interval = setInterval(async () => {
      if (!playerRef.current) return;

      const vol = playerRef.current.getVolume?.();

      if (vol !== null && vol !== room.videoVolume) {
        await updateDoc(doc(db, "rooms", roomId), { videoVolume: vol });
      }

    }, 300);

    return () => clearInterval(interval);
  }, [playerReady, isHost, room.videoVolume]);

  /* ------------------------------------------------
     4) GUEST FOLLOW HOST VOLUME
  ------------------------------------------------ */
  useEffect(() => {
    if (!playerReady) return;
    if (isHost) return;

    playerRef.current?.setVolume?.(room.videoVolume ?? 100);

  }, [playerReady, room.videoVolume]);

  /* ------------------------------------------------
     5) GUEST SYNC SEEK + PLAY/PAUSE
  ------------------------------------------------ */
  useEffect(() => {
    if (!playerReady) return;
    if (isHost) return;

    let target = room.videoTime || 0;
    const last = room.lastUpdate;

    if (room.playerState === 1 && last?.toMillis) {
      const diff = (Date.now() - last.toMillis()) / 1000;
      target += diff;
    }

    try {
      const cur = playerRef.current.getCurrentTime();
      if (Math.abs(cur - target) > 1) {
        playerRef.current.seekTo(target, true);
      }

      room.playerState === 1
        ? playerRef.current.playVideo()
        : playerRef.current.pauseVideo();

    } catch {}

  }, [playerReady, room.playerState, room.videoTime, room.lastUpdate]);
}
