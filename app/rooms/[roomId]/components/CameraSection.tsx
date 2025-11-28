/* CAMERA SECTION — PERMISSION FIX + AUTO MIC ON */

"use client";

import { useEffect, useState } from "react";
import CameraSlot from "./CameraSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

import {
  Room,
  RemoteParticipant,
  Track,
  createLocalTracks,
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


  /* ---------------------------------------------------------
     1) CONNECT LIVEKIT
  ---------------------------------------------------------- */
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


  /* ---------------------------------------------------------
     2) START OR STOP LOCAL CAMERA + MIC (PERMISSION FIXED)
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    async function startTracks() {
      if (localVideoTrack || localAudioTrack) return;

      // Kamera + ses izni birlikte burada istenir
      const tracks = await createLocalTracks({
        audio: true,
        video: true,
      });

      const video = tracks.find((t) => t.kind === "video");
      const audio = tracks.find((t) => t.kind === "audio");

      if (video) {
        setLocalVideoTrack(video);
        lkRoom.localParticipant.publishTrack(video);
      }

      if (audio) {
        audio.setMuted(false); // ✔ otomatik ses açık
        setLocalAudioTrack(audio);
        lkRoom.localParticipant.publishTrack(audio);
      }
    }

    function stopTracks() {
      if (localVideoTrack) {
        lkRoom.localParticipant.unpublishTrack(localVideoTrack);
        localVideoTrack.stop();
        setLocalVideoTrack(null);
      }

      if (localAudioTrack) {
        lkRoom.localParticipant.unpublishTrack(localAudioTrack);
        localAudioTrack.stop();
        setLocalAudioTrack(null);
      }
    }

    const shouldStart =
      (isHost && (hostCamera || hostMic)) ||
      (isGuestSelf && (guestCamera || guestMic));

    shouldStart ? startTracks() : stopTracks();
  }, [
    lkRoom,
    hostCamera,
    guestCamera,
    hostMic,
    guestMic,
  ]);


  /* ---------------------------------------------------------
     3) HANDLE REMOTE PARTICIPANTS
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    const handlePublished = (participant: RemoteParticipant, track) => {
      track.on("subscribed", (subTrack: any) => {
        // VIDEO
        if (subTrack.kind === Track.Kind.Video) {
          if (participant.identity === hostUid)
            setRemoteHostVideo(subTrack);
          if (participant.identity === guestUid)
            setRemoteGuestVideo(subTrack);
        }

        // AUDIO
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

    // Existing participants
    const participants = lkRoom.remoteParticipants;
    participants.forEach((p) => {
      p.tracks.forEach((pub) => {
        if (pub.track) handlePublished(p, pub.track);
      });
    });

    return () => {
      lkRoom.off("trackPublished", handlePublished);
    };
  }, [lkRoom]);


  /* ---------------------------------------------------------
     4) FIREBASE STATE TOGGLES
  ---------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     5) RENDER
  ---------------------------------------------------------- */
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
        onLeave={async () => {
          await updateDoc(doc(db, "rooms", roomId), {
            "hostState.camera": false,
          });
        }}
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
          onLeave={async () => {
            await updateDoc(doc(db, "rooms", roomId), {
              "guestState.camera": false,
            });
          }}
        />
      ) : (
        <CameraSlot nickname="Misafir Koltuğu" isOccupied={false} />
      )}
    </div>
  );
}
