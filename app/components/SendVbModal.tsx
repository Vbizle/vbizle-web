"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "@/firebase/firebaseConfig";
import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

type Props = {
  visible: boolean;
  onClose: () => void;
  toUser: {
    uid: string;
    name: string;
    avatar?: string;
  } | null;
  roomId?: string;
  currentBalance: number;
};

export default function SendVbModal({
  visible,
  onClose,
  toUser,
  roomId,
  currentBalance,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [sending, setSending] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [senderProfile, setSenderProfile] = useState<any>(null);

  useEffect(() => setMounted(true), []);

  const fromUid = auth.currentUser?.uid;
  const presetAmounts = [25, 50, 100, 1000];

  // 🔥 Gönderen profilini al
  useEffect(() => {
    async function loadSender() {
      if (!fromUid) return;

      console.log("📌[SendVbModal] Profil yükleniyor → fromUid:", fromUid);

      const ref = doc(db, "users", fromUid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        console.log("📌[SendVbModal] Profil bulundu:", snap.data());
        setSenderProfile(snap.data());
      } else {
        console.log("❌[SendVbModal] Profil bulunamadı!");
      }
    }

    loadSender();
  }, [fromUid]);

  // ==================================================================
  // 🔥 SEND — Premium Bağış Kayıt + Premium Chat Mesajı + Loglar
  // ==================================================================
  async function send(amount: number) {
    console.log("======================================");
    console.log("💸 SEND VB ÇALIŞTI");
    console.log("amount:", amount);
    console.log("roomId:", roomId);
    console.log("fromUid:", fromUid);
    console.log("toUser:", toUser);
    console.log("======================================");

    setErrorMsg("");

    if (!fromUid) return setErrorMsg("Giriş yapmalısınız!");
    if (!toUser) return setErrorMsg("Kullanıcı bulunamadı!");
    if (amount <= 0) return;
    if (currentBalance < amount) return setErrorMsg("Yetersiz bakiye!");

    setSending(true);

    try {
      // 👤 Gönderen → Bakiye azalt
      await updateDoc(doc(db, "users", fromUid), {
        vbBalance: increment(-amount),
        vbTotalSent: increment(amount),
      });

      // 👤 Alan → Bakiye arttır
      await updateDoc(doc(db, "users", toUser.uid), {
        vbBalance: increment(amount),
        vbTotalReceived: increment(amount),
      });

      console.log("📌 transactions kaydı ekleniyor...");

      // ⭐ Transactions tablosu
      await addDoc(collection(db, "transactions"), {
        fromUid,
        toUid: toUser.uid,
        fromName: senderProfile?.username || "Kullanıcı",
        fromAvatar: senderProfile?.avatar || "/user.png",
        toName: toUser.name || "Kullanıcı",
        toAvatar: toUser.avatar || "/user.png",
        amount,
        type: "vb_send",
        roomId: roomId || null,
        timestamp: serverTimestamp(),
      });

      // ⭐ PREMIUM CHAT MESAJI — %100 çalışan final
      if (roomId) {
        console.log("📌 Chat mesajı yazılıyor → Room:", roomId);

        const chatRef = collection(db, "rooms", String(roomId), "chat");

        await addDoc(chatRef, {
          type: "vb_premium",
          fromUid,
          fromName: senderProfile?.username || "Kullanıcı",
          fromAvatar: senderProfile?.avatar || "/user.png",

          toUid: toUser.uid,
          toName: toUser.name || "Kullanıcı",
          toAvatar: toUser.avatar || "/user.png",

          amount,
          text: `💸 ${amount} Vb gönderildi`,

          createdAt: Date.now(), // Anında değer → listener kaçırmaz
          timestamp: serverTimestamp()
        });

        console.log("✅ PREMIUM CHAT MESAJI EKLENDİ!");
      } else {
        console.log("❌ roomId gelmedi → Chat mesajı gönderilemedi!");
      }

      console.log("✅ SEND VB TAMAMLANDI");
      onClose();

    } catch (err) {
      console.error("🔥 SEND VB HATASI:", err);
      setErrorMsg("Bir hata oluştu!");
    } finally {
      setSending(false);
    }
  }

  // Modal görünmüyorsa render etme
  if (!mounted || !visible || !toUser) {
    console.log("📌 MODAL RENDER ETMİYOR:", { mounted, visible, toUser });
    return null;
  }

  console.log("📌 MODAL AÇILDI → toUser:", toUser);

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[999999]">
      <div className="w-80 bg-neutral-900 p-5 rounded-2xl border border-white/10 shadow-2xl">
        <h3 className="text-xl font-bold text-center mb-3">💸 VB Gönder</h3>

        <p className="text-white/70 text-center mb-2">
          {toUser.name} kişisine gönderiyorsun
        </p>

        <p className="text-center text-green-400 text-sm mb-4">
          Mevcut bakiye: {currentBalance} Vb
        </p>

        {errorMsg && (
          <div className="mb-3 p-2 rounded-lg bg-red-600/30 text-red-300 text-center text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {presetAmounts.map((amt) => (
            <button
              key={amt}
              disabled={sending}
              onClick={() => send(amt)}
              className="py-2 rounded-lg bg-purple-700 text-white font-semibold active:scale-95 transition disabled:opacity-40"
            >
              {amt} Vb
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Özel miktar"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white mb-3 outline-none"
        />

        <button
          disabled={sending || !customAmount}
          onClick={() => send(Number(customAmount))}
          className="w-full py-2 rounded-lg bg-yellow-500 text-black font-semibold active:scale-95 disabled:opacity-40"
        >
          Gönder
        </button>

        <button
          disabled={sending}
          onClick={onClose}
          className="w-full py-2 mt-3 rounded-lg bg-white/10"
        >
          Kapat
        </button>
      </div>
    </div>,
    document.body
  );
}
