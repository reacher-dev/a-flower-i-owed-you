import * as THREE from "three";

export class AtmosphereSystem {
  constructor(scene) {
    this.scene = scene;
    this.ripples = [];
    this.fireflies = [];
    this.grassGroup = new THREE.Group();
    this.fireflyGroup = new THREE.Group();
    this.scene.add(this.grassGroup, this.fireflyGroup);
    this.createGrass();
    this.createFireflies();
  }

  createGrass() {
    const bladeGeometry = new THREE.ConeGeometry(0.014, 0.2, 4);
    const bladeMaterial = new THREE.MeshBasicMaterial({
      color: 0x496555,
      transparent: true,
      opacity: 0.26,
      depthWrite: false
    });

    const count = window.innerWidth < 720 ? 70 : 130;
    for (let i = 0; i < count; i += 1) {
      const radius = THREE.MathUtils.randFloat(1.2, 6.8);
      const angle = Math.random() * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(Math.cos(angle) * radius, 0.13, Math.sin(angle) * radius);
      blade.rotation.set(
        THREE.MathUtils.randFloat(-0.22, 0.22),
        Math.random() * Math.PI,
        THREE.MathUtils.randFloat(-0.34, 0.34)
      );
      blade.scale.setScalar(THREE.MathUtils.randFloat(0.62, 1.35));
      blade.userData.phase = Math.random() * Math.PI * 2;
      this.grassGroup.add(blade);
    }
  }

  createFireflies() {
    const geometry = new THREE.SphereGeometry(0.028, 10, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffe6a8,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const count = window.innerWidth < 720 ? 22 : 42;
    for (let i = 0; i < count; i += 1) {
      const firefly = new THREE.Mesh(geometry, material.clone());
      firefly.position.set(
        THREE.MathUtils.randFloatSpread(9),
        THREE.MathUtils.randFloat(0.7, 3.4),
        THREE.MathUtils.randFloat(-4.7, 2.2)
      );
      firefly.userData.phase = Math.random() * Math.PI * 2;
      firefly.userData.speed = THREE.MathUtils.randFloat(0.4, 0.9);
      firefly.userData.drift = new THREE.Vector3(
        THREE.MathUtils.randFloat(0.05, 0.16),
        THREE.MathUtils.randFloat(0.04, 0.12),
        THREE.MathUtils.randFloat(0.04, 0.13)
      );
      this.fireflyGroup.add(firefly);
      this.fireflies.push(firefly);
    }
  }

  addRipple(position) {
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.11, 72),
      new THREE.MeshBasicMaterial({
        color: 0xffc3d6,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(position.x, 0.022, position.z);
    ripple.userData.life = 0;
    this.scene.add(ripple);
    this.ripples.push(ripple);
  }

  update(delta, elapsed, dawnProgress) {
    this.grassGroup.children.forEach((blade) => {
      blade.rotation.z += Math.sin(elapsed * 0.7 + blade.userData.phase) * 0.0008;
      blade.material.color.set(0x496555).lerp(new THREE.Color(0x758064), dawnProgress * 0.55);
    });

    this.fireflies.forEach((firefly) => {
      const phase = elapsed * firefly.userData.speed + firefly.userData.phase;
      firefly.position.x += Math.sin(phase) * firefly.userData.drift.x * delta;
      firefly.position.y += Math.cos(phase * 0.8) * firefly.userData.drift.y * delta;
      firefly.position.z += Math.sin(phase * 0.6) * firefly.userData.drift.z * delta;
      firefly.material.opacity = (0.38 + Math.sin(phase * 2) * 0.18) * (1 - dawnProgress * 0.35);
      firefly.scale.setScalar(0.8 + Math.sin(phase * 2.4) * 0.28);
    });

    this.ripples = this.ripples.filter((ripple) => {
      ripple.userData.life += delta;
      const progress = ripple.userData.life / 1.35;
      ripple.scale.setScalar(1 + progress * 9);
      ripple.material.opacity = Math.max(0, 0.58 * (1 - progress));
      if (progress >= 1) {
        this.scene.remove(ripple);
        return false;
      }
      return true;
    });
  }
}
