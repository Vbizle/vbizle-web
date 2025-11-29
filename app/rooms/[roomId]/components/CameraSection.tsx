// app/rooms/[roomId]/components/CameraSection.tsx
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

/* --------------------------------------------------------
   NORMALIZE
-------------------------------------------------------- */
function normalizeSeat(seat: any) {
  if (!seat) return { uid: "", mic: false, hostMute: false };
  return {
    uid: seat.uid || "",
    mic: seat.mic || false,
    hostMute: seat.hostMute || false,
  };
}

export default function CameraSection({ room, user, roomId }: any) {
  const currentUid = user?.uid?.toString();
  const hostUid = room.ownerId?.toString();
  const guestUid = room.guestSeat?.toString() || "";

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;

  /* --------------------------------------------------------
     PROFILE
-------------------------------------------------------- */
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [guestProfile, setGuestProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (hostUid) {
        const s = await getDoc(doc(db, "users", hostUid));
        if (s.exists()) setHostProfile(s.data());
      }
      if (guestUid) {
        const s = await getDoc(doc(db, "users", guestUid));
        if (s.exists()) setGuestProfile(s.data());
      }
    }
    load();
  }, [hostUid, guestUid]);

  const hostName = hostProfile?.username || "Host";
  const hostAvatar = hostProfile?.avatar || null;
  const guestName = guestProfile?.username || "Misafir";
  const guestAvatar = guestProfile?.avatar || null;

  /* --------------------------------------------------------
     AUDIO SEATS
-------------------------------------------------------- */
  const audioSeat1 = normalizeSeat(room.audioSeat1);
  const audioSeat2 = normalizeSeat(room.audioSeat2);

  const audio1Uid = audioSeat1.uid;
  const audio2Uid = audioSeat2.uid;

  const isAudio1Self = currentUid === audio1Uid;
  const isAudio2Self = currentUid === audio2Uid;

  const audio1Mic = audioSeat1.mic;
  const audio2Mic = audioSeat2.mic;

  const audioSeat1HostMute = audioSeat1.hostMute;
  const audioSeat2HostMute = audioSeat2.hostMute;

  const [audio1Profile, setAudio1Profile] = useState<any>(null);
  const [audio2Profile, setAudio2Profile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (audio1Uid) {
        const s = await getDoc(doc(db, "users", audio1Uid));
        if (s.exists()) setAudio1Profile(s.data());
      } else setAudio1Profile(null);

      if (audio2Uid) {
        const s = await getDoc(doc(db, "users", audio2Uid));
        if (s.exists()) setAudio2Profile(s.data());
      } else setAudio2Profile(null);
    }
    load();
  }, [audio1Uid, audio2Uid]);

  const audio1Name = audio1Profile?.username || "Ses 1";
  const audio1Avatar = audio1Profile?.avatar || null;
  const audio2Name = audio2Profile?.username || "Ses 2";
  const audio2Avatar = audio2Profile?.avatar || null;

  /* --------------------------------------------------------
     LIVEKIT STATE
-------------------------------------------------------- */
  const [lkRoom, setLkRoom] = useState<Room | null>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState<any>(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState<any>(null);

  const [audio1Track, setAudio1Track] = useState<any>(null);
  const [audio2Track, setAudio2Track] = useState<any>(null);

  /* --------------------------------------------------------
     CONNECT LIVEKIT
-------------------------------------------------------- */
  useEffect(() => {
    async function connectLK() {
      if (lkRoom || !currentUid) return;

      const r = await fetch(
        `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${currentUid}`
      );
      if (!r.ok) return;

      const { token } = await r.json();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      newRoom.on("participantConnected", (p) => {
        p.identity = p.identity?.toString?.() || "";
      });

      setLkRoom(newRoom);
    }
    connectLK();
  }, [lkRoom, currentUid, roomId]);

  /* --------------------------------------------------------
     LOCAL TRACK CONTROL
-------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    async function handleLocal() {
      const wantCamera =
        isHost ? room.hostState?.camera : isGuestSelf ? room.guestState?.camera : false;

      let wantMic = false;
      if (isHost) wantMic = room.hostState?.mic;
      else if (isGuestSelf) wantMic = room.guestState?.mic;
      else if (isAudio1Self) wantMic = audio1Mic && !audioSeat1HostMute;
      else if (isAudio2Self) wantMic = audio2Mic && !audioSeat2HostMute;

      // CAMERA
      if (wantCamera && !localVideoTrack) {
        const v = await createLocalVideoTrack();
        setLocalVideoTrack(v);
        lkRoom.localParticipant.publishTrack(v).catch(() => {});
      }
      if (localVideoTrack?.mediaStreamTrack)
        localVideoTrack.mediaStreamTrack.enabled = wantCamera;

      // MIC
      if (wantMic && !localAudioTrack) {
        const a = await createLocalAudioTrack();
        setLocalAudioTrack(a);
        lkRoom.localParticipant.publishTrack(a).catch(() => {});
      }
      if (localAudioTrack?.mediaStreamTrack)
        localAudioTrack.mediaStreamTrack.enabled = wantMic;
    }

    handleLocal();
  }, [
    lkRoom,
    localAudioTrack,
    localVideoTrack,
    audio1Mic,
    audio2Mic,
    audioSeat1HostMute,
    audioSeat2HostMute,
    isAudio1Self,
    isAudio2Self,
    isHost,
    isGuestSelf,
    room.hostState,
    room.guestState,
  ]);

  /* --------------------------------------------------------
     REMOTE TRACKS — SİNYAL KAYBINI TAM FIX
-------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    const onSub = (track: any, pub: TrackPublication, participant: RemoteParticipant) => {
      const id = participant.identity?.toString?.() || "";

      if (track.kind === "video") {
        if (id === hostUid) setRemoteHostVideo(track);
        if (id === guestUid) setRemoteGuestVideo(track);
      }

      if (track.kind === "audio") {
        const el = track.attach();
        el.autoplay = true;
        el.style.display = "none";
        el.muted = false;
        el.playsInline = true;
        document.body.appendChild(el);

        if (id === audio1Uid) setAudio1Track(track);
        if (id === audio2Uid) setAudio2Track(track);
      }
    };

    const onUnsub = (pub: TrackPublication, participant: RemoteParticipant) => {
      const id = participant.identity?.toString?.() || "";

      if (pub.kind === "audio") {
        if (id === audio1Uid) setAudio1Track(null);
        if (id === audio2Uid) setAudio2Track(null);
      }

      if (pub.kind === "video") {
        if (id === hostUid) setRemoteHostVideo(null);
        if (id === guestUid) setRemoteGuestVideo(null);
      }
    };

    lkRoom.on("trackSubscribed", onSub);
    lkRoom.on("trackUnsubscribed", onUnsub);

    return () => {
      lkRoom.off("trackSubscribed", onSub);
      lkRoom.off("trackUnsubscribed", onUnsub);
    };
  }, [lkRoom, audio1Uid, audio2Uid, hostUid, guestUid]);

  /* --------------------------------------------------------
     HOST → MUTE / UNMUTE (UYARISIZ)
-------------------------------------------------------- */
  const hostMuteUser = async (uid: string) => {
    if (!isHost) return;

    const roomRef = doc(db, "rooms", roomId);

    let seatKey = null;
    let currentHostMute = false;

    if (audioSeat1.uid === uid) {
      seatKey = "audioSeat1";
      currentHostMute = audioSeat1HostMute;
    } else if (audioSeat2.uid === uid) {
      seatKey = "audioSeat2";
      currentHostMute = audioSeat2HostMute;
    } else return;

    const isNowMuted = !currentHostMute;

    await updateDoc(roomRef, {
      [`${seatKey}.hostMute`]: isNowMuted,
      [`${seatKey}.mic`]: !isNowMuted,
    });

    if (!lkRoom) return;
    const participant = lkRoom.remoteParticipants.get(uid);
    if (!participant) return;

    // Güvenli kontrol – uyarı sorununu çözer
    const audioTracksMap = participant.audioTracks;
    if (!audioTracksMap || typeof audioTracksMap.values !== "function") return;

    const pubs = Array.from(audioTracksMap.values());
    pubs.forEach((pub) => {
      if (pub?.track?.mediaStreamTrack) {
        pub.track.mediaStreamTrack.enabled = !isNowMuted;
      }
    });
  };

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
      audioSeat1: { uid: "", mic: false, hostMute: false },
    });
  };

  const leaveAudioSeat2 = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      audioSeat2: { uid: "", mic: false, hostMute: false },
    });
  };

  /* --------------------------------------------------------
     RENDER
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
        cameraOn={room.hostState?.camera}
        micOn={room.hostState?.mic}
        remoteTrack={!isHost ? remoteHostVideo : null}
        localTrack={isHost ? localVideoTrack : null}
        onToggleCamera={() =>
          updateDoc(doc(db, "rooms", roomId), {
            "hostState.camera": !room.hostState?.camera,
          })
        }
        onToggleMic={() =>
          updateDoc(doc(db, "rooms", roomId), {
            "hostState.mic": !room.hostState?.mic,
          })
        }
        onLeave={leaveAsHost}
      />

      <AudioSlot
        seatNumber={3}
        occupant={
          audioSeat1.uid
            ? {
                uid: audio1Uid,
                name: audio1Name,
                avatar: audio1Avatar,
                mic: audio1Mic,
                hostMute: audioSeat1HostMute,
                audioTrack: audio1Track,
              }
            : null
        }
        isSelf={isAudio1Self}
        isHost={isHost}
        onToggleMic={
          isAudio1Self
            ? () => {
                if (audioSeat1HostMute) {
                  alert("Host mikrofonunu kapattı!");
                  return;
                }
                updateDoc(doc(db, "rooms", roomId), {
                  "audioSeat1.mic": !audio1Mic,
                });
              }
            : undefined
        }
        onKick={leaveAudioSeat1}
        onHostMute={hostMuteUser}
      />

      <AudioSlot
        seatNumber={4}
        occupant={
          audioSeat2.uid
            ? {
                uid: audio2Uid,
                name: audio2Name,
                avatar: audio2Avatar,
                mic: audio2Mic,
                hostMute: audioSeat2HostMute,
                audioTrack: audio2Track,
              }
            : null
        }
        isSelf={isAudio2Self}
        isHost={isHost}
        onToggleMic={
          isAudio2Self
            ? () => {
                if (audioSeat2HostMute) {
                  alert("Host mikrofonunu kapattı!");
                  return;
                }
                updateDoc(doc(db, "rooms", roomId), {
                  "audioSeat2.mic": !audio2Mic,
                });
              }
            : undefined
        }
        onKick={leaveAudioSeat2}
        onHostMute={hostMuteUser}
      />

      {guestUid ? (
        <CameraSlot
          nickname={guestName}
          avatar={guestAvatar}
          seatNumber={2}
          isOccupied={true}
          isSelf={isGuestSelf}
          isHost={false}
          cameraOn={room.guestState?.camera}
          micOn={room.guestState?.mic}
          remoteTrack={!isGuestSelf ? remoteGuestVideo : null}
          localTrack={isGuestSelf ? localVideoTrack : null}
          onToggleCamera={() =>
            updateDoc(doc(db, "rooms", roomId), {
              "guestState.camera": !room.guestState?.camera,
            })
          }
          onToggleMic={() =>
            updateDoc(doc(db, "rooms", roomId), {
              "guestState.mic": !room.guestState?.mic,
            })
          }
          onLeave={leaveAsGuest}
        />
      ) : (
        <CameraSlot
          nickname="Boş"
          avatar={null}
          seatNumber={2}
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
