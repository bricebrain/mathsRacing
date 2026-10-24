import { AUDIO_SAMPLES, type AudioPhase, type SampleName } from "./samples";
interface Playback {
  source: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode;
}
/** Les buffers sont décodés une seule fois ; chaque canal remplace sa lecture précédente. */
export class SampleAudio {
  private buffers = new Map<SampleName, AudioBuffer>();
  private playing = new Map<string, Playback>();
  private phase: AudioPhase = "lobby";
  private audible = true;
  private disposed = false;
  private revision = 0;
  private controller = new AbortController();
  private loading: Promise<void>;
  constructor(
    private context: AudioContext,
    private output: AudioNode,
  ) {
    this.loading = Promise.allSettled(
      (Object.keys(AUDIO_SAMPLES) as SampleName[]).map(async (name) => {
        const response = await fetch(AUDIO_SAMPLES[name].url, {
          signal: this.controller.signal,
        });
        if (!response.ok) throw new Error(`Audio indisponible : ${name}`);
        const buffer = await context.decodeAudioData(
          await response.arrayBuffer(),
        );
        if (!this.disposed) {
          this.buffers.set(name, buffer);
          this.syncLoops();
        }
      }),
    ).then(() => {
      if (!this.disposed) this.syncLoops();
    });
  }
  setPhase(phase: AudioPhase, playStart = true) {
    if (this.phase === phase) return;
    this.phase = phase;
    this.revision++;
    this.stopAll();
    this.syncLoops();
    if (phase === "racing" && this.audible && playStart) {
      const revision = this.revision,
        requestedAt = performance.now();
      if (this.buffers.has("carstart")) this.play("start", "carstart", false);
      else
        void this.loading.then(() => {
          if (
            revision === this.revision &&
            performance.now() - requestedAt < 700
          )
            this.play("start", "carstart", false);
        });
    }
  }
  setAudible(audible: boolean) {
    if (this.audible === audible) return;
    this.audible = audible;
    if (!audible) {
      this.revision++;
      this.stopAll();
    } else this.syncLoops();
  }
  private syncLoops() {
    if (this.disposed || !this.audible) return;
    if (this.phase === "lobby") this.play("menu", "intro", true);
    if (this.phase === "racing") this.play("ambience", "bruitdefond", true);
    if (this.phase === "countdown") {
      this.play("idle0", "engine1", true, -0.35);
      this.play("idle1", "engine2", true, 0.35);
    }
  }
  boost(player: number): boolean {
    if (this.phase !== "racing" || !this.audible || this.disposed) return false;
    const name = player ? "nitro2" : "nitro";
    if (!this.buffers.has(name)) return false;
    this.stop(`boost${player}`);
    return this.play(`boost${player}`, name, false, player ? 0.35 : -0.35);
  }
  private play(
    channel: string,
    name: SampleName,
    loop: boolean,
    pan = 0,
  ): boolean {
    const buffer = this.buffers.get(name);
    if (!buffer || this.disposed || !this.audible || this.playing.has(channel))
      return false;
    const now = this.context.currentTime;
    const source = this.context.createBufferSource(),
      gain = this.context.createGain(),
      panner = this.context.createStereoPanner();
    source.buffer = buffer;
    source.loop = loop;
    panner.pan.value = pan;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(AUDIO_SAMPLES[name].volume, now + 0.045);
    if (!loop && buffer.duration > 0.15) {
      gain.gain.setValueAtTime(
        AUDIO_SAMPLES[name].volume,
        now + buffer.duration - 0.07,
      );
      gain.gain.linearRampToValueAtTime(0, now + buffer.duration);
    }
    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.output);
    const playback = { source, gain, pan: panner };
    this.playing.set(channel, playback);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      panner.disconnect();
      if (this.playing.get(channel) === playback) this.playing.delete(channel);
    };
    source.start();
    return true;
  }
  private stop(channel: string) {
    const playback = this.playing.get(channel);
    if (!playback) return;
    this.playing.delete(channel);
    const now = this.context.currentTime;
    playback.gain.gain.cancelScheduledValues(now);
    playback.gain.gain.setValueAtTime(playback.gain.gain.value, now);
    playback.gain.gain.linearRampToValueAtTime(0, now + 0.045);
    playback.source.stop(now + 0.05);
  }
  private stopAll() {
    for (const channel of this.playing.keys()) this.stop(channel);
  }
  destroy() {
    this.disposed = true;
    this.revision++;
    this.controller.abort();
    this.stopAll();
  }
}
