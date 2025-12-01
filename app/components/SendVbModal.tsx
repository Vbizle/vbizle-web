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

  useEffect(() => setMounted(true), []);

  const fromUid = auth.currentUser?.uid;
  const presetAmounts = [25, 50, 100, 1000];

  async function send(amount: number) {
    setErrorMsg("");

    if (!fromUid) return setErrorMsg("Giriş yapmalısınız!");
    if (amount <= 0) return;
    if (currentBalance < amount)
      return setErrorMsg("Yetersiz Vb para bakiyesi!");

    setSending(true);

    try {
      // Gönderen azalt
      await updateDoc(doc(db, "users", fromUid), {
        vbBalance: increment(-amount),
        vbTotalSent: increment(amount),
      });

      // Alan artır
      await updateDoc(doc(db, "users", toUser!.uid), {
        vbBalance: increment(amount),
        vbTotalReceived: increment(amount),
      });

      // Transaction kaydı
      await addDoc(collection(db, "transactions"), {
        fromUid,
        toUid: toUser!.uid,
        fromName: auth.currentUser?.displayName ?? "Bilgi yok",
        fromAvatar: auth.currentUser?.photoURL ?? "/user.png",
        amount,
        type: "vb_send",
        roomId: roomId ?? null,
        timestamp: serverTimestamp(),
      });

      // ⭐⭐ CHAT'E SİSTEM MESAJI EKLE (EKLENDİ)
      if (roomId) {
        await addDoc(collection(db, "rooms", roomId, "chat"), {
          type: "system_vb",
          fromUid,
          toUid: toUser!.uid,
          amount,
          text: `💸 ${amount} VB gönderildi`,
          timestamp: serverTimestamp(),
        });

        // Hedefte ilerleme
        await updateDoc(doc(db, "rooms", roomId), {
          donationCurrent: increment(amount),
          hostEarn: increment(amount),
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Bir hata oluştu!");
    } finally {
      setSending(false);
    }
  }

  if (!mounted || !visible || !toUser) return null;

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
              className="py-2 rounded-lg bg-purple-700 text-white font-semibold 
              active:scale-95 transition disabled:opacity-40"
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
          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 
          text-white mb-3 outline-none"
        />

        <button
          disabled={sending || !customAmount}
          onClick={() => send(Number(customAmount))}
          className="w-full py-2 rounded-lg bg-yellow-500 text-black font-semibold 
          active:scale-95 disabled:opacity-40"
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
