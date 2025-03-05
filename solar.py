from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from panda3d.core import ClockObject, WindowProperties, AmbientLight, DirectionalLight, Vec4, Vec3, LineSegs
globalClock = ClockObject.getGlobalClock()
from direct.gui.OnscreenText import OnscreenText
import yaml, datetime, math, os
import controles  # Carrega os controles e simulation_state
from datetime import timedelta

# Carregar dados dos astros a partir de corpos.yaml
caminho_corpos = os.path.join(os.path.dirname(__file__), 'parametros', 'corpos.yaml')
with open(caminho_corpos, 'r', encoding='utf8') as f:  # especificar encoding
    astros = yaml.safe_load(f)

# Mapear luas ao corpo parent (usando as chaves em letras minúsculas)
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

# Data de referência (J2000)
ref_date = datetime.datetime(2000, 1, 1, 12, 0, 0)
# Inicializar tempo de simulação (em dias) com o tempo real decorrido desde ref_date
sim_days = (datetime.datetime.now() - ref_date).total_seconds() / 86400

# Constante de conversão para escala real (ajuste conforme necessário)
REAL_SCALE_FACTOR = 1e-6  # converte valor de raio real para unidades visíveis no Panda3D

# Zoom threshold para mostrar corpos em escala real
ZOOM_THRESHOLD = 5.0

# Defina escalas separadas
# ORBIT_SCALE converte unidades de "a" de órbita para unidades da cena
# SIZE_MULTIPLIER exagera os tamanhos dos corpos para visualização
SIZE_MULTIPLIER = 100.0

# Updated constants:
AU = 1.496e11               # meters per astronomical unit
MODEL_SIZE_FACTOR = 2e-10    # reduzido em 10x para diminuir o tamanho do modelo

def parse_number(val):
    # Converte valores numéricos ou expressões (como "27.3/365.25") para float.
    if isinstance(val, (int, float)):
        return float(val)
    try:
        # Avaliação segura sem __builtins__
        return float(eval(val, {"__builtins__": None}, {}))
    except Exception:
        return float(val)  # Fallback

