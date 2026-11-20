// Sonido 100 % sintetizado con WebAudio (sin archivos): pasos, puertas, UI, paquetes,
// teléfono, ambiente de oficina y zumbido posicional de los racks.
// Uso:
//   const sfx = new Audio(); addEventListener('pointerdown', () => sfx.unlock(), { once: true });
//   sfx.addHum(new THREE.Vector3(14, 1.2, 10));   // R1
//   en el loop: sfx.setListener(camera)
//   sfx.footstep('tile' | 'wood'); sfx.door(true); sfx.ui('click'); sfx.packet(20); sfx.phoneRing(pos)
// Nota: la clase se llama Audio (pedido del contrato); también se exporta como GameAudio
// para no tapar window.Audio donde se importe.

const VLAN_NOTE = { 10: 880, 20: 659.3, 30: 784, 40: 523.3, 50: 987.8, 60: 587.3, 70: 740, fiber: 1046.5, wan: 440 };

export class Audio {
  constructor({ volume = 0.7 } = {}) {
    this.ctx = null;
    this.volume = volume;
    this.muted = false;
    this.hums = [];
    this._lastStep = 0;
    this._pending = [];
    document.addEventListener('visibilitychange', () => this._applyGain(document.hidden ? 0 : null));
  }

  get ready() { return !!this.ctx && this.ctx.state === 'running'; }

