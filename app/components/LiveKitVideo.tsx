"use client";

import { Room, RoomEvent, RemoteTrackPublication, RemoteParticipant, Participant, Track } from "livekit-client";
import { useEffect, useState } from "react";

interface Props {
  url: string;
  token: string;
  isHost: boolean; // host = sağ, misafir = sol
}

export default function LiveVideo({ url, token, isHost }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const r = new Room();
    setRoom(r);

    r.connect(url, token).then(() => {
      r.localParticipant.setCameraEnabled(true);
      r.localParticipant.setMicrophoneEnabled(true);
    });

    // remote track geldiğinde bağla
    r.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
      if (track.kind === "video" && videoEl) {
        track.attach(videoEl);
      }
      if (track.kind === "audio" && audioEl) {
        track.attach(audioEl);
      }
    });

    return () => {
      r.disconnect();
    };
  }, [url, token, videoEl, audioEl]);

  return (
    <div
      className={`absolute bottom-4 ${
        isHost ? "right-4" : "left-4"
      } w-[90px] h-[90px] rounded-full overflow-hidden border-2 border-white/40 bg-black/50`}
    >
      <video
        ref={(el) => setVideoEl(el)}
        autoPlay
        playsInline
        muted={false}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <audio ref={(el) => setAudioEl(el)} autoPlay />
    </div>
  );
}