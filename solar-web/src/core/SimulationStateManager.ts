import { SimulationState } from '../types';
import { PLANETS_ORDER, MOON_MAPPING } from '../data/config';

// Gerenciador do estado da simulação
export class SimulationStateManager {
  private static instance: SimulationStateManager;
  private state: SimulationState;

  private constructor() {
    this.state = {
      target: 'terra',
      speed: 1.0,
      zoom: 1.0,
      currentPlanetIndex: 2, // Terra é o 3º planeta
      currentMoonIndex: 0,
      cameraInclination: 0.2,
      targetInclination: 0.2,
      horizontalRotation: 0.0,
      targetRotation: 0.0
    };
  }

  public static getInstance(): SimulationStateManager {
    if (!SimulationStateManager.instance) {
      SimulationStateManager.instance = new SimulationStateManager();
    }
    return SimulationStateManager.instance;
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public setState(newState: Partial<SimulationState>): void {
    this.state = { ...this.state, ...newState };
  }

  // Métodos de controle migrados do código Python
  public focusOnSun(): void {
    this.state.target = 'sol';
    console.log('Centralizado no Sol');
  }

  public nextPlanet(): void {
    if (this.state.target === 'sol') {
      this.state.currentPlanetIndex = 0;
    } else {
      this.state.currentMoonIndex = 0;
      this.state.currentPlanetIndex = (this.state.currentPlanetIndex + 1) % PLANETS_ORDER.length;
    }
    this.state.target = PLANETS_ORDER[this.state.currentPlanetIndex];
    console.log('Planeta atual:', this.state.target);
  }

  public previousPlanet(): void {
    if (this.state.target === 'sol') {
      this.state.currentPlanetIndex = PLANETS_ORDER.length - 1;
    } else {
      this.state.currentMoonIndex = 0;
      this.state.currentPlanetIndex = (this.state.currentPlanetIndex - 1 + PLANETS_ORDER.length) % PLANETS_ORDER.length;
    }
    this.state.target = PLANETS_ORDER[this.state.currentPlanetIndex];
    console.log('Planeta atual:', this.state.target);
  }

  public nextMoon(): void {
    const planet = PLANETS_ORDER[this.state.currentPlanetIndex];
    const moons = MOON_MAPPING[planet as keyof typeof MOON_MAPPING];
    
    if (moons && moons.length > 0) {
      this.state.currentMoonIndex = (this.state.currentMoonIndex + 1) % moons.length;
      this.state.target = moons[this.state.currentMoonIndex];
      console.log('Lua atual:', this.state.target);
    } else {
      console.log('Este planeta não possui luas');
    }
  }

  public previousMoon(): void {
    const planet = PLANETS_ORDER[this.state.currentPlanetIndex];
    const moons = MOON_MAPPING[planet as keyof typeof MOON_MAPPING];
    
    if (moons && moons.length > 0) {
      this.state.currentMoonIndex = (this.state.currentMoonIndex - 1 + moons.length) % moons.length;
      this.state.target = moons[this.state.currentMoonIndex];
      console.log('Lua atual:', this.state.target);
    } else {
      console.log('Este planeta não possui luas');
    }
  }

  public returnToPlanet(): void {
    this.state.currentMoonIndex = 0;
    this.state.target = PLANETS_ORDER[this.state.currentPlanetIndex];
    console.log('Retornado ao planeta:', this.state.target);
  }
}
