"use client";

import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export function useRoomSettings(roomId: string, room: any, user: any) {
  const storage = getStorage();

  const [newRoomName, setNewRoomName] = useState(room?.name || "");
  const [newRoomImage, setNewRoomImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveRoomSettings() {
    if (!room || !user) return;
    if (room.ownerId !== user.uid) return;

    setSaving(true);

    const roomRef = doc(db, "rooms", roomId);

    // Eğer resim seçildi ise yükle
    let imageURL = room.image;
    if (newRoomImage) {
      const imgRef = ref(storage, `roomImages/${roomId}/${Date.now()}.jpg`);
      await uploadBytes(imgRef, newRoomImage);
      imageURL = await getDownloadURL(imgRef);
    }

    // Firestore güncelleme
    await updateDoc(roomRef, {
      name: newRoomName,
      image: imageURL,
    });

    setSaving(false);
  }

  return {
    newRoomName,
    setNewRoomName,
    newRoomImage,
    setNewRoomImage,
    saveRoomSettings,
    saving,
  };
}
