// Interfaces para definição dos tipos de dados astronômicos

export interface OrbitalParameters {
  a: number;      // Semieixo maior (UA)
  T: number;      // Período orbital (anos)
  e: number;      // Excentricidade
  i: number;      // Inclinação (graus)
  Ω: number;      // Longitude do nodo ascendente (graus)
  ω: number;      // Argumento do periélio (graus)
  M: number;      // Anomalia média (graus)
}

export interface CelestialBody {
  nome: string;
  massa: number;    // kg
  raio: number;     // metros
  cor: string;      // cor hexadecimal
  orbital?: OrbitalParameters;
}

export interface CelestialBodiesData {
  [key: string]: CelestialBody;
}

// Interface específica para dados astronômicos (alias para compatibilidade)
export type AstronomicalData = CelestialBodiesData;

export interface SimulationState {
  target: string;
  speed: number;
  zoom: number;
  currentPlanetIndex: number;
  currentMoonIndex: number;
  cameraInclination: number;
  targetInclination: number;
  horizontalRotation: number;
  targetRotation: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  inclination: number;
  horizontalRotation: number;
  zoom: number;
}

// Constantes físicas e de escala
export interface PhysicsConstants {
  AU: number;                    // Unidade Astronômica em metros
  MODEL_SIZE_FACTOR: number;     // Fator de escala para visualização
  REAL_SCALE_FACTOR: number;     // Fator de escala real
  ZOOM_THRESHOLD: number;
  SIZE_MULTIPLIER: number;
  CAMERA_BASE_ALTITUDE: number;
}

// Mapeamento de luas para seus planetas pais
export interface MoonMapping {
  [moonName: string]: string;
}

// Ordem dos planetas para navegação
export type PlanetsOrder = string[];

// Mapeamento de luas por planeta
export interface PlanetMoons {
  [planetName: string]: string[];
}
