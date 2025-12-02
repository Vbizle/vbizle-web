"use client";

import { useState } from "react";
import { useRoomState } from "@/app/providers/RoomProvider";

import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function RoomHeader({
  room,
  user,
  onOnlineClick,
  onSearchClick,
  onEditClick,
  onDonationClick,
}) {
  const { minimizeRoom, clearRoom } = useRoomState();

  const [showExitPopup, setShowExitPopup] = useState(false);

  // 🔥 ODAYI KAPAT — sadece owner
  async function closeRoom() {
    if (!room || room.ownerId !== user.uid) return;

    const ref = doc(db, "rooms", room.roomId);

    await updateDoc(ref, {
      active: false,
      onlineUsers: [],
      onlineCount: 0,
    });

    clearRoom();
    window.location.href = "/";
  }

  // 🔥 ODAYI KÜÇÜLT
  function handleMinimize() {
    minimizeRoom({
      roomId: room.roomId,
      roomImage: room.image,
    });

    setShowExitPopup(false);
    window.location.href = "/";
  }

  // 🔥 MİSAFİR ODAYI TERK ET
  async function leaveRoomAsGuest() {
    if (!room || user.uid === room.ownerId) return;

    const updatedUsers = (room.onlineUsers || []).filter(
      (u: any) => u.uid !== user.uid
    );

    await updateDoc(doc(db, "rooms", room.roomId), {
      onlineUsers: updatedUsers,
      onlineCount: updatedUsers.length,
    });

    clearRoom();
    window.location.href = "/";
  }

  return (
    <header className="w-full border-b border-white/10 px-4 py-3 flex items-center justify-between relative">

      {/* SOL TARAF — ODA RESMİ + ODA ADI + ODA ID */}
      <div
        onClick={onEditClick}
        className="flex flex-col cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <img
            src={room.image || "/room-default.png"}
            className="w-10 h-10 rounded-lg"
          />
          <h2 className="text-lg font-semibold">{room.name}</h2>
        </div>

        {/* 🔵 ODA ID — ÜSTTEKİ ÇÖZÜM: Artık HER ZAMAN görünür */}
        <div className="text-white/50 text-sm mt-1 ml-1">
          ID: {room?.roomNumber ?? "—"}
        </div>
      </div>

      {/* 👉 SAĞ TARAF İKONLARI */}
      <div className="flex items-center gap-4">

        {/* 🔍 Arama (Sadece Owner) */}
        {user.uid === room.ownerId && (
          <button onClick={onSearchClick}>🔍</button>
        )}

        {/* 👥 Online */}
        <button onClick={onOnlineClick}>👥 {room.onlineCount}</button>

        {/* 💰 Bağış Ayarları — sadece owner */}
        {user.uid === room.ownerId && (
          <button
            onClick={onDonationClick}
            className="text-xl hover:scale-110 transition"
            title="Bağış Ayarları"
          >
            💰
          </button>
        )}

        {/* ❌ Kapat */}
        <button
          onClick={() => setShowExitPopup(true)}
          className="text-2xl text-red-500"
        >
          ✕
        </button>
      </div>

      {showExitPopup && (
        <div className="absolute right-4 top-14 bg-neutral-900 p-4 w-56 rounded-xl border border-white/10 shadow-xl z-[9999]">

          <h3 className="font-semibold text-lg mb-3">Oda Seçenekleri</h3>

          {/* 🔵 ODAYI KÜÇÜLT */}
          <button
            onClick={handleMinimize}
            className="w-full py-2 mb-2 rounded-lg bg-blue-600"
          >
            Odayı Küçült
          </button>

          {/* 🔴 MİSAFİR → ODADAN ÇIK */}
          {user.uid !== room.ownerId && (
            <button
              onClick={leaveRoomAsGuest}
              className="w-full py-2 mb-2 rounded-lg bg-red-600"
            >
              Odadan Çık
            </button>
          )}

          {/* 🔴 OWNER → ODAYI KAPAT */}
          {user.uid === room.ownerId && (
            <button
              onClick={closeRoom}
              className="w-full py-2 mb-2 rounded-lg bg-red-600"
            >
              Odayı Kapat
            </button>
          )}

          <button
            onClick={() => setShowExitPopup(false)}
            className="w-full py-2 bg-white/10 rounded-lg"
          >
            Vazgeç
          </button>
        </div>
      )}
    </header>
  );
}
