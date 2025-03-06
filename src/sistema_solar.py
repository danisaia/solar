# Importa módulos essenciais e define parâmetros globais
from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from direct.gui.OnscreenText import OnscreenText
from panda3d.core import ClockObject, WindowProperties, AmbientLight, DirectionalLight, Vec4, Vec3, LineSegs, PointLight
import yaml, datetime, math, os
from datetime import timedelta
import src.controles as controles  # Gerencia controles e estado da simulação

# Define constantes e carrega dados dos corpos celestes
globalClock = ClockObject.getGlobalClock()
ref_date = datetime.datetime(2000, 1, 1, 12, 0, 0)   # Data base da simulação
sim_days = (datetime.datetime.now() - ref_date).total_seconds() / 86400   # Dias simulados
REAL_SCALE_FACTOR = 1e-6
ZOOM_THRESHOLD = 5.0
SIZE_MULTIPLIER = 100.0
AU = 1.496e11
MODEL_SIZE_FACTOR = 2e-7

caminho_corpos = os.path.join(os.path.dirname(__file__), 'parametros', 'corpos.yaml')
with open(caminho_corpos, 'r', encoding='utf8') as f:
    astros = yaml.safe_load(f)

# Mapeia luas aos seus planetas pais
parent_moons = {
    'lua':     'terra',
    'io':      'jupiter',
    'europa':  'jupiter',
    'ganimedes': 'jupiter',
    'calisto': 'jupiter',
    'tita':    'saturno',
    'encelado':'saturno',
    'titania': 'urano',
    'oberon':  'urano',
}

def parse_number(val):
    # Converte valores para float, avaliando expressões simples se necessário
    if isinstance(val, (int, float)):
        return float(val)
    try:
        return float(eval(val, {"__builtins__": None}, {}))
    except Exception:
        return float(val)

