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

      // 🔥 Chrome autoplay policy için gerekli
      playerContainerRef.current.setAttribute("allow", "autoplay; encrypted-media");

      // 🔥 Mobil WebView autoplay için muted şart
      playerContainerRef.current.setAttribute("muted", "true");
    }
  }, []);

  // 🔥 YouTube Player Hook
  useYoutubePlayer(room, user, roomId, playerContainerRef);

  return (
    <div className="w-full bg-black flex flex-col items-center">
      <div
        className="w-full relative flex items-center justify-center"
        style={{
          // 🚀 Video artık tam genişlik 16:9 ORAN sabit
          aspectRatio: "16 / 9",
          maxHeight: "50vh", // ekranın üst yarısını doldurur
          width: "100%",
          overflow: "hidden",
          backgroundColor: "black",
        }}
      >
        <div
          ref={playerContainerRef}
          id="yt-player-container"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
