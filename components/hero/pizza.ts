/**
 * Procedural brick-oven pizza for the hero.
 * Everything (textures included) is generated at runtime: no image downloads.
 *
 * Space: "pie space", y up, pie top at y≈0, angle a measured in the XZ plane
 * (x = cos a, z = sin a). The slice and the rest of the pie are built with the
 * same functions and the same planar-mapped textures, so the slice matches the
 * hole it was pulled from.
 */
import * as THREE from "three";

export const R = 2.4; // pie radius
const CRUST_R = 0.27; // cornicione tube radius
const CRUST_C = R - CRUST_R; // cornicione centerline radius
const CHEESE_R = CRUST_C - 0.05;
const DOUGH_T = 0.13;
const CRUST_LIFT = CRUST_R * 0.5;
const DROOP = 0.6; // how far the NY tip flops down
const PEP_R = 0.225;

// ── noise & helpers ──────────────────────────────────────────────
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const cheeseY = (x: number, z: number) => 0.085 + (fbm(x * 1.7 + 3.1, z * 1.7 - 7.3) - 0.5) * 0.11;

/** Inside the angular range [a0, a0+span] with a margin in world units. */
function inWedge(x: number, z: number, a0: number, span: number, margin: number) {
  const r = Math.hypot(x, z);
  if (r < margin) return false;
  const d = (((Math.atan2(z, x) - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const m = margin / r;
  return d >= m && d <= span - m;
}

// ── topping layout ───────────────────────────────────────────────
type Spot = { x: number; z: number; rot: number; s: number };

function layout(rand: () => number, sliceMid: number) {
  const peps: Spot[] = [];
  const polar = (r: number, a: number, s = 1): Spot => ({ x: Math.cos(a) * r, z: Math.sin(a) * r, rot: rand() * 6.28, s });
  // Guarantee a generous slice.
  peps.push(polar(0.78, sliceMid + 0.02, 0.92), polar(1.42, sliceMid - 0.15, 1.05), polar(1.55, sliceMid + 0.17, 1));
  for (let tries = 0; peps.length < 26 && tries < 4000; tries++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (CHEESE_R - 0.3);
    const p = polar(r, a, 0.88 + rand() * 0.28);
    if (peps.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > PEP_R * 2.15)) peps.push(p);
  }
  const basil: Spot[] = [polar(1.1, sliceMid - 0.04, 1)];
  for (let tries = 0; basil.length < 8 && tries < 4000; tries++) {
    const p = polar(0.3 + Math.sqrt(rand()) * (CHEESE_R - 0.5), rand() * Math.PI * 2, 0.8 + rand() * 0.4);
    if (peps.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > PEP_R + 0.12) && basil.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 0.6)) basil.push(p);
  }
  return { peps, basil };
}

