import * as THREE from 'three';

export interface Camera3DConfig {
  minHeight: number;
  maxHeight: number;
  fov: number;
  near: number;
  far: number;
  panSpeed: number;
  edgeScrollMargin: number;
}

export const DEFAULT_CAMERA_CONFIG: Camera3DConfig = {
  minHeight: 20,
  maxHeight: 65,
  fov: 48,
  near: 0.5,
  far: 500,
  panSpeed: 1.4,
  edgeScrollMargin: 25
};

export class RTSCamera3D {
  public camera: THREE.PerspectiveCamera;
  public target: THREE.Vector3 = new THREE.Vector3(30, 0, 30);
  public currentTarget: THREE.Vector3 = new THREE.Vector3(30, 0, 30);
  public height: number = 42;
  public targetHeight: number = 42;
  public config: Camera3DConfig;
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  public groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Key states
  public keys: { [key: string]: boolean } = {};
  public mouseScreenPos: { x: number; y: number } = { x: 0, y: 0 };
  public isNearEdge: boolean = false;
  public edgePan: { x: number; z: number } = { x: 0, z: 0 };

  constructor(width: number, height: number, config: Partial<Camera3DConfig> = {}) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
    this.camera = new THREE.PerspectiveCamera(
      this.config.fov,
      width / height,
      this.config.near,
      this.config.far
    );
    this.updateCameraTransform();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public setTarget(x: number, z: number, immediate: boolean = false): void {
    this.target.x = x;
    this.target.z = z;
    if (immediate) {
      this.currentTarget.copy(this.target);
      this.updateCameraTransform();
    }
  }

  public zoom(delta: number): void {
    this.targetHeight = THREE.MathUtils.clamp(
      this.targetHeight + delta * 0.05,
      this.config.minHeight,
      this.config.maxHeight
    );
  }

  public handleKeyDown(key: string): void {
    this.keys[key.toLowerCase()] = true;
  }

  public handleKeyUp(key: string): void {
    this.keys[key.toLowerCase()] = false;
  }

  public handleMouseMove(clientX: number, clientY: number, rect: DOMRect): void {
    this.mouseScreenPos.x = clientX - rect.left;
    this.mouseScreenPos.y = clientY - rect.top;

    const margin = this.config.edgeScrollMargin;
    let dx = 0;
    let dz = 0;

    if (this.mouseScreenPos.x < margin) dx -= 1;
    else if (this.mouseScreenPos.x > rect.width - margin) dx += 1;

    if (this.mouseScreenPos.y < margin) dz -= 1;
    else if (this.mouseScreenPos.y > rect.height - margin) dz += 1;

    this.edgePan.x = dx;
    this.edgePan.z = dz;
    this.isNearEdge = dx !== 0 || dz !== 0;
  }

  public update(deltaSeconds: number, worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    let moveX = 0;
    let moveZ = 0;

    // Keyboard Pan (WASD or Arrow keys)
    if (this.keys['w'] || this.keys['arrowup']) moveZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Edge scroll
    if (this.isNearEdge) {
      moveX += this.edgePan.x;
      moveZ += this.edgePan.z;
    }

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const speed = this.config.panSpeed * (this.height / 35) * deltaSeconds * 60;
      this.target.x += (moveX / len) * speed;
      this.target.z += (moveZ / len) * speed;
    }

    // Clamp target within world bounds
    this.target.x = THREE.MathUtils.clamp(this.target.x, worldBounds.minX + 15, worldBounds.maxX - 15);
    this.target.z = THREE.MathUtils.clamp(this.target.z, worldBounds.minZ + 10, worldBounds.maxZ - 20);

    // Smooth lerp for height and position
    const lerpFactor = Math.min(1, deltaSeconds * 10);
    this.height = THREE.MathUtils.lerp(this.height, this.targetHeight, lerpFactor);
    this.currentTarget.x = THREE.MathUtils.lerp(this.currentTarget.x, this.target.x, lerpFactor);
    this.currentTarget.z = THREE.MathUtils.lerp(this.currentTarget.z, this.target.z, lerpFactor);

    this.updateCameraTransform();
  }

  public updateCameraTransform(): void {
    // Strategy perspective: height gives distance, zOffset gives the angle (~50 to 55 degrees)
    const zOffset = this.height * 0.78;
    this.camera.position.set(
      this.currentTarget.x,
      this.height,
      this.currentTarget.z + zOffset
    );
    this.camera.lookAt(this.currentTarget.x, 0, this.currentTarget.z);
  }

  /**
   * Raycast from mouse screen coordinates to ground plane (Y=0)
   */
  public getGroundIntersection(clientX: number, clientY: number, rect: DOMRect): THREE.Vector3 | null {
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);
    return hit ? target : null;
  }

  /**
   * Convert 3D world coordinate to 2D screen coordinate
   */
  public worldToScreen(worldPos: THREE.Vector3, rect: DOMRect): { x: number; y: number } {
    const projected = worldPos.clone().project(this.camera);
    return {
      x: ((projected.x + 1) / 2) * rect.width,
      y: ((-projected.y + 1) / 2) * rect.height
    };
  }
}
