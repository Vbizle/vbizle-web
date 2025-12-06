import React from "react";

type Props = {
  open: boolean;
  gallery: string[];
  onClose: () => void;
};

export default function FullscreenGallery({ open, gallery, onClose }: Props) {
  const visible = gallery.filter(Boolean);
  if (!open || visible.length === 0) return null;

  return (
    <div
      className="
        fixed inset-0 
        bg-black/90 backdrop-blur-lg 
        z-[999] 
        flex items-center justify-center
        touch-pan-y touch-pan-x        /* Mobil kaydırmayı iyileştirir */
      "
      onClick={onClose}
    >
      {/* İç alan tıklanınca kapanmasın */}
      <div
        className="
          flex overflow-x-auto 
          w-full h-full 
          snap-x snap-mandatory 
          scroll-smooth 
          touch-pan-y touch-pan-x
        "
        onClick={(e) => e.stopPropagation()}
      >
        {visible.map((url, i) => (
          <div
            key={i}
            className="
              w-full h-full 
              flex items-center justify-center 
              flex-shrink-0 
              snap-center
              p-4 sm:p-10  
            "
          >
            <img
              src={url}
              className="
                max-w-full max-h-full 
                object-contain
                rounded-lg
              "
            />
          </div>
        ))}
      </div>

      {/* KAPATMA BUTONU */}
      <button
        className="
          absolute 
          top-4 right-4 sm:top-6 sm:right-6 
          w-10 h-10 sm:w-12 sm:h-12 
          bg-black/50 rounded-full 
          flex items-center justify-center 
          text-2xl sm:text-3xl text-white 
          active:scale-90 
        "
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}
