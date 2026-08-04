import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * Real dice, not pictures of dice.
 *
 * A d4 is a tetrahedron and a d20 an icosahedron, so the geometry comes straight
 * out of Three.js — there is nothing to model.
 *
 * The die is blank while it tumbles and the number is painted onto the face that
 * ends up facing the camera once it settles. That keeps the result unmistakable:
 * there is exactly one number on the whole solid and it is square to the viewer.
 *
 * The roll is animated rather than simulated. The value is already decided by
 * the time we get here (crypto-random, in dice.ts), so the die tumbles freely
 * and then settles onto the face that was rolled. A physics simulation would
 * have to be read backwards to find its own result, which is both slower and
 * able to disagree with the number the app already committed to.
 */

interface Die3DProps {
  sides: 4 | 20;
  /** The face to land on. Null leaves the die blank and idling. */
  value: number | null;
  rolling: boolean;
  size?: number;
}

const INK = '#241508';
const BONE = '#efe0c0';

/** Where the centroid of the apex-up face triangle falls inside its atlas cell. */
const FACE_CENTROID_Y = 0.6;

/**
 * A face pointing straight at the camera renders as a flat outline, so the die
 * is tipped a little on landing to let its neighbours catch the light.
 *
 * How far it can be tipped depends on the solid. Adjacent faces sit about 70
 * degrees apart on a tetrahedron but only 42 apart on an icosahedron, so the
 * same tilt that gives a d4 depth would swing a d20's numbered face almost as
 * far from the camera as the face beside it.
 */
