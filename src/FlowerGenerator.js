import * as THREE from "three";

const FLOWER_COLORS = [0xdc4f68, 0xff8fa8, 0xffc2d1, 0xf5eef2, 0xb978d9];
const STEM_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x4f9362,
  roughness: 0.78,
  metalness: 0.02
});
const LEAF_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x6faf76,
  roughness: 0.72
});
export class FlowerGenerator {
  constructor(scene) {
    this.scene = scene;
    this.flowers = [];
  }

  reset() {
    this.flowers.forEach((flower) => this.scene.remove(flower.group));
    this.flowers = [];
  }

  createSeed(position = new THREE.Vector3(0, 0.13, 0)) {
    const seed = new THREE.Group();
    const seedMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 18),
      new THREE.MeshStandardMaterial({
        color: 0xffd7b0,
        emissive: 0xff9f64,
        emissiveIntensity: 1.6,
        roughness: 0.36
      })
    );
    seed.add(seedMesh);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 28, 18),
      new THREE.MeshBasicMaterial({
        color: 0xff9f8d,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    seed.add(halo);

    const glow = new THREE.PointLight(0xffb38c, 2.2, 5);
    glow.position.set(0, 0.32, 0);
    seed.add(glow);

    const groundGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.86, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffb38c,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = -0.1;
    seed.add(groundGlow);
    seed.position.copy(position);
    this.scene.add(seed);
    return seed;
  }

  createFlower(position, options = {}) {
    const scale = options.scale ?? THREE.MathUtils.randFloat(0.82, 1.28);
    const color = options.color ?? FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    const bloomDelay = options.bloomDelay ?? 0;
    const flower = {
      group: new THREE.Group(),
      stem: null,
      petals: [],
      bud: null,
      bloom: 0,
      bloomSpeed: options.bloomSpeed ?? THREE.MathUtils.randFloat(0.34, 0.52),
      bloomDelay,
      scale,
      baseHeight: THREE.MathUtils.randFloat(0.95, 1.68) * scale,
      swaySeed: Math.random() * 100,
      targetOpen: 1,
      hoverOpen: 0,
      head: new THREE.Group()
    };

    flower.group.position.copy(position);
    flower.group.rotation.y = options.rotation ?? Math.random() * Math.PI * 2;
    flower.group.scale.setScalar(scale);

    const stemGeometry = new THREE.CylinderGeometry(0.035, 0.055, 1, 8);
    flower.stem = new THREE.Mesh(stemGeometry, STEM_MATERIAL);
    flower.stem.position.y = 0.5;
    flower.stem.scale.y = 0.001;
    flower.group.add(flower.stem);

    const leafGeometry = new THREE.SphereGeometry(0.12, 12, 8);
    const leftLeaf = new THREE.Mesh(leafGeometry, LEAF_MATERIAL);
    leftLeaf.scale.set(1.55, 0.22, 0.54);
    leftLeaf.position.set(-0.12, 0.42, 0.03);
    leftLeaf.rotation.set(0.18, 0.1, 0.7);
    flower.group.add(leftLeaf);

    const rightLeaf = leftLeaf.clone();
    rightLeaf.position.x = 0.14;
    rightLeaf.rotation.z = -0.72;
    flower.group.add(rightLeaf);

    flower.head.position.y = flower.baseHeight;
    flower.head.scale.setScalar(0.001);
    flower.group.add(flower.head);

    this.createRoseHead(flower, color, options.petalCount);

    this.scene.add(flower.group);
    this.flowers.push(flower);
    return flower;
  }

  createRoseHead(flower, color, requestedPetalCount) {
    const baseColor = new THREE.Color(color);
    const petalGeometry = new THREE.SphereGeometry(0.15, 28, 16);
    const layers = [
      { count: 5, radius: 0.07, y: 0.03, size: [0.46, 0.16, 0.9], curl: 0.96, tilt: 0.18 },
      { count: 8, radius: 0.17, y: 0, size: [0.62, 0.13, 1.18], curl: 1.2, tilt: 0.34 },
      { count: requestedPetalCount ?? 10, radius: 0.3, y: -0.04, size: [0.82, 0.115, 1.45], curl: 1.42, tilt: 0.55 }
    ];

    layers.forEach((layer, layerIndex) => {
      const layerColor = baseColor.clone().lerp(new THREE.Color(0xffffff), layerIndex * 0.08);
      const petalMaterial = new THREE.MeshStandardMaterial({
        color: layerColor,
        roughness: 0.68,
        metalness: 0,
        emissive: baseColor.clone().multiplyScalar(0.07),
        emissiveIntensity: 0.22,
        side: THREE.DoubleSide
      });

      for (let i = 0; i < layer.count; i += 1) {
        const angle = (i / layer.count) * Math.PI * 2 + layerIndex * 0.42 + THREE.MathUtils.randFloat(-0.08, 0.08);
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.scale.set(...layer.size);
        petal.userData.angle = angle;
        petal.userData.radius = layer.radius;
        petal.userData.y = layer.y;
        petal.userData.curl = layer.curl;
        petal.userData.tilt = layer.tilt;
        petal.userData.layer = layerIndex;
        petal.userData.phase = Math.random() * Math.PI * 2;
        flower.head.add(petal);
        flower.petals.push(petal);
      }
    });

    const budMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().lerp(new THREE.Color(0x6f1e38), 0.28),
      roughness: 0.55,
      metalness: 0,
      emissive: baseColor.clone().multiplyScalar(0.18),
      emissiveIntensity: 0.22
    });
    flower.bud = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), budMaterial);
    flower.bud.scale.set(0.78, 1.08, 0.78);
    flower.bud.position.y = 0.04;
    flower.head.add(flower.bud);
  }

  update(delta, elapsed, mouseGround) {
    this.flowers.forEach((flower) => {
      if (flower.bloomDelay > 0) {
        flower.bloomDelay -= delta;
        return;
      }

      flower.bloom = Math.min(1, flower.bloom + delta * flower.bloomSpeed);
      const eased = easeOutQuint(flower.bloom);
      flower.stem.scale.y = Math.max(0.001, eased * flower.baseHeight);
      flower.stem.position.y = flower.stem.scale.y / 2;
      flower.head.position.y = flower.baseHeight * eased;

      const distance = mouseGround ? flower.group.position.distanceTo(mouseGround) : 99;
      flower.hoverOpen = THREE.MathUtils.lerp(flower.hoverOpen, distance < 1.45 ? 0.42 : 0, 0.07);
      const open = eased * (0.74 + flower.hoverOpen);
      flower.head.scale.setScalar(Math.max(0.001, eased));

      if (mouseGround && flower.bloom > 0.45) {
        const dx = mouseGround.x - flower.group.position.x;
        const dz = mouseGround.z - flower.group.position.z;
        flower.head.rotation.y = THREE.MathUtils.lerp(flower.head.rotation.y, Math.atan2(dx, dz) * 0.14, 0.05);
      }

      flower.group.rotation.z = Math.sin(elapsed * 0.72 + flower.swaySeed) * 0.03 * eased;

      flower.petals.forEach((petal) => {
        const angle = petal.userData.angle;
        const radius = petal.userData.radius * (0.58 + open * 0.86);
        petal.position.set(Math.cos(angle) * radius, petal.userData.y - open * 0.03, Math.sin(angle) * radius);
        petal.rotation.set(
          petal.userData.tilt + open * petal.userData.curl,
          -angle + Math.PI / 2,
          Math.sin(elapsed * 0.8 + angle + petal.userData.phase) * 0.045 + (petal.userData.layer - 1) * 0.1
        );
      });

      if (flower.bud) {
        flower.bud.scale.setScalar(0.72 + eased * 0.28);
      }
    });
  }
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeOutQuint(value) {
  return 1 - Math.pow(1 - value, 5);
}
