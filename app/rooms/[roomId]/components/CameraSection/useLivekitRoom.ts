"use client";

import { useEffect, useRef, useState } from "react";
import { Room } from "livekit-client";

interface Props {
  roomId: string;
  currentUid: string;
}

export default function useLivekitRoom({ roomId, currentUid }: Props) {
  const [lkRoom, setLkRoom] = useState<Room | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    if (!currentUid) return;
    if (lkRoom) return;
    if (connectingRef.current) return;

    connectingRef.current = true;

    let cancelled = false;

    async function connect() {
      try {
        // 🔥 TOKEN AL
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT}?room=${roomId}&identity=${currentUid}`
        );
        if (!r.ok) {
          connectingRef.current = false;
          return;
        }

        const { token } = await r.json();

        // 🔥 ROOM OLUŞTUR
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          reconnectPolicy: {
            // profesyonel reconnect
            maxRetries: 10,
            retryDelay: 1000,
          },
          publishDefaults: {
            simulcast: false,
          },
        });

        // 🔥 BAĞLAN
        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
        if (cancelled) return;

        // ID normalize
        room.on("participantConnected", (p) => {
          p.identity = p.identity?.toString() || "";
        });
        room.on("participantDisconnected", (p) => {
          p.identity = p.identity?.toString() || "";
        });

        // 🔥 OTOMATİK RECONNECT LOG
        room.on("reconnecting", () => {
          console.log("⚠ LiveKit reconnecting...");
        });
        room.on("reconnected", () => {
          console.log("✅ LiveKit reconnected successfully");
        });

        // 🔥 ARKA PLANDA OTOMATİK RESUME (disconnect DEĞİL)
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            try {
              room.resumeConnection?.();
            } catch {}
          }
        });

        setLkRoom(room);
      } catch (err) {
        console.error("LiveKit Connect Error:", err);
        connectingRef.current = false;
      }
    }

    connect();

    return () => {
      cancelled = true;
    };
  }, [currentUid, roomId, lkRoom]);

  return { lkRoom };
} 