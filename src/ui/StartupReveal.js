// Keep the first paint blank, including while modules and the WebGL scene load.
// Advance after rendered frames with failsafe protection against screen lockup.
export class StartupReveal {
  constructor() {
    this.overlay = document.getElementById('startup-white');
    this.elapsed = 0;
    this.hasRendered = false;

    // Failsafe timer: Ensure startup overlay is always dismissed even if frames hitch
    setTimeout(() => {
      this.dismiss();
    }, 3500);
  }

  dismiss() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    document.body.classList.remove('startup-revealing');
  }

  update(dt) {
    if (!this.overlay) return;
    if (this.hasRendered) {
      this.elapsed += dt;
      // Guarantee overlay never intercepts clicks or touch gestures once rendering begins
      if (this.overlay.style.pointerEvents !== 'none') {
        this.overlay.style.pointerEvents = 'none';
      }
    }
    this.hasRendered = true;
    const progress = Math.min(1, Math.max(0, (this.elapsed - 0.2) / 1.4));
    const eased = progress * progress * (3 - 2 * progress);
    this.overlay.style.opacity = String(1 - eased);
    if (progress >= 0.999) {
      this.dismiss();
    }
  }
}
