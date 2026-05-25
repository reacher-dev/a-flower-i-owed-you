export class MusicManager {
  constructor({ audio, toggle }) {
    this.audio = audio;
    this.toggle = toggle;
    this.started = false;
    this.audio.volume = 0;
    this.audio.loop = true;
    this.targetVolume = 0.34;
    this.fadeFrame = null;

    this.toggle.addEventListener("click", () => this.togglePlayback());
    this.updateButton();
  }

  async start() {
    if (this.started) return;
    this.started = true;
    this.toggle.classList.add("visible");
    this.toggle.hidden = false;

    try {
      await this.audio.play();
      this.fadeTo(this.targetVolume, 1600);
    } catch {
      this.started = false;
      this.toggle.classList.add("visible");
      this.toggle.hidden = false;
    }
    this.updateButton();
  }

  togglePlayback() {
    if (this.audio.paused) {
      this.started = false;
      this.start();
      return;
    }

    this.fadeTo(0, 450, () => {
      this.audio.pause();
      this.updateButton();
    });
    this.updateButton(true);
  }

  fadeTo(volume, duration, onDone) {
    if (this.fadeFrame) cancelAnimationFrame(this.fadeFrame);
    const startVolume = this.audio.volume;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startTime) / duration));
      const nextVolume = startVolume + (volume - startVolume) * easeOutCubic(progress);
      this.audio.volume = Math.min(1, Math.max(0, nextVolume));
      if (progress < 1) {
        this.fadeFrame = requestAnimationFrame(step);
      } else {
        this.fadeFrame = null;
        onDone?.();
      }
    };

    this.fadeFrame = requestAnimationFrame(step);
  }

  updateButton(pendingPause = false) {
    const playing = !this.audio.paused && !pendingPause;
    this.toggle.textContent = playing ? "Music on" : "Music off";
    this.toggle.setAttribute("aria-pressed", String(playing));
  }
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
