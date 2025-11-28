"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Kullanıcı yoksa ve sayfa profili veya mesajları açmaya çalışıyorsa → login'e at
      if (!user && (pathname === "/profile" || pathname === "/messages")) {
        router.replace("/login");
      }

      // Giriş yapan kullanıcı login sayfasına girmek isterse → profile yönlendir
      if (user && pathname === "/login") {
        router.replace("/profile");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );
  }

  return <>{children}</>;
}
