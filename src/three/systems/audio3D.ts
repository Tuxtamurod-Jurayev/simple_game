import {
  initAudio,
  playCannonShot,
  playLaserBeam,
  playGatlingFire,
  playExplosion,
  playSiren,
  playCashSound,
  playBuildSound,
  speakVoice
} from '../../systems/audioSystem';

export class Audio3DSystem {
  public enabled: boolean = true;
  private cameraPos: { x: number; z: number } = { x: 0, z: 0 };
  private maxAudibleDistance: number = 85;

  constructor() {
    // Rely on Web Audio API oscillators initialized upon user interaction
  }

  public setCameraPosition(x: number, z: number): void {
    this.cameraPos.x = x;
    this.cameraPos.z = z;
  }

  /**
   * Calculate volume multiplier based on distance to camera
   */
  private getDistanceFactor(x: number, z: number): number {
    const dx = x - this.cameraPos.x;
    const dz = z - this.cameraPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > this.maxAudibleDistance) return 0.15;
    return Math.max(0.2, 1 - (dist / this.maxAudibleDistance) * 0.8);
  }

  public playPositionalCannon(x: number, z: number): void {
    if (!this.enabled) return;
    const factor = this.getDistanceFactor(x, z);
    if (factor > 0.18) {
      playCannonShot();
    }
  }

  public playPositionalExplosion(x: number, z: number, isHuge: boolean = false): void {
    if (!this.enabled) return;
    const factor = this.getDistanceFactor(x, z);
    if (factor > 0.15) {
      playExplosion(isHuge ? 'large' : 'small');
    }
  }

  public playPositionalGatling(x: number, z: number): void {
    if (!this.enabled) return;
    const factor = this.getDistanceFactor(x, z);
    if (factor > 0.25) {
      playGatlingFire();
    }
  }

  public playPositionalLaser(x: number, z: number): void {
    if (!this.enabled) return;
    const factor = this.getDistanceFactor(x, z);
    if (factor > 0.2) {
      playLaserBeam();
    }
  }

  public playBuildSound(): void {
    if (!this.enabled) return;
    playBuildSound();
  }

  public playCashSound(): void {
    if (!this.enabled) return;
    playCashSound();
  }

  public playSiren(): void {
    if (!this.enabled) return;
    playSiren();
  }

  public speak(type: 'select' | 'move' | 'attack' | 'buildComplete', faction: 'USA' | 'China' | 'GLA'): void {
    if (!this.enabled) return;
    speakVoice(type, faction);
  }
}
