"use client";

import { useEffect, useState } from "react";
import CameraSlot from "./CameraSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import {
  Room,
  RemoteParticipant,
  TrackPublication,
  createLocalAudioTrack,
  createLocalVideoTrack
} from "livekit-client";

export default function CameraSection({ room, user, roomId }: any) {
  const currentUid = user?.uid;

  const hostUid = room.ownerId;
  const guestUid = room.guestSeat || null;

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;

  /* ------------------------------------------------------------------
     ⭐ 1) USER PROFİLLERİNİ OTOMATİK ÇEK → hostName / guestName fallback
  ------------------------------------------------------------------ */
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [guestProfile, setGuestProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfiles() {
      // HOST PROFİLİ
      if (hostUid) {
        const snap = await getDoc(doc(db, "users", hostUid));
        if (snap.exists()) {
          setHostProfile(snap.data());
        }
      }

      // GUEST PROFİLİ
      if (guestUid) {
        const snap = await getDoc(doc(db, "users", guestUid));
        if (snap.exists()) {
          setGuestProfile(snap.data());
        }
      }
    }

    loadProfiles();
  }, [hostUid, guestUid]);

  // Eğer Firestore oda içinde yoksa bile fallback yap
  const hostName = room.hostName || hostProfile?.username || "Host";
  const guestName = room.guestName || guestProfile?.username || "Misafir";

  const hostAvatar = room.hostAvatar || hostProfile?.avatar || null;
  const guestAvatar = room.guestAvatar || guestProfile?.avatar || null;

  /* ------------------------------------------------------------------
     STATE
  ------------------------------------------------------------------ */
  const hostCamera = room.hostState?.camera ?? false;
  const hostMic = room.hostState?.mic ?? false;

  const guestCamera = room.guestState?.camera ?? false;
  const guestMic = room.guestState?.mic ?? false;

  const [lkRoom, setLkRoom] = useState<Room | null>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState<any>(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState<any>(null);

  /* ------------------------------------------------------------------
     2) CONNECT LIVEKIT
  ------------------------------------------------------------------ */
  useEffect(() => {
    async function connectLK() {
      if (lkRoom) return;
      if (!currentUid) return;

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${currentUid}`
      );
      if (!resp.ok) return;
      const { token } = await resp.json();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      setLkRoom(newRoom);
    }

    connectLK();
  }, [lkRoom, currentUid, roomId]);

  /* ------------------------------------------------------------------
     3) LOCAL TRACKS
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!lkRoom) return;

    async function handleTracks() {
      const wantCamera = isHost ? hostCamera : isGuestSelf ? guestCamera : false;
      const wantMic = isHost ? hostMic : isGuestSelf ? guestMic : false;

      // VIDEO
      if (wantCamera && !localVideoTrack) {
        const video = await createLocalVideoTrack();
        setLocalVideoTrack(video);
        try {
          await lkRoom.localParticipant.publishTrack(video);
        } catch {}
      }

      if (localVideoTrack?.mediaStreamTrack) {
        localVideoTrack.mediaStreamTrack.enabled = wantCamera;
      }

      // AUDIO
      if (wantMic && !localAudioTrack) {
        const audio = await createLocalAudioTrack();
        setLocalAudioTrack(audio);
        try {
          await lkRoom.localParticipant.publishTrack(audio);
        } catch {}
      }

      if (localAudioTrack?.mediaStreamTrack) {
        localAudioTrack.mediaStreamTrack.enabled = wantMic;
      }
    }

    handleTracks();
  }, [
    lkRoom,
    isHost,
    isGuestSelf,
    hostCamera,
    guestCamera,
    hostMic,
    guestMic,
    localVideoTrack,
    localAudioTrack
  ]);

  /* ------------------------------------------------------------------
     4) REMOTE TRACKS
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!lkRoom) return;

    const handleSubscribed = (track: any, pub: TrackPublication, participant: RemoteParticipant) => {
      if (track.kind === "video") {
        if (participant.identity === hostUid) setRemoteHostVideo(track);
        if (participant.identity === guestUid) setRemoteGuestVideo(track);
      }

      if (track.kind === "audio") {
        const el = track.attach();
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.style.display = "none";
        document.body.appendChild(el);
      }
    };

    const handleUnsubscribed = (pub: TrackPublication, participant: RemoteParticipant) => {
      if (pub.kind !== "video") return;
      if (participant.identity === hostUid) setRemoteHostVideo(null);
      if (participant.identity === guestUid) setRemoteGuestVideo(null);
    };

    lkRoom.on("trackSubscribed", handleSubscribed);
    lkRoom.on("trackUnsubscribed", handleUnsubscribed);

    lkRoom.remoteParticipants.forEach((p) => {
      p.getTrackPublications().forEach((pub) => {
        if (pub.isSubscribed && pub.track) {
          handleSubscribed(pub.track, pub, p as RemoteParticipant);
        }
      });
    });

    return () => {
      lkRoom.off("trackSubscribed", handleSubscribed);
      lkRoom.off("trackUnsubscribed", handleUnsubscribed);
    };
  }, [lkRoom, hostUid, guestUid]);

  /* ------------------------------------------------------------------
     5) LEAVE
  ------------------------------------------------------------------ */
  const leaveAsHost = async () => {
    try { await lkRoom?.disconnect(); } catch {}
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": false,
      "hostState.mic": false
    });
  };

  const leaveAsGuest = async () => {
    try { await lkRoom?.disconnect(); } catch {}
    await updateDoc(doc(db, "rooms", roomId), {
      guestSeat: null,
      "guestState.camera": false,
      "guestState.mic": false
    });
  };

  /* ------------------------------------------------------------------
     6) UI
  ------------------------------------------------------------------ */
  return (
    <div className="w-full flex justify-between items-center px-6 py-4 gap-6">

      {/* HOST SLOT */}
      <CameraSlot
        nickname={hostName}
        avatar={hostAvatar}
        seatNumber={1}
        isOccupied={true}
        isSelf={isHost}
        isHost={true}
        cameraOn={hostCamera}
        micOn={hostMic}
        remoteTrack={!isHost ? remoteHostVideo : null}
        localTrack={isHost ? localVideoTrack : null}
        onToggleCamera={async () =>
          updateDoc(doc(db, "rooms", roomId), { "hostState.camera": !hostCamera })
        }
        onToggleMic={async () =>
          updateDoc(doc(db, "rooms", roomId), { "hostState.mic": !hostMic })
        }
        onLeave={leaveAsHost}
      />

      {/* GUEST SLOT */}
      {guestUid ? (
        <CameraSlot
          nickname={guestName}
          avatar={guestAvatar}
          seatNumber={2}
          isOccupied={true}
          isSelf={isGuestSelf}
          isHost={false}
          cameraOn={guestCamera}
          micOn={guestMic}
          remoteTrack={!isGuestSelf ? remoteGuestVideo : null}
          localTrack={isGuestSelf ? localVideoTrack : null}
          onToggleCamera={async () =>
            updateDoc(doc(db, "rooms", roomId), { "guestState.camera": !guestCamera })
          }
          onToggleMic={async () =>
            updateDoc(doc(db, "rooms", roomId), { "guestState.mic": !guestMic })
          }
          onLeave={leaveAsGuest}
        />
      ) : (
        <CameraSlot
          nickname={"Boş"}
          seatNumber={2}
          avatar={null}
          isOccupied={false}
          isSelf={false}
          isHost={false}
          cameraOn={false}
          micOn={false}
        />
      )}
    </div>
  );
}
