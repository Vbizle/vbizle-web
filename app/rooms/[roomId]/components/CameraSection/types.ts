export interface SlotTrackState {
  localVideoTrack: any | null;
  localAudioTrack: any | null;

  remoteHostVideo: any | null;
  remoteGuestVideo: any | null;

  audio1Track: any | null;
  audio2Track: any | null;
}

export interface LivekitConnection {
  lkRoom: any | null;
}
