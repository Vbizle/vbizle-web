"use client";

import { useEffect, useRef, useState } from "react";
import { Room } from "livekit-client";

interface Props {
  roomId: string;
  currentUid: string;
}

export default function useLivekitRoom({ roomId, currentUid }: Props) {
  const [lkRoom, setLkRoom] = useState<Room | null>(null);

  // Duplicate connect engelleme
  const connectingRef = useRef(false);

  useEffect(() => {
    if (!currentUid) return;
    if (lkRoom) return;
    if (connectingRef.current) return;

    connectingRef.current = true;
    let closed = false;

    async function connect() {
      try {
        /* 1) Token al */
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${currentUid}`
        );

        if (!r.ok) {
          connectingRef.current = false;
          return;
        }

        const { token } = await r.json();

        /* 2) Room oluştur */
        const room = new Room({
          adaptiveStream: true,   // otomatik kalite
          dynacast: true,         // CPU tasarrufu
          publishDefaults: {
            simulcast: false,
          },
        });

        /* 3) Connect */
        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

        if (closed) return;

        setLkRoom(room);

        /* 4) Window kapanırsa → sessiz disconnect */
        window.addEventListener("beforeunload", () => {
          try {
            room.disconnect();
          } catch {}
        });

        /* 5) Route değişirse / sayfa kapanırsa → disconnect */
        window.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            try {
              room.disconnect();
            } catch {}
          }
        });

      } catch (err) {
        console.error("LiveKit Connect Error:", err);
        connectingRef.current = false;
      }
    }

    connect();

    return () => {
      closed = true;
    };
  }, [currentUid, roomId, lkRoom]);

  return { lkRoom };
}
