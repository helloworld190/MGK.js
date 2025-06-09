// MiniGameKit.js
import { UIContainer, UIButton, UILabel, UIElement } from './UI.js';

export class Component {
  constructor() { }
  start(go) { }
  update(go, dt) { }
  render(ctx, go) { }
}

export class Transform extends Component {
  constructor({ x = 0, y = 0, rotation = 0, angle = 0, scale = 1 } = {}) {
    super();
    this.position = { x, y };
    this.rotation = rotation;
    this.angle = angle;
    this.scale = scale;
  }
}

import { EventEmitter } from "./EventEmitter.js";

export class GameObject {
  constructor(scene) {
    this.scene = scene;
    this.components = [];
    this.plugins = [];
    this.eventEmitter = new EventEmitter();
    this.startedComponents = new Set();
  }

  on(event, callback) {
    this.eventEmitter.on(event, callback);
    return this;
  }

  off(event, callback) {
    this.eventEmitter.off(event, callback);
    return this;
  }

  emit(event, ...args) {
    this.eventEmitter.emit(event, ...args);
    return this;
  }

  addComponent(comp) {
    this.components.push(comp);
    if (!this.startedComponents.has(comp) && comp.start) {
      comp.start(this);
      this.startedComponents.add(comp);
    }
    return this;
  }

  getComponent(type) {
    return this.components.find((c) => c instanceof type);
  }

  update(dt) {
    for (const c of this.components) if (c.update) c.update(this, dt);
    for (const p of this.plugins) if (p.update) p.update(this, dt);
  }

  render(ctx) {
    for (const c of this.components) if (c.render) c.render(ctx, this);
    for (const p of this.plugins) if (p.render) p.render(ctx, this);
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
    if (plugin.start) plugin.start(this);
    return this;
  }

  destroy() {
    if (this.scene) {
      const index = this.scene.objects.indexOf(this);
      if (index !== -1) this.scene.objects.splice(index, 1);
    }
    this.components.length = 0;
    this.plugins.length = 0;
  }
}

import { Input } from './Input.js';
export class Game {
  constructor({ width = window.innerWidth, height = window.innerHeight, parent = document.body } = {}) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.objects = [];
    this.plugins = [];
    this.lastTime = 0;
    this.running = false;
    this.boundaryEnabled = false;
    this.input = new Input(this.canvas);
    this.uiRoot = new UIContainer({ x: 0, y: 0, width: this.canvas.width, height: this.canvas.height });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.uiRoot.onPointerDown && this.uiRoot.onPointerDown(x, y, e);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.uiRoot.onPointerUp && this.uiRoot.onPointerUp(x, y, e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.uiRoot.onPointerMove && this.uiRoot.onPointerMove(x, y, e);
    });

  }

  enableBoundary(enable = true) {
    this.boundaryEnabled = enable;
  }

  update(dt) {
    
    for (const p of this.plugins) {
      if (p.update) p.update(this, dt);
    }

    
    this.objects.forEach(obj => {
      obj.update(dt);

      if (this.boundaryEnabled) {
        this.handleBoundary(obj);
      }
    });

    
  }


  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


    this.objects.forEach(obj => obj.render(this.ctx));


    for (const p of this.plugins) {
      if (p.render) p.render(this.ctx, this);
    }


    this.uiRoot.render(this.ctx);
  }


  handleBoundary(obj) {
    const t = obj.getComponent(Transform);
    const rb = obj.getComponent(RigidBody);
    const col = obj.getComponent(Collider);
    if (!t || !rb || !col) return;

    const radius = col.radius;

    if (t.position.x - radius < 0) {
      t.position.x = radius;
      rb.velocity.x = Math.abs(rb.velocity.x);
    } else if (t.position.x + radius > this.canvas.width) {
      t.position.x = this.canvas.width - radius;
      rb.velocity.x = -Math.abs(rb.velocity.x);
    }

    if (t.position.y - radius < 0) {
      t.position.y = radius;
      rb.velocity.y = Math.abs(rb.velocity.y);
    } else if (t.position.y + radius > this.canvas.height) {
      t.position.y = this.canvas.height - radius;
      rb.velocity.y = -Math.abs(rb.velocity.y);
    }
  }
}


export class RigidBody extends Component {
  constructor({
    velocity = { x: 0, y: 0 },
    angularVelocity = 0,
    gravity = 980,
    friction = 0.05,
    restitution = 0.7,
    mass = 1,
    buoyancy = 0,
  } = {}) {
    super();
    this.velocity = { ...velocity };
    this.angularVelocity = angularVelocity;
    this.gravity = gravity;
    this.friction = friction;
    this.restitution = restitution;
    this.mass = mass <= 0 ? 1 : mass;
    this.buoyancy = buoyancy;
  }

  update(go, dt) {
    const t = go.getComponent(Transform);
    if (!t) return;
    this.velocity.y += (this.gravity - this.buoyancy) * dt;
    this.velocity.x *= 1 - this.friction;
    this.velocity.y *= 1 - this.friction;
    t.position.x += this.velocity.x * dt;
    t.position.y += this.velocity.y * dt;
    t.angle += this.angularVelocity * dt;
  }
}


