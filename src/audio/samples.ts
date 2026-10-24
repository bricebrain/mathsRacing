import intro from "./intro.mp3";
import engine1 from "./engine1.mp3";
import engine2 from "./engine2.mp3";
import carstart from "./carstart.mp3";
import nitro from "./nitro.mp3";
import nitro2 from "./nitro2.mp3";
import bruitdefond from "./bruitdefond.mp3";
export const AUDIO_SAMPLES = {
  intro: { url: intro, volume: 0.48 },
  engine1: { url: engine1, volume: 0.3 },
  engine2: { url: engine2, volume: 0.24 },
  carstart: { url: carstart, volume: 0.5 },
  nitro: { url: nitro, volume: 0.5 },
  nitro2: { url: nitro2, volume: 0.28 },
  bruitdefond: { url: bruitdefond, volume: 0.32 },
} as const;
export type SampleName = keyof typeof AUDIO_SAMPLES;
export type AudioPhase = "lobby" | "countdown" | "racing" | "finished";
