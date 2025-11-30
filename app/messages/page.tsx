"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import {
  collectionGroup,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/firebase/firebaseConfig";

export default function MessagesPage() {
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Kullanıcıyı çek
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");

      const snap = await getDoc(doc(db, "users", u.uid));
      setMe({
        uid: u.uid,
        name: snap.data()?.username,
        avatar: snap.data()?.avatar,
      });
    });

    return () => unsub();
  }, []);

  // DM listesi
  useEffect(() => {
    if (!me) return;

    async function load() {
      const msgRef = collectionGroup(db, "messages");
      const qRef = query(msgRef, orderBy("time", "desc"));
      const snap = await getDocs(qRef);

      const conversations: any = {};

      snap.forEach((d) => {
        const data = d.data();
        const parentId = d.ref.parent.parent?.id;
        if (!parentId) return;

        const [a, b] = parentId.split("_");
        const other = a === me.uid ? b : b === me.uid ? a : null;
        if (!other) return;

        if (!conversations[parentId]) {
          conversations[parentId] = {
            convId: parentId,
            otherId: other,
            lastMsg: data.text,
            time: data.time,
          };
        }
      });

      const finalArr = [];

      for (let convId in conversations) {
        const item = conversations[convId];

        const userSnap = await getDoc(doc(db, "users", item.otherId));
        const uData = userSnap.data();

        const metaSnap = await getDoc(doc(db, "dm", convId, "meta", "info"));

        const unread =
          metaSnap.exists() && metaSnap.data().unread?.[me.uid]
            ? metaSnap.data().unread[me.uid]
            : 0;

        finalArr.push({
          ...item,
          otherName: uData.username,
          otherAvatar: uData.avatar,
          otherOnline: uData.online ?? false,
          unread,
        });
      }

      setList(finalArr);
      setLoading(false);
    }

    load();

    const unsub = onSnapshot(collectionGroup(db, "meta"), () => load());
    return () => unsub();
  }, [me]);

  if (loading || !me)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );

  return (
    <div className="text-white max-w-4xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">Mesajlarım</h1>

      {list.map((m, i) => (
        <div
          key={i}
          onClick={() => router.push(`/messages/dm/${m.otherId}`)} // ⭐ SİHİRLİ DÜZELTME
          className="relative flex items-center gap-4 p-4 bg-neutral-900 rounded-xl mb-4 cursor-pointer border border-white/10 hover:bg-neutral-800"
        >

          {/* AVATAR + ONLINE */}
          <div className="relative">
            <img src={m.otherAvatar} className="w-12 h-12 rounded-full" />

            {/* 🟢 ONLINE */}
            {m.otherOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900"></span>
            )}
          </div>

          {/* USER + LAST MSG */}
          <div className="flex-1">
            <div className="font-semibold text-lg">{m.otherName}</div>
            <div className="text-white/60 text-sm">{m.lastMsg}</div>
          </div>

          {/* 🔴 UNREAD */}
          {m.unread > 0 && (
            <span className="absolute top-2 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {m.unread}
            </span>
          )}

          <div className="text-white/40 text-sm">→</div>
        </div>
      ))}

      {list.length === 0 && (
        <p className="text-center text-white/50 mt-10">Henüz mesaj yok</p>
      )}
    </div>
  );
}
