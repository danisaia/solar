import { Object3D, Vector3 } from 'three';
import { CelestialBody, Vector3D } from '../types';
import { OrbitalMechanics } from './OrbitalMechanics';
import { SimulationTimeManager } from './SimulationTimeManager';
import { PARENT_MOONS, PLANET_MOONS } from '../core/constants';

/**
 * Representa um corpo celeste na hierarquia do sistema solar
 */
export interface CelestialObject {
  id: string;
  name: string;
  data: CelestialBody;
  mesh?: Object3D;
  position: Vector3D;
  parent?: CelestialObject;
  children: CelestialObject[];
  orbitPath?: Vector3D[];
  isVisible: boolean;
}

/**
 * Gerenciador da hierarquia de objetos celestes
 * Controla relações pais-filhos e atualizações de posição
 */
export class CelestialHierarchy {
  private static instance: CelestialHierarchy;
  
  private celestialObjects: Map<string, CelestialObject>;
  private rootObjects: CelestialObject[];
  private timeManager: SimulationTimeManager;
  
  private constructor() {
    this.celestialObjects = new Map();
    this.rootObjects = [];
    this.timeManager = SimulationTimeManager.getInstance();
  }
  
  public static getInstance(): CelestialHierarchy {
    if (!CelestialHierarchy.instance) {
      CelestialHierarchy.instance = new CelestialHierarchy();
    }
    return CelestialHierarchy.instance;
  }
  
  /**
   * Adiciona um corpo celeste à hierarquia
   */
  public addCelestialBody(id: string, data: CelestialBody, mesh?: Object3D): CelestialObject {
    const celestialObject: CelestialObject = {
      id,
      name: data.nome,
      data,
      mesh,
      position: { x: 0, y: 0, z: 0 },
      children: [],
      isVisible: true
    };
    
    // Determinar relação pai-filho
    const parentId = PARENT_MOONS[id];
    if (parentId) {
      // É uma lua - encontrar planeta pai
      const parent = this.celestialObjects.get(parentId);
      if (parent) {
        celestialObject.parent = parent;
        parent.children.push(celestialObject);
      } else {
        console.warn(`Planeta pai '${parentId}' não encontrado para lua '${id}'`);
      }
    } else if (id !== 'sol') {
      // É um planeta - Sol como pai implícito
      const sun = this.celestialObjects.get('sol');
      if (sun) {
        celestialObject.parent = sun;
        sun.children.push(celestialObject);
      }
    }
    
    // Adicionar à estrutura
    this.celestialObjects.set(id, celestialObject);
    
    // Se não tem pai, é um objeto raiz (Sol)
    if (!celestialObject.parent) {
      this.rootObjects.push(celestialObject);
    }
    
    // Gerar caminho da órbita se tem parâmetros orbitais
    if (data.orbital) {
      celestialObject.orbitPath = OrbitalMechanics.generateOrbitPath(data.orbital);
    }
    
    console.log(`Adicionado corpo celeste: ${data.nome} ${parentId ? `(lua de ${parentId})` : ''}`);
    
    return celestialObject;
  }
  
  /**
   * Obtém um objeto celeste por ID
   */
  public getCelestialObject(id: string): CelestialObject | undefined {
    return this.celestialObjects.get(id);
  }
  
  /**
   * Obtém todos os objetos celestes
   */
  public getAllCelestialObjects(): CelestialObject[] {
    return Array.from(this.celestialObjects.values());
  }
  
  /**
   * Obtém planetas (filhos diretos do Sol)
   */
  public getPlanets(): CelestialObject[] {
    const sun = this.celestialObjects.get('sol');
    return sun ? sun.children : [];
  }
  
  /**
   * Obtém luas de um planeta específico
   */
  public getMoons(planetId: string): CelestialObject[] {
    const planet = this.celestialObjects.get(planetId);
    return planet ? planet.children : [];
  }
  
