import * as THREE from "three";

export class InteractionManager {
  constructor({ canvas, camera, ground, onGroundClick, onMouseGroundMove, onMouseMove }) {
    this.canvas = canvas;
    this.camera = camera;
    this.ground = ground;
    this.onGroundClick = onGroundClick;
    this.onMouseGroundMove = onMouseGroundMove;
    this.onMouseMove = onMouseMove;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", this.handlePointerDown);
  }

  destroy() {
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerdown", this.handlePointerDown);
  }

  handlePointerMove(event) {
    this.updatePointer(event);
    this.onMouseMove?.(this.pointer);
    const point = this.getGroundPoint();
    if (point) this.onMouseGroundMove?.(point);
  }

  handlePointerDown(event) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button")) return;

    this.updatePointer(event);
    const point = this.getGroundPoint();
    if (point) this.onGroundClick?.(point, event);
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  getGroundPoint() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.ground);
    return hits[0]?.point.clone() ?? null;
  }
}
