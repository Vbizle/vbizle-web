"use client";

import { useYoutubePlayer } from "../hooks/useYoutubePlayer";
import { useEffect, useRef } from "react";

export default function YoutubeSection({ room, user, roomId }) {
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (playerContainerRef.current) {
      // 🔥 Mobil autoplay için şart
      playerContainerRef.current.setAttribute("playsinline", "true");
      playerContainerRef.current.setAttribute("webkit-playsinline", "true");

      // 🔥 Chrome autoplay policy için MUTLAKA gerekli
      playerContainerRef.current.setAttribute("allow", "autoplay; encrypted-media");

      // 🔥 iOS/Android WebView autoplay için muted başlatmak zorunlu
      playerContainerRef.current.setAttribute("muted", "true");
    }
  }, []);

  useYoutubePlayer(room, user, roomId, playerContainerRef);

  return (
    <div className="w-full bg-black flex flex-col items-center">
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: "45vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          ref={playerContainerRef}
          id="yt-player-container"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
