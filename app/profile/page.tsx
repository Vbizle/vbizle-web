"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

// 🔥 RoomProvider state temizleme için
import { useRoomState } from "@/app/providers/RoomProvider";

export default function ProfilePage() {
  const router = useRouter();
  const user = auth.currentUser;

  const { clearRoom } = useRoomState(); // 🔥 minimize state’i sıfırlamak için

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---------------------------------------------------
  // 🔥 PROFİL VERİLERİNİ YÜKLEME
  // ---------------------------------------------------
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function loadProfile() {
      const refDoc = doc(db, "users", user.uid);
      const snap = await getDoc(refDoc);

      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setAvatar(data.avatar || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [user]);

  // ---------------------------------------------------
  // 🔥 FOTOĞRAF YÜKLEME
  // ---------------------------------------------------
  async function handlePhotoUpload(e: any) {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploading(true);

    const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    setAvatar(downloadURL);

    await updateDoc(doc(db, "users", user.uid), {
      avatar: downloadURL,
    });

    setUploading(false);
  }

  // ---------------------------------------------------
  // 🔥 PROFİL KAYDETME
  // ---------------------------------------------------
  async function save() {
    if (!user) return;

    setSaving(true);

    await updateDoc(doc(db, "users", user.uid), {
      username,
      updatedAt: Date.now(),
    });

    setSaving(false);
    alert("Profil başarıyla güncellendi!");
  }

  // ---------------------------------------------------
  // 🔥 ÇIKIŞ YAP BUTONU
  // ---------------------------------------------------
  async function logout() {
    try {
      // minimize edilen odayı temizle
      clearRoom();

      // firebase logout
      await auth.signOut();

      // login sayfasına yönlendir
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (loading) {
    return <p className="text-center mt-20">Yükleniyor...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/5 p-8 rounded-xl border border-white/10 shadow-lg">

        <h1 className="text-3xl font-bold mb-8 text-center">Profilim</h1>

        {/* PROFİL FOTOĞRAF ALANI */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={avatar || "/default-avatar.png"}
            className="w-28 h-28 rounded-full object-cover border border-white/20"
          />

          <label
            htmlFor="avatarUpload"
            className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm cursor-pointer"
          >
            {uploading ? "Yükleniyor..." : "Fotoğraf Değiştir"}
          </label>

          <input
            id="avatarUpload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </div>

        {/* KULLANICI ADI */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Kullanıcı Adı</label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-white/20 outline-none"
          />

          <button
            onClick={save}
            className="mt-4 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold disabled:opacity-40"
            disabled={saving}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        {/* 🔥 ÇIKIŞ YAP BUTONU */}
        <button
          onClick={logout}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold"
        >
          Çıkış Yap
        </button>

      </div>
    </div>
  );
}
