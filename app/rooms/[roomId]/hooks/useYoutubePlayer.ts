"use client";

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useYoutubePlayer(
  room: any,
  user: any,
  roomId: string,
  containerRef: any,
  setYtReady?: (v: boolean) => void
) {
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const isHost = user?.uid === room?.ownerId;

  /* API LOAD */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    if (!document.getElementById("yt-api-script")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "yt-api-script";
      document.body.appendChild(tag);
    }

    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        setApiReady(true);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  /* PLAYER INIT */
  useEffect(() => {
    if (!apiReady) return;
    if (!room?.youtube) return;

    const el = containerRef.current;
    if (!el) return;

    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player(el, {
      videoId: room.youtube,
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,

        /* 🔥 Timeline geri geldi — ama sadece host görüyor */
        controls: isHost ? 1 : 0,

        /* ÖNEMLİ — YouTube'un kendi ses barı yine çalışmıyor */
        mute: 1,
      },

      events: {
        onReady: () => {
          setPlayerReady(true);
          setYtReady?.(true);

          playerRef.current.playVideo?.();
          playerRef.current.unMute?.();

          /* HOST */
          if (isHost) {
            playerRef.current.setVolume(room.videoVolume ?? 100);
          }

          /* MİSAFİR */
          if (!isHost) {
            setTimeout(() => {
              try {
                playerRef.current.setVolume(room.videoVolume ?? 100);
                playerRef.current.unMute?.();
              } catch {}
            }, 200);
          }
        },

        /* HOST timeline hareketi → tüm odaya sync */
        onStateChange: async (e: any) => {
          if (!isHost) return;

          const st = e.data;

          if (st === 1 || st === 2) {
            let cur = 0;
            try { cur = playerRef.current.getCurrentTime(); } catch {}

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

  /* HOST CUSTOM VOLUME SYNC */
  useEffect(() => {
    if (!playerReady) return;
    if (!isHost) return;

    try {
      playerRef.current.setVolume(room.videoVolume ?? 100);
    } catch {}
  }, [playerReady, isHost, room.videoVolume]);

  /* MISAFIR SESİ HOSTA BAĞLA */
  useEffect(() => {
    if (!playerReady) return;
    if (isHost) return;

    try {
      playerRef.current.setVolume(room.videoVolume ?? 100);
      playerRef.current.unMute?.();
    } catch {}
  }, [room.videoVolume, playerReady]);

  /* MISAFIR SEEK / PLAY-PAUSE SYNC */
  useEffect(() => {
    if (!playerReady) return;
    if (isHost) return;

    let target = room.videoTime || 0;

    if (room.playerState === 1 && room.lastUpdate?.toMillis) {
      target += (Date.now() - room.lastUpdate.toMillis()) / 1000;
    }

    try {
      const cur = playerRef.current.getCurrentTime?.();
      if (cur && Math.abs(cur - target) > 1) {
        playerRef.current.seekTo(target, true);
      }

      if (room.playerState === 1) {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    } catch {}
  }, [room.videoTime, room.playerState, room.lastUpdate, playerReady]);
}
