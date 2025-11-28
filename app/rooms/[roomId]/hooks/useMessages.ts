"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const ref = collection(db, "rooms", roomId, "chat");

    const q = query(ref, orderBy("time", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setMessages(list);
      },
      (err) => {
        console.error("🔥 useMessages Hatası:", err);
      }
    );

    return () => unsub();
  }, [roomId]);

  return { messages };
}
