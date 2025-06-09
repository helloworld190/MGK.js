export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, buttons: new Set() };
    this.touches = new Map();
    this.gamepads = [];
    this.tvKeys = new Set();
    this._keyListeners = [];
    this._mouseListeners = [];
    this._touchListeners = [];

    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key);
      this.tvKeys.add(e.key);
      this._keyListeners.forEach((fn) => fn(e));
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);
      this.tvKeys.delete(e.key);
    });

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener("mousedown", (e) => this.mouse.buttons.add(e.button));
    canvas.addEventListener("mouseup", (e) => this.mouse.buttons.delete(e.button));

    canvas.addEventListener("touchstart", (e) => {
      for (const t of e.changedTouches) this.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    });
    canvas.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) this.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    });
    canvas.addEventListener("touchend", (e) => {
      for (const t of e.changedTouches) this.touches.delete(t.identifier);
    });
    canvas.addEventListener("touchcancel", (e) => {
      for (const t of e.changedTouches) this.touches.delete(t.identifier);
    });

    window.addEventListener("gamepadconnected", (e) => {
      this.gamepads[e.gamepad.index] = e.gamepad;
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      delete this.gamepads[e.gamepad.index];
    });
  }

  isKeyDown(key) {
    return this.keys.has(key);
  }

  isMouseDown(button) {
    return this.mouse.buttons.has(button);
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  getTouches() {
    return Array.from(this.touches.values());
  }

  getGamepads() {
    const rawGamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.gamepads = [];
    for (const gp of rawGamepads) if (gp) this.gamepads[gp.index] = gp;
    return this.gamepads;
  }

  isGamepadButtonDown(gpIndex, buttonIndex) {
    const gp = this.getGamepads()[gpIndex];
    if (!gp || !gp.buttons[buttonIndex]) return false;
    return gp.buttons[buttonIndex].pressed;
  }

  getGamepadAxis(gpIndex, axisIndex) {
    const gp = this.getGamepads()[gpIndex];
    if (!gp || gp.axes.length <= axisIndex) return 0;
    return gp.axes[axisIndex];
  }

  isTVKeyDown(key) {
    return this.tvKeys.has(key);
  }

  onKey(fn) {
    this._keyListeners.push(fn);
  }

  onMouse(fn) {
    this._mouseListeners.push(fn);
  }

  onTouch(fn) {
    this._touchListeners.push(fn);
  }
}