// ── canvas textures ──────────────────────────────────────────────
function canvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}
function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number, core = 0) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, `rgba(${rgb},${a})`);
  if (core) grd.addColorStop(core, `rgba(${rgb},${a * 0.85})`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function makeTextures(rand: () => number, peps: Spot[]) {
  // Cheese: planar map over the whole pie.
  const S = 1024;
  const px = (x: number, z: number) => [(x / (2 * R) + 0.5) * S, (1 - (z / (2 * R) + 0.5)) * S] as const;
  const inCheese = () => {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * CHEESE_R;
    return px(Math.cos(a) * r, Math.sin(a) * r);
  };
  const [cc, g] = canvas(S);
  const [bc, b] = canvas(S);
  g.fillStyle = "#e9c46c";
  g.fillRect(0, 0, S, S);
  b.fillStyle = "#7a7a7a";
  b.fillRect(0, 0, S, S);

  for (let i = 0; i < 90; i++) { const [x, y] = inCheese(); blob(g, x, y, 30 + rand() * 90, "250,226,160", 0.2 + rand() * 0.25); }
  for (let i = 0; i < 50; i++) { const [x, y] = inCheese(); blob(g, x, y, 20 + rand() * 70, "205,146,58", 0.18 + rand() * 0.2); }
  // Sauce bleeding through near the crust and in patches.
  const cx = S / 2, rIn = (CHEESE_R / (2 * R)) * S;
  const ring = g.createRadialGradient(cx, cx, rIn * 0.74, cx, cx, rIn * 1.02);
  ring.addColorStop(0, "rgba(176,44,18,0)");
  ring.addColorStop(0.7, "rgba(176,44,18,0.35)");
  ring.addColorStop(1, "rgba(150,30,12,0.85)");
  g.fillStyle = ring;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 55; i++) { const [x, y] = inCheese(); blob(g, x, y, 8 + rand() * 26, "184,52,22", 0.22 + rand() * 0.25); }
  // Orange pepperoni grease halos.
  for (const p of peps) {
    const [x, y] = px(p.x, p.z);
    blob(g, x, y, (PEP_R / (2 * R)) * S * 1.6 * p.s, "222,112,28", 0.55, 0.45);
  }
  // Browned blisters in clusters (color + raised bump).
  for (let c = 0; c < 34; c++) {
    const [ox, oy] = inCheese();
    const n = 5 + Math.floor(rand() * 10);
    for (let i = 0; i < n; i++) {
      const x = ox + (rand() - 0.5) * 110, y = oy + (rand() - 0.5) * 110, r = 3 + rand() * 13;
      blob(g, x, y, r * 1.6, "196,128,48", 0.5);
      blob(g, x, y, r, "128,62,16", 0.9, 0.35);
      blob(b, x, y, r * 1.5, "235,235,235", 0.9, 0.3);
    }
  }
  for (let i = 0; i < 90; i++) { const [x, y] = inCheese(); blob(g, x, y, 1 + rand() * 2.5, "52,24,8", 0.85); }
  // Oregano flecks.
  for (let i = 0; i < 520; i++) {
    const [x, y] = inCheese();
    g.save();
    g.translate(x, y);
    g.rotate(rand() * 6.28);
    g.fillStyle = rand() > 0.5 ? "rgba(74,82,30,0.85)" : "rgba(95,70,30,0.8)";
    g.fillRect(-1.5, -0.6, 2 + rand() * 2.5, 1.2);
    g.restore();
  }
  // Bump: gentle melted undulation.
  for (let i = 0; i < 220; i++) { const [x, y] = inCheese(); blob(b, x, y, 10 + rand() * 50, rand() > 0.5 ? "170,170,170" : "90,90,90", 0.35); }

  // Crust: u along the rim, v around the tube (0.25 = top, 0.75 = underside).
  const CW = 1024, CH = 256;
  const [kc, k] = canvas(CW, CH);
  const [kbc, kb] = canvas(CW, CH);
  const grad = k.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, "#d18c3a");
  grad.addColorStop(0.25, "#e4b46a");
  grad.addColorStop(0.5, "#d7984a");
  grad.addColorStop(0.75, "#a2601f");
  grad.addColorStop(1, "#d18c3a");
  k.fillStyle = grad;
  k.fillRect(0, 0, CW, CH);
  kb.fillStyle = "#808080";
  kb.fillRect(0, 0, CW, CH);
  const wrapBlob = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number, core = 0) => {
    blob(ctx, x, y, r, rgb, a, core);
    if (x < r) blob(ctx, x + CW, y, r, rgb, a, core);
    if (x > CW - r) blob(ctx, x - CW, y, r, rgb, a, core);
  };
  for (let i = 0; i < 160; i++) wrapBlob(k, rand() * CW, CH * (0.55 + rand() * 0.4), 8 + rand() * 30, "120,62,18", 0.25 + rand() * 0.2);
  // Leopard char on top of the rim.
  // Toasty gradient bands along the rim.
  for (let i = 0; i < 40; i++) wrapBlob(k, rand() * CW, CH * (0.62 + rand() * 0.3), 30 + rand() * 60, rand() > 0.5 ? "150,80,22" : "236,186,108", 0.3);
  // Irregular leopard char: clustered blisters of mixed size, not a uniform print.
  for (let c = 0; c < 38; c++) {
    const cx = rand() * CW, cy = CH * (0.62 + rand() * 0.28);
    const n = 1 + Math.floor(rand() * 6);
    for (let i = 0; i < n; i++) {
      const x = cx + (rand() - 0.5) * 40, y = cy + (rand() - 0.5) * 22, r = 2 + rand() * (i === 0 ? 11 : 5);
      wrapBlob(k, x, y, r * 2.2, "92,44,12", 0.3);
      wrapBlob(k, x, y, r, "30,13,5", 0.92, 0.45);
      wrapBlob(kb, x, y, r * 1.8, "215,215,215", 0.85, 0.3);
    }
  }
  // Oven-floor char underneath, flour dust everywhere.
  for (let i = 0; i < 70; i++) wrapBlob(k, rand() * CW, CH * (0.12 + rand() * 0.26), 6 + rand() * 16, "60,30,10", 0.45);
  for (let i = 0; i < 900; i++) {
    k.fillStyle = `rgba(255,248,232,${0.25 + rand() * 0.45})`;
    k.fillRect(rand() * CW, rand() * CH, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  for (let i = 0; i < 300; i++) wrapBlob(kb, rand() * CW, rand() * CH, 4 + rand() * 20, rand() > 0.5 ? "170,170,170" : "70,70,70", 0.4);

  // Crumb (cut ends of the crust, dough sides): open, airy holes.
  const [mc, m] = canvas(256);
  m.fillStyle = "#9a9a9a";
  m.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) blob(m, rand() * 256, rand() * 256, 1.5 + rand() * 6, "30,30,30", 0.9, 0.5);

  const tex = (c: HTMLCanvasElement, color: boolean, repeat = false) => {
    const t = new THREE.CanvasTexture(c);
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  return {
    cheeseMap: tex(cc, true),
    cheeseBump: tex(bc, false),
    crustMap: tex(kc, true, true),
    crustBump: tex(kbc, false, true),
    crumbBump: tex(mc, false, true),
  };
}

// ── geometry ─────────────────────────────────────────────────────
function pepperoniGeometry() {
  const prof = [
    [0, 0], [0.18, 0], [0.215, 0.018], [0.226, 0.048], [0.224, 0.066], [0.208, 0.07],
    [0.18, 0.052], [0.13, 0.036], [0.07, 0.03], [0, 0.028],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(prof, 36);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const inner = new THREE.Color("#93170f"), mid = new THREE.Color("#6e120b"), rim = new THREE.Color("#2a0904");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.hypot(pos.getX(i), pos.getZ(i)) / 0.226;
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    c.copy(inner).lerp(mid, Math.pow(t, 2));
    const char = smooth(0.72, 0.98, t) * (0.55 + 0.45 * fbm(Math.cos(ang) * 3 + 9, Math.sin(ang) * 3));
    c.lerp(rim, char);
    // little fat specks
    if (t < 0.7 && hash(i * 0.37, 1.7) > 0.93) c.lerp(new THREE.Color("#d7774a"), 0.6);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

function basilGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.2);
  s.quadraticCurveTo(0.15, -0.06, 0.01, 0.21);
  s.quadraticCurveTo(-0.15, -0.04, 0, -0.2);
  const geo = new THREE.ShapeGeometry(s, 10);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.9 * p.getX(i) ** 2 - 0.15 * p.getZ(i) ** 2); // cupped, wilted
  geo.computeVertexNormals();
  return geo;
}

