"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";

export default function CameraInvite({ invite, roomId, user, onClose }: any) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Ön izleme için kamera aç
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((camStream) => {
        setStream(camStream);
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
          videoRef.current.play();
        }
      })
      .catch((err) => console.error("Camera preview error:", err));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Daveti kabul et
  const acceptInvite = async () => {
    try {
      await updateDoc(doc(db, "rooms", roomId), {
        guestSeat: user.uid,
        "guestState.camera": true,
        "guestState.mic": false,
        invite: {
          ...invite,
          status: "accepted",
        },
      });

      onClose();
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  // Daveti reddet
  const rejectInvite = async () => {
    try {
      await updateDoc(doc(db, "rooms", roomId), {
        invite: {
          ...invite,
          status: "rejected",
        },
      });

      onClose();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center">
      <div className="bg-neutral-900 p-6 rounded-2xl w-[330px] text-center border border-white/10">

        <h3 className="text-xl font-semibold mb-3 text-white">
          Kameraya Katıl
        </h3>

        {/* Kamera Ön İzleme */}
        <video
          ref={videoRef}
          className="w-full h-48 rounded-lg bg-black object-cover mb-4"
          muted
          playsInline
        />

        <button
          onClick={acceptInvite}
          className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 mb-3 transition"
        >
          Katıl
        </button>

        <button
          onClick={rejectInvite}
          className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
        >
          Reddet
        </button>
      </div>
    </div>
  );
}
