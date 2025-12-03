"use client";

export function setupTrackRouter({
  room,
  hostUid,
  guestUid,
  setRemoteHostVideo,
  setRemoteGuestVideo,
}) {
  if (!room) return () => {};

  function onTrackSubscribed(track, pub, participant) {
    const id = participant.identity?.toString() || "";

    // HOST'un videosu bağlanıyor
    if (id === hostUid && track.kind === "video") {
      console.log("📥 Host video subscribed");
      setRemoteHostVideo(track);
    }

    // MİSAFİR videosu bağlanıyor
    if (id === guestUid && track.kind === "video") {
      console.log("📥 Guest video subscribed");
      setRemoteGuestVideo(track);
    }
  }

  function onTrackUnsubscribed(pub, participant) {
    const id = participant.identity?.toString() || "";

    if (id === hostUid && pub.kind === "video") {
      setRemoteHostVideo(null);
    }

    if (id === guestUid && pub.kind === "video") {
      setRemoteGuestVideo(null);
    }
  }

  room.on("trackSubscribed", onTrackSubscribed);
  room.on("trackUnsubscribed", onTrackUnsubscribed);

  return () => {
    room.off("trackSubscribed", onTrackSubscribed);
    room.off("trackUnsubscribed", onTrackUnsubscribed);
  };
}
