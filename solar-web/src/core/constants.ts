import { PhysicsConstants, MoonMapping, PlanetsOrder, PlanetMoons } from '../types';

// ===============================================
// CONFIGURAÇÕES DO THREE.JS
// ===============================================

// Configurações do renderizador
export const RENDERER_CONFIG = {
  ANTIALIAS: true,
  ALPHA: false,
  POWER_PREFERENCE: "high-performance" as const,
  MAX_PIXEL_RATIO: 2,
  SHADOW_MAP_SIZE: 2048,
  TONE_MAPPING_EXPOSURE: 1.0,
  // Configurações avançadas de qualidade
  PRESERVE_DRAWING_BUFFER: false,
  LOGARITHMIC_DEPTH_BUFFER: true, // Para melhor precisão em grandes distâncias
  PRECISION: "highp" as const,
  PREMULTIPLIED_ALPHA: false,
  STENCIL: false,
  DEPTH: true
} as const;

// Configurações dos controles
export const CONTROLS_CONFIG = {
  ENABLE_DAMPING: true,
  DAMPING_FACTOR: 0.05,
  MIN_DISTANCE: 1,
  MAX_DISTANCE: 1e10,
  ROTATE_SPEED: 0.5,
  ZOOM_SPEED: 1.0,
  PAN_SPEED: 0.8,
  // Configurações avançadas de navegação
  AUTO_ROTATE: false,
  AUTO_ROTATE_SPEED: 0.5,
  ENABLE_KEYS: true,
  KEYS: {
    LEFT: 'ArrowLeft',
    UP: 'ArrowUp',
    RIGHT: 'ArrowRight',
    BOTTOM: 'ArrowDown'
  },
  // Limites de rotação vertical
  MIN_POLAR_ANGLE: 0,
  MAX_POLAR_ANGLE: Math.PI,
  // Suavização de movimentos
  SMOOTH_ZOOM: true,
  ZOOM_DAMPING: 0.1
} as const;

// Configurações de iluminação
export const LIGHTING_CONFIG = {
  // Luz ambiente muito fraca (espaço é predominantemente escuro)
  AMBIENT_COLOR: 0x404040,
  AMBIENT_INTENSITY: 0.1,
  
  // Luz solar direcional
  SUN_COLOR: 0xffffff,
  SUN_INTENSITY: 1.2,
  SUN_DIRECTION: { x: 0, y: 0, z: 0 },
  
  // Luz pontual do Sol
  SUN_POINT_COLOR: 0xffff88,
  SUN_POINT_INTENSITY: 2.5,
  SUN_POINT_DECAY: 2,
  
  // Configurações de sombras
  CAST_SHADOWS: true,
  RECEIVE_SHADOWS: true,
  SHADOW_BIAS: -0.0001,
  SHADOW_RADIUS: 4,
  
  // Configurações da câmera de sombra
  SHADOW_CAMERA_NEAR: 0.1,
  SHADOW_CAMERA_FAR: 2000,
  SHADOW_CAMERA_SIZE: 1000
} as const;

// Configurações da cena
export const SCENE_CONFIG = {
  BACKGROUND_COLOR: 0x000011,
  FOG_COLOR: 0x000011,
  FOG_NEAR: 1000,
  FOG_FAR: 10000
} as const;

// Tamanhos temporários dos objetos de teste
export const TEST_SIZES = {
  SUN_RADIUS: 5,
  EARTH_RADIUS: 2,
  MOON_RADIUS: 0.5,
  EARTH_DISTANCE: 30,
  MOON_ORBIT_RADIUS: 8
} as const;

// Velocidades de animação
export const ANIMATION_SPEEDS = {
  EARTH_ROTATION: 0.5,
  MOON_ORBIT: 2
} as const;

// Cores dos corpos celestes (temporárias)
export const BODY_COLORS = {
  SUN: 0xffff44,
  EARTH: 0x4488ff,
  MOON: 0xcccccc
} as const;

// ===============================================
// CONSTANTES FÍSICAS ORIGINAIS
// ===============================================

// Constantes físicas e de escala equivalentes ao Panda3D
export const PHYSICS_CONSTANTS: PhysicsConstants = {
  AU: 1.496e11,                    // Unidade Astronômica em metros
  MODEL_SIZE_FACTOR: 2e-7,         // Fator de escala para visualização
  REAL_SCALE_FACTOR: 1e-6,         // Fator de escala real
  ZOOM_THRESHOLD: 5.0,
  SIZE_MULTIPLIER: 100.0,
  CAMERA_BASE_ALTITUDE: 100.0
};

// Mapeamento de luas para seus planetas pais
export const PARENT_MOONS: MoonMapping = {
  'lua': 'terra',
  'io': 'jupiter',
  'europa': 'jupiter',
  'ganimedes': 'jupiter',
  'calisto': 'jupiter',
  'tita': 'saturno',
  'encelado': 'saturno',
  'titania': 'urano',
  'oberon': 'urano'
};

// Ordem dos planetas para navegação
export const PLANETS_ORDER: PlanetsOrder = [
  'mercurio', 'venus', 'terra', 'marte', 
  'jupiter', 'saturno', 'urano', 'netuno'
];

// Mapeamento de luas por planeta
export const PLANET_MOONS: PlanetMoons = {
  'terra': ['lua'],
  'jupiter': ['io', 'europa', 'ganimedes', 'calisto'],
  'saturno': ['tita', 'encelado'],
  'urano': ['titania', 'oberon']
};

// Data de referência para cálculos orbitais
export const REFERENCE_DATE = new Date(2000, 0, 1, 12, 0, 0); // 1 Jan 2000 12:00 UTC

// Thresholds para renderização
export const RENDER_THRESHOLDS = {
  MOON_ZOOM_THRESHOLD: 0.003,
  ORBIT_DISPLAY_THRESHOLD: 0.05,
  ORBIT_SEGMENTS: 200,
  ORBIT_LINE_WIDTH: 1.5
};

// Configurações de câmera (Three.js)
export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 0.01,
  FAR: 1e12,
  INITIAL_POSITION: { x: 0, y: 0, z: 100 },
  DEFAULT_INCLINATION: 0.2,
  TRANSITION_SPEED: 5.0,
  MIN_ZOOM: 0.00002,
  BASE_NEAR: 0.01,
  BASE_FAR: 1e12
};
