# Importa módulos essenciais e define parâmetros globais
from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from direct.gui.OnscreenText import OnscreenText
from panda3d.core import ClockObject, WindowProperties, AmbientLight, DirectionalLight, Vec4, Vec3, LineSegs, PointLight
import yaml, datetime, math, os
from datetime import timedelta
import src.controles as controles  # Gerencia controles e estado da simulação
from src.camera import CameraController  # Importa o controlador da câmera

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
        
        # Inicializa o controlador da câmera
        self.camera_controller = CameraController(self)

        # Aplica iluminação ambiente e direcional
        ambient = AmbientLight("ambient")
        ambient.setColor(Vec4(0.2, 0.2, 0.2, 1))
        directional = DirectionalLight("directional")
        directional.setDirection(Vec3(1, 1, -1))
        self.render.setLight(self.render.attachNewNode(ambient))
        self.render.setLight(self.render.attachNewNode(directional))

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

        # Configura o texto de foco e inicializa a câmera com foco na Terra
        from panda3d.core import TextNode
        try:
            verdana_font = self.loader.loadFont("verdana.ttf")
        except Exception:
            verdana_font = None
            # O aviso sobre a fonte ausente é esperado e não afeta o funcionamento
        self.text_focus = OnscreenText(text="", pos=(0, 0.9), scale=0.07,
                                       fg=(1,1,1,1), align=TextNode.ACenter, font=verdana_font)
        
        # Obtém posição da Terra para inicializar a câmera
        positions = self.calcular_posicoes()
        terra_pos = positions.get('terra', Vec3(0,0,0))
        
        # Inicialização da câmera
        self.camera_controller.initialize_camera(initial_position=terra_pos)
        
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
        
        # Verifica e aplica limites de zoom para o alvo atual
        if target.lower() in astros and 'raio' in astros[target.lower()]:
            target_scale = float(astros[target.lower()]['raio']) * MODEL_SIZE_FACTOR
        else:
            target_scale = 0.2
        max_zoom_for_target = self.camera_controller.get_zoom_limit_for_target(target_scale)
        controles.simulation_state['zoom'] = min(controles.simulation_state['zoom'], max_zoom_for_target)
        
        # Atualiza a câmera
        self.camera_controller.set_target(target_pos)
        self.camera_controller.update_from_simulation_state(controles.simulation_state)
        camera_state = self.camera_controller.update(dt)
        
        # Atualiza o estado da simulação com os valores atuais da câmera
        controles.simulation_state['camera_inclination'] = camera_state['camera_inclination']
        controles.simulation_state['horizontal_rotation'] = camera_state['horizontal_rotation']
        
        MOON_ZOOM_THRESHOLD = 0.003
        zoom = controles.simulation_state['zoom']
        
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
                pt_rel = pt - self.camera_controller.camera_current_pos
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
                node.setPos(center - self.camera_controller.camera_current_pos)
            else:
                if key in parent_moons and zoom < MOON_ZOOM_THRESHOLD:
                    node.hide()
                else:
                    node.show()
                    node.setPos(pos - self.camera_controller.camera_current_pos)
                    
        # Atualiza o texto de foco
        sim_datetime = ref_date + timedelta(days=sim_days)
        astro_focus = astros.get(target.lower(), {"nome": target})
        self.text_focus.setText(astro_focus["nome"])
        return Task.cont