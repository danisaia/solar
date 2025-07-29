// Configurações e constantes do sistema
export const VISUAL_CONFIG = {
  realScaleFactor: 1e-6,
  zoomThreshold: 5.0,
  sizeMultiplier: 100.0,
  au: 1.496e11,
  modelSizeFactor: 2e-7
};

export const PLANETS_ORDER = [
  'mercurio', 'venus', 'terra', 'marte', 
  'jupiter', 'saturno', 'urano', 'netuno'
];

export const MOON_MAPPING = {
  'terra': ['lua'],
  'jupiter': ['io', 'europa', 'ganimedes', 'calisto'],
  'saturno': ['tita', 'encelado'],
  'urano': ['titania', 'oberon']
};

// Data de referência para cálculos orbitais
export const REF_DATE = new Date(2000, 0, 1, 12, 0, 0);

// Configurações da câmera
export const CAMERA_CONFIG = {
  baseNear: 0.01,
  baseFar: 1e12,
  baseAltitude: 100.0,
  transitionSpeed: 5.0
};
