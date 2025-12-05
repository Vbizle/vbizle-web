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

  /* ---------------------------------------------------------
     🔥 Kullanıcının kendi odasını kontrol et
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     🔥 Sadece aktif odaları çek
  --------------------------------------------------------- */
  useEffect(() => {
    const q = query(collection(db, "rooms"), where("active", "==", true));

    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // ⭐ Online kullanıcı sayısına göre sırala (yüksek → düşük)
      list.sort((a, b) => (b.onlineCount || 0) - (a.onlineCount || 0));

      setRooms(list);
    });

    return () => unsub();
  }, []);

  /* ---------------------------------------------------------
     🔥 Oda Açma
  --------------------------------------------------------- */
  async function handleCreateRoom() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (myRoomId) {
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

  /* ---------------------------------------------------------
     🔥 TASARIM (Mobil 2 sütun, scroll aktif)
  --------------------------------------------------------- */
  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ⭐ ÜST SABİT BAR */}
      <div className="p-4 bg-black border-b border-white/10 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Aktif Odalar</h1>

          <button
            onClick={handleCreateRoom}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-semibold"
          >
            Oda Aç
          </button>
        </div>
      </div>

      {/* ⭐ AŞAĞI KAYABİLİR LİSTE */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {rooms.length === 0 && (
          <p className="text-center text-white/60 mt-10">
            Şu anda aktif oda yok.
          </p>
        )}

        {/* ⭐ Mobilde 2 sütun — Web’de otomatik genişler */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {rooms.map((room) => (
            <a
              key={room.id}
              href={`/rooms/${room.id}`}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition"
            >
              {/* ⭐ Küçük kapak fotoğrafı */}
              <img
                src={room.image || "/default-room.jpg"}
                className="w-full h-28 object-cover"
              />

              <div className="p-3">
                <h3 className="text-sm font-semibold">{room.name}</h3>
                <p className="text-white/60 text-xs mt-1">
                  👥 {room.onlineCount || 0} kişi online
                </p>
              </div>
            </a>
          ))}

        </div>
      </div>
    </div>
  );
}
