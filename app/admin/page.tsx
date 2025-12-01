"use client";

import { useState } from "react";
import { auth, db } from "@/firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";

export default function AdminPage() {
  const [vbId, setVbId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_UID = "9G9jqVmQSdZXVD6B6ah8w8nJwDw2";

  async function loadVB() {
    if (!auth.currentUser) {
      return alert("Giriş yapmalısınız.");
    }

    if (auth.currentUser.uid !== ADMIN_UID) {
      return alert("Bu bölüme erişim yetkiniz yok.");
    }

    if (!vbId || !amount) {
      return alert("VB-ID ve miktar zorunludur.");
    }

    setLoading(true);

    try {
      console.log("🔍 Kullanıcı aranıyor:", vbId);

      const q = query(
        collection(db, "users"),
        where("vbId", "==", vbId)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setLoading(false);
        console.warn("❌ Kullanıcı bulunamadı:", vbId);
        return alert("❌ Bu VB-ID'ye ait kullanıcı bulunamadı!");
      }

      const userDoc = snap.docs[0];
      console.log("📌 Kullanıcı bulundu:", userDoc.data());

      await updateDoc(userDoc.ref, {
        vbBalance: increment(Number(amount)),
      });

      alert(`✅ ${vbId} kullanıcısına ${amount} VB yüklendi!`);
    } catch (err: any) {
      console.error("⛔ Firestore hata:", err);
      alert("❌ Firestore yazma hatası: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">⚡ Admin VB Yükleme Paneli</h1>

      <div className="max-w-md bg-neutral-900 p-5 rounded-xl border border-white/10">
        
        <label className="block text-sm mb-1">VB-ID (Örn: VB-2)</label>
        <input
          type="text"
          className="w-full mb-3 p-2 rounded bg-white/10 outline-none"
          value={vbId}
          onChange={(e) => setVbId(e.target.value)}
          placeholder="VB-ID girin"
        />

        <label className="block text-sm mb-1">Yüklenecek VB Miktarı</label>
        <input
          type="number"
          className="w-full mb-4 p-2 rounded bg-white/10 outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500000"
        />

        <button
          disabled={loading}
          onClick={loadVB}
          className="w-full py-2 bg-purple-600 rounded-lg active:scale-95 disabled:opacity-40"
        >
          {loading ? "Yükleniyor..." : "VB Yükle"}
        </button>
      </div>
    </div>
  );
}
