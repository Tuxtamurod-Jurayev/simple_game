import * as THREE from 'three';

export interface ControllableUnit {
  id: number;
  mesh: THREE.Object3D;
  target: THREE.Vector3 | null;
  speed: number;
  team?: 'player' | 'enemy';
  bodyAngle?: number;
}

export class UnitController {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  // Birliklar va tanlanganlar ro'yxati
  public units: ControllableUnit[] = [];
  public selectedUnits: ControllableUnit[] = [];
  public terrainMesh: THREE.Mesh; // Yer (Cho'l xaritasi)

  // O'yin hodisalari uchun tashqi obunachilar (Callbacks)
  public onSelectionChange?: (selectedIds: number[]) => void;
  public onMoveCommand?: (commands: { unitId: number; targetX: number; targetZ: number }[]) => void;
  public onAttackUnitCommand?: (attackerIds: number[], targetUnitId: number) => void;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, terrainMesh: THREE.Mesh) {
    this.camera = camera;
    this.scene = scene;
    this.terrainMesh = terrainMesh;
  }

  /**
   * Birliklarni 3D sahnadagi obyektlar bilan sinxronlashtirish
   */
  public syncUnits(unitList: ControllableUnit[]) {
    this.units = unitList;
    // Tanlanganlarni mavjud birliklar bo'yicha filtrlash
    const unitMap = new Map(unitList.map(u => [u.id, u]));
    this.selectedUnits = this.selectedUnits
      .map(su => unitMap.get(su.id))
      .filter((u): u is ControllableUnit => u !== undefined);
  }

  /**
   * Sichqoncha bosilganda Raycaster ishga tushadi
   */
  public onMouseDown = (event: MouseEvent | React.MouseEvent, canvasRect?: DOMRect) => {
    const rect = canvasRect || {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };

    // 1. Ekran koordinatalarini -1 va 1 orasidagi Normalizatsiya qilingan koordinataga o'tkazamiz
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;
    this.mouse.x = (clientX / rect.width) * 2 - 1;
    this.mouse.y = -(clientY / rect.height) * 2 + 1;

    // 2. Raycaster'ni kamera va sichqoncha orqali yangilaymiz
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (event.button === 0) {
      // Chap tugma: Tankni tanlash (Intersection)
      const unitMeshes = this.units.map(u => u.mesh);
      const intersects = this.raycaster.intersectObjects(unitMeshes, true);

      if (intersects.length > 0) {
        // Tank tanlandi - mesh ierarxiyasidan unitId topiladi
        let hitObj: THREE.Object3D | null = intersects[0].object;
        let foundUnit: ControllableUnit | undefined;

        while (hitObj && hitObj !== this.scene) {
          if (hitObj.userData && typeof hitObj.userData.unitId === 'number') {
            const uid = hitObj.userData.unitId;
            foundUnit = this.units.find(u => u.id === uid);
            if (foundUnit) break;
          }
          const directMatch = this.units.find(u => u.mesh === hitObj);
          if (directMatch) {
            foundUnit = directMatch;
            break;
          }
          hitObj = hitObj.parent;
        }

        if (foundUnit) {
          this.clearSelection();
          this.selectedUnits = [foundUnit];
          this.highlightUnit(foundUnit.mesh);
          this.onSelectionChange?.([foundUnit.id]);
          return foundUnit;
        }
      }

      // Bo'sh joy bosilsa, tanlov bekor qilinadi
      this.clearSelection();
      this.onSelectionChange?.([]);
      return null;

    } else if (event.button === 2) {
      // O'ng tugma: Harakatlanish manzilini belgilash yoki hujum qilish
      if (this.selectedUnits.length === 0) return null;

      // 1. Dushman tanki bosilganligini tekshirish
      const enemyUnits = this.units.filter(u => u.team === 'enemy');
      if (enemyUnits.length > 0) {
        const enemyIntersects = this.raycaster.intersectObjects(enemyUnits.map(e => e.mesh), true);
        if (enemyIntersects.length > 0) {
          let hitObj: THREE.Object3D | null = enemyIntersects[0].object;
          while (hitObj && hitObj !== this.scene) {
            if (hitObj.userData && typeof hitObj.userData.unitId === 'number') {
              const enemyId = hitObj.userData.unitId;
              this.onAttackUnitCommand?.(this.selectedUnits.map(u => u.id), enemyId);
              return { type: 'attack', targetId: enemyId };
            }
            hitObj = hitObj.parent;
          }
        }
      }

      // 2. Cho'l xaritasini (Terrain) tekshirish
      const intersects = this.raycaster.intersectObject(this.terrainMesh, false);

      if (intersects.length > 0) {
        const targetPoint = intersects[0].point;
        const commands: { unitId: number; targetX: number; targetZ: number }[] = [];

        // Barcha tanlangan tanklarga maqsad va harakat nuqtasini berish
        this.selectedUnits.forEach((unit, index) => {
          // Bir necha tank bir joyga yig'ilib qolmasligi uchun guruhli siljish (Formation offset)
          const offsetX = (index % 3) * 3 - 3;
          const offsetZ = Math.floor(index / 3) * 3 - 3;

          const finalTarget = new THREE.Vector3(
            targetPoint.x + offsetX,
            0,
            targetPoint.z + offsetZ
          );

          unit.target = finalTarget;
          commands.push({
            unitId: unit.id,
            targetX: finalTarget.x,
            targetZ: finalTarget.z
          });
        });

        this.onMoveCommand?.(commands);
        return { type: 'move', point: targetPoint, commands };
      }
    }

    return null;
  };

  /**
   * Har bir frame (update/tick) da tanklarni harakatlantirish
   */
  public update = (delta: number) => {
    this.units.forEach(unit => {
      if (!unit.target) return;

      const currentPos = unit.mesh.position;
      const direction = new THREE.Vector3().subVectors(unit.target, currentPos);
      direction.y = 0; // Tekis yer yuzasi bo'yicha harakat
      const distance = direction.length();

      // Agar manzilga yetib kelgan bo'lsa
      if (distance < 0.5) {
        unit.target = null;
        return;
      }

      // 1. Minora va korpusni harakat yo'nalishiga burish (Rotation)
      const targetRotation = Math.atan2(direction.x, direction.z);
      unit.mesh.rotation.y = THREE.MathUtils.lerp(
        unit.mesh.rotation.y,
        targetRotation,
        Math.min(1, 10 * delta)
      );

      // 2. Oldinga siljish (Positioning)
      direction.normalize();
      unit.mesh.position.addScaledVector(direction, unit.speed * delta);
    });
  };

  /**
   * Tanlangan tankni ajratib ko'rsatish (yashil xalqa yoki material rangini o'zgartirish)
   */
  public highlightUnit(mesh: THREE.Object3D) {
    mesh.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const mat = m.material;
        if (mat && 'emissive' in mat) {
          (mat as THREE.MeshStandardMaterial).emissive.setHex(0x22c55e);
          (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.55;
        }
      }
    });
  }

  /**
   * Barcha tanlovlarni tozalash
   */
  public clearSelection() {
    this.selectedUnits.forEach(u => {
      u.mesh.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          const mat = m.material;
          if (mat && 'emissive' in mat) {
            (mat as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          }
        }
      });
    });
    this.selectedUnits = [];
  }

  /**
   * Yer (Terrain) bilan kesishish nuqtasini olish
   */
  public getTerrainIntersection(clientX: number, clientY: number, rect: DOMRect): THREE.Vector3 | null {
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.terrainMesh, false);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  /**
   * Sichqoncha ostidagi 3D obyektni (Unit) tekshirish
   */
  public getRaycastUnit(clientX: number, clientY: number, rect: DOMRect): ControllableUnit | null {
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const unitMeshes = this.units.map(u => u.mesh);
    const intersects = this.raycaster.intersectObjects(unitMeshes, true);
    if (intersects.length === 0) return null;

    let hitObj: THREE.Object3D | null = intersects[0].object;
    while (hitObj && hitObj !== this.scene) {
      if (hitObj.userData && typeof hitObj.userData.unitId === 'number') {
        const uid = hitObj.userData.unitId;
        const found = this.units.find(u => u.id === uid);
        if (found) return found;
      }
      const directMatch = this.units.find(u => u.mesh === hitObj);
      if (directMatch) return directMatch;
      hitObj = hitObj.parent;
    }
    return null;
  }
}
