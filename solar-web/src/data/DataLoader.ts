import { AstronomicalData } from '../types';

// Carregador de dados astronômicos
export class DataLoader {
  private static instance: DataLoader;
  private astronomicalData: AstronomicalData | null = null;

  private constructor() {}

  public static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  public async loadAstronomicalData(): Promise<AstronomicalData> {
    if (this.astronomicalData) {
      return this.astronomicalData;
    }

    try {
      const response = await fetch('/src/data/corpos.json');
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }
      
      this.astronomicalData = await response.json();
      return this.astronomicalData!;
    } catch (error) {
      console.error('Erro ao carregar dados astronômicos:', error);
      throw error;
    }
  }

  public getAstronomicalData(): AstronomicalData | null {
    return this.astronomicalData;
  }

  public getCelestialBody(name: string) {
    if (!this.astronomicalData) {
      throw new Error('Dados astronômicos não carregados');
    }
    return this.astronomicalData[name];
  }
}
