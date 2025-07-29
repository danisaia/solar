import { AstronomicalData, CelestialBody, OrbitalParameters } from '../types/index';

/**
 * Parser para dados astronômicos com funções de conversão e validação
 */
export class AstronomicalDataParser {
  
  /**
   * Converte período orbital de string para número em anos
   * Processa formatos como "27.3/365.25" para conversão de dias para anos
   */
  static parseOrbitalPeriod(period: string | number): number {
    if (typeof period === 'number') {
      return period;
    }

    // Se é string com divisão (ex: "27.3/365.25")
    if (typeof period === 'string' && period.includes('/')) {
      const [numerator, denominator] = period.split('/').map(parseFloat);
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        throw new Error(`Período orbital inválido: ${period}`);
      }
      return numerator / denominator;
    }

    // Tentar converter string para número
    const parsed = parseFloat(period);
    if (isNaN(parsed)) {
      throw new Error(`Período orbital inválido: ${period}`);
    }
    
    return parsed;
  }

  /**
   * Converte massa de string científica para número
   * Processa notações como "1.989e30"
   */
  static parseMass(mass: string | number): number {
    if (typeof mass === 'number') {
      return mass;
    }

    const parsed = parseFloat(mass);
    if (isNaN(parsed)) {
      throw new Error(`Massa inválida: ${mass}`);
    }
    
    return parsed;
  }

  /**
   * Converte raio de string científica para número
   * Processa notações como "6.9634e8"
   */
  static parseRadius(radius: string | number): number {
    if (typeof radius === 'number') {
      return radius;
    }

    const parsed = parseFloat(radius);
    if (isNaN(parsed)) {
      throw new Error(`Raio inválido: ${radius}`);
    }
    
    return parsed;
  }

  /**
   * Valida e normaliza cor hexadecimal
   */
  static parseColor(color: string): string {
    if (!color || typeof color !== 'string') {
      throw new Error('Cor deve ser uma string');
    }

    // Remover espaços e converter para minúsculo
    const cleaned = color.trim().toLowerCase();
    
    // Adicionar # se não existir
    const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
    
    // Validar formato hexadecimal
    const hexPattern = /^#[0-9a-f]{6}$/;
    if (!hexPattern.test(withHash)) {
      throw new Error(`Cor hexadecimal inválida: ${color}`);
    }
    
    return withHash;
  }

  /**
   * Valida ângulos astronômicos (0-360 graus)
   */
  static parseAngle(angle: number, name: string): number {
    if (typeof angle !== 'number' || isNaN(angle)) {
      throw new Error(`Ângulo ${name} inválido: ${angle}`);
    }
    
    // Normalizar ângulo para 0-360 graus
    let normalized = angle % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    
    return normalized;
  }

  /**
   * Valida excentricidade orbital (0 ≤ e < 1)
   */
  static parseEccentricity(e: number): number {
    if (typeof e !== 'number' || isNaN(e)) {
      throw new Error(`Excentricidade inválida: ${e}`);
    }
    
    if (e < 0 || e >= 1) {
      throw new Error(`Excentricidade deve estar entre 0 e 1 (exclusivo): ${e}`);
    }
    
    return e;
  }

  /**
   * Processa parâmetros orbitais completos
   */
  static parseOrbitalParameters(orbital: any): OrbitalParameters {
    if (!orbital || typeof orbital !== 'object') {
      throw new Error('Parâmetros orbitais devem ser um objeto');
    }

    return {
      a: this.parsePositiveNumber(orbital.a, 'Semieixo maior'),
      T: this.parseOrbitalPeriod(orbital.T),
      e: this.parseEccentricity(orbital.e),
      i: orbital.i, // Inclinação pode ser negativa
      Ω: orbital.Ω, // Longitude do nó pode ser negativa
      ω: orbital.ω, // Argumento do periélio pode ser negativo  
      M: orbital.M  // Anomalia média pode ser negativa
    };
  }

  /**
   * Valida número positivo
   */
  static parsePositiveNumber(value: number, name: string): number {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error(`${name} deve ser um número positivo: ${value}`);
    }
    return value;
  }

  /**
   * Processa um corpo celeste completo
   */
  static parseCelestialBody(key: string, body: any): CelestialBody {
    if (!body || typeof body !== 'object') {
      throw new Error(`Dados do corpo celeste ${key} devem ser um objeto`);
    }

    const parsed: CelestialBody = {
      nome: body.nome || key,
      massa: this.parseMass(body.massa),
      raio: this.parseRadius(body.raio),
      cor: this.parseColor(body.cor)
    };

    // Processar parâmetros orbitais se existirem
    if (body.orbital) {
      parsed.orbital = this.parseOrbitalParameters(body.orbital);
    }

    return parsed;
  }

  /**
   * Processa dados astronômicos completos
   */
  static parseAstronomicalData(rawData: any): AstronomicalData {
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Dados astronômicos devem ser um objeto');
    }

    const parsed: AstronomicalData = {};
    const processLog: string[] = [];

    for (const [key, body] of Object.entries(rawData)) {
      try {
        parsed[key] = this.parseCelestialBody(key, body);
        processLog.push(`✅ ${key}: processado com sucesso`);
      } catch (error) {
        const errorMsg = `❌ ${key}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        processLog.push(errorMsg);
        throw new Error(`Erro ao processar ${key}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    console.log('📋 Log de processamento dos dados astronômicos:');
    processLog.forEach(log => console.log(`  ${log}`));

    return parsed;
  }

  /**
   * Valida consistência dos dados astronômicos
   */
  static validateDataConsistency(data: AstronomicalData): boolean {
    const warnings: string[] = [];
    
    // Verificar se o Sol existe
    if (!data.sol) {
      warnings.push('Sol não encontrado nos dados');
    }

    // Verificar se todos os planetas principais existem
    const expectedPlanets = ['mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno'];
    const missingPlanets = expectedPlanets.filter(planet => !data[planet]);
    if (missingPlanets.length > 0) {
      warnings.push(`Planetas ausentes: ${missingPlanets.join(', ')}`);
    }

    // Verificar se planetas têm parâmetros orbitais
    const planetsWithoutOrbits = expectedPlanets.filter(planet => 
      data[planet] && !data[planet].orbital
    );
    if (planetsWithoutOrbits.length > 0) {
      warnings.push(`Planetas sem parâmetros orbitais: ${planetsWithoutOrbits.join(', ')}`);
    }

    // Log de avisos
    if (warnings.length > 0) {
      console.warn('⚠️ Avisos de consistência dos dados:');
      warnings.forEach(warning => console.warn(`  ${warning}`));
    } else {
      console.log('✅ Dados astronômicos consistentes');
    }

    return warnings.length === 0;
  }
}
