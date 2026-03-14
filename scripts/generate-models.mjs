// Generate multiple chibi character GLB models
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function f32(a) { return Buffer.from(new Float32Array(a).buffer); }
function u16(a) { return Buffer.from(new Uint16Array(a).buffer); }

function sphere(r, ws, hs, scaleY = 1, scaleX = 1, scaleZ = 1) {
  const p = [], n = [], idx = [];
  for (let y = 0; y <= hs; y++) {
    for (let x = 0; x <= ws; x++) {
      const u = x / ws, v = y / hs;
      const th = u * Math.PI * 2, ph = v * Math.PI;
      const px = -r * Math.cos(th) * Math.sin(ph) * scaleX;
      const py = r * Math.cos(ph) * scaleY;
      const pz = r * Math.sin(th) * Math.sin(ph) * scaleZ;
      p.push(px, py, pz);
      const l = Math.sqrt(px*px + py*py + pz*pz) || 1;
      n.push(px/l, py/l, pz/l);
    }
  }
  for (let y = 0; y < hs; y++)
    for (let x = 0; x < ws; x++) {
      const a = y * (ws+1) + x, b = a + ws + 1;
      idx.push(a, b, a+1, b, b+1, a+1);
    }
  return { positions: p, normals: n, indices: idx };
}

function cylinder(rt, rb, h, s) {
  const p = [], n = [], idx = [], hh = h/2;
  for (let i = 0; i <= s; i++) {
    const t = (i/s)*Math.PI*2, c = Math.cos(t), si = Math.sin(t);
    p.push(c*rt, hh, si*rt); n.push(c, 0, si);
    p.push(c*rb, -hh, si*rb); n.push(c, 0, si);
  }
  for (let i = 0; i < s; i++) { const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
  return { positions: p, normals: n, indices: idx };
}

function cone(r, h, s) { return cylinder(0.001, r, h, s); }

// Torus for donut-shaped ears
function torus(R, r, rs, ts) {
  const p = [], n = [], idx = [];
  for (let i = 0; i <= rs; i++) {
    for (let j = 0; j <= ts; j++) {
      const u = (i / rs) * Math.PI * 2;
      const v = (j / ts) * Math.PI * 2;
      const px = (R + r * Math.cos(v)) * Math.cos(u);
      const py = (R + r * Math.cos(v)) * Math.sin(u);
      const pz = r * Math.sin(v);
      p.push(px, py, pz);
      const nx = Math.cos(v) * Math.cos(u);
      const ny = Math.cos(v) * Math.sin(u);
      const nz = Math.sin(v);
      n.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < rs; i++)
    for (let j = 0; j < ts; j++) {
      const a = i * (ts + 1) + j, b = a + ts + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return { positions: p, normals: n, indices: idx };
}

function encodeGLB(parts) {
  const bd = []; const acc = [], bv = [], meshes = [], nodes = [];
  const mats = [{ pbrMetallicRoughness: { baseColorFactor: [1,1,1,1], metallicFactor: 0.0, roughnessFactor: 0.85 } }];
  let off = 0;

  parts.forEach((pt, i) => {
    const { geo, pos, rot } = pt;
    const pb = f32(geo.positions), nb = f32(geo.normals), ib = u16(geo.indices);
    const ip = ib.length%4 ? Buffer.concat([ib, Buffer.alloc(4-ib.length%4)]) : ib;

    const pvi = bv.length;
    bv.push({ buffer:0, byteOffset:off, byteLength:pb.length, target:34962 }); off += pb.length;
    const nvi = bv.length;
    bv.push({ buffer:0, byteOffset:off, byteLength:nb.length, target:34962 }); off += nb.length;
    const ivi = bv.length;
    bv.push({ buffer:0, byteOffset:off, byteLength:ib.length, target:34963 }); off += ip.length;
    bd.push(pb, nb, ip);

    let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
    for(let j=0;j<geo.positions.length;j+=3) for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],geo.positions[j+k]);mx[k]=Math.max(mx[k],geo.positions[j+k]);}

    const pai=acc.length; acc.push({bufferView:pvi,componentType:5126,count:geo.positions.length/3,type:'VEC3',min:mn,max:mx});
    const nai=acc.length; acc.push({bufferView:nvi,componentType:5126,count:geo.normals.length/3,type:'VEC3'});
    const iai=acc.length; acc.push({bufferView:ivi,componentType:5123,count:geo.indices.length,type:'SCALAR'});
    meshes.push({primitives:[{attributes:{POSITION:pai,NORMAL:nai},indices:iai,material:0}]});

    const nd = {mesh:i, translation:pos};
    if(rot){const[rx,ry,rz]=rot;const cx=Math.cos(rx/2),sx=Math.sin(rx/2),cy=Math.cos(ry/2),sy=Math.sin(ry/2),cz=Math.cos(rz/2),sz=Math.sin(rz/2);
      nd.rotation=[sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz];}
    nodes.push(nd);
  });

  const gltf = {asset:{version:'2.0',generator:'chibi-gen'},scene:0,scenes:[{nodes:parts.map((_,i)=>i)}],nodes,meshes,materials:mats,accessors:acc,bufferViews:bv,buffers:[{byteLength:off}]};
  const jb = Buffer.from(JSON.stringify(gltf));
  const jp = Buffer.concat([jb, Buffer.alloc((4-jb.length%4)%4, 0x20)]);
  const bb = Buffer.concat(bd);
  const bp = Buffer.concat([bb, Buffer.alloc((4-bb.length%4)%4)]);
  const tot = 12+8+jp.length+8+bp.length;
  const h = Buffer.alloc(12); h.writeUInt32LE(0x46546C67,0); h.writeUInt32LE(2,4); h.writeUInt32LE(tot,8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jp.length,0); jh.writeUInt32LE(0x4E4F534A,4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bp.length,0); bh.writeUInt32LE(0x004E4942,4);
  return Buffer.concat([h, jh, jp, bh, bp]);
}

