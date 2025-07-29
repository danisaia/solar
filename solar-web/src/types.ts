// Tipos TypeScript para os dados astronômicos
export interface OrbitalParameters {
  a: number;     // Semi-eixo maior (AU)
  T: number;     // Período orbital (anos terrestres)
  e: number;     // Excentricidade
  i: number;     // Inclinação (graus)
  Ω: number;     // Longitude do nodo ascendente (graus)
  ω: number;     // Argumento do periélio (graus)
  M: number;     // Anomalia média na época (graus)
}

export interface CelestialBodyData {
  nome: string;
  massa: string;
  raio: string;
  cor: string;
  orbital?: OrbitalParameters;
  luas?: string[];
}

export interface AstronomicalData {
  [key: string]: CelestialBodyData;
}

// Estados da simulação
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

// Configurações visuais
export interface VisualConfig {
  realScaleFactor: number;
  zoomThreshold: number;
  sizeMultiplier: number;
  au: number;
  modelSizeFactor: number;
}
