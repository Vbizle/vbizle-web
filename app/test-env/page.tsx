"use client";

export default function TestEnvPage() {
  return (
    <div style={{ padding: 20, color: "white", fontSize: 22 }}>
      <h1>ENV TEST</h1>

      <p>
        <b>NEXT_PUBLIC_LIVEKIT_URL: </b>
        {process.env.NEXT_PUBLIC_LIVEKIT_URL || "❌ YOK (ENV OKUNMUYOR)"}
      </p>

      <p>
        <b>NEXT_PUBLIC_LK_TOKEN_URL: </b>
        {process.env.NEXT_PUBLIC_LK_TOKEN_URL || "❌ YOK (ENV OKUNMUYOR)"}
      </p>
    </div>
  );
}
