/**
 * Audio System
 * Manages sound effects and dynamic audio
 * Uses WebAudio API
 */
export class AudioSystem {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.buffers = new Map();
    this.sources = new Map(); // For looping sounds
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.initialized = false;
    this.muted = false;
  }

  async init() {
    // Resume context on user interaction if needed (usually handled by browser)
    if (this.ctx.state === 'suspended') {
      window.addEventListener('click', () => this.ctx.resume(), { once: true });
      window.addEventListener('keydown', () => this.ctx.resume(), { once: true });
    }

    // Load sound assets
    const sounds = {
      'engine': 'engine.mp3',
      'boost': 'boost.mp3',
      'jump': 'jump.mp3',
      'hit': 'hit.mp3',
      'goal': 'goal.mp3',
      'whistle': 'whistle.mp3'
    };

    const promises = Object.entries(sounds).map(async ([id, url]) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(id, audioBuffer);
      } catch (e) {
        console.warn(`Failed to load sound ${id}:`, e);
      }
    });

    await Promise.all(promises);
    this.initialized = true;
  }

  play(id, volume = 1.0, pitch = 1.0) {
    if (!this.initialized || this.muted) return;

    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    source.playbackRate.value = pitch;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0);
  }

  startLoop(id, volume = 1.0) {
    if (!this.initialized || this.muted || this.sources.has(id)) return;

    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(0);

    this.sources.set(id, { source, gain: gainNode });
  }

  stopLoop(id) {
    const loop = this.sources.get(id);
    if (loop) {
      // Fade out to avoid clicks
      loop.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        try { loop.source.stop(); } catch(e) {}
      }, 150);
      this.sources.delete(id);
    }
  }

  updateLoop(id, volume, pitch) {
    const loop = this.sources.get(id);
    if (loop) {
      if (volume !== undefined) loop.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
      if (pitch !== undefined) loop.source.playbackRate.setTargetAtTime(pitch, this.ctx.currentTime, 0.1);
    }
  }

  updateEngine(rpm, boosting) {
    // Start engine loop if not running
    if (!this.sources.has('engine')) {
      this.startLoop('engine', 0.1);
    }

    // Engine sound based on RPM (0.0 to 1.0)
    const basePitch = 0.8 + (rpm * 0.6);
    const baseVol = 0.2 + (rpm * 0.3);
    this.updateLoop('engine', baseVol, basePitch);

    // Boost sound
    if (boosting) {
      if (!this.sources.has('boost')) {
        this.startLoop('boost', 0.4);
      }
    } else {
      this.stopLoop('boost');
    }
  }

  stopAll() {
    for (const id of this.sources.keys()) {
      this.stopLoop(id);
    }
  }
}