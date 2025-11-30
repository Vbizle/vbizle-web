"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebaseConfig";
import { collection, getDocs, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [rooms, setRooms] = useState<any[]>([]);
  const [myRoomId, setMyRoomId] = useState<string | null>(null);

  // Kullanıcının kendi odasını kontrol et
  useEffect(() => {
    if (!user) return;

    async function checkMyRoom() {
      const q = query(collection(db, "rooms"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setMyRoomId(snap.docs[0].id);
      } else {
        setMyRoomId(null);
      }
    }

    checkMyRoom();
  }, [user]);

  // Sadece aktif odaları çek
  useEffect(() => {
    const q = query(collection(db, "rooms"), where("active", "==", true));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRooms(list);
    });

    return () => unsub();
  }, []);

  // ODA AÇMA / GIRME
  async function handleCreateRoom() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (myRoomId) {
      // Kapalıysa aktif et
      const ref = doc(db, "rooms", myRoomId);
      await updateDoc(ref, {
        active: true,
        onlineUsers: [],
        onlineCount: 0,
      });

      router.push(`/rooms/${myRoomId}`);
    } else {
      router.push("/create-room");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aktif Odalar</h1>

        <button
          onClick={handleCreateRoom}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-semibold"
        >
          Oda Aç
        </button>
      </div>

      {rooms.length === 0 && (
        <p className="text-center text-white/60 mt-10">
          Şu anda aktif oda yok.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {rooms.map((room) => (
          <a
            key={room.id}
            href={`/rooms/${room.id}`}
            className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition"
          >
            <img
              src={room.image || "/default-room.jpg"}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />

            <h3 className="text-xl font-semibold">{room.name}</h3>

            <p className="text-white/60 mt-2">
              👥 {room.onlineCount} kişi online
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
