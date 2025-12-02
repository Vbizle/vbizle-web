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

      // 🔥 Küçültülmüş odadan geri dönüyorsa → join yok
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

      // 🔥 Bu kullanıcı son olarak hangi odaya girdi → kaydet
      localStorage.setItem("lastRoomId", roomId);
    }

    // ============================================================
    // 🔥 LEAVE — sadece 2 durumda çalışır:
    // 1) Sekme/uygulama kapanınca
    // 2) Kullanıcı başka bir odaya girince
    // DM / profil / minimize → etkilemez
    // ============================================================
    async function leave() {
      const last = localStorage.getItem("lastRoomId");

      // ❗ Bu leave işlemi sadece "bu oda" için çalışmalı
      if (last !== roomId) return;

      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      let list = snap.data().onlineUsers ?? [];

      // kullanıcı zaten yok → çıkış yapma
      if (!list.some((u: any) => u.uid === user.uid)) return;

      const updated = list.filter((u: any) => u.uid !== user.uid);

      await updateDoc(ref, {
        onlineUsers: updated,
        onlineCount: updated.length,
      });

      // 🔥 odadan tamamen çıktığını işaretle
      localStorage.removeItem("lastRoomId");
    }

    join();

    // ============================================================
    // 🔥 SEKME / UYGULAMA KAPANIRSA leave() çalışır
    // ============================================================
    const handleUnload = () => {
      leave();
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("unload", handleUnload);

    // ============================================================
    // 🔥 Kullanıcı başka bir odaya girerse eskisinden çıkart
    // ============================================================
    const previousRoom = localStorage.getItem("lastRoomId");

    if (previousRoom && previousRoom !== roomId) {
      // önceki odadan çıkış yap
      const prevRef = doc(db, "rooms", previousRoom);

      getDoc(prevRef).then((s) => {
        if (!s.exists()) return;

        const prevList = s.data().onlineUsers ?? [];
        const updated = prevList.filter((u: any) => u.uid !== user.uid);

        updateDoc(prevRef, {
          onlineUsers: updated,
          onlineCount: updated.length,
        });
      });

      // kayıt yeni oda olarak güncellenir
      localStorage.setItem("lastRoomId", roomId);
    }

    // cleanup
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("unload", handleUnload);
    };
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
