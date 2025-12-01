"use client";

import { useState } from "react";
import { useVbWallet } from "@/app/hooks/useVbWallet";

export default function ChatInput({ newMsg, setNewMsg, sendMessage }) {
  const [showWallet, setShowWallet] = useState(false);

  // ✅ DOĞRU ŞEKİLDE wallet state’ini alıyoruz
  const { wallet } = useVbWallet();
  const vbBalance = wallet?.vbBalance ?? 0;

  return (
    <div className="border-t border-white/10 p-3 flex gap-3 relative">

      {/* Mesaj input */}
      <input
        value={newMsg}
        onChange={(e) => setNewMsg(e.target.value)}
        placeholder="Mesaj yaz..."
        className="flex-1 p-2 rounded bg-white/10 border border-white/20 text-white outline-none"
      />

      {/* Gönder */}
      <button
        onClick={sendMessage}
        className="
          px-5 py-2 
          bg-blue-600 
          rounded-full 
          text-white 
          font-semibold
          shadow-lg shadow-blue-900/30
          hover:bg-blue-500 
          active:scale-95 
          transition
        "
      >
        Gönder
      </button>

      {/* VB PARA BUTONU */}
      <button
        onClick={() => setShowWallet(!showWallet)}
        className="
          w-10 h-10 rounded-full 
          bg-gradient-to-br from-yellow-400 to-orange-500
          flex items-center justify-center
          text-black font-bold shadow-md
          active:scale-95
        "
      >
        💰
      </button>

      {/* CÜZDAN POPUP */}
      {showWallet && (
        <div
          className="
            absolute bottom-16 right-2 z-[9999]
            bg-neutral-900 border border-white/10
            rounded-xl p-3 w-44 shadow-xl
          "
        >
          <div className="text-sm font-semibold text-yellow-400">
            💰 Vb Cüzdanı
          </div>

          <div className="text-white text-sm mt-1">
            Bakiye:{" "}
            <span className="text-green-400 font-bold">
              {vbBalance} Vb
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
