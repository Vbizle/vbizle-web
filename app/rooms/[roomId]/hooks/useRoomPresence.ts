"use client";

import { useEffect } from "react";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useUiState } from "@/app/providers/UiProvider";

export function useRoomPresence(
  roomId: string,
  user: any,
  profile: any,
  disablePresence: boolean
) {
  const { isMinimized, minimizedRoom } = useUiState();

  useEffect(() => {
    if (!roomId || !user || !profile) return;

    const currentUid = user.uid as string;

    async function joinCurrentRoom() {
      if (disablePresence) return; // minimize modunda asla join yok

      const ref = doc(db, "rooms", roomId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      const list = Array.isArray(data.onlineUsers) ? data.onlineUsers : [];

      if (!list.some((u: any) => u.uid === currentUid)) {
        const updated = [
          ...list,
          {
            uid: currentUid,
            name: profile.username,
            photo: profile.avatar,
          },
        ];

        await updateDoc(ref, {
          onlineUsers: updated,
          onlineCount: updated.length,
        });
      }

      // bu kullanıcı en son hangi odadaydı?
      localStorage.setItem("lastRoomId", roomId);
    }

    async function leavePreviousRoomIfAny() {
      const previousRoom = localStorage.getItem("lastRoomId");

      // minimize/dm/profil gibi durumlarda dokunma
      if (!previousRoom || previousRoom === roomId) return;

      const prevRef = doc(db, "rooms", previousRoom);
      const snap = await getDoc(prevRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const list = Array.isArray(data.onlineUsers) ? data.onlineUsers : [];
      const updated = list.filter((u: any) => u.uid !== currentUid);

      if (updated.length === list.length) return; // zaten yok

      await updateDoc(prevRef, {
        onlineUsers: updated,
        onlineCount: updated.length,
      });
    }

    // 1) Yeni odaya giriyorsan önce eski odadan düşür
    leavePreviousRoomIfAny();

    // 2) Minimize değil ve presence aktifse bu odaya join
    if (!(isMinimized && minimizedRoom?.roomId === roomId) && !disablePresence) {
      joinCurrentRoom();
    }

    // ❗ unmount'ta otomatik leave yok → sadece
    // - yeni odaya girince
    // - balondan X ile çıkınca
    // Firestore'dan düşüyoruz.

  }, [
    roomId,
    user?.uid,
    profile?.username,
    profile?.avatar,
    disablePresence,
    isMinimized,
    minimizedRoom?.roomId,
  ]);
}
