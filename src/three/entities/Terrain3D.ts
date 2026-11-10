import * as THREE from 'three';

export class Terrain3D {
  public group: THREE.Group = new THREE.Group();

  constructor(worldWidth: number, worldDepth: number) {
    // 1. Desert Terrain Base Ground
    const groundGeo = new THREE.PlaneGeometry(worldWidth, worldDepth, 48, 32);
    // Add subtle low-poly dune elevation variations
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      // Slight desert dune noise
      const dune = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.45;
      posAttr.setZ(i, dune);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2b261d, // Cho'l qumi (Mat)
      roughness: 0.9,
      metalness: 0.1
    });

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(worldWidth / 2, 0, worldDepth / 2);
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // 2. Winding River Channel
    // River crosses roughly around x = 110 to 130
    const riverGeo = new THREE.PlaneGeometry(16, worldDepth);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Deep blue river
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.rotation.x = -Math.PI / 2;
    riverMesh.position.set(worldWidth * 0.5, 0.04, worldDepth / 2);
    this.group.add(riverMesh);

    // 3. Central Strategic Heavy Concrete Bridge
    const bridgeWidth = 18;
    const bridgeDepth = 22;
    const bridgeGeo = new THREE.BoxGeometry(bridgeWidth, 0.5, bridgeDepth);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46, // Dark asphalt / concrete
      roughness: 0.7,
      metalness: 0.3
    });
    const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.position.set(worldWidth * 0.5, 0.3, worldDepth * 0.5);
    bridgeMesh.receiveShadow = true;
    this.group.add(bridgeMesh);

    // Bridge Guardrails
    const railGeo = new THREE.BoxGeometry(0.3, 0.6, bridgeDepth);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 }); // Hazard yellow
    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(worldWidth * 0.5 - bridgeWidth / 2 + 0.2, 0.7, worldDepth * 0.5);
    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(worldWidth * 0.5 + bridgeWidth / 2 - 0.2, 0.7, worldDepth * 0.5);
    this.group.add(railL);
    this.group.add(railR);

    // 4. Base Concrete Foundations (Player & Enemy HQ sectors)
    const basePaveGeo = new THREE.PlaneGeometry(42, 42);
    const basePaveMat = new THREE.MeshStandardMaterial({
      color: 0x52525b,
      roughness: 0.85
    });

    // Player Base Tarmac (Top-Left)
    const playerBase = new THREE.Mesh(basePaveGeo, basePaveMat);
    playerBase.rotation.x = -Math.PI / 2;
    playerBase.position.set(24, 0.02, 24);
    playerBase.receiveShadow = true;
    this.group.add(playerBase);

    // Enemy Base Tarmac (Bottom-Right)
    const enemyBase = new THREE.Mesh(basePaveGeo, basePaveMat);
    enemyBase.rotation.x = -Math.PI / 2;
    enemyBase.position.set(worldWidth - 24, 0.02, worldDepth - 24);
    enemyBase.receiveShadow = true;
    this.group.add(enemyBase);

    // 5. Desert Rocks & Boulders (Low-Poly Dodecahedrons)
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
    const rockCoords = [
      [65, 30], [80, 50], [100, 110], [150, 45], [175, 95], [190, 70],
      [40, 120], [130, 20], [115, 140], [160, 130]
    ];
    for (const [rx, rz] of rockCoords) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const s = Math.random() * 1.5 + 1.0;
      rock.scale.set(s, s * 0.8, s);
      rock.position.set(rx, s * 0.4, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }
  }
}
