import * as THREE from "three";

export class PetalSystem {
  constructor(scene, count = 90) {
    this.scene = scene;
    this.count = count;
    this.mouse = new THREE.Vector2();
    this.petals = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.createPetals();
  }

  createPetals() {
    const geometry = new THREE.SphereGeometry(0.04, 14, 8);
    const colors = [0xffaac3, 0xffeef4, 0xe1c2ff, 0xffc9b6];

    for (let i = 0; i < this.count; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.74,
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.04,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(1.9, 0.1, 0.7);
      this.resetPetal(mesh, true);
      this.group.add(mesh);
      this.petals.push({
        mesh,
        speed: THREE.MathUtils.randFloat(0.08, 0.23),
        drift: THREE.MathUtils.randFloat(0.16, 0.42),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  resetPetal(mesh, randomY = false) {
    mesh.position.set(
      THREE.MathUtils.randFloatSpread(10),
      randomY ? THREE.MathUtils.randFloat(1.3, 5.8) : THREE.MathUtils.randFloat(4.8, 6.2),
      THREE.MathUtils.randFloat(-5.5, 3.6)
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  }

  setMouse(normalizedMouse) {
    this.mouse.copy(normalizedMouse);
  }

  update(delta, elapsed) {
    this.petals.forEach((petal) => {
      const { mesh } = petal;
      mesh.position.y -= petal.speed * delta;
      mesh.position.x += (Math.sin(elapsed * 0.72 + petal.phase) * petal.drift + this.mouse.x * 0.34) * delta;
      mesh.position.z += (Math.cos(elapsed * 0.54 + petal.phase) * petal.drift - this.mouse.y * 0.18) * delta;
      mesh.rotation.x += delta * (0.7 + petal.speed);
      mesh.rotation.y += delta * 0.45;

      if (mesh.position.y < 0.08 || Math.abs(mesh.position.x) > 6.2) {
        this.resetPetal(mesh);
      }
    });
  }
}
