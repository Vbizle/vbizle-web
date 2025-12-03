"use client";

import { useEffect, useState } from "react";
import {
  createLocalVideoTrack,
  createLocalAudioTrack,
} from "livekit-client";

export default function useSlotTracks({
  lkRoom,
  room,
  currentUid,
  hostUid,
  guestUid,
  audioSeat1,
  audioSeat2,
}) {
  /* --------------------------------------------------------
     STATE — Slot based architecture
  -------------------------------------------------------- */
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState(null);

  const [audio1Track, setAudio1Track] = useState(null);
  const [audio2Track, setAudio2Track] = useState(null);

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;
  const isA1 = currentUid === audioSeat1.uid;
  const isA2 = currentUid === audioSeat2.uid;

  /* --------------------------------------------------------
     1) LOCAL TRACKS — Camera + Mic (with AEC)
  -------------------------------------------------------- */
  async function ensureLocalTracks() {
    if (!lkRoom) return;

    /** CAMERA **/
    const wantCam =
      isHost
        ? room.hostState?.camera
        : isGuestSelf
        ? room.guestState?.camera
        : false;

    if (wantCam && !localVideoTrack) {
      const v = await createLocalVideoTrack({
        resolution: { width: 640, height: 360 },
      });
      v.mediaStreamTrack.enabled = true;

      setLocalVideoTrack(v);
      lkRoom.localParticipant.publishTrack(v).catch(() => {});
    }

    if (localVideoTrack?.mediaStreamTrack) {
      localVideoTrack.mediaStreamTrack.enabled = wantCam;
    }

    /** MICROPHONE **/
    let wantMic = false;

    if (isHost) wantMic = room.hostState?.mic;
    else if (isGuestSelf) wantMic = room.guestState?.mic;
    else if (isA1) wantMic = audioSeat1.mic && !audioSeat1.hostMute;
    else if (isA2) wantMic = audioSeat2.mic && !audioSeat2.hostMute;

    if (wantMic && !localAudioTrack) {
      const a = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      a.mediaStreamTrack.enabled = true;
      setLocalAudioTrack(a);
      lkRoom.localParticipant.publishTrack(a).catch(() => {});
    }

    if (localAudioTrack?.mediaStreamTrack) {
      localAudioTrack.mediaStreamTrack.enabled = wantMic;
    }
  }

  useEffect(() => {
    ensureLocalTracks();
  }, [
    lkRoom,
    room.hostState,
    room.guestState,
    audioSeat1,
    audioSeat2,
    currentUid,
    hostUid,
    guestUid,
  ]);

  /* --------------------------------------------------------
     2) SLOT CHANGE → RESET REMOTE TRACKS
     (Fixes: slot değişince görüntü güncellenmemesi)
  -------------------------------------------------------- */
  useEffect(() => {
    setRemoteHostVideo(null);
    setRemoteGuestVideo(null);
    setAudio1Track(null);
    setAudio2Track(null);
  }, [hostUid, guestUid, audioSeat1.uid, audioSeat2.uid]);

  /* --------------------------------------------------------
     3) REMOTE TRACK SUBSCRIBE — Ultra Stable Mapping
  -------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    function onSubscribed(track, pub, participant) {
      const id = participant.identity?.toString() || "";

      /* ---- VIDEO ---- */
      if (track.kind === "video") {
        if (id === hostUid) setRemoteHostVideo(track);
        if (id === guestUid) setRemoteGuestVideo(track);
      }

      /* ---- AUDIO ---- */
      if (track.kind === "audio") {
        const el = track.attach();
        el.autoplay = true;
        el.playsInline = true;
        el.muted = false;
        el.style.display = "none";
        document.body.appendChild(el);

        if (id === audioSeat1.uid) setAudio1Track(track);
        if (id === audioSeat2.uid) setAudio2Track(track);
      }
    }

    function onUnsub(pub, participant) {
      const id = participant.identity?.toString() || "";

      if (pub.kind === "video") {
        if (id === hostUid) setRemoteHostVideo(null);
        if (id === guestUid) setRemoteGuestVideo(null);
      }

      if (pub.kind === "audio") {
        if (id === audioSeat1.uid) setAudio1Track(null);
        if (id === audioSeat2.uid) setAudio2Track(null);
      }
    }

    lkRoom.on("trackSubscribed", onSubscribed);
    lkRoom.on("trackUnsubscribed", onUnsub);

    return () => {
      lkRoom.off("trackSubscribed", onSubscribed);
      lkRoom.off("trackUnsubscribed", onUnsub);
    };
  }, [lkRoom, hostUid, guestUid, audioSeat1.uid, audioSeat2.uid]);

  /* --------------------------------------------------------
     4) RECONNECT SAFE RESTORE
  -------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    function handleReconnected() {
      ensureLocalTracks();

      setRemoteHostVideo((p) => p);
      setRemoteGuestVideo((p) => p);

      setAudio1Track((p) => p);
      setAudio2Track((p) => p);
    }

    lkRoom.on("reconnected", handleReconnected);
    return () => lkRoom.off("reconnected", handleReconnected);
  }, [lkRoom]);

  /* --------------------------------------------------------
     EXPORT
  -------------------------------------------------------- */
  return {
    localVideoTrack,
    localAudioTrack,
    remoteHostVideo,
    remoteGuestVideo,
    audio1Track,
    audio2Track,
  };
}
