"use client";

import { useState } from "react";

export default function OnlineUsers({ visible, room, onSelectUser, onClose }) {
  if (!visible) return null;

  const users = room?.onlineUsers || [];

  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div className="absolute z-[9999] top-16 right-6 bg-neutral-900 p-4 rounded-xl shadow-xl w-64 border border-white/10">

      {/* ÜST BAR */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Online Kullanıcılar</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          ✕
        </button>
      </div>

      {/* KULLANICI LİSTESİ */}
      {users.length === 0 && (
        <p className="text-white/50 text-sm">Kimse yok...</p>
      )}

      {users.map((u: any) => {
        const avatar = u.photo || u.avatar || "/user.png";

        return (
          <div
            key={u.uid}
            onClick={() => setSelectedUser(u)}
            className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white/10 p-2 rounded"
          >
            <img src={avatar} className="w-10 h-10 rounded-full" />
            <span>{u.name}</span>
          </div>
        );
      })}

      {/* 🔥 Kullanıcı Popup (kamera + ses davetleri buraya gelecek) */}
      {selectedUser && (
        <div className="absolute left-0 right-0 -bottom-40 bg-neutral-800 border border-white/10 rounded-xl p-4 z-[99999]">

          <h4 className="font-semibold mb-3 text-white">
            {selectedUser.name}
          </h4>

          <div className="flex flex-col gap-2">

            {/* GÖRÜNTÜLÜ DAVET */}
            <button
              className="w-full py-2 rounded bg-blue-600"
              onClick={() => {
                onSelectUser(selectedUser);
                setSelectedUser(null);
              }}
            >
              Kameraya Davet Et
            </button>

            {/* 🔥 SES DAVETİ (YENİ) */}
            <button
              className="w-full py-2 rounded bg-purple-600"
              onClick={() => {
                // Ana bileşene bu event'i yollarız
                onSelectUser({
                  ...selectedUser,
                  inviteType: "audio"
                });
                setSelectedUser(null);
              }}
            >
              ➤ Sese Davet Et
            </button>

            <button
              className="w-full py-2 rounded bg-white/10"
              onClick={() => setSelectedUser(null)}
            >
              İptal
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
