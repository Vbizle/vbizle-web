"use client";

import { useEffect, useState } from "react";
import {
  RemoteParticipant,
  TrackPublication,
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
     STATE
  -------------------------------------------------------- */
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);

  const [remoteHostVideo, setRemoteHostVideo] = useState(null);
  const [remoteGuestVideo, setRemoteGuestVideo] = useState(null);

  const [audio1Track, setAudio1Track] = useState(null);
  const [audio2Track, setAudio2Track] = useState(null);

  const isHost = currentUid === hostUid;
  const isGuestSelf = currentUid === guestUid;
  const isAudio1Self = currentUid === audioSeat1.uid;
  const isAudio2Self = currentUid === audioSeat2.uid;

  /* --------------------------------------------------------
     🔥 1) LOCAL TRACKS — stop yok, sadece enable değişir
  -------------------------------------------------------- */
  async function ensureLocalTracks() {
    if (!lkRoom) return;

    /* CAMERA */
    const wantCamera = isHost
      ? room.hostState?.camera
      : isGuestSelf
      ? room.guestState?.camera
      : false;

    if (wantCamera && !localVideoTrack) {
      const v = await createLocalVideoTrack();
      v.mediaStreamTrack.enabled = true;

      setLocalVideoTrack(v);
      await lkRoom.localParticipant.publishTrack(v).catch(() => {});
    }

    if (localVideoTrack?.mediaStreamTrack) {
      localVideoTrack.mediaStreamTrack.enabled = wantCamera;
    }

    /* MICROPHONE */
    let wantMic = false;

    if (isHost) wantMic = room.hostState?.mic;
    else if (isGuestSelf) wantMic = room.guestState?.mic;
    else if (isAudio1Self) wantMic = audioSeat1.mic && !audioSeat1.hostMute;
    else if (isAudio2Self) wantMic = audioSeat2.mic && !audioSeat2.hostMute;

    if (wantMic && !localAudioTrack) {
      const a = await createLocalAudioTrack();
      a.mediaStreamTrack.enabled = true;

      setLocalAudioTrack(a);
      await lkRoom.localParticipant.publishTrack(a).catch(() => {});
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
     🔥 2) REMOTE TRACKS — tüm video/audio bağlama
  -------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    function onSubscribed(track, pub, participant) {
      const id = participant.identity?.toString() || "";

      if (track.kind === "video") {
        if (id === hostUid) setRemoteHostVideo(track);
        if (id === guestUid) setRemoteGuestVideo(track);
      }

      if (track.kind === "audio") {
        const el = track.attach();
        el.autoplay = true;
        el.playsInline = true;
        el.style.display = "none";
        document.body.appendChild(el);

        if (id === audioSeat1.uid) setAudio1Track(track);
        if (id === audioSeat2.uid) setAudio2Track(track);

        if (id === hostUid) setAudio1Track(track);
        if (id === guestUid) setAudio2Track(track);
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
  }, [lkRoom, audioSeat1, audioSeat2, hostUid, guestUid]);

  /* --------------------------------------------------------
     🔥 3) RECONNECT EVENT — kamera/mikrofon + remote geri bağla
  -------------------------------------------------------- */
  useEffect(() => {
    if (!lkRoom) return;

    function handleReconnected() {
      console.log("🔥 useSlotTracks → RECONNECTED → Track sync");

      // Local trackleri yeniden yayınla
      ensureLocalTracks();

      // Remote tracklerin yeniden sync olması için reset
      setRemoteHostVideo((prev) => prev);
      setRemoteGuestVideo((prev) => prev);
      setAudio1Track((prev) => prev);
      setAudio2Track((prev) => prev);
    }

    lkRoom.on("reconnected", handleReconnected);

    return () => {
      lkRoom.off("reconnected", handleReconnected);
    };
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
