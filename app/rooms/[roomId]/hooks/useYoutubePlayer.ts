"use client";

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useYoutubePlayer(room: any, user: any, roomId: string, containerRef: any) {
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const isHost = user?.uid === room?.ownerId;

  /* --------------------------------------
     1) API LOAD
  --------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT?.Player) {
      setApiReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };
  }, []);

  /* --------------------------------------
     2) PLAYER INIT
  --------------------------------------- */
  useEffect(() => {
    if (!apiReady) return;
    if (!room?.youtube) return;

    const el = containerRef.current;
    if (!el) return;

    // Eski player’ı temizle
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player(el, {
      videoId: room.youtube,

      playerVars: {
        autoplay: 1,
        playsinline: 1,
        controls: isHost ? 1 : 0,
        disablekb: isHost ? 0 : 1,
        rel: 0,
        modestbranding: 1,
      },

      events: {
        onReady: () => {
          if (!playerRef.current) return;

          setPlayerReady(true);

          try {
            if (room.videoTime && typeof playerRef.current.seekTo === "function") {
              playerRef.current.seekTo(room.videoTime, true);
            }

            if (typeof playerRef.current.setVolume === "function") {
              playerRef.current.setVolume(room.videoVolume ?? 100);
            }

            if (room.playerState === 1 && typeof playerRef.current.playVideo === "function") {
              playerRef.current.playVideo();
            } else if (typeof playerRef.current.pauseVideo === "function") {
              playerRef.current.pauseVideo();
            }
          } catch {}
        },

        onStateChange: async (e: any) => {
          if (!isHost) return;
          if (!playerRef.current) return;

          const st = e.data;

          if (st === 1 || st === 2) {
            let cur = 0;
            try {
              if (typeof playerRef.current.getCurrentTime === "function") {
                cur = playerRef.current.getCurrentTime();
              }
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

  /* --------------------------------------
     3) HOST — SYNC VOLUME
  --------------------------------------- */
  useEffect(() => {
    if (!playerReady) return;
    if (!isHost) return;

    const interval = setInterval(async () => {
      if (!playerRef.current) return;

      let vol = null;
      if (typeof playerRef.current.getVolume === "function") {
        vol = playerRef.current.getVolume();
      }

      if (vol !== null && vol !== room.videoVolume) {
        await updateDoc(doc(db, "rooms", roomId), { videoVolume: vol });
      }

    }, 300);

    return () => clearInterval(interval);
  }, [playerReady, isHost, room.videoVolume]);

  /* --------------------------------------
     4) GUEST — FOLLOW HOST VOLUME
  --------------------------------------- */
  useEffect(() => {
    if (!playerReady) return;
    if (isHost) return;
    if (!playerRef.current) return;

    if (typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(room.videoVolume ?? 100);
    }
  }, [playerReady, room.videoVolume]);

  /* --------------------------------------
     5) GUEST — FOLLOW HOST TIME + PLAY/PAUSE
  --------------------------------------- */
  useEffect(() => {
    if (!playerReady) return;
    if (!playerRef.current) return;
    if (isHost) return;

    let target = room.videoTime || 0;
    const last = room.lastUpdate;

    if (room.playerState === 1 && last?.toMillis) {
      const diff = (Date.now() - last.toMillis()) / 1000;
      target += diff;
    }

    try {
      if (typeof playerRef.current.getCurrentTime === "function") {
        const cur = playerRef.current.getCurrentTime();

        if (Math.abs(cur - target) > 1 && typeof playerRef.current.seekTo === "function") {
          playerRef.current.seekTo(target, true);
        }
      }

      if (room.playerState === 1 && typeof playerRef.current.playVideo === "function") {
        playerRef.current.playVideo();
      } else if (typeof playerRef.current.pauseVideo === "function") {
        playerRef.current.pauseVideo();
      }

    } catch {}
  }, [playerReady, room.playerState, room.videoTime, room.lastUpdate]);
}
