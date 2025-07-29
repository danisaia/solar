import { AstronomicalData, CelestialBody, OrbitalParameters } from '../types/index';
import { AstronomicalDataParser } from './AstronomicalDataParser';

// Carregador e validador de dados astronômicos
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
      console.log('📊 Carregando dados astronômicos...');
      
      const response = await fetch('/src/data/celestial-bodies.json');
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Usar o parser para validar e processar dados
      this.astronomicalData = AstronomicalDataParser.parseAstronomicalData(rawData);
      
      // Validar consistência
      AstronomicalDataParser.validateDataConsistency(this.astronomicalData);
      
      console.log(`✅ ${Object.keys(this.astronomicalData).length} corpos celestes carregados e validados`);
      
      // Log de estatísticas
      const stats = this.getDataStatistics();
      if (stats) {
        console.log(`📈 Estatísticas dos dados:
        - Total de corpos: ${stats.totalBodies}
        - Planetas: ${stats.planets}
        - Luas: ${stats.moons}
        - Com órbitas: ${stats.withOrbits}
        - Sem órbitas: ${stats.withoutOrbits}`);
      }
      
      return this.astronomicalData;
    } catch (error) {
      console.error('❌ Erro ao carregar dados astronômicos:', error);
      throw error;
    }
  }

  public getAstronomicalData(): AstronomicalData | null {
    return this.astronomicalData;
  }

  public getCelestialBody(name: string): CelestialBody | null {
    if (!this.astronomicalData) {
      throw new Error('Dados astronômicos não carregados');
    }
    return this.astronomicalData[name] || null;
  }

  /**
   * Retorna lista de todos os planetas (corpos com órbita, exceto luas)
   */
  public getPlanets(): CelestialBody[] {
    if (!this.astronomicalData) {
      return [];
    }

    const planets = ['mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno'];
    return planets.map(name => this.astronomicalData![name]).filter(Boolean);
  }

  /**
   * Retorna lista de todas as luas
   */
  public getMoons(): CelestialBody[] {
    if (!this.astronomicalData) {
      return [];
    }

    const moons = ['lua', 'io', 'europa', 'ganimedes', 'calisto', 'tita', 'encelado', 'titania', 'oberon'];
    return moons.map(name => this.astronomicalData![name]).filter(Boolean);
  }

  /**
   * Retorna lista de corpos por categoria
   */
  public getBodiesByCategory(): { 
    star: CelestialBody | null, 
    planets: CelestialBody[], 
    moons: CelestialBody[] 
  } {
    return {
      star: this.getCelestialBody('sol'),
      planets: this.getPlanets(),
      moons: this.getMoons()
    };
  }

  /**
   * Busca corpo celeste por nome (case-insensitive)
   */
  public findBodyByName(name: string): CelestialBody | null {
    if (!this.astronomicalData) {
      return null;
    }

    const normalizedName = name.toLowerCase().trim();
    
    // Busca exata por chave
    if (this.astronomicalData[normalizedName]) {
      return this.astronomicalData[normalizedName];
    }

    // Busca por nome de exibição
    for (const [key, body] of Object.entries(this.astronomicalData)) {
      if (body.nome.toLowerCase() === normalizedName) {
        return body;
      }
    }

    return null;
  }

  /**
   * Retorna estatísticas dos dados carregados
   */
  public getDataStatistics() {
    if (!this.astronomicalData) {
      return null;
    }

    const bodies = Object.values(this.astronomicalData);
    const withOrbits = bodies.filter(body => body.orbital).length;
    const withoutOrbits = bodies.length - withOrbits;

    return {
      totalBodies: bodies.length,
      withOrbits,
      withoutOrbits,
      planets: this.getPlanets().length,
      moons: this.getMoons().length
    };
  }

  /**
   * Valida se todos os dados necessários estão carregados
   */
  public validateLoadedData(): boolean {
    if (!this.astronomicalData) {
      return false;
    }

    const requiredBodies = ['sol', 'terra', 'lua'];
    return requiredBodies.every(name => this.astronomicalData![name]);
  }
}
