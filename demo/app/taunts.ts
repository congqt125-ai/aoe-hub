const tauntUrls = import.meta.glob<string>("../../assets/sound/taunt*.wav", {
  eager: true,
  query: "?url",
  import: "default",
});

let currentTaunt: HTMLAudioElement | null = null;

/**
 * Extract AoE taunt number (1–50) from the start of a chat message,
 * e.g. "11", "14 bắt đầu!", "30 wololo".
 */
export function parseTauntNumber(text: string): number | null {
  const m = text.match(/^\s*(\d{1,2})(?=$|\s|[^\d])/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 50 ? n : null;
}

/** Play the AoE taunt sound matching the leading number (1–50) in `text`, if any. */
export function playTauntFromText(text: string): number | null {
  const num = parseTauntNumber(text);
  if (num === null) return null;
  const padded = String(num).padStart(3, "0");
  const url = tauntUrls[`../../assets/sound/taunt${padded}.wav`];
  if (!url) return null;

  if (currentTaunt) {
    currentTaunt.pause();
    currentTaunt.currentTime = 0;
  }
  const audio = new Audio(url);
  currentTaunt = audio;
  audio.play().catch(() => {
    // Ignore autoplay restrictions if triggered without a user gesture.
  });
  return num;
}

