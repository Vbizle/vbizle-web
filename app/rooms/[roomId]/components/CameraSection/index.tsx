"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

import CameraSlot from "../CameraSlot";
import AudioSlot from "../AudioSlot";

import useLivekitRoom from "./useLivekitRoom";
import useSlotTracks from "./useSlotTracks";

/* --------------------------------------------------------
   HELPERS
-------------------------------------------------------- */
const normalize = (v) => (v ? v.toString() : "");
const normalizeSeat = (seat) =>
  seat
    ? {
        uid: normalize(seat.uid),
        mic: !!seat.mic,
        hostMute: !!seat.hostMute,
      }
    : { uid: "", mic: false, hostMute: false };

export default function CameraSection({ room, user, roomId }) {
  /* --------------------------------------------------------
     USER
  -------------------------------------------------------- */
  const currentUid = normalize(user?.uid);
  const hostUid = normalize(room.ownerId);
  const guestUid = normalize(room.guestSeat);

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;

  /* --------------------------------------------------------
     PROFILES
  -------------------------------------------------------- */
  const [hostProfile, setHostProfile] = useState(null);
  const [guestProfile, setGuestProfile] = useState(null);

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

  /* --------------------------------------------------------
     AUDIO SEATS
  -------------------------------------------------------- */
  const audioSeat1 = normalizeSeat(room.audioSeat1);
  const audioSeat2 = normalizeSeat(room.audioSeat2);

  const a1 = audioSeat1.uid;
  const a2 = audioSeat2.uid;

  const [audio1Profile, setAudio1Profile] = useState(null);
  const [audio2Profile, setAudio2Profile] = useState(null);

  const isAudio1Self = currentUid === a1;
  const isAudio2Self = currentUid === a2;

  useEffect(() => {
    async function loadAudio() {
      if (a1) {
        const s = await getDoc(doc(db, "users", a1));
        if (s.exists()) setAudio1Profile(s.data());
      } else setAudio1Profile(null);

      if (a2) {
        const s = await getDoc(doc(db, "users", a2));
        if (s.exists()) setAudio2Profile(s.data());
      } else setAudio2Profile(null);
    }
    loadAudio();
  }, [a1, a2]);

  /* --------------------------------------------------------
     LIVEKIT
  -------------------------------------------------------- */
  const lk = useLivekitRoom({ roomId, currentUid });

  const {
    localVideoTrack,
    localAudioTrack,
    remoteHostVideo,
    remoteGuestVideo,
    audio1Track,
    audio2Track,
    hostMuteUser,
  } = useSlotTracks({
    lkRoom: lk.lkRoom,
    room,
    currentUid,
    hostUid,
    guestUid,
    audioSeat1,
    audioSeat2,
    roomId,
  });

  /* --------------------------------------------------------
     FINAL: SLOT-BAĞIMSIZ LEAVE FONKSİYONLARI
-------------------------------------------------------- */

  const leaveAsHost = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": false,
      "hostState.mic": false,
    });

    if (localVideoTrack?.mediaStreamTrack)
      localVideoTrack.mediaStreamTrack.enabled = false;
    if (localAudioTrack?.mediaStreamTrack)
      localAudioTrack.mediaStreamTrack.enabled = false;
  };

  const leaveAsGuest = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      guestSeat: "",
      "guestState.camera": false,
      "guestState.mic": false,
    });

    if (localVideoTrack?.mediaStreamTrack)
      localVideoTrack.mediaStreamTrack.enabled = false;
    if (localAudioTrack?.mediaStreamTrack)
      localAudioTrack.mediaStreamTrack.enabled = false;
  };

  const leaveAudioSeat1 = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      audioSeat1: { uid: "", mic: false, hostMute: false },
    });

    if (localAudioTrack?.mediaStreamTrack)
      localAudioTrack.mediaStreamTrack.enabled = false;
  };

  const leaveAudioSeat2 = async () => {
    await updateDoc(doc(db, "rooms", roomId), {
      audioSeat2: { uid: "", mic: false, hostMute: false },
    });

    if (localAudioTrack?.mediaStreamTrack)
      localAudioTrack.mediaStreamTrack.enabled = false;
  };

  /* --------------------------------------------------------
     🔥 RECONNECTED → UI REFRESH (EN ÖNEMLİ KISIM)
-------------------------------------------------------- */
  useEffect(() => {
    if (!lk.lkRoom) return;

    function onReconnected() {
      console.log("🔥 LiveKit Reconnected — CameraSection UI Refresh");
      // UI forced refresh
      setHostProfile((p) => ({ ...p }));
    }

    lk.lkRoom.on("reconnected", onReconnected);
    return () => lk.lkRoom.off("reconnected", onReconnected);
  }, [lk.lkRoom]);

  /* --------------------------------------------------------
     UI
  -------------------------------------------------------- */

  return (
    <div className="w-full flex justify-between items-center px-0 py-2 gap-0">

      {/* HOST SLOT */}
      <CameraSlot
        nickname={hostProfile?.username}
        avatar={hostProfile?.avatar}
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

      {/* AUDIO SLOT 1 */}
      <AudioSlot
        seatNumber={3}
        occupant={
          a1
            ? {
                uid: a1,
                name: audio1Profile?.username,
                avatar: audio1Profile?.avatar,
                mic: audioSeat1.mic,
                hostMute: audioSeat1.hostMute,
                audioTrack: audio1Track,
              }
            : null
        }
        isSelf={isAudio1Self}
        isHost={isHost}
        onToggleMic={
          isAudio1Self
            ? () =>
                updateDoc(doc(db, "rooms", roomId), {
                  "audioSeat1.mic": !audioSeat1.mic,
                })
            : undefined
        }
        onKick={leaveAudioSeat1}
        onHostMute={hostMuteUser}
      />

      {/* AUDIO SLOT 2 */}
      <AudioSlot
        seatNumber={4}
        occupant={
          a2
            ? {
                uid: a2,
                name: audio2Profile?.username,
                avatar: audio2Profile?.avatar,
                mic: audioSeat2.mic,
                hostMute: audioSeat2.hostMute,
                audioTrack: audio2Track,
              }
            : null
        }
        isSelf={isAudio2Self}
        isHost={isHost}
        onToggleMic={
          isAudio2Self
            ? () =>
                updateDoc(doc(db, "rooms", roomId), {
                  "audioSeat2.mic": !audioSeat2.mic,
                })
            : undefined
        }
        onKick={leaveAudioSeat2}
        onHostMute={hostMuteUser}
      />

      {/* GUEST SLOT */}
      {guestUid ? (
        <CameraSlot
          nickname={guestProfile?.username}
          avatar={guestProfile?.avatar}
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