const LANDING_TILT: Record<number, THREE.Quaternion> = {
  4: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0.34, 0)),
  20: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0.14, 0)),
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Points every face's UVs at its own atlas cell. */
function applyFaceUVs(geometry: THREE.BufferGeometry, faces: number, cols: number, rows: number): void {
  const su = 1 / cols;
  const sv = 1 / rows;

  // A triangle inscribed in the cell, apex upward.
  const local: [number, number][] = [
    [0.5, 0.94],
    [0.04, 0.13],
    [0.96, 0.13],
  ];

  const uv: number[] = [];
  for (let f = 0; f < faces; f += 1) {
    const col = f % cols;
    const row = Math.floor(f / cols);
    const u0 = col * su;
    // Canvas rows run downward while v runs upward, so flip the row.
    const v0 = 1 - (row + 1) * sv;
    for (const [lu, lv] of local) uv.push(u0 + lu * su, v0 + lv * sv);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}

/**
 * For each face: the way it points, and where its apex vertex sits. The apex is
 * the corner the glyph's "up" is drawn towards, so knowing it lets the die land
 * with the number upright rather than at whatever angle the mesh happened to
 * order its vertices.
 */
function faceFrames(geometry: THREE.BufferGeometry, faces: number) {
  const pos = geometry.getAttribute('position');
  const normals: THREE.Vector3[] = [];
  const apexes: THREE.Vector3[] = [];

  for (let f = 0; f < faces; f += 1) {
    const c = new THREE.Vector3();
    for (let v = 0; v < 3; v += 1) {
      c.add(new THREE.Vector3().fromBufferAttribute(pos, f * 3 + v));
    }
    // The solids are centred on the origin, so the centroid points outward.
    normals.push(c.divideScalar(3).normalize());
    // Vertex 0 is the one the UV triangle puts at the top.
    apexes.push(new THREE.Vector3().fromBufferAttribute(pos, f * 3));
  }
  return { normals, apexes };
}

/** The orientation that shows `faceIndex` to the camera, glyph upright. */
function landingFor(
  faceIndex: number,
  normals: THREE.Vector3[],
  apexes: THREE.Vector3[],
  tilt: THREE.Quaternion,
): THREE.Quaternion {
  const forward = new THREE.Vector3(0, 0, 1);
  const squareOn = new THREE.Quaternion().setFromUnitVectors(normals[faceIndex], forward);

  // Once the face is square on, spin about the view axis until its apex is up.
  const apex = apexes[faceIndex].clone().applyQuaternion(squareOn);
  const twist = new THREE.Quaternion().setFromAxisAngle(forward, Math.atan2(apex.x, apex.y));

  return squareOn.premultiply(twist).premultiply(tilt);
}

export function Die3D({ sides, value, rolling, size = 96 }: Die3DProps) {
  const mount = useRef<HTMLDivElement>(null);
  const dieRef = useRef<THREE.Mesh | null>(null);
  const normalsRef = useRef<THREE.Vector3[]>([]);
  const apexRef = useRef<THREE.Vector3[]>([]);
  const paintRef = useRef<(face: number | null, shown: number | null) => void>(() => {});
  /** Where the die came to rest. The idle drift is layered on top of this. */
  const restRef = useRef(new THREE.Quaternion());
  const tiltRef = useRef(new THREE.Quaternion());
  const rollingRef = useRef(rolling);
  rollingRef.current = rolling;
  // Read when the scene is built, so a remount keeps whatever was last shown.
  const valueRef = useRef(value);
  valueRef.current = value;

  // Build the scene once. Rolls only nudge the mesh that already exists.
  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const faces = sides;
    const cols = Math.ceil(Math.sqrt(faces));
    const rows = Math.ceil(faces / cols);
    const cell = 256;

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
    applyFaceUVs(geometry, faces, cols, rows);
    const frames = faceFrames(geometry, faces);
    normalsRef.current = frames.normals;
    apexRef.current = frames.apexes;

    const canvas = document.createElement('canvas');
    canvas.width = cols * cell;
    canvas.height = rows * cell;
    const ctx = canvas.getContext('2d')!;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    /** Blanks the die, then writes one number onto one face. */
    const paint = (face: number | null, shown: number | null) => {
      ctx.fillStyle = BONE;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (face !== null && shown !== null) {
        const col = face % cols;
        const row = Math.floor(face / cols);
        // The face is a triangle with its apex up, so the widest part sits low.
        // Drawing at the centroid keeps the glyph clear of the sloping edges.
        const cx = col * cell + cell / 2;
        const cy = row * cell + cell * FACE_CENTROID_Y;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = INK;
        ctx.font = `700 ${shown >= 10 ? 96 : 118}px Georgia, serif`;
        ctx.fillText(String(shown), cx, cy);

        // 6 and 9 read the same upside down, so they get the traditional bar.
        if (shown === 6 || shown === 9) {
          ctx.fillRect(cx - 30, cy + 56, 60, 9);
        }
      }
      texture.needsUpdate = true;
    };
    paintRef.current = paint;

    // A die on a table always shows a face. Before anything has been rolled it
    // rests on its highest number, which doubles as a label for which die it is.
    // Face 0 is the one the resting orientation presents, so the number goes there.
    paint(0, valueRef.current ?? sides);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
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

    // Rest exactly as a landed die sits.
    tiltRef.current = LANDING_TILT[sides];
    restRef.current.copy(landingFor(0, frames.normals, frames.apexes, tiltRef.current));
    die.quaternion.copy(restRef.current);

    let idle = 0;
    let frame = 0;
    const drift = new THREE.Quaternion();
    const axis = new THREE.Vector3(0, 1, 0);
    const render = () => {
      if (!rollingRef.current) {
        idle += 0.006;
        // A slow sway so it reads as an object rather than a picture. It is
        // composed onto the resting orientation rather than assigned, because
        // writing .rotation rebuilds the quaternion and would throw away the
        // face the die landed on.
        drift.setFromAxisAngle(axis, Math.sin(idle) * 0.07);
        die.quaternion.copy(restRef.current).multiply(drift);
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      dieRef.current = null;
      paintRef.current = () => {};
    };
  }, [sides, size]);

  // Tumble blank, then settle and reveal the number on the face now facing us.
  useEffect(() => {
    const die = dieRef.current;
    const normals = normalsRef.current;
    if (!die || !rolling || value === null || normals.length === 0) return;

    const faceIndex = (value - 1) % normals.length;
    // Blank it for the tumble; the result is written back on when it settles.
    paintRef.current(null, null);

    const target = landingFor(faceIndex, normals, apexRef.current, tiltRef.current);
    const tumbleEnd = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.random() * 8 + 6, Math.random() * 8 + 6, Math.random() * 4 + 2),
    );
    const start = die.quaternion.clone();

    const duration = 900;
    const began = performance.now();
    let frame = 0;

    const step = () => {
      const t = Math.min(1, (performance.now() - began) / duration);
      if (t < 0.55) {
        // Free tumble.
        die.quaternion.slerpQuaternions(start, tumbleEnd, t / 0.55);
      } else {
        // Settle onto the face that was rolled.
        die.quaternion.slerpQuaternions(tumbleEnd, target, easeOut((t - 0.55) / 0.45));
      }

      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        restRef.current.copy(target);
        die.quaternion.copy(target);
        paintRef.current(faceIndex, value);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rolling, value]);

  return <div className="die-3d" ref={mount} style={{ width: size, height: size }} aria-hidden="true" />;
}
