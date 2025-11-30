"use client";
import { useEffect, useState } from "react";
import { RemoteParticipant, Track, TrackPublication } from "livekit-client";

export function useRemoteTracks({
  lkRoom,
  room,
  hostUid,
  guestUid,
  audio1Uid,
  audio2Uid,
  audio1Mic,
  audio2Mic,
  audioSeat1HostMute,
  audioSeat2HostMute,
}: any) {
  
  const [hostVideo, setHostVideo] = useState<any>(null);
  const [guestVideo, setGuestVideo] = useState<any>(null);

  const [audio1Track, setAudio1Track] = useState<any>(null);
  const [audio2Track, setAudio2Track] = useState<any>(null);

  useEffect(() => {
    if (!lkRoom) return;

    function removeAudioEl(id: string) {
      const el = document.getElementById("audio-" + id);
      if (el) el.remove();
    }

    const onSub = (
      track: Track,
      pub: TrackPublication,
      participant: RemoteParticipant
    ) => {
      const id = participant.identity?.toString?.() || "";

      if (track.kind === "video") {
        if (id === hostUid) setHostVideo(track);
        if (id === guestUid) setGuestVideo(track);
      }

      if (track.kind === "audio") {
        removeAudioEl(id);

        let allow = false;
        if (id === hostUid) allow = room.hostState?.mic;
        if (id === guestUid) allow = room.guestState?.mic;
        if (id === audio1Uid) allow = audio1Mic && !audioSeat1HostMute;
        if (id === audio2Uid) allow = audio2Mic && !audioSeat2HostMute;

        if (!allow) return;

        const el = track.attach();
        el.id = "audio-" + id;
        el.autoplay = true;
        el.playsInline = true;
        el.style.display = "none";
        document.body.appendChild(el);

        if (id === audio1Uid) setAudio1Track(track);
        if (id === audio2Uid) setAudio2Track(track);
      }
    };

    const onUnsub = (
      pub: TrackPublication,
      participant: RemoteParticipant
    ) => {
      const id = participant.identity?.toString?.() || "";

      removeAudioEl(id);

      if (pub.kind === "video") {
        if (id === hostUid) setHostVideo(null);
        if (id === guestUid) setGuestVideo(null);
      }

      if (pub.kind === "audio") {
        if (id === audio1Uid) setAudio1Track(null);
        if (id === audio2Uid) setAudio2Track(null);
      }
    };

    lkRoom.on("trackSubscribed", onSub);
    lkRoom.on("trackUnsubscribed", onUnsub);

    return () => {
      lkRoom.off("trackSubscribed", onSub);
      lkRoom.off("trackUnsubscribed", onUnsub);
    };
  }, [
    lkRoom,
    hostUid,
    guestUid,
    audio1Uid,
    audio2Uid,
    audio1Mic,
    audio2Mic,
    audioSeat1HostMute,
    audioSeat2HostMute,
    room.hostState,
    room.guestState,
  ]);

  return {
    hostVideo,
    guestVideo,
    audio1Track,
    audio2Track,
  };
}
