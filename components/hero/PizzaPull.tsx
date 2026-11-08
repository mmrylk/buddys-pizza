"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildPizza, R } from "./pizza";

const easeOutBack = (x: number) => {
  const c1 = 1.25, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeInCubic = (x: number) => x * x * x;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const DROP = 0.45; // seconds to drop the slice back in on click
const PULL = 1.8; // seconds to pull it out again

/** Soft steam wisps rising off the pie. */
function Steam({ count = 28 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(Math.random() - 0.5) * 3.4, 0, (Math.random() - 0.5) * 2], i * 3);
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPx: { value: 1 } }), []);
  const { gl } = useThree();
  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += dt;
    mat.current.uniforms.uPx.value = gl.getPixelRatio();
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float aSeed;
          uniform float uTime; uniform float uPx;
          varying float vLife; varying float vSeed;
          void main(){
            float life = fract(uTime * (0.07 + aSeed * 0.06) + aSeed);
            vLife = life; vSeed = aSeed;
            vec3 p = position;
            p.y += 0.3 + life * 3.2;
            p.x += sin(life * 5.0 + aSeed * 30.0) * 0.35 * life;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (60.0 + life * 160.0) * uPx * (4.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          varying float vLife; varying float vSeed;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float wisp = n(uv * 4.0 + vSeed * 17.0 + vLife * 2.0) * 0.7 + n(uv * 9.0 - vSeed * 5.0) * 0.3;
            float a = smoothstep(0.5, 0.05, d) * smoothstep(0.25, 0.75, wisp);
            a *= sin(vLife * 3.14159) * 0.16;
            gl_FragColor = vec4(1.0, 0.95, 0.86, a);
          }
        `}
      />
    </points>
  );
}

/**
 * A whole brick-oven pie with one slice being pulled out of it: drooping NY tip,
 * stretching cheese strands, steam. Leans toward the pointer; click to re-pull.
 */
export function PizzaPull({ calm }: { calm: boolean }) {
  const { viewport, pointer, gl, scene, invalidate } = useThree();
  const pizza = useMemo(() => buildPizza(), []);
  const tilt = useRef<THREE.Group>(null);
  const pullStart = useRef<number | null>(null);
  const kAtClick = useRef(1);
  const k = useRef(0);
  const time = useRef(0);
  const scratch = useMemo(
    () => ({
      q: new THREE.Quaternion(),
      inv: new THREE.Quaternion(),
      cam: new THREE.Vector3(),
      wUp: new THREE.Vector3(),
      wRight: new THREE.Vector3(),
      nT: new THREE.Vector3(),
      rT: new THREE.Vector3(),
      tT: new THREE.Vector3(),
      target: new THREE.Vector3(),
      mT: new THREE.Matrix4(),
      // Slice's own frame (crust direction, top normal, rim tangent), inverted.
      mSrcT: new THREE.Matrix4()
        .makeBasis(
          new THREE.Vector3(Math.cos(pizza.mid), 0, Math.sin(pizza.mid)),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(-Math.sin(pizza.mid), 0, Math.cos(pizza.mid)),
        )
        .transpose(),
      radial: new THREE.Vector3(Math.cos(pizza.mid), 0, Math.sin(pizza.mid)),
      pairs: pizza.strandAnchors.map((a) => [a.pie, new THREE.Vector3(), a.r] as [THREE.Vector3, THREE.Vector3, number]),
    }),
    [pizza],
  );

  useEffect(() => () => pizza.dispose(), [pizza]);

  // Soft studio reflections so cheese, oil and pepperoni read as wet, not plastic.
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.32;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, invalidate]);

  // Layout: right-hand side on wide screens (clear of the headline and CTAs),
  // tucked into the top-right corner on phones.
  const aspect = viewport.width / viewport.height;
  const wide = aspect >= 1.15;
  const s = wide ? Math.min(0.56, viewport.height * 0.11, viewport.width * 0.075) : Math.min(0.36, viewport.width * 0.13);
  const x = wide ? viewport.width / 2 - R * s * 0.98 : viewport.width / 2 - R * s * 0.82;
  const y = wide ? -viewport.height * 0.06 : viewport.height / 2 - R * s * 0.55 - 1.05;

  useFrame((_, delta) => {
    // Own clock, clamped so a backgrounded tab doesn't jump the animation.
    time.current += Math.min(0.1, Math.max(0, delta));
    const t = time.current;
    if (pullStart.current === null) pullStart.current = t - (calm ? DROP + PULL : DROP);
    const age = t - pullStart.current;
    k.current = age < DROP ? kAtClick.current * (1 - easeInCubic(age / DROP)) : easeOutBack(clamp01((age - DROP) / PULL));
    const kk = k.current;
    const breathe = calm ? 0 : Math.sin(t * 1.2) * 0.06 * kk;

    // Slice: held up by the crust, top facing the viewer, tip dangling over the gap.
    // Target orientation is built from the camera direction in pie space, so the
    // slice stays readable while the pie leans with the pointer.
    const { slice, pivot } = pizza;
    const g = tilt.current;
    const sc = scratch;
    if (g) sc.inv.copy(g.quaternion).invert();
    sc.cam.set(0, 0, 1).applyQuaternion(sc.inv);
    sc.wUp.set(0, 1, 0).applyQuaternion(sc.inv);
    sc.wRight.set(1, 0, 0).applyQuaternion(sc.inv);
    sc.nT.copy(sc.cam).multiplyScalar(0.82).addScaledVector(sc.wUp, 0.3).normalize();
    const lean = 0.38 + Math.sin(t * 0.7) * 0.05; // crust leans left, tip toward the pie
    sc.rT.copy(sc.wUp).multiplyScalar(Math.cos(lean)).addScaledVector(sc.wRight, -Math.sin(lean));
    sc.rT.addScaledVector(sc.nT, -sc.rT.dot(sc.nT)).normalize();
    sc.tT.crossVectors(sc.rT, sc.nT);
    sc.mT.makeBasis(sc.rT, sc.nT, sc.tT).multiply(sc.mSrcT);
    sc.q.setFromRotationMatrix(sc.mT);
    slice.quaternion.identity().slerp(sc.q, clamp01(kk));
    // Tip hovers just above the hole; crust sits a slice-length above it.
    sc.target.copy(sc.radial).multiplyScalar(0.95).setY(0.45 + breathe).addScaledVector(sc.rT, 2.35);
    slice.position.copy(pivot).lerp(sc.target, kk);
    slice.updateMatrix();

    // Strands follow the slice.
    pizza.strandAnchors.forEach((a, i) => scratch.pairs[i][1].copy(a.slice).applyMatrix4(slice.matrix));
    pizza.strands.update(scratch.pairs, t);

    // Whole pie leans toward the pointer.
    if (g) {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.6 - pointer.y * 0.1, 0.05);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, 0.15 + pointer.x * 0.25, 0.05);
    }
  });

  // Click: drop the slice back into the pie, then pull it out again.
  const repull = () => {
    if (pullStart.current === null || calm) return;
    kAtClick.current = k.current;
    pullStart.current = time.current;
  };

  return (
    <group position={[x, y, 0]} scale={s}>
      <group
        ref={tilt}
        rotation={[0.6, 0.15, 0]}
        onClick={(e) => {
          e.stopPropagation();
          repull();
        }}
      >
        <primitive object={pizza.root} />
      </group>
      {!calm && <Steam />}
    </group>
  );
}
