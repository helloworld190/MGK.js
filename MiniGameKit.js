


export class Component {
  constructor() {}
  start(go) {}
  update(go, dt) {}
  render(ctx, go) {}
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


export class GameObject {
  constructor(scene) {
    this.scene = scene;
    this.components = [];
    this.plugins = [];
  }

  addComponent(comp) {
    this.components.push(comp);
    if (comp.start) comp.start(this);
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
}


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
  }

  createObject() {
    const go = new GameObject(this);
    go.addComponent(new Transform());
    this.objects.push(go);
    return go;
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
    if (plugin.start) plugin.start(this);
    return this;
  }

  start() {
    this.running = true;
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(t = 0) {
    const dt = (t - this.lastTime) / 1000 || 0;
    this.lastTime = t;

    this.update(dt);
    this.render();

    if (this.running) requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    for (const p of this.plugins) if (p.update) p.update(this, dt);
    this.objects.forEach((obj) => obj.update(dt));
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.plugins) if (p.render) p.render(this.ctx, this);
    this.objects.forEach((obj) => obj.render(this.ctx));
  }
}


export class RigidBody extends Component {
  constructor({
    velocity = { x: 0, y: 0 },
    angularVelocity = 0,
    gravity = 900,
    friction = 0.1,
    restitution = 0.7,
    buoyancy = 0,
  } = {}) {
    super();
    this.velocity = velocity;
    this.angularVelocity = angularVelocity;
    this.gravity = gravity;
    this.friction = friction;
    this.restitution = restitution;
    this.buoyancy = buoyancy;
  }

  update(go, dt) {
    const t = go.getComponent(Transform);
    if (!t) return;

    
    this.velocity.y += (this.gravity - this.buoyancy) * dt;

    
    t.position.x += this.velocity.x * dt;
    t.position.y += this.velocity.y * dt;
    t.angle += this.angularVelocity * dt;

    
    this.velocity.x *= 1 - this.friction;
    this.velocity.y *= 1 - this.friction;
    this.angularVelocity *= 1 - this.friction;
  }
}


export class Collider extends Component {
  constructor({ radius }) {
    super();
    this.radius = radius;
  }

  update(go, dt) {
    const t = go.getComponent(Transform);
    const rb = go.getComponent(RigidBody);
    const canvas = go.scene.canvas;
    if (!t || !rb) return;

    
    if (t.position.y + this.radius > canvas.height) {
      t.position.y = canvas.height - this.radius;
      rb.velocity.y *= -rb.restitution;
      if (Math.abs(rb.velocity.y) < 10) rb.velocity.y = 0;
    }
    
    if (t.position.y - this.radius < 0) {
      t.position.y = this.radius;
      rb.velocity.y *= -rb.restitution;
    }
    
    if (t.position.x - this.radius < 0) {
      t.position.x = this.radius;
      rb.velocity.x *= -rb.restitution;
    }
    
    if (t.position.x + this.radius > canvas.width) {
      t.position.x = canvas.width - this.radius;
      rb.velocity.x *= -rb.restitution;
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

    ctx.drawImage(this.image, sx, sy, sw, sh, -dw/2, -dh/2, dw, dh);
    ctx.restore();
  }
}
export class Plugin {
  constructor() {}
  start(target) {}
  update(target, dt) {}
  render(ctx, target) {}
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