const w = [1,1,1,1];
const outDir = path.join(__dirname, '..', 'public', 'models');

// ==================== CAT ====================
function buildCat() {
  const parts = [];
  parts.push({ geo: sphere(0.75, 24, 20), pos: [0, 1.15, 0], color: w });
  // Ears — pointed cones
  parts.push({ geo: cone(0.16, 0.38, 12), pos: [-0.38, 1.9, 0], color: w, rot: [0.1, 0, 0.3] });
  parts.push({ geo: cone(0.16, 0.38, 12), pos: [0.38, 1.9, 0], color: w, rot: [0.1, 0, -0.3] });
  // Body
  parts.push({ geo: sphere(0.38, 16, 14, 0.7), pos: [0, 0.25, 0], color: w });
  // Legs
  parts.push({ geo: cylinder(0.1, 0.11, 0.22, 10), pos: [-0.18, 0.0, 0.12], color: w });
  parts.push({ geo: cylinder(0.1, 0.11, 0.22, 10), pos: [0.18, 0.0, 0.12], color: w });
  parts.push({ geo: cylinder(0.11, 0.12, 0.22, 10), pos: [-0.2, 0.0, -0.12], color: w });
  parts.push({ geo: cylinder(0.11, 0.12, 0.22, 10), pos: [0.2, 0.0, -0.12], color: w });
  // Paws
  parts.push({ geo: sphere(0.1, 10, 8), pos: [-0.18, -0.1, 0.12], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [0.18, -0.1, 0.12], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [-0.2, -0.1, -0.12], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [0.2, -0.1, -0.12], color: w });
  // Tail
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    parts.push({ geo: sphere(0.06 - t * 0.015, 8, 6), pos: [0, 0.25 + t * 0.45, -0.38 - Math.sin(t * Math.PI * 0.8) * 0.25], color: w });
  }
  return parts;
}