  /**
   * Atualiza todas as posições dos objetos celestes
   */
  public updatePositions(): void {
    const currentTime = this.timeManager.getCurrentTime();
    
    // Atualizar posições recursivamente, começando pelos objetos raiz
    for (const rootObject of this.rootObjects) {
      this.updateObjectPosition(rootObject, currentTime);
    }
  }
  
  /**
   * Atualiza posição de um objeto e seus filhos recursivamente
   */
  private updateObjectPosition(obj: CelestialObject, currentTime: Date): void {
    // Calcular posição baseada na órbita
    if (obj.data.orbital && obj.parent) {
      obj.position = OrbitalMechanics.calculatePosition(
        obj.data.orbital,
        obj.parent.position,
        currentTime
      );
    } else if (obj.id === 'sol') {
      // Sol permanece no centro
      obj.position = { x: 0, y: 0, z: 0 };
    }
    
    // Atualizar mesh 3D se existir
    if (obj.mesh) {
      obj.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
    }
    
    // Atualizar filhos recursivamente
    for (const child of obj.children) {
      this.updateObjectPosition(child, currentTime);
    }
  }
  
  /**
   * Obtém a posição atual de um corpo celeste
   */
  public getPosition(id: string): Vector3D | null {
    const obj = this.celestialObjects.get(id);
    return obj ? { ...obj.position } : null;
  }
  
  /**
   * Calcula a distância entre dois corpos celestes
   */
  public getDistance(id1: string, id2: string): number | null {
    const obj1 = this.celestialObjects.get(id1);
    const obj2 = this.celestialObjects.get(id2);
    
    if (!obj1 || !obj2) return null;
    
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const dz = obj1.position.z - obj2.position.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Obtém o caminho orbital de um corpo celeste
   */
  public getOrbitPath(id: string): Vector3D[] | null {
    const obj = this.celestialObjects.get(id);
    return obj?.orbitPath || null;
  }
  
  /**
   * Define visibilidade de um objeto e seus filhos
   */
  public setVisibility(id: string, visible: boolean, includeChildren: boolean = false): void {
    const obj = this.celestialObjects.get(id);
    if (!obj) return;
    
    obj.isVisible = visible;
    if (obj.mesh) {
      obj.mesh.visible = visible;
    }
    
    if (includeChildren) {
      for (const child of obj.children) {
        this.setVisibility(child.id, visible, true);
      }
    }
  }
  
  /**
   * Obtém estatísticas da hierarquia
   */
  public getHierarchyStats(): {
    totalObjects: number;
    planets: number;
    moons: number;
    rootObjects: number;
  } {
    const planets = this.getPlanets();
    let totalMoons = 0;
    
    for (const planet of planets) {
      totalMoons += planet.children.length;
    }
    
    return {
      totalObjects: this.celestialObjects.size,
      planets: planets.length,
      moons: totalMoons,
      rootObjects: this.rootObjects.length
    };
  }
  
  /**
   * Busca corpo celeste por nome (case-insensitive)
   */
  public findByName(name: string): CelestialObject | null {
    const normalizedName = name.toLowerCase().trim();
    
    for (const obj of this.celestialObjects.values()) {
      if (obj.name.toLowerCase().includes(normalizedName) || 
          obj.id.toLowerCase().includes(normalizedName)) {
        return obj;
      }
    }
    
    return null;
  }
  
  /**
   * Limpa toda a hierarquia
   */
  public clear(): void {
    this.celestialObjects.clear();
    this.rootObjects = [];
  }
  
  /**
   * Obtém informações de debug de um objeto
   */
  public getDebugInfo(id: string): any {
    const obj = this.celestialObjects.get(id);
    if (!obj) return null;
    
    return {
      id: obj.id,
      name: obj.name,
      position: obj.position,
      hasParent: !!obj.parent,
      parentId: obj.parent?.id,
      childrenCount: obj.children.length,
      childrenIds: obj.children.map(c => c.id),
      hasOrbitalData: !!obj.data.orbital,
      hasOrbitPath: !!obj.orbitPath,
      orbitPathLength: obj.orbitPath?.length || 0,
      isVisible: obj.isVisible,
      hasMesh: !!obj.mesh
    };
  }
}
