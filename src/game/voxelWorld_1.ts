import * as THREE from 'three';
import { BusinessRubroId, WeatherInfo } from '../types';
import {
  getGrassTopTexture,
  getGrassSideTexture,
  getDirtTexture,
  getWoodPlanksTexture,
  getCobblestoneTexture,
  getSandTexture,
  getLeavesTexture,
  getWoolTexture,
  getBrickTexture,
  getSteveFaceTexture,
  getAlexFaceTexture,
  getVillagerFaceTexture,
  getVoxelSunTexture
} from './voxelTextures';

// Shared Materials Cache
export interface VoxelMaterials {
  grass: THREE.Material[];
  dirt: THREE.MeshLambertMaterial;
  oakPlanks: THREE.MeshLambertMaterial;
  sprucePlanks: THREE.MeshLambertMaterial;
  birchPlanks: THREE.MeshLambertMaterial;
  junglePlanks: THREE.MeshLambertMaterial;
  cobblestone: THREE.MeshLambertMaterial;
  sand: THREE.MeshLambertMaterial;
  water: THREE.MeshLambertMaterial;
  oakLeaves: THREE.MeshLambertMaterial;
  birchLeaves: THREE.MeshLambertMaterial;
  brick: THREE.MeshLambertMaterial;
  glass: THREE.MeshLambertMaterial;
  woolYellow: THREE.MeshLambertMaterial;
  woolWhite: THREE.MeshLambertMaterial;
  woolRed: THREE.MeshLambertMaterial;
  woolBlue: THREE.MeshLambertMaterial;
  woolLime: THREE.MeshLambertMaterial;
  woolPink: THREE.MeshLambertMaterial;
  woolBlack: THREE.MeshLambertMaterial;
  woolCyan: THREE.MeshLambertMaterial;
  woodLog: THREE.MeshLambertMaterial;
  stoneSlab: THREE.MeshLambertMaterial;
}

export function initVoxelMaterials(): VoxelMaterials {
  const grassTop = getGrassTopTexture();
  const grassSide = getGrassSideTexture();
  const dirtTex = getDirtTexture();

  const grassMaterials: THREE.Material[] = [
    new THREE.MeshLambertMaterial({ map: grassSide }), // px
    new THREE.MeshLambertMaterial({ map: grassSide }), // nx
    new THREE.MeshLambertMaterial({ map: grassTop }),  // py (top)
    new THREE.MeshLambertMaterial({ map: dirtTex }),   // ny (bottom)
    new THREE.MeshLambertMaterial({ map: grassSide }), // pz
    new THREE.MeshLambertMaterial({ map: grassSide }), // nz
  ];

  return {
    grass: grassMaterials,
    dirt: new THREE.MeshLambertMaterial({ map: dirtTex }),
    oakPlanks: new THREE.MeshLambertMaterial({ map: getWoodPlanksTexture('oak') }),
    sprucePlanks: new THREE.MeshLambertMaterial({ map: getWoodPlanksTexture('spruce') }),
    birchPlanks: new THREE.MeshLambertMaterial({ map: getWoodPlanksTexture('birch') }),
    junglePlanks: new THREE.MeshLambertMaterial({ map: getWoodPlanksTexture('jungle') }),
    cobblestone: new THREE.MeshLambertMaterial({ map: getCobblestoneTexture() }),
    sand: new THREE.MeshLambertMaterial({ map: getSandTexture() }),
    water: new THREE.MeshLambertMaterial({ color: 0x2277bb, transparent: true, opacity: 0.75 }),
    oakLeaves: new THREE.MeshLambertMaterial({ map: getLeavesTexture('oak'), transparent: true, alphaTest: 0.2 }),
    birchLeaves: new THREE.MeshLambertMaterial({ map: getLeavesTexture('birch'), transparent: true, alphaTest: 0.2 }),
    brick: new THREE.MeshLambertMaterial({ map: getBrickTexture() }),
    glass: new THREE.MeshLambertMaterial({ color: 0xddf0ff, transparent: true, opacity: 0.45 }),
    woolYellow: new THREE.MeshLambertMaterial({ map: getWoolTexture('#ffd633', 'yellow') }),
    woolWhite: new THREE.MeshLambertMaterial({ map: getWoolTexture('#eaeaea', 'white') }),
    woolRed: new THREE.MeshLambertMaterial({ map: getWoolTexture('#b82c2c', 'red') }),
    woolBlue: new THREE.MeshLambertMaterial({ map: getWoolTexture('#2e569f', 'blue') }),
    woolLime: new THREE.MeshLambertMaterial({ map: getWoolTexture('#6ac032', 'lime') }),
    woolPink: new THREE.MeshLambertMaterial({ map: getWoolTexture('#eb7b9b', 'pink') }),
    woolBlack: new THREE.MeshLambertMaterial({ map: getWoolTexture('#222222', 'black') }),
    woolCyan: new THREE.MeshLambertMaterial({ map: getWoolTexture('#2ca5b8', 'cyan') }),
    woodLog: new THREE.MeshLambertMaterial({ map: getWoodPlanksTexture('spruce'), color: 0x6a482b }),
    stoneSlab: new THREE.MeshLambertMaterial({ map: getCobblestoneTexture(), color: 0x999999 }),
  };
}

