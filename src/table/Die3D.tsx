import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * Real dice, not pictures of dice.
 *
 * A d4 is a tetrahedron and a d20 an icosahedron, so the geometry comes straight
 * out of Three.js — there is nothing to model. The faces are numbered by
 * painting an atlas at runtime and pointing each face's UVs at its own cell.
 *
 * The roll is animated rather than simulated. The value is already decided by
 * the time we get here (crypto-random, in dice.ts), so the die tumbles freely
 * and then settles onto the face that was rolled. A physics simulation would
 * have to be read backwards to find its own result, which is both slower and
 * able to disagree with the number the app already committed to.
 */

interface Die3DProps {
  sides: 4 | 20;
  /** The face to land on. Null leaves the die idling. */
  value: number | null;
  rolling: boolean;
  size?: number;
}

const INK = '#2b1a0e';
const BONE = '#efe0c0';

/** Numbers 1..faces laid out in a grid, one cell per face. */
function makeNumberAtlas(faces: number): THREE.CanvasTexture {
  const cols = Math.ceil(Math.sqrt(faces));
  const rows = Math.ceil(faces / cols);
  const cell = 256;

  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = BONE;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;

  for (let i = 0; i < faces; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = col * cell + cell / 2;
    const cy = row * cell + cell * 0.52;
    const n = i + 1;

    ctx.font = `700 ${n >= 10 ? 104 : 124}px Georgia, serif`;
    ctx.fillText(String(n), cx, cy);

    // 6 and 9 are ambiguous on a die, so they get the traditional underline.
    if (n === 6 || n === 9) {
      ctx.fillRect(cx - 30, cy + 62, 60, 9);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Points every face's UVs at its own atlas cell. */
function applyFaceUVs(geometry: THREE.BufferGeometry, faces: number): void {
  const cols = Math.ceil(Math.sqrt(faces));
  const rows = Math.ceil(faces / cols);
  const su = 1 / cols;
  const sv = 1 / rows;

  // A triangle inscribed in the cell, apex upward.
  const local: [number, number][] = [
    [0.5, 0.9],
    [0.07, 0.17],
    [0.93, 0.17],
  ];

  const uv: number[] = [];
  for (let f = 0; f < faces; f += 1) {
    const col = f % cols;
    const row = Math.floor(f / cols);
    const u0 = col * su;
    // Canvas rows run downward while v runs upward, so flip the row.
    const v0 = 1 - (row + 1) * sv;
    for (const [lu, lv] of local) {
      uv.push(u0 + lu * su, v0 + lv * sv);
    }
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}

/** The outward direction of each face, used to work out which way to land. */
function faceNormals(geometry: THREE.BufferGeometry, faces: number): THREE.Vector3[] {
  const pos = geometry.getAttribute('position');
  const normals: THREE.Vector3[] = [];
  for (let f = 0; f < faces; f += 1) {
    const c = new THREE.Vector3();
    for (let v = 0; v < 3; v += 1) {
      c.add(new THREE.Vector3().fromBufferAttribute(pos, f * 3 + v));
    }
    // The solids are centred on the origin, so the centroid points outward.
    normals.push(c.divideScalar(3).normalize());
  }
  return normals;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function Die3D({ sides, value, rolling, size = 96 }: Die3DProps) {
  const mount = useRef<HTMLDivElement>(null);
  const dieRef = useRef<THREE.Mesh | null>(null);
  const normalsRef = useRef<THREE.Vector3[]>([]);
  const animRef = useRef<number>(0);

  // Build the scene once. Rolls only nudge the mesh that already exists.
  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const faces = sides;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Let three set the CSS size too, or the canvas lays out at its backing-store
    // size and overruns the card on a high-DPI screen.
    renderer.setSize(size, size);
    host.appendChild(renderer.domElement);

    const geometry =
      sides === 4 ? new THREE.TetrahedronGeometry(1.35) : new THREE.IcosahedronGeometry(1.25, 0);
    geometry.clearGroups();
    applyFaceUVs(geometry, faces);
    normalsRef.current = faceNormals(geometry, faces);

    const texture = makeNumberAtlas(faces);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.62,
      metalness: 0.12,
      flatShading: true,
    });

    const die = new THREE.Mesh(geometry, material);
    dieRef.current = die;
    scene.add(die);

    // Warm key light from the upper left, matching the candlelight on the page.
    scene.add(new THREE.AmbientLight(0xffe6c0, 1.5));
    const key = new THREE.DirectionalLight(0xffd9a0, 2.4);
    key.position.set(-2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88b4ff, 0.7);
    rim.position.set(3, -2, -2);
    scene.add(rim);

    // Rest showing face 1 so the die never starts on a seam.
    const rest = new THREE.Quaternion().setFromUnitVectors(
      normalsRef.current[0],
      new THREE.Vector3(0, 0, 1),
    );
    die.quaternion.copy(rest);

    let idle = 0;
    const render = () => {
      idle += 0.004;
      if (!rollingRef.current) {
        // A slow drift so it reads as an object rather than a picture.
        die.rotation.z = Math.sin(idle) * 0.05;
      }
      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      dieRef.current = null;
    };
  }, [sides, size]);

  // Kept in a ref so the render loop can see it without restarting.
  const rollingRef = useRef(rolling);
  rollingRef.current = rolling;

  // Tumble, then settle on the rolled face.
  useEffect(() => {
    const die = dieRef.current;
    const normals = normalsRef.current;
    if (!die || !rolling || value === null || normals.length === 0) return;

    const target = new THREE.Quaternion().setFromUnitVectors(
      normals[(value - 1) % normals.length],
      new THREE.Vector3(0, 0, 1),
    );

    const spin = new THREE.Euler(
      Math.random() * 8 + 6,
      Math.random() * 8 + 6,
      Math.random() * 4 + 2,
    );
    const start = die.quaternion.clone();
    const tumbleEnd = new THREE.Quaternion().setFromEuler(spin);

    const duration = 900;
    const began = performance.now();
    let frame = 0;

    const step = () => {
      const t = Math.min(1, (performance.now() - began) / duration);
      if (t < 0.55) {
        // Free tumble, still gathering speed then holding it.
        die.quaternion.slerpQuaternions(start, tumbleEnd, t / 0.55);
      } else {
        // Settle onto the face that was rolled.
        const s = easeOut((t - 0.55) / 0.45);
        die.quaternion.slerpQuaternions(tumbleEnd, target, s);
      }
      if (t < 1) frame = requestAnimationFrame(step);
      else die.quaternion.copy(target);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rolling, value]);

  return <div className="die-3d" ref={mount} style={{ width: size, height: size }} aria-hidden="true" />;
}
