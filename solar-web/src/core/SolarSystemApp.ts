// Classe principal da aplicação Solar System
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  CAMERA_CONFIG, 
  RENDERER_CONFIG, 
  CONTROLS_CONFIG, 
  LIGHTING_CONFIG, 
  SCENE_CONFIG, 
  TEST_SIZES, 
  ANIMATION_SPEEDS, 
  BODY_COLORS,
  PHYSICS_CONSTANTS
} from './constants';
import { DataLoader } from '../data/DataLoader';
import { AstronomicalData } from '../types/index';
import { 
  OrbitalMechanics, 
  SimulationTimeManager, 
  CelestialHierarchy, 
  CelestialObject,
  PerformanceOptimizer 
} from '../physics';
import { SimulationStateManager } from './SimulationStateManager';
import { OrbitRenderer } from './OrbitRenderer';

/**
 * Classe principal que gerencia toda a aplicação do Sistema Solar
 * Equivalente à classe SistemaSolar do Panda3D
 */
export class SolarSystemApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private container!: HTMLElement;
  private controls!: OrbitControls;
  
  // Sistema de iluminação
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private sunPointLight!: THREE.PointLight;
  
  // Dados astronômicos
  private dataLoader!: DataLoader;
  private astronomicalData!: AstronomicalData;
  
  // Sistema de física orbital
  private timeManager!: SimulationTimeManager;
  private celestialHierarchy!: CelestialHierarchy;
  private stateManager!: SimulationStateManager;
  private performanceOptimizer!: PerformanceOptimizer;
  private orbitRenderer!: OrbitRenderer;
  
  constructor() {
    console.log('🌌 Criando aplicação Sistema Solar...');
    this.dataLoader = DataLoader.getInstance();
  }
  
  /**
   * Inicializa a aplicação Three.js
   */
  async initialize(): Promise<void> {
    console.log('🔧 Configurando Three.js...');
    console.log(`📊 Informações do dispositivo:
    - User Agent: ${navigator.userAgent.slice(0, 50)}...
    - Pixel Ratio: ${window.devicePixelRatio}
    - Resolução: ${window.innerWidth}x${window.innerHeight}
    - WebGL: ${this.checkWebGLSupport() ? '✅ Suportado' : '❌ Não suportado'}`);
    
    // Carregar dados astronômicos primeiro
    await this.loadAstronomicalData();
    
    // Inicializar sistemas de física
    this.initPhysicsSystems();
    
    // Encontra o container
    this.container = document.getElementById('canvas-container')!;
    if (!this.container) {
      throw new Error('Container canvas-container não encontrado');
    }
    
    // Inicializa componentes básicos do Three.js
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    
    // Inicializar renderizador de órbitas após cena e câmera criadas
    this.orbitRenderer = new OrbitRenderer(this.scene, this.camera);
    
    // Criar objetos celestes baseados nos dados reais
    this.createCelestialObjects();
    
    // Inicia o loop de renderização
    this.startRenderLoop();
    
    // Configura redimensionamento
    this.setupResize();
    
    // Configurar qualidade baseada na performance
    this.setupDynamicQuality();
    
    console.log('✅ Three.js configurado com sucesso');
  }
  
  /**
   * Carrega dados astronômicos
   */
  private async loadAstronomicalData(): Promise<void> {
    try {
      this.astronomicalData = await this.dataLoader.loadAstronomicalData();
      
      // Validar dados carregados
      if (!this.dataLoader.validateLoadedData()) {
        throw new Error('Dados astronômicos incompletos ou inválidos');
      }
      
      console.log('📊 Dados astronômicos carregados e validados com sucesso');
      
    } catch (error) {
      console.error('❌ Falha ao carregar dados astronômicos:', error);
      throw error;
    }
  }
  
  /**
   * Inicializa os sistemas de física orbital
   */
  private initPhysicsSystems(): void {
    // Inicializar gerenciadores singleton
    this.timeManager = SimulationTimeManager.getInstance();
    this.celestialHierarchy = CelestialHierarchy.getInstance();
    this.stateManager = SimulationStateManager.getInstance();
    this.performanceOptimizer = PerformanceOptimizer.getInstance();
    
    console.log('⚡ Sistemas de física orbital inicializados');
  }
  
  /**
   * Cria objetos celestes baseados nos dados astronômicos
   */
  private createCelestialObjects(): void {
    console.log('🪐 Criando objetos celestes com dados reais...');
    
    // Criar todos os corpos celestes
    for (const [id, data] of Object.entries(this.astronomicalData)) {
      const mesh = this.createCelestialMesh(id, data);
      this.celestialHierarchy.addCelestialBody(id, data, mesh);
      this.scene.add(mesh);
    }
    
    // Atualizar posições iniciais
    this.celestialHierarchy.updatePositions();
    
    const stats = this.celestialHierarchy.getHierarchyStats();
    console.log(`✅ Criados ${stats.totalObjects} objetos celestes (${stats.planets} planetas, ${stats.moons} luas)`);
  }
  
  /**
   * Cria a malha 3D para um corpo celeste com otimizações de performance
   */
  private createCelestialMesh(id: string, data: any): THREE.Object3D {
    // Calcular raio escalado para visualização
    const scaledRadius = data.raio * PHYSICS_CONSTANTS.MODEL_SIZE_FACTOR;
    
    // Ajustar tamanho mínimo para visibilidade
    const minSize = id === 'sol' ? 5 : 0.5;
    const finalRadius = Math.max(scaledRadius, minSize);
    
    // Usar geometria otimizada do cache
    const geometry = this.performanceOptimizer.getOptimizedSphereGeometry(
      finalRadius, 
      finalRadius > 10 ? 'high' : finalRadius > 2 ? 'medium' : 'low'
    );
    
    // Usar material otimizado do cache
    const material = this.performanceOptimizer.getOptimizedMaterial(data.cor, {
      emissive: id === 'sol',
      metalness: id === 'sol' ? 0 : 0.1,
      roughness: id === 'sol' ? 1 : 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = data.nome;
    mesh.userData = { id, type: 'celestial-body', data };
    
    // Configurar sombras
    if (LIGHTING_CONFIG.CAST_SHADOWS && id !== 'sol') {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    
    // Aplicar otimizações específicas do objeto
    if (this.performanceOptimizer) {
      const celestialObj: CelestialObject = {
        id,
        name: data.nome,
        data,
        mesh,
        position: { x: 0, y: 0, z: 0 },
        children: [],
        isVisible: true
      };
      this.performanceOptimizer.optimizeCelestialObject(celestialObj);
    }
    
    return mesh;
  }
  
  /**
   * Verifica suporte ao WebGL
   */
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Configura qualidade dinâmica baseada na performance do dispositivo
   */
  private setupDynamicQuality(): void {
    const canvas = this.renderer.domElement;
    const isHighPerformance = window.devicePixelRatio > 1 && window.innerWidth > 1920;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Configurações para dispositivos móveis
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = false; // Desabilitar sombras em mobile
      console.log('📱 Configurações otimizadas para dispositivo móvel');
    } else if (isHighPerformance) {
      // Configurações para dispositivos de alta performance
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      console.log('🚀 Configurações de alta qualidade ativadas');
    }
  }
  
  /**
   * Inicializa a cena 3D
   */
  private initScene(): void {
    this.scene = new THREE.Scene();
    
    // Criar um fundo estrelado temporário
    this.createStarField();
    
    // Adicionar fog para simular atmosfera espacial distante
    this.scene.fog = new THREE.Fog(
      SCENE_CONFIG.FOG_COLOR, 
      SCENE_CONFIG.FOG_NEAR, 
      SCENE_CONFIG.FOG_FAR
    );
    
    console.log('🌌 Cena 3D inicializada com fundo estrelado');
  }
  
  /**
   * Cria um campo de estrelas como fundo
   */
  private createStarField(): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: false
    });
    
    const starsVertices = [];
    const starCount = 10000;
    
    for (let i = 0; i < starCount; i++) {
      // Distribuir estrelas em uma esfera grande
      const radius = 5000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.name = 'StarField';
    this.scene.add(stars);
  }
  
  /**
   * Inicializa a câmera
   */
  private initCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      aspect,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    );
    
    // Posição inicial da câmera (será ajustada pelos controles)
    this.camera.position.set(
      CAMERA_CONFIG.INITIAL_POSITION.x,
      CAMERA_CONFIG.INITIAL_POSITION.y,
      CAMERA_CONFIG.INITIAL_POSITION.z
    );
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Inicializa o renderizador
   */
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: RENDERER_CONFIG.ANTIALIAS,
      alpha: RENDERER_CONFIG.ALPHA,
      powerPreference: RENDERER_CONFIG.POWER_PREFERENCE,
      preserveDrawingBuffer: RENDERER_CONFIG.PRESERVE_DRAWING_BUFFER,
      logarithmicDepthBuffer: RENDERER_CONFIG.LOGARITHMIC_DEPTH_BUFFER,
      precision: RENDERER_CONFIG.PRECISION,
      premultipliedAlpha: RENDERER_CONFIG.PREMULTIPLIED_ALPHA,
      stencil: RENDERER_CONFIG.STENCIL,
      depth: RENDERER_CONFIG.DEPTH
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_CONFIG.MAX_PIXEL_RATIO));
    
    // Configurações de qualidade conforme roteiro
    this.renderer.shadowMap.enabled = LIGHTING_CONFIG.CAST_SHADOWS;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Configurações para objetos astronômicos e grandes distâncias
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = RENDERER_CONFIG.TONE_MAPPING_EXPOSURE;
    
    // Configurações de culling para performance
    this.renderer.sortObjects = true;
    
    this.container.appendChild(this.renderer.domElement);
    
    console.log('🎨 Renderizador configurado com qualidade avançada');
  }
  
  /**
   * Inicializa os controles de navegação (OrbitControls como base)
   */
  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Configurações básicas dos controles
    this.controls.enableDamping = CONTROLS_CONFIG.ENABLE_DAMPING;
    this.controls.dampingFactor = CONTROLS_CONFIG.DAMPING_FACTOR;
    
    // Limites de zoom (serão ajustados dinamicamente baseados no objeto focado)
    this.controls.minDistance = CONTROLS_CONFIG.MIN_DISTANCE;
    this.controls.maxDistance = CONTROLS_CONFIG.MAX_DISTANCE;
    
    // Velocidades de rotação e zoom otimizadas para navegação espacial
    this.controls.rotateSpeed = CONTROLS_CONFIG.ROTATE_SPEED;
    this.controls.zoomSpeed = CONTROLS_CONFIG.ZOOM_SPEED;
    this.controls.panSpeed = CONTROLS_CONFIG.PAN_SPEED;
    
    // Limites de rotação vertical (permitir ver de qualquer ângulo no espaço)
    this.controls.minPolarAngle = CONTROLS_CONFIG.MIN_POLAR_ANGLE;
    this.controls.maxPolarAngle = CONTROLS_CONFIG.MAX_POLAR_ANGLE;
    
    // Configurações avançadas
    this.controls.autoRotate = CONTROLS_CONFIG.AUTO_ROTATE;
    this.controls.autoRotateSpeed = CONTROLS_CONFIG.AUTO_ROTATE_SPEED;
    
    // Permitir todas as interações básicas
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    
    // Configurar target inicial (centro do sistema solar)
    this.controls.target.set(0, 0, 0);
    
    console.log('🎮 Controles OrbitControls configurados com navegação aprimorada');
  }
  
  /**
   * Inicializa o sistema de iluminação
   */
  private initLights(): void {
    // Luz ambiente muito fraca (espaço é predominantemente escuro)
    this.ambientLight = new THREE.AmbientLight(
      LIGHTING_CONFIG.AMBIENT_COLOR, 
      LIGHTING_CONFIG.AMBIENT_INTENSITY
    );
    this.scene.add(this.ambientLight);
    
    // Luz direcional simulando luz solar distante
    this.sunLight = new THREE.DirectionalLight(
      LIGHTING_CONFIG.SUN_COLOR, 
      LIGHTING_CONFIG.SUN_INTENSITY
    );
    this.sunLight.position.set(0, 0, 0); // Será posicionada no Sol
    this.sunLight.castShadow = LIGHTING_CONFIG.CAST_SHADOWS;
    
    // Configurar sombras da luz direcional com configurações aprimoradas
    if (this.sunLight.castShadow) {
      this.sunLight.shadow.mapSize.width = RENDERER_CONFIG.SHADOW_MAP_SIZE;
      this.sunLight.shadow.mapSize.height = RENDERER_CONFIG.SHADOW_MAP_SIZE;
      this.sunLight.shadow.camera.near = LIGHTING_CONFIG.SHADOW_CAMERA_NEAR;
      this.sunLight.shadow.camera.far = LIGHTING_CONFIG.SHADOW_CAMERA_FAR;
      this.sunLight.shadow.camera.left = -LIGHTING_CONFIG.SHADOW_CAMERA_SIZE;
      this.sunLight.shadow.camera.right = LIGHTING_CONFIG.SHADOW_CAMERA_SIZE;
      this.sunLight.shadow.camera.top = LIGHTING_CONFIG.SHADOW_CAMERA_SIZE;
      this.sunLight.shadow.camera.bottom = -LIGHTING_CONFIG.SHADOW_CAMERA_SIZE;
      this.sunLight.shadow.bias = LIGHTING_CONFIG.SHADOW_BIAS;
      this.sunLight.shadow.radius = LIGHTING_CONFIG.SHADOW_RADIUS;
    }
    
    this.scene.add(this.sunLight);
    
    // Luz pontual intensa para o Sol (simula emissão luminosa)
    this.sunPointLight = new THREE.PointLight(
      LIGHTING_CONFIG.SUN_POINT_COLOR, 
      LIGHTING_CONFIG.SUN_POINT_INTENSITY, 
      0, // Distância infinita
      LIGHTING_CONFIG.SUN_POINT_DECAY
    );
    this.sunPointLight.position.set(0, 0, 0); // Posição do Sol
    this.sunPointLight.castShadow = LIGHTING_CONFIG.CAST_SHADOWS;
    
    // Configurar sombras da luz pontual
    if (this.sunPointLight.castShadow) {
      this.sunPointLight.shadow.mapSize.width = RENDERER_CONFIG.SHADOW_MAP_SIZE;
      this.sunPointLight.shadow.mapSize.height = RENDERER_CONFIG.SHADOW_MAP_SIZE;
      this.sunPointLight.shadow.camera.near = LIGHTING_CONFIG.SHADOW_CAMERA_NEAR;
      this.sunPointLight.shadow.camera.far = LIGHTING_CONFIG.SHADOW_CAMERA_FAR;
    }
    
    this.scene.add(this.sunPointLight);
    
    console.log('💡 Sistema de iluminação configurado com sombras e realismo aprimorado');
  }
  
  /**
   * [DEPRECATED] Método de objetos de teste - substituído por createCelestialObjects()
   * Mantido para referência, mas não é mais usado
   */
  private addTestObjects(): void {
    // Este método foi substituído pelo sistema de física orbital
    // Os objetos agora são criados baseados nos dados astronômicos reais
    console.log('⚠️ addTestObjects() foi substituído por createCelestialObjects()');
  }
  
  /**
   * Inicia o loop principal de renderização
   */
  private startRenderLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    animate();
  }
  
  /**
   * Atualiza a simulação (equivalente ao update_simulation do Panda3D)
   */
  private update(): void {
    // Atualizar controles com damping
    this.controls.update();
    
    // Atualizar sistema de tempo
    this.timeManager.update();
    
    // Atualizar posições orbitais de todos os corpos celestes
    this.celestialHierarchy.updatePositions();
    
    // Atualizar renderização de órbitas
    this.orbitRenderer.updateOrbits();
    
    // Rotação dos planetas (apenas rotação própria, não orbital)
    this.updatePlanetaryRotations();
    
    // Sistema de LOD baseado na distância da câmera
    this.updateLevelOfDetail();
    
    // Sistema de visibilidade dinâmica (luas baseadas no zoom)
    this.updateDynamicVisibility();
    
    // Atualizar estado da simulação baseado no foco atual
    this.updateSimulationState();
  }
  
  /**
   * Atualiza rotações próprias dos planetas
   */
  private updatePlanetaryRotations(): void {
    const time = Date.now() * 0.001;
    
    // Rotação da Terra (24 horas = 1 dia)
    const earth = this.scene.getObjectByName('Terra');
    if (earth) {
      earth.rotation.y = time * ANIMATION_SPEEDS.EARTH_ROTATION;
    }
    
    // Adicionar rotações para outros planetas conforme necessário
    // Cada planeta tem sua própria velocidade de rotação
  }
  
  /**
   * Sistema de Level of Detail baseado na distância da câmera
   * Otimiza performance ajustando qualidade baseada na distância
   */
  private updateLevelOfDetail(): void {
    const cameraPosition = this.camera.position;
    
    this.celestialHierarchy.getAllCelestialObjects().forEach(obj => {
      if (!obj.mesh) return;
      
      const distance = cameraPosition.distanceTo(obj.mesh.position);
      
      // Ajustar qualidade da geometria baseada na distância
      if (distance > 1000) {
        // Muito longe - usar geometria simplificada
        if (obj.mesh.children.length > 0) {
          obj.mesh.children.forEach(child => {
            if ((child as any).isLOD) {
              (child as any).setLevel(0); // Nível mais baixo de detalhe
            }
          });
        }
      } else if (distance > 100) {
        // Distância média - qualidade média
        if (obj.mesh.children.length > 0) {
          obj.mesh.children.forEach(child => {
            if ((child as any).isLOD) {
              (child as any).setLevel(1);
            }
          });
        }
      } else {
        // Próximo - máxima qualidade
        if (obj.mesh.children.length > 0) {
          obj.mesh.children.forEach(child => {
            if ((child as any).isLOD) {
              (child as any).setLevel(2); // Máximo nível de detalhe
            }
          });
        }
      }
    });
  }
  
  /**
   * Sistema de visibilidade dinâmica baseado no zoom e distância
   * Equivalente à lógica do Panda3D para mostrar/ocultar luas
   */
  private updateDynamicVisibility(): void {
    const cameraPosition = this.camera.position;
    const currentTarget = this.stateManager.getState().target;
    
    // Calcular "zoom" baseado na distância da câmera ao centro
    const distanceToCenter = cameraPosition.length();
    const zoom = 1.0 / Math.max(distanceToCenter / 100, 0.001); // Normalizar zoom
    
    // Limites de visibilidade (equivalentes ao código Python)
    const MOON_ZOOM_THRESHOLD = 0.003;
    const ORBIT_DISPLAY_THRESHOLD = 0.05;
    
    this.celestialHierarchy.getAllCelestialObjects().forEach(obj => {
      if (!obj.mesh) return;
      
      // Lógica de visibilidade para luas
      if (obj.parent && obj.parent.id !== 'sol') {
        // É uma lua
        const isTargetMoon = obj.id === currentTarget;
        const isTargetPlanet = obj.parent.id === currentTarget;
        
        if (isTargetMoon || isTargetPlanet) {
          // Sempre mostrar se é alvo ou filha do alvo
          obj.mesh.visible = true;
        } else if (zoom < MOON_ZOOM_THRESHOLD) {
          // Zoom muito longe - ocultar luas distantes
          obj.mesh.visible = false;
        } else {
          // Zoom intermediário - mostrar baseado na distância
          const distanceToCamera = cameraPosition.distanceTo(obj.mesh.position);
          obj.mesh.visible = distanceToCamera < 500; // Limite arbitrário
        }
      } else {
        // Planetas e Sol sempre visíveis (por enquanto)
        obj.mesh.visible = true;
      }
    });
  }
  
  /**
   * Atualiza estado geral da simulação
   * Sincroniza dados entre componentes e otimiza performance
   */
  private updateSimulationState(): void {
    const state = this.stateManager.getState();
    const timeStatus = this.timeManager.getTimeStatus();
    
    // Atualizar informações de performance se necessário
    if (this.renderer.info.render.frame % 60 === 0) {
      // A cada 60 frames, verificar performance
      const now = window.performance.now();
      const performanceStats = {
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        fps: 1000 / (now - (this.lastPerformanceUpdate || now))
      };
      
      console.debug('Performance Stats:', performanceStats);
      this.lastPerformanceUpdate = now;
      
      // Otimização automática baseada na performance
      this.performanceOptimizer.autoOptimize(this.renderer);
    }
  }
  
  // Propriedade para tracking de performance
  private lastPerformanceUpdate: number = 0;
  
  /**
   * Renderiza a cena
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Configura redimensionamento da janela
   */
  private setupResize(): void {
    window.addEventListener('resize', this.onWindowResize);
  }
  
  /**
   * Limpa recursos ao destruir a aplicação
   */
  dispose(): void {
    // Limpar recursos de performance
    if (this.performanceOptimizer) {
      this.performanceOptimizer.clearCaches();
    }
    
    // Limpar hierarquia de objetos celestes
    if (this.celestialHierarchy) {
      this.celestialHierarchy.clear();
    }
    
    // Limpar controles
    this.controls.dispose();
    
    // Limpar renderizador
    this.renderer.dispose();
    
    // Limpar geometrias e materiais
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Remover event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    console.log('🧹 Recursos limpos com otimizações de performance');
  }
  
  /**
   * Handler para redimensionamento da janela
   */
  private onWindowResize = (): void => {
    // Atualizar dimensões da câmera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Atualizar renderizador
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  /**
   * Obtém dados astronômicos carregados
   */
  public getAstronomicalData(): AstronomicalData {
    return this.astronomicalData;
  }

  /**
   * Obtém corpo celeste específico por nome
   */
  public getCelestialBody(name: string) {
    return this.dataLoader.getCelestialBody(name);
  }

  /**
   * Obtém lista de planetas
   */
  public getPlanets() {
    return this.dataLoader.getPlanets();
  }

  /**
   * Obtém lista de luas
   */
  public getMoons() {
    return this.dataLoader.getMoons();
  }

  /**
   * Obtém estatísticas dos dados
   */
  public getDataStatistics() {
    return this.dataLoader.getDataStatistics();
  }
  
  // === MÉTODOS PÚBLICOS PARA CONTROLE DA SIMULAÇÃO ===
  
  /**
   * Obtém o gerenciador de tempo da simulação
   */
  public getTimeManager(): SimulationTimeManager {
    return this.timeManager;
  }
  
  /**
   * Obtém a hierarquia de objetos celestes
   */
  public getCelestialHierarchy(): CelestialHierarchy {
    return this.celestialHierarchy;
  }
  
  /**
   * Obtém o gerenciador de estado da simulação
   */
  public getStateManager(): SimulationStateManager {
    return this.stateManager;
  }
  
  /**
   * Obtém o renderizador de órbitas
   */
  public getOrbitRenderer(): OrbitRenderer {
    return this.orbitRenderer;
  }
  
  /**
   * Foca a câmera em um corpo celeste específico
   */
  public focusOnCelestialBody(id: string): void {
    const obj = this.celestialHierarchy.getCelestialObject(id);
    if (obj) {
      this.stateManager.setState({ target: id });
      console.log(`Focando em: ${obj.name}`);
    } else {
      console.warn(`Corpo celeste '${id}' não encontrado`);
    }
  }
  
  /**
   * Controla a velocidade da simulação
   */
  public setSimulationSpeed(speed: number): void {
    this.timeManager.setSpeed(speed);
  }
  
  /**
   * Pausa/despausa a simulação
   */
  public togglePause(): void {
    this.timeManager.togglePause();
  }
  
  /**
   * Obtém estatísticas da simulação atual
   */
  public getSimulationStats(): any {
    return {
      time: this.timeManager.getTimeStatus(),
      hierarchy: this.celestialHierarchy.getHierarchyStats(),
      state: this.stateManager.getState(),
      performance: this.performanceOptimizer.getPerformanceMetrics(),
      renderer: {
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        calls: this.renderer.info.render.calls
      }
    };
  }
}