// ==================== BEAR ====================
function buildBear() {
  const parts = [];
  // Head — big round
  parts.push({ geo: sphere(0.72, 24, 20), pos: [0, 1.1, 0], color: w });
  // Round ears
  parts.push({ geo: sphere(0.2, 12, 10), pos: [-0.5, 1.75, 0], color: w });
  parts.push({ geo: sphere(0.2, 12, 10), pos: [0.5, 1.75, 0], color: w });
  // Inner ears (slightly smaller, same position)
  parts.push({ geo: sphere(0.12, 10, 8), pos: [-0.5, 1.75, 0.1], color: w });
  parts.push({ geo: sphere(0.12, 10, 8), pos: [0.5, 1.75, 0.1], color: w });
  // Snout — small oval bump
  parts.push({ geo: sphere(0.2, 12, 10, 0.7, 1.1, 0.9), pos: [0, 0.85, 0.55], color: w });
  // Body — chubby
  parts.push({ geo: sphere(0.45, 16, 14, 0.8), pos: [0, 0.2, 0], color: w });
  // Arms
  parts.push({ geo: cylinder(0.12, 0.13, 0.28, 10), pos: [-0.3, 0.05, 0.1], color: w, rot: [0, 0, 0.15] });
  parts.push({ geo: cylinder(0.12, 0.13, 0.28, 10), pos: [0.3, 0.05, 0.1], color: w, rot: [0, 0, -0.15] });
  // Legs
  parts.push({ geo: cylinder(0.13, 0.14, 0.25, 10), pos: [-0.22, -0.05, -0.08], color: w });
  parts.push({ geo: cylinder(0.13, 0.14, 0.25, 10), pos: [0.22, -0.05, -0.08], color: w });
  // Paws
  parts.push({ geo: sphere(0.12, 10, 8), pos: [-0.3, -0.12, 0.1], color: w });
  parts.push({ geo: sphere(0.12, 10, 8), pos: [0.3, -0.12, 0.1], color: w });
  parts.push({ geo: sphere(0.12, 10, 8), pos: [-0.22, -0.15, -0.08], color: w });
  parts.push({ geo: sphere(0.12, 10, 8), pos: [0.22, -0.15, -0.08], color: w });
  // Tiny tail
  parts.push({ geo: sphere(0.1, 8, 6), pos: [0, 0.15, -0.45], color: w });
  return parts;
}

// ==================== RABBIT ====================
function buildRabbit() {
  const parts = [];
  // Head — slightly oval
  parts.push({ geo: sphere(0.65, 24, 20, 1.05), pos: [0, 1.15, 0], color: w });
  // Long ears — elongated cylinders with rounded tips
  parts.push({ geo: cylinder(0.1, 0.08, 0.7, 12), pos: [-0.25, 2.0, -0.05], color: w, rot: [0.1, 0, 0.12] });
  parts.push({ geo: cylinder(0.1, 0.08, 0.7, 12), pos: [0.25, 2.0, -0.05], color: w, rot: [0.1, 0, -0.12] });
  // Ear tips
  parts.push({ geo: sphere(0.08, 10, 8), pos: [-0.29, 2.35, -0.05], color: w });
  parts.push({ geo: sphere(0.08, 10, 8), pos: [0.29, 2.35, -0.05], color: w });
  // Ear bases
  parts.push({ geo: sphere(0.1, 10, 8), pos: [-0.25, 1.65, -0.05], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [0.25, 1.65, -0.05], color: w });
  // Cheeks — little bumps
  parts.push({ geo: sphere(0.18, 10, 8), pos: [-0.4, 0.95, 0.3], color: w });
  parts.push({ geo: sphere(0.18, 10, 8), pos: [0.4, 0.95, 0.3], color: w });
  // Body — small and round
  parts.push({ geo: sphere(0.35, 16, 14, 0.75), pos: [0, 0.28, 0], color: w });
  // Front paws
  parts.push({ geo: sphere(0.09, 10, 8), pos: [-0.15, 0.0, 0.2], color: w });
  parts.push({ geo: sphere(0.09, 10, 8), pos: [0.15, 0.0, 0.2], color: w });
  // Back legs — bigger (rabbit-style)
  parts.push({ geo: sphere(0.14, 10, 8, 1, 0.7, 1.3), pos: [-0.22, -0.02, -0.12], color: w });
  parts.push({ geo: sphere(0.14, 10, 8, 1, 0.7, 1.3), pos: [0.22, -0.02, -0.12], color: w });
  // Fluffy tail — cotton ball
  parts.push({ geo: sphere(0.13, 10, 8), pos: [0, 0.2, -0.38], color: w });
  parts.push({ geo: sphere(0.09, 8, 6), pos: [0.06, 0.25, -0.42], color: w });
  parts.push({ geo: sphere(0.07, 8, 6), pos: [-0.05, 0.18, -0.43], color: w });
  return parts;
}