type Mats = Record<"dough" | "sauce" | "cheese" | "drip" | "crust" | "crumb" | "pep" | "basil", THREE.Material>;
type Shared = { pep: THREE.BufferGeometry; basil: THREE.BufferGeometry; drip: THREE.BufferGeometry };

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function buildWedge(a0: number, a1: number, mats: Mats, shared: Shared, spots: { peps: Spot[]; basil: Spot[] }, rand: () => number) {
  const span = a1 - a0;
  const g = new THREE.Group();

  // Dough base
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const segs = Math.ceil(span * 24);
  for (let i = 0; i <= segs; i++) {
    const a = a0 + (span * i) / segs;
    shape.lineTo(Math.cos(a) * (R - 0.04), Math.sin(a) * (R - 0.04));
  }
  shape.lineTo(0, 0);
  const dough = new THREE.ExtrudeGeometry(shape, { depth: DOUGH_T, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 4 });
  dough.rotateX(Math.PI / 2);
  dough.computeBoundingBox();
  dough.translate(0, 0.03 - dough.boundingBox!.max.y, 0);
  g.add(mesh(dough, mats.dough));

  // Sauce layer (shows as a red seam at the cut)
  const sauceShape = new THREE.Shape();
  sauceShape.moveTo(0, 0);
  for (let i = 0; i <= segs; i++) {
    const a = a0 + (span * i) / segs;
    sauceShape.lineTo(Math.cos(a) * (R - 0.2), Math.sin(a) * (R - 0.2));
  }
  const sauce = new THREE.ShapeGeometry(sauceShape);
  sauce.rotateX(Math.PI / 2);
  sauce.translate(0, 0.04, 0);
  g.add(mesh(sauce, mats.sauce));

  // Cheese: polar grid, displaced, slumping down at the cut edges.
  const nr = 30, na = Math.max(8, Math.ceil(span * 30));
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nr; i++) {
    const r = CHEESE_R * (i / nr);
    for (let j = 0; j <= na; j++) {
      const a = a0 + (span * j) / na;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const edge = Math.min(r * (a - a0), r * (a1 - a));
      const fall = smooth(0, 0.16, edge);
      pos.push(x, 0.035 + (cheeseY(x, z) - 0.035) * fall, z);
      uv.push(x / (2 * R) + 0.5, z / (2 * R) + 0.5);
    }
  }
  for (let i = 0; i < nr; i++)
    for (let j = 0; j < na; j++) {
      const a = i * (na + 1) + j, b = a + na + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const cheese = new THREE.BufferGeometry();
  cheese.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  cheese.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  cheese.setIndex(idx);
  cheese.computeVertexNormals();
  g.add(mesh(cheese, mats.cheese));

  // Cornicione: torus arc with lumpy, puffy displacement.
  const tub = Math.ceil(span * 36);
  const crust = new THREE.TorusGeometry(CRUST_C, CRUST_R, 18, tub, span);
  crust.rotateX(-Math.PI / 2).rotateY(-a1);
  const cp = crust.attributes.position;
  const v = new THREE.Vector3(), c = new THREE.Vector3(), off = new THREE.Vector3();
  for (let i = 0; i < cp.count; i++) {
    v.fromBufferAttribute(cp, i);
    const al = Math.atan2(v.z, v.x);
    c.set(Math.cos(al) * CRUST_C, 0, Math.sin(al) * CRUST_C);
    off.subVectors(v, c);
    const radial = off.x * Math.cos(al) + off.z * Math.sin(al);
    const phi = Math.atan2(off.y, radial);
    const bulge = 1 + 0.5 * (fbm(Math.cos(al) * 2.6 + 11, Math.sin(al) * 2.6) - 0.5);
    const lumps = 1 + 0.22 * (fbm(Math.cos(al) * 7 + Math.cos(phi), Math.sin(al) * 7 + Math.sin(phi) + 5) - 0.5);
    off.multiplyScalar(bulge * lumps);
    off.y *= 0.82;
    if (off.y < -CRUST_R * 0.4) off.y = -CRUST_R * 0.4 + (off.y + CRUST_R * 0.4) * 0.3; // flat bottom on the oven floor
    v.copy(c).add(off);
    v.y += CRUST_LIFT;
    cp.setXYZ(i, v.x, v.y, v.z);
  }
  const cuv = crust.attributes.uv;
  const rep = Math.max(1, Math.round((span * CRUST_C) / 2.2));
  for (let i = 0; i < cuv.count; i++) cuv.setX(i, cuv.getX(i) * rep);
  crust.computeVertexNormals();
  g.add(mesh(crust, mats.crust));

  // Cut ends of the rim show the airy crumb.
  for (const a of [a0, a1]) {
    const cap = new THREE.SphereGeometry(CRUST_R * 0.86, 20, 14);
    cap.scale(0.8, 0.78, 0.8);
    cap.translate(Math.cos(a) * CRUST_C, CRUST_LIFT - 0.01, Math.sin(a) * CRUST_C);
    g.add(mesh(cap, mats.crumb));
  }

  // Toppings sit on the cheese surface.
  for (const p of spots.peps) {
    if (!inWedge(p.x, p.z, a0, span, PEP_R * p.s + 0.03)) continue;
    const m = mesh(shared.pep, mats.pep);
    m.position.set(p.x, cheeseY(p.x, p.z) - 0.012, p.z);
    m.rotation.set((rand() - 0.5) * 0.12, p.rot, (rand() - 0.5) * 0.12);
    m.scale.set(p.s * (0.95 + rand() * 0.1), p.s, p.s * (0.95 + rand() * 0.1));
    g.add(m);
  }
  for (const p of spots.basil) {
    if (!inWedge(p.x, p.z, a0, span, 0.22 * p.s + 0.03)) continue;
    const m = mesh(shared.basil, mats.basil);
    m.position.set(p.x, cheeseY(p.x, p.z) + 0.03, p.z);
    m.rotation.y = p.rot;
    m.scale.setScalar(p.s);
    g.add(m);
  }

  // Molten cheese hanging over both cut edges.
  for (const [a, sgn] of [[a0, -1], [a1, 1]] as const) {
    const nx = -Math.sin(a) * sgn, nz = Math.cos(a) * sgn;
    for (let i = 0; i < 4; i++) {
      const r = 0.35 + rand() * (CHEESE_R - 0.7);
      const len = 0.5 + rand() * 1.1;
      const m = mesh(shared.drip, mats.drip);
      m.scale.set(0.55 + rand() * 0.35, len, 0.55 + rand() * 0.3);
      m.position.set(Math.cos(a) * r + nx * 0.02, 0.02 - 0.06 * len, Math.sin(a) * r + nz * 0.02);
      g.add(m);
    }
  }
  return g;
}

