"use client";

import { useEffect, useState } from "react";

type VbDonationToastProps = {
  visible: boolean;
  fromName: string;
  fromAvatar?: string | null;
  amount: number;
  onHide?: () => void; // 2 sn sonra haber vermek için opsiyonel callback
};

export default function VbDonationToast({
  visible,
  fromName,
  fromAvatar,
  amount,
  onHide,
}: VbDonationToastProps) {
  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setInternalVisible(false);
      return;
    }

    setInternalVisible(true);

    const t = setTimeout(() => {
      setInternalVisible(false);
      if (onHide) onHide();
    }, 2000); // 2 saniye

    return () => clearTimeout(t);
  }, [visible, onHide]);

  if (!internalVisible) return null;

  return (
    <div
      className="
        fixed bottom-20 left-1/2 -translate-x-1/2
        bg-black/75 backdrop-blur-md
        px-4 py-3 rounded-2xl
        flex items-center gap-3
        text-white z-[999999]
        transition-all duration-300
      "
    >
      {/* Avatar */}
      <img
        src={fromAvatar || "/user.png"}
        className="w-10 h-10 rounded-full border border-white/20 object-cover"
        alt={fromName}
      />

      {/* Metin */}
      <div className="flex flex-col">
        <span className="font-semibold text-sm">
          Vay be!{" "}
          <span className="font-bold text-white">{fromName}</span> sana gönderdi
        </span>
        <span className="text-yellow-400 text-lg font-extrabold">
          {amount} Vb ✨
        </span>
      </div>
    </div>
  );
}
