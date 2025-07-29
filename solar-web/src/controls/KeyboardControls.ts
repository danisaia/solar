import { SolarSystemApp } from '../core/SolarSystemApp';
import { SimulationStateManager } from '../core/SimulationStateManager';
import { SimulationTimeManager } from '../physics/SimulationTimeManager';

/**
 * Sistema de controles de teclado para o simulador
 * Migrado do código Python original
 */
export class KeyboardControls {
  private app: SolarSystemApp;
  private stateManager: SimulationStateManager;
  private timeManager: SimulationTimeManager;
  private isShiftPressed: boolean = false;
  private pressedKeys: Set<string> = new Set();
  
  constructor(app: SolarSystemApp) {
    this.app = app;
    this.stateManager = app.getStateManager();
    this.timeManager = app.getTimeManager();
    
    this.setupEventListeners();
    this.displayControls();
  }
  
  /**
   * Configura os event listeners para teclado
   */
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Prevenir comportamento padrão para algumas teclas
    document.addEventListener('keydown', (event) => {
      if (this.shouldPreventDefault(event.key)) {
        event.preventDefault();
      }
    });
  }
  
  /**
   * Verifica se deve prevenir o comportamento padrão da tecla
   */
  private shouldPreventDefault(key: string): boolean {
    const preventKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    return preventKeys.includes(key);
  }
  
  /**
   * Handler para tecla pressionada
   */
  private onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.pressedKeys.add(key);
    this.isShiftPressed = event.shiftKey;
    
    switch (key) {
      // Navegação entre corpos celestes
      case 's':
        this.stateManager.focusOnSun();
        break;
        
      case 'arrowright':
      case 'd':
        if (this.isShiftPressed) {
          this.stateManager.nextMoon();
        } else {
          this.stateManager.nextPlanet();
        }
        break;
        
      case 'arrowleft':
      case 'a':
        if (this.isShiftPressed) {
          this.stateManager.previousMoon();
        } else {
          this.stateManager.previousPlanet();
        }
        break;
        
      case 'r':
        this.stateManager.returnToPlanet();
        break;
        
      // Controle de tempo
      case 'arrowup':
      case 'w':
        this.timeManager.increaseSpeed();
        break;
        
      case 'arrowdown':
      case 'x':
        this.timeManager.decreaseSpeed();
        break;
        
      case ' ':
        this.timeManager.togglePause();
        break;
        
      case '1':
        this.timeManager.resetSpeed();
        break;
        
      // Controle de zoom (integração futura com câmera)
      case 'z':
        this.zoomIn();
        break;
        
      case 'c':
        this.zoomOut();
        break;
        
      case 'v':
        this.resetZoom();
        break;
        
      // Controles de câmera (integração futura)
      case 'q':
        this.rotateCameraLeft();
        break;
        
      case 'e':
        this.rotateCameraRight();
        break;
        
      case 'f':
        this.resetCameraRotation();
        break;
        
      // Controles de tempo manual
      case 'pageup':
        if (this.timeManager.isPaused()) {
          this.timeManager.stepForward(1); // Avançar 1 dia
        }
        break;
        
      case 'pagedown':
        if (this.timeManager.isPaused()) {
          this.timeManager.stepBackward(1); // Retroceder 1 dia
        }
        break;
        
      // Debug e informações
      case 'i':
        this.showDebugInfo();
        break;
        
      case 'h':
        this.displayControls();
        break;
        
      // Reset geral
      case 'home':
        this.resetSimulation();
        break;
    }
  }
  
  /**
   * Handler para tecla liberada
   */
  private onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.pressedKeys.delete(key);
    this.isShiftPressed = event.shiftKey;
  }
  
  /**
   * Controles de zoom (placeholder para integração futura)
   */
  private zoomIn(): void {
    const currentState = this.stateManager.getState();
    const newZoom = Math.max(currentState.zoom * 0.8, 0.00001);
    this.stateManager.setState({ zoom: newZoom });
    console.log(`Zoom In: ${newZoom.toExponential(2)}`);
  }
  
  private zoomOut(): void {
    const currentState = this.stateManager.getState();
    const newZoom = Math.min(currentState.zoom * 1.25, 10);
    this.stateManager.setState({ zoom: newZoom });
    console.log(`Zoom Out: ${newZoom.toExponential(2)}`);
  }
  
  private resetZoom(): void {
    this.stateManager.setState({ zoom: 1.0 });
    console.log('Zoom resetado');
  }
  
  /**
   * Controles de rotação da câmera (placeholder)
   */
  private rotateCameraLeft(): void {
    const currentState = this.stateManager.getState();
    const newRotation = currentState.horizontalRotation - 0.1;
    this.stateManager.setState({ 
      horizontalRotation: newRotation,
      targetRotation: newRotation
    });
    console.log(`Rotação da câmera: ${newRotation.toFixed(2)}`);
  }
  
  private rotateCameraRight(): void {
    const currentState = this.stateManager.getState();
    const newRotation = currentState.horizontalRotation + 0.1;
    this.stateManager.setState({ 
      horizontalRotation: newRotation,
      targetRotation: newRotation
    });
    console.log(`Rotação da câmera: ${newRotation.toFixed(2)}`);
  }
  
  private resetCameraRotation(): void {
    this.stateManager.setState({ 
      horizontalRotation: 0,
      targetRotation: 0,
      cameraInclination: 0.2,
      targetInclination: 0.2
    });
    console.log('Rotação da câmera resetada');
  }
  
  /**
   * Mostra informações de debug
   */
  private showDebugInfo(): void {
    const stats = this.app.getSimulationStats();
    
    console.log('=== INFORMAÇÕES DE DEBUG ===');
    console.log('Tempo:', stats.time);
    console.log('Estado:', stats.state);
    console.log('Hierarquia:', stats.hierarchy);
    
    // Informações do objeto focado atual
    const hierarchy = this.app.getCelestialHierarchy();
    const currentTarget = stats.state.target;
    const debugInfo = hierarchy.getDebugInfo(currentTarget);
    
    if (debugInfo) {
      console.log(`Objeto atual (${currentTarget}):`, debugInfo);
    }
  }
  
  /**
   * Reset completo da simulação
   */
  private resetSimulation(): void {
    this.timeManager.resetToRealTime();
    this.stateManager.setState({
      target: 'terra',
      speed: 1.0,
      zoom: 1.0,
      currentPlanetIndex: 2,
      currentMoonIndex: 0,
      cameraInclination: 0.2,
      targetInclination: 0.2,
      horizontalRotation: 0.0,
      targetRotation: 0.0
    });
    console.log('🔄 Simulação resetada para configurações padrão');
  }
  
  /**
   * Exibe os controles disponíveis
   */
  private displayControls(): void {
    console.log(`
🎮 === CONTROLES DO SISTEMA SOLAR ===

📍 NAVEGAÇÃO:
• S - Focar no Sol
• ← / A - Planeta anterior
• → / D - Próximo planeta
• Shift + ← / A - Lua anterior
• Shift + → / D - Próxima lua
• R - Retornar ao planeta atual

⏰ CONTROLE DE TEMPO:
• ↑ / W - Aumentar velocidade
• ↓ / X - Diminuir velocidade
• Espaço - Pausar/continuar
• 1 - Velocidade normal (1x)
• Page Up - Avançar 1 dia (pausado)
• Page Down - Retroceder 1 dia (pausado)

🔍 CÂMERA:
• Z - Zoom in
• C - Zoom out
• V - Reset zoom
• Q - Rotacionar câmera à esquerda
• E - Rotacionar câmera à direita
• F - Reset rotação da câmera

ℹ️ INFORMAÇÕES:
• I - Mostrar debug
• H - Mostrar estes controles
• Home - Reset completo

Tempo atual: ${this.timeManager.getFormattedTime()}
Velocidade: ${this.timeManager.getSpeed()}x
`);
  }
  
  /**
   * Remove os event listeners
   */
  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
  }
}
