"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseConfig";

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      setUser(u);

      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const def = {
          username: u.displayName || "Misafir",
          avatar: u.photoURL || "/user.png",
        };
        await setDoc(userRef, def);
        setProfile(def);
      } else {
        const d = snap.data();
        setProfile({
          username: d.username || "Misafir",
          avatar: d.avatar || "/user.png",
        });
      }

      setLoadingProfile(false);
    });

    return () => unsub();
  }, []);

  return { user, profile, loadingProfile };
}
