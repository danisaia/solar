/**
 * Gerenciador de tempo da simulação
 * Controla velocidade temporal, pausa/resume e sincronização
 */
export class SimulationTimeManager {
  private static instance: SimulationTimeManager;
  
  private _currentTime: Date;
  private _speed: number;
  private _isPaused: boolean;
  private _realTimeStart: number;
  private _simulationTimeStart: number;
  private _lastUpdateTime: number;
  
  // Configurações de velocidade
  private readonly MIN_SPEED = 0.1;
  private readonly MAX_SPEED = 1000.0;
  private readonly SPEED_MULTIPLIERS = [0.1, 0.5, 1, 5, 10, 50, 100, 500, 1000];
  private _currentSpeedIndex = 2; // Começa em velocidade 1x
  
  private constructor() {
    this._currentTime = new Date();
    this._speed = 1.0;
    this._isPaused = false;
    this._realTimeStart = Date.now();
    this._simulationTimeStart = this._currentTime.getTime();
    this._lastUpdateTime = this._realTimeStart;
  }
  
  public static getInstance(): SimulationTimeManager {
    if (!SimulationTimeManager.instance) {
      SimulationTimeManager.instance = new SimulationTimeManager();
    }
    return SimulationTimeManager.instance;
  }
  
  /**
   * Atualiza o tempo da simulação
   * Deve ser chamado a cada frame
   */
  public update(): void {
    if (this._isPaused) {
      this._lastUpdateTime = Date.now();
      return;
    }
    
    const now = Date.now();
    const deltaRealTime = now - this._lastUpdateTime;
    const deltaSimulationTime = deltaRealTime * this._speed;
    
    this._currentTime = new Date(this._currentTime.getTime() + deltaSimulationTime);
    this._lastUpdateTime = now;
  }
  
  /**
   * Obtém o tempo atual da simulação
   */
  public getCurrentTime(): Date {
    return new Date(this._currentTime);
  }
  
  /**
   * Define o tempo atual da simulação
   */
  public setCurrentTime(time: Date): void {
    this._currentTime = new Date(time);
    this._simulationTimeStart = this._currentTime.getTime();
    this._realTimeStart = Date.now();
    this._lastUpdateTime = this._realTimeStart;
  }
  
  /**
   * Obtém a velocidade atual da simulação
   */
  public getSpeed(): number {
    return this._speed;
  }
  
  /**
   * Define a velocidade da simulação
   */
  public setSpeed(speed: number): void {
    this._speed = Math.max(this.MIN_SPEED, Math.min(this.MAX_SPEED, speed));
    console.log(`Velocidade da simulação: ${this._speed}x`);
  }
  
  /**
   * Aumenta a velocidade da simulação usando multiplicadores predefinidos
   */
  public increaseSpeed(): void {
    if (this._currentSpeedIndex < this.SPEED_MULTIPLIERS.length - 1) {
      this._currentSpeedIndex++;
      this.setSpeed(this.SPEED_MULTIPLIERS[this._currentSpeedIndex]);
    }
  }
  
  /**
   * Diminui a velocidade da simulação
   */
  public decreaseSpeed(): void {
    if (this._currentSpeedIndex > 0) {
      this._currentSpeedIndex--;
      this.setSpeed(this.SPEED_MULTIPLIERS[this._currentSpeedIndex]);
    }
  }
  
  /**
   * Reseta a velocidade para tempo real (1x)
   */
  public resetSpeed(): void {
    this._currentSpeedIndex = 2; // Índice para velocidade 1x
    this.setSpeed(1.0);
  }
  
  /**
   * Pausa/despausa a simulação
   */
  public togglePause(): void {
    this._isPaused = !this._isPaused;
    if (!this._isPaused) {
      this._lastUpdateTime = Date.now();
    }
    console.log(this._isPaused ? 'Simulação pausada' : 'Simulação retomada');
  }
  
  /**
   * Pausa a simulação
   */
  public pause(): void {
    this._isPaused = true;
    console.log('Simulação pausada');
  }
  
  /**
   * Retoma a simulação
   */
  public resume(): void {
    if (this._isPaused) {
      this._isPaused = false;
      this._lastUpdateTime = Date.now();
      console.log('Simulação retomada');
    }
  }
  
  /**
   * Verifica se a simulação está pausada
   */
  public isPaused(): boolean {
    return this._isPaused;
  }
  
  /**
   * Avança o tempo manualmente (útil quando pausado)
   */
  public stepForward(days: number): void {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    this._currentTime = new Date(this._currentTime.getTime() + days * millisecondsPerDay);
    console.log(`Avançado ${days} dias. Data atual: ${this._currentTime.toDateString()}`);
  }
  
  /**
   * Retrocede o tempo manualmente
   */
  public stepBackward(days: number): void {
    this.stepForward(-days);
  }
  
  /**
   * Obtém informações de status do tempo
   */
  public getTimeStatus(): {
    currentTime: Date;
    speed: number;
    isPaused: boolean;
    speedIndex: number;
    availableSpeeds: number[];
  } {
    return {
      currentTime: this.getCurrentTime(),
      speed: this._speed,
      isPaused: this._isPaused,
      speedIndex: this._currentSpeedIndex,
      availableSpeeds: [...this.SPEED_MULTIPLIERS]
    };
  }
  
  /**
   * Calcula o tempo decorrido em anos desde a época J2000.0
   * Útil para cálculos astronômicos
   */
  public getYearsSinceJ2000(): number {
    const j2000 = new Date(2000, 0, 1, 12, 0, 0); // 1 Jan 2000 12:00 UTC
    const timeDiff = this._currentTime.getTime() - j2000.getTime();
    const days = timeDiff / (1000 * 60 * 60 * 24);
    return days / 365.25;
  }
  
  /**
   * Define o tempo para uma data específica
   */
  public setDate(year: number, month: number, day: number): void {
    this.setCurrentTime(new Date(year, month - 1, day, 12, 0, 0));
  }
  
  /**
   * Obtém uma representação formatada do tempo atual
   */
  public getFormattedTime(): string {
    const date = this._currentTime;
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('pt-BR', options);
  }
  
  /**
   * Reseta o tempo para a data atual real
   */
  public resetToRealTime(): void {
    this.setCurrentTime(new Date());
    this.resetSpeed();
    console.log('Tempo resetado para data atual');
  }
}
