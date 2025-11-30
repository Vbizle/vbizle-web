"use client";

import { useEffect, useRef } from "react";

export default function ChatSection({ messages, onUserClick }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endRef.current) {
      setTimeout(() => {
        endRef.current.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto px-2 py-2 space-y-2">

      {messages.map((m) => {
        if (m.type === "join") {
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 opacity-70 py-1"
            >
              <img src={m.photo} className="w-5 h-5 rounded-full" />
              <span className="text-xs text-white/80">
                <b>{m.name}</b> odaya katıldı
              </span>
            </div>
          );
        }

        return (
          <div
            key={m.id}
            onClick={() =>
              onUserClick({
                uid: m.uid,
                name: m.name,
                photo: m.photo,
              })
            }
            className="
              flex items-start gap-2 cursor-pointer
              hover:bg-white/10 p-2 rounded
            "
          >
            <img src={m.photo} className="w-7 h-7 rounded-full" />

            <div className="leading-tight">
              <div className="text-xs text-white/70">{m.name}</div>
              <div className="text-sm text-white break-words">
                {m.text}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={endRef} />
    </div>
  );
}
