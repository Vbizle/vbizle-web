export async function getLiveKitToken(roomId: string, userName: string) {
  const endpoint = process.env.NEXT_PUBLIC_LIVEKIT_TOKEN_ENDPOINT;

  const res = await fetch(`${endpoint}?room=${roomId}&username=${userName}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Token alınamadı");
  }

  const data = await res.json();
  return data.token;
}
