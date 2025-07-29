import * as THREE from 'three';
import { CelestialObject } from './CelestialHierarchy';

/**
 * Sistema de otimização de performance para o simulador
 * Implementa BufferGeometry, instancing e outras otimizações
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  
  // Cache de geometrias reutilizáveis
  private geometryCache: Map<string, THREE.BufferGeometry>;
  private materialCache: Map<string, THREE.Material>;
  
  // Sistema de instancing para objetos similares
  private instancedMeshes: Map<string, THREE.InstancedMesh>;
  
  // Métricas de performance
  private performanceMetrics: {
    geometriesCreated: number;
    materialsCreated: number;
    instancesCreated: number;
    memoryUsage: number;
  };
  
  private constructor() {
    this.geometryCache = new Map();
    this.materialCache = new Map();
    this.instancedMeshes = new Map();
    this.performanceMetrics = {
      geometriesCreated: 0,
      materialsCreated: 0,
      instancesCreated: 0,
      memoryUsage: 0
    };
  }
  
  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  
  /**
   * Cria ou reutiliza uma geometria esférica otimizada
   */
  public getOptimizedSphereGeometry(
    radius: number, 
    detail: 'low' | 'medium' | 'high' = 'medium'
  ): THREE.BufferGeometry {
    
    // Determinar segmentos baseado no nível de detalhe
    const segments = {
      low: { width: 8, height: 6 },
      medium: { width: 16, height: 12 },
      high: { width: 32, height: 24 }
    }[detail];
    
    const key = `sphere_${radius.toFixed(3)}_${detail}`;
    
    if (!this.geometryCache.has(key)) {
      const geometry = new THREE.SphereGeometry(
        radius, 
        segments.width, 
        segments.height
      );
      
      // Otimizações de BufferGeometry
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      
      this.geometryCache.set(key, geometry);
      this.performanceMetrics.geometriesCreated++;
    }
    
    return this.geometryCache.get(key)!;
  }
  
  /**
   * Cria ou reutiliza um material PBR otimizado
   */
  public getOptimizedMaterial(
    color: string | number,
    options: {
      emissive?: boolean;
      metalness?: number;
      roughness?: number;
      transparent?: boolean;
    } = {}
  ): THREE.Material {
    
    const key = `material_${color}_${JSON.stringify(options)}`;
    
    if (!this.materialCache.has(key)) {
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: options.emissive ? color : 0x000000,
        emissiveIntensity: options.emissive ? 0.3 : 0,
        shininess: options.metalness ? 100 : 30,
        transparent: options.transparent || false,
        opacity: options.transparent ? 0.8 : 1.0
      });
      
      this.materialCache.set(key, material);
      this.performanceMetrics.materialsCreated++;
    }
    
    return this.materialCache.get(key)!;
  }
  
  /**
   * Cria sistema de instancing para objetos similares (como asteroides)
   */
  public createInstancedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
    name: string
  ): THREE.InstancedMesh {
    
    if (this.instancedMeshes.has(name)) {
      return this.instancedMeshes.get(name)!;
    }
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.name = name;
    
    // Configurar instâncias com posições aleatórias (exemplo para campo de asteroides)
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 1000
      );
      
      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      const scale = new THREE.Vector3(1, 1, 1);
      
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
      instancedMesh.setMatrixAt(i, matrix);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    this.instancedMeshes.set(name, instancedMesh);
    this.performanceMetrics.instancesCreated++;
    
    return instancedMesh;
  }
  
  /**
   * Otimiza um objeto celeste existente
   */
  public optimizeCelestialObject(obj: CelestialObject): void {
    if (!obj.mesh) return;
    
    // Aplicar frustum culling
    obj.mesh.frustumCulled = true;
    
    // Configurar matrix auto-update baseado na distância
    if (obj.data.orbital) {
      // Objetos orbitais precisam de updates constantes
      obj.mesh.matrixAutoUpdate = true;
    } else if (obj.id === 'sol') {
      // Sol é estático
      obj.mesh.matrixAutoUpdate = false;
      obj.mesh.updateMatrix();
    }
    
    // Configurar renderOrder baseado no tamanho
    const radius = obj.data.raio || 1;
    obj.mesh.renderOrder = radius > 1000 ? 0 : 1; // Objetos grandes primeiro
  }
  
  /**
   * Sistema de LOD dinâmico
   */
  public createLODObject(
    obj: CelestialObject,
    distances: number[] = [100, 500, 1000]
  ): THREE.LOD {
    
    const lod = new THREE.LOD();
    
    // Nível 0 - Alta qualidade (próximo)
    const highDetailMesh = new THREE.Mesh(
      this.getOptimizedSphereGeometry(obj.data.raio, 'high'),
      this.getOptimizedMaterial(obj.data.cor)
    );
    lod.addLevel(highDetailMesh, 0);
    
    // Nível 1 - Qualidade média
    const mediumDetailMesh = new THREE.Mesh(
      this.getOptimizedSphereGeometry(obj.data.raio, 'medium'),
      this.getOptimizedMaterial(obj.data.cor)
    );
    lod.addLevel(mediumDetailMesh, distances[0]);
    
    // Nível 2 - Baixa qualidade (distante)
    const lowDetailMesh = new THREE.Mesh(
      this.getOptimizedSphereGeometry(obj.data.raio, 'low'),
      this.getOptimizedMaterial(obj.data.cor)
    );
    lod.addLevel(lowDetailMesh, distances[1]);
    
    // Nível 3 - Muito distante (apenas ponto)
    const pointGeometry = new THREE.BufferGeometry();
    const pointMaterial = new THREE.PointsMaterial({
      color: obj.data.cor,
      size: 2
    });
    const pointMesh = new THREE.Points(pointGeometry, pointMaterial);
    lod.addLevel(pointMesh, distances[2]);
    
    return lod;
  }
  
  /**
   * Limpa caches para liberação de memória
   */
  public clearCaches(): void {
    // Dispose de todas as geometrias
    this.geometryCache.forEach(geometry => {
      geometry.dispose();
    });
    this.geometryCache.clear();
    
    // Dispose de todos os materiais
    this.materialCache.forEach(material => {
      material.dispose();
    });
    this.materialCache.clear();
    
    // Limpar instanced meshes
    this.instancedMeshes.clear();
    
    console.log('Cache de performance limpo');
  }
  
  /**
   * Obtém métricas de performance
   */
  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Otimização automática baseada na performance atual
   */
  public autoOptimize(renderer: THREE.WebGLRenderer): void {
    const info = renderer.info;
    
    // Se muitos triângulos, reduzir qualidade
    if (info.render.triangles > 100000) {
      console.warn('Muitos triângulos detectados, otimizando...');
      // Implementar redução automática de qualidade
    }
    
    // Se muita memória usada, limpar caches antigos
    if (info.memory.geometries > 50) {
      console.warn('Muitas geometrias em memória, limpando cache...');
      this.clearOldCacheEntries();
    }
  }
  
  /**
   * Remove entradas antigas do cache
   */
  private clearOldCacheEntries(): void {
    // Implementar lógica LRU (Least Recently Used) se necessário
    const maxEntries = 20;
    
    if (this.geometryCache.size > maxEntries) {
      const entries = Array.from(this.geometryCache.entries());
      const toRemove = entries.slice(0, entries.length - maxEntries);
      
      toRemove.forEach(([key, geometry]) => {
        geometry.dispose();
        this.geometryCache.delete(key);
      });
    }
  }
}
