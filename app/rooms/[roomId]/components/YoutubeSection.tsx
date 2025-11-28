"use client";

import { useYoutubePlayer } from "../hooks/useYoutubePlayer";
import { useEffect, useRef } from "react";

interface Props {
  room: any;
  user: any;
  roomId: string;
}

export default function YoutubeSection({ room, user, roomId }: Props) {
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // ❗ Player sadece DOM hazır olduğunda çalışmalı
  useEffect(() => {
    if (!playerContainerRef.current) return;
  }, []);

  // ❗ Player hook'u artık DOM ref alacak
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
            width: "80%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