  // Llamar desde un gesto del usuario (click/tecla/toque). Idempotente.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      // compresor suave para que nada sature
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -18; this.comp.ratio.value = 3;
      this.master.connect(this.comp).connect(this.ctx.destination);
      this.noise = this._makeNoise(2);
      this._startAmbient();
      for (const fn of this._pending) fn();
      this._pending = [];
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); this._applyGain(); }
  setMuted(m) { this.muted = !!m; this._applyGain(); }
  _applyGain(force = null) {
    if (!this.ctx) return;
    const v = force ?? (this.muted ? 0 : this.volume);
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  // ── utilidades ──
  _makeNoise(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  _env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  _noiseBurst({ t, dur, type = 'bandpass', freq = 1000, q = 1, peak = 0.3, attack = 0.002, rate = 1, out = this.master, freqEnd }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = rate;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this.ctx.createGain();
    this._env(g, t, attack, peak, dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 1.5, attack + dur + 0.05);
  }
  _tone({ t, freq, dur, type = 'sine', peak = 0.2, attack = 0.005, out = this.master, freqEnd }) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this.ctx.createGain();
    this._env(g, t, attack, peak, dur);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + attack + dur + 0.05);
  }
  _ok() { return this.ctx && this.ctx.state === 'running' && !this.muted; }

  // ── pasos ── (llamar una vez por pisada; se limita a 1 cada 120 ms)
  footstep(floor = 'tile', intensity = 1) {
    if (!this._ok()) return;
    const now = this.ctx.currentTime;
    if (now - this._lastStep < 0.12) return;
    this._lastStep = now;
    const r = 0.85 + Math.random() * 0.3, k = Math.max(0.2, Math.min(1.3, intensity));
    if (floor === 'wood') {
      this._noiseBurst({ t: now, dur: 0.11, type: 'lowpass', freq: 700 * r, q: 0.8, peak: 0.22 * k, rate: r });
      this._tone({ t: now, freq: 95 * r, freqEnd: 60, dur: 0.09, peak: 0.12 * k });
    } else if (floor === 'carpet') {
      this._noiseBurst({ t: now, dur: 0.08, type: 'lowpass', freq: 380 * r, q: 0.5, peak: 0.12 * k, rate: r });
    } else {
      // porcelanato: taco seco con brillo agudo
      this._noiseBurst({ t: now, dur: 0.05, type: 'bandpass', freq: 2600 * r, q: 1.6, peak: 0.16 * k, rate: r });
      this._noiseBurst({ t: now, dur: 0.07, type: 'lowpass', freq: 500 * r, q: 0.7, peak: 0.14 * k });
    }
  }

  // ── puertas ──
  door(open = true) {
    if (!this._ok()) return;
    const t = this.ctx.currentTime;
    this._noiseBurst({ t, dur: 0.45, type: 'bandpass', freq: open ? 350 : 1100, freqEnd: open ? 1200 : 300, q: 0.9, peak: 0.09, attack: 0.08 });
    const tc = open ? t : t + 0.38;
    this._noiseBurst({ t: tc, dur: 0.025, type: 'highpass', freq: 3000, q: 0.7, peak: 0.22 });
    this._tone({ t: tc, freq: 180, freqEnd: 90, dur: 0.06, peak: 0.1, type: 'triangle' });
  }

  // ── UI ──
  ui(kind = 'click') {
    if (!this._ok()) return;
    const t = this.ctx.currentTime;
    if (kind === 'hover') this._tone({ t, freq: 2400, dur: 0.018, peak: 0.025 });
    else if (kind === 'open') { this._tone({ t, freq: 520, freqEnd: 780, dur: 0.12, peak: 0.07 }); }
    else if (kind === 'close') { this._tone({ t, freq: 700, freqEnd: 460, dur: 0.1, peak: 0.06 }); }
    else this._tone({ t, freq: 1500, dur: 0.03, peak: 0.06, type: 'triangle' });
  }
  confirm() {
    if (!this._ok()) return;
    const t = this.ctx.currentTime;
    this._tone({ t, freq: 659.3, dur: 0.14, peak: 0.12, type: 'triangle' });
    this._tone({ t: t + 0.09, freq: 987.8, dur: 0.22, peak: 0.12, type: 'triangle' });
  }
  success() { // misión completada: arpegio corto
    if (!this._ok()) return;
    const t = this.ctx.currentTime;
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => this._tone({ t: t + i * 0.08, freq: f, dur: 0.3, peak: 0.11, type: 'triangle' }));
  }
  error() {
    if (!this._ok()) return;
    const t = this.ctx.currentTime;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(this.master);
    this._tone({ t, freq: 220, dur: 0.1, peak: 0.08, type: 'square', out: lp });
    this._tone({ t: t + 0.14, freq: 175, dur: 0.16, peak: 0.08, type: 'square', out: lp });
  }

  // ── paquetes del simulador ── (tono por VLAN; ok=false baja medio tono y suena opaco)
  packet(vlan = 20, ok = true) {
    if (!this._ok()) return;
    const t = this.ctx.currentTime;
    const f = VLAN_NOTE[vlan] ?? 700;
    if (ok) this._tone({ t, freq: f, freqEnd: f * 1.5, dur: 0.07, peak: 0.05 });
    else this._tone({ t, freq: f * 0.94, freqEnd: f * 0.6, dur: 0.12, peak: 0.05, type: 'triangle' });
  }

  // ── teléfono IP (doble timbre) ── devuelve stop(). pos opcional para sonar posicional.
  phoneRing(pos = null, cycles = 3) {
    if (!this.ctx) { this._pending.push(() => this.phoneRing(pos, cycles)); return () => {}; }
    const out = pos ? this._panner(pos, 1.2) : this.master;
    const t0 = this.ctx.currentTime + 0.02;
    const nodes = [];
    for (let c = 0; c < cycles; c++) {
      for (const off of [0, 0.5]) {
        const t = t0 + c * 3 + off;
        for (const fr of [1250, 1650]) {
          const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr;
          const trem = this.ctx.createOscillator(); trem.frequency.value = 18;
          const tg = this.ctx.createGain(); tg.gain.value = 0.5;
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02);
          g.gain.setValueAtTime(0.05, t + 0.38); g.gain.linearRampToValueAtTime(0.0001, t + 0.42);
          trem.connect(tg).connect(g.gain);
          o.connect(g).connect(out);
          o.start(t); trem.start(t); o.stop(t + 0.45); trem.stop(t + 0.45);
          nodes.push(o, trem);
        }
      }
    }
    return () => nodes.forEach((n) => { try { n.stop(); } catch {} });
  }

  // ── ambiente: tono de sala (HVAC) muy bajo ──
  _startAmbient() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise; src.loop = true;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.4;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 40;
    const g = this.ctx.createGain(); g.gain.value = 0.035;
    // vaivén lento para que no suene a ruido plano
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = this.ctx.createGain(); lg.gain.value = 0.01;
    lfo.connect(lg).connect(g.gain);
    src.connect(lp).connect(hp).connect(g).connect(this.master);
    src.start(); lfo.start();
    this.ambient = g;
  }
  setAmbient(level = 1) { if (this.ambient) this.ambient.gain.setTargetAtTime(0.035 * level, this.ctx.currentTime, 0.3); }

  // ── zumbido posicional de rack / switch ── pos: THREE.Vector3 (o {x,y,z}). Devuelve handle.
  addHum(pos, { level = 1 } = {}) {
    const h = { pos, level, nodes: null, setLevel: (v) => { h.level = v; if (h.nodes) h.nodes.g.gain.setTargetAtTime(0.06 * v, this.ctx.currentTime, 0.2); }, stop: () => { h.nodes?.srcs.forEach((s) => s.stop()); this.hums = this.hums.filter((x) => x !== h); } };
    this.hums.push(h);
    const build = () => {
      const p = this._panner(pos, 0.9, 1.6);
      const g = this.ctx.createGain(); g.gain.value = 0.06 * h.level;
      const fan = this.ctx.createBufferSource(); fan.buffer = this.noise; fan.loop = true;
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.8;
      const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 100;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      const og = this.ctx.createGain(); og.gain.value = 0.25;
      fan.connect(bp).connect(g); o1.connect(lp).connect(og).connect(g);
      g.connect(p);
      fan.start(); o1.start();
      h.nodes = { g, p, srcs: [fan, o1] };
    };
    if (this.ctx) build(); else this._pending.push(build);
    return h;
  }
  _panner(pos, ref = 1, rolloff = 1.4) {
    const p = this.ctx.createPanner();
    p.panningModel = 'equalpower'; // barato en CPU
    p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = rolloff; p.maxDistance = 20;
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; }
    else p.setPosition(pos.x, pos.y, pos.z);
    p.connect(this.master);
    return p;
  }

  // ── oyente = cámara (llamar por cuadro) ──
  setListener(camera) {
    if (!this.ctx) return;
    const L = this.ctx.listener, e = camera.matrixWorld.elements;
    const x = e[12], y = e[13], z = e[14], fx = -e[8], fy = -e[9], fz = -e[10], ux = e[4], uy = e[5], uz = e[6];
    if (L.positionX) {
      const t = this.ctx.currentTime;
      L.positionX.setTargetAtTime(x, t, 0.03); L.positionY.setTargetAtTime(y, t, 0.03); L.positionZ.setTargetAtTime(z, t, 0.03);
      L.forwardX.setTargetAtTime(fx, t, 0.03); L.forwardY.setTargetAtTime(fy, t, 0.03); L.forwardZ.setTargetAtTime(fz, t, 0.03);
      L.upX.setTargetAtTime(ux, t, 0.03); L.upY.setTargetAtTime(uy, t, 0.03); L.upZ.setTargetAtTime(uz, t, 0.03);
    } else {
      L.setPosition(x, y, z);
      L.setOrientation(fx, fy, fz, ux, uy, uz);
    }
  }
}

export { Audio as GameAudio };
