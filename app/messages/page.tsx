// app/messages/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import {
  collectionGroup,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/firebase/firebaseConfig";

/* ======================================================
   ID ile bulunan kullanıcıyı gösteren basit POPUP
   (oda ile alakası yok, sadece DM açar)
====================================================== */
function IdProfilePopup({
  user,
  onClose,
}: {
  user: { uid: string; name: string; avatar?: string; vbId?: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const photo = user.avatar || "/user.png";

  const handleDM = () => {
    router.push(`/messages/dm/${user.uid}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-2xl w-80 p-5 border border-white/10 shadow-xl text-center">
        <img
          src={photo}
          className="w-24 h-24 rounded-full mx-auto mb-2 border-2 border-white/20 object-cover"
        />

        {user.vbId && (
          <p className="text-sm text-white font-semibold mb-1">
            ID: {user.vbId}
          </p>
        )}

        <h3 className="text-xl font-semibold mb-3">{user.name}</h3>

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleDM}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
          >
            Mesaj Gönder
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
                       MESAJLAR SAYFASI
====================================================== */
export default function MessagesPage() {
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 ID arama state’leri
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string>("");
  const [searchUser, setSearchUser] = useState<any | null>(null);

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
  }, [router]);

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

      const finalArr: any[] = [];

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

  // 🔍 ID ARAMA
  const handleSearch = async () => {
    setSearchUser(null);
    setSearchError("");

    const raw = searchId.trim();
    if (!raw) return;

    // VB-1 → hepsini büyük yap
    const term = raw.toUpperCase();

    setSearchLoading(true);
    try {
      const qRef = query(
        collection(db, "users"),
        where("vbId", "==", term)
      );
      const snap = await getDocs(qRef);

      if (snap.empty) {
        setSearchError("Kullanıcı bulunamadı");
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();
      setSearchUser({
        uid: docSnap.id,
        name: data.username,
        avatar: data.avatar,
        vbId: data.vbId,
      });
    } catch (err) {
      console.error("ID search error:", err);
      setSearchError("Bir hata oluştu");
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading || !me)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );

  return (
    <div className="text-white max-w-4xl mx-auto px-4">
      {/* BAŞLIK + ID ARAMA */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <h1 className="text-2xl font-bold">Mesajlarım</h1>

        <div className="relative flex items-center">
          {searchOpen && (
            <div className="mr-2 flex items-center gap-2 bg-neutral-900 border border-white/20 rounded-full px-3 py-1">
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="ID (VB-1)"
                className="bg-transparent outline-none text-sm w-28"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="text-xs px-2 py-1 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Ara
              </button>
            </div>
          )}

          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-sm hover:bg-white/10"
            title="ID ile kullanıcı ara"
          >
            🔍
          </button>
        </div>
      </div>

      {searchError && (
        <p className="text-sm text-red-400 mb-3">{searchError}</p>
      )}

      {/* DM LİSTESİ */}
      {list.map((m, i) => (
        <div
          key={i}
          onClick={() => router.push(`/messages/dm/${m.otherId}`)}
          className="relative flex items-center gap-4 p-4 bg-neutral-900 rounded-xl mb-4 cursor-pointer border border-white/10 hover:bg-neutral-800"
        >
          {/* AVATAR + ONLINE */}
          <div className="relative">
            <img src={m.otherAvatar} className="w-12 h-12 rounded-full" />
            {m.otherOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900"></span>
            )}
          </div>

          {/* USER + LAST MSG */}
          <div className="flex-1">
            <div className="font-semibold text-lg">{m.otherName}</div>
            <div className="text-white/60 text-sm">{m.lastMsg}</div>
          </div>

          {/* UNREAD */}
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

      {/* 🔥 ID ARAMA POPUP */}
      {searchUser && (
        <IdProfilePopup user={searchUser} onClose={() => setSearchUser(null)} />
      )}
    </div>
  );
}
