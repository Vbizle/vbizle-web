// app/rooms/[roomId]/components/CameraSection.tsx
// 🔥🔥 TAM DÜZELTİLMİŞ — BOZULMADAN

"use client";

import { useEffect, useState } from "react";
import CameraSlot from "./CameraSlot";
import AudioSlot from "./AudioSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import {
  Room,
  RemoteParticipant,
  TrackPublication,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from "livekit-client";

function normalizeSeat(seat: any) {
  if (!seat) return { uid: "", mic: false };
  return {
    uid: seat.uid || "",
    mic: seat.mic || false,
  };
}

export default function CameraSection({ room, user, roomId }: any) {
  const currentUid = user?.uid?.toString();

  const hostUid = room.ownerId?.toString();
  const guestUid = room.guestSeat?.toString() || "";

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;

  const [hostProfile, setHostProfile] = useState<any>(null);
  const [guestProfile, setGuestProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfiles() {
      if (hostUid) {
        const s = await getDoc(doc(db, "users", hostUid));
        if (s.exists()) setHostProfile(s.data());
      }
      if (guestUid) {
        const s = await getDoc(doc(db, "users", guestUid));
        if (s.exists()) setGuestProfile(s.data());
      }
    }
    loadProfiles();
  }, [hostUid, guestUid]);

  const hostName = hostProfile?.username || "Host";
  const guestName = guestProfile?.username || "Misafir";

  const hostAvatar = hostProfile?.avatar || null;
  const guestAvatar = guestProfile?.avatar || null;

  /* --------------------------------------------------------
     AUDIO SEATS
  -------------------------------------------------------- */
  const audioSeat1 = normalizeSeat(room.audioSeat1);
  const audioSeat2 = normalizeSeat(room.audioSeat2);

  const audio1Uid = audioSeat1.uid;
  const audio2Uid = audioSeat2.uid;

  const isAudio1Self = audio1Uid === currentUid;
  const isAudio2Self = audio2Uid === currentUid;

  const audio1Mic = audioSeat1.mic;
  const audio2Mic = audioSeat2.mic;

  const [audio1Profile, setAudio1Profile] = useState<any>(null);
  const [audio2Profile, setAudio2Profile] = useState<any>(null);

  useEffect(() => {
    async function loadAudio() {
      if (audio1Uid) {
        const s = await getDoc(doc(db, "users", audio1Uid));
        if (s.exists()) setAudio1Profile(s.data());
      } else setAudio1Profile(null);

      if (audio2Uid) {
        const s = await getDoc(doc(db, "users", audio2Uid));
        if (s.exists()) setAudio2Profile(s.data());
      } else setAudio2Profile(null);
    }
    loadAudio();
  }, [audio1Uid, audio2Uid]);

  const audio1Name = audio1Profile?.username || "Ses 1";
  const audio2Name = audio2Profile?.username || "Ses 2";

  const audio1Avatar = audio1Profile?.avatar || null;
  const audio2Avatar = audio2Profile?.avatar || null;

  /* --------------------------------------------------------
     AUDIO SLOT MAPPING
  -------------------------------------------------------- */
  const [audio1Track, setAudio1Track] = useState<any>(null);
  const [audio2Track, setAudio2Track] = useState<any>(null);

  const audio1Occupant = audio1Uid
    ? {
        uid: audio1Uid,
        name: audio1Name,
        avatar: audio1Avatar,
        mic: audio1Mic,
        audioTrack: audio1Track,
      }
    : null;

  const audio2Occupant = audio2Uid
    ? {
        uid: audio2Uid,
        name: audio2Name,
        avatar: audio2Avatar,
        mic: audio2Mic,
        audioTrack: audio2Track,
      }
    : null;

  /* --------------------------------------------------------
     STATE
  -------------------------------------------------------- */
  const hostCamera = room.hostState?.camera ?? false;
  const hostMic = room.hostState?.mic ?? false;

  const guestCamera = room.guestState?.camera ?? false;
  const guestMic = room.guestState?.mic ?? false;

  const [lkRoom, setLkRoom] = useState<Room | null>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState<any>(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState<any>(null);

  /* --------------------------------------------------------
     CONNECT LIVEKIT
  -------------------------------------------------------- */
  useEffect(() => {
    async function connectLK() {
      if (lkRoom) return;
      if (!currentUid) return;

      const r = await fetch(
        `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${currentUid}`
      );
      if (!r.ok) return;

      const { token } = await r.json();

      const newR = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      await newR.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      newR.on("participantConnected", (p) => {
        p.identity = p.identity ? p.identity.toString() : "";
      });

      setLkRoom(newR);
    }

    connectLK();
  }, [lkRoom, currentUid, roomId]);

  /* --------------------------------------------------------
     LOCAL TRACKS
  -------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    async function handleTracks() {
      const wantCamera =
        isHost ? hostCamera : isGuestSelf ? guestCamera : false;

      let wantMic = false;
      if (isHost) wantMic = hostMic;
      else if (isGuestSelf) wantMic = guestMic;
      else if (isAudio1Self) wantMic = audio1Mic;
      else if (isAudio2Self) wantMic = audio2Mic;

      if (wantCamera && !localVideoTrack) {
        const t = await createLocalVideoTrack();
        setLocalVideoTrack(t);
        try {
          await lkRoom.localParticipant.publishTrack(t);
        } catch {}
      }

      if (localVideoTrack?.mediaStreamTrack) {
        localVideoTrack.mediaStreamTrack.enabled = wantCamera;
      }

      if (wantMic && !localAudioTrack) {
        const t = await createLocalAudioTrack();
        setLocalAudioTrack(t);
        try {
          await lkRoom.localParticipant.publishTrack(t);
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
    isAudio1Self,
    isAudio2Self,
    hostCamera,
    guestCamera,
    hostMic,
    guestMic,
    audio1Mic,
    audio2Mic,
    localVideoTrack,
    localAudioTrack,
  ]);

  /* --------------------------------------------------------
     REMOTE TRACKS — AUDIO & VIDEO
  -------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    const handleSubscribed = (
      track: any,
      pub: TrackPublication,
      participant: RemoteParticipant
    ) => {
      participant.identity = participant.identity
        ? participant.identity.toString()
        : "";

      if (track.kind === "video") {
        if (participant.identity === hostUid) setRemoteHostVideo(track);
        if (participant.identity === guestUid) setRemoteGuestVideo(track);
      }

      if (track.kind === "audio") {
        const el = track.attach();
        el.autoplay = true;
        (el as any).playsInline = true;
        el.muted = false;
        el.style.display = "none";
        document.body.appendChild(el);

        if (participant.identity === audio1Uid) setAudio1Track(track);
        if (participant.identity === audio2Uid) setAudio2Track(track);
      }
    };

    const handleUnsubscribed = (
      pub: TrackPublication,
      participant: RemoteParticipant
    ) => {
      participant.identity = participant.identity
        ? participant.identity.toString()
        : "";

      if (pub.kind === "video") {
        if (participant.identity === hostUid) setRemoteHostVideo(null);
        if (participant.identity === guestUid) setRemoteGuestVideo(null);
      }

      if (pub.kind === "audio") {
        if (participant.identity === audio1Uid) setAudio1Track(null);
        if (participant.identity === audio2Uid) setAudio2Track(null);
      }
    };

    lkRoom.on("trackSubscribed", handleSubscribed);
    lkRoom.on("trackUnsubscribed", handleUnsubscribed);

    return () => {
      lkRoom.off("trackSubscribed", handleSubscribed);
      lkRoom.off("trackUnsubscribed", handleUnsubscribed);
    };
  }, [lkRoom, hostUid, guestUid, audio1Uid, audio2Uid]);

  /* --------------------------------------------------------
     LEAVE
  -------------------------------------------------------- */
  const leaveAsHost = async () => {
    await lkRoom?.disconnect();
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": false,
      "hostState.mic": false,
    });
  };

  const leaveAsGuest = async () => {
    await lkRoom?.disconnect();
    await updateDoc(doc(db, "rooms", roomId), {
      guestSeat: "",
      "guestState.camera": false,
      "guestState.mic": false,
    });
  };

  const leaveAudioSeat1 = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      audioSeat1: { uid: "", mic: false },
    });
  };

  const leaveAudioSeat2 = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      audioSeat2: { uid: "", mic: false },
    });
  };

  /* --------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <div className="w-full flex justify-between items-center px-4 py-4 gap-4">

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
        onToggleCamera={() =>
          updateDoc(doc(db, "rooms", roomId), {
            "hostState.camera": !hostCamera,
          })
        }
        onToggleMic={() =>
          updateDoc(doc(db, "rooms", roomId), {
            "hostState.mic": !hostMic,
          })
        }
        onLeave={leaveAsHost}
      />

      <AudioSlot
        seatNumber={3}
        occupant={audio1Occupant}
        isSelf={isAudio1Self}
        isHost={isHost}
        onToggleMic={
          isAudio1Self
            ? () =>
                updateDoc(doc(db, "rooms", roomId), {
                  "audioSeat1.mic": !audio1Mic,
                })
            : undefined
        }
        onKick={leaveAudioSeat1}
      />

      <AudioSlot
        seatNumber={4}
        occupant={audio2Occupant}
        isSelf={isAudio2Self}
        isHost={isHost}
        onToggleMic={
          isAudio2Self
            ? () =>
                updateDoc(doc(db, "rooms", roomId), {
                  "audioSeat2.mic": !audio2Mic,
                })
            : undefined
        }
        onKick={leaveAudioSeat2}
      />

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
          onToggleCamera={() =>
            updateDoc(doc(db, "rooms", roomId), {
              "guestState.camera": !guestCamera,
            })
          }
          onToggleMic={() =>
            updateDoc(doc(db, "rooms", roomId), {
              "guestState.mic": !guestMic,
            })
          }
          onLeave={leaveAsGuest}
        />
      ) : (
        <CameraSlot
          nickname="Boş"
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