class SistemaSolar(ShowBase):
    def __init__(self):
        ShowBase.__init__(self)
        # Configurar tamanho da janela
        props = WindowProperties()
        props.setSize(1600, 900)
        self.win.requestProperties(props)
        
        # Definir cor de fundo para preto
        self.setBackgroundColor(0, 0, 0, 1)
        
        # Registrar controles
        controles.register_controls(self)
        
        # Configurar câmera e iluminação
        self.disableMouse()
        ambient = AmbientLight("ambient")
        ambient.setColor(Vec4(0.2, 0.2, 0.2, 1))
        directional = DirectionalLight("directional")
        directional.setDirection(Vec3(1, 1, -1))
        self.render.setLight(self.render.attachNewNode(ambient))
        self.render.setLight(self.render.attachNewNode(directional))
        
        # Criar nodes dos corpos a partir dos modelos (esfera padrão)
        self.nodes = {}
        for key, astro in astros.items():
            kl = key.lower()
            node = self.loader.loadModel("models/misc/sphere")
            node.reparentTo(self.render)
            # Escala inicial padrão (será atualizada em cada frame)
            if kl == 'sol':
                node.setScale(2.0)
            elif 'orbital' in astro and kl not in parent_moons:
                node.setScale(0.5)
            elif 'orbital' in astro and kl in parent_moons:
                node.setScale(0.2)
            else:
                node.setScale(0.3)
            # Definir cor do modelo
            cor = astro.get('cor', '#ffffff')
            r = int(cor.lstrip('#')[0:2], 16) / 255.0
            g = int(cor.lstrip('#')[2:4], 16) / 255.0
            b = int(cor.lstrip('#')[4:6], 16) / 255.0
            node.setColor(r, g, b, 1)
            self.nodes[kl] = node
        
        # Textos informativos
        self.text_date = OnscreenText(text="", pos=(-1.3, 0.9), scale=0.05)
        self.text_speed = OnscreenText(text="", pos=(-1.3, -0.95), scale=0.05)
        self.text_zoom = OnscreenText(text="", pos=(1.0, -0.95), scale=0.05)
        self.text_focus = OnscreenText(text="", pos=(0, 0.85), scale=0.07, fg=(1,1,1,1), align=0)  # centralizado
        
        # Calcular posição inicial dos corpos para focar na Terra
        positions = self.calcular_posicoes()
        terra_pos = positions.get('terra', Vec3(0,0,0))
        # Posicionar câmera inicialmente centrada na Terra
        self.camera.setPos(terra_pos.x, terra_pos.y - 30, terra_pos.z + 20)
        self.camera.lookAt(terra_pos)
        
        # Agendar a atualização da simulação
        self.taskMgr.add(self.update_simulation, "update_simulation")
        
    def calcular_posicoes(self):
        """Calcula as posições dos corpos com base em sim_days usando valores reais escalados."""
        center = Vec3(0, 0, 0)
        pos = {}
        # Para Sol e planetas:
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol':
                pos[kl] = center
            elif 'orbital' in astro and kl not in parent_moons:
                orb = astro['orbital']
                period_days = parse_number(orb['T']) * 365.25
                theta = 2 * math.pi * ((sim_days % period_days) / period_days)
                a = orb['a']  # in AU
                e = orb.get('e', 0)
                r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(theta))
                pos[kl] = Vec3(math.cos(theta)*r, math.sin(theta)*r, 0)
        # Para luas:
        for key, astro in astros.items():
            kl = key.lower()
            if 'orbital' in astro and kl in parent_moons:
                parent_key = parent_moons.get(kl)
                if parent_key and parent_key in pos:
                    orb = astro['orbital']
                    period_days = parse_number(orb['T']) * 365.25
                    theta = 2 * math.pi * ((sim_days % period_days) / period_days)
                    a = orb['a']
                    e = orb.get('e', 0)
                    r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(theta))
                    pos[kl] = pos[parent_key] + Vec3(math.cos(theta)*r, math.sin(theta)*r, 0)
                else:
                    pos[kl] = center
        return pos

    def update_simulation(self, task):
        dt = globalClock.getDt()
        global sim_days
        sim_days += (dt / 86400) * controles.simulation_state['speed']
        positions = self.calcular_posicoes()
        
        center = Vec3(0, 0, 0)
        target = controles.simulation_state['target']
        target_pos = positions.get(target, center)
        zoom = controles.simulation_state['zoom']
        if zoom < 0.02:
            controles.simulation_state['zoom'] = 0.02
            zoom = 0.02
        
        # Desenhar órbitas (planetas e luas) centralizando no foco
        if hasattr(self, 'orbit_lines'):
            self.orbit_lines.removeNode()
        ls = LineSegs()
        ls.setThickness(1.0)  # usar espessura fixa
        num_segments = 100
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol' or ('orbital' not in astro):
                continue
            orb = astro['orbital']
            period_days = parse_number(orb['T']) * 365.25
            theta_cur = 2 * math.pi * ((sim_days % period_days) / period_days)
            a = orb['a']
            e = orb.get('e', 0)
            for i in range(num_segments + 1):
                theta_seg = theta_cur + 2 * math.pi * (i / num_segments)
                diff = (theta_seg - theta_cur) % (2 * math.pi)
                intensity = 0.05 + 0.45 * (diff / (2 * math.pi))
                ls.setColor(intensity, intensity, intensity, 1)
                r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(theta_seg))
                x = math.cos(theta_seg) * r
                y = math.sin(theta_seg) * r
                # Removido o zoom da posição para preservar a escala real
                if key in parent_moons and zoom >= 2.0:
                    parent_pos = positions[parent_moons[key]]
                    x_rel = x + parent_pos.x - target_pos.x
                    y_rel = y + parent_pos.y - target_pos.y
                elif key not in parent_moons and zoom < 3.0:
                    x_rel = x - target_pos.x
                    y_rel = y - target_pos.y
                else:
                    continue
                if i == 0:
                    ls.moveTo(x_rel, y_rel, 0)
                else:
                    ls.drawTo(x_rel, y_rel, 0)
        self.orbit_lines = self.render.attachNewNode(ls.create())
        
        for key, node in self.nodes.items():
            pos = positions.get(key, center)
            # Exibir luas somente com zoom >= 2.0
            if key in parent_moons:
                if zoom < 2.0:
                    node.hide()
                    continue
                else:
                    node.show()
            if key in astros and 'raio' in astros[key]:
                real_scale = float(astros[key]['raio']) * MODEL_SIZE_FACTOR
                node.setScale(real_scale)
            else:
                node.setScale(0.2)
            # Removido o zoom dos cálculos de posição para manter as proporções reais
            if key == 'sol':
                node.setPos(center - target_pos)
            else:
                node.setPos(pos - target_pos)
        
        # Atualização da câmera permanece usando zoom para ajustar a visão
        CAMERA_BASE_ALTITUDE = 100.0
        new_altitude = CAMERA_BASE_ALTITUDE / zoom
        self.camera.setPos(0, 0, new_altitude)
        self.camera.lookAt(0, 0, 0)
        
        # Atualizar textos
        sim_datetime = ref_date + timedelta(days=sim_days)
        self.text_date.setText(sim_datetime.strftime("%d/%m/%Y, %H:%M:%S"))
        self.text_speed.setText(f"Velocidade: x{controles.simulation_state['speed']:.1f}")
        self.text_zoom.setText(f"Zoom: x{zoom:.1f}")
        astro_focus = astros.get(target.lower(), {"nome": target})
        self.text_focus.setText(astro_focus["nome"])
        
        return Task.cont

app = SistemaSolar()
app.run()