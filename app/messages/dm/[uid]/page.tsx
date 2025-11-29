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
  updateDoc
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { auth, db } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function DirectMessagePage() {
  const router = useRouter();
  const { uid } = useParams();

  const [me, setMe] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  const [convId, setConvId] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAvatar, setShowAvatar] = useState(false);

  const [imageModal, setImageModal] = useState<string | null>(null);

  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const storage = getStorage();
  let typingTimeout: any = null;

  const inputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  function openEmojiKeyboard() {
    if (inputRef.current) inputRef.current.focus();
  }

  /* =====================================================================================
     1) KULLANICI
  ===================================================================================== */
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

  /* =====================================================================================
     2) KARŞI KULLANICI
  ===================================================================================== */
  useEffect(() => {
    if (!uid) return;

    async function load() {
      const snap = await getDoc(doc(db, "users", uid as string));
      if (snap.exists()) {
        setOtherUser({
          uid,
          name: snap.data().username,
          avatar: snap.data().avatar,
          online: snap.data().online ?? false,
          lastSeen: snap.data().lastSeen ?? null
        });
      }
    }

    load();
  }, [uid]);

  /* =====================================================================================
     3) CONVERSATION ID
  ===================================================================================== */
  useEffect(() => {
    if (!me || !uid) return;

    const a = me.uid;
    const b = uid as string;

    const id = a < b ? `${a}_${b}` : `${b}_${a}`;
    setConvId(id);
  }, [me, uid]);

  /* =====================================================================================
     4) UNREAD = 0
  ===================================================================================== */
  useEffect(() => {
    if (!convId || !me) return;

    const metaRef = doc(db, "dm", convId, "meta", "info");

    setDoc(
      metaRef,
      {
        unread: { [me.uid]: 0 }
      },
      { merge: true }
    );
  }, [convId, me]);

  /* =====================================================================================
     5) MESAJLARI ÇEK
  ===================================================================================== */
  useEffect(() => {
    if (!convId) return;

    const qRef = query(
      collection(db, "dm", convId, "messages"),
      orderBy("time")
    );

    const unsub = onSnapshot(qRef, async (snap) => {
      const arr = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setMessages(arr);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsub();
  }, [convId]);

  /* =====================================================================================
     6) TYPING
  ===================================================================================== */
  useEffect(() => {
    if (!convId) return;

    const metaRef = doc(db, "dm", convId, "meta", "info");

    const unsub = onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      if (!data?.typing) return;

      setOtherTyping(!!data.typing[uid as string]);
    });

    return () => unsub();
  }, [convId, uid]);

  function handleTyping() {
    if (!convId || !me) return;

    if (!typing) {
      setTyping(true);

      const metaRef = doc(db, "dm", convId, "meta", "info");
      setDoc(
        metaRef,
        { typing: { [me.uid]: true } },
        { merge: true }
      );
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => stopTyping(), 600);
  }

  function stopTyping() {
    setTyping(false);
    const metaRef = doc(db, "dm", convId, "meta", "info");
    setDoc(
      metaRef,
      { typing: { [me.uid]: false } },
      { merge: true }
    );
  }

  /* =====================================================================================
     FOTO GÖNDER
  ===================================================================================== */
  async function sendImage(e: any) {
    const file = e.target.files[0];
    if (!file || !convId || !me) return;

    const storageRef = ref(storage, `dm/${convId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "dm", convId, "messages"), {
      uid: me.uid,
      imgUrl: url,
      time: serverTimestamp()
    });
  }

  /* =====================================================================================
     METİN GÖNDER
  ===================================================================================== */
  async function sendMessage() {
    if (!newMsg.trim()) return;
    if (!me || !convId) return;

    await addDoc(collection(db, "dm", convId, "messages"), {
      uid: me.uid,
      text: newMsg,
      time: serverTimestamp(),
    });

    setNewMsg("");
  }

  function handleKey(e: any) {
    if (e.key === "Enter") sendMessage();
  }

  async function deleteMessage(msgId: string) {
    await deleteDoc(doc(db, "dm", convId, "messages", msgId));
  }

  if (!me || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-white">
        Yükleniyor...
      </div>
    );
  }

  /* =====================================================================================
     UI
  ===================================================================================== */
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">

      {/* SABİT HEADER */}
      <header className="w-full p-4 flex items-center gap-3 border-b border-white/10 bg-neutral-900 fixed top-0 left-0 right-0 z-50">
        <button onClick={() => router.back()} className="text-xl">←</button>

        <img
          src={otherUser.avatar}
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setShowAvatar(true)}
        />

        <div>
          <div className="text-lg font-semibold">{otherUser.name}</div>

          <div className="text-sm text-white/60 flex items-center gap-2">
            <span className={otherUser.online ? "text-green-400" : "text-gray-400"}>●</span>

            {otherUser.online
              ? "Online"
              : otherUser.lastSeen
                ? `Son görülme: ${new Date(otherUser.lastSeen.toMillis()).toLocaleTimeString("tr-TR")}`
                : "Çevrimdışı"}
          </div>

          {otherTyping && (
            <div className="text-xs text-blue-400 mt-1">Yazıyor...</div>
          )}
        </div>
      </header>

      {/* MESAJ ALANI */}
      <div className="flex-1 mt-[90px] mb-[80px] p-4 overflow-y-auto">
        {messages.map((m) => {
          const mine = m.uid === me.uid;

          return (
            <div
              key={m.id}
              onContextMenu={(e) => {
                e.preventDefault();
                if (mine && confirm("Mesajı sil?")) deleteMessage(m.id);
              }}
              className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
            >
              {m.imgUrl ? (
                <img
                  src={m.imgUrl}
                  onClick={() => setImageModal(m.imgUrl)}
                  className={`w-40 h-40 object-cover rounded-xl cursor-pointer border ${
                    mine ? "border-blue-500" : "border-white/20"
                  }`}
                />
              ) : (
                <div
                  className={`relative px-4 py-2 rounded-xl max-w-xs ${
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

      {/* SABİT SEND BAR */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 p-3 bg-neutral-900 flex items-center gap-3">

        {/* FOTO BUTONU */}
        <label className="px-3 py-2 bg-white/10 border border-white/20 rounded cursor-pointer flex items-center">
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
        </label>

        {/* EMOJI BUTONU */}
        <button
          ref={emojiButtonRef}
          onClick={openEmojiKeyboard}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded"
        >
          😊
        </button>

        {/* INPUT */}
        <input
          ref={inputRef}
          value={newMsg}
          onKeyDown={handleKey}
          onChange={(e) => {
            setNewMsg(e.target.value);
            handleTyping();
          }}
          placeholder="Mesaj yaz..."
          className="flex-1 p-2 rounded bg-white/10 border border-white/20"
        />

        {/* GÖNDER */}
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 rounded whitespace-nowrap"
        >
          Gönder
        </button>

      </div>

      {/* AVATAR FULLSCREEN */}
      {showAvatar && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowAvatar(false)}
        >
          <img src={otherUser.avatar} className="w-64 h-64 rounded-full border-4 border-white" />
        </div>
      )}

      {/* FOTO MODAL */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setImageModal(null)}
        >
          <img src={imageModal} className="max-w-[90%] max-h-[90%] rounded-lg" />
        </div>
      )}

    </div>
  );
}
