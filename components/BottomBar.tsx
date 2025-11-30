"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { collectionGroup, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/firebase/firebaseConfig";

export default function BottomBar() {
  const path = usePathname();
  const tab = (href: string) => path === href;

  const [unread, setUnread] = useState(0);

  // 🔥 Global unread dinleyici
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(collectionGroup(db, "meta"), (snap) => {
      let total = 0;

      snap.forEach((d) => {
        const data = d.data();
        if (data?.unread?.[user.uid]) {
          total += data.unread[user.uid];
        }
      });

      setUnread(total);
    });

    return () => unsub();
  }, []);

  return (
    <div className="
      fixed bottom-0 left-0 w-full
      bg-[#111] text-white
      border-t border-white/10
      flex justify-around items-center
      py-3
      rounded-t-2xl
      shadow-[0_-4px_20px_rgba(0,0,0,0.4)]
      z-50
    ">
      {/* ANASAYFA */}
      <a href="/" className="flex flex-col items-center gap-1 relative">
        <span className={tab("/") ? "text-blue-400" : "text-gray-400"}>
          <svg width="26" height="26" fill="currentColor">
            <path d="M3 12L12 3L21 12V21H14V15H10V21H3V12Z" />
          </svg>
        </span>
        <span className={`text-xs ${tab("/") ? "text-blue-400" : "text-gray-400"}`}>
          Anasayfa
        </span>
      </a>

      {/* MESAJLARIM */}
      <a href="/messages" className="flex flex-col items-center gap-1 relative">
        {/* 🔴 UNREAD BADGE */}
        {unread > 0 && (
          <span
            className="
              absolute -top-1 right-2
              bg-red-600 text-white
              text-[10px] font-bold
              px-2 py-[2px]
              rounded-full
              shadow-md
            "
          >
            {unread}
          </span>
        )}

        <span className={tab("/messages") ? "text-blue-400" : "text-gray-400"}>
          <svg width="26" height="26" fill="currentColor">
            <path d="M4 4H20V18H5.17L4 19.17V4ZM6 6V14H18V6H6Z" />
          </svg>
        </span>
        <span className={`text-xs ${tab("/messages") ? "text-blue-400" : "text-gray-400"}`}>
          Mesajlarım
        </span>
      </a>

      {/* PROFİLİM */}
      <a href="/profile" className="flex flex-col items-center gap-1 relative">
        <span className={tab("/profile") ? "text-blue-400" : "text-gray-400"}>
          <svg width="26" height="26" fill="currentColor">
            <path d="M12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12ZM12 14C8.13 14 2 16.17 2 20V22H22V20C22 16.17 15.87 14 12 14Z"/>
          </svg>
        </span>
        <span className={`text-xs ${tab("/profile") ? "text-blue-400" : "text-gray-400"}`}>
          Profilim
        </span>
      </a>
    </div>
  );
}