/** Bake transforms, flop the tip down like a real NY slice, re-center on the pivot. */
function bendSlice(group: THREE.Group, pivot: THREE.Vector3) {
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.updateMatrix();
    const geo = (o.geometry as THREE.BufferGeometry).clone();
    geo.applyMatrix4(o.matrix);
    o.position.set(0, 0, 0);
    o.rotation.set(0, 0, 0);
    o.scale.set(1, 1, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const t = Math.max(0, 1 - Math.hypot(x, z) / R);
      p.setXYZ(i, x - pivot.x, y - DROOP * Math.pow(t, 2.1) - pivot.y, z - pivot.z);
    }
    geo.computeVertexNormals();
    o.geometry = geo;
  });
}

export function bendPoint(v: THREE.Vector3, pivot: THREE.Vector3) {
  const t = Math.max(0, 1 - Math.hypot(v.x, v.z) / R);
  return v.set(v.x - pivot.x, v.y - DROOP * Math.pow(t, 2.1) - pivot.y, v.z - pivot.z);
}

// ── cheese strands ───────────────────────────────────────────────
export class Strands {
  readonly mesh: THREE.Mesh;
  private readonly seg = 24;
  private readonly rad = 8;
  private readonly pos: THREE.BufferAttribute;
  private readonly nor: THREE.BufferAttribute;
  private tmp = { p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3() };

