"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        username,
        email,
        avatar: "",
        createdAt: Date.now(),
      });

      router.push("/profile");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-2xl border border-white/10 shadow-lg">

        <h1 className="text-3xl font-bold text-center mb-6">Kayıt Ol</h1>

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-white/20 outline-none focus:border-blue-500"
          />

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
            className="mt-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 transition text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-center mt-4 text-white/70">
          Zaten hesabın var mı?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Giriş Yap
          </a>
        </p>
      </div>
    </div>
  );
}
