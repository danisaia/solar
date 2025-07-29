// Utilitários matemáticos para cálculos astronômicos

/**
 * Converte graus para radianos
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converte radianos para graus
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normaliza um ângulo para o intervalo [0, 2π]
 */
export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
}

/**
 * Interpola linearmente entre dois valores
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Clamp um valor entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converte cor hexadecimal para valores RGB normalizados
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
}

/**
 * Calcula a distância entre dois pontos 3D
 */
export function distance3D(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Parse de número que pode ser uma expressão (equivalente ao parse_number do Python)
 */
export function parseNumber(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  // Para expressões simples como "27.3/365.25"
  try {
    // Sanitize a expressão para aceitar apenas operações matemáticas básicas
    const sanitized = value.replace(/[^0-9+\-*/().e\s]/g, '');
    return Function(`"use strict"; return (${sanitized})`)();
  } catch {
    return parseFloat(value);
  }
}
