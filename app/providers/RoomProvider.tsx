"use client";

import { createContext, useContext, useState } from "react";

const RoomContext = createContext<any>(null);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [minimizedRoom, setMinimizedRoom] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("minimizedRoom");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isMinimized") === "true";
    }
    return false;
  });

  // 🔥 küçültülmüş odadan SONRAKİ ilk girişte join atlama flag'i
  const [skipNextJoinRoomId, setSkipNextJoinRoomId] = useState<string | null>(
    null
  );

  function minimizeRoom({ roomId, roomImage }) {
    const data = { roomId, roomImage };
    setMinimizedRoom(data);
    localStorage.setItem("minimizedRoom", JSON.stringify(data));
    setIsMinimized(true);
    localStorage.setItem("isMinimized", "true");

    // 🔥 bu odadan sonraki ilk girişte join atlanacak
    setSkipNextJoinRoomId(roomId);
  }

  function clearRoom() {
    setMinimizedRoom(null);
    localStorage.removeItem("minimizedRoom");
    setIsMinimized(false);
    localStorage.setItem("isMinimized", "false");
  }

  // 🔥 useJoinMessage içinden çağrılacak:
  // eğer bu giriş minimize'den dönüşse → true dön ve join'i atla
  function consumeSkipNextJoin(targetRoomId: string): boolean {
    if (skipNextJoinRoomId === targetRoomId) {
      setSkipNextJoinRoomId(null); // sadece 1 kere geçerli
      return true;
    }
    return false;
  }

  return (
    <RoomContext.Provider
      value={{
        minimizedRoom,
        isMinimized,
        minimizeRoom,
        clearRoom,
        consumeSkipNextJoin,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomState() {
  return useContext(RoomContext);
}
