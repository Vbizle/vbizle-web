"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

export default function CreateRoomPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [roomName, setRoomName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function ensureUserDoc() {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          username: user.email?.split("@")[0] || "Misafir",
          avatar: user.photoURL || "/user.png",
          createdAt: Date.now(),
        });
      }
    }

    ensureUserDoc();
  }, [user]);

  async function handleSelectFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleCreateRoom(e: any) {
    e.preventDefault();
    if (!roomName) return alert("Oda ismi gerekli!");

    setLoading(true);

    try {
      const check = query(
        collection(db, "rooms"),
        where("ownerId", "==", user!.uid)
      );
      const exists = await getDocs(check);

      if (!exists.empty) {
        const roomId = exists.docs[0].id;
        alert("Zaten bir odanız var.");
        return router.push(`/rooms/${roomId}`);
      }

      let imageUrl = "";
      if (imageFile) {
        const storageRef = ref(storage, `roomImages/${user!.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 🔥 Host bilgilerini Firestore'dan çek
      const uref = doc(db, "users", user!.uid);
      const userSnap = await getDoc(uref);

      const hostName = userSnap.exists() ? userSnap.data().username : "Host";
      const hostAvatar = userSnap.exists() ? userSnap.data().avatar : "/user.png";

      const roomRef = await addDoc(collection(db, "rooms"), {
        name: roomName,
        image: imageUrl,
        ownerId: user!.uid,

        onlineUsers: [user!.uid],
        onlineCount: 1,

        videoId: "",
        isPlaying: false,
        currentTime: 0,
        lastUpdate: Date.now(),
        videoVolume: 100,

        hostState: { camera: false, mic: false },
        guestState: { camera: false, mic: false },
        guestSeat: null,

        // ⭐ SLOT İÇİN CRITICAL ALANLAR
        hostName,
        hostAvatar,
        guestName: null,
        guestAvatar: null,

        createdAt: Date.now(),
      });

      router.push(`/rooms/${roomRef.id}`);

    } catch (err) {
      console.error("Room error:", err);
    }

    setLoading(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Giriş yapmanız gerekiyor.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Oda Oluştur</h1>

      <form onSubmit={handleCreateRoom} className="flex flex-col gap-6">

        <input
          type="text"
          placeholder="Oda Adı"
          className="p-3 rounded-lg bg-white/5 border border-white/10 outline-none"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />

        <div>
          <label className="block mb-2 text-white/80">Oda Resmi</label>
          <input type="file" accept="image/*" onChange={handleSelectFile} />
          {preview && (
            <img
              src={preview}
              className="w-full h-48 object-cover rounded-lg mt-4"
            />
          )}
        </div>

        <button
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 transition py-3 rounded-lg font-semibold"
        >
          {loading ? "Oluşturuluyor..." : "Odayı Oluştur"}
        </button>

      </form>
    </div>
  );
}
