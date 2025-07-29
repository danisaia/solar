import { PhysicsConstants, MoonMapping, PlanetsOrder, PlanetMoons } from '../types';

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

// Configurações de câmera
export const CAMERA_CONFIG = {
  DEFAULT_INCLINATION: 0.2,
  TRANSITION_SPEED: 5.0,
  MIN_ZOOM: 0.00002,
  BASE_NEAR: 0.01,
  BASE_FAR: 1e12
};
