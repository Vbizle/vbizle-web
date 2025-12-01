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
    <div className="h-full overflow-y-auto p-3 space-y-2">

      {messages.map((m) => {
        if (m.type === "join") {
          return (
            <div key={m.id} className="flex items-center gap-2 opacity-70">
              <img src={m.photo} className="w-6 h-6 rounded-full" />
              <span className="text-[13px] text-white/80">
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
            className="flex items-start gap-2 cursor-pointer hover:bg-white/10 p-2 rounded"
          >
            <img src={m.photo} className="w-8 h-8 rounded-full" />

            <div>
              {/* Kullanıcı adı */}
              <div className="text-[13px] text-white/70">{m.name}</div>

              {/* Mesaj */}
              <div className="text-[13px] text-white break-words">
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
