// Ponto de entrada principal da aplicação Three.js
import * as THREE from 'three';

/**
 * Setup básico do Three.js para testar se está funcionando
 */
function initBasicThreeJS() {
  console.log('🚀 Inicializando Three.js básico...');
  
  // Encontrar container
  const container = document.getElementById('canvas-container');
  if (!container) {
    throw new Error('Container não encontrado');
  }
  
  // Setup básico
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);
  
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  
  // Criar um cubo de teste
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
  // Loop de animação
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  
  // Redimensionamento
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  animate();
  console.log('✅ Three.js básico funcionando!');
}

/**
 * Inicializa a aplicação
 */
async function init() {
  try {
    const loadingElement = document.getElementById('loading');
    
    // Teste básico do Three.js
    initBasicThreeJS();
    
    // Remove loading
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
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
