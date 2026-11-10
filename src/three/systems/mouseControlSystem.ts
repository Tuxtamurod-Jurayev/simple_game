import * as THREE from 'three';
import { Unit, Building, Faction } from '../../types/game';

export interface UnitMeshBinding {
  data: Unit;
  mesh: THREE.Object3D;
}

export interface BuildingMeshBinding {
  data: Building;
  mesh: THREE.Object3D;
}

export interface MoveCommand {
  unitId: number;
  targetX: number;
  targetY: number;
}

/**
 * 7-BO'LIM: 3D Raycaster va Sichqoncha Boshqaruvi
 * (To'liq va xatosiz Select, Move va Attack-Move)
 */
export class MouseControlSystem {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Attack-Move holati ('A' tugmasi bosilganda faol)
  public isAttackMoveKeyDown: boolean = false;
  public isAttackMoveActive: boolean = false;

  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  public terrainMesh: THREE.Mesh;

  // Jonli birliklar va binolar
  public units: UnitMeshBinding[] = [];
  public buildings: BuildingMeshBinding[] = [];
  public selectedUnits: Unit[] = [];
  public selectedBuilding: Building | null = null;
  public playerFaction: Faction = 'USA';

  // Hodisalar (Callbacks)
  public onSelectUnits?: (units: Unit[]) => void;
  public onSelectBuilding?: (building: Building | null) => void;
  public onMoveOrder?: (commands: MoveCommand[]) => void;
  public onAttackOrder?: (unitIds: number[], targetId: number, targetType: 'unit' | 'building') => void;
  public onAttackMoveOrder?: (unitIds: number[], targetX: number, targetY: number) => void;
  public onShowMarker?: (x: number, y: number, z: number, colorHex: number) => void;
  public onPlayAudio?: (action: 'select' | 'move' | 'attack', faction: Faction) => void;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, terrainMesh: THREE.Mesh) {
    this.camera = camera;
    this.scene = scene;
    this.terrainMesh = terrainMesh;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'A') {
      this.isAttackMoveKeyDown = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'A') {
      this.isAttackMoveKeyDown = false;
    }
  };

  /**
   * Ekran koordinatalarini Three.js Raycaster uchun hisoblash
   */
  public updateRaycaster(clientX: number, clientY: number, rect: DOMRect) {
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  /**
   * Matematik yer tekisligi bilan kesishish nuqtasi (100% ishonchli)
   */
  public getGroundPoint(clientX: number, clientY: number, rect: DOMRect): THREE.Vector3 | null {
    this.updateRaycaster(clientX, clientY, rect);
    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);
    return hit ? target : null;
  }

  /**
   * 1. CHAP TUGMA: Birliklarni tanlash (Select)
   */
  public selectAt(clientX: number, clientY: number, rect: DOMRect): Unit | Building | null {
    this.updateRaycaster(clientX, clientY, rect);

    // 1-Qadam: 3D tank mesh'lari bilan to'g'ridan-to'g'ri kesishishni tekshirish
    const unitMeshes = this.units.map(u => u.mesh);
    const unitIntersects = this.raycaster.intersectObjects(unitMeshes, true);

    if (unitIntersects.length > 0) {
      let hitObj: THREE.Object3D | null = unitIntersects[0].object;
      let foundUnit: Unit | undefined;

      while (hitObj && hitObj !== this.scene) {
        if (hitObj.userData && typeof hitObj.userData.unitId === 'number') {
          const uid = hitObj.userData.unitId;
          foundUnit = this.units.find(u => u.data.id === uid)?.data;
          if (foundUnit) break;
        }
        const directMatch = this.units.find(u => u.mesh === hitObj);
        if (directMatch) {
          foundUnit = directMatch.data;
          break;
        }
        hitObj = hitObj.parent;
      }

      if (foundUnit) {
        this.selectedUnits = [foundUnit];
        this.selectedBuilding = null;
        this.onSelectUnits?.([foundUnit]);
        this.onSelectBuilding?.(null);
        if (foundUnit.team === 'player') {
          this.onPlayAudio?.('select', foundUnit.faction);
        }
        return foundUnit;
      }
    }

    // 2-Qadam: Yer tekisligi bo'yicha tank yoniga bosilganini tekshirish (qulay nishon olish)
    const groundHit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, groundHit)) {
      const wx = groundHit.x * 10;
      const wy = groundHit.z * 10;

      // Bosilgan nuqtaga eng yaqin birlikni qidirish (radius + 28px)
      const nearbyUnit = this.units.find(u => {
        const d = Math.hypot(u.data.x - wx, u.data.y - wy);
        return d <= (u.data.radius + 28);
      });

      if (nearbyUnit) {
        const u = nearbyUnit.data;
        this.selectedUnits = [u];
        this.selectedBuilding = null;
        this.onSelectUnits?.([u]);
        this.onSelectBuilding?.(null);
        if (u.team === 'player') {
          this.onPlayAudio?.('select', u.faction);
        }
        return u;
      }

      // 3-Qadam: Binoni tekshirish (3D mesh yoki maydoni)
      const clickedBuilding = this.buildings.find(b => {
        return (
          wx >= b.data.x - 10 &&
          wx <= b.data.x + b.data.width + 10 &&
          wy >= b.data.y - 10 &&
          wy <= b.data.y + b.data.height + 10
        );
      });

      if (clickedBuilding) {
        const b = clickedBuilding.data;
        this.selectedUnits = [];
        this.selectedBuilding = b;
        this.onSelectUnits?.([]);
        this.onSelectBuilding?.(b);
        return b;
      }
    }

    // 4-Qadam: Bo'sh yerga bosilsa — tanlov bekor qilinadi
    this.selectedUnits = [];
    this.selectedBuilding = null;
    this.onSelectUnits?.([]);
    this.onSelectBuilding?.(null);
    return null;
  }

  /**
   * 2. O'NG TUGMA: Harakatlanish yoki Hujum (Move / Attack / Attack-Move)
   */
  public orderAt(clientX: number, clientY: number, rect: DOMRect) {
    const playerUnits = this.selectedUnits.filter(u => u.team === 'player' && u.hp > 0);
    if (playerUnits.length === 0) return;

    this.updateRaycaster(clientX, clientY, rect);

    // 3-Shart: Attack-Move ('A' tugmasi bosilgan holatda)
    if (this.isAttackMoveKeyDown || this.isAttackMoveActive) {
      const gHit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.groundPlane, gHit)) {
        const wx = gHit.x * 10;
        const wy = gHit.z * 10;
        this.onAttackMoveOrder?.(playerUnits.map(u => u.id), wx, wy);
        this.onShowMarker?.(gHit.x, 0.12, gHit.z, 0xf97316); // To'q sariq marker
        this.onPlayAudio?.('attack', this.playerFaction);
        this.isAttackMoveActive = false;
        return;
      }
    }

    // 1-Shart: Dushmanga hujum qilish (Attack Target)
    // A. Dushman tanki/piyodasi bosilganligini tekshirish
    const enemyUnits = this.units.filter(u => u.data.team === 'enemy' && u.data.hp > 0);
    if (enemyUnits.length > 0) {
      const enemyIntersects = this.raycaster.intersectObjects(enemyUnits.map(u => u.mesh), true);
      let targetEnemy: Unit | undefined;

      if (enemyIntersects.length > 0) {
        let hitObj: THREE.Object3D | null = enemyIntersects[0].object;
        while (hitObj && hitObj !== this.scene) {
          if (hitObj.userData && typeof hitObj.userData.unitId === 'number') {
            targetEnemy = enemyUnits.find(u => u.data.id === hitObj!.userData.unitId)?.data;
            if (targetEnemy) break;
          }
          hitObj = hitObj.parent;
        }
      }

      // Proximity tekshiruv (agar ozgina chetga bosilgan bo'lsa)
      if (!targetEnemy) {
        const gHit = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.groundPlane, gHit)) {
          const wx = gHit.x * 10;
          const wy = gHit.z * 10;
          targetEnemy = enemyUnits.find(e => Math.hypot(e.data.x - wx, e.data.y - wy) <= e.data.radius + 24)?.data;
        }
      }

      if (targetEnemy) {
        const unitIds = playerUnits.map(u => u.id);
        this.onAttackOrder?.(unitIds, targetEnemy.id, 'unit');
        this.onShowMarker?.(targetEnemy.x * 0.1, 0.12, targetEnemy.y * 0.1, 0xef4444); // Qizil nishon
        this.onPlayAudio?.('attack', this.playerFaction);
        return;
      }
    }

    // B. Dushman binosi bosilganligini tekshirish
    const enemyBuildings = this.buildings.filter(b => b.data.team === 'enemy' && b.data.hp > 0);
    if (enemyBuildings.length > 0) {
      let targetB: Building | undefined;
      const bIntersects = this.raycaster.intersectObjects(enemyBuildings.map(b => b.mesh), true);

      if (bIntersects.length > 0) {
        let hitObj: THREE.Object3D | null = bIntersects[0].object;
        while (hitObj && hitObj !== this.scene) {
          if (hitObj.userData && typeof hitObj.userData.buildingId === 'number') {
            targetB = enemyBuildings.find(b => b.data.id === hitObj!.userData.buildingId)?.data;
            if (targetB) break;
          }
          hitObj = hitObj.parent;
        }
      }

      if (!targetB) {
        const gHit = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.groundPlane, gHit)) {
          const wx = gHit.x * 10;
          const wy = gHit.z * 10;
          targetB = enemyBuildings.find(
            b => wx >= b.data.x - 10 && wx <= b.data.x + b.data.width + 10 && wy >= b.data.y - 10 && wy <= b.data.y + b.data.height + 10
          )?.data;
        }
      }

      if (targetB) {
        const unitIds = playerUnits.map(u => u.id);
        const bcx = targetB.x + targetB.width / 2;
        const bcy = targetB.y + targetB.height / 2;
        this.onAttackOrder?.(unitIds, targetB.id, 'building');
        this.onShowMarker?.(bcx * 0.1, 0.12, bcy * 0.1, 0xef4444); // Qizil nishon
        this.onPlayAudio?.('attack', this.playerFaction);
        return;
      }
    }

    // 2-Shart: NUQTAGA BORISH (Yerga harakatlanish - 100% kafolatlangan)
    const groundPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, groundPoint)) {
      const worldX = groundPoint.x * 10;
      const worldY = groundPoint.z * 10;
      const count = playerUnits.length;
      const commands: MoveCommand[] = [];

      playerUnits.forEach((u, idx) => {
        // 1 ta tank bo'lsa to'g'ri nuqtaga, bir nechta bo'lsa guruhli siljish
        const offsetX = count === 1 ? 0 : ((idx % 3) * 3 - 3) * 10;
        const offsetY = count === 1 ? 0 : (Math.floor(idx / 3) * 3 - 3) * 10;

        commands.push({
          unitId: u.id,
          targetX: worldX + offsetX,
          targetY: worldY + offsetY
        });
      });

      this.onMoveOrder?.(commands);
      this.onShowMarker?.(groundPoint.x, 0.12, groundPoint.z, 0x10b981); // Yashil marker
      this.onPlayAudio?.('move', this.playerFaction);
    }
  }

  /**
   * Birliklarni har bir kadrda sinxronlashtirish
   */
  public syncState(
    units: Unit[],
    unitInstances: Map<number, { group: THREE.Group }>,
    buildings: Building[],
    buildingInstances: Map<number, { group: THREE.Group }>,
    selectedUnits: Unit[],
    selectedBuilding: Building | null,
    playerFaction: Faction
  ) {
    this.playerFaction = playerFaction;
    this.selectedUnits = selectedUnits;
    this.selectedBuilding = selectedBuilding;

    const newUnits: UnitMeshBinding[] = [];
    for (const u of units) {
      const inst = unitInstances.get(u.id);
      if (inst) {
        newUnits.push({ data: u, mesh: inst.group });
      }
    }
    this.units = newUnits;

    const newBuildings: BuildingMeshBinding[] = [];
    for (const b of buildings) {
      const inst = buildingInstances.get(b.id);
      if (inst) {
        newBuildings.push({ data: b, mesh: inst.group });
      }
    }
    this.buildings = newBuildings;
  }
}
