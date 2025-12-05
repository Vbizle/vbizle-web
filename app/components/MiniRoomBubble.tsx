"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUiState } from "@/app/providers/UiProvider";
import { auth, db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useState } from "react";

export default function MiniRoomBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const { minimizedRoom, clearRoom } = useUiState();
  const [closing, setClosing] = useState(false);

  // ❌ Sadece oda sayfasında balonu gizle
  if (pathname.startsWith("/rooms/")) return null;

  // ❌ Minimize olmuş bir oda yoksa balon zaten olmasın
  if (!minimizedRoom?.roomId) return null;

  async function handleCloseBubble(e: React.MouseEvent) {
    e.stopPropagation();
    if (closing) return;
    setClosing(true);

    try {
      const currentUser = auth.currentUser;
      const roomId = minimizedRoom.roomId as string;

      if (currentUser && roomId) {
        const uid = currentUser.uid;
        const ref = doc(db, "rooms", roomId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const list = Array.isArray(data.onlineUsers)
            ? data.onlineUsers
            : [];

          const updated = list.filter((u: any) => u.uid !== uid);

          await updateDoc(ref, {
            onlineUsers: updated,
            onlineCount: updated.length,
          });
        }

        const last = localStorage.getItem("lastRoomId");
        if (last === roomId) {
          localStorage.removeItem("lastRoomId");
        }
      }
    } catch (err) {
      console.error("❌ Bubble X ile odadan çıkış hatası:", err);
    } finally {
      clearRoom(); // balonu temizle
      setClosing(false);
    }
  }

  return (
    <div
      onClick={() => {
        // Balona tıklayınca sadece odaya dön
        // (clearRoom çağırmıyoruz ki minimize state bozulmasın)
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

      {/* ❌ Balonu kapatma — ODA + BALON çıkışı */}
      <button
        onClick={handleCloseBubble}
        className="
          absolute -top-3 -right-3
          w-8 h-8 rounded-full 
          bg-red-600 text-white text-lg 
          flex items-center justify-center
          shadow-lg
          border-2 border-white
          z-[100000]
        "
      >
        ✕
      </button>
    </div>
  );
}
