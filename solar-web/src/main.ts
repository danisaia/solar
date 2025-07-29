// Ponto de entrada principal da aplicação Three.js
import { SolarSystemApp } from './core/SolarSystemApp';

/**
 * Inicializa a aplicação
 */
async function init() {
  try {
    const loadingElement = document.getElementById('loading');
    
    // Inicializar aplicação principal do Sistema Solar
    console.log('🌌 Iniciando Sistema Solar 3D...');
    const app = new SolarSystemApp();
    await app.initialize();
    
    // Remove loading
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    console.log('✅ Sistema Solar carregado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <h2 style="color: #ff4444;">Erro ao carregar</h2>
        <p style="color: #ccc; margin-top: 10px;">
          ${error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      `;
    }
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
