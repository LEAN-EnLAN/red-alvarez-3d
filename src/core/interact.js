// Detección de objetos interactivos (centro de pantalla o toque) + resaltado.
import * as THREE from 'three';

export class Interactor {
  constructor(camera, world, scene) {
    this.camera = camera;
    this.world = world;
    this.ray = new THREE.Raycaster();
    this.ray.far = 4.2;
    this.current = null;
    const geo = new THREE.BufferGeometry();
    this.box = new THREE.Box3Helper(new THREE.Box3(), 0x60a5fa);
    this.box.material.depthTest = false;
    this.box.material.transparent = true;
    this.box.material.opacity = 0.9;
    this.box.renderOrder = 20;
    this.box.visible = false;
    scene.add(this.box);
    this.tmpBox = new THREE.Box3();
  }

  idFromHit(hit) {
    let o = hit.object;
    if (o.userData.instanceMap && hit.instanceId !== undefined && hit.distance < 1.6) {
      let id = o.userData.instanceMap[hit.instanceId];
      if (/^R[12]-PP[12]-\d{2}$/.test(id)) id = 'JACK:' + id; // jacks de pared
      return { id, instance: hit };
    }
    while (o) {
      if (o.userData.pickId !== undefined && !o.userData.instanceMap) return { id: o.userData.pickId };
      o = o.parent;
    }
    return null;
  }

  pick(ndc, far = 4.2) {
    this.ray.setFromCamera(ndc, this.camera);
    this.ray.far = far;
    const hits = this.ray.intersectObjects(this.world.pickables, true);
    for (const h of hits) {
      const r = this.idFromHit(h);
      if (r && r.id !== undefined) return { ...r, hit: h };
    }
    return null;
  }

  update(ndc = new THREE.Vector2(0, 0), far) {
    const r = this.pick(ndc, far);
    const id = r?.id || null;
    if (id !== this.current?.id) {
      this.current = r;
      this.highlight(r);
    }
    return this.current;
  }

  highlight(r) {
    if (!r) { this.box.visible = false; return; }
    if (r.instance) {
      const m = new THREE.Matrix4();
      r.hit.object.getMatrixAt(r.hit.instanceId, m);
      m.premultiply(r.hit.object.matrixWorld);
      const p = new THREE.Vector3().setFromMatrixPosition(m);
      this.box.box.setFromCenterAndSize(p, new THREE.Vector3(0.03, 0.03, 0.03));
    } else {
      const it = this.world.interact.get(r.id);
      const obj = it?.object || r.hit.object;
      this.box.box.makeEmpty();
      const objs = it?.group || [obj];
      for (const o of objs) this.box.box.union(this.tmpBox.setFromObject(o));
      this.box.box.expandByScalar(0.015);
    }
    this.box.visible = false;
  }
  clear() { this.current = null; this.box.visible = false; }
}
