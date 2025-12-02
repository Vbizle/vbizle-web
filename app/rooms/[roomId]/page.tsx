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

import CameraInvite from "./components/CameraInvite";
import AudioInvite from "./components/AudioInvite";

import { useRoomState } from "@/app/providers/RoomProvider";
import DonationBar from "./components/DonationBar";
import DonationSettingsModal from "./components/DonationSettingsModal";

import VbDonationToast from "@/app/components/VbDonationToast";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function RoomPage() {
  const { roomId } = useParams();
  const { minimizedRoom, isMinimized } = useRoomState();
console.log("🟦 [RoomPage] roomId:", roomId);
  const disablePresence = useMemo(() => {
    return isMinimized && minimizedRoom?.roomId === roomId;
  }, [isMinimized, minimizedRoom, roomId]);

  const { user, profile, loadingProfile } = useUserProfile();
  const { room, loadingRoom } = useRoomData(roomId as string);

  const { messages } = useMessages(roomId as string);
  const { newMsg, setNewMsg, sendMessage } = useSendMessage(
    roomId as string,
    user,
    profile
  );

  const {
    ytQuery,
    setYtQuery,
    ytResults,
    searchLoading,
    searchYoutube,
    selectVideo,
  } = useYoutubeSearch(roomId as string, user, room);

  const {
    newRoomName,
    setNewRoomName,
    newRoomImage,
    setNewRoomImage,
    saveRoomSettings,
    saving,
  } = useRoomSettings(roomId as string, room, user);

  useRoomPresence(roomId as string, user, profile, disablePresence);
  useJoinMessage(roomId as string, user, profile, disablePresence);

  const [showOnline, setShowOnline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [profilePopup, setProfilePopup] = useState<any>(null);

  const [cameraInvitePopup, setCameraInvitePopup] = useState(null);
  const [audioInvitePopup, setAudioInvitePopup] = useState(null);

  const [showDonationSettings, setShowDonationSettings] = useState(false);

  // TOAST CONTROL
  const [showToast, setShowToast] = useState(false);
  const [donationEvent, setDonationEvent] = useState<any>(null);

  /* ────────────────────────────────
     ⭐ KAMERA / SES DAVETİ
     (Hiç Değiştirilmedi → Sorunsuz Çalışır)
  ──────────────────────────────── */
  useEffect(() => {
    if (!room || !user) return;

    if (
      room.invite &&
      room.invite.toUid === user.uid &&
      room.invite.status === "pending"
    ) {
      setCameraInvitePopup(room.invite);
    }

    if (
      room.audioInvite &&
      room.audioInvite.toUid === user.uid &&
      room.audioInvite.status === "pending"
    ) {
      setAudioInvitePopup(room.audioInvite);
    }
  }, [room?.invite, room?.audioInvite, user]);

  /* ────────────────────────────────
     ⭐ BAĞIŞ LİSTENER — FİNAL
     → Tüm oda görür
     → Alıcı adı/avatarı gelir
  ──────────────────────────────── */
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "transactions"),
      where("roomId", "==", roomId),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;

        const data = change.doc.data();

        // Eksik veri gelirse Toast çizilmiyor → Bu fix edildi
        setDonationEvent({
          fromName: data.fromName || "Kullanıcı",
          fromAvatar: data.fromAvatar || "/user.png",
          toName: data.toName || "Kullanıcı",
          toAvatar: data.toAvatar || "/user.png",
          amount: data.amount,
        });

        setShowToast(false);
        setTimeout(() => setShowToast(true), 50);
      });
    });

    return () => unsub();
  }, [roomId]);

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
      {/* ⭐ TOAST: Gönderen + Alıcı + Miktar */}
      <VbDonationToast
        visible={showToast}
        fromName={donationEvent?.fromName}
        fromAvatar={donationEvent?.fromAvatar}
        toName={donationEvent?.toName}
        toAvatar={donationEvent?.toAvatar}
        amount={donationEvent?.amount}
        onHide={() => setShowToast(false)}
      />

      {/* ÜST BLOK */}
      <div className="flex-shrink-0 flex flex-col">
        <RoomHeader
          room={room}
          user={user}
          onOnlineClick={() => setShowOnline(true)}
          onSearchClick={() => setShowSearch(true)}
          onEditClick={() => setShowEdit(true)}
          onDonationClick={() => setShowDonationSettings(true)}
        />

        <DonationBar roomId={roomId as string} />

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

      {cameraInvitePopup && (
        <CameraInvite
          invite={cameraInvitePopup}
          roomId={roomId as string}
          user={user}
          onClose={() => setCameraInvitePopup(null)}
        />
      )}

      {audioInvitePopup && (
        <AudioInvite
          invite={audioInvitePopup}
          roomId={roomId as string}
          user={user}
          onClose={() => setAudioInvitePopup(null)}
        />
      )}

      <DonationSettingsModal
        roomId={roomId as string}
        room={room}
        visible={showDonationSettings}
        onClose={() => setShowDonationSettings(false)}
      />
    </div>
  );
}
