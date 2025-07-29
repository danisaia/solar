import * as THREE from 'three';
import { Vector3D, OrbitalParameters } from '../types';
import { OrbitalMechanics } from '../physics/OrbitalMechanics';
import { CelestialHierarchy, CelestialObject } from '../physics/CelestialHierarchy';
import { SimulationStateManager } from './SimulationStateManager';
import { RENDER_THRESHOLDS, PARENT_MOONS } from '../core/constants';

/**
 * Renderizador de órbitas dos corpos celestes
 * Migrado do sistema de renderização de órbitas do Panda3D
 */
export class OrbitRenderer {
  private scene: THREE.Scene;
  private camera?: THREE.Camera;
  private orbitLines: Map<string, THREE.Line>;
  private celestialHierarchy: CelestialHierarchy;
  private stateManager: SimulationStateManager;
  
  // Material para linhas orbitais
  private orbitMaterial: THREE.LineBasicMaterial;
  
  constructor(scene: THREE.Scene, camera?: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.orbitLines = new Map();
    this.celestialHierarchy = CelestialHierarchy.getInstance();
    this.stateManager = SimulationStateManager.getInstance();
    
    // Material padrão para órbitas
    this.orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.6
    });
  }
  
  /**
   * Define a câmera para cálculos de zoom
   */
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }
  
  /**
   * Atualiza todas as órbitas baseado no estado atual da simulação
   * Equivalente à lógica de renderização de órbitas do Panda3D
   */
  public updateOrbits(): void {
    const state = this.stateManager.getState();
    const currentTarget = state.target;
    const zoom = this.calculateZoom();
    
    // Limites de visibilidade (migrados do código Python)
    const MOON_ZOOM_THRESHOLD = RENDER_THRESHOLDS.MOON_ZOOM_THRESHOLD;
    const ORBIT_DISPLAY_THRESHOLD = RENDER_THRESHOLDS.ORBIT_DISPLAY_THRESHOLD;
    
    // Determinar se o alvo atual é uma lua e qual é seu planeta pai
    const targetIsLuna = PARENT_MOONS[currentTarget] !== undefined;
    const targetParentPlanet = PARENT_MOONS[currentTarget] || null;
    
    // Limpar órbitas existentes
    this.clearAllOrbits();
    
    // Processar cada corpo celeste
    this.celestialHierarchy.getAllCelestialObjects().forEach(obj => {
      if (!obj.data.orbital || obj.id === 'sol') return;
      
      const shouldShowOrbit = this.shouldShowOrbit(
        obj,
        currentTarget,
        targetIsLuna,
        targetParentPlanet,
        zoom,
        MOON_ZOOM_THRESHOLD,
        ORBIT_DISPLAY_THRESHOLD
      );
      
      if (shouldShowOrbit) {
        this.createOrbitLine(obj);
      }
    });
  }
  
  /**
   * Determina se a órbita de um corpo deve ser exibida
   * Implementa a lógica complexa do código Python original
   */
  private shouldShowOrbit(
    obj: CelestialObject,
    currentTarget: string,
    targetIsLuna: boolean,
    targetParentPlanet: string | null,
    zoom: number,
    MOON_ZOOM_THRESHOLD: number,
    ORBIT_DISPLAY_THRESHOLD: number
  ): boolean {
    
    // Caso 1: É o alvo atual
    if (obj.id === currentTarget) {
      return true;
    }
    
    // Caso 2: É o planeta pai do alvo (quando o alvo é uma lua)
    if (targetIsLuna && obj.id === targetParentPlanet) {
      return true;
    }
    
    // Caso 3: É uma lua do planeta em foco
    if (obj.parent && obj.parent.id !== 'sol' && obj.parent.id === currentTarget) {
      return true;
    }
    
    // Caso 4: Zoom está abaixo do limiar para mostrar todas as órbitas
    if (zoom < ORBIT_DISPLAY_THRESHOLD) {
      // Para planetas, sempre mostrar
      if (!obj.parent || obj.parent.id === 'sol') {
        return true;
      }
      // Para luas, verificar o zoom específico para luas
      if (zoom >= MOON_ZOOM_THRESHOLD) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Cria linha orbital para um corpo celeste específico
   */
  private createOrbitLine(obj: CelestialObject): void {
    if (!obj.data.orbital) return;
    
    // Gerar pontos da órbita
    const orbitPoints = OrbitalMechanics.generateOrbitPath(
      obj.data.orbital,
      RENDER_THRESHOLDS.ORBIT_SEGMENTS
    );
    
    // Ajustar posição relativa se é uma lua
    const adjustedPoints = orbitPoints.map(point => {
      if (obj.parent && obj.parent.id !== 'sol') {
        const parentPos = obj.parent.position;
        return {
          x: point.x + parentPos.x,
          y: point.y + parentPos.y,
          z: point.z + parentPos.z
        };
      }
      return point;
    });
    
    // Converter para geometria Three.js
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(adjustedPoints.length * 3);
    
    adjustedPoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Criar material com cor específica
    const material = this.createOrbitMaterial(obj);
    
    // Criar linha orbital
    const line = new THREE.Line(geometry, material);
    line.name = `orbit_${obj.id}`;
    
    // Adicionar à cena e cache
    this.scene.add(line);
    this.orbitLines.set(obj.id, line);
  }
  
  /**
   * Cria material específico para a órbita baseado no tipo de corpo
   */
  private createOrbitMaterial(obj: CelestialObject): THREE.LineBasicMaterial {
    let color = 0x444444;
    let opacity = 0.6;
    
    // Cor diferenciada baseada no tipo
    if (obj.parent && obj.parent.id !== 'sol') {
      // É uma lua - cor mais clara
      color = 0x888888;
      opacity = 0.4;
    } else {
      // É um planeta - cor baseada na cor do corpo
      const bodyColor = new THREE.Color(obj.data.cor);
      color = bodyColor.getHex();
      opacity = 0.3;
    }
    
    return new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      linewidth: RENDER_THRESHOLDS.ORBIT_LINE_WIDTH
    });
  }
  
  /**
   * Calcula o zoom atual baseado na distância da câmera
   * Equivalente ao cálculo de zoom do código Python
   */
  private calculateZoom(): number {
    if (!this.camera) {
      return 1.0; // Valor padrão se não há câmera
    }
    
    // Calcular distância da câmera ao centro
    const distanceToCenter = this.camera.position.length();
    
    // Normalizar zoom similar ao código Python
    // zoom = 1.0 / max(distanceToCenter / 100, 0.001)
    return 1.0 / Math.max(distanceToCenter / 100, 0.001);
  }
  
  /**
   * Remove todas as órbitas da cena
   */
  private clearAllOrbits(): void {
    this.orbitLines.forEach((line, id) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.orbitLines.clear();
  }
  
  /**
   * Remove órbita específica
   */
  public removeOrbit(objectId: string): void {
    const line = this.orbitLines.get(objectId);
    if (line) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      this.orbitLines.delete(objectId);
    }
  }
  
  /**
   * Define visibilidade de todas as órbitas
   */
  public setOrbitsVisibility(visible: boolean): void {
    this.orbitLines.forEach(line => {
      line.visible = visible;
    });
  }
  
  /**
   * Define visibilidade de órbita específica
   */
  public setOrbitVisibility(objectId: string, visible: boolean): void {
    const line = this.orbitLines.get(objectId);
    if (line) {
      line.visible = visible;
    }
  }
  
  /**
   * Obtém estatísticas das órbitas renderizadas
   */
  public getOrbitStats(): {
    totalOrbits: number;
    visibleOrbits: number;
    totalVertices: number;
  } {
    let visibleCount = 0;
    let totalVertices = 0;
    
    this.orbitLines.forEach(line => {
      if (line.visible) visibleCount++;
      totalVertices += line.geometry.attributes.position.count;
    });
    
    return {
      totalOrbits: this.orbitLines.size,
      visibleOrbits: visibleCount,
      totalVertices: totalVertices
    };
  }
  
  /**
   * Limpa todos os recursos
   */
  public dispose(): void {
    this.clearAllOrbits();
    this.orbitMaterial.dispose();
  }
}
