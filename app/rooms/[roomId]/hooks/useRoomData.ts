"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useRoomData(roomId: string) {
  const [room, setRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // ROOM LISTENER
  useEffect(() => {
    if (!roomId) return;

    let active = true; // 👈 snapshot cleanup koruması

    const refRoom = doc(db, "rooms", roomId);

    const unsub = onSnapshot(refRoom, async (snap) => {
      if (!active) return; // 👈 component kapanmışsa ignore et

      if (!snap.exists()) {
        setRoom(null);
        setLoadingRoom(false);
        return;
      }

      const d = snap.data();

      // 🔵 BAĞIŞ ALANLARINI OTOMATİK EKLEME
      const missing: any = {};

      if (d.donationBarEnabled === undefined)
        missing.donationBarEnabled = false;

      if (d.donationTitle === undefined)
        missing.donationTitle = "1. Koltuk için bağış";

      if (d.donationTarget === undefined)
        missing.donationTarget = 500;

      if (d.donationCurrent === undefined)
        missing.donationCurrent = 0;

      // Eksik alan varsa Firestore'a yaz
      if (Object.keys(missing).length > 0) {
        console.log("🔧 Bağış alanları eksik → Firestore'a otomatik ekleniyor:", missing);
        await updateDoc(refRoom, missing);
      }

      // room verisini yaz
      setRoom({ roomId, ...d });

      setLoadingRoom(false);
    });

    return () => {
      active = false; // 👈 snapshot artık çalışmasın
      unsub();
    };
  }, [roomId]);

  // ROOM SETTINGS UPDATE
  async function updateRoomSettings(data: any) {
    if (!roomId) return;
    await updateDoc(doc(db, "rooms", roomId), data);
  }

  return {
    room,
    loadingRoom,
    updateRoomSettings,
  };
}
