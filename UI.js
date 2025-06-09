export class UIElement {
  constructor({ x = 0, y = 0, width = 100, height = 30, visible = true } = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visible = visible;
    this.parent = null;
    this.children = [];
    this.hovered = false;
  }

  update(dt) {}

  render(ctx) {}

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  onMouseMove(px, py) {
    const wasHovered = this.hovered;
    this.hovered = this.containsPoint(px, py);
    if (this.hovered && !wasHovered) this.onHoverEnter();
    else if (!this.hovered && wasHovered) this.onHoverExit();
    for (const child of this.children) {
      child.onMouseMove(px - this.x, py - this.y);
    }
  }

  onHoverEnter() {}

  onHoverExit() {}

  onClick(px, py) {
    for (const child of this.children) {
      if (child.containsPoint(px - this.x, py - this.y)) {
        child.onClick(px - this.x, py - this.y);
        return true;
      }
    }
    return false;
  }

  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }
}

export class UIContainer extends UIElement {
  update(dt) {
    for (const child of this.children) {
      if (child.visible) child.update(dt);
    }
  }

  render(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    for (const child of this.children) {
      if (child.visible) child.render(ctx);
    }
    ctx.restore();
  }

  onMouseMove(px, py) {
    super.onMouseMove(px, py);
  }

  onClick(px, py) {
    return super.onClick(px, py);
  }
}

export class Button extends UIElement {
  constructor({ x, y, width, height, text = '', onClick = null, style = {} } = {}) {
    super({ x, y, width, height });
    this.text = text;
    this.onClickCallback = onClick;
    this.style = {
      bgColor: style.bgColor || '#222',
      hoverColor: style.hoverColor || '#555',
      textColor: style.textColor || '#fff',
      font: style.font || '16px sans-serif',
      borderRadius: style.borderRadius || 5,
    };
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.hovered ? this.style.hoverColor : this.style.bgColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const r = this.style.borderRadius;
    const w = this.width;
    const h = this.height;

    ctx.beginPath();
    ctx.moveTo(this.x + r, this.y);
    ctx.lineTo(this.x + w - r, this.y);
    ctx.quadraticCurveTo(this.x + w, this.y, this.x + w, this.y + r);
    ctx.lineTo(this.x + w, this.y + h - r);
    ctx.quadraticCurveTo(this.x + w, this.y + h, this.x + w - r, this.y + h);
    ctx.lineTo(this.x + r, this.y + h);
    ctx.quadraticCurveTo(this.x, this.y + h, this.x, this.y + h - r);
    ctx.lineTo(this.x, this.y + r);
    ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.style.textColor;
    ctx.font = this.style.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + w / 2, this.y + h / 2);
    ctx.restore();
  }

  onClick(px, py) {
    if (this.containsPoint(px, py)) {
      if (this.onClickCallback) this.onClickCallback();
      return true;
    }
    return false;
  }
}
