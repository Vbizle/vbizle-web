import React, { useState } from "react";

type Props = {
  onLogout: () => void;
};

export default function ProfileTopBar({ onLogout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full max-w-md flex justify-between items-center mb-4 relative">
      <h1 className="text-lg font-semibold">Profil</h1>

      <button
        className="text-2xl"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        ☰
      </button>

      {menuOpen && (
        <div className="absolute top-10 right-0 bg-black/80 border border-white/20 rounded-xl p-3 w-40 z-40 text-sm">
          <button
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            className="block w-full text-left py-1 text-red-400 hover:text-red-500"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
