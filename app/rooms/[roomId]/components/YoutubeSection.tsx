"use client";

import { useYoutubePlayer } from "../hooks/useYoutubePlayer";
import { useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function YoutubeSection({ room, user, roomId }) {

  const isHost = user?.uid === room?.ownerId;

  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Mobil autoplay için gerekli attribute’ler
  useEffect(() => {
    if (playerContainerRef.current) {
      playerContainerRef.current.setAttribute("playsinline", "true");
      playerContainerRef.current.setAttribute("webkit-playsinline", "true");
      playerContainerRef.current.setAttribute("allow", "autoplay; encrypted-media");
      playerContainerRef.current.setAttribute("muted", "true");
    }
  }, []);

  // YT Player Hook
  useYoutubePlayer(room, user, roomId, playerContainerRef);

  // Global volume update
  async function handleVolumeChange(e: any) {
    const vol = Number(e.target.value);
    await updateDoc(doc(db, "rooms", roomId), {
      videoVolume: vol
    });
  }

  return (
    <div className="w-full bg-black flex flex-col items-center">

      {/* ----------------------------- */}
      {/*   YOUTUBE PLAYER 16:9         */}
      {/* ----------------------------- */}
      <div
        className="w-full relative flex items-center justify-center"
        style={{
          aspectRatio: "16 / 9",
          maxHeight: "50vh",
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
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* ----------------------------- */}
      {/*   GLOBAL SES KONTROLÜ (HOST)  */}
      {/* ----------------------------- */}
      {isHost && (
        <div className="w-full px-6 py-3 mt-1 flex items-center gap-4">
          <span className="text-white text-sm">🔊 Ses</span>

          <input
            type="range"
            min="0"
            max="100"
            value={room.videoVolume ?? 100}
            onChange={handleVolumeChange}
            className="flex-1 accent-blue-500"
          />
        </div>
      )}
    </div>
  );
}
