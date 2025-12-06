import React, { useRef } from "react";

type Props = {
  open: boolean;
  gallery: string[];
  onClose: () => void;
  onSelectFile: (index: number, file: File) => void;
};

export default function CoverEditModal({
  open,
  gallery,
  onClose,
  onSelectFile,
}: Props) {
  const fileInputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center px-4">
      <div className="bg-white/10 border border-white/20 p-6 rounded-xl w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Kapak Fotoğrafları</h2>

        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full aspect-square border border-dashed border-white/40 bg-black/40 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => fileInputs[i].current?.click()}
            >
              {gallery[i] ? (
                <img
                  src={gallery[i]}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-white/40">+</span>
              )}

              <input
                ref={fileInputs[i]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onSelectFile(i, file);
                }}
              />
            </div>
          ))}
        </div>

        <button
          className="mt-6 w-full bg-gray-600 py-2 rounded"
          onClick={onClose}
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
