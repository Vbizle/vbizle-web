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
} from "firebase/firestore";

import { useEffect, useState } from "react";

export default function AuthProvider({ children }: any) {
  const [userLoaded, setUserLoaded] = useState(false);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUserLoaded(true);
        return;
      }

      // BENİ KAYDET
      const meSnap = await getDoc(doc(db, "users", u.uid));
      setMe({
        uid: u.uid,
        name: meSnap.data()?.username,
        avatar: meSnap.data()?.avatar,
      });

      // Online yap
      await updateDoc(doc(db, "users", u.uid), {
        online: true,
      });

      // Sekme kapanınca offline yap
      const handleLeave = async () => {
        await updateDoc(doc(db, "users", u.uid), {
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

  //
  //  🔥 GLOBAL DM LISTENER (her sayfada çalışır)
  //
  useEffect(() => {
    if (!me) return;

    // META bütün konuşmalardaki unread + lastMsg'i içerir
    const unsub = onSnapshot(collectionGroup(db, "meta"), async (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type !== "modified") return;

        const data = change.doc.data();
        const convId = change.doc.ref.parent.parent?.id;
        if (!convId) return;

        const [a, b] = convId.split("_");
        const otherId = a === me.uid ? b : b === me.uid ? a : null;

        // Eğer konuşma bana ait değilse → geç
        if (!otherId) return;

        const unread = data?.unread?.[me.uid] ?? 0;
        const lastSender = data?.lastSender;

        // unread varsa ve gönderen ben DEĞİLSEM → bildirim göster
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

  //
  // 🔵 BASİT GLOBAL TOAST
  //
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
    div.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    div.style.transition = "all 0.3s ease";

    document.body.appendChild(div);

    setTimeout(() => {
      div.style.opacity = "0";
      div.style.top = "0px";

      setTimeout(() => {
        document.body.removeChild(div);
      }, 300);
    }, 2500);
  }

  if (!userLoaded) return null;

  return children;
}