  constructor(readonly count: number, material: THREE.Material) {
    const verts = count * (this.seg + 1) * this.rad;
    this.pos = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
    this.nor = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
    this.pos.setUsage(THREE.DynamicDrawUsage);
    this.nor.setUsage(THREE.DynamicDrawUsage);
    const idx: number[] = [];
    for (let s = 0; s < count; s++) {
      const base = s * (this.seg + 1) * this.rad;
      for (let i = 0; i < this.seg; i++)
        for (let j = 0; j < this.rad; j++) {
          const a = base + i * this.rad + j, b = base + i * this.rad + ((j + 1) % this.rad);
          idx.push(a, a + this.rad, b, b, a + this.rad, b + this.rad);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", this.pos);
    geo.setAttribute("normal", this.nor);
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
  }

  update(pairs: [THREE.Vector3, THREE.Vector3, number][], time: number) {
    const { p, t, n, b, c, d } = this.tmp;
    let k = 0;
    for (let s = 0; s < this.count; s++) {
      const [A, B, r0] = pairs[s];
      const dist = A.distanceTo(B);
      // Control point sags under gravity and sways a little.
      c.addVectors(A, B).multiplyScalar(0.5);
      c.y -= 0.12 + dist * 0.22;
      c.x += Math.sin(time * 1.6 + s * 1.7) * 0.05 * dist;
      c.z += Math.cos(time * 1.3 + s) * 0.04 * dist;
      const stretch = Math.min(1, Math.max(0.18, 1.25 - dist * 0.28));
      for (let i = 0; i <= this.seg; i++) {
        const u = i / this.seg, iu = 1 - u;
        p.set(0, 0, 0).addScaledVector(A, iu * iu).addScaledVector(c, 2 * iu * u).addScaledVector(B, u * u);
        t.set(0, 0, 0).addScaledVector(d.subVectors(c, A), 2 * iu).addScaledVector(d.subVectors(B, c), 2 * u).normalize();
        n.set(1, 0, 0);
        if (Math.abs(t.x) > 0.9) n.set(0, 0, 1);
        b.crossVectors(t, n).normalize();
        n.crossVectors(b, t).normalize();
        const rr = dist < 0.04 ? 0 : r0 * stretch * (0.28 + 0.72 * Math.pow(Math.abs(2 * u - 1), 1.7));
        for (let j = 0; j < this.rad; j++) {
          const th = (j / this.rad) * Math.PI * 2;
          const cx = Math.cos(th), sx = Math.sin(th);
          const nx = n.x * cx + b.x * sx, ny = n.y * cx + b.y * sx, nz = n.z * cx + b.z * sx;
          this.pos.setXYZ(k, p.x + nx * rr, p.y + ny * rr, p.z + nz * rr);
          this.nor.setXYZ(k, nx, ny, nz);
          k++;
        }
      }
    }
    this.pos.needsUpdate = true;
    this.nor.needsUpdate = true;
  }
}

// ── assemble ─────────────────────────────────────────────────────
export type Pizza = {
  root: THREE.Group;
  slice: THREE.Group;
  pivot: THREE.Vector3;
  mid: number;
  strandAnchors: { pie: THREE.Vector3; slice: THREE.Vector3; r: number }[];
  strands: Strands;
  dispose: () => void;
};

export function buildPizza(seed = 2006): Pizza {
  const rand = rng(seed);
  const mid = (Math.PI * 8) / 9; // the slice comes out toward the viewer's left
  const half = Math.PI / 8; // 8-cut pie
  const gap = 0.006;
  const spots = layout(rand, mid);
  const tex = makeTextures(rand, spots.peps);

  const strandMat = new THREE.MeshPhysicalMaterial({ color: "#f2cf78", emissive: "#5a3300", emissiveIntensity: 0.35, roughness: 0.36, clearcoat: 0.5, sheen: 0.4, sheenColor: new THREE.Color("#ffe3a0"), side: THREE.DoubleSide });
  const mats: Mats = {
    drip: strandMat,
    dough: new THREE.MeshStandardMaterial({ color: "#cf9449", roughness: 0.92, bumpMap: tex.crumbBump, bumpScale: 1.2 }),
    sauce: new THREE.MeshPhysicalMaterial({ color: "#a2190f", roughness: 0.32, clearcoat: 0.6, side: THREE.DoubleSide }),
    cheese: new THREE.MeshPhysicalMaterial({
      map: tex.cheeseMap, bumpMap: tex.cheeseBump, bumpScale: 1.6, roughness: 0.4,
      clearcoat: 0.55, clearcoatRoughness: 0.28, sheen: 0.35, sheenColor: new THREE.Color("#ffd98a"), sheenRoughness: 0.5,
    }),
    crust: new THREE.MeshStandardMaterial({ map: tex.crustMap, bumpMap: tex.crustBump, bumpScale: 2.5, roughness: 0.84 }),
    crumb: new THREE.MeshStandardMaterial({ color: "#d9b77a", roughness: 0.97, bumpMap: tex.crumbBump, bumpScale: 4, envMapIntensity: 0.4 }),
    pep: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.36, clearcoat: 0.95, clearcoatRoughness: 0.22 }),
    basil: new THREE.MeshPhysicalMaterial({ color: "#2a561b", roughness: 0.38, clearcoat: 0.7, side: THREE.DoubleSide }),
  };
  const drip = new THREE.CapsuleGeometry(0.035, 0.08, 4, 8);
  const shared: Shared = { pep: pepperoniGeometry(), basil: basilGeometry(), drip };

