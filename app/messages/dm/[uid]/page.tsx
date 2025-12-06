"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { auth, db } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

/* ------------------------------------------------------ */
/* 🔥 WEB ↔ APK AYIRICI                                   */
/* ------------------------------------------------------ */
const isNative =
  typeof window !== "undefined" &&
  typeof (window as any).Capacitor !== "undefined" &&
  (window as any).Capacitor.isNativePlatform === true;

export default function DirectMessagePage() {
  const router = useRouter();
  const { uid } = useParams();

  const [me, setMe] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  const [convId, setConvId] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const [imageModal, setImageModal] = useState<string | null>(null);

  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  let typingTimeout: any;

  const storage = getStorage();

  /* ------------------------------------------------------ */
  /* 1) KENDİ PROFİLİMİ YÜKLE                               */
  /* ------------------------------------------------------ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");

      const snap = await getDoc(doc(db, "users", u.uid));

      setMe({
        uid: u.uid,
        name: snap.data()?.username,
        avatar: snap.data()?.avatar || "/user.png",
      });
    });

    return () => unsub();
  }, []);

  /* ------------------------------------------------------ */
  /* 2) KARŞI KULLANICIYI YÜKLE                             */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!uid) return;
    async function load() {
      const snap = await getDoc(doc(db, "users", uid as string));
      if (snap.exists()) {
        const d = snap.data();
        setOtherUser({
          uid,
          name: d.username,
          avatar: d.avatar || "/user.png",
          online: d.online ?? false,
        });
      }
    }
    load();
  }, [uid]);

  /* ------------------------------------------------------ */
  /* 3) SOHBET ID OLUŞTUR                                   */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!me || !uid) return;
    const a = me.uid;
    const b = uid as string;
    const id = a < b ? `${a}_${b}` : `${b}_${a}`;
    setConvId(id);
  }, [me, uid]);

  /* ------------------------------------------------------ */
  /* 4) UNREAD RESET                                        */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!convId || !me) return;

    const refMeta = doc(db, "dm", convId, "meta", "info");
    setDoc(refMeta, { unread: { [me.uid]: 0 } }, { merge: true });
  }, [convId, me]);

  /* ------------------------------------------------------ */
  /* 5) MESAJLARI CANLI DİNLE                               */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!convId) return;

    const qRef = query(collection(db, "dm", convId, "messages"), orderBy("time"));

    const unsub = onSnapshot(qRef, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(arr);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    });

    return () => unsub();
  }, [convId]);

  /* ------------------------------------------------------ */
  /* 6) TYPING DİNLE                                         */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!convId) return;

    const refMeta = doc(db, "dm", convId, "meta", "info");
    const unsub = onSnapshot(refMeta, (snap) => {
      const d = snap.data();
      if (!d?.typing) return;
      setOtherTyping(!!d.typing[uid as string]);
    });

    return () => unsub();
  }, [convId, uid]);

  /* ------------------------------------------------------ */
  /* 7) YAZIYOR DURUMU                                       */
  /* ------------------------------------------------------ */
  function handleTyping() {
    if (!convId || !me) return;

    if (!typing) {
      setTyping(true);
      setDoc(doc(db, "dm", convId, "meta", "info"), {
        typing: { [me.uid]: true },
      }, { merge: true });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setTyping(false);
      setDoc(doc(db, "dm", convId, "meta", "info"), {
        typing: { [me.uid]: false },
      }, { merge: true });
    }, 700);
  }

  /* ------------------------------------------------------ */
  /* 8) FOTO GÖNDER — HİBRİT (SSR SAFE)                     */
  /* ------------------------------------------------------ */
  async function sendImage(e?: any) {
    if (!convId || !me) return;

    try {
      let blob: Blob | File | null = null;

      if (isNative) {
        // ⚡ SSR-SAFE CAMERA IMPORT
        const moduleName = "@capacitor/camera";
        const CameraModule = await import(moduleName);
        const { Camera, CameraSource, CameraResultType } = CameraModule;

        const photo = await Camera.getPhoto({
          quality: 85,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
        });

        const base64 = `data:image/jpeg;base64,${photo.base64String}`;
        blob = await fetch(base64).then((r) => r.blob());

      } else {
        const file = e?.target?.files?.[0];
        if (!file) return;
        blob = file;
      }

      const storageRef = ref(storage, `dm/${convId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob!);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "dm", convId, "messages"), {
        uid: me.uid,
        imgUrl: url,
        time: serverTimestamp(),
      });

      await updateDoc(doc(db, "dm", convId, "meta", "info"), {
        lastMsg: "[Fotoğraf]",
        lastSender: me.uid,
        time: serverTimestamp(),
        unread: { [uid]: 1, [me.uid]: 0 },
      });

    } catch (err) {
      console.error("DM Image Error:", err);
    }
  }

  /* ------------------------------------------------------ */
  /* 9) METİN GÖNDER                                         */
  /* ------------------------------------------------------ */
  async function sendMessage() {
    if (!newMsg.trim()) return;

    await addDoc(collection(db, "dm", convId, "messages"), {
      uid: me.uid,
      text: newMsg,
      time: serverTimestamp(),
    });

    await updateDoc(doc(db, "dm", convId, "meta", "info"), {
      lastMsg: newMsg,
      lastSender: me.uid,
      time: serverTimestamp(),
      unread: { [uid]: 1, [me.uid]: 0 },
    });

    setNewMsg("");
  }

  function handleKey(e: any) {
    if (e.key === "Enter") sendMessage();
  }

  /* ------------------------------------------------------ */
  /* 10) MESAJ SİL                                           */
  /* ------------------------------------------------------ */
  async function deleteMessage(id: string) {
    await deleteDoc(doc(db, "dm", convId, "messages", id));
  }

  /* ------------------------------------------------------ */
  /* UI                                                     */
  /* ------------------------------------------------------ */

  if (!me || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">

      {/* HEADER */}
      <header className="w-full p-4 flex items-center gap-3 border-b border-white/10 bg-neutral-900 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-xl">←</button>

        <img
          src={otherUser.avatar}
          className="w-10 h-10 rounded-full"
        />

        <div>
          <div className="text-lg font-semibold">{otherUser.name}</div>
          {otherTyping && <div className="text-xs text-blue-400">Yazıyor...</div>}
        </div>
      </header>

      {/* IMAGE MODAL */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[99999]"
          onClick={() => setImageModal(null)}
        >
          <img src={imageModal} className="max-w-[90%] max-h-[90%] rounded-lg" />
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 p-4 overflow-y-auto pb-28 no-scrollbar">
        {messages.map((m) => {
          const mine = m.uid === me.uid;

          return (
            <div
              key={m.id}
              onContextMenu={(e) => {
                e.preventDefault();
                if (mine && confirm("Mesaj silinsin mi?")) deleteMessage(m.id);
              }}
              className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
            >
              {m.imgUrl ? (
                <img
                  src={m.imgUrl}
                  onClick={() => setImageModal(m.imgUrl)}
                  className={`w-40 h-40 rounded-xl object-cover cursor-pointer border ${
                    mine ? "border-blue-500" : "border-white/20"
                  }`}
                />
              ) : (
                <div
                  className={`px-4 py-2 rounded-xl max-w-xs ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white/10 text-white rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* SEND BAR */}
      <div className="bg-neutral-900 border-t border-white/10 px-3 py-3 flex items-center gap-2 fixed bottom-0 left-0 right-0 z-50">

        {/* FOTO BUTONU */}
        {isNative ? (
          <button
            onClick={() => sendImage()}
            className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-xl"
          >
            🖼️
          </button>
        ) : (
          <label className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-xl cursor-pointer">
            🖼️
            <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
          </label>
        )}

        {/* INPUT */}
        <input
          value={newMsg}
          onKeyDown={handleKey}
          onChange={(e) => {
            setNewMsg(e.target.value);
            handleTyping();
          }}
          placeholder="Mesaj yaz..."
          className="flex-1 h-11 px-3 rounded-xl bg-white/10 border border-white/20"
        />

        {/* SEND */}
        <button
          onClick={sendMessage}
          className="px-5 h-11 bg-blue-600 rounded-xl font-semibold active:scale-95 transition"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
