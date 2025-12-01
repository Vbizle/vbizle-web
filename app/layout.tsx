"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import BottomBar from "@/app/components/BottomBar";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";

import AuthProvider from "./providers/AuthProvider";
import { RoomProvider } from "./providers/RoomProvider";
import MiniRoomBubble from "@/app/components/MiniRoomBubble";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isRoomPage =
    pathname.startsWith("/rooms/") || pathname === "/create-room";
  const isDMPage = pathname.startsWith("/messages/");

  const loading = user === undefined;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading && user === null && !isAuthPage) {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <html lang="tr">
        <body className="bg-black text-white min-h-screen flex items-center justify-center">
          <div className="text-lg opacity-50">Yükleniyor...</div>
        </body>
      </html>
    );
  }

  if (user && isAuthPage) {
    router.replace("/");
    return null;
  }

  return (
    <html lang="tr">
      <body className="bg-black text-white min-h-screen">

        {/* GLOBAL YT PLAYER */}
        <div
          id="global-yt-player"
          style={{
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "1px",
            height: "1px",
            opacity: 0.01,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        <AuthProvider>
          <RoomProvider>
            {/* NAVBAR */}
            {user && !isRoomPage && !isDMPage && !isAuthPage && (
              <header className="w-full border-b border-white/10 p-4 flex justify-between 
              w-full max-w-none md:max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold">Vbizle</h1>
                <nav className="flex gap-6">
                  <a href="/">Ana Sayfa</a>
                  <a href="/rooms">Odalar</a>
                </nav>
              </header>
            )}

            <main className="w-full max-w-none md:max-w-6xl mx-auto px-2 md:px-4 py-4">
              {children}
            </main>

            <MiniRoomBubble />

            {user && !isRoomPage && !isDMPage && !isAuthPage && <BottomBar />}
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
