"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseConfig";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collectionGroup,
  getDoc,
  runTransaction,
  setDoc,
} from "firebase/firestore";

import { useEffect, useState } from "react";

// 🔥 VB CÜZDAN HOOK
import { useVbWallet } from "@/app/hooks/useVbWallet";

// ==========================================================
//  SIRALI VB-ID (VB-1 → VB-2 → VB-3 ... )
// ==========================================================
async function ensureSequentialVbId(uid: string) {
  const userRef = doc(db, "users", uid);
  const counterRef = doc(db, "_counters", "vbUserCounter");

  const userSnap = await getDoc(userRef);

  // Kullanıcı zaten vbId aldıysa → çık
  if (userSnap.exists() && userSnap.data().vbId) return;

  await runTransaction(db, async (transaction) => {
    let counterSnap = await transaction.get(counterRef);

    if (!counterSnap.exists()) {
      transaction.set(counterRef, { last: 0 });
      counterSnap = {
        exists: () => true,
        data: () => ({ last: 0 }),
      };
    }

    const last = counterSnap.data().last ?? 0;
    const next = last + 1;

    transaction.update(counterRef, { last: next });

    const vbId = `VB-${next}`;
    transaction.update(userRef, { vbId });
  });
}

// ==========================================================
//                      AUTH PROVIDER
// ==========================================================
export default function AuthProvider({ children }: any) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // --------------------------------------------------------
  // LOGIN / LOGOUT
  // --------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u || null);

      if (!u) {
        setUserLoaded(true);
        return;
      }

      const userRef = doc(db, "users", u.uid);

      // 🔥 Önce VB-ID ata (yoksa)
      await ensureSequentialVbId(u.uid);

      // 🔥 Şimdi kullanıcıyı tekrar oku
      const meSnap = await getDoc(userRef);
      const data = meSnap.data() || {};

      // 🔥 Avatar fallback burada çözülüyor
      const avatar =
        data.avatar && data.avatar !== "" && data.avatar !== null
          ? data.avatar
          : "/default-avatar.png";

      setMe({
        uid: u.uid,
        name: data.username,
        avatar,
        vbId: data.vbId,
      });

      // Online yap
      await updateDoc(userRef, { online: true });

      const handleLeave = async () => {
        await updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      };

      window.addEventListener("beforeunload", handleLeave);

      setUserLoaded(true);

      return () => {
        window.removeEventListener("beforeunload", handleLeave);
        handleLeave();
      };
    });

    return () => unsub();
  }, []);

  // --------------------------------------------------------
  // 2) CÜZDAN ALANLARINI OLUŞTUR
  // --------------------------------------------------------
  useVbWallet(firebaseUser);

  // --------------------------------------------------------
  // 3) GLOBAL DM BİLDİRİMLERİ
  // --------------------------------------------------------
  useEffect(() => {
    if (!me) return;

    const unsub = onSnapshot(collectionGroup(db, "meta"), async (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type !== "modified") return;

        const data = change.doc.data();
        const convId = change.doc.ref.parent.parent?.id;
        if (!convId) return;

        const [a, b] = convId.split("_");
        const otherId = a === me.uid ? b : b === me.uid ? a : null;

        if (!otherId) return;

        const unread = data?.unread?.[me.uid] ?? 0;
        const lastSender = data?.lastSender;

        if (unread > 0 && lastSender !== me.uid) {
          const userSnap = await getDoc(doc(db, "users", otherId));
          const senderName =
            userSnap.exists() ? userSnap.data().username : "Kullanıcı";

          showGlobalToast(`${senderName} sana mesaj gönderdi`);
        }
      });
    });

    return () => unsub();
  }, [me]);

  // --------------------------------------------------------
  // TOAST
  // --------------------------------------------------------
  function showGlobalToast(text: string) {
    const div = document.createElement("div");
    div.innerText = text;

    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.left = "50%";
    div.style.transform = "translateX(-50%)";
    div.style.padding = "12px 20px";
    div.style.background = "#2563eb";
    div.style.color = "white";
    div.style.borderRadius = "12px";
    div.style.fontSize = "15px";
    div.style.zIndex = "99999";

    document.body.appendChild(div);

    setTimeout(() => {
      div.style.opacity = "0";
      div.style.top = "0px";
      setTimeout(() => div.remove(), 300);
    }, 2500);
  }

  if (!userLoaded) return null;

  return children;
}
