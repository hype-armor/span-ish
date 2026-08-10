import { useCallback } from "../react.js";

/* Asks the browser for a Mexican voice, then any Latin American one, then any
   Spanish at all. Silently does nothing where speech synthesis is missing. */
export function useSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  return useCallback(
    (text) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-MX";
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang === "es-MX") ||
        voices.find((v) => v.lang === "es-US" || v.lang === "es-419") ||
        voices.find((v) => v.lang.startsWith("es"));
      if (voice) utterance.voice = voice;

      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );
}
