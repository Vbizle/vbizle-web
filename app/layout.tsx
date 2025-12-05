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
import { UiProvider } from "./providers/UiProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  /* 🔥 GERÇEK MOBİL EKRAN YÜKSEKLİĞİ FIX */
  useEffect(() => {
    function setVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isRoomPage =
    pathname.startsWith("/rooms/") || pathname === "/create-room";
  const isDMPage = pathname.startsWith("/messages/");

  const loading = user === undefined;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 🔥 Login değilse login-required sayfalarını engelle
  useEffect(() => {
    if (!loading && user === null && !isAuthPage) {
      router.replace("/login");
    }
  }, [user, loading, pathname]);

  // 🔥 Giriş yapmış kullanıcı login/register sayfasına girdiyse yönlendir
  useEffect(() => {
    if (!loading && user && isAuthPage) {
      router.replace("/");
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <html lang="tr">
        <body className="bg-black text-white min-h-screen flex items-center justify-center">
          <div className="text-lg opacity-50">Yükleniyor...</div>
        </body>
      </html>
    );
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
            <UiProvider>
              {/* NAVBAR */}
              {user && !isRoomPage && !isDMPage && !isAuthPage && (
                <header className="w-full border-b border-white/10 p-4 flex justify-between">
                  <h1 className="text-2xl font-bold">Vbizle</h1>
                  <nav className="flex gap-6">
                    <a href="/">Ana Sayfa</a>
                    <a href="/rooms">Odalar</a>
                  </nav>
                </header>
              )}

              <main className="w-full px-2 py-4">
                {children}
              </main>

              <MiniRoomBubble />

              {user && !isRoomPage && !isDMPage && !isAuthPage && <BottomBar />}
            </UiProvider>
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
