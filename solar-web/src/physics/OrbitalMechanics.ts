import { Vector3 } from 'three';
import { OrbitalParameters, Vector3D } from '../types';
import { PHYSICS_CONSTANTS, REFERENCE_DATE } from '../core/constants';

/**
 * Classe para cálculos de mecânica orbital
 * Migrada do código Python original com precisão astronômica
 */
export class OrbitalMechanics {
  
  /**
   * Calcula posição orbital 3D a partir de parâmetros orbitais
   * @param orbital Parâmetros orbitais do corpo celeste
   * @param parentPosition Posição do corpo pai (para luas)
   * @param currentTime Data atual da simulação
   * @returns Posição 3D em metros
   */
  static calculatePosition(
    orbital: OrbitalParameters, 
    parentPosition: Vector3D = { x: 0, y: 0, z: 0 },
    currentTime: Date = new Date()
  ): Vector3D {
    
    // Calcular tempo decorrido desde a época de referência (J2000.0)
    const timeDiff = currentTime.getTime() - REFERENCE_DATE.getTime();
    const timeInDays = timeDiff / (1000 * 60 * 60 * 24);
    const timeInYears = timeInDays / 365.25;
    
    // Parâmetros orbitais
    const a = orbital.a * PHYSICS_CONSTANTS.AU;  // Semieixo maior em metros
    const e = orbital.e;                         // Excentricidade
    const i = orbital.i * Math.PI / 180;         // Inclinação em radianos
    const Omega = orbital.Ω * Math.PI / 180;     // Longitude do nodo ascendente
    const omega = orbital.ω * Math.PI / 180;     // Argumento do periélio
    const M0 = orbital.M * Math.PI / 180;        // Anomalia média na época
    const T = orbital.T;                         // Período orbital em anos
    
    // Calcular anomalia média atual
    const n = 2 * Math.PI / T;  // Movimento médio (radianos por ano)
    const M = M0 + n * timeInYears;
    
    // Resolver equação de Kepler para anomalia excêntrica
    const E = this.solveKeplerEquation(M, e);
    
    // Calcular anomalia verdadeira
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    
    // Calcular distância ao foco
    const r = a * (1 - e * Math.cos(E));
    
    // Posição no plano orbital
    const x_orbital = r * Math.cos(nu);
    const y_orbital = r * Math.sin(nu);
    
    // Transformar para coordenadas heliocêntricas/baricêntricas
    const position = this.orbitalToCartesian(
      x_orbital, y_orbital, 0,
      i, Omega, omega
    );
    
    // Adicionar posição do corpo pai (para sistemas de luas)
    return {
      x: position.x + parentPosition.x,
      y: position.y + parentPosition.y,
      z: position.z + parentPosition.z
    };
  }
  
  /**
   * Resolve a equação de Kepler usando método de Newton-Raphson
   * M = E - e * sin(E)
   */
  private static solveKeplerEquation(M: number, e: number, tolerance: number = 1e-8): number {
    let E = M;  // Estimativa inicial
    let delta = tolerance + 1;
    let iterations = 0;
    const maxIterations = 30;
    
    while (Math.abs(delta) > tolerance && iterations < maxIterations) {
      const f = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      delta = f / fp;
      E = E - delta;
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      console.warn(`Equação de Kepler não convergiu para M=${M}, e=${e}`);
    }
    
    return E;
  }
  
  /**
   * Converte coordenadas orbitais para cartesianas
   * Aplica rotações pelos ângulos de Euler astronômicos
   */
  private static orbitalToCartesian(
    x: number, y: number, z: number,
    i: number, Omega: number, omega: number
  ): Vector3D {
    
    // Rotação pelo argumento do periélio
    const cos_omega = Math.cos(omega);
    const sin_omega = Math.sin(omega);
    const x1 = x * cos_omega - y * sin_omega;
    const y1 = x * sin_omega + y * cos_omega;
    const z1 = z;
    
    // Rotação pela inclinação
    const cos_i = Math.cos(i);
    const sin_i = Math.sin(i);
    const x2 = x1;
    const y2 = y1 * cos_i - z1 * sin_i;
    const z2 = y1 * sin_i + z1 * cos_i;
    
    // Rotação pela longitude do nodo ascendente
    const cos_Omega = Math.cos(Omega);
    const sin_Omega = Math.sin(Omega);
    const x3 = x2 * cos_Omega - y2 * sin_Omega;
    const y3 = x2 * sin_Omega + y2 * cos_Omega;
    const z3 = z2;
    
    return { x: x3, y: y3, z: z3 };
  }
  
  /**
   * Calcula velocidade orbital em um ponto específico
   * Útil para animações e efeitos visuais
   */
  static calculateVelocity(
    orbital: OrbitalParameters,
    position: Vector3D,
    currentTime: Date = new Date()
  ): Vector3D {
    const a = orbital.a * PHYSICS_CONSTANTS.AU;
    const GM = 1.327e20; // Constante gravitacional padrão do Sol (m³/s²)
    
    const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const v_magnitude = Math.sqrt(GM * (2/r - 1/a));
    
    // Direção perpendicular ao raio (simplificada)
    const v_direction = {
      x: -position.y / r,
      y: position.x / r,
      z: 0
    };
    
    return {
      x: v_direction.x * v_magnitude,
      y: v_direction.y * v_magnitude,
      z: v_direction.z * v_magnitude
    };
  }
  
  /**
   * Gera pontos da órbita completa para renderização
   * @param orbital Parâmetros orbitais
   * @param segments Número de segmentos da órbita
   * @returns Array de pontos 3D da órbita
   */
  static generateOrbitPath(
    orbital: OrbitalParameters,
    segments: number = 200
  ): Vector3D[] {
    const points: Vector3D[] = [];
    const a = orbital.a * PHYSICS_CONSTANTS.AU;
    const e = orbital.e;
    const i = orbital.i * Math.PI / 180;
    const Omega = orbital.Ω * Math.PI / 180;
    const omega = orbital.ω * Math.PI / 180;
    
    for (let j = 0; j <= segments; j++) {
      const nu = (2 * Math.PI * j) / segments; // Anomalia verdadeira
      const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
      
      const x_orbital = r * Math.cos(nu);
      const y_orbital = r * Math.sin(nu);
      
      const position = this.orbitalToCartesian(
        x_orbital, y_orbital, 0,
        i, Omega, omega
      );
      
      points.push(position);
    }
    
    return points;
  }
  
  /**
   * Calcula período orbital em anos a partir do semieixo maior
   * Usando a terceira lei de Kepler
   */
  static calculateOrbitalPeriod(semiMajorAxis: number): number {
    // T² = (4π²/GM) * a³
    // Para o Sol: GM = 1.327e20 m³/s²
    const GM_sun = 1.327e20;
    const a_meters = semiMajorAxis * PHYSICS_CONSTANTS.AU;
    const T_seconds = 2 * Math.PI * Math.sqrt(Math.pow(a_meters, 3) / GM_sun);
    const T_years = T_seconds / (365.25 * 24 * 3600);
    return T_years;
  }
}
