"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useUserProfile } from "./hooks/useUserProfile";
import { useRoomData } from "./hooks/useRoomData";
import { useRoomPresence } from "./hooks/useRoomPresence";
import { useJoinMessage } from "./hooks/useJoinMessage";
import { useMessages } from "./hooks/useMessages";
import { useSendMessage } from "./hooks/useSendMessage";
import { useYoutubeSearch } from "./hooks/useYoutubeSearch";
import { useRoomSettings } from "./hooks/useRoomSettings";

import RoomHeader from "./components/RoomHeader";
import OnlineUsers from "./components/OnlineUsers";
import SearchVideo from "./components/SearchVideo";
import EditRoom from "./components/EditRoom";
import YoutubeSection from "./components/YoutubeSection";
import ChatSection from "./components/ChatSection";
import ChatInput from "./components/ChatInput";
import CameraSection from "./components/CameraSection";
import ProfilePopup from "./components/ProfilePopup";

// 🔥 Kamera Daveti popup (eski)
import CameraInvite from "./components/CameraInvite";

// 🔥 Yeni Ses Daveti popup
import AudioInvite from "./components/AudioInvite";

import { useRoomState } from "@/app/providers/RoomProvider";

export default function RoomPage() {
  const { roomId } = useParams();
  const { minimizedRoom, isMinimized } = useRoomState();

  const disablePresence = useMemo(() => {
    return isMinimized && minimizedRoom?.roomId === roomId;
  }, [isMinimized, minimizedRoom, roomId]);

  /** Profiller */
  const { user, profile, loadingProfile } = useUserProfile();

  /** Oda */
  const { room, loadingRoom } = useRoomData(roomId as string);

  /** Chat */
  const { messages } = useMessages(roomId as string);
  const { newMsg, setNewMsg, sendMessage } = useSendMessage(
    roomId as string,
    user,
    profile
  );

  /** YouTube Arama */
  const {
    ytQuery,
    setYtQuery,
    ytResults,
    searchLoading,
    searchYoutube,
    selectVideo,
  } = useYoutubeSearch(roomId as string, user, room);

  /** Oda Ayarları */
  const {
    newRoomName,
    setNewRoomName,
    newRoomImage,
    setNewRoomImage,
    saveRoomSettings,
    saving,
  } = useRoomSettings(roomId as string, room, user);

  /** Presence */
  useRoomPresence(roomId as string, user, profile, disablePresence);
  useJoinMessage(roomId as string, user, profile, disablePresence);

  /** UI State */
  const [showOnline, setShowOnline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [profilePopup, setProfilePopup] = useState<any>(null);

  /** Kamera & Ses daveti popup'ları ayrı ayrı */
  const [cameraInvitePopup, setCameraInvitePopup] = useState(null);
  const [audioInvitePopup, setAudioInvitePopup] = useState(null);

  /** Kamera & Ses davetlerini dinle */
  useEffect(() => {
    if (!room || !user) return;

    // 🎥 Kamera daveti
    if (
      room.invite &&
      room.invite.toUid === user.uid &&
      room.invite.status === "pending"
    ) {
      setCameraInvitePopup(room.invite);
    }

    // 🎤 Ses daveti
    if (
      room.audioInvite &&
      room.audioInvite.toUid === user.uid &&
      room.audioInvite.status === "pending"
    ) {
      setAudioInvitePopup(room.audioInvite);
    }
  }, [room?.invite, room?.audioInvite, user]);

  /** SSR Crash Fix */
  if (typeof window === "undefined") return null;

  if (loadingRoom || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        ODA YÜKLENİYOR...
      </div>
    );
  }

  if (!room || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        ODA VERİSİ GELMEDİ...
      </div>
    );
  }

  return (
    <div
      className="h-screen text-white flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/room-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      {/* ÜST BLOK */}
      <div className="flex-shrink-0 flex flex-col">

        <RoomHeader
          room={room}
          user={user}
          onOnlineClick={() => setShowOnline(true)}
          onSearchClick={() => setShowSearch(true)}
          onEditClick={() => setShowEdit(true)}
        />

        {/* YouTube + Kamera */}
        <YoutubeSection room={room} user={user} roomId={roomId as string} />
        <CameraSection room={room} user={user} roomId={roomId as string} />
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatSection
            messages={messages}
            onUserClick={(u) => setProfilePopup(u)}
          />
        </div>

        <ChatInput
          newMsg={newMsg}
          setNewMsg={setNewMsg}
          sendMessage={sendMessage}
        />
      </div>

      {/* MODALS */}
      <OnlineUsers
        visible={showOnline}
        room={room}
        onSelectUser={(u) => setProfilePopup(u)}
        onClose={() => setShowOnline(false)}
      />

      <EditRoom
        visible={showEdit}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        newRoomImage={newRoomImage}
        setNewRoomImage={setNewRoomImage}
        saveRoomSettings={saveRoomSettings}
        saving={saving}
        onClose={() => setShowEdit(false)}
      />

      <SearchVideo
        visible={showSearch}
        ytQuery={ytQuery}
        setYtQuery={setYtQuery}
        ytResults={ytResults}
        searchYoutube={searchYoutube}
        selectVideo={selectVideo}
        searchLoading={searchLoading}
        onClose={() => setShowSearch(false)}
      />

      {/* Profil popup */}
      {profilePopup && (
        <ProfilePopup
          user={profilePopup}
          isOwner={user.uid === room.ownerId}
          onClose={() => setProfilePopup(null)}
        />
      )}

      {/* 🎥 Kamera Daveti Popup */}
      {cameraInvitePopup && (
        <CameraInvite
          invite={cameraInvitePopup}
          roomId={roomId as string}
          user={user}
          onClose={() => setCameraInvitePopup(null)}
        />
      )}

      {/* 🎤 Ses Daveti Popup */}
      {audioInvitePopup && (
        <AudioInvite
          invite={audioInvitePopup}
          roomId={roomId as string}
          user={user}
          onClose={() => setAudioInvitePopup(null)}
        />
      )}

    </div>
  );
}
