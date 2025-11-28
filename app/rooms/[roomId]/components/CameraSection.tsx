/* CAMERA SECTION — CAMERA AUDIO INDEPENDENT FROM YOUTUBE */

"use client";

import { useEffect, useState } from "react";
import CameraSlot from "./CameraSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

import {
  Room,
  RemoteParticipant,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from "livekit-client";

export default function CameraSection({ room, user, roomId }: any) {
  const currentUid = user?.uid;

  const hostUid = room.ownerId;
  const guestUid = room.guestSeat || null;

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;

  const hostName = room.hostName || "Host";
  const guestName = room.guestName || "Misafir";

  const hostCamera = room.hostState?.camera ?? false;
  const hostMic = room.hostState?.mic ?? false;

  const guestCamera = room.guestState?.camera ?? false;
  const guestMic = room.guestState?.mic ?? false;

  const [lkRoom, setLkRoom] = useState<Room | null>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState<any>(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState<any>(null);

  const [remoteHostAudio, setRemoteHostAudio] = useState<any>(null);
  const [remoteGuestAudio, setRemoteGuestAudio] = useState<any>(null);

  /* --------------------------------------------
     1) TOKEN → CONNECT
  --------------------------------------------- */

  useEffect(() => {
    async function connectLivekit() {
      if (lkRoom) return;

      const identity = currentUid;
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${identity}`
      );

      if (!resp.ok) return;

      const { token } = await resp.json();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      setLkRoom(newRoom);
    }

    connectLivekit();
  }, []);

  /* --------------------------------------------
     2) CAMERA VIDEO PUBLISH
  --------------------------------------------- */

  useEffect(() => {
    if (!lkRoom) return;

    async function startVideo() {
      if (localVideoTrack) return;
      const track = await createLocalVideoTrack();
      setLocalVideoTrack(track);
      await lkRoom.localParticipant.publishTrack(track);
    }

    async function stopVideo() {
      if (!localVideoTrack) return;
      lkRoom.localParticipant.unpublishTrack(localVideoTrack);
      localVideoTrack.stop();
      setLocalVideoTrack(null);
    }

    const shouldPublish =
      (isHost && hostCamera) || (isGuestSelf && guestCamera);

    if (shouldPublish) startVideo();
    else stopVideo();
  }, [lkRoom, hostCamera, guestCamera]);

  /* --------------------------------------------
     2.5) MICROPHONE AUDIO PUBLISH
  --------------------------------------------- */

  useEffect(() => {
    if (!lkRoom) return;

    async function startAudio() {
      if (localAudioTrack) return;

      const track = await createLocalAudioTrack();
      setLocalAudioTrack(track);

      await lkRoom.localParticipant.publishTrack(track);
    }

    async function stopAudio() {
      if (!localAudioTrack) return;
      lkRoom.localParticipant.unpublishTrack(localAudioTrack);
      localAudioTrack.stop();
      setLocalAudioTrack(null);
    }

    const shouldPublish =
      (isHost && hostMic) || (isGuestSelf && guestMic);

    if (shouldPublish) startAudio();
    else stopAudio();
  }, [lkRoom, hostMic, guestMic]);

  /* --------------------------------------------
     3) REMOTE PARTICIPANTS
  --------------------------------------------- */

  useEffect(() => {
    if (!lkRoom) return;

    function handleParticipant(participant: RemoteParticipant) {
      participant.on("trackSubscribed", (track) => {
        if (track.kind === "video") {
          if (participant.identity === hostUid) setRemoteHostVideo(track);
          else if (participant.identity === guestUid) setRemoteGuestVideo(track);
        }

        if (track.kind === "audio") {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          audioEl.muted = false;
          audioEl.volume = 1.0;                        // 🔥 YouTube’dan bağımsız TAM SES
          audioEl.playsInline = true;

          audioEl.style.display = "none";
          document.body.appendChild(audioEl);          // 🔥 YouTube DOM’undan AYRILDI

          if (participant.identity === hostUid) setRemoteHostAudio(track);
          else if (participant.identity === guestUid) setRemoteGuestAudio(track);
        }
      });

      participant.on("trackUnsubscribed", () => {
        if (participant.identity === hostUid) {
          setRemoteHostVideo(null);
          setRemoteHostAudio(null);
        } else if (participant.identity === guestUid) {
          setRemoteGuestVideo(null);
          setRemoteGuestAudio(null);
        }
      });
    }

    lkRoom.on("participantConnected", handleParticipant);

    Array.from(lkRoom.remoteParticipants.values()).forEach(handleParticipant);

    return () => {
      lkRoom.off("participantConnected", handleParticipant);
    };
  }, [lkRoom]);

  /* --------------------------------------------
     🔥 4) GLOBAL CAMERA AUDIO ISOLATION (her 300ms enforce)
  --------------------------------------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      const audios = document.querySelectorAll("audio");

      audios.forEach((audio: any) => {
        audio.volume = 1.0;   // 🔥 Kamera sesi asla kısılmaz
        audio.muted = false;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  /* --------------------------------------------
     5) FIREBASE TOGGLES
  --------------------------------------------- */

  const toggleHostCamera = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": !hostCamera,
    });
  };

  const toggleHostMic = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.mic": !hostMic,
    });
  };

  const toggleGuestCamera = async () => {
    if (!isGuestSelf) return;
    await updateDoc(doc(db, "rooms", roomId), {
      "guestState.camera": !guestCamera,
    });
  };

  const toggleGuestMic = async () => {
    if (!isGuestSelf) return;
    await updateDoc(doc(db, "rooms", roomId), {
      "guestState.mic": !guestMic,
    });
  };

  const leaveHostSeat = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": false,
      "hostState.mic": false,
    });
  };

  const leaveGuestSeat = async () => {
    if (!isGuestSelf) return;
    await updateDoc(doc(db, "rooms", roomId), {
      guestSeat: null,
      "guestState.camera": false,
      "guestState.mic": false,
    });
  };

  /* --------------------------------------------
     6) RENDER
  --------------------------------------------- */

  return (
    <div className="w-full flex justify-between items-center px-6 py-4 gap-6">
      <CameraSlot
        nickname={hostName}
        isOccupied={true}
        isSelf={isHost}
        isHost={true}
        cameraOn={hostCamera}
        micOn={hostMic}
        remoteTrack={!isHost ? remoteHostVideo : null}
        localTrack={isHost ? localVideoTrack : null}
        onToggleCamera={toggleHostCamera}
        onToggleMic={toggleHostMic}
        onLeave={leaveHostSeat}
      />

      {guestUid ? (
        <CameraSlot
          nickname={guestName}
          isOccupied={true}
          isSelf={isGuestSelf}
          isHost={false}
          cameraOn={guestCamera}
          micOn={guestMic}
          remoteTrack={!isGuestSelf ? remoteGuestVideo : null}
          localTrack={isGuestSelf ? localVideoTrack : null}
          onToggleCamera={toggleGuestCamera}
          onToggleMic={toggleGuestMic}
          onLeave={leaveGuestSeat}
        />
      ) : (
        <CameraSlot
          nickname={"Misafir Koltuğu"}
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
