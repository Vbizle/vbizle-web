"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import Link from "next/link";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "rooms"), where("active", "==", true));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(list);
    });

    return () => unsub();
  }, []);

  return (
    <div>
      <h1 className="text-center text-4xl font-bold my-10">Odalar</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {rooms.map((room: any) => (
          <div
            key={room.id}
            className="bg-neutral-900 p-6 rounded-xl border border-white/10"
          >
            <h2 className="text-xl font-semibold">{room.name}</h2>

            <p className="text-white/60 text-sm">
              Aktif Kullanıcı: {room.onlineCount ?? 0}
            </p>

            <Link
              href={`/rooms/${room.id}`}
              className="mt-4 inline-block bg-blue-600 px-4 py-2 rounded-lg"
            >
              Odaya Gir
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
