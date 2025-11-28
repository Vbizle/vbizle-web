"use client";

export default function OnlineUsers({ visible, room, onSelectUser, onClose }) {
  if (!visible) return null;

  const users = room?.onlineUsers || [];

  return (
    <div className="absolute z-[9999] top-16 right-6 bg-neutral-900 p-4 rounded-xl shadow-xl w-64 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Online Kullanıcılar</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          ✕
        </button>
      </div>

      {users.length === 0 && (
        <p className="text-white/50 text-sm">Kimse yok...</p>
      )}

      {users.map((u: any) => {
        const avatar = u.photo || u.avatar || "/user.png";

        return (
          <div
            key={u.uid}
            onClick={() => onSelectUser(u)}
            className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white/10 p-2 rounded"
          >
            <img src={avatar} className="w-10 h-10 rounded-full" />
            <span>{u.name}</span>
          </div>
        );
      })}
    </div>
  );
}
