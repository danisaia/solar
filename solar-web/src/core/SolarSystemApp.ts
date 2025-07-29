// Classe principal da aplicação Solar System
import * as THREE from 'three';

/**
 * Classe principal que gerencia toda a aplicação do Sistema Solar
 * Equivalente à classe SistemaSolar do Panda3D
 */
export class SolarSystemApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private container!: HTMLElement;
  
  constructor() {
    console.log('🌌 Criando aplicação Sistema Solar...');
  }
  
  /**
   * Inicializa a aplicação Three.js
   */
  async initialize(): Promise<void> {
    console.log('🔧 Configurando Three.js...');
    
    // Encontra o container
    this.container = document.getElementById('canvas-container')!;
    if (!this.container) {
      throw new Error('Container canvas-container não encontrado');
    }
    
    // Inicializa componentes básicos
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    
    // Inicia o loop de renderização
    this.startRenderLoop();
    
    // Configura redimensionamento
    this.setupResize();
    
    console.log('✅ Three.js configurado com sucesso');
  }
  
  /**
   * Inicializa a cena 3D
   */
  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Fundo preto do espaço
  }
  
  /**
   * Inicializa a câmera
   */
  private initCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 1e12);
    this.camera.position.set(0, 0, 100);
  }
  
  /**
   * Inicializa o renderizador
   */
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Configurações equivalentes ao Panda3D
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
  }
  
  /**
   * Inicializa o sistema de iluminação
   */
  private initLights(): void {
    // Luz ambiente (equivalente ao AmbientLight do Panda3D)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);
    
    // Luz direcional (equivalente ao DirectionalLight do Panda3D)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, -1).normalize();
    this.scene.add(directionalLight);
    
    // Luz pontual para o Sol será adicionada posteriormente
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
    // TODO: Implementar lógica de atualização da simulação
    // - Cálculo de posições orbitais
    // - Atualização da câmera
    // - Controle de tempo
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
    window.addEventListener('resize', () => {
      // Atualiza dimensões da câmera
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      
      // Atualiza renderizador
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  /**
   * Limpa recursos ao destruir a aplicação
   */
  dispose(): void {
    this.renderer.dispose();
    // TODO: Limpar outros recursos (geometrias, materiais, texturas)
  }
}