const boxGeom = new THREE.BoxGeometry(1, 1, 1);

// Helper to create a single block
export function createVoxelBlock(
  x: number,
  y: number,
  z: number,
  material: THREE.Material | THREE.Material[],
  scale = { x: 1, y: 1, z: 1 }
): THREE.Mesh {
  const mesh = new THREE.Mesh(boxGeom, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(scale.x, scale.y, scale.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Build a Minecraft Voxel Tree
export function buildVoxelTree(materials: VoxelMaterials, x: number, z: number, type: 'oak' | 'birch' | 'palm' = 'oak'): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  if (type === 'palm') {
    // Palm trunk curving slightly
    for (let y = 0; y < 6; y++) {
      const trunk = createVoxelBlock(y * 0.15, y + 0.5, 0, materials.junglePlanks, { x: 0.8, y: 1, z: 0.8 });
      tree.add(trunk);
    }
    // Palm fronds
    const leavesMat = materials.oakLeaves;
    const topX = 5 * 0.15;
    const topY = 6.5;
    const offsets = [
      [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
      [2, -0.5, 0], [-2, -0.5, 0], [0, -0.5, 2], [0, -0.5, -2],
      [3, -1, 0], [-3, -1, 0], [0, -1, 3], [0, -1, -3]
    ];
    for (const [dx, dy, dz] of offsets) {
      tree.add(createVoxelBlock(topX + dx * 0.9, topY + dy, dz * 0.9, leavesMat, { x: 0.9, y: 0.4, z: 0.9 }));
    }
    return tree;
  }

  const height = type === 'birch' ? 5 : 4;
  const leavesMat = type === 'birch' ? materials.birchLeaves : materials.oakLeaves;

  // Trunk
  for (let y = 0; y < height; y++) {
    tree.add(createVoxelBlock(0, y + 0.5, 0, materials.woodLog, { x: 0.8, y: 1, z: 0.8 }));
  }

  // Leaves Canopy (Layered 3x3 and 5x5)
  for (let ly = height - 1; ly <= height + 1; ly++) {
    const isTop = ly === height + 1;
    const radius = isTop ? 1 : 2;
    for (let lx = -radius; lx <= radius; lx++) {
      for (let lz = -radius; lz <= radius; lz++) {
        // Skip outer corners for rounder canopy
        if (Math.abs(lx) === 2 && Math.abs(lz) === 2) continue;
        if (lx === 0 && lz === 0 && ly < height) continue; // trunk inside
        const leaf = createVoxelBlock(lx * 0.85, ly + 0.5, lz * 0.85, leavesMat, { x: 0.9, y: 0.9, z: 0.9 });
        tree.add(leaf);
      }
    }
  }

  return tree;
}

// Build Minecraft Terrain based on Location
export function buildVoxelTerrain(
  materials: VoxelMaterials,
  locationId: string,
  width = 24,
  depth = 18
): THREE.Group {
  const terrain = new THREE.Group();

  const isBeach = locationId === 'beach';
  const isDowntown = locationId === 'downtown';
  const isPark = locationId === 'park';
  const isStadium = locationId === 'stadium';

  // Ground Grid
  for (let x = -width / 2; x <= width / 2; x++) {
    for (let z = -depth / 2; z <= depth / 2; z++) {
      const isPath = Math.abs(x) <= 1.5 && z >= -2 && z <= depth / 2;
      const isCounterArea = Math.abs(x) <= 3 && Math.abs(z) <= 2;
      const isWaterSide = isBeach && z < -4;

      if (isWaterSide) {
        // Water Block
        terrain.add(createVoxelBlock(x, -0.3, z, materials.water, { x: 1, y: 0.7, z: 1 }));
        terrain.add(createVoxelBlock(x, -1, z, materials.sand, { x: 1, y: 1, z: 1 }));
      } else if (isPath || isCounterArea) {
        // Path (Cobblestone or Wood Planks or Stone Slabs)
        const pathMat = isDowntown
          ? materials.stoneSlab
          : isBeach
          ? materials.birchPlanks
          : materials.cobblestone;
        terrain.add(createVoxelBlock(x, -0.05, z, pathMat, { x: 1, y: 0.9, z: 1 }));
        terrain.add(createVoxelBlock(x, -1, z, materials.dirt, { x: 1, y: 1, z: 1 }));
      } else {
        // Natural ground (Grass or Sand or Downtown concrete)
        if (isBeach) {
          terrain.add(createVoxelBlock(x, 0, z, materials.sand, { x: 1, y: 1, z: 1 }));
        } else if (isDowntown) {
          terrain.add(createVoxelBlock(x, 0, z, materials.stoneSlab, { x: 1, y: 1, z: 1 }));
        } else {
          terrain.add(createVoxelBlock(x, 0, z, materials.grass, { x: 1, y: 1, z: 1 }));
        }
        terrain.add(createVoxelBlock(x, -1, z, materials.dirt, { x: 1, y: 1, z: 1 }));
      }
    }
  }

  // Location-specific Props & Scenery
  if (isBeach) {
    // Palm trees
    terrain.add(buildVoxelTree(materials, -8, -1, 'palm'));
    terrain.add(buildVoxelTree(materials, 8, -2, 'palm'));
    terrain.add(buildVoxelTree(materials, -9, 5, 'palm'));
    terrain.add(buildVoxelTree(materials, 9, 4, 'palm'));

    // Beach Umbrellas
    const addUmbrella = (ux: number, uz: number, color: THREE.Material) => {
      const pole = createVoxelBlock(ux, 1.2, uz, materials.woodLog, { x: 0.15, y: 2.4, z: 0.15 });
      terrain.add(pole);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          terrain.add(createVoxelBlock(ux + dx * 0.8, 2.4 - Math.abs(dx + dz) * 0.2, uz + dz * 0.8, color, { x: 0.8, y: 0.2, z: 0.8 }));
        }
      }
    };
    addUmbrella(-5, 3, materials.woolYellow);
    addUmbrella(5, 3, materials.woolCyan);
  } else if (isPark) {
    // Lush Trees & Flowers
    terrain.add(buildVoxelTree(materials, -8, -4, 'oak'));
    terrain.add(buildVoxelTree(materials, 8, -4, 'birch'));
    terrain.add(buildVoxelTree(materials, -9, 4, 'birch'));
    terrain.add(buildVoxelTree(materials, 9, 3, 'oak'));
    terrain.add(buildVoxelTree(materials, -6, 6, 'oak'));
    terrain.add(buildVoxelTree(materials, 6, 6, 'birch'));

    // Flower patches
    const flowers = [materials.woolRed, materials.woolYellow, materials.woolPink];
    for (let f = 0; f < 12; f++) {
      const fx = (Math.sin(f * 2.3) * 8);
      const fz = (Math.cos(f * 1.7) * 5);
      if (Math.abs(fx) > 2.5) {
        terrain.add(createVoxelBlock(fx, 0.4, fz, flowers[f % flowers.length], { x: 0.25, y: 0.5, z: 0.25 }));
      }
    }
  } else if (isDowntown) {
    // Street lamps with glowstone look
    const addStreetLamp = (lx: number, lz: number) => {
      terrain.add(createVoxelBlock(lx, 1.5, lz, materials.stoneSlab, { x: 0.3, y: 3, z: 0.3 }));
      terrain.add(createVoxelBlock(lx, 3.2, lz, materials.woolYellow, { x: 0.7, y: 0.7, z: 0.7 })); // glowing lamp
      terrain.add(createVoxelBlock(lx, 3.7, lz, materials.stoneSlab, { x: 0.9, y: 0.2, z: 0.9 })); // lamp roof
    };
    addStreetLamp(-4, 3);
    addStreetLamp(4, 3);
    addStreetLamp(-4, -3);
    addStreetLamp(4, -3);

    // Modern glass/brick accents
    terrain.add(createVoxelBlock(-9, 2, -3, materials.brick, { x: 3, y: 4, z: 3 }));
    terrain.add(createVoxelBlock(9, 2, -3, materials.brick, { x: 3, y: 4, z: 3 }));
  } else if (isStadium) {
    // Red & White stadium grandstand steps
    for (let step = 0; step < 4; step++) {
      const wool = step % 2 === 0 ? materials.woolRed : materials.woolWhite;
      terrain.add(createVoxelBlock(-9 - step * 0.8, step * 0.8 + 0.4, 0, wool, { x: 0.8, y: 0.8, z: 12 }));
      terrain.add(createVoxelBlock(9 + step * 0.8, step * 0.8 + 0.4, 0, wool, { x: 0.8, y: 0.8, z: 12 }));
    }
  } else {
    // Standard Suburb / Neighborhood
    terrain.add(buildVoxelTree(materials, -8, -3, 'oak'));
    terrain.add(buildVoxelTree(materials, 8, -3, 'oak'));
    terrain.add(buildVoxelTree(materials, -8, 5, 'birch'));
    terrain.add(buildVoxelTree(materials, 8, 5, 'birch'));

    // Wooden fences
    for (let fx = -10; fx <= -4; fx += 1.2) {
      terrain.add(createVoxelBlock(fx, 0.4, 2, materials.oakPlanks, { x: 0.2, y: 0.8, z: 0.2 }));
      terrain.add(createVoxelBlock(fx + 0.6, 0.5, 2, materials.oakPlanks, { x: 1.0, y: 0.15, z: 0.1 }));
    }
    for (let fx = 4; fx <= 10; fx += 1.2) {
      terrain.add(createVoxelBlock(fx, 0.4, 2, materials.oakPlanks, { x: 0.2, y: 0.8, z: 0.2 }));
      terrain.add(createVoxelBlock(fx + 0.6, 0.5, 2, materials.oakPlanks, { x: 1.0, y: 0.15, z: 0.1 }));
    }
  }

  return terrain;
}

// Build 3D Voxel Stand adapted to Rubro and Level
export function buildVoxelStand(
  materials: VoxelMaterials,
  rubroId: BusinessRubroId = 'lemonade',
  standLevel = 1,
  standName = 'Stand'
): THREE.Group {
  const stand = new THREE.Group();
  stand.name = 'stand_root';

  // Choose Plank & Wool colors by rubro
  let counterWood = materials.oakPlanks;
  let primaryWool = materials.woolYellow;
  let secondaryWool = materials.woolWhite;

  if (rubroId === 'coffee') {
    counterWood = materials.sprucePlanks;
    primaryWool = materials.woolBlack;
    secondaryWool = materials.woolWhite;
  } else if (rubroId === 'icecream') {
    counterWood = materials.birchPlanks;
    primaryWool = materials.woolPink;
    secondaryWool = materials.woolCyan;
  } else if (rubroId === 'smoothies') {
    counterWood = materials.junglePlanks;
    primaryWool = materials.woolLime;
    secondaryWool = materials.woolYellow;
  } else if (rubroId === 'pizza') {
    counterWood = materials.brick;
    primaryWool = materials.woolRed;
    secondaryWool = materials.woolWhite;
  }

  // 1. Counter Base Table
  const tableWidth = 3.2 + Math.min(standLevel - 1, 3) * 0.4;
  const table = createVoxelBlock(0, 0.6, 0, counterWood, { x: tableWidth, y: 1.2, z: 1.6 });
  table.name = 'stand_counter';
  stand.add(table);

  // Countertop trim
  stand.add(createVoxelBlock(0, 1.25, 0, materials.oakPlanks, { x: tableWidth + 0.2, y: 0.1, z: 1.8 }));

  // 2. Corner Fence Support Posts
  const postOffset = tableWidth / 2 - 0.2;
  const postHeight = 2.4;
  const postMat = materials.woodLog;

  const postFL = createVoxelBlock(-postOffset, 1.8, 0.7, postMat, { x: 0.18, y: postHeight, z: 0.18 });
  const postFR = createVoxelBlock(postOffset, 1.8, 0.7, postMat, { x: 0.18, y: postHeight, z: 0.18 });
  const postBL = createVoxelBlock(-postOffset, 1.8, -0.7, postMat, { x: 0.18, y: postHeight, z: 0.18 });
  const postBR = createVoxelBlock(postOffset, 1.8, -0.7, postMat, { x: 0.18, y: postHeight, z: 0.18 });
  stand.add(postFL, postFR, postBL, postBR);

  // 3. Striped Wool Awning / Roof
  const roofY = 3.0;
  const numStripes = 7;
  const stripeWidth = (tableWidth + 0.6) / numStripes;

  for (let s = 0; s < numStripes; s++) {
    const isPrimary = s % 2 === 0;
    const woolMat = isPrimary ? primaryWool : secondaryWool;
    const sx = -tableWidth / 2 - 0.2 + (s + 0.5) * stripeWidth;

    // Roof main slope
    const roofSegment = createVoxelBlock(sx, roofY, 0, woolMat, { x: stripeWidth * 0.95, y: 0.25, z: 2.2 });
    stand.add(roofSegment);

    // Awning front overhang flap
    const flap = createVoxelBlock(sx, roofY - 0.25, 1.1, woolMat, { x: stripeWidth * 0.95, y: 0.4, z: 0.15 });
    stand.add(flap);
  }

  // 4. Rubro Specific 3D Voxel Countertop Props
  if (rubroId === 'lemonade') {
    // Glass Pitcher / Drink Dispenser
    const dispenser = createVoxelBlock(-0.8, 1.6, 0.1, materials.glass, { x: 0.6, y: 0.7, z: 0.6 });
    const lemonadeLiquid = createVoxelBlock(-0.8, 1.55, 0.1, materials.woolYellow, { x: 0.5, y: 0.55, z: 0.5 });
    const iceBucket = createVoxelBlock(0.8, 1.5, 0.1, materials.glass, { x: 0.5, y: 0.4, z: 0.5 });
    stand.add(dispenser, lemonadeLiquid, iceBucket);
  } else if (rubroId === 'coffee') {
    // Voxel Espresso Machine
    const espressoMachine = createVoxelBlock(-0.7, 1.65, 0, materials.stoneSlab, { x: 0.8, y: 0.7, z: 0.7 });
    const coffeeNozzle = createVoxelBlock(-0.7, 1.45, 0.3, materials.woolBlack, { x: 0.3, y: 0.2, z: 0.2 });
    const cupsStack = createVoxelBlock(0.8, 1.5, 0.1, materials.woolWhite, { x: 0.35, y: 0.5, z: 0.35 });
    stand.add(espressoMachine, coffeeNozzle, cupsStack);
  } else if (rubroId === 'icecream') {
    // Gelato Tub display freezer
    const gelatoCase = createVoxelBlock(-0.5, 1.5, 0, materials.glass, { x: 1.2, y: 0.4, z: 0.8 });
    const scoopPink = createVoxelBlock(-0.8, 1.45, 0, materials.woolPink, { x: 0.3, y: 0.2, z: 0.3 });
    const scoopCyan = createVoxelBlock(-0.5, 1.45, 0, materials.woolCyan, { x: 0.3, y: 0.2, z: 0.3 });
    const scoopYellow = createVoxelBlock(-0.2, 1.45, 0, materials.woolYellow, { x: 0.3, y: 0.2, z: 0.3 });
    const waffleHolder = createVoxelBlock(0.8, 1.5, 0.1, materials.woolYellow, { x: 0.35, y: 0.4, z: 0.35 });
    stand.add(gelatoCase, scoopPink, scoopCyan, scoopYellow, waffleHolder);
  } else if (rubroId === 'smoothies') {
    // Blender block
    const blender = createVoxelBlock(-0.7, 1.6, 0, materials.glass, { x: 0.45, y: 0.65, z: 0.45 });
    const fruitMix = createVoxelBlock(-0.7, 1.55, 0, materials.woolLime, { x: 0.35, y: 0.45, z: 0.35 });
    const fruitBasket = createVoxelBlock(0.7, 1.45, 0, materials.woolYellow, { x: 0.6, y: 0.3, z: 0.5 });
    stand.add(blender, fruitMix, fruitBasket);
  } else if (rubroId === 'pizza') {
    // Mini Brick Pizza Oven on the counter/side
    const miniOven = createVoxelBlock(-1.0, 1.7, -0.1, materials.brick, { x: 0.9, y: 0.8, z: 0.9 });
    const ovenFire = createVoxelBlock(-1.0, 1.5, 0.25, materials.woolYellow, { x: 0.4, y: 0.3, z: 0.2 });
    const pizzaBoxes = createVoxelBlock(0.8, 1.55, 0.1, materials.woolWhite, { x: 0.6, y: 0.5, z: 0.6 });
    stand.add(miniOven, ovenFire, pizzaBoxes);
  }

  // 5. Hanging Minecraft Wooden Signboard
  const signGroup = new THREE.Group();
  signGroup.position.set(0, 3.4, 0.8);
  const signBoard = createVoxelBlock(0, 0, 0, materials.oakPlanks, { x: 2.2, y: 0.6, z: 0.1 });
  signGroup.add(signBoard);
  stand.add(signGroup);

  return stand;
}

// Voxel Minecraft Character Rig
export interface VoxelCharacterRig {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  heldItem?: THREE.Mesh;
  animTime: number;
  isDancing?: boolean;
}

export function buildVoxelCharacter(
  materials: VoxelMaterials,
  characterType: 'steve' | 'alex' | 'villager' | 'business' | 'mascot',
  rubroId: BusinessRubroId = 'lemonade'
): VoxelCharacterRig {
  const root = new THREE.Group();

  // Face textures & Shirt colors
  let faceTexture = getSteveFaceTexture();
  let shirtMat = materials.woolCyan;
  let pantsMat = materials.woolBlue;
  let isVillager = characterType === 'villager';
  let isMascot = characterType === 'mascot';

  if (characterType === 'alex') {
    faceTexture = getAlexFaceTexture();
    shirtMat = materials.woolLime;
    pantsMat = materials.woolBlack;
  } else if (characterType === 'villager') {
    faceTexture = getVillagerFaceTexture();
    shirtMat = materials.dirt;
    pantsMat = materials.dirt;
  } else if (characterType === 'business') {
    faceTexture = getSteveFaceTexture();
    shirtMat = materials.woolBlack;
    pantsMat = materials.woolBlack;
  } else if (isMascot) {
    shirtMat = rubroId === 'lemonade' ? materials.woolYellow : rubroId === 'pizza' ? materials.woolRed : materials.woolLime;
    pantsMat = shirtMat;
  }

  // Head Materials (Front face has pixel face texture, other sides have hair)
  const headMaterials: THREE.Material[] = [
    shirtMat, // px
    shirtMat, // nx
    shirtMat, // py
    shirtMat, // ny
    new THREE.MeshLambertMaterial({ map: faceTexture }), // pz (front face)
    shirtMat, // nz
  ];

  // Head (0.5 x 0.5 x 0.5)
  const head = createVoxelBlock(0, 1.45, 0, headMaterials, { x: 0.5, y: 0.5, z: 0.5 });
  root.add(head);

  // Villager 3D Nose
  if (isVillager) {
    const nose = createVoxelBlock(0, 1.35, 0.32, materials.dirt, { x: 0.12, y: 0.22, z: 0.15 });
    head.add(nose);
  }

  // Torso (0.5 x 0.75 x 0.25)
  const torso = createVoxelBlock(0, 0.85, 0, shirtMat, { x: 0.5, y: 0.7, z: 0.25 });
  root.add(torso);

  // Left Arm (pivot at shoulder)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 1.15, 0);
  const leftArmMesh = createVoxelBlock(0, -0.32, 0, shirtMat, { x: 0.2, y: 0.7, z: 0.2 });
  leftArm.add(leftArmMesh);
  root.add(leftArm);

  // Right Arm (pivot at shoulder)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 1.15, 0);
  const rightArmMesh = createVoxelBlock(0, -0.32, 0, shirtMat, { x: 0.2, y: 0.7, z: 0.2 });
  rightArm.add(rightArmMesh);
  root.add(rightArm);

  // Left Leg (pivot at hip)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.5, 0);
  const leftLegMesh = createVoxelBlock(0, -0.35, 0, pantsMat, { x: 0.22, y: 0.7, z: 0.22 });
  leftLeg.add(leftLegMesh);
  root.add(leftLeg);

  // Right Leg (pivot at hip)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.5, 0);
  const rightLegMesh = createVoxelBlock(0, -0.35, 0, pantsMat, { x: 0.22, y: 0.7, z: 0.22 });
  rightLeg.add(rightLegMesh);
  root.add(rightLeg);

  // Held Food / Drink Item in Hand (lemonade cup / coffee mug / gelato)
  let heldItem: THREE.Mesh | undefined;
  if (!isMascot) {
    const itemColor = rubroId === 'lemonade' ? materials.woolYellow : rubroId === 'coffee' ? materials.woolWhite : rubroId === 'icecream' ? materials.woolPink : materials.woolLime;
    heldItem = createVoxelBlock(0, -0.55, 0.15, itemColor, { x: 0.18, y: 0.25, z: 0.18 });
    heldItem.visible = false;
    rightArm.add(heldItem);
  }

  return {
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    heldItem,
    animTime: Math.random() * 10,
    isDancing: isMascot,
  };
}

// Animate Character Rig (walking limbs or drinking)
export function updateCharacterRigAnimation(
  rig: VoxelCharacterRig,
  isWalking: boolean,
  isDrinking: boolean,
  isDancing = false,
  delta = 0.016
) {
  rig.animTime += delta * 6;

  if (isDancing) {
    // Mascot joyful jump & dance
    const hop = Math.abs(Math.sin(rig.animTime * 1.5)) * 0.3;
    rig.root.position.y = hop;
    rig.leftArm.rotation.x = Math.sin(rig.animTime * 2) * 1.2;
    rig.rightArm.rotation.x = -Math.sin(rig.animTime * 2) * 1.2;
    rig.leftArm.rotation.z = -0.4;
    rig.rightArm.rotation.z = 0.4;
    rig.head.rotation.y = Math.sin(rig.animTime * 1.2) * 0.3;
    return;
  }

  if (isDrinking) {
    // Raise arm with cup to mouth
    rig.rightArm.rotation.x = -1.4;
    rig.rightArm.rotation.z = -0.3;
    rig.leftArm.rotation.x = 0;
    rig.leftArm.rotation.z = 0;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.head.rotation.x = -0.2; // tilt head back drinking
    if (rig.heldItem) rig.heldItem.visible = true;
    return;
  }

  if (isWalking) {
    const swing = Math.sin(rig.animTime) * 0.7;
    rig.leftArm.rotation.x = -swing;
    rig.rightArm.rotation.x = swing;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    rig.head.rotation.x = 0;
    if (rig.heldItem) rig.heldItem.visible = false;
  } else {
    // Idle stance
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0, 0.1);
    rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, 0.1);
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, 0.1);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, 0.1);
  }
}

