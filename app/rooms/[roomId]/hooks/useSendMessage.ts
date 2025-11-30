"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useSendMessage(roomId: string, user: any, profile: any) {
  const [newMsg, setNewMsg] = useState("");

  async function sendMessage() {
    if (!newMsg.trim()) return;
    if (!user || !profile) return;

    await addDoc(collection(db, "rooms", roomId, "chat"), {
      uid: user.uid,
      name: profile.username,
      photo: profile.avatar,
      text: newMsg.trim(),
      time: serverTimestamp(),
      type: "text",
    });

    setNewMsg("");
  }

  return {
    newMsg,
    setNewMsg,
    sendMessage,
  };
}
