# Logs de desenvolvimento

## Notas importantes do projeto

### Compatibilidade de dados
- Todos os parâmetros orbitais foram validados contra o arquivo YAML original
- Períodos orbitais das luas foram convertidos corretamente (T/365.25)
- Cores hexadecimais mantidas exatamente como no original

### Decisões arquiteturais
- Escolhido Vite ao invés de Webpack para melhor performance de desenvolvimento
- TypeScript para maior robustez e manutenibilidade 
- Estrutura modular espelhando a organização do código Python original

### Mapeamento de funcionalidades críticas
- Sistema de controles: precisa manter exatamente os mesmos comandos
- Física orbital: algoritmos matemáticos devem ser idênticos
- Sistema de câmera: comportamento deve ser consistente com Panda3D
- Renderização de órbitas: lógica de visibilidade complexa precisa ser replicada

### Considerações de performance
- Three.js usa GPU via WebGL (vantagem sobre Panda3D CPU)
- Instancing pode melhorar performance com múltiplos objetos
- LOD (Level of Detail) será importante para objetos distantes
- Frustum culling automático do Three.js

### Diferenças importantes Python → JavaScript
- JavaScript: números de precisão dupla (limitação para grandes distâncias)
- Gestão de memória: manual no Three.js vs automática no Python
- Sistema de eventos: diferentes entre Panda3D e web browsers
- Coordenadas: verificar se sistemas de coordenadas são compatíveis
