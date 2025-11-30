"use client";

import { useState, useEffect } from "react";   // 🔥 EKLENDİ
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/firebaseConfig";
import { useRoomState } from "@/app/providers/RoomProvider";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

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

  /* ---------------------------------------------------------------
     🔥 ODA BİLGİLERİNİ ANLIK OKU (slot kontrol için)
  --------------------------------------------------------------- */
  const roomId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null;

  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    if (!roomId) return;

    getDoc(doc(db, "rooms", roomId)).then((s) => {
      if (s.exists()) setRoomData(s.data());
    });
  }, [roomId]);

  // henüz oda yüklenmediyse
  if (!roomData) return null;

  /* ---------------------------------------------------------------
     🔥 SLOT DURUMLARI
  --------------------------------------------------------------- */

  const cameraSeat = roomData.guestSeat || "";
  const audio1 = roomData.audioSeat1?.uid || "";
  const audio2 = roomData.audioSeat2?.uid || "";

  const cameraFull = !!cameraSeat;
  const audioFull = audio1 && audio2;

  // Kullanıcı zaten bir slotta mı?
  const userInCamera = cameraSeat === user.uid;
  const userInAudio = audio1 === user.uid || audio2 === user.uid;

  // Kullanıcı zaten bir slotta → tekrar davet gönderilemez
  const userOccupied = userInCamera || userInAudio;

  /* --------------------------------------------
     DM ÖNCESİ ODAYI KÜÇÜLT
  -------------------------------------------- */
  const handleSendDM = () => {
    try {
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

  /* --------------------------------------------
     KAMERA DAVETİ
  -------------------------------------------- */
  const handleCameraInvite = async () => {
    if (cameraFull) {
      alert("❌ Kamera koltuğu dolu!");
      return;
    }

    if (userOccupied) {
      alert("❌ Bu kullanıcı zaten bir slota sahip!");
      return;
    }

    try {
      await updateDoc(doc(db, "rooms", roomId), {
        invite: {
          toUid: user.uid,
          fromUid: currentUid ?? null,
          username: user.name,
          avatar: userPhoto,
          status: "pending",
          createdAt: serverTimestamp(),
          type: "camera",
        },
      });

      alert("📨 Kameraya davet gönderildi!");
      onClose();
    } catch (err) {
      console.error("Camera invite error:", err);
    }
  };

  /* --------------------------------------------
     SES DAVETİ
  -------------------------------------------- */
  const handleAudioInvite = async () => {
    if (audioFull) {
      alert("❌ Tüm ses koltukları dolu!");
      return;
    }

    if (userOccupied) {
      alert("❌ Bu kullanıcı zaten bir slota sahip!");
      return;
    }

    try {
      await updateDoc(doc(db, "rooms", roomId), {
        audioInvite: {
          toUid: user.uid,
          fromUid: currentUid ?? null,
          username: user.name,
          avatar: userPhoto,
          status: "pending",
          createdAt: serverTimestamp(),
        },
      });

      alert("🔊 Sese davet gönderildi!");
      onClose();
    } catch (err) {
      console.error("Audio invite error:", err);
    }
  };

  /* --------------------------------------------
     RENDER
  -------------------------------------------- */
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-2xl w-80 p-5 border border-white/10 shadow-xl text-center">
        <img
          src={userPhoto}
          className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-white/20 object-cover"
        />

        <h3 className="text-xl font-semibold mb-1">{user.name}</h3>

        <div className="flex flex-col gap-3 mt-4">
          {/* OWNER → Başkasına davet butonları */}
          {isOwner && !isSelf && (
            <>
              {/* Kamera Daveti */}
              <button
                disabled={cameraFull || userOccupied}
                className={`w-full py-2 rounded-lg transition ${
                  cameraFull || userOccupied
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
                onClick={handleCameraInvite}
              >
                Kameraya Davet
              </button>

              {/* Ses Daveti */}
              <button
                disabled={audioFull || userOccupied}
                className={`w-full py-2 rounded-lg transition ${
                  audioFull || userOccupied
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
                onClick={handleAudioInvite}
              >
                🔊 Sese Davet
              </button>
            </>
          )}

          {/* DM */}
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