  const root = new THREE.Group();
  const pie = buildWedge(mid + half + gap, mid - half - gap + Math.PI * 2, mats, shared, spots, rand);
  root.add(pie);

  const slice = buildWedge(mid - half + gap, mid + half - gap, mats, shared, spots, rand);
  const pivot = new THREE.Vector3(Math.cos(mid) * CRUST_C, 0, Math.sin(mid) * CRUST_C);
  bendSlice(slice, pivot);
  slice.position.copy(pivot);
  slice.matrixAutoUpdate = true;
  root.add(slice);

  // Cheese strands connect matching points on the slice's cut edges and the pie's.
  const strandAnchors: Pizza["strandAnchors"] = [];
  const edgePts: [number, number, number][] = [
    [mid - half, 0.32, 0.06], [mid - half, 0.6, 0.048], [mid - half, 0.92, 0.04], [mid - half, 1.25, 0.032],
    [mid + half, 0.38, 0.058], [mid + half, 0.7, 0.045], [mid + half, 1.05, 0.036],
    [mid, 0.14, 0.075], [mid - 0.1, 0.3, 0.055], [mid + 0.09, 0.26, 0.05], [mid + 0.02, 0.45, 0.04],
  ];
  for (const [a, r, th] of edgePts) {
    const pt = new THREE.Vector3(Math.cos(a) * r, 0.05, Math.sin(a) * r);
    strandAnchors.push({ pie: pt.clone(), slice: bendPoint(pt.clone(), pivot), r: th });
  }
  const strands = new Strands(strandAnchors.length, strandMat);
  root.add(strands.mesh);

  return {
    root, slice, pivot, mid, strandAnchors, strands,
    dispose: () => {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
      Object.values(tex).forEach((t) => t.dispose());
      Object.values(shared).forEach((g) => g.dispose());
    },
  };
}
