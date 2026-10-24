import { SampleAudio } from "./SampleAudio";
import type { AudioPhase } from "./samples";
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
/** Fichiers locaux et synthèse partagent un seul contexte et un seul volume général. */
export class RaceAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private enabled = true;
  private visible = true;
  private pending = new Set<AudioScheduledSourceNode>();
  private disposed = false;
  private samples?: SampleAudio;
  private phase: AudioPhase = "lobby";

  async unlock() {
    if (this.disposed) return false;
    try {
      if (!this.context) {
        const Constructor =
          window.AudioContext || (window as AudioWindow).webkitAudioContext;
        if (!Constructor) return false;
        const context = (this.context = new Constructor());
        this.master = context.createGain();
        this.master.gain.value = 0;
        this.master.connect(context.destination);
        this.noise = context.createBuffer(
          1,
          context.sampleRate,
          context.sampleRate,
        );
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.samples = new SampleAudio(context, this.master);
        this.samples.setAudible(this.enabled && this.visible);
        this.samples.setPhase(this.phase, false);
      }
      if (this.context.state !== "running") await this.context.resume();
      this.applyVolume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.applyVolume();
  }
  setVisible(visible: boolean) {
    this.visible = visible;
    this.applyVolume();
  }
  private applyVolume() {
    this.samples?.setAudible(this.enabled && this.visible);
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled && this.visible ? 0.24 : 0,
        this.context.currentTime,
        0.035,
      );
  }
  private track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    this.pending.add(source);
    source.onended = () => {
      this.pending.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
  }
  private tone(
    frequency: number,
    delay: number,
    duration: number,
    volume = 0.2,
    end = frequency,
  ) {
    if (!this.context || !this.enabled || !this.visible) return;
    const context = this.context,
      start = context.currentTime + delay;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master!);
    this.track(oscillator, [gain]);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  private whoosh(duration: number, volume: number, frequency: number) {
    if (!this.context || !this.noise || !this.enabled || !this.visible) return;
    const context = this.context,
      now = context.currentTime;
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = this.noise;
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(frequency, now);
    filter.frequency.exponentialRampToValueAtTime(
      frequency / 3,
      now + duration,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    this.track(source, [filter, gain]);
    source.start();
    source.stop(now + duration);
  }
  countdown(value: number) {
    this.tone(value === 0 ? 880 : 440, 0, value === 0 ? 0.4 : 0.15, 0.22);
  }
  setPhase(phase: AudioPhase) {
    this.phase = phase;
    this.samples?.setPhase(phase);
  }
  correct(player = 0) {
    if (!player) {
      this.tone(660, 0, 0.12, 0.15);
      this.tone(990, 0.09, 0.2, 0.12);
    }
    if (!this.samples?.boost(player) && !player) this.whoosh(0.55, 0.26, 2200);
  }
  wrong() {
    this.tone(175, 0, 0.15, 0.13, 125);
  }
  skip() {
    this.tone(390, 0, 0.12, 0.08, 300);
  }
  overtake() {
    this.whoosh(0.3, 0.14, 1600);
  }
  finish(won: boolean) {
    (won ? [523, 659, 784, 1047] : [440, 392, 330]).forEach((note, i) =>
      this.tone(note, i * 0.13, 0.35, 0.15),
    );
  }
  destroy() {
    this.disposed = true;
    this.samples?.destroy();
    for (const source of this.pending) {
      try {
        source.stop();
      } catch {
        /* Déjà terminé. */
      }
    }
    void this.context?.close().catch(() => {});
  }
}
