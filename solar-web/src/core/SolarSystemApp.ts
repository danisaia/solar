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
  BODY_COLORS 
} from './constants';
import { DataLoader } from '../data/DataLoader';
import { AstronomicalData } from '../types/index';

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
    
    // Adiciona objetos de teste temporários (serão substituídos pelos dados reais)
    this.addTestObjects();
    
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
   * Adiciona objetos de teste temporários
   */
  private addTestObjects(): void {
    // Sol temporário (esfera emissiva com brilho)
    const sunGeometry = new THREE.SphereGeometry(TEST_SIZES.SUN_RADIUS, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({ 
      color: BODY_COLORS.SUN,
      emissive: BODY_COLORS.SUN,
      emissiveIntensity: 0.3,
      roughness: 0.0,
      metalness: 0.0
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = 'Sol';
    this.scene.add(sun);
    
    // Terra temporária (esfera com material PBR básico)
    const earthGeometry = new THREE.SphereGeometry(TEST_SIZES.EARTH_RADIUS, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({ 
      color: BODY_COLORS.EARTH,
      roughness: 0.8,
      metalness: 0.0
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(TEST_SIZES.EARTH_DISTANCE, 0, 0);
    earth.name = 'Terra';
    earth.castShadow = LIGHTING_CONFIG.CAST_SHADOWS;
    earth.receiveShadow = LIGHTING_CONFIG.RECEIVE_SHADOWS;
    this.scene.add(earth);
    
    // Lua temporária (esfera com material rochoso)
    const moonGeometry = new THREE.SphereGeometry(TEST_SIZES.MOON_RADIUS, 16, 16);
    const moonMaterial = new THREE.MeshStandardMaterial({ 
      color: BODY_COLORS.MOON,
      roughness: 0.9,
      metalness: 0.0
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(TEST_SIZES.EARTH_DISTANCE + TEST_SIZES.MOON_ORBIT_RADIUS, 0, 0);
    moon.name = 'Lua';
    moon.castShadow = LIGHTING_CONFIG.CAST_SHADOWS;
    moon.receiveShadow = LIGHTING_CONFIG.RECEIVE_SHADOWS;
    this.scene.add(moon);
    
    console.log('🪐 Objetos de teste adicionados com materiais PBR (Sol, Terra, Lua)');
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
    
    // TODO: Implementar lógica de atualização da simulação
    // - Cálculo de posições orbitais
    // - Atualização da câmera customizada
    // - Controle de tempo
    
    // Animação simples dos objetos de teste
    const time = Date.now() * 0.001;
    
    // Rotação da Terra
    const earth = this.scene.getObjectByName('Terra');
    if (earth) {
      earth.rotation.y = time * ANIMATION_SPEEDS.EARTH_ROTATION;
    }
    
    // Órbita da Lua ao redor da Terra
    const moon = this.scene.getObjectByName('Lua');
    if (moon && earth) {
      moon.position.x = earth.position.x + Math.cos(time * ANIMATION_SPEEDS.MOON_ORBIT) * TEST_SIZES.MOON_ORBIT_RADIUS;
      moon.position.z = earth.position.z + Math.sin(time * ANIMATION_SPEEDS.MOON_ORBIT) * TEST_SIZES.MOON_ORBIT_RADIUS;
    }
  }
  
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
    
    console.log('🧹 Recursos limpos');
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
}
