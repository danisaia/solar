// Configurações centralizadas dos dados astronômicos
export const DATA_CONFIG = {
  // Arquivo de dados principal
  DATA_FILE: '/src/data/celestial-bodies.json',
  
  // Data de referência para cálculos orbitais (J2000.0)
  REFERENCE_DATE: new Date(2000, 0, 1, 12, 0, 0), // 1 Jan 2000 12:00 UTC
  
  // Constantes físicas
  PHYSICS: {
    AU: 1.496e11,                    // Unidade Astronômica em metros
    MODEL_SIZE_FACTOR: 2e-7,         // Fator de escala para visualização
    REAL_SCALE_FACTOR: 1e-6,         // Fator de escala real
    ZOOM_THRESHOLD: 5.0,
    SIZE_MULTIPLIER: 100.0,
    CAMERA_BASE_ALTITUDE: 100.0
  },
  
  // Mapeamento hierárquico do sistema solar
  HIERARCHY: {
    // Ordem dos planetas para navegação
    PLANETS_ORDER: [
      'mercurio', 'venus', 'terra', 'marte', 
      'jupiter', 'saturno', 'urano', 'netuno'
    ],
    
    // Mapeamento de luas para seus planetas pais
    PARENT_MAPPING: {
      'lua': 'terra',
      'io': 'jupiter',
      'europa': 'jupiter',
      'ganimedes': 'jupiter',
      'calisto': 'jupiter',
      'tita': 'saturno',
      'encelado': 'saturno',
      'titania': 'urano',
      'oberon': 'urano'
    },
    
    // Mapeamento de luas por planeta
    PLANET_MOONS: {
      'terra': ['lua'],
      'jupiter': ['io', 'europa', 'ganimedes', 'calisto'],
      'saturno': ['tita', 'encelado'],
      'urano': ['titania', 'oberon']
    }
  },
  
  // Configurações de validação
  VALIDATION: {
    REQUIRED_BODIES: ['sol', 'terra', 'lua'],
    EXPECTED_PLANETS: 8,
    EXPECTED_MOONS: 9,
    EXPECTED_TOTAL: 18 // 1 estrela + 8 planetas + 9 luas
  },
  
  // Thresholds para renderização e exibição
  RENDER_THRESHOLDS: {
    MOON_ZOOM_THRESHOLD: 0.003,
    ORBIT_DISPLAY_THRESHOLD: 0.05,
    ORBIT_SEGMENTS: 200,
    ORBIT_LINE_WIDTH: 1.5
  }
};

// Configurações visuais herdadas (compatibilidade)
export const VISUAL_CONFIG = DATA_CONFIG.PHYSICS;

// Exports para compatibilidade com o código existente
export const PLANETS_ORDER = DATA_CONFIG.HIERARCHY.PLANETS_ORDER;
export const MOON_MAPPING = DATA_CONFIG.HIERARCHY.PLANET_MOONS;
export const REF_DATE = DATA_CONFIG.REFERENCE_DATE;

// Configurações da câmera
export const CAMERA_CONFIG = {
  baseNear: 0.01,
  baseFar: 1e12,
  baseAltitude: 100.0,
  transitionSpeed: 5.0
};
