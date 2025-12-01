// app/hooks/useVbWallet.ts
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebaseConfig";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type WalletState = {
  vbBalance: number;
  vbTotalSent: number;
  vbTotalReceived: number;
};

export function useVbWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubWallet: (() => void) | null = null;

    unsubUser = onAuthStateChanged(auth, async (user) => {
      // Kullanıcı yoksa
      if (!user) {
        setWallet(null);
        setLoadingWallet(false);
        setError(null);
        if (unsubWallet) unsubWallet();
        return;
      }

      setLoadingWallet(true);
      setError(null);

      const userRef = doc(db, "users", user.uid);

      try {
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          // Kullanıcı dokümanı yoksa sadece cüzdan alanlarıyla minimal bir doc aç
          const initial: WalletState = {
            vbBalance: 0,
            vbTotalSent: 0,
            vbTotalReceived: 0,
          };
          await setDoc(
            userRef,
            {
              ...initial,
              createdAt: new Date(),
            },
            { merge: true }
          );
        } else {
          // Eksik alanları tamamla
          const data: any = snap.data() || {};
          const patch: Partial<WalletState> = {};
          if (data.vbBalance === undefined) patch.vbBalance = 0;
          if (data.vbTotalSent === undefined) patch.vbTotalSent = 0;
          if (data.vbTotalReceived === undefined)
            patch.vbTotalReceived = 0;

          if (Object.keys(patch).length > 0) {
            await updateDoc(userRef, patch);
          }
        }

        // Canlı dinleyici: bakiye değişirse otomatik güncelle
        if (unsubWallet) unsubWallet();
        unsubWallet = onSnapshot(userRef, (s) => {
          const d: any = s.data() || {};
          setWallet({
            vbBalance: d.vbBalance ?? 0,
            vbTotalSent: d.vbTotalSent ?? 0,
            vbTotalReceived: d.vbTotalReceived ?? 0,
          });
          setLoadingWallet(false);
        });
      } catch (err: any) {
        console.error("useVbWallet error:", err);
        setError(err?.message || "Wallet okunamadı");
        setLoadingWallet(false);
      }
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubWallet) unsubWallet();
    };
  }, []);

  return {
    wallet,
    loadingWallet,
    error,
  };
}
