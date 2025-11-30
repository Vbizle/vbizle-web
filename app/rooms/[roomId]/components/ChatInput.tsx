"use client";

export default function ChatInput({ newMsg, setNewMsg, sendMessage }) {
  return (
    <div className="border-t border-white/10 px-2 py-2 flex gap-2">
      
      <input
        value={newMsg}
        onChange={(e) => setNewMsg(e.target.value)}
        placeholder="Mesaj yaz..."
        className="
          flex-1
          px-2 py-1.5               /* Daha küçük yükseklik */
          rounded
          bg-white/10 
          border border-white/20
          text-sm                   /* Yazı biraz küçültüldü */
        "
      />

      <button
        onClick={sendMessage}
        className="
          px-3 py-1.5               /* Daha küçük buton */
          bg-blue-600 
          rounded
          text-sm                   /* Yazı küçüldü */
          whitespace-nowrap
        "
      >
        Gönder
      </button>

    </div>
  );
}
