"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/profile");// Giriş başarılı → odalar sayfasına yönlendir
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-2xl border border-white/10 shadow-lg">

        <h1 className="text-3xl font-bold text-center mb-6">Giriş Yap</h1>

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-white/20 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-white/20 outline-none focus:border-blue-500"
          />

          <button
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center mt-4 text-white/70">
          Hesabın yok mu?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Kayıt Ol
          </a>
        </p>
      </div>
    </div>
  );
}
