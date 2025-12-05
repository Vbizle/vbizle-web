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

export default function DirectMessagePage() {
  const router = useRouter();
  const { uid } = useParams();

  const [me, setMe] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  const [convId, setConvId] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const [imageModal, setImageModal] = useState<string | null>(null);
  const [showAvatar] = useState(false);

  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  let typingTimeout: any = null;

  const storage = getStorage();

  /* ------------------------------------------------------ */
  /* 1) ME                                                   */
  /* ------------------------------------------------------ */
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

  /* ------------------------------------------------------ */
  /* 2) OTHER USER                                          */
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
          avatar: d.avatar,
          online: d.online ?? false,
          lastSeen: d.lastSeen ?? null,
        });
      }
    }

    load();
  }, [uid]);

  /* ------------------------------------------------------ */
  /* 3) CONVERSATION ID                                     */
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

    const metaRef = doc(db, "dm", convId, "meta", "info");
    setDoc(metaRef, { unread: { [me.uid]: 0 } }, { merge: true });
  }, [convId, me]);

  /* ------------------------------------------------------ */
  /* 5) LIVE MESSAGES                                       */
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
  /* 6) TYPING LISTENER                                     */
  /* ------------------------------------------------------ */
  useEffect(() => {
    if (!convId) return;

    const metaRef = doc(db, "dm", convId, "meta", "info");
    const unsub = onSnapshot(metaRef, (snap) => {
      const d = snap.data();
      if (!d?.typing) return;
      setOtherTyping(!!d.typing[uid as string]);
    });

    return () => unsub();
  }, [convId, uid]);

  /* ------------------------------------------------------ */
  /* 7) TYPING EMIT                                         */
  /* ------------------------------------------------------ */
  function handleTyping() {
    if (!convId || !me) return;

    if (!typing) {
      setTyping(true);
      const refX = doc(db, "dm", convId, "meta", "info");
      setDoc(refX, { typing: { [me.uid]: true } }, { merge: true });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 700);
  }

  function stopTyping() {
    setTyping(false);
    const refX = doc(db, "dm", convId, "meta", "info");
    setDoc(refX, { typing: { [me.uid]: false } }, { merge: true });
  }

  /* ------------------------------------------------------ */
  /* 8) SEND IMAGE                                          */
  /* ------------------------------------------------------ */
  async function sendImage(e: any) {
    const file = e.target.files[0];
    if (!file || !convId || !me) return;

    const storageRef = ref(storage, `dm/${convId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
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
  }

  /* ------------------------------------------------------ */
  /* 9) SEND TEXT                                           */
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
  /* 10) DELETE MESSAGE                                     */
  /* ------------------------------------------------------ */
  async function deleteMessage(id: string) {
    await deleteDoc(doc(db, "dm", convId, "messages", id));
  }

  /* ------------------------------------------------------ */
  /* RENDER UI                                              */
  /* ------------------------------------------------------ */

  if (!me || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-white">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">

      {/* HEADER (SABİT) */}
      <header className="w-full p-4 flex items-center gap-3 border-b border-white/10 bg-neutral-900 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-xl">←</button>

        <img
          src={otherUser.avatar}
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setShowAvatar(true)}
        />

        <div>
          <div className="text-lg font-semibold">{otherUser.name}</div>

          <div className="text-sm text-white/70 flex items-center gap-2">
            <span className={otherUser.online ? "text-green-400" : "text-gray-400"}>●</span>
            {otherUser.online ? "Online" : "Çevrimdışı"}
          </div>

          {otherTyping && (
            <div className="text-xs text-blue-400 mt-1">Yazıyor...</div>
          )}
        </div>
      </header>

      {/* IMAGE FULLSCREEN */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[99999]"
          onClick={() => setImageModal(null)}
        >
          <img src={imageModal} className="max-w-[90%] max-h-[90%] rounded-lg" />
        </div>
      )}

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 p-4 overflow-y-auto no-scrollbar pb-[80px]">
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

      {/* SEND BAR (SABİT + KLAVYE DOSTU) */}
      <div className="bg-neutral-900 border-t border-white/10 px-3 py-3 flex items-center gap-2 sticky bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">

        {/* FOTO */}
        <label className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center cursor-pointer text-xl">
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
        </label>

        {/* EMOJI */}
        <button
          ref={emojiButtonRef}
          onClick={() => inputRef.current?.focus()}
          className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-xl"
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
          className="flex-1 h-11 px-3 rounded-xl bg-white/10 border border-white/20"
        />

        {/* SEND */}
        <button
          onClick={sendMessage}
          className="px-5 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-sm font-semibold shadow-md active:scale-95 transition"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
