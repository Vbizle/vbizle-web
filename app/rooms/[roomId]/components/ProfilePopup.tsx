"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/firebaseConfig";
import { useRoomState } from "@/app/providers/RoomProvider";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

// 🔥 EKLENDİ
import SendVbModal from "@/app/components/SendVbModal";
import { useVbWallet } from "@/app/hooks/useVbWallet";

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

  // 🔥 EKLENDİ
  const { wallet } = useVbWallet();
  const [showSend, setShowSend] = useState(false);

  const currentUid = auth.currentUser?.uid;
  if (!user) return null;

  const isSelf = currentUid === user.uid;
  const userPhoto = user.photo || user.avatar || "/user.png";

  const roomId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null;

  const [roomData, setRoomData] = useState<any>(null);
  const [vbId, setVbId] = useState("");

  /* -------------------------------------------------------
      ODAYI YÜKLE
  ------------------------------------------------------- */
  useEffect(() => {
    if (!roomId) return;

    getDoc(doc(db, "rooms", roomId)).then((s) => {
      if (s.exists()) setRoomData(s.data());
    });
  }, [roomId]);

  /* -------------------------------------------------------
      🔥 VB-ID'yi Firestore'dan al
  ------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    if (!user.uid) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setVbId(snap.data()?.vbId || "");
      }
    });
  }, [user]);

  if (!roomData) return null;

  // ---- SLOT BİLGİLERİ ----
  const cameraSeat = roomData.guestSeat || "";
  const audio1 = roomData.audioSeat1?.uid || "";
  const audio2 = roomData.audioSeat2?.uid || "";
  const cameraFull = !!cameraSeat;
  const audioFull = audio1 && audio2;
  const userInCamera = cameraSeat === user.uid;
  const userInAudio = audio1 === user.uid || audio2 === user.uid;
  const userOccupied = userInCamera || userInAudio;

  /* ----------------------------------------------
      DM ÖNCESİ ODAYI KÜÇÜLT
  ---------------------------------------------- */
  const handleSendDM = () => {
    minimizeRoom({
      roomId,
      roomImage: userPhoto,
    });

    router.push(`/messages/dm/${user.uid}`);
    onClose();
  };

  /* ----------------------------------------------
      KAMERA DAVETİ
  ---------------------------------------------- */
  const handleCameraInvite = async () => {
    if (cameraFull || userOccupied) {
      alert("❌ Kullanıcı davet edilemiyor!");
      return;
    }

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
  };

  /* ----------------------------------------------
      SES DAVETİ
  ---------------------------------------------- */
  const handleAudioInvite = async () => {
    if (audioFull || userOccupied) {
      alert("❌ Kullanıcı davet edilemiyor!");
      return;
    }

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
  };

  /* ----------------------------------------------
      RENDER
  ---------------------------------------------- */
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-2xl w-80 p-5 border border-white/10 shadow-xl text-center">
        
        <img
          src={userPhoto}
          className="w-24 h-24 rounded-full mx-auto mb-2 border-2 border-white/20 object-cover"
        />

        {/* 🔥 VB-ID */}
        {vbId && (
          <p className="text-sm text-white font-semibold mb-2">
            ID: {vbId}
          </p>
        )}

        <h3 className="text-xl font-semibold mb-2">{user.name}</h3>

        <div className="flex flex-col gap-3 mt-4">
          {isOwner && !isSelf && (
            <>
              <button
                disabled={cameraFull || userOccupied}
                onClick={handleCameraInvite}
                className={`w-full py-2 rounded-lg ${
                  cameraFull || userOccupied
                    ? "bg-gray-600"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                Kameraya Davet
              </button>

              <button
                disabled={audioFull || userOccupied}
                onClick={handleAudioInvite}
                className={`w-full py-2 rounded-lg ${
                  audioFull || userOccupied
                    ? "bg-gray-600"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                🔊 Sese Davet
              </button>
            </>
          )}

          {/* 🔥 EKLENDİ → VB PARA GÖNDER */}
          {!isSelf && (
            <button
              onClick={() => setShowSend(true)}
              className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 font-semibold"
            >
              💸 VB Gönder
            </button>
          )}

          {!isSelf && (
            <button
              onClick={handleSendDM}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Mesaj Gönder
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Kapat
        </button>
      </div>

      {/* 🔥 EKLENDİ → SEND VB MODAL */}
      {showSend && (
        <SendVbModal
          visible={showSend}
          onClose={() => setShowSend(false)}
          toUser={{
            uid: user.uid,
            name: user.name,
            avatar: userPhoto,
          }}
          roomId={roomId ?? undefined}
          currentBalance={wallet?.vbBalance ?? 0}
        />
      )}
    </div>
  );
}
