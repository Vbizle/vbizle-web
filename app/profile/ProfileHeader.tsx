import React from "react";

type Props = {
  avatar: string;
  username: string;
  vbId: string;
  gallery: string[];
  usernameEdit: boolean;
  savingUsername: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUsernameClick: () => void;
  onUsernameChange: (val: string) => void;
  onUsernameSave: () => void;
  onCoverClick: () => void;
  onOpenCoverEdit: () => void;
};

export default function ProfileHeader({
  avatar,
  username,
  vbId,
  gallery,
  usernameEdit,
  savingUsername,
  onAvatarChange,
  onUsernameClick,
  onUsernameChange,
  onUsernameSave,
  onCoverClick,
  onOpenCoverEdit,
}: Props) {
  const hasGallery = gallery.filter(Boolean).length > 0;

  return (
    <div className="w-full flex flex-col items-center px-2">

      {/* ============================= */}
      {/* KAPAK FOTOĞRAF + KAMERA ICON */}
      {/* ============================= */}
      <div
        className="
          relative w-full 
          h-40 sm:h-48         /* Telefonlarda daha düşük yükseklik */
          rounded-xl overflow-hidden 
          bg-white/5 border border-white/15 
          cursor-pointer
        "
        onClick={onCoverClick}
      >
        {hasGallery ? (
          <img
            src={gallery[0]}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
            Henüz kapak fotoğrafı yok
          </div>
        )}

        {/* Sağ üst kamera ikonu */}
        <button
          type="button"
          className="
            absolute top-2 right-2 
            w-9 h-9 sm:w-8 sm:h-8 
            bg-black/60 rounded-full 
            flex items-center justify-center 
            text-lg sm:text-sm
            active:scale-95
          "
          onClick={(e) => {
            e.stopPropagation();
            onOpenCoverEdit();
          }}
        >
          📷
        </button>
      </div>

      {/* ============================= */}
      {/* AVATAR (Responsive konum)     */}
      {/* ============================= */}
      <label
        htmlFor="avatarUpload"
        className="
          relative 
          -mt-12 sm:-mt-10   /* Telefonlarda daha yukarı oturur */
          cursor-pointer
        "
      >
        <img
          src={avatar || "/default-avatar.png"}
          className="
            w-24 h-24 sm:w-24 sm:h-24 
            rounded-full 
            border-4 border-black 
            object-cover shadow-xl
          "
        />
      </label>

      <input
        id="avatarUpload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarChange}
      />

      {/* ============================= */}
      {/* ID + USERNAME                */}
      {/* ============================= */}
      <div className="mt-4 text-center">
        <p className="text-xs text-white/50">ID: {vbId}</p>

        {!usernameEdit ? (
          <p
            className="
              mt-1 text-lg font-semibold 
              cursor-pointer hover:text-blue-400
            "
            onClick={onUsernameClick}
          >
            {username}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2 mt-3">
            <input
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="
                p-2 
                w-56 sm:w-48         /* Telefonlarda daha geniş input */
                bg-black/40 
                border border-white/20 
                rounded
              "
            />

            <button
              onClick={onUsernameSave}
              className="
                px-6 py-2 
                bg-green-600 rounded 
                disabled:opacity-50
              "
              disabled={savingUsername}
            >
              {savingUsername ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
