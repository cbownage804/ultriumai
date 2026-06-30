/**
 * useRayVoice — minimal play/stop hook for Ray's spoken briefings.
 *
 * One button, one voice. Calls the `ray-tts` edge function which proxies
 * ElevenLabs and returns an MP3. Caches the last generated audio so toggling
 * play/pause within the same brief doesn't re-bill TTS.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State = "idle" | "loading" | "playing" | "error";

export function useRayVoice() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<{ key: string; url: string } | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState("idle");
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    if (state === "playing") { stop(); return; }
    setError(null);
    setState("loading");

    try {
      let url = cacheRef.current?.key === text ? cacheRef.current.url : null;
      if (!url) {
        const { data, error: fnError } = await supabase.functions.invoke("ray-tts", {
          body: { text },
        });
        if (fnError) throw fnError;
        const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
        url = URL.createObjectURL(blob);
        if (cacheRef.current?.url) URL.revokeObjectURL(cacheRef.current.url);
        cacheRef.current = { key: text, url };
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => { setState("error"); setError("Audio playback failed."); };
      await audio.play();
      setState("playing");
    } catch (e) {
      console.error("[useRayVoice] error", e);
      setError(e instanceof Error ? e.message : "Voice unavailable.");
      setState("error");
    }
  }, [state, stop]);

  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if (cacheRef.current?.url) URL.revokeObjectURL(cacheRef.current.url);
  }, []);

  return { state, error, speak, stop, isPlaying: state === "playing", isLoading: state === "loading" };
}
