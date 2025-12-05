"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUiState } from "@/app/providers/UiProvider";
import { auth, db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useState, useRef, useEffect } from "react";

export default function MiniRoomBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const { minimizedRoom, clearRoom } = useUiState();
  const [closing, setClosing] = useState(false);

  // DRAG STATE
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // İlk konumu sağ alt
    const bubbleSize = 80;
    setPos({
      x: window.innerWidth - bubbleSize - 20,
      y: window.innerHeight - bubbleSize - 120,
    });
  }, []);

  if (pathname.startsWith("/rooms/")) return null;
  if (!minimizedRoom?.roomId) return null;

  /* -----------------------------------------
     BALON X
  ----------------------------------------- */
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

          const updatedOnline = (data.onlineUsers || []).filter(
            (u: any) => u.uid !== uid
          );

          const updates: any = {
            onlineUsers: updatedOnline,
            onlineCount: updatedOnline.length,
          };

          if (data.guestSeat === uid) updates.guestSeat = "";
          if (data.audioSeat1?.uid === uid) updates.audioSeat1 = null;
          if (data.audioSeat2?.uid === uid) updates.audioSeat2 = null;

          await updateDoc(ref, updates);
        }

        const last = localStorage.getItem("lastRoomId");
        if (last === roomId) localStorage.removeItem("lastRoomId");
      }
    } catch (err) {
      console.error("❌ Bubble exit error:", err);
    } finally {
      clearRoom();
      setClosing(false);
    }
  }

  /* -----------------------------------------
     DRAG LOGIC – sadece basılı tutunca çalışır
  ----------------------------------------- */

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    moved.current = false;

    start.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return; // 🔥 sadece basılıyken sürüklensin

    const newX = e.clientX - start.current.x;
    const newY = e.clientY - start.current.y;

    if (Math.abs(newX - pos.x) > 3 || Math.abs(newY - pos.y) > 3) {
      moved.current = true; // sürüklendi
    }

    setPos({ x: newX, y: newY });
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */
  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 99999,
      }}
      className="touch-none" // 🔥 mobilde gereksiz hareketleri engeller ama drag'i bozmaz
    >
      {/* X */}
      <button
        onClick={handleCloseBubble}
        className="
          absolute -top-5 -right-5
          w-5 h-5 rounded-full 
          bg-red-600 text-white text-xl 
          flex items-center justify-center
          shadow-xl border-2 border-white
          z-[100000]
        "
      >
        ✕
      </button>

      {/* BALON */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (!moved.current) {
            router.push(`/rooms/${minimizedRoom.roomId}`);
          }
        }}
        className="
          w-20 h-20 rounded-full overflow-hidden 
          cursor-pointer shadow-xl bg-black/70 
          border border-white/20 flex items-center justify-center
        "
        style={{
          touchAction: "none", // sadece bu elementte drag aktif
        }}
      >
        <img
          src={minimizedRoom.roomImage || "/room-default.png"}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
