import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { AtmosphereSystem } from "./AtmosphereSystem.js";
import { FlowerGenerator } from "./FlowerGenerator.js";
import { PetalSystem } from "./PetalSystem.js";
import { InteractionManager } from "./InteractionManager.js";

const NIGHT_TOP = new THREE.Color(0x0a102a);
const NIGHT_HORIZON = new THREE.Color(0x321547);
const DAWN_TOP = new THREE.Color(0x39275b);
const DAWN_HORIZON = new THREE.Color(0xffb56d);

export class SceneManager {
  constructor({ canvas, messages }) {
    this.canvas = canvas;
    this.messages = messages;
    this.scenePhase = "seed";
    this.flowerCount = 0;
    this.dawnProgress = 0;
    this.dawnStartTime = 0;
    this.finalShown = false;
    this.mouseGround = new THREE.Vector3(0, 0, 0);
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = NIGHT_TOP;
    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 4.1, 7.4);
    this.camera.lookAt(0, 0.7, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.42,
      0.64,
      0.82
    );
    this.composer.addPass(this.bloomPass);

    this.flowerGenerator = new FlowerGenerator(this.scene);
    this.petals = new PetalSystem(this.scene, window.innerWidth < 700 ? 52 : 92);
    this.createWorld();
    this.createStars();
    this.atmosphere = new AtmosphereSystem(this.scene);

