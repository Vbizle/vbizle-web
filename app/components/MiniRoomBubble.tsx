"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRoomState } from "@/app/providers/RoomProvider";

export default function MiniRoomBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const { minimizedRoom, clearRoom } = useRoomState();

  // Oda sayfasında balon görünmesin
  if (pathname.startsWith("/rooms/")) return null;
  if (!minimizedRoom?.roomId) return null;

  return (
    <div
      onClick={() => {
        // 🔥 Odayı geri açarken "minimize" modunu tamamen devreden çıkar
        clearRoom();
        router.push(`/rooms/${minimizedRoom.roomId}`);
      }}
      className="
        fixed bottom-24 right-4 
        w-20 h-20 rounded-full overflow-hidden 
        cursor-pointer shadow-xl bg-black/70 
        border border-white/20 flex items-center justify-center
        z-[99999]
      "
    >
      <img
        src={minimizedRoom.roomImage || "/room-default.png"}
        className="w-full h-full object-cover"
      />

      {/* Balonu kapatma */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          clearRoom();
        }}
        className="
          absolute top-0 right-0 
          w-6 h-6 rounded-full 
          bg-red-600 text-white text-sm 
          flex items-center justify-center
        "
      >
        ✕
      </button>
    </div>
  );
}