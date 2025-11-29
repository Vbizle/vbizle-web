"use client";

import { useEffect, useState } from "react";
import CameraSlot from "./CameraSlot";
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

import {
  Room,
  RemoteParticipant,
  TrackPublication,
  createLocalTracks,
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

  const [lkRoom, setLkRoom] = useState<any>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState<any>(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState<any>(null);

  /* ------------------------------------------------------------
     1) CONNECT LIVEKIT
  ------------------------------------------------------------ */
  useEffect(() => {
    async function connectLK() {
      if (lkRoom) return;

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${currentUid}`
      );

      const { token } = await resp.json();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      await newRoom.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      setLkRoom(newRoom);
    }

    connectLK();
  }, []);

  /* ------------------------------------------------------------
     2) LOCAL TRACK LOGIC (MIC + CAMERA FINAL FIX)
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!lkRoom) return;

    async function handleTracks() {
      /* --------- VIDEO --------- */
      if (hostCamera || guestCamera) {
        if (!localVideoTrack) {
          const video = await createLocalVideoTrack();
          setLocalVideoTrack(video);
        }

        if (localVideoTrack) {
          lkRoom.localParticipant.publishTrack(localVideoTrack);
        }
      } else if (localVideoTrack) {
        lkRoom.localParticipant.unpublishTrack(localVideoTrack);
      }

      /* --------- MICROPHONE FINAL FIX --------- */

      const micOn = isHost ? hostMic : isGuestSelf ? guestMic : false;

      if (micOn) {
        // 🔥 Yeni audio track oluştur
        const audio = await createLocalAudioTrack();

        // Eski track varsa kaldır
        if (localAudioTrack) {
          try {
            lkRoom.localParticipant.unpublishTrack(localAudioTrack);
            localAudioTrack.stop();
          } catch {}
        }

        setLocalAudioTrack(audio);

        // Yeni track yayınla
        lkRoom.localParticipant.publishTrack(audio);
      } else {
        // Mikrofon kapatma
        if (localAudioTrack) {
          try {
            lkRoom.localParticipant.unpublishTrack(localAudioTrack);
            localAudioTrack.stop();
          } catch {}
        }
        setLocalAudioTrack(null);
      }
    }

    handleTracks();
  }, [
    lkRoom,
    hostMic,
    guestMic,
    hostCamera,
    guestCamera
  ]);

  /* ------------------------------------------------------------
     3) REMOTE TRACKS
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!lkRoom) return;

    const onSub = (track: any, pub: any, participant: any) => {
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

    lkRoom.on("trackSubscribed", onSub);

    lkRoom.remoteParticipants.forEach((p: any) => {
      p.getTrackPublications().forEach((pub: any) => {
        if (pub.isSubscribed && pub.track) onSub(pub.track, pub, p);
      });
    });

    return () => lkRoom.off("trackSubscribed", onSub);
  }, [lkRoom]);

  /* ------------------------------------------------------------
     4) LEAVE
  ------------------------------------------------------------ */
  const leaveAsHost = async () => {
    try { lkRoom.disconnect(); } catch {}
    await updateDoc(doc(db, "rooms", roomId), {
      "hostState.camera": false,
      "hostState.mic": false
    });
  };

  const leaveAsGuest = async () => {
    try { lkRoom.disconnect(); } catch {}
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
