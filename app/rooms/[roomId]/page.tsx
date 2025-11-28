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

import CameraInvite from "./components/CameraInvite"; // 🔥 yeni

import { useRoomState } from "@/app/providers/RoomProvider";

export default function RoomPage() {
  const { roomId } = useParams();
  const { minimizedRoom, isMinimized } = useRoomState();

  /** Minimize durumunda presence devre dışı */
  const disablePresence = useMemo(() => {
    return isMinimized && minimizedRoom?.roomId === roomId;
  }, [isMinimized, minimizedRoom, roomId]);

  /** Minimize’den çıkınca hook’lar tekrar çalışır */
  useEffect(() => {
    if (!isMinimized) {
      console.log("🔥 Minimize modundan çıkıldı → presence aktif!");
    }
  }, [isMinimized]);

  /** Kullanıcı Profili */
  const { user, profile, loadingProfile } = useUserProfile();

  /** Oda Bilgisi */
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

  /** Presence + Join (minimize durumunda devre dışı) */
  useRoomPresence(roomId as string, user, profile, disablePresence);
  useJoinMessage(roomId as string, user, profile, disablePresence);

  /** UI Modals */
  const [showOnline, setShowOnline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [profilePopup, setProfilePopup] = useState<any>(null);

  /** 📌 Kamera daveti popup state’i */
  const [invitePopup, setInvitePopup] = useState<any>(null);

  /** 📌 Kamera daveti listener’ı */
  useEffect(() => {
    if (!room || !user) return;

    const inv = room.invite;

    if (!inv) return;

    // Davet bu kullanıcıya ve hâlâ beklemede mi?
    if (inv.toUid === user.uid && inv.status === "pending") {
      setInvitePopup(inv);
    }
  }, [room?.invite, user]);

  /** Loading */
  if (loadingRoom || loadingProfile || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        ODA YÜKLENİYOR...
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">

      {/* ÜST BLOK: HEADER + YOUTUBE + KAMERA */}
      <div className="flex-shrink-0 flex flex-col">
        <RoomHeader
          room={room}
          user={user}
          onOnlineClick={() => setShowOnline(true)}
          onSearchClick={() => setShowSearch(true)}
          onEditClick={() => setShowEdit(true)}
        />

        <YoutubeSection room={room} user={user} roomId={roomId as string} />

        {/* 🔥 roomId CameraSection’a geçirildi */}
        <CameraSection room={room} user={user} roomId={roomId as string} />
      </div>

      {/* ALT BLOK: CHAT */}
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

      {profilePopup && (
        <ProfilePopup
          user={profilePopup}
          isOwner={user.uid === room.ownerId}
          onClose={() => setProfilePopup(null)}
        />
      )}

      {/* 📌 Kamera Daveti Popup (misafir tarafı) */}
      {invitePopup && (
        <CameraInvite
          invite={invitePopup}
          roomId={roomId as string}
          user={user}
          onClose={() => setInvitePopup(null)}
        />
      )}
    </div>
  );
}
