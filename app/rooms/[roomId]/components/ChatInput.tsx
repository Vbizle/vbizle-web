"use client";

export default function ChatInput({ newMsg, setNewMsg, sendMessage }) {
  return (
    <div className="border-t border-white/10 p-3 flex gap-3">
      <input
        value={newMsg}
        onChange={(e) => setNewMsg(e.target.value)}
        placeholder="Mesaj yaz..."
        className="flex-1 p-2 rounded bg-white/10 border border-white/20"
      />
      <button
        onClick={sendMessage}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        Gönder
      </button>
    </div>
  );
}
