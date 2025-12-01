"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import SendVbModal from "@/app/components/SendVbModal"; // 🔥 burada modal import edildi
import { useVbWallet } from "@/app/hooks/useVbWallet";

type Props = {
  roomId: string;
};

type RoomDonationState = {
  ownerId?: string;
  donationBarEnabled?: boolean;
  donationTitle?: string;
  donationTarget?: number;
  donationCurrent?: number;
};

export default function DonationBar({ roomId }: Props) {
  const [state, setState] = useState<RoomDonationState | null>(null);
  const [loading, setLoading] = useState(true);

  const { wallet } = useVbWallet();
  const user = auth.currentUser;

  const [showSend, setShowSend] = useState(false);

  const isOwner = user && state?.ownerId === user.uid;

  useEffect(() => {
    const ref = doc(db, "rooms", roomId);

    const unsub = onSnapshot(ref, (snap) => {
      setState(snap.exists() ? (snap.data() as RoomDonationState) : null);
      setLoading(false);
    });

    return () => unsub();
  }, [roomId]);

  if (loading || !state) return null;
  if (!state.donationBarEnabled && !isOwner) return null;

  const title = state.donationTitle || "1. Koltuk için bağış hedefi";
  const target = state.donationTarget ?? 1000;
  const current = state.donationCurrent ?? 0;
  const progress = Math.min(100, (current / target) * 100 || 0);

  async function handleToggleBar() {
    if (!isOwner) return;
    await updateDoc(doc(db, "rooms", roomId), {
      donationBarEnabled: !state.donationBarEnabled,
    });
  }

  return (
    <div className="px-3 pt-2 pb-2 bg-black/30 backdrop-blur-sm rounded-b-lg">

      {/* Üst bilgi */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[14px] text-purple-300 font-semibold truncate">
          🎁 {title}
        </span>

        {isOwner && (
          <button
            onClick={handleToggleBar}
            className="text-[12px] px-2 py-[3px]
              rounded-full bg-purple-700 text-white
              shadow active:scale-95 transition">
            {state.donationBarEnabled ? "Kapat" : "Aç"}
          </button>
        )}
      </div>

      {state.donationBarEnabled && (
        <>
          {/* METAL BAR */}
          <div className="relative w-full h-[10px] rounded-full overflow-hidden bg-black/40 shadow-inner mb-1">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(
                    90deg,
                    #ff8a00 0%,
                    #ffc252 20%,
                    #008cff 40%,
                    #003c99 60%,
                    #7d003f 80%,
                    #ff005e 100%
                )`,
                filter: "saturate(1.8) brightness(1.25)",
              }}
            />
            <div className="absolute inset-0 bg-white/10 mix-blend-screen animate-pulse" />
          </div>

          {/* Alt satır */}
          <div className="flex items-center justify-between text-[13px] text-zinc-300">
            <span>{current} / {target} Vb</span>

            <button
              onClick={() => setShowSend(true)}
              className="px-3 py-[3px] bg-purple-600 rounded-full text-white text-[12px] active:scale-95">
              Bağış Yap
            </button>
          </div>
        </>
      )}

      {/* VB Modal */}
      {showSend && (
        <SendVbModal
          visible={showSend}
          onClose={() => setShowSend(false)}
          toUser={{
            uid: state.ownerId!,
            name: "Host",
          }}
          roomId={roomId}
          currentBalance={wallet?.vbBalance ?? 0}
        />
      )}
    </div>
  );
}
