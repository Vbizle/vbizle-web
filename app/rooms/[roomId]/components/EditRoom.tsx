"use client";

export default function EditRoom({
  visible,
  newRoomName,
  setNewRoomName,
  setNewRoomImage,
  saveRoomSettings,
  saving,
  onClose,
}) {
  if (!visible) return null;

  return (
    <div className="absolute z-[9999] top-16 left-1/2 -translate-x-1/2 bg-neutral-900 p-5 rounded-xl border border-white/10 w-80 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-xl">Oda Ayarları</h3>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* Room Name */}
      <input
        type="text"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
        className="w-full p-2 rounded bg-white/10 border border-white/20 mb-3"
        placeholder="Oda adı..."
      />

      {/* Image Input */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setNewRoomImage(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          Kapat
        </button>

        <button
          onClick={saveRoomSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
