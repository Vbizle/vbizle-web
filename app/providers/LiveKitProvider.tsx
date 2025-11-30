"use client";

import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";

export default function LiveKitProvider({
  token,
  url,
  children,
}: {
  token: string;
  url: string;
  children: React.ReactNode;
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect={true}
      audio={true}
      video={true}
    >
      {children}
    </LiveKitRoom>
  );
}