export class Collider extends Component {
  constructor({ radius = 10 } = {}) {
    super();
    this.radius = radius;
  }
}

export class CollisionSystem extends Plugin {
  start(scene) {
    this.scene = scene;
  }

  update(scene, dt) {
    const objs = scene.objects;
    for (let i = 0; i < objs.length; i++) {
      const a = objs[i];
      const aCollider = a.getComponent(Collider);
      if (!aCollider) continue;
      const aTransform = a.getComponent(Transform);
      const aRigid = a.getComponent(RigidBody);

      for (let j = i + 1; j < objs.length; j++) {
        const b = objs[j];
        const bCollider = b.getComponent(Collider);
        if (!bCollider) continue;
        const bTransform = b.getComponent(Transform);
        const bRigid = b.getComponent(RigidBody);

        const dx = bTransform.position.x - aTransform.position.x;
        const dy = bTransform.position.y - aTransform.position.y;
        const dist = Math.hypot(dx, dy);
        const minDist = aCollider.radius + bCollider.radius;
        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / dist || 0;
          const ny = dy / dist || 0;

          if (aRigid && bRigid) {
            const totalMass = aRigid.mass + bRigid.mass;
            const correctionA = (overlap * (bRigid.mass / totalMass));
            const correctionB = (overlap * (aRigid.mass / totalMass));

            aTransform.position.x -= nx * correctionA;
            aTransform.position.y -= ny * correctionA;
            bTransform.position.x += nx * correctionB;
            bTransform.position.y += ny * correctionB;

            const relVelX = bRigid.velocity.x - aRigid.velocity.x;
            const relVelY = bRigid.velocity.y - aRigid.velocity.y;

            const velAlongNormal = relVelX * nx + relVelY * ny;
            if (velAlongNormal > 0) continue;

            const e = Math.min(aRigid.restitution, bRigid.restitution);
            const j = -(1 + e) * velAlongNormal / (1 / aRigid.mass + 1 / bRigid.mass);

            const impulseX = j * nx;
            const impulseY = j * ny;

            aRigid.velocity.x -= impulseX / aRigid.mass;
            aRigid.velocity.y -= impulseY / aRigid.mass;
            bRigid.velocity.x += impulseX / bRigid.mass;
            bRigid.velocity.y += impulseY / bRigid.mass;
          }
        }
      }
    }
  }
}


export class Circle extends Component {
  constructor({ radius = 20, fill = "cyan" } = {}) {
    super();
    this.radius = radius;
    this.fill = fill;
  }

  render(ctx, go) {
    const t = go.getComponent(Transform);
    if (!t) return;
    ctx.save();
    ctx.translate(t.position.x, t.position.y);
    ctx.rotate(t.angle);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.fill;
    ctx.shadowColor = "rgba(0,255,255,0.6)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }
}

export class SpriteRenderer extends Component {
  constructor({
    url,
    frameWidth = null,
    frameHeight = null,
    frameCount = 1,
    frameSpeed = 10,
    loop = true,
    scale = 1,
  } = {}) {
    super();
    this.url = url;
    this.image = new Image();
    this.image.src = url;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.frameSpeed = frameSpeed;
    this.loop = loop;
    this.scale = scale;
    this.currentFrame = 0;
    this.accumulator = 0;
    this.loaded = false;
    this.image.onload = () => {
      this.loaded = true;
      if (!this.frameWidth) this.frameWidth = this.image.width;
      if (!this.frameHeight) this.frameHeight = this.image.height;
    };
  }

  update(go, dt) {
    if (this.frameCount > 1 && this.loaded) {
      this.accumulator += dt;
      const frameDuration = 1 / this.frameSpeed;
      while (this.accumulator >= frameDuration) {
        this.accumulator -= frameDuration;
        this.currentFrame++;
        if (this.currentFrame >= this.frameCount) {
          if (this.loop) this.currentFrame = 0;
          else this.currentFrame = this.frameCount - 1;
        }
      }
    }
  }

  render(ctx, go) {
    if (!this.loaded) return;
    const t = go.getComponent(Transform);
    if (!t) return;
    ctx.save();
    ctx.translate(t.position.x, t.position.y);
    ctx.rotate(t.angle);
    const sx = this.currentFrame * this.frameWidth;
    const sy = 0;
    const sw = this.frameWidth;
    const sh = this.frameHeight;
    const dw = sw * this.scale;
    const dh = sh * this.scale;
    ctx.drawImage(this.image, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
}

export class Plugin {
  constructor() { }
  start(target) { }
  update(target, dt) { }
  render(ctx, target) { }
}

export function createPlugin({ start, update, render }) {
  return class extends Plugin {
    constructor() {
      super();
      if (start) this.start = start;
      if (update) this.update = update;
      if (render) this.render = render;
    }
  };
}
