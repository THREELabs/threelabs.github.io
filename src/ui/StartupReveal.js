// Keep the first paint blank, including while modules and the WebGL scene load.
// Advance only after rendered frames, not on a timeout that can expire during loading.
export class StartupReveal {
  constructor() {
    this.overlay = document.getElementById('startup-white');
    this.elapsed = 0;
    this.hasRendered = false;
  }

  update(dt) {
    if (!this.overlay) return;
    if (this.hasRendered) this.elapsed += dt;
    this.hasRendered = true;
    const progress = Math.min(1, Math.max(0, (this.elapsed - 0.2) / 1.6));
    const eased = progress * progress * (3 - 2 * progress);
    this.overlay.style.opacity = String(1 - eased);
    if (progress === 1) {
      this.overlay.remove();
      this.overlay = null;
      document.body.classList.remove('startup-revealing');
    }
  }
}
