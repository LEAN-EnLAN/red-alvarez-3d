// Teclado + mouse (pointer lock) + táctil (joystick virtual izquierdo, arrastre derecho para mirar, tap para seleccionar)
export const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

export class Input {
  constructor(canvas, hudRoot) {
    this.canvas = canvas;
    this.keys = new Set();
    this.move = { x: 0, y: 0 }; // joystick / WASD normalizado
    this.look = { dx: 0, dy: 0 };
    this.enabled = true;
    this.listeners = {};
    this.locked = false;

    addEventListener('keydown', (e) => {
      if (!this.enabled || e.target.closest?.('input,textarea,[contenteditable]')) return;
      this.keys.add(e.code);
      this.fire('key', e);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // Mouse
    // Mirar: con el puntero capturado (pointer lock) o, mientras no esté capturado, arrastrando.
    // Un intento fallido de captura (p. ej. Chrome bloquea ~1 s después de Esc) NO desactiva la captura:
    // el próximo clic vuelve a intentarlo.
    this.dragLook = !canvas.requestPointerLock;
    this.lastDragMoved = 0;
    document.addEventListener('pointerlockerror', () => this.fire('lockfail'));
    let drag = null;
    canvas.addEventListener('mousedown', (e) => {
      if (isTouch || !this.enabled || !this.wantsLock || this.locked || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
    });
    addEventListener('mouseup', () => { if (drag) this.lastDragMoved = drag.moved; drag = null; });
    addEventListener('mousemove', (e) => {
      if (!drag || !this.enabled || this.locked) return;
      this.look.dx += (e.clientX - drag.x) * 1.4; this.look.dy += (e.clientY - drag.y) * 1.4;
      drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
      drag.x = e.clientX; drag.y = e.clientY;
    });
    canvas.addEventListener('click', (e) => {
      if (isTouch || !this.enabled) return;
      if (this.wantsLock && !this.locked && this.lastDragMoved < 6) { this.lock(); return; }
      this.lastDragMoved = 0;
      this.fire('click', e);
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.fire('lock', this.locked);
    });
    addEventListener('mousemove', (e) => {
      if (this.locked && this.enabled) { this.look.dx += e.movementX; this.look.dy += e.movementY; }
    });

    if (isTouch) this.setupTouch(hudRoot);
  }
  // pide capturar el puntero (debe llamarse dentro de un gesto del usuario)
  lock() {
    if (isTouch || this.locked || !this.canvas.requestPointerLock || navigator.webdriver) return;
    try {
      const r = this.canvas.requestPointerLock({ unadjustedMovement: false });
      r?.catch?.(() => { try { this.canvas.requestPointerLock(); } catch {} });
    } catch { try { this.canvas.requestPointerLock(); } catch {} }
  }
  on(t, fn) { (this.listeners[t] ||= []).push(fn); }
  fire(t, a) { (this.listeners[t] || []).forEach((f) => f(a)); }

  setupTouch(root) {
    const stick = document.createElement('div');
    stick.className = 'joy';
    stick.innerHTML = '<div class="joy-knob"></div>';
    root.appendChild(stick);
    const knob = stick.firstChild;
    let joyId = null, joyO = null, lookId = null, lookLast = null, lookStart = null, lookT = 0;
    const R = 56;
    const el = this.canvas;
    el.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth * 0.42 && joyId === null) {
          joyId = t.identifier; joyO = { x: t.clientX, y: t.clientY };
          stick.style.left = t.clientX - 70 + 'px'; stick.style.top = t.clientY - 70 + 'px';
          stick.classList.add('on');
        } else if (lookId === null) {
          lookId = t.identifier; lookLast = { x: t.clientX, y: t.clientY }; lookStart = { ...lookLast }; lookT = performance.now();
        }
      }
      e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          let dx = t.clientX - joyO.x, dy = t.clientY - joyO.y;
          const l = Math.hypot(dx, dy);
          if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
          knob.style.transform = `translate(${dx}px, ${dy}px)`;
          this.move.x = dx / R; this.move.y = -dy / R;
        } else if (t.identifier === lookId) {
          this.look.dx += (t.clientX - lookLast.x) * 2.2;
          this.look.dy += (t.clientY - lookLast.y) * 2.2;
          lookLast = { x: t.clientX, y: t.clientY };
        }
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) { joyId = null; this.move.x = this.move.y = 0; knob.style.transform = ''; stick.classList.remove('on'); }
        if (t.identifier === lookId) {
          if (Math.hypot(t.clientX - lookStart.x, t.clientY - lookStart.y) < 10 && performance.now() - lookT < 300) this.fire('tap', { x: t.clientX, y: t.clientY });
          lookId = null;
        }
      }
    };
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
  }

  // vector de movimiento combinado (teclado + joystick)
  axis() {
    let x = this.move.x, y = this.move.y;
    if (this.enabled) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y, run: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') };
  }
  consumeLook() { const l = { ...this.look }; this.look.dx = this.look.dy = 0; return l; }
}
