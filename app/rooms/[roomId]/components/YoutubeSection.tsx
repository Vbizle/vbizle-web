/* CAMERA SECTION — FIXED WITH onLeave SUPPORT */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";             // ★ EKLENDİ
import CameraSlot from "./CameraSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

import {
  Room,
  RemoteParticipant,
  Track,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from "livekit-client";

export default function CameraSection({ room, user, roomId }: any) {
  const router = useRouter();                            // ★ EKLENDİ

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


  /* ------------------------------------------------
     0) ONLEAVE / ODAYI KÜÇÜLT — ★ YENİ EKLENDİ ★
  ------------------------------------------------ */
  const handleLeave = () => {
    const data = {
      roomId,
      roomImage: room.image || null,
    };

    localStorage.setItem("minimizedRoom", JSON.stringify(data));
    localStorage.setItem("isMinimized", "true");

    router.push("/");   // Anasayfa
  };


  /* ------------------------------------------------
     1) TOKEN → CONNECT
  ------------------------------------------------- */
  useEffect(() => {
    async function connectLK() {
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

    connectLK();
  }, []);


  /* ------------------------------------------------
     2) LOCAL VIDEO TRACK
  ------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    async function startVideo() {
      if (localVideoTrack) return;
      const track = await createLocalVideoTrack();
      setLocalVideoTrack(track);
      lkRoom.localParticipant.publishTrack(track);
    }

    async function stopVideo() {
      if (!localVideoTrack) return;
      lkRoom.localParticipant.unpublishTrack(localVideoTrack);
      localVideoTrack.stop();
      setLocalVideoTrack(null);
    }

    const shouldPublish =
      (isHost && hostCamera) || (isGuestSelf && guestCamera);

    shouldPublish ? startVideo() : stopVideo();
  }, [lkRoom, hostCamera, guestCamera]);


  /* ------------------------------------------------
     3) LOCAL AUDIO TRACK
  ------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    async function startAudio() {
      if (localAudioTrack) return;
      const track = await createLocalAudioTrack();
      setLocalAudioTrack(track);
      lkRoom.localParticipant.publishTrack(track);
    }

    async function stopAudio() {
      if (!localAudioTrack) return;
      lkRoom.localParticipant.unpublishTrack(localAudioTrack);
      localAudioTrack.stop();
      setLocalAudioTrack(null);
    }

    const shouldPublish =
      (isHost && hostMic) || (isGuestSelf && guestMic);

    shouldPublish ? startAudio() : stopAudio();
  }, [lkRoom, hostMic, guestMic]);


  /* ------------------------------------------------
     4) REMOTE PARTICIPANTS
  ------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    const handlePublished = (participant: RemoteParticipant, track) => {
      track.on("subscribed", (subTrack: any) => {
        if (subTrack.kind === Track.Kind.Video) {
          if (participant.identity === hostUid)
            setRemoteHostVideo(subTrack);
          if (participant.identity === guestUid)
            setRemoteGuestVideo(subTrack);
        }

        if (subTrack.kind === Track.Kind.Audio) {
          const audioEl = subTrack.attach();
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          audioEl.muted = false;
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
        }
      });
    };

    lkRoom.on("trackPublished", handlePublished);

    lkRoom.remoteParticipants.forEach((p) => {
      p.tracks.forEach((pub) => {
        if (pub.track) handlePublished(p, pub.track);
      });
    });

    return () => {
      lkRoom.off("trackPublished", handlePublished);
    };
  }, [lkRoom]);


  /* ------------------------------------------------
     5) FIREBASE TOGGLES
  ------------------------------------------------- */

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


  /* ------------------------------------------------
     6) RENDER
  ------------------------------------------------- */
  return (
    <div className="w-full flex justify-between items-center px-6 py-4 gap-6">

      {/* HOST SLOT */}
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
        onLeave={handleLeave}         // ★ EKLENDİ
      />

      {/* GUEST SLOT */}
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
          onLeave={handleLeave}       // ★ EKLENDİ
        />
      ) : (
        <CameraSlot nickname="Misafir Koltuğu" isOccupied={false} />
      )}
    </div>
  );
}
