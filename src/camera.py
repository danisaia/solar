from panda3d.core import Vec3, ClockObject
import math

class CameraController:
    def __init__(self, app, base_near=0.01, base_far=1e12):
        self.app = app
        self.camera = app.camera
        self.lens = app.cam.node().getLens()
        self.base_near = base_near
        self.base_far = base_far
        
        # Configuração da lente
        self.lens.setNear(base_near)
        self.lens.setFar(base_far)
        
        # Inicializa variáveis de câmera e transição de zoom
        self.zoom_current = 1.0
        self.zoom_target = 1.0
        self.camera_inclination = 0.2  # Começar com a inclinação padrão de 0.2
        self.target_inclination = 0.2  # Alvo de inclinação também com valor padrão
        self.horizontal_rotation = 0.0  # Rotação horizontal inicial
        self.target_rotation = 0.0      # Rotação horizontal alvo
        self.transition_speed = 5.0
        
        # Posições da câmera
        self.camera_target_pos = Vec3(0, 0, 0)
        self.camera_current_pos = Vec3(0, 0, 0)
        
        # Define a direção base da câmera
        self.camera_base_direction = Vec3(0, 0, -1)
        self.CAMERA_BASE_ALTITUDE = 100.0
        
    def initialize_camera(self, initial_position=None, initial_target=None):
        """Inicializa a câmera em uma posição específica ou usa os valores padrão"""
        if initial_position:
            self.camera_current_pos = Vec3(initial_position)
            self.camera_target_pos = Vec3(initial_position)
        
        # Desativa o controle de mouse padrão da Panda3D
        self.app.disableMouse()
        
        # Posiciona a câmera inicialmente com a inclinação padrão
        new_altitude = self.CAMERA_BASE_ALTITUDE / self.zoom_current
        
        # Aplicar inclinação padrão na inicialização
        camera_x = new_altitude * math.sin(self.camera_inclination)
        camera_z = new_altitude * math.cos(self.camera_inclination)
        self.camera.setPos(camera_x, 0, camera_z)
        self.camera.lookAt(0, 0, 0)
        
    def set_target(self, target_pos):
        """Define a posição alvo da câmera"""
        self.camera_target_pos = Vec3(target_pos)
    
    def update_from_simulation_state(self, simulation_state):
        """Atualiza os parâmetros da câmera a partir do estado da simulação"""
        MIN_ZOOM = 0.00002
        simulation_state['zoom'] = max(simulation_state['zoom'], MIN_ZOOM)
        
        # Atualiza os alvos da câmera
        self.zoom_target = simulation_state['zoom']
        self.target_inclination = simulation_state['target_inclination']
        self.target_rotation = simulation_state['target_rotation']

    def update_lens(self):
        """Atualiza os parâmetros da lente da câmera"""
        new_near = max(self.base_near / self.zoom_current, 1e-6)
        new_far = self.base_far / self.zoom_current
        self.lens.setNear(new_near)
        self.lens.setFar(new_far)

    def update(self, dt):
        """Atualiza a posição e orientação da câmera"""
        # Aplica transições suaves
        self.camera_current_pos += (self.camera_target_pos - self.camera_current_pos) * min(self.transition_speed * dt, 1)
        self.zoom_current += (self.zoom_target - self.zoom_current) * min(self.transition_speed * dt, 1)
        self.camera_inclination += (self.target_inclination - self.camera_inclination) * min(self.transition_speed * dt, 1)
        self.horizontal_rotation += (self.target_rotation - self.horizontal_rotation) * min(self.transition_speed * dt, 1)
        
        # Atualiza a lente baseado no zoom
        self.update_lens()
        
        # Calcula a nova posição da câmera
        new_altitude = self.CAMERA_BASE_ALTITUDE / self.zoom_current
        
        # Calcular a posição usando coordenadas esféricas
        # theta (horizontal_rotation): ângulo no plano XY
        # phi (camera_inclination): ângulo a partir do eixo Z
        x = new_altitude * math.sin(self.camera_inclination) * math.cos(self.horizontal_rotation)
        y = new_altitude * math.sin(self.camera_inclination) * math.sin(self.horizontal_rotation)
        z = new_altitude * math.cos(self.camera_inclination)
        
        # Posicionar a câmera e garantir que ela sempre olhe para o centro
        self.camera.setPos(x, y, z)
        self.camera.lookAt(0, 0, 0)
        
        return {
            'camera_inclination': self.camera_inclination,
            'horizontal_rotation': self.horizontal_rotation
        }
        
    def get_zoom_limit_for_target(self, target_scale):
        """Calcula o limite de zoom para um objeto com uma determinada escala"""
        min_distance = 4 * target_scale
        max_zoom = self.CAMERA_BASE_ALTITUDE / min_distance
        return max_zoom
