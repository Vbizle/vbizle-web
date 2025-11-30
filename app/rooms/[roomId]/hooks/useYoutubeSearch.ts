"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

const YT_API_KEY = "AIzaSyBZlMpwLz7gTf5dkM8lN2wFdtxqwrQibmw";

export function useYoutubeSearch(roomId: string, user: any, room: any) {
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // YOUTUBE SEARCH
  async function searchYoutube() {
    if (user?.uid !== room?.ownerId) return;
    if (!ytQuery.trim()) return;

    setSearchLoading(true);

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${ytQuery}&key=${YT_API_KEY}`
    );
    const data = await res.json();

    setYtResults(data.items || []);
    setSearchLoading(false);
  }

  // OWNER SELECTS VIDEO
  async function selectVideo(videoId: string) {
    if (user?.uid !== room?.ownerId) return;

    await updateDoc(doc(db, "rooms", roomId), {
      youtube: videoId,
      videoTime: 0,
      playerState: 2,
      lastUpdate: serverTimestamp(),
    });

    // popup kapatma işlemi UI tarafında yapılacak
  }

  return {
    ytQuery,
    setYtQuery,
    ytResults,
    searchLoading,
    searchYoutube,
    selectVideo,
  };
}
