"use client";

import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/firebaseConfig";
import { useRoomState } from "@/app/providers/RoomProvider";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

interface Props {
  user: {
    uid: string;
    name: string;
    photo?: string;
    avatar?: string;
  };
  onClose: () => void;
  isOwner: boolean;
}

export default function ProfilePopup({ user, onClose, isOwner }: Props) {
  const router = useRouter();
  const { minimizeRoom } = useRoomState();

  const currentUid = auth.currentUser?.uid;
  if (!user) return null;

  const isSelf = currentUid === user.uid;
  const userPhoto = user.photo || user.avatar || "/user.png";

  // 🔥 DM’ye geçmeden önce odayı minimize et
  const handleSendDM = () => {
    try {
      const roomId = window.location.pathname.split("/").pop();

      minimizeRoom({
        roomId,
        roomImage: userPhoto,
      });

      router.push(`/messages/dm/${user.uid}`);

      onClose();
    } catch (err) {
      console.error("Minimize/DM error:", err);
    }
  };

  // 🔥 1. ADIM: Kameraya davet Firestore'a yazılır
  const handleCameraInvite = async () => {
    try {
      const roomId = window.location.pathname.split("/").pop();
      if (!roomId) return;

      await updateDoc(doc(db, "rooms", roomId), {
        invite: {
          toUid: user.uid,
          fromUid: currentUid ?? null,
          username: user.name,
          avatar: userPhoto,
          status: "pending", // pending | accepted | rejected
          createdAt: serverTimestamp(),
        },
      });

      alert("📨 Kameraya davet gönderildi!");
      onClose();
    } catch (err) {
      console.error("Camera invite error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-2xl w-80 p-5 border border-white/10 shadow-xl text-center">
        <img
          src={userPhoto}
          className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-white/20 object-cover"
        />

        <h3 className="text-xl font-semibold mb-1">{user.name}</h3>

        <div className="flex flex-col gap-3 mt-4">
          {/* Sadece oda sahibi ve kendisi olmayan kullanıcıya davet */}
          {isOwner && !isSelf && (
            <button
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
              onClick={handleCameraInvite}
            >
              Kameraya Davet
            </button>
          )}

          {/* DM butonu (kendine gönderemez) */}
          {!isSelf && (
            <button
              onClick={handleSendDM}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
            >
              Mesaj Gönder
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
