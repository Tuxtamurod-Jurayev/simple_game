import * as THREE from 'three';

interface ExplosionFlash {
  light: THREE.PointLight;
  duration: number;
  life: number;
  maxIntensity: number;
  active: boolean;
}

export class LightingSystem {
  public scene: THREE.Scene;
  public ambientLight: THREE.AmbientLight;
  public sunLight: THREE.DirectionalLight;
  public hemisphereLight: THREE.HemisphereLight;
  private explosionPool: ExplosionFlash[] = [];
  private poolSize: number = 8;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Ambient Light - warm desert tone
    this.ambientLight = new THREE.AmbientLight(0xfef08a, 0.6);
    this.scene.add(this.ambientLight);

    // 2. Hemisphere Light - desert sky to ground bounce
    this.hemisphereLight = new THREE.HemisphereLight(0xffedd5, 0x78350f, 0.45);
    this.hemisphereLight.position.set(0, 50, 0);
    this.scene.add(this.hemisphereLight);

    // 3. Directional Sun Light with Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.sunLight.position.set(60, 90, 45);
    this.sunLight.castShadow = true;

    // Shadow Map configuration for crisp RTS shadows
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.bias = -0.0008;

    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 4. Pre-instantiate explosion PointLight pool
    for (let i = 0; i < this.poolSize; i++) {
      const pLight = new THREE.PointLight(0xff7700, 0, 25, 1.8);
      pLight.visible = false;
      this.scene.add(pLight);
      this.explosionPool.push({
        light: pLight,
        duration: 0.35,
        life: 0,
        maxIntensity: 6.0,
        active: false
      });
    }
  }

  /**
   * Follow the camera target with the directional sun shadow frustum
   */
  public update(deltaSeconds: number, cameraTarget: THREE.Vector3): void {
    // Keep sun aligned with camera target so shadow resolution stays sharp
    this.sunLight.target.position.set(cameraTarget.x, 0, cameraTarget.z);
    this.sunLight.position.set(
      cameraTarget.x + 45,
      cameraTarget.y + 85,
      cameraTarget.z + 40
    );

    // Update active explosion flashes
    for (const flash of this.explosionPool) {
      if (flash.active) {
        flash.life -= deltaSeconds;
        if (flash.life <= 0) {
          flash.active = false;
          flash.light.visible = false;
          flash.light.intensity = 0;
        } else {
          // Smooth fade out
          const progress = flash.life / flash.duration;
          flash.light.intensity = flash.maxIntensity * Math.pow(progress, 1.8);
        }
      }
    }
  }

  /**
   * Spawn a short-lived intense explosion point light
   */
  public triggerExplosionFlash(x: number, y: number, z: number, color: number = 0xff7700, maxIntensity: number = 6.0): void {
    const flash = this.explosionPool.find(f => !f.active) || this.explosionPool[0];
    flash.active = true;
    flash.life = flash.duration;
    flash.maxIntensity = maxIntensity;
    flash.light.color.setHex(color);
    flash.light.position.set(x, Math.max(1.5, y), z);
    flash.light.intensity = maxIntensity;
    flash.light.visible = true;
  }
}
