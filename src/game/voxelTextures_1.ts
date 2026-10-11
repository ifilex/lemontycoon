import * as THREE from 'three';

// Cache for generated pixel textures
const textureCache = new Map<string, THREE.CanvasTexture>();

function createPixelTexture(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D) => void,
  cacheKey: string
): THREE.CanvasTexture {
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Generate Minecraft-style 16x16 Grass Top
export function getGrassTopTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const greens = ['#5b8f22', '#629924', '#6ba327', '#53841e', '#4c7b19'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const color = greens[Math.floor(Math.random() * greens.length)];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 'grass_top');
}

// Generate Minecraft-style 16x16 Grass Side (Dirt with Grass top edge)
export function getGrassSideTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const dirts = ['#866043', '#724f35', '#60412b', '#7c563b', '#6b472e'];
    const greens = ['#5b8f22', '#629924', '#6ba327', '#53841e'];

    // Fill dirt
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = dirts[Math.floor(Math.random() * dirts.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Overlay grass fringe (top 2 to 4 pixels)
    for (let x = 0; x < 16; x++) {
      const depth = 2 + (x % 3 === 0 ? 2 : x % 2 === 0 ? 1 : 0);
      for (let y = 0; y < depth; y++) {
        ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 'grass_side');
}

// Dirt Texture
export function getDirtTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const dirts = ['#866043', '#724f35', '#60412b', '#7c563b', '#6b472e'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = dirts[Math.floor(Math.random() * dirts.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 'dirt');
}

// Wood Planks Texture (Oak, Spruce, Birch)
export function getWoodPlanksTexture(tint: 'oak' | 'spruce' | 'birch' | 'jungle'): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    let basePalette: string[];
    if (tint === 'spruce') {
      basePalette = ['#49331e', '#543b23', '#3d2b19', '#634529'];
    } else if (tint === 'birch') {
      basePalette = ['#d5ce9e', '#c4bd8f', '#e2dbae', '#b5ae80'];
    } else if (tint === 'jungle') {
      basePalette = ['#9e6e4f', '#8e5e3f', '#ae7e5f', '#7e4e2f'];
    } else {
      basePalette = ['#a07844', '#916b38', '#b18752', '#825e2d'];
    }

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        // Plank horizontal seams
        if (y % 4 === 0) {
          ctx.fillStyle = '#2d1f11';
        } else if ((x === 4 && y < 8) || (x === 12 && y >= 8)) {
          ctx.fillStyle = '#2d1f11';
        } else {
          ctx.fillStyle = basePalette[Math.floor(Math.random() * basePalette.length)];
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, `planks_${tint}`);
}

// Cobblestone Texture
export function getCobblestoneTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const stones = ['#7c7c7c', '#626262', '#8e8e8e', '#505050', '#9c9c9c'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = stones[Math.floor(Math.random() * stones.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Mortar lines
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(7, 0, 1, 7);
    ctx.fillRect(11, 8, 1, 8);
  }, 'cobblestone');
}

// Sand Texture
export function getSandTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const sands = ['#ded098', '#d6c890', '#ebdca4', '#c9bd86', '#ebd692'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = sands[Math.floor(Math.random() * sands.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 'sand');
}

// Tree Leaves Texture
export function getLeavesTexture(tint: 'oak' | 'birch' | 'jungle'): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    let leaves: string[];
    if (tint === 'birch') {
      leaves = ['#6ba341', '#5e9435', '#7db552', '#4e8028'];
    } else if (tint === 'jungle') {
      leaves = ['#3f9429', '#327c1f', '#4ca933', '#256715'];
    } else {
      leaves = ['#3a7a23', '#2e6319', '#46912d', '#235210'];
    }

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        // Some transparent holes like Minecraft leaves
        if ((x + y) % 7 === 0 && (x * y) % 3 === 0) {
          ctx.clearRect(x, y, 1, 1);
        } else {
          ctx.fillStyle = leaves[Math.floor(Math.random() * leaves.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, `leaves_${tint}`);
}

// Colored Wool Texture
export function getWoolTexture(colorHex: string, name: string): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 16, 16);
    // Subtle fuzzy pixel variations
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (Math.random() < 0.3) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(x, y, 1, 1);
        } else if (Math.random() < 0.3) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, `wool_${name}`);
}

// Brick Texture
export function getBrickTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    const reds = ['#a04d3d', '#923f30', '#ab5646', '#873426'];
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (y % 4 === 0 || (y < 4 && x === 7) || (y >= 4 && y < 8 && (x === 3 || x === 11)) || (y >= 8 && y < 12 && x === 7) || (y >= 12 && (x === 3 || x === 11))) {
          ctx.fillStyle = '#dcd6cb'; // mortar
        } else {
          ctx.fillStyle = reds[Math.floor(Math.random() * reds.length)];
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 'brick');
}

// Steve Face Texture (8x8 upscaled to 16x16)
export function getSteveFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // Hair
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(0, 0, 16, 4);
    ctx.fillRect(0, 4, 4, 4);
    ctx.fillRect(12, 4, 4, 4);
    
    // Skin
    ctx.fillStyle = '#bfa181';
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillRect(0, 8, 16, 8);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 6, 4, 2);
    ctx.fillRect(10, 6, 4, 2);
    ctx.fillStyle = '#3c478a'; // blue iris
    ctx.fillRect(4, 6, 2, 2);
    ctx.fillRect(10, 6, 2, 2);

    // Nose & Mouth / Beard
    ctx.fillStyle = '#8b5a36';
    ctx.fillRect(6, 8, 4, 2);
    ctx.fillRect(4, 10, 8, 2);
  }, 'steve_face');
}

// Alex Face Texture
export function getAlexFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // Ginger Hair
    ctx.fillStyle = '#c46927';
    ctx.fillRect(0, 0, 16, 5);
    ctx.fillRect(0, 5, 4, 6);
    ctx.fillRect(12, 5, 4, 6);

    // Skin
    ctx.fillStyle = '#e8c2a0';
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillRect(0, 11, 16, 5);

    // Eyes (Green)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 7, 4, 2);
    ctx.fillRect(10, 7, 4, 2);
    ctx.fillStyle = '#2f7535';
    ctx.fillRect(4, 7, 2, 2);
    ctx.fillRect(10, 7, 2, 2);

    // Lips
    ctx.fillStyle = '#bd7661';
    ctx.fillRect(6, 12, 4, 1);
  }, 'alex_face');
}

// Villager Face Texture
export function getVillagerFaceTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    // Bald / Brow
    ctx.fillStyle = '#bfa181';
    ctx.fillRect(0, 0, 16, 16);

    // Big Unibrow
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(2, 4, 12, 2);

    // Green Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 6, 4, 2);
    ctx.fillRect(10, 6, 4, 2);
    ctx.fillStyle = '#2a6a2a';
    ctx.fillRect(4, 6, 2, 2);
    ctx.fillRect(10, 6, 2, 2);

    // Big 3D Voxel Nose shadow
    ctx.fillStyle = '#9e7d5e';
    ctx.fillRect(6, 7, 4, 6);
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(6, 13, 4, 1);
  }, 'villager_face');
}

// Sun Texture
export function getVoxelSunTexture(): THREE.CanvasTexture {
  return createPixelTexture(16, 16, (ctx) => {
    ctx.fillStyle = '#fff970';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffdf38';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 8, 8);
  }, 'voxel_sun');
}
