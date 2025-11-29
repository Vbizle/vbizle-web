// app/rooms/[roomId]/components/AudioInvite.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

function normalizeSeat(seat: any) {
  if (!seat) return { uid: "", mic: false };
  return {
    uid: seat.uid || "",
    mic: !!seat.mic,
  };
}

export default function AudioInvite({ invite, roomId, user, onClose }: any) {
  const [status, setStatus] = useState(invite?.status);
  const currentUid = user?.uid;

  // Firestore canlı dinleme
  useEffect(() => {
    if (!roomId) return;

    const ref = doc(db, "rooms", roomId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (!data?.audioInvite) return;
      setStatus(data.audioInvite.status);
    });

    return () => unsub();
  }, [roomId]);

  // 🔵 DAVETİ KABUL ET — otomatik boş sesi koltuğuna oturt
  const acceptInvite = async () => {
    try {
      if (!roomId || !currentUid) return;

      const roomRef = doc(db, "rooms", roomId);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;

      const data: any = snap.data() || {};

      const seat1 = normalizeSeat(data.audioSeat1);
      const seat2 = normalizeSeat(data.audioSeat2);

      let seatUpdate: any = {};

      if (!seat1.uid) {
        seatUpdate = {
          audioSeat1: { uid: currentUid, mic: true },
        };
      } else if (!seat2.uid) {
        seatUpdate = {
          audioSeat2: { uid: currentUid, mic: true },
        };
      } else {
        // İkisi de doluysa son seat override (tercih: 2)
        seatUpdate = {
          audioSeat2: { uid: currentUid, mic: true },
        };
      }

      await updateDoc(roomRef, {
        audioInvite: {
          ...(invite || {}),
          toUid: invite?.toUid ?? currentUid,
          status: "accepted",
          acceptedAt: serverTimestamp(),
        },
        ...seatUpdate,
      });

      onClose && onClose();
    } catch (err) {
      console.error("Audio accept error:", err);
    }
  };

  // 🔴 REDDET
  const rejectInvite = async () => {
    try {
      if (!roomId) return;

      await updateDoc(doc(db, "rooms", roomId), {
        audioInvite: {
          ...(invite || {}),
          status: "rejected",
          rejectedAt: serverTimestamp(),
        },
      });

      onClose && onClose();
    } catch (err) {
      console.error("Audio reject error:", err);
    }
  };

  if (!invite || invite.toUid !== currentUid || status !== "pending")
    return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-neutral-900 w-80 p-5 rounded-2xl text-center border border-white/10 shadow-xl">
        <img
          src={invite.avatar}
          className="w-20 h-20 rounded-full mx-auto mb-4 border border-white/20 object-cover"
        />

        <h3 className="text-lg font-semibold">{invite.username}</h3>
        <p className="text-white/70 mt-2 text-sm">
          Seni{" "}
          <span className="text-pink-400 font-semibold">
            Ses Koltuğuna
          </span>{" "}
          davet ediyor.
        </p>

        <div className="flex flex-col gap-3 mt-5">
          <button
            onClick={acceptInvite}
            className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
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

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
