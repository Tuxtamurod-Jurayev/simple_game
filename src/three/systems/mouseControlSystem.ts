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
 * 7-BO'LIM: 3D Raycaster, Sichqoncha Boshqaruvi va Buyruqlar Tizimi
 * (Select, Move & Attack-Move)
 */
export class MouseControlSystem {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Attack-Move holati ('A' tugmasi bosilganda faollashadi)
  public isAttackMoveKeyDown: boolean = false;
  public isAttackMoveActive: boolean = false;

  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private terrainMesh: THREE.Mesh;
  private domElement: HTMLElement | null = null;

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
  }

  /**
   * Sichqoncha va klaviatura tinglovchilarini ulash
   */
  public initListeners(rendererDom: HTMLElement) {
    this.domElement = rendererDom;
    rendererDom.addEventListener('mousedown', this.handleMouseDown);
    rendererDom.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public dispose() {
    if (this.domElement) {
      this.domElement.removeEventListener('mousedown', this.handleMouseDown);
      this.domElement.removeEventListener('contextmenu', this.handleContextMenu);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  /**
   * 'A' tugmasini kuzatish (Attack-Move buyrug'i uchun)
   */
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
   * Brauzerning kontekst menyusini bloklash
   */
  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  /**
   * Sichqoncha bosilganda Raycaster va buyruqlar ishga tushishi
   */
  public handleMouseDown = (e: MouseEvent) => {
    if (!this.domElement) return;

    // 1. Ekran koordinatalarini -1 va +1 oralig'idagi NDC koordinatasiga o'tkazish
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // 2. Raycaster'ni kamera va koordinatalar orqali yangilash
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (e.button === 0) {
      // CHAP TUGMA:
      // Agar 'A' tugmasi bosilgan yoki Attack-Move faol bo'lsa, nuqtaga Attack-Move beriladi
      if (this.isAttackMoveKeyDown || this.isAttackMoveActive) {
        this.processAttackMove();
        this.isAttackMoveActive = false;
      } else {
        // Standart Tanlash mantiqi (Select)
        this.processSelection();
      }
    } else if (e.button === 2) {
      // O'NG TUGMA: Harakatlanish yoki Dushmanga Hujum (Move / Attack)
      this.processContextOrder();
    }
  };

  /**
   * 2.1. Chap Tugma Bilan Tanlash Mantiqi (Left-Click Selection)
   */
  public processSelection() {
    // 1. Mavjud birliklar (Tanklar, Askarlar, Samolyotlar) mesh'larini tekshirish
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
        return;
      }
    }

    // 2. Binolarni tekshirish (Agar bino bosilgan bo'lsa)
    const buildingMeshes = this.buildings.map(b => b.mesh);
    const bIntersects = this.raycaster.intersectObjects(buildingMeshes, true);

    if (bIntersects.length > 0) {
      let hitObj: THREE.Object3D | null = bIntersects[0].object;
      let foundBuilding: Building | undefined;

      while (hitObj && hitObj !== this.scene) {
        if (hitObj.userData && typeof hitObj.userData.buildingId === 'number') {
          const bid = hitObj.userData.buildingId;
          foundBuilding = this.buildings.find(b => b.data.id === bid)?.data;
          if (foundBuilding) break;
        }
        const directMatch = this.buildings.find(b => b.mesh === hitObj);
        if (directMatch) {
          foundBuilding = directMatch.data;
          break;
        }
        hitObj = hitObj.parent;
      }

      if (foundBuilding) {
        this.selectedUnits = [];
        this.selectedBuilding = foundBuilding;
        this.onSelectUnits?.([]);
        this.onSelectBuilding?.(foundBuilding);
        return;
      }
    }

    // 3. Bo'sh yerga (Terrain) bosilsa - avvalgi tanlov tozalanadi
    this.selectedUnits = [];
    this.selectedBuilding = null;
    this.onSelectUnits?.([]);
    this.onSelectBuilding?.(null);
  }

  /**
   * 2.2. O'ng Tugma Bilan Harakatlanish va Hujum Mantiqi (Right-Click Orders)
   */
  public processContextOrder() {
    const playerUnits = this.selectedUnits.filter(u => u.team === 'player' && u.hp > 0);
    if (playerUnits.length === 0) return;

    // 3-Shart (Attack-Move / Majburiy Hujum): 'A' tugmasi bosilgan holatda
    if (this.isAttackMoveKeyDown || this.isAttackMoveActive) {
      this.processAttackMove();
      this.isAttackMoveActive = false;
      return;
    }

    // 1-Shart (Dushmanga hujum qilish — Attack Target)
    // A. Dushman tanki yoki piyodasini tekshirish
    const enemyUnits = this.units.filter(u => u.data.team === 'enemy' && u.data.hp > 0);
    if (enemyUnits.length > 0) {
      const enemyIntersects = this.raycaster.intersectObjects(enemyUnits.map(u => u.mesh), true);
      if (enemyIntersects.length > 0) {
        let hitObj: THREE.Object3D | null = enemyIntersects[0].object;
        let targetEnemy: Unit | undefined;

        while (hitObj && hitObj !== this.scene) {
          if (hitObj.userData && typeof hitObj.userData.unitId === 'number') {
            const uid = hitObj.userData.unitId;
            targetEnemy = enemyUnits.find(u => u.data.id === uid)?.data;
            if (targetEnemy) break;
          }
          hitObj = hitObj.parent;
        }

        if (targetEnemy) {
          const unitIds = playerUnits.map(u => u.id);
          this.onAttackOrder?.(unitIds, targetEnemy.id, 'unit');
          this.onShowMarker?.(targetEnemy.x * 0.1, 0.12, targetEnemy.y * 0.1, 0xef4444); // Qizil nishon
          this.onPlayAudio?.('attack', this.playerFaction);
          return;
        }
      }
    }

    // B. Dushman binosini tekshirish
    const enemyBuildings = this.buildings.filter(b => b.data.team === 'enemy' && b.data.hp > 0);
    if (enemyBuildings.length > 0) {
      const bIntersects = this.raycaster.intersectObjects(enemyBuildings.map(b => b.mesh), true);
      if (bIntersects.length > 0) {
        let hitObj: THREE.Object3D | null = bIntersects[0].object;
        let targetB: Building | undefined;

        while (hitObj && hitObj !== this.scene) {
          if (hitObj.userData && typeof hitObj.userData.buildingId === 'number') {
            const bid = hitObj.userData.buildingId;
            targetB = enemyBuildings.find(b => b.data.id === bid)?.data;
            if (targetB) break;
          }
          hitObj = hitObj.parent;
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
    }

    // 2-Shart (Nuqtaga borish — Move to Point): Bo'sh yerga (Terrain) bosilsa
    const terrainIntersects = this.raycaster.intersectObject(this.terrainMesh, false);
    if (terrainIntersects.length > 0) {
      const hitPoint = terrainIntersects[0].point;
      const worldX = hitPoint.x * 10;
      const worldY = hitPoint.z * 10;
      const count = playerUnits.length;
      const commands: MoveCommand[] = [];

      playerUnits.forEach((u, idx) => {
        // Taktik guruhli siljish: (index % 3) * 3 - 3 va Math.floor(index / 3) * 3 - 3
        const offsetX = count === 1 ? 0 : ((idx % 3) * 3 - 3) * 10;
        const offsetY = count === 1 ? 0 : (Math.floor(idx / 3) * 3 - 3) * 10;
        commands.push({
          unitId: u.id,
          targetX: worldX + offsetX,
          targetY: worldY + offsetY
        });
      });

      this.onMoveOrder?.(commands);
      this.onShowMarker?.(hitPoint.x, 0.12, hitPoint.z, 0x10b981); // Yashil marker
      this.onPlayAudio?.('move', this.playerFaction);
    }
  }

  /**
   * 3-Shart: Attack-Move buyrug'ini amalga oshirish
   * Ko'rsatilgan nuqtaga harakatlanadi, yo'ldagi har qanday dushmanga to'xtab o't ochadi
   */
  public processAttackMove() {
    const playerUnits = this.selectedUnits.filter(u => u.team === 'player' && u.hp > 0);
    if (playerUnits.length === 0) return;

    const terrainIntersects = this.raycaster.intersectObject(this.terrainMesh, false);
    if (terrainIntersects.length > 0) {
      const hitPoint = terrainIntersects[0].point;
      const worldX = hitPoint.x * 10;
      const worldY = hitPoint.z * 10;
      const unitIds = playerUnits.map(u => u.id);

      this.onAttackMoveOrder?.(unitIds, worldX, worldY);
      this.onShowMarker?.(hitPoint.x, 0.12, hitPoint.z, 0xf97316); // To'q sariq (Attack-Move)
      this.onPlayAudio?.('attack', this.playerFaction);
    }
  }

  /**
   * Birliklarni 3D mesh'lari bilan yangilab borish
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
