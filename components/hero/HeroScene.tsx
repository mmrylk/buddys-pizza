"use client";
/**
 * Hero WebGL scene (React Three Fiber):
 *  1. FireField   – full-screen fbm fire + film-grain shader. When a background
 *                   video is playing it drops to a translucent heat/grain overlay.
 *  2. Embers      – GPU particles rising from the oven floor.
 *  3. PizzaPull   – procedural pie with a slice being pulled out (see pizza.ts).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PizzaPull } from "./PizzaPull";
import * as THREE from "three";

const noiseGLSL = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
`;

function FireField({ video }: { video: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { camera, size, viewport } = useThree();
  const vp = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, -3));
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uVideo: { value: 0 } }),
    [],
  );
  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += dt;
    mat.current.uniforms.uRes.value.set(size.width, size.height);
    const target = video ? 1 : 0;
    mat.current.uniforms.uVideo.value += (target - mat.current.uniforms.uVideo.value) * Math.min(1, dt * 2);
  });
  return (
    <mesh position={[0, 0, -3]} renderOrder={-1}>
      <planeGeometry args={[vp.width * 1.02, vp.height * 1.02]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform vec2 uRes; uniform float uVideo;
          varying vec2 vUv;
          ${noiseGLSL}
          void main(){
            vec2 uv = vUv;
            float aspect = uRes.x / max(uRes.y, 1.0);
            vec2 p = vec2(uv.x * aspect, uv.y);
            float t = uTime * 0.35;
            float warp = fbm(vec2(p.x * 3.0, p.y * 3.0 - t * 3.2));
            float n = fbm(vec2(p.x * 2.2, p.y * 1.8 - t * 2.4) + warp);
            float h = 1.0 - uv.y;
            float flame = clamp(n * (h * 1.5 + 0.08) * 1.55 - 0.18, 0.0, 1.0);
            vec3 coal = vec3(0.055, 0.045, 0.04);
            vec3 c1 = vec3(0.545, 0.0, 0.0);
            vec3 c2 = vec3(0.698, 0.133, 0.133);
            vec3 c3 = vec3(0.898, 0.663, 0.235);
            vec3 c4 = vec3(1.0, 0.92, 0.72);
            vec3 fire = mix(c1, c2, smoothstep(0.0, 0.3, flame));
            fire = mix(fire, c3, smoothstep(0.3, 0.7, flame));
            fire = mix(fire, c4, smoothstep(0.82, 1.0, flame));
            vec3 col = mix(coal, fire, smoothstep(0.02, 0.45, flame) * pow(h, 1.4));
            col += vec3(0.7, 0.18, 0.04) * 0.22 * pow(h, 3.0);
            float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(aspect * 0.75, 1.0)));
            col *= mix(0.45, 1.0, vig);
            float g = hash(floor(uv * uRes) + fract(uTime * 7.0) * 91.0) - 0.5;
            col += g * 0.05;
            float overlayA = 0.28 + 0.55 * flame * pow(h, 2.0) + (1.0 - vig) * 0.5;
            gl_FragColor = vec4(col, mix(1.0, overlayA, uVideo));
          }
        `}
      />
    </mesh>
  );
}

function Embers({ count = 380 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport, gl } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uH: { value: 10 }, uW: { value: 16 }, uPx: { value: 1 } }), []);
  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += dt;
    mat.current.uniforms.uH.value = viewport.height + 2;
    mat.current.uniforms.uW.value = viewport.width / 16;
    mat.current.uniforms.uPx.value = gl.getPixelRatio();
  });
  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float aSeed;
          uniform float uTime; uniform float uH; uniform float uW; uniform float uPx;
          varying float vSeed; varying float vLife;
          void main(){
            vec3 p = position;
            float speed = 0.35 + aSeed * 0.9;
            float y = mod(p.y + uTime * speed, uH);
            vLife = y / uH;
            p.y = y - uH * 0.5;
            p.x = p.x * uW + sin(uTime * (0.6 + aSeed) + aSeed * 40.0) * 0.35 * vLife;
            vSeed = aSeed;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.0 + aSeed * 7.0) * uPx * (6.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          varying float vSeed; varying float vLife;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            float flicker = 0.6 + 0.4 * sin(uTime * (6.0 + vSeed * 12.0) + vSeed * 30.0);
            vec3 col = mix(vec3(1.0, 0.78, 0.38), vec3(0.85, 0.18, 0.08), vLife);
            gl_FragColor = vec4(col, a * flicker * (1.0 - vLife) * 0.95);
          }
        `}
      />
    </points>
  );
}

export default function HeroScene({ video }: { video: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={!visible ? "never" : calm ? "demand" : "always"}
        dpr={[1, 1.75]}
        shadows="percentage"
        camera={{ position: [0, 0, 7], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <hemisphereLight args={["#ffe6c2", "#3a0d06", 0.55]} />
        <directionalLight
          position={[-3, 6, 6]}
          intensity={2.6}
          color="#fff0d8"
          castShadow
          shadow-mapSize={[1536, 1536]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
        />
        {/* Oven glow: hot rim light from behind/below */}
        <pointLight position={[5, -1, -2.5]} intensity={70} distance={16} color="#ff5a1f" />
        <pointLight position={[1, -4, 3]} intensity={28} distance={12} color="#ff8a3a" />
        <FireField video={video} />
        <Embers count={calm ? 0 : 380} />
        <PizzaPull calm={calm} />
      </Canvas>
    </div>
  );
}