// Build Minecraft Clouds & Square Sun
export function buildVoxelSky(weather: WeatherInfo): { group: THREE.Group; sun: THREE.Mesh; updateSun: (timeNorm: number) => void } {
  const skyGroup = new THREE.Group();

  // Square Minecraft Voxel Sun
  const sunMat = new THREE.MeshBasicMaterial({ map: getVoxelSunTexture() });
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), sunMat);
  sun.rotation.y = Math.PI;
  skyGroup.add(sun);

  // Voxel Flat Clouds
  const cloudMat = new THREE.MeshLambertMaterial({
    color: weather.type === 'thunderstorm' || weather.type === 'rain' ? 0x666677 : 0xffffff,
    transparent: true,
    opacity: 0.85
  });

  const cloudGroup = new THREE.Group();
  for (let c = 0; c < 8; c++) {
    const cx = (c % 4) * 12 - 18 + (Math.random() * 4 - 2);
    const cz = Math.floor(c / 4) * 14 - 10 + (Math.random() * 4 - 2);
    const cloud = createVoxelBlock(cx, 16, cz, cloudMat, { x: 8 + Math.random() * 4, y: 1.2, z: 6 + Math.random() * 3 });
    cloudGroup.add(cloud);
  }
  skyGroup.add(cloudGroup);

  const updateSun = (timeNorm: number) => {
    // timeNorm goes from 0 (8 AM) to 1 (7 PM)
    const angle = Math.PI * (0.15 + timeNorm * 0.7);
    const sunRadius = 26;
    sun.position.set(Math.cos(angle) * sunRadius, Math.sin(angle) * sunRadius, -8);
    sun.lookAt(0, 0, 0);

    // Drifting clouds
    cloudGroup.position.x = (cloudGroup.position.x + 0.02) % 24;
  };

  return { group: skyGroup, sun, updateSun };
}

// Voxel Rain Drops Particle System
export function buildVoxelRain(count = 120): { group: THREE.Group; update: () => void } {
  const group = new THREE.Group();
  const rainMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.7 });
  const dropGeom = new THREE.BoxGeometry(0.08, 0.6, 0.08);

  const drops: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const drop = new THREE.Mesh(dropGeom, rainMat);
    drop.position.set(
      (Math.random() - 0.5) * 22,
      Math.random() * 14,
      (Math.random() - 0.5) * 18
    );
    group.add(drop);
    drops.push(drop);
  }

  const update = () => {
    for (const drop of drops) {
      drop.position.y -= 0.45;
      if (drop.position.y < 0) {
        drop.position.y = 12 + Math.random() * 4;
      }
    }
  };

  return { group, update };
}
