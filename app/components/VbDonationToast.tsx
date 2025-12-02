"use client";

import { useEffect, useState } from "react";

type VbDonationToastProps = {
  visible: boolean;
  fromName: string;
  toName: string;     // 🔥 EKLENDİ
  fromAvatar?: string | null;
  amount: number;
  onHide?: () => void;
};

export default function VbDonationToast({
  visible,
  fromName,
  toName,
  fromAvatar,
  amount,
  onHide,
}: VbDonationToastProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const [anim, setAnim] = useState(false);
  const [safeAvatar, setSafeAvatar] = useState<string | undefined>();

  useEffect(() => {
    setSafeAvatar(fromAvatar || undefined);
  }, [fromAvatar]);

  useEffect(() => {
    if (!visible) {
      setAnim(false);
      setInternalVisible(false);
      return;
    }

    setInternalVisible(true);

    const enterDelay = setTimeout(() => setAnim(true), 30);

    const stayTimer = setTimeout(() => {
      setAnim(false);

      const exitTimer = setTimeout(() => {
        setInternalVisible(false);
        onHide && onHide();
      }, 450);
    }, 3000);

    return () => {
      clearTimeout(enterDelay);
      clearTimeout(stayTimer);
    };
  }, [visible]);

  if (!internalVisible) return null;

  return (
    <div
      className={`
        fixed 
        z-[99999]
        bottom-[160px]
        left-[80px]

        flex items-center gap-3
        px-4 py-3 
        rounded-xl

        backdrop-blur-xl
        bg-gradient-to-r from-blue-600/20 via-blue-500/15 to-transparent
        border border-blue-400/70
        shadow-xl

        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]

        ${anim ? "translate-x-0 opacity-100" : "-translate-x-[200px] opacity-0"}
      `}
      style={{
        boxShadow:
          "0 4px 30px rgba(0,120,255,0.5), inset 0 0 20px rgba(0,160,255,0.25)",
      }}
    >
      {safeAvatar ? (
        <img
          src={safeAvatar}
          className="w-11 h-11 rounded-full border border-white/30 object-cover shadow-md"
          alt={fromName}
          onError={(e) => (e.currentTarget.style.opacity = "0")}
        />
      ) : (
        <div className="w-11 h-11 rounded-full border border-blue-300/40 bg-blue-500/10" />
      )}

      <div className="flex flex-col leading-tight">
        <span className="text-xs text-blue-200/80">Vb Bağışı</span>

        {/* 🔥 YENİ YAZI TAM DOĞRU FORMAT */}
        <span className="font-semibold text-sm">
          <span className="font-bold text-white">{fromName}</span>
          {" "}→{" "}
          <span className="font-bold text-white">{toName}</span>
          {" "}kişisine gönderdi
        </span>

        <span className="text-yellow-400 text-xl font-extrabold drop-shadow">
          +{amount} Vb ✨
        </span>
      </div>
    </div>
  );
}
