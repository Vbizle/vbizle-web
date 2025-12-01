"use client";

import { useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function DonationSettingsModal({
  roomId,
  room,
  visible,
  onClose,
}) {
  if (!visible) return null;

  const [title, setTitle] = useState(room?.donationTitle || "");
  const [target, setTarget] = useState(room?.donationTarget || 1000);

  async function saveSettings() {
    await updateDoc(doc(db, "rooms", roomId), {
      donationTitle: title,
      donationTarget: Number(target),
    });

    onClose();
  }

  async function resetDonationBar() {
    await updateDoc(doc(db, "rooms", roomId), {
      donationCurrent: 0,
      lastReset: Date.now(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999]">
      <div className="w-80 bg-neutral-900 p-5 rounded-xl border border-white/10 shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Bağış Ayarları</h3>

        {/* Başlık */}
        <label className="text-sm text-white/70">Bağış Yazısı</label>
        <input
          className="w-full p-2 rounded bg-white/10 border border-white/20 mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Hedef */}
        <label className="text-sm text-white/70">Hedef (Vb)</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-white/10 border border-white/20 mb-4"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        {/* Kaydet */}
        <button
          onClick={saveSettings}
          className="w-full py-2 bg-purple-600 rounded-lg mb-3"
        >
          Kaydet
        </button>

        {/* Reset */}
        <button
          onClick={resetDonationBar}
          className="w-full py-2 bg-red-600 rounded-lg mb-3"
        >
          🚨 Bağış Barını Sıfırla
        </button>

        {/* Kapat */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-white/10 rounded-lg"
        >
          Kapat
        </button>
      </div>
    </div>
  );
} 