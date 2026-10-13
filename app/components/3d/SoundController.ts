// Web Audio API procedural synthesizer for the interactive 3D portfolio.
// Zero audio files: every sound is generated from oscillators + noise.

import { ZONES } from "./worldStore";

interface Drone {
  panner: PannerNode;
  gain: GainNode;
  oscs: OscillatorNode[];
}

class SoundController {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private isMuted = false;
  private volume = 0.8;
  private ambientEnabled = true;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineStarted = false;
  private drones: Drone[] = [];
  private noiseBuffer: AudioBuffer | null = null;
  private listenerFrame = 0;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;

  public init() {
    if (typeof window === "undefined" || this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.isMuted ? 0 : this.volume;

      // Real-time audio analyser for reactive visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 1;
      this.sfxBus.connect(this.master);

      this.ambientBus = this.ctx.createGain();
      this.ambientBus.gain.value = this.ambientEnabled ? 1 : 0;
      this.ambientBus.connect(this.master);
    } catch {
      console.warn("Web Audio API not supported");
    }
  }

  /** Returns normalized real-time audio energy [0..1] for 3D visual reactions */
  public getAudioEnergy(): number {
    if (!this.analyser || !this.freqData || this.isMuted) {
      return 0.05;
    }
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      sum += this.freqData[i];
    }
    const avg = sum / (this.freqData.length * 255);
    return Math.max(0.05, avg * 1.5);
  }

  /** Subtle UI haptic tick for buttons and navigation links */
  public playHapticTick() {
    this.tone(950, { type: "triangle", dur: 0.03, vol: 0.025, endFreq: 450, attack: 0.001 });
  }

  private ensureContext(): boolean {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return !!this.ctx && !!this.sfxBus;
  }

  /** Call from a user gesture (keydown / pointerdown) to unlock audio. */
  public unlock() {
    if (!this.ensureContext()) return;
    this.startAmbient();
  }

  /* ------------------------------ settings ------------------------------- */

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(m: boolean) {
    this.isMuted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx && !this.isMuted) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setAmbient(enabled: boolean) {
    this.ambientEnabled = enabled;
    if (enabled) this.startAmbient();
    if (this.ambientBus && this.ctx) {
      this.ambientBus.gain.setTargetAtTime(enabled ? 1 : 0, this.ctx.currentTime, 0.3);
    }
  }

  public getAmbient(): boolean {
    return this.ambientEnabled;
  }

  /* ---------------------- Procedural BGM Arpeggiator ---------------------- */
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmStep = 0;
  private bgmEnabled = false;

  public toggleBgm(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  public getBgm(): boolean {
    return this.bgmEnabled;
  }

  private startBgm() {
    if (this.bgmInterval) return;
    if (!this.ensureContext()) return;
    const notes = [110, 130.81, 146.83, 164.81, 196.0, 220.0, 196.0, 164.81];
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || !this.bgmEnabled || this.isMuted) return;
      const freq = notes[this.bgmStep % notes.length];
      this.tone(freq, {
        type: "triangle",
        dur: 0.24,
        vol: 0.032,
        attack: 0.02,
      });
      this.bgmStep++;
    }, 280);
  }

  private stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  /* ------------------------- spatial ambient drones ---------------------- */

  /**
   * Each biome emits a soft detuned chord through an HRTF PannerNode placed at
   * the biome's centre. The AudioListener follows the rover so the soundscape
   * pans and swells as you drive between zones.
   */
  private startAmbient() {
    if (!this.ctx || !this.ambientBus || this.drones.length > 0 || !this.ambientEnabled) return;
    const ctx = this.ctx;
    try {
      // 1. Global Observatory Ambient Warm Synth Pad (always audible)
      const globalGain = ctx.createGain();
      globalGain.gain.setValueAtTime(0, ctx.currentTime);
      globalGain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.5);

      const globalFilter = ctx.createBiquadFilter();
      globalFilter.type = "lowpass";
      globalFilter.frequency.value = 1100;

      // Warm A-minor / D-minor ambient drone triad
      [110, 164.81, 220, 329.63].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        o.type = idx % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = freq;
        o.detune.value = (idx - 1.5) * 5;
        const g = ctx.createGain();
        g.gain.value = idx === 0 ? 0.4 : 0.2;
        o.connect(g);
        g.connect(globalFilter);
        o.start();
      });

      globalFilter.connect(globalGain);
      globalGain.connect(this.ambientBus);

      // 2. Spatial Biome Drones
      ZONES.forEach((zone) => {
        const panner = ctx.createPanner();
        panner.panningModel = "HRTF";
        panner.distanceModel = "linear";
        panner.refDistance = 15;
        panner.maxDistance = 120;
        panner.rolloffFactor = 0.5;
        this.setParam(panner.positionX, zone.center[0]);
        this.setParam(panner.positionY, 1);
        this.setParam(panner.positionZ, zone.center[1]);

        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(0.14, ctx.currentTime, 1.0);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1200;

        const ratios = [1, 1.498, 2.0035];
        const oscs = ratios.map((ratio, i) => {
          const o = ctx.createOscillator();
          o.type = i === 0 ? "sine" : "triangle";
          o.frequency.value = zone.drone * ratio;
          o.detune.value = (i - 1) * 7;
          const g = ctx.createGain();
          g.gain.value = i === 0 ? 0.5 : 0.25;
          o.connect(g);
          g.connect(filter);
          o.start();
          return o;
        });

        // Slow tremolo LFO for a "breathing" pad
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.1 + Math.random() * 0.1;
        lfoGain.gain.value = 0.03;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        oscs.push(lfo);

        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.ambientBus!);
        this.drones.push({ panner, gain, oscs });
      });
    } catch {
      // Ignore: fallback for background tab restrictions
    }
  }

  private setParam(param: AudioParam | undefined, value: number) {
    if (!this.ctx || !param) return;
    param.setTargetAtTime(value, this.ctx.currentTime, 0.05);
  }

  /** Move the audio listener with the rover (throttled). */
  public updateListener(x: number, z: number, heading: number) {
    if (!this.ctx || this.drones.length === 0) return;
    if (this.listenerFrame++ % 3 !== 0) return;
    const l = this.ctx.listener;
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    if (l.positionX) {
      this.setParam(l.positionX, x);
      this.setParam(l.positionY, 1.5);
      this.setParam(l.positionZ, z);
      this.setParam(l.forwardX, fx);
      this.setParam(l.forwardY, 0);
      this.setParam(l.forwardZ, fz);
      this.setParam(l.upX, 0);
      this.setParam(l.upY, 1);
      this.setParam(l.upZ, 0);
    } else {
      // Legacy Safari API
      const legacy = l as unknown as {
        setPosition: (x: number, y: number, z: number) => void;
        setOrientation: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
      };
      legacy.setPosition?.(x, 1.5, z);
      legacy.setOrientation?.(fx, 0, fz, 0, 1, 0);
    }
  }

  /* -------------------------------- engine ------------------------------- */

  public startEngine() {
    if (this.engineStarted) return;
    if (!this.ensureContext() || !this.ctx) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = "triangle";
      this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxBus!);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.engineStarted = true;
    } catch {
      // Audio context might require a user gesture
    }
  }

  public updateEnginePitch(speedRatio: number, isAccelerating: boolean, boosting = false) {
    if (!this.engineStarted) {
      if (speedRatio > 0.02 || isAccelerating) this.startEngine();
    }
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineGain || !this.engineFilter) return;

    const t = this.ctx.currentTime;
    const targetFreq = 45 + speedRatio * 140 + (isAccelerating ? 30 : 0) + (boosting ? 40 : 0);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(220 + speedRatio * 500 + (boosting ? 400 : 0), t, 0.1);

    const gainVal = isAccelerating ? 0.06 : speedRatio > 0.05 ? 0.04 : 0.012;
    this.engineGain.gain.setTargetAtTime(gainVal, t, 0.1);
  }

  /* ------------------------------ one-shots ------------------------------ */

  private createSpatialPanner(x: number, y: number, z: number, dirX = 0, dirZ = 0): PannerNode | null {
    if (!this.ctx || !this.sfxBus) return null;
    try {
      const panner = this.ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 6;
      panner.maxDistance = 90;
      panner.rolloffFactor = 1.2;
      this.setParam(panner.positionX, x);
      this.setParam(panner.positionY, y);
      this.setParam(panner.positionZ, z);
      if (dirX !== 0 || dirZ !== 0) {
        this.setParam(panner.orientationX, dirX);
        this.setParam(panner.orientationY, 0);
        this.setParam(panner.orientationZ, dirZ);
      }
      panner.connect(this.sfxBus);
      return panner;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    opts: {
      type?: OscillatorType;
      start?: number;
      dur?: number;
      vol?: number;
      endFreq?: number;
      attack?: number;
      panner?: PannerNode | null;
    } = {}
  ) {
    if (!this.ensureContext() || !this.ctx) return;
    const { type = "sine", start = 0, dur = 0.3, vol = 0.08, endFreq, attack = 0.01, panner } = opts;
    try {
      const now = this.ctx.currentTime + start;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      if (panner) {
        gain.connect(panner);
      } else {
        gain.connect(this.sfxBus!);
      }
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      /* noop */
    }
  }

  private noise(dur: number, vol: number, freq = 1200, panner?: PannerNode | null) {
    if (!this.ensureContext() || !this.ctx) return;
    try {
      if (!this.noiseBuffer) {
        const len = this.ctx.sampleRate * 0.5;
        this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      if (panner) {
        gain.connect(panner);
      } else {
        gain.connect(this.sfxBus!);
      }
      src.start(now);
      src.stop(now + dur);
    } catch {
      /* noop */
    }
  }

  public playCollisionSound(intensity = 1.0, pos?: { x: number; y: number; z: number }) {
    const panner = pos ? this.createSpatialPanner(pos.x, pos.y || 0.8, pos.z) : null;
    this.tone(120 * intensity, { type: "square", dur: 0.15, vol: Math.min(0.2, 0.08 * intensity), endFreq: 30, panner });
    this.noise(0.12, Math.min(0.15, 0.05 * intensity), 600, panner);
  }

  public playChimeSound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, { start: i * 0.06, dur: 0.35, vol: 0.06 }));
  }

  public playChime(freq = 523.25) {
    this.playNote(freq, 0.4);
  }

  /** Zone entry: a short rising arpeggio rooted on the zone's drone pitch. */
  public playZoneChime(root: number) {
    [1, 1.25, 1.5, 2].forEach((r, i) =>
      this.tone(root * 4 * r, { start: i * 0.07, dur: 0.5, vol: 0.045, type: "triangle" })
    );
  }

  /** Play a single musical note (used by the 3D bar graph). */
  public playNote(freq: number, dur = 0.6) {
    this.tone(freq, { type: "triangle", dur, vol: 0.06 });
    this.tone(freq * 2, { type: "sine", dur: dur * 0.6, vol: 0.02 });
  }

  public playChord(root: number) {
    [1, 1.26, 1.5].forEach((r, i) => this.tone(root * r, { type: "sine", start: i * 0.015, dur: 0.9, vol: 0.04 }));
  }

  public playJumpSound() {
    this.tone(150, { dur: 0.25, vol: 0.09, endFreq: 600 });
  }

  public playClickSound() {
    this.tone(800, { type: "triangle", dur: 0.05, vol: 0.04, endFreq: 400, attack: 0.002 });
  }

  public playFireSound(pos?: { x: number; y: number; z: number }, heading = 0) {
    const panner = pos
      ? this.createSpatialPanner(pos.x, pos.y || 0.8, pos.z, Math.sin(heading), Math.cos(heading))
      : null;
    this.tone(880, { type: "square", dur: 0.12, vol: 0.08, endFreq: 220, attack: 0.002, panner });
    this.noise(0.08, 0.07, 2400, panner);
  }

  public playHitSound(pos?: { x: number; y: number; z: number }) {
    const panner = pos ? this.createSpatialPanner(pos.x, pos.y || 2.0, pos.z) : null;
    [880, 1318.5, 1760].forEach((f, i) =>
      this.tone(f, { start: i * 0.04, dur: 0.25, vol: 0.08, type: "triangle", panner })
    );
    this.noise(0.2, 0.09, 3000, panner);
  }

  public playPadSound(on: boolean) {
    if (on) this.tone(220, { type: "sawtooth", dur: 0.5, vol: 0.05, endFreq: 880 });
    else this.tone(660, { type: "sawtooth", dur: 0.4, vol: 0.04, endFreq: 165 });
  }

  public playRebuildSound() {
    [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) =>
      this.tone(f, { start: i * 0.08, dur: 0.4, vol: 0.05, type: "triangle" })
    );
  }

  public playRingSound() {
    [659.25, 830.61, 987.77, 1318.5].forEach((f, i) => this.tone(f, { start: i * 0.05, dur: 0.6, vol: 0.06 }));
  }

  /** EMP Shockwave: deep sub-bass drop followed by electric burst */
  public playEmpSound(pos?: { x: number; y: number; z: number }) {
    const panner = pos ? this.createSpatialPanner(pos.x, pos.y || 0.8, pos.z) : null;
    this.tone(240, { type: "sawtooth", dur: 0.55, vol: 0.16, endFreq: 28, attack: 0.002, panner });
    this.tone(80, { type: "sine", dur: 0.8, vol: 0.22, endFreq: 18, attack: 0.005, panner });
    this.noise(0.45, 0.14, 1800, panner);
    setTimeout(() => {
      [587.33, 880, 1174.66].forEach((f, i) =>
        this.tone(f, { start: i * 0.04, dur: 0.22, vol: 0.07, type: "sine", panner })
      );
    }, 90);
  }

  /** High-tech LiDAR radar scan ping */
  public playLidarChirp(active: boolean) {
    if (active) {
      [987.77, 1318.51, 1975.53].forEach((f, i) =>
        this.tone(f, { start: i * 0.035, dur: 0.18, vol: 0.05, type: "triangle" })
      );
    } else {
      [1975.53, 1318.51, 987.77].forEach((f, i) =>
        this.tone(f, { start: i * 0.035, dur: 0.15, vol: 0.04, type: "triangle" })
      );
    }
  }
}

export const soundFx = new SoundController();
