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
        console.log("🔵 LiveKit TOKEN URL:", process.env.NEXT_PUBLIC_LK_TOKEN_URL);
        console.log("🔵 room:", roomId, "identity:", currentUid);

        // 🔥 TOKEN AL — DÜZELTİLMİŞ
        const tokenRes = await fetch(
          `${process.env.NEXT_PUBLIC_LK_TOKEN_URL}?room=${roomId}&identity=${currentUid}`
        );

        if (!tokenRes.ok) {
          console.error("❌ Token endpoint hata:", await tokenRes.text());
          connectingRef.current = false;
          return;
        }

        const { token } = await tokenRes.json();

        // 🔥 ROOM OLUŞTUR
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          reconnectPolicy: {
            maxRetries: 10,
            retryDelay: 1000,
          },
          publishDefaults: {
            simulcast: false,
          },
        });

        // 🔥 BAĞLAN — DÜZELTİLMİŞ
        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

        if (cancelled) return;

        room.on("participantConnected", (p) => {
          p.identity = p.identity?.toString() || "";
        });
        room.on("participantDisconnected", (p) => {
          p.identity = p.identity?.toString() || "";
        });

        room.on("reconnecting", () => {
          console.log("⚠ LiveKit reconnecting...");
        });

        room.on("reconnected", () => {
          console.log("✅ LiveKit reconnected");
        });

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
      } finally {
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
