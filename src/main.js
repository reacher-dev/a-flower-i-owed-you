import "./styles.css";
import { SceneManager } from "./SceneManager.js";
import { MessageManager } from "./MessageManager.js";
import { MusicManager } from "./MusicManager.js";

const canvas = document.querySelector("#garden-canvas");
const primaryAction = document.querySelector("#primary-action");
const replayAction = document.querySelector("#replay-action");
const music = new MusicManager({
  audio: document.querySelector("#background-music"),
  toggle: document.querySelector("#music-toggle")
});

const messages = new MessageManager({
  title: document.querySelector("#story-title"),
  copy: document.querySelector("#story-copy"),
  action: primaryAction,
  finalCard: document.querySelector("#final-card"),
  keepsakes: document.querySelector("#memory-keepsakes"),
  replayAction,
  messageLayer: document.querySelector("#message-layer")
});

const sceneManager = new SceneManager({ canvas, messages });

primaryAction.addEventListener("click", () => {
  music.start();
  sceneManager.plantFirstFlower();
});
replayAction.addEventListener("click", () => sceneManager.reset());

sceneManager.start();
