"use client";

export default function SearchVideo({
  visible,
  ytQuery,
  setYtQuery,
  ytResults,
  searchYoutube,
  selectVideo,
  searchLoading,
  onClose,
}) {
  if (!visible) return null;

  return (
    <div
      className="
        absolute 
        z-[9999] 
        top-16 
        right-2                /* 🔵 SAĞA TAM YASLANDI */
        bg-neutral-900 
        p-4 
        rounded-xl 
        w-80 
        border 
        border-white/10 
        shadow-xl
      "
      style={{
        maxWidth: "90%",       /* 🔵 Mobilde taşma olmasın */
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Video Ara</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          ✕
        </button>
      </div>

      {/* Search Input */}
      <input
        className="w-full p-2 rounded bg-white/10 border border-white/20"
        placeholder="Video ara..."
        value={ytQuery}
        onChange={(e) => setYtQuery(e.target.value)}
      />

      {/* Search Button */}
      <button
        onClick={searchYoutube}
        className="mt-3 px-4 py-1 bg-blue-600 rounded w-full"
        disabled={searchLoading}
      >
        {searchLoading ? "Aranıyor..." : "Ara"}
      </button>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto mt-3">
        {ytResults.length === 0 && (
          <p className="text-white/50 text-sm mt-2">
            Arama sonucu bulunamadı...
          </p>
        )}

        {ytResults.map((v: any) => (
          <div
            key={v.id?.videoId || v.etag} // 🔥 Key fix
            onClick={() => {
              if (v.id?.videoId) selectVideo(v.id.videoId);
            }}
            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded cursor-pointer"
          >
            <img
              src={v.snippet?.thumbnails?.default?.url}
              className="w-16 h-12 rounded object-cover"
            />
            <span className="text-sm">{v.snippet?.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
