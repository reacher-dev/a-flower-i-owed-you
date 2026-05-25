const LOVE_NOTES = [
  "For your smile.",
  "For the day I missed.",
  "For every next 5/20.",
  "For the way you make ordinary days softer.",
  "For you."
];

export class MessageManager {
  constructor({ title, copy, action, finalCard, keepsakes, replayAction, messageLayer }) {
    this.title = title;
    this.copy = copy;
    this.action = action;
    this.finalCard = finalCard;
    this.keepsakes = keepsakes;
    this.replayAction = replayAction;
    this.messageLayer = messageLayer;
  }

  setOpening() {
    this.title.closest(".story-ui").classList.remove("compact", "final-story", "hidden");
    this.title.textContent = "I missed the flower on 5/20.";
    this.copy.textContent = "";
    this.action.hidden = false;
    this.action.textContent = "Plant it anyway";
    this.finalCard.classList.remove("visible");
    this.finalCard.setAttribute("aria-hidden", "true");
    this.keepsakes?.classList.remove("visible");
    this.keepsakes?.setAttribute("aria-hidden", "true");
  }

  setFirstBloom() {
    this.title.closest(".story-ui").classList.add("compact");
    this.title.closest(".story-ui").classList.remove("final-story");
    this.title.textContent = "So I made one bloom for you, in my own way.";
    this.copy.textContent = "";
    this.action.hidden = true;
  }

  setGardenInstruction() {
    this.title.closest(".story-ui").classList.add("compact");
    this.title.closest(".story-ui").classList.remove("final-story");
    this.title.textContent = "Click anywhere to grow the garden.";
    this.copy.textContent = "";
  }

  setDawnMessage() {
    this.title.closest(".story-ui").classList.add("compact", "final-story");
    this.title.textContent = "Maybe this flower is late, but my heart wasn’t absent.";
    this.copy.textContent = "";
  }

  hideStory() {
    this.title.closest(".story-ui").classList.add("hidden");
  }

  showStory() {
    this.title.closest(".story-ui").classList.remove("hidden");
  }

  showFinalCard() {
    this.finalCard.classList.add("visible");
    this.finalCard.setAttribute("aria-hidden", "false");
    this.keepsakes?.classList.add("visible");
    this.keepsakes?.setAttribute("aria-hidden", "false");
  }

  showFlowerMessage(screenPosition) {
    const note = LOVE_NOTES[Math.floor(Math.random() * LOVE_NOTES.length)];
    const message = document.createElement("div");
    message.className = "floating-message";
    message.textContent = note;
    message.style.setProperty("--x", `${screenPosition.x}px`);
    message.style.setProperty("--y", `${screenPosition.y}px`);
    this.messageLayer.appendChild(message);
    window.setTimeout(() => message.remove(), 2900);
  }
}
