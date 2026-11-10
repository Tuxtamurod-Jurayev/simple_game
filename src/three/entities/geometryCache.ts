import * as THREE from 'three';

/**
 * High-performance geometry cache for Three.js RTS entities.
 * Prevents continuous heap allocations and GPU buffer uploads
 * by sharing identical low-poly geometry buffers across units and buildings.
 */
class GeometryCache {
  private boxMap = new Map<string, THREE.BoxGeometry>();
  private cylMap = new Map<string, THREE.CylinderGeometry>();
  private sphereMap = new Map<string, THREE.SphereGeometry>();
  private coneMap = new Map<string, THREE.ConeGeometry>();
  private circleMap = new Map<string, THREE.CircleGeometry>();
  private ringMap = new Map<string, THREE.RingGeometry>();
  private planeMap = new Map<string, THREE.PlaneGeometry>();
  private torusMap = new Map<string, THREE.TorusGeometry>();
  private edgesMap = new Map<string, THREE.EdgesGeometry>();

  public getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let geo = this.boxMap.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this.boxMap.set(key, geo);
    }
    return geo;
  }

  public getCylinder(
    rt: number,
    rb: number,
    h: number,
    seg: number = 8,
    orientation: 'y' | 'z' | 'x' = 'y',
    thetaLength: number = Math.PI * 2
  ): THREE.CylinderGeometry {
    const key = `${rt.toFixed(2)}_${rb.toFixed(2)}_${h.toFixed(2)}_${seg}_${orientation}_${thetaLength.toFixed(2)}`;
    let geo = this.cylMap.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, seg, 1, false, 0, thetaLength);
      if (orientation === 'z') {
        geo.rotateX(Math.PI / 2);
      } else if (orientation === 'x') {
        geo.rotateZ(Math.PI / 2);
      }
      this.cylMap.set(key, geo);
    }
    return geo;
  }

  public getSphere(r: number, ws: number = 8, hs: number = 6): THREE.SphereGeometry {
    const key = `${r.toFixed(2)}_${ws}_${hs}`;
    let geo = this.sphereMap.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, ws, hs);
      this.sphereMap.set(key, geo);
    }
    return geo;
  }

  public getCone(r: number, h: number, seg: number = 6, orientation: 'y' | 'z' | 'x' = 'y'): THREE.ConeGeometry {
    const key = `${r.toFixed(2)}_${h.toFixed(2)}_${seg}_${orientation}`;
    let geo = this.coneMap.get(key);
    if (!geo) {
      geo = new THREE.ConeGeometry(r, h, seg);
      if (orientation === 'z') {
        geo.rotateX(Math.PI / 2);
      } else if (orientation === 'x') {
        geo.rotateZ(Math.PI / 2);
      }
      this.coneMap.set(key, geo);
    }
    return geo;
  }

  public getCircle(r: number, seg: number = 16, rotateX: boolean = true): THREE.CircleGeometry {
    const key = `${r.toFixed(2)}_${seg}_${rotateX}`;
    let geo = this.circleMap.get(key);
    if (!geo) {
      geo = new THREE.CircleGeometry(r, seg);
      if (rotateX) geo.rotateX(-Math.PI / 2);
      this.circleMap.set(key, geo);
    }
    return geo;
  }

  public getRing(inner: number, outer: number, seg: number = 24, rotateX: boolean = true): THREE.RingGeometry {
    const key = `${inner.toFixed(2)}_${outer.toFixed(2)}_${seg}_${rotateX}`;
    let geo = this.ringMap.get(key);
    if (!geo) {
      geo = new THREE.RingGeometry(inner, outer, seg);
      if (rotateX) geo.rotateX(-Math.PI / 2);
      this.ringMap.set(key, geo);
    }
    return geo;
  }

  public getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}`;
    let geo = this.planeMap.get(key);
    if (!geo) {
      geo = new THREE.PlaneGeometry(w, h);
      this.planeMap.set(key, geo);
    }
    return geo;
  }

  public getTorus(r: number, tube: number, radSeg: number = 8, tubSeg: number = 16, rotateX: boolean = true): THREE.TorusGeometry {
    const key = `${r.toFixed(2)}_${tube.toFixed(2)}_${radSeg}_${tubSeg}_${rotateX}`;
    let geo = this.torusMap.get(key);
    if (!geo) {
      geo = new THREE.TorusGeometry(r, tube, radSeg, tubSeg);
      if (rotateX) geo.rotateX(Math.PI / 2);
      this.torusMap.set(key, geo);
    }
    return geo;
  }

  public getEdges(w: number, h: number, d: number): THREE.EdgesGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let geo = this.edgesMap.get(key);
    if (!geo) {
      const box = this.getBox(w, h, d);
      geo = new THREE.EdgesGeometry(box);
      this.edgesMap.set(key, geo);
    }
    return geo;
  }

  public disposeAll(): void {
    const clear = (map: Map<string, THREE.BufferGeometry>) => {
      map.forEach(g => g.dispose());
      map.clear();
    };
    clear(this.boxMap);
    clear(this.cylMap);
    clear(this.sphereMap);
    clear(this.coneMap);
    clear(this.circleMap);
    clear(this.ringMap);
    clear(this.planeMap);
    clear(this.torusMap);
    clear(this.edgesMap);
  }
}

export const geoCache = new GeometryCache();
