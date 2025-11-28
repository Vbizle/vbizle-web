"use client";

import { useEffect } from "react";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRoomState } from "@/app/providers/RoomProvider";

export function useRoomPresence(
  roomId: string,
  user: any,
  profile: any,
  disablePresence: boolean
) {
  const { isMinimized, minimizedRoom } = useRoomState();

  useEffect(() => {
    if (!roomId || !user || !profile) return;

    const ref = doc(db, "rooms", roomId);

    async function join() {
      if (disablePresence) return;

      // 🔥 Küçültülmüş odadan dönüyorsa → join yok
      if (isMinimized && minimizedRoom?.roomId === roomId) return;

      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const list = snap.data().onlineUsers ?? [];

      // zaten varsa ekleme
      if (list.some((u: any) => u.uid === user.uid)) return;

      const updated = [
        ...list,
        {
          uid: user.uid,
          name: profile.username,
          photo: profile.avatar,
        },
      ];

      await updateDoc(ref, {
        onlineUsers: updated,
        onlineCount: updated.length,
      });
    }

    // 🔥 leave tamamen devre dışı — temizliyoruz
    async function leave() {
      /* hiçbir şey yapma */
    }

    join();

    // ❗ cleanup artık leave ÇAĞIRMAYACAK
    return () => {};
  }, [
    roomId,
    user?.uid,
    profile?.avatar,
    profile?.username,
    disablePresence,
    isMinimized,
    minimizedRoom?.roomId,
  ]);
}