    this.interactions = new InteractionManager({
      canvas,
      camera: this.camera,
      ground: this.ground,
      onGroundClick: (point) => this.handleGroundClick(point),
      onMouseGroundMove: (point) => {
        this.mouseGround.copy(point);
      },
      onMouseMove: (pointer) => this.petals.setMouse(pointer)
    });

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }

  createWorld() {
    this.ambient = new THREE.HemisphereLight(0xbdd7ff, 0x1b1425, 1.18);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xffcada, 1.9);
    this.keyLight.position.set(-4, 6, 4.5);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.PointLight(0xc8a2ff, 1.7, 10);
    this.fillLight.position.set(3.2, 2.4, 2.2);
    this.scene.add(this.fillLight);

    this.seedLight = new THREE.PointLight(0xffb197, 2.3, 8);
    this.seedLight.position.set(0, 0.7, 0);
    this.scene.add(this.seedLight);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x151a2d,
      roughness: 0.96,
      metalness: 0.02
    });
    this.ground = new THREE.Mesh(new THREE.CircleGeometry(8.5, 80), groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 5.8, 90),
      new THREE.MeshBasicMaterial({ color: 0x6e3f84, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.011;
    this.scene.add(ring);

    const vignette = new THREE.Mesh(
      new THREE.CircleGeometry(8.4, 96),
      new THREE.MeshBasicMaterial({
        color: 0x8d5fa0,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    vignette.rotation.x = -Math.PI / 2;
    vignette.position.y = 0.014;
    this.scene.add(vignette);

    this.seed = this.flowerGenerator.createSeed();
  }

  createStars() {
    this.starGroup = new THREE.Group();
    this.scene.add(this.starGroup);
    this.starTargets = makeStarTargets(132);

    const geometry = new THREE.SphereGeometry(0.025, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.22 });
    this.stars = this.starTargets.map((target) => {
      const star = new THREE.Mesh(geometry, material.clone());
      star.userData.start = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(11),
        THREE.MathUtils.randFloat(3.2, 6.5),
        THREE.MathUtils.randFloat(-5.5, -2.2)
      );
      star.userData.target = target;
      star.position.copy(star.userData.start);
      this.starGroup.add(star);
      return star;
    });
  }

  start() {
    this.messages.setOpening();
    this.animate();
  }

  plantFirstFlower() {
    if (this.scenePhase !== "seed") return;
    this.scenePhase = "firstBloom";
    this.messages.setFirstBloom();
    this.scene.remove(this.seed);
    this.flowerGenerator.createFlower(new THREE.Vector3(0, 0, 0), {
      scale: 1.18,
      color: 0xffa8c3,
      bloomSpeed: 0.28,
      petalCount: 11
    });
    this.flowerCount = 1;

    window.setTimeout(() => {
      this.scenePhase = "garden";
      this.messages.setGardenInstruction();
    }, 3300);
  }

  handleGroundClick(point) {
    if (this.scenePhase === "seed") {
      this.plantFirstFlower();
      return;
    }

    if (!["garden", "dawn", "final"].includes(this.scenePhase)) return;
    if (point.length() > 6.1) return;

    this.flowerGenerator.createFlower(point, {
      scale: THREE.MathUtils.randFloat(0.72, 1.18),
      bloomSpeed: THREE.MathUtils.randFloat(0.34, 0.54)
    });
    this.atmosphere.addRipple(point);
    this.flowerCount += 1;
    this.messages.showFlowerMessage(this.toScreen(point.clone().add(new THREE.Vector3(0, 1.4, 0))));

    if (this.flowerCount >= 12 && this.scenePhase !== "dawn" && this.scenePhase !== "final") {
      this.scenePhase = "dawn";
      this.dawnStartTime = performance.now();
      this.messages.setDawnMessage();
    }
  }

  toScreen(position) {
    const projected = position.project(this.camera);
    return {
      x: (projected.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projected.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  reset() {
    this.flowerGenerator.reset();
    if (this.seed) this.scene.remove(this.seed);
    this.seed = this.flowerGenerator.createSeed();
    this.scenePhase = "seed";
    this.flowerCount = 0;
    this.dawnProgress = 0;
    this.dawnStartTime = 0;
    this.finalShown = false;
    this.messages.showStory();
    this.messages.setOpening();
  }

  updateDawn(delta) {
    const active = this.scenePhase === "dawn" || this.scenePhase === "final";
    if (active) {
      const elapsedDawn = this.dawnStartTime ? (performance.now() - this.dawnStartTime) / 6500 : 0;
      this.dawnProgress = Math.max(this.dawnProgress, THREE.MathUtils.clamp(elapsedDawn, 0, 1));
    } else {
      this.dawnProgress = THREE.MathUtils.clamp(this.dawnProgress - delta * 0.1, 0, 1);
    }
    const top = NIGHT_TOP.clone().lerp(DAWN_TOP, this.dawnProgress);
    const horizon = NIGHT_HORIZON.clone().lerp(DAWN_HORIZON, this.dawnProgress);
    this.scene.background = top;
    this.ambient.intensity = 1.35 + this.dawnProgress * 0.8;
    this.keyLight.intensity = 1.9 + this.dawnProgress * 0.8;
    this.keyLight.color.set(0xffcada).lerp(new THREE.Color(0xffc778), this.dawnProgress);
    this.fillLight.color.set(0xc8a2ff).lerp(new THREE.Color(0xffa36e), this.dawnProgress);
    this.fillLight.intensity = 1.7 + this.dawnProgress * 0.7;
    this.seedLight.intensity = 1.5 * (1 - this.dawnProgress);
    this.ground.material.color.set(0x151a2d).lerp(new THREE.Color(0x30283c), this.dawnProgress);
    this.bloomPass.strength = 0.42 + this.dawnProgress * 0.12;

    this.stars.forEach((star, index) => {
      const target = star.userData.target;
      star.position.lerpVectors(star.userData.start, target, easeInOutCubic(this.dawnProgress));
      star.material.opacity = 0.22 + this.dawnProgress * 0.72;
      star.scale.setScalar(1 + Math.sin(this.clock.elapsedTime * 2 + index) * 0.16);
    });

    if (this.dawnProgress > 0.92 && !this.finalShown) {
      this.finalShown = true;
      this.scenePhase = "final";
      window.setTimeout(() => {
        this.messages.hideStory();
        this.messages.showFinalCard();
      }, 900);
    }

    // A sky plane gives the dawn a warm horizon without using external assets.
    if (!this.skyPlane) {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, "#241943");
      gradient.addColorStop(1, "#ffb56d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2, 256);
      const texture = new THREE.CanvasTexture(canvas);
      this.skyPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 14),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false })
      );
      this.skyPlane.position.set(0, 5.5, -8);
      this.scene.add(this.skyPlane);
    }
    this.skyPlane.material.opacity = this.dawnProgress * 0.46;
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.033);
    const elapsed = this.clock.elapsedTime;

    if (this.seed) {
      const pulse = 1 + Math.sin(elapsed * 2.4) * 0.08;
      this.seed.scale.setScalar(pulse);
      this.seed.rotation.y += delta * 0.5;
    }

    this.flowerGenerator.update(delta, elapsed, this.mouseGround);
    this.petals.update(delta, elapsed);
    this.updateDawn(delta);
    this.atmosphere.update(delta, elapsed, this.dawnProgress);

    this.camera.position.x = Math.sin(elapsed * 0.12) * 0.2;
    this.camera.position.y = 4.08 + Math.sin(elapsed * 0.18) * 0.06;
    this.camera.lookAt(Math.sin(elapsed * 0.09) * 0.08, 0.78, 0);
    this.composer.render();
    this.animationFrame = window.requestAnimationFrame(() => this.animate());
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.position.z = window.innerWidth < 720 ? 8.7 : 7.4;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}

function makeStarTargets(count) {
  const targets = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i / count) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    targets.push(new THREE.Vector3(x * 0.065, y * 0.065 + 3.25, -4.8));
  }

  const digits = make520Targets();
  digits.forEach((point) => targets.push(point));
  return targets.slice(0, count);
}

function make520Targets() {
  const points = [];
  const glyphs = [
    ["111", "100", "111", "001", "111"],
    ["111", "001", "111", "100", "111"],
    ["111", "101", "101", "101", "111"]
  ];
  glyphs.forEach((glyph, glyphIndex) => {
    glyph.forEach((row, y) => {
      row.split("").forEach((cell, x) => {
        if (cell === "1") {
          points.push(new THREE.Vector3(glyphIndex * 0.62 + x * 0.16 - 0.82, 5.35 - y * 0.16, -4.72));
        }
      });
    });
  });
  return points;
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