// ==================== DOG ====================
function buildDog() {
  const parts = [];
  // Head — round
  parts.push({ geo: sphere(0.7, 24, 20), pos: [0, 1.1, 0], color: w });
  // Floppy ears — flattened cylinders angled down
  parts.push({ geo: cylinder(0.14, 0.1, 0.4, 12), pos: [-0.55, 1.2, 0], color: w, rot: [0.3, 0, 0.9] });
  parts.push({ geo: cylinder(0.14, 0.1, 0.4, 12), pos: [0.55, 1.2, 0], color: w, rot: [0.3, 0, -0.9] });
  // Ear tips (round ends)
  parts.push({ geo: sphere(0.1, 10, 8), pos: [-0.72, 0.95, 0.06], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [0.72, 0.95, 0.06], color: w });
  // Snout — protruding oval
  parts.push({ geo: sphere(0.22, 12, 10, 0.7, 1, 0.9), pos: [0, 0.82, 0.55], color: w });
  // Nose tip
  parts.push({ geo: sphere(0.08, 8, 6), pos: [0, 0.85, 0.72], color: w });
  // Body
  parts.push({ geo: sphere(0.42, 16, 14, 0.75), pos: [0, 0.22, 0], color: w });
  // Front legs
  parts.push({ geo: cylinder(0.1, 0.11, 0.25, 10), pos: [-0.2, 0.0, 0.12], color: w });
  parts.push({ geo: cylinder(0.1, 0.11, 0.25, 10), pos: [0.2, 0.0, 0.12], color: w });
  // Back legs
  parts.push({ geo: cylinder(0.11, 0.12, 0.25, 10), pos: [-0.22, 0.0, -0.12], color: w });
  parts.push({ geo: cylinder(0.11, 0.12, 0.25, 10), pos: [0.22, 0.0, -0.12], color: w });
  // Paws
  parts.push({ geo: sphere(0.1, 10, 8), pos: [-0.2, -0.1, 0.12], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [0.2, -0.1, 0.12], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [-0.22, -0.1, -0.12], color: w });
  parts.push({ geo: sphere(0.1, 10, 8), pos: [0.22, -0.1, -0.12], color: w });
  // Tail — upward curve
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const y = 0.25 + t * 0.5;
    const z = -0.4 - Math.sin(t * Math.PI * 0.6) * 0.2;
    parts.push({ geo: sphere(0.06 - t * 0.012, 8, 6), pos: [0, y, z], color: w });
  }
  return parts;
}

// ==================== PENGUIN ====================
function buildPenguin() {
  const parts = [];
  // Head — round
  parts.push({ geo: sphere(0.6, 24, 20), pos: [0, 1.2, 0], color: w });
  // Body — oval, taller
  parts.push({ geo: sphere(0.45, 16, 14, 1.0), pos: [0, 0.3, 0], color: w });
  // Belly (front bump)
  parts.push({ geo: sphere(0.35, 14, 12, 0.9, 0.9, 0.6), pos: [0, 0.25, 0.15], color: w });
  // Beak — small cone pointing forward
  parts.push({ geo: cone(0.1, 0.2, 10), pos: [0, 0.95, 0.55], color: w, rot: [1.5, 0, 0] });
  // Wings/flippers — flat ellipsoids
  parts.push({ geo: sphere(0.08, 10, 8, 1.8, 0.4, 1), pos: [-0.45, 0.35, 0], color: w, rot: [0, 0, 0.3] });
  parts.push({ geo: sphere(0.08, 10, 8, 1.8, 0.4, 1), pos: [0.45, 0.35, 0], color: w, rot: [0, 0, -0.3] });
  // Feet
  parts.push({ geo: sphere(0.12, 10, 8, 0.4, 0.8, 1.2), pos: [-0.18, -0.18, 0.1], color: w });
  parts.push({ geo: sphere(0.12, 10, 8, 0.4, 0.8, 1.2), pos: [0.18, -0.18, 0.1], color: w });
  // Eyes area (slight bumps)
  parts.push({ geo: sphere(0.15, 10, 8), pos: [-0.25, 1.3, 0.4], color: w });
  parts.push({ geo: sphere(0.15, 10, 8), pos: [0.25, 1.3, 0.4], color: w });
  return parts;
}

// Build and write all models
const models = [
  { name: 'cat', build: buildCat },
  { name: 'bear', build: buildBear },
  { name: 'rabbit', build: buildRabbit },
  { name: 'dog', build: buildDog },
  { name: 'penguin', build: buildPenguin },
];

for (const { name, build } of models) {
  const parts = build();
  const glb = encodeGLB(parts);
  fs.writeFileSync(path.join(outDir, `${name}.glb`), glb);
  console.log(`${name}: ${(glb.length / 1024).toFixed(1)} KB, ${parts.length} parts`);
}
