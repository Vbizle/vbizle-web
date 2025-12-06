"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useRoomState } from "@/app/providers/RoomProvider";

import ProfileTopBar from "./ProfileTopBar";
import ProfileHeader from "./ProfileHeader";
import CoverEditModal from "./CoverEditModal";
import FullscreenGallery from "./FullscreenGallery";

export default function ProfilePage() {
  const router = useRouter();
  const user = auth.currentUser;
  const { clearRoom } = useRoomState();

  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [vbId, setVbId] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [usernameEdit, setUsernameEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");

  const [coverEditOpen, setCoverEditOpen] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  // -------------------------
  // PROFİLİ YÜKLEME
  // -------------------------
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function load() {
      const refDoc = doc(db, "users", user.uid);
      const snap = await getDoc(refDoc);

      if (snap.exists()) {
        const d: any = snap.data();
        setUsername(d.username || "");
        setAvatar(d.avatar || "");
        setVbId(d.vbId || "");
        setGallery(d.galleryPhotos || []);
      }

      setLoading(false);
    }

    load();
  }, [user, router]);

  // -------------------------
  // AVATAR YÜKLEME
  // -------------------------
  async function handleAvatarUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user.uid), { avatar: url });
      setAvatar(url);

      setNotice("Profil fotoğrafı güncellendi!");
    } catch (err) {
      console.error(err);
      setNotice("Profil fotoğrafı yüklenirken hata oluştu.");
    } finally {
      setTimeout(() => setNotice(""), 2000);
    }
  }

  // -------------------------
  // KAPAK FOTOĞRAF YÜKLEME
  // -------------------------
  async function handleGalleryUpload(index: number, file: File) {
    if (!user) return;

    try {
      const storageRef = ref(storage, `gallery/${user.uid}/${index}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const updated = [...gallery];
      updated[index] = url;

      await updateDoc(doc(db, "users", user.uid), {
        galleryPhotos: updated,
      });

      setGallery(updated);
      setNotice("Kapak fotoğrafı güncellendi!");
    } catch (err) {
      console.error(err);
      setNotice("Kapak fotoğrafı yüklenirken hata oluştu.");
    } finally {
      setTimeout(() => setNotice(""), 2000);
    }
  }

  // -------------------------
  // USERNAME INLINE SAVE
  // -------------------------
  async function saveUsername() {
    if (!user) return;

    try {
      setSaving(true);

      await updateDoc(doc(db, "users", user.uid), {
        username,
        updatedAt: Date.now(),
      });

      setNotice("Kullanıcı adı güncellendi!");
      setUsernameEdit(false);
    } catch (err) {
      console.error(err);
      setNotice("Kullanıcı adı güncellenirken hata oluştu.");
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(""), 2000);
    }
  }

  // -------------------------
  // LOGOUT
  // -------------------------
  async function logout() {
    clearRoom();
    await auth.signOut();
    router.replace("/login");
  }

  // -------------------------
  // RENDER
  // -------------------------
  if (loading) {
    return <p className="text-center mt-20 text-white">Yükleniyor...</p>;
  }

  const hasGallery = gallery.filter(Boolean).length > 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center pt-12 px-4 text-white">
      {/* Bildirim */}
      {notice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-2 rounded-lg z-50">
          {notice}
        </div>
      )}

      {/* Üst Bar (başlık + 3 çizgi) */}
      <ProfileTopBar onLogout={logout} />

      {/* Kapak + Avatar + Kullanıcı Bilgileri */}
      <div className="w-full max-w-md mt-4 flex flex-col items-center">
        <ProfileHeader
          avatar={avatar}
          username={username}
          vbId={vbId}
          gallery={gallery}
          usernameEdit={usernameEdit}
          savingUsername={saving}
          onAvatarChange={handleAvatarUpload}
          onUsernameClick={() => setUsernameEdit(true)}
          onUsernameChange={(val) => setUsername(val)}
          onUsernameSave={saveUsername}
          onCoverClick={() => {
            if (hasGallery) setFullScreenOpen(true);
          }}
          onOpenCoverEdit={() => setCoverEditOpen(true)}
        />
      </div>

      {/* Kapak Fotoğrafları Düzenleme Modalı */}
      <CoverEditModal
        open={coverEditOpen}
        gallery={gallery}
        onClose={() => setCoverEditOpen(false)}
        onSelectFile={handleGalleryUpload}
      />

      {/* Fullscreen Kapak Slider */}
      <FullscreenGallery
        open={fullScreenOpen}
        gallery={gallery}
        onClose={() => setFullScreenOpen(false)}
      />
    </div>
  );
}
