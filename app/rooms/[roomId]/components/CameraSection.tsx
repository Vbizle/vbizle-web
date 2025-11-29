"use client";

import { useEffect, useState } from "react";
import CameraSlot from "./CameraSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

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

  const hostCamera = room.hostState?.camera ?? false;
  const hostMic = room.hostState?.mic ?? false;

  const guestCamera = room.guestState?.camera ?? false;
  const guestMic = room.guestState?.mic ?? false;

  const [lkRoom, setLkRoom] = useState<Room | null>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState<any>(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState<any>(null);

  /* ------------------------------------------------------------
     1) CONNECT LIVEKIT (SADECE 1 KEZ)
  ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
     2) LOCAL TRACK LOGIC (KAMERA / MİK → ENABLE / DISABLE)
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!lkRoom) return;

    async function handleTracks() {
      // Bu client ne istiyor?
      const wantCamera = isHost ? hostCamera : isGuestSelf ? guestCamera : false;
      const wantMic = isHost ? hostMic : isGuestSelf ? guestMic : false;

      // --------- VIDEO (TEK TRACK, HİÇ UNPUBLISH YOK) ---------
      if (wantCamera && !localVideoTrack) {
        const video = await createLocalVideoTrack();
        setLocalVideoTrack(video);
        try {
          await lkRoom.localParticipant.publishTrack(video);
        } catch {}
      }

      if (localVideoTrack?.mediaStreamTrack) {
        // Kamera aç/kapa sadece enabled üzerinden
        localVideoTrack.mediaStreamTrack.enabled = wantCamera;
      }

      // --------- AUDIO (TEK TRACK, UNPUBLISH YOK) ---------
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

  /* ------------------------------------------------------------
     3) REMOTE TRACKS (HOST / MİSAFİR GÖRÜNTÜLERİ)
  ------------------------------------------------------------ */
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

    // Var olan remote participant'lar
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

  /* ------------------------------------------------------------
     4) LEAVE (SLOTTAN İNME)
  ------------------------------------------------------------ */
  const leaveAsHost = async () => {
    try {
      await lkRoom?.disconnect();
    } catch {}
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": false,
      "hostState.mic": false
    });
  };

  const leaveAsGuest = async () => {
    try {
      await lkRoom?.disconnect();
    } catch {}
    await updateDoc(doc(db, "rooms", roomId), {
      guestSeat: null,
      "guestState.camera": false,
      "guestState.mic": false
    });
  };

  /* ------------------------------------------------------------
     5) UI
  ------------------------------------------------------------ */
  return (
    <div className="w-full flex justify-between items-center px-6 py-4 gap-6">

      <CameraSlot
        nickname="Host"
        isOccupied={true}
        isSelf={isHost}
        isHost={true}
        cameraOn={hostCamera}
        micOn={hostMic}
        remoteTrack={!isHost ? remoteHostVideo : null}
        localTrack={isHost ? localVideoTrack : null}
        onToggleCamera={async () =>
          updateDoc(doc(db, "rooms", roomId), {
            "hostState.camera": !hostCamera
          })
        }
        onToggleMic={async () =>
          updateDoc(doc(db, "rooms", roomId), {
            "hostState.mic": !hostMic
          })
        }
        onLeave={leaveAsHost}
      />

      {guestUid ? (
        <CameraSlot
          nickname="Misafir"
          isOccupied={true}
          isSelf={isGuestSelf}
          isHost={false}
          cameraOn={guestCamera}
          micOn={guestMic}
          remoteTrack={!isGuestSelf ? remoteGuestVideo : null}
          localTrack={isGuestSelf ? localVideoTrack : null}
          onToggleCamera={async () =>
            updateDoc(doc(db, "rooms", roomId), {
              "guestState.camera": !guestCamera
            })
          }
          onToggleMic={async () =>
            updateDoc(doc(db, "rooms", roomId), {
              "guestState.mic": !guestMic
            })
          }
          onLeave={leaveAsGuest}
        />
      ) : (
        <CameraSlot nickname="Misafir Koltuğu" isOccupied={false} />
      )}
    </div>
  );
}
