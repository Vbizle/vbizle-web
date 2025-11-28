"use client";

import { useEffect, useRef } from "react";
import { db } from "@/firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export function useJoinMessage(
  roomId: string,
  user: any,
  profile: any,
  disablePresence: boolean
) {
  const alreadyFired = useRef(false); // 🔥 Bu sayfada 1 defa join at

  useEffect(() => {
    if (!roomId || !user || !profile) return;

    // 🔥 Minimize modunda ASLA join gönderme
    if (disablePresence) return;

    // 🔥 Aynı sayfa içinde tekrar join gönderme
    if (alreadyFired.current) return;

    async function checkAndSendJoin() {
      const ref = doc(db, "rooms", roomId);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const data = snap.data();
      const list = Array.isArray(data.onlineUsers) ? data.onlineUsers : [];

      const isInside = list.some((u) => u.uid === user.uid);

      // 🔥 Kullanıcı odadaysa join gönderme (yenileme / minimize / geri dönme)
      if (isInside) return;

      // 🔥 Kullanıcı gerçekten ilk defa giriyorsa → join gönder
      await addDoc(collection(db, "rooms", roomId, "chat"), {
        uid: user.uid,
        name: profile.username,
        photo: profile.avatar,
        text: "joined_room_event_8392",
        type: "join",
        time: serverTimestamp(),
      });

      alreadyFired.current = true; // bir daha asla tetiklenmez
    }

    checkAndSendJoin();
  }, [roomId, user?.uid, profile?.username, profile?.avatar, disablePresence]);
}