class SistemaSolar(ShowBase):
    def __init__(self):
        ShowBase.__init__(self)
        # Configura a janela de renderização com a resolução da tela
        props = WindowProperties()
        import tkinter as tk
        root = tk.Tk()
        screen_width  = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        root.destroy()
        props.setSize(screen_width, screen_height)
        self.win.requestProperties(props)
        self.setBackgroundColor(0, 0, 0, 1)
        controles.register_controls(self)  # Ativa os controles da simulação
        self.disableMouse()
        lens = self.cam.node().getLens()
        lens.setNear(0.01)
        lens.setFar(1e12)
        self.lens = lens
        self.base_near = 0.01
        self.base_far = 1e12

        # Aplica iluminação ambiente e direcional
        ambient = AmbientLight("ambient")
        ambient.setColor(Vec4(0.2, 0.2, 0.2, 1))
        directional = DirectionalLight("directional")
        directional.setDirection(Vec3(1, 1, -1))
        self.render.setLight(self.render.attachNewNode(ambient))
        self.render.setLight(self.render.attachNewNode(directional))

        # Inicializa variáveis de câmera e transição de zoom
        self.zoom_current = controles.simulation_state['zoom']
        self.zoom_target = controles.simulation_state['zoom']
        self.camera_inclination = 0.2  # Começar com a inclinação padrão de 0.2
        self.target_inclination = 0.2  # Alvo de inclinação também com valor padrão
        self.horizontal_rotation = 0.0  # Rotação horizontal inicial
        self.target_rotation = 0.0      # Rotação horizontal alvo
        self.transition_speed = 5.0
        
        # Garantir que o estado global tenha a inclinação padrão
        controles.simulation_state['camera_inclination'] = 0.2
        controles.simulation_state['target_inclination'] = 0.2
        controles.simulation_state['horizontal_rotation'] = 0.0
        controles.simulation_state['target_rotation'] = 0.0

        # Carrega os modelos dos corpos e define suas características visuais
        self.nodes = {}
        for key, astro in astros.items():
            kl = key.lower()
            node = self.loader.loadModel("models/misc/sphere")
            node.reparentTo(self.render)
            if kl == 'sol':
                node.setScale(2.0)
                pl = PointLight("sol_brilho")
                pl.setColor(Vec4(2, 2, 1.5, 1))
                pl.setAttenuation((0.1, 0.04, 0.0))
                plnp = node.attachNewNode(pl)
                self.render.setLight(plnp)
                halo = self.loader.loadModel("models/misc/sphere")
                halo.reparentTo(node)
                halo.setScale(3.0)
                halo.setColor(Vec4(1, 1, 0.8, 0.5))
                halo.setTransparency(True)
            elif 'orbital' in astro and kl not in parent_moons:
                node.setScale(0.5)
            elif 'orbital' in astro and kl in parent_moons:
                node.setScale(0.2)
            else:
                node.setScale(0.3)
            cor = astro.get('cor', '#ffffff')
            r = int(cor.lstrip('#')[0:2], 16) / 255.0
            g = int(cor.lstrip('#')[2:4], 16) / 255.0
            b = int(cor.lstrip('#')[4:6], 16) / 255.0
            node.setColor(r, g, b, 1)
            self.nodes[kl] = node

        # Configura o texto de foco e posiciona a câmera inicial
        from panda3d.core import TextNode
        try:
            verdana_font = self.loader.loadFont("verdana.ttf")
        except Exception:
            verdana_font = None
            # O aviso sobre a fonte ausente é esperado e não afeta o funcionamento
        self.text_focus = OnscreenText(text="", pos=(0, 0.9), scale=0.07,
                                       fg=(1,1,1,1), align=TextNode.ACenter, font=verdana_font)
        positions = self.calcular_posicoes()
        terra_pos = positions.get('terra', Vec3(0,0,0))
        
        # Modificar inicialização da câmera para usar o mesmo sistema da inclinação
        CAMERA_BASE_ALTITUDE = 100.0
        new_altitude = CAMERA_BASE_ALTITUDE / self.zoom_current
        
        # Inicializa a câmera já com o sistema de coordenadas que será usado no update
        # A câmera começa no "norte" do sistema (z+) e olha para a origem
        self.camera.setPos(0, 0, new_altitude)
        self.camera.lookAt(0, 0, 0)
        
        # Define a direção base da câmera - olhando "para baixo" no eixo Z
        self.camera_base_direction = Vec3(0, 0, -1)
        
        # Define a posição atual e alvo como a posição da Terra
        self.camera_target_pos = terra_pos
        self.camera_current_pos = Vec3(terra_pos)
        
        # Posiciona a câmera inicialmente com a inclinação padrão
        CAMERA_BASE_ALTITUDE = 100.0
        new_altitude = CAMERA_BASE_ALTITUDE / self.zoom_current
        
        # Aplicar inclinação padrão na inicialização
        camera_x = new_altitude * math.sin(self.camera_inclination)
        camera_z = new_altitude * math.cos(self.camera_inclination)
        self.camera.setPos(camera_x, 0, camera_z)
        self.camera.lookAt(0, 0, 0)
        
        self.taskMgr.add(self.update_simulation, "update_simulation")
    
    def calcular_posicoes(self):
        # Calcula as posições dos corpos celestes com base em seus parâmetros orbitais
        center = Vec3(0, 0, 0)
        pos = {}
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol':
                pos[kl] = center
            elif 'orbital' in astro:
                orb = astro['orbital']
                period_days = parse_number(orb['T']) * 365.25
                theta_base = 2 * math.pi * ((sim_days % period_days) / period_days)
                e = orb.get('e', 0)
                a = orb['a']
                ω_rad = math.radians(orb.get('ω', 0))
                i_rad = math.radians(orb.get('i', 0))
                Ω_rad = math.radians(orb.get('Ω', 0))
                f = theta_base + ω_rad
                r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(f))
                x_orb = r * math.cos(f)
                y_orb = r * math.sin(f)
                x = x_orb * math.cos(Ω_rad) - y_orb * math.sin(Ω_rad) * math.cos(i_rad)
                y = x_orb * math.sin(Ω_rad) + y_orb * math.cos(Ω_rad) * math.cos(i_rad)
                z = y_orb * math.sin(i_rad)
                pos[kl] = Vec3(x, y, z)
        # Ajusta as posições das luas com base em seus planetas pais
        for key, astro in astros.items():
            kl = key.lower()
            if 'orbital' in astro and kl in parent_moons:
                parent_key = parent_moons.get(kl)
                if parent_key and parent_key in pos:
                    pos[kl] = pos[parent_key] + pos[kl]
                else:
                    pos[kl] = center
        return pos

    def update_simulation(self, task):
        # Atualiza o estado da simulação, ajusta a câmera e desenha órbitas
        dt = globalClock.getDt()
        global sim_days
        sim_days += (dt / 86400) * controles.simulation_state['speed']
        positions = self.calcular_posicoes()
        center = Vec3(0, 0, 0)
        target = controles.simulation_state['target']
        target_pos = positions.get(target, center)
        
        MIN_ZOOM = 0.00002
        controles.simulation_state['zoom'] = max(controles.simulation_state['zoom'], MIN_ZOOM)
        CAMERA_BASE_ALTITUDE = 100.0
        if target.lower() in astros and 'raio' in astros[target.lower()]:
            target_scale = float(astros[target.lower()]['raio']) * MODEL_SIZE_FACTOR
        else:
            target_scale = 0.2
        min_distance = 4 * target_scale
        max_zoom_for_target = CAMERA_BASE_ALTITUDE / min_distance
        controles.simulation_state['zoom'] = min(controles.simulation_state['zoom'], max_zoom_for_target)
        zoom = controles.simulation_state['zoom']
        MOON_ZOOM_THRESHOLD = 0.003
        
        # Anima a transição da câmera e suaviza o zoom e inclinação
        self.camera_target_pos = target_pos
        self.zoom_target = zoom
        self.target_inclination = controles.simulation_state['target_inclination']
        self.target_rotation = controles.simulation_state['target_rotation']
        
        # Aplica transições suaves
        self.camera_current_pos += (self.camera_target_pos - self.camera_current_pos) * min(self.transition_speed * dt, 1)
        self.zoom_current += (self.zoom_target - self.zoom_current) * min(self.transition_speed * dt, 1)
        self.camera_inclination += (self.target_inclination - self.camera_inclination) * min(self.transition_speed * dt, 1)
        self.horizontal_rotation += (self.target_rotation - self.horizontal_rotation) * min(self.transition_speed * dt, 1)
        
        # Atualiza o estado da simulação para sincronizar
        controles.simulation_state['camera_inclination'] = self.camera_inclination
        controles.simulation_state['horizontal_rotation'] = self.horizontal_rotation
        
        new_near = max(self.base_near / self.zoom_current, 1e-6)
        new_far = self.base_far / self.zoom_current
        self.lens.setNear(new_near)
        self.lens.setFar(new_far)
        
        # Desenha as órbitas dos corpos como linhas
        if hasattr(self, 'orbit_lines'):
            self.orbit_lines.removeNode()
        ls = LineSegs()
        ls.setThickness(1.0)
        num_segments = 150
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol' or ('orbital' not in astro):
                continue
            if kl in parent_moons and zoom < MOON_ZOOM_THRESHOLD:
                continue
            orb = astro['orbital']
            period_days = parse_number(orb['T']) * 365.25
            θ_base = 2 * math.pi * ((sim_days % period_days) / period_days)
            e = orb.get('e', 0)
            a = orb['a']
            ω_rad = math.radians(orb.get('ω', 0))
            i_rad = math.radians(orb.get('i', 0))
            Ω_rad = math.radians(orb.get('Ω', 0))
            for j in range(num_segments + 1):
                f = (θ_base + 2 * math.pi * (j / num_segments)) + ω_rad
                r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(f))
                x_orb = r * math.cos(f)
                y_orb = r * math.sin(f)
                x = x_orb * math.cos(Ω_rad) - y_orb * math.sin(Ω_rad) * math.cos(i_rad)
                y = x_orb * math.sin(Ω_rad) + y_orb * math.cos(Ω_rad) * math.cos(i_rad)
                z = y_orb * math.sin(i_rad)
                pt = Vec3(x, y, z)
                if key in parent_moons:
                    parent_pos = positions[parent_moons[key]]
                    pt = parent_pos + pt
                pt_rel = pt - self.camera_current_pos
                diff = (f - (θ_base + ω_rad)) % (2 * math.pi)
                # Ajustado o gradiente: mantém o tom mais escuro em 0.05, mas reduz o mais claro
                intensity = 0.05 + 0.25 * (diff / (2 * math.pi))
                ls.setColor(intensity, intensity, intensity, 1)
                if j == 0:
                    ls.moveTo(pt_rel)
                else:
                    ls.drawTo(pt_rel)
        self.orbit_lines = self.render.attachNewNode(ls.create())

        # Atualiza posição e visibilidade dos corpos conforme o zoom
        for key, node in self.nodes.items():
            pos = positions.get(key, center)
            if key in astros and 'raio' in astros[key]:
                real_scale = float(astros[key]['raio']) * MODEL_SIZE_FACTOR
                node.setScale(real_scale)
            else:
                node.setScale(0.2)
            if key == 'sol':
                node.setPos(center - self.camera_current_pos)
            else:
                if key in parent_moons and zoom < MOON_ZOOM_THRESHOLD:
                    node.hide()
                else:
                    node.show()
                    node.setPos(pos - self.camera_current_pos)
        new_altitude = CAMERA_BASE_ALTITUDE / self.zoom_current
        
        # Calcular posição da câmera com base na inclinação e rotação horizontal
        # Usamos coordenadas esféricas para calcular a posição da câmera
        new_altitude = CAMERA_BASE_ALTITUDE / self.zoom_current
        
        # Calcular a posição usando coordenadas esféricas
        # theta (horizontal_rotation): ângulo no plano XY
        # phi (camera_inclination): ângulo a partir do eixo Z
        x = new_altitude * math.sin(self.camera_inclination) * math.cos(self.horizontal_rotation)
        y = new_altitude * math.sin(self.camera_inclination) * math.sin(self.horizontal_rotation)
        z = new_altitude * math.cos(self.camera_inclination)
        
        # Posicionar a câmera e garantir que ela sempre olhe para o centro
        self.camera.setPos(x, y, z)
        self.camera.lookAt(0, 0, 0)
        
        sim_datetime = ref_date + timedelta(days=sim_days)
        astro_focus = astros.get(target.lower(), {"nome": target})
        self.text_focus.setText(astro_focus["nome"])
        return Task.cont