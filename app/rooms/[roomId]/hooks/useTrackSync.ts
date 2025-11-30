"use client";

import { useEffect } from "react";
import { RemoteParticipant, TrackPublication } from "livekit-client";

type TrackSyncConfig = {
  onVideo?: (identity: string, track: any) => void;
  onAudio?: (identity: string, track: any) => void;
  onVideoRemove?: (identity: string) => void;
  onAudioRemove?: (identity: string) => void;
};

export function useTrackSync(
  room: any,
  {
    onVideo,
    onAudio,
    onVideoRemove,
    onAudioRemove,
  }: TrackSyncConfig
) {
  useEffect(() => {
    if (!room) return;

    const handleSub = (track: any, pub: TrackPublication, p: RemoteParticipant) => {
      const id = p.identity?.toString?.() || "";

      if (track.kind === "video") {
        onVideo?.(id, track);
      }
      if (track.kind === "audio") {
        onAudio?.(id, track);
      }
    };

    const handleUnsub = (pub: TrackPublication, p: RemoteParticipant) => {
      const id = p.identity?.toString?.() || "";

      if (pub.kind === "video") {
        onVideoRemove?.(id);
      }
      if (pub.kind === "audio") {
        onAudioRemove?.(id);
      }
    };

    room.on("trackSubscribed", handleSub);
    room.on("trackUnsubscribed", handleUnsub);

    return () => {
      room.off("trackSubscribed", handleSub);
      room.off("trackUnsubscribed", handleUnsub);
    };
  }, [room]);
}
