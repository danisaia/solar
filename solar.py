# ====== Imports ======
from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from direct.gui.OnscreenText import OnscreenText
from panda3d.core import ClockObject, WindowProperties, AmbientLight, DirectionalLight, Vec4, Vec3, LineSegs, PointLight
import yaml, datetime, math, os
from datetime import timedelta
import controles  # Carrega os controles e simulation_state

# ====== Variáveis Globais e Constantes ======
globalClock = ClockObject.getGlobalClock()
ref_date = datetime.datetime(2000, 1, 1, 12, 0, 0)
sim_days = (datetime.datetime.now() - ref_date).total_seconds() / 86400
REAL_SCALE_FACTOR = 1e-6         # converte valor de raio real para unidades visíveis no Panda3D
ZOOM_THRESHOLD = 5.0             # Zoom threshold para visualização
SIZE_MULTIPLIER = 100.0          # Exagera os tamanhos para visualização
AU = 1.496e11                    # metros por unidade astronômica
MODEL_SIZE_FACTOR = 2e-7        # reduzido para diminuir o tamanho do modelo

# ====== Carregar Dados ======
caminho_corpos = os.path.join(os.path.dirname(__file__), 'parametros', 'corpos.yaml')
with open(caminho_corpos, 'r', encoding='utf8') as f:
    astros = yaml.safe_load(f)
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

# ====== Funções Auxiliares ======
def parse_number(val):
    if isinstance(val, (int, float)):
        return float(val)
    try:
        return float(eval(val, {"__builtins__": None}, {}))
    except Exception:
        return float(val)

# ====== Classe Principal ======
class SistemaSolar(ShowBase):
    def __init__(self):
        ShowBase.__init__(self)
        # Configurar janela e câmera
        props = WindowProperties()
        props.setSize(1600, 900)
        self.win.requestProperties(props)
        self.setBackgroundColor(0, 0, 0, 1)
        controles.register_controls(self)
        self.disableMouse()
        lens = self.cam.node().getLens()
        lens.setNear(0.01)
        lens.setFar(1e12)
        # Armazenar a referência do lens e valores base para clipping
        self.lens = lens
        self.base_near = 0.01
        self.base_far = 1e12
        # Iluminação
        ambient = AmbientLight("ambient")
        ambient.setColor(Vec4(0.2, 0.2, 0.2, 1))
        directional = DirectionalLight("directional")
        directional.setDirection(Vec3(1, 1, -1))
        self.render.setLight(self.render.attachNewNode(ambient))
        self.render.setLight(self.render.attachNewNode(directional))
        # Inicializa variáveis de transição da câmera
        self.camera_target_pos = self.camera.getPos()
        self.camera_current_pos = self.camera.getPos()
        self.zoom_target = controles.simulation_state['zoom']
        self.zoom_current = controles.simulation_state['zoom']
        self.transition_speed = 5.0
        # Criação dos nós e configuração dos corpos
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
        # Textos informativos
        self.text_date = OnscreenText(text="", pos=(-1.3, 0.9), scale=0.05)
        self.text_speed = OnscreenText(text="", pos=(-1.3, -0.95), scale=0.05)
        self.text_zoom = OnscreenText(text="", pos=(1.0, -0.95), scale=0.05)
        self.text_focus = OnscreenText(text="", pos=(0, 0.85), scale=0.07, fg=(1,1,1,1), align=0)
        # Posicionar a câmera inicialmente centrada na Terra
        positions = self.calcular_posicoes()
        terra_pos = positions.get('terra', Vec3(0,0,0))
        self.camera.setPos(terra_pos.x, terra_pos.y - 30, terra_pos.z + 20)
        self.camera.lookAt(terra_pos)
        self.taskMgr.add(self.update_simulation, "update_simulation")
    
    def calcular_posicoes(self):
        center = Vec3(0, 0, 0)
        pos = {}
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol':
                pos[kl] = center
            elif 'orbital' in astro:
                orb = astro['orbital']
                period_days = parse_number(orb['T']) * 365.25
                # Base para a anomalia: evolucionar com o tempo.
                theta_base = 2 * math.pi * ((sim_days % period_days) / period_days)
                # Extraindo parâmetros (convertendo de graus para radianos)
                e = orb.get('e', 0)
                a = orb['a']
                ω_rad = math.radians(orb.get('ω', 0))
                i_rad = math.radians(orb.get('i', 0))
                Ω_rad = math.radians(orb.get('Ω', 0))
                # Define a anomalia verdadeira usando a base e o argumento do periastro.
                f = theta_base + ω_rad
                # Cálculo da distância usando a equação da órbita com excentricidade.
                r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(f))
                # Coordenadas na órbita (plano orbital):
                x_orb = r * math.cos(f)
                y_orb = r * math.sin(f)
                # Transformação para coordenadas no espaço (considerando inclinação e nó ascendente):
                x = x_orb * math.cos(Ω_rad) - y_orb * math.sin(Ω_rad) * math.cos(i_rad)
                y = x_orb * math.sin(Ω_rad) + y_orb * math.cos(Ω_rad) * math.cos(i_rad)
                z = y_orb * math.sin(i_rad)
                pos[kl] = Vec3(x, y, z)
        # Para corpos orbitais que são luas, adicionar a posição do corpo pai:
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
        dt = globalClock.getDt()
        global sim_days
        sim_days += (dt / 86400) * controles.simulation_state['speed']
        positions = self.calcular_posicoes()
        center = Vec3(0, 0, 0)
        target = controles.simulation_state['target']
        target_pos = positions.get(target, center)
        
        # Limitar primeiro zoom mínimo (para evitar valores absurdos)
        MIN_ZOOM = 0.00002
        controles.simulation_state['zoom'] = max(controles.simulation_state['zoom'], MIN_ZOOM)
        
        # Defina a distância base da câmera
        CAMERA_BASE_ALTITUDE = 100.0
        # Calcular o tamanho do objeto focalizado
        if target.lower() in astros and 'raio' in astros[target.lower()]:
            target_scale = float(astros[target.lower()]['raio']) * MODEL_SIZE_FACTOR
        else:
            target_scale = 0.2
        # Determinar a distância mínima desejada (por exemplo, 4 vezes o raio)
        min_distance = 4 * target_scale
        # Calcular o zoom máximo permitido para que a câmera não se aproxime demais
        max_zoom_for_target = CAMERA_BASE_ALTITUDE / min_distance
        controles.simulation_state['zoom'] = min(controles.simulation_state['zoom'], max_zoom_for_target)
        zoom = controles.simulation_state['zoom']
        MOON_ZOOM_THRESHOLD = 0.003  # somente exibe luas acima desse zoom
        
        self.camera_target_pos = target_pos
        self.zoom_target = zoom
        self.camera_current_pos += (self.camera_target_pos - self.camera_current_pos) * min(self.transition_speed * dt, 1)
        self.zoom_current += (self.zoom_target - self.zoom_current) * min(self.transition_speed * dt, 1)
        
        # Atualiza dinamicamente os planos de recorte conforme zoom
        new_near = max(self.base_near / self.zoom_current, 1e-6)
        new_far = self.base_far / self.zoom_current
        self.lens.setNear(new_near)
        self.lens.setFar(new_far)

        # (Opcional) Aqui você pode implementar troca por modelos de maior resolução
        # if self.zoom_current > <algum limiar>:
        #     trocar para modelo de alta resolução

        # Atualização dos nós das órbitas e demais elementos
        if hasattr(self, 'orbit_lines'):
            self.orbit_lines.removeNode()
        ls = LineSegs()
        ls.setThickness(1.0)
        num_segments = 150
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol' or ('orbital' not in astro):
                continue
            # Se for lua e zoom abaixo do limiar, pule
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
            # Desenho da órbita usando gradiente
            for j in range(num_segments + 1):
                f = (θ_base + 2 * math.pi * (j / num_segments)) + ω_rad
                # Recalcula a distância r para este ângulo
                r = a * AU * MODEL_SIZE_FACTOR * (1 - e**2) / (1 + e * math.cos(f))
                # Conversão para coordenadas 3D
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
                # Cálculo do gradiente: a intensidade varia com a diferença angular desde o início
                diff = (f - (θ_base + ω_rad)) % (2 * math.pi)
                intensity = 0.05 + 0.45 * (diff / (2 * math.pi))
                ls.setColor(intensity, intensity, intensity, 1)
                if j == 0:
                    ls.moveTo(pt_rel)
                else:
                    ls.drawTo(pt_rel)
        self.orbit_lines = self.render.attachNewNode(ls.create())

        # Atualiza marcadores de periastro ("P") e apoastro ("A") com tamanho fixo na tela
        from panda3d.core import TextNode
        if hasattr(self, 'orbit_markers') and self.orbit_markers is not None:
            self.orbit_markers.removeNode()
            self.orbit_markers = None
        self.orbit_markers = self.render.attachNewNode("orbit_markers")
        marker_scale = 0.7 / self.zoom_current
        for key, astro in astros.items():
            kl = key.lower()
            if kl == 'sol' or ('orbital' not in astro):
                continue
            if kl in parent_moons and zoom < MOON_ZOOM_THRESHOLD:
                continue
            orb = astro['orbital']
            a = orb['a']
            e = orb.get('e', 0)
            ω_rad = math.radians(orb.get('ω', 0))
            i_rad = math.radians(orb.get('i', 0))
            Ω_rad = math.radians(orb.get('Ω', 0))
            # Centro da órbita (para luas, soma com posição do pai)
            if key in parent_moons:
                center_orbit = positions.get(parent_moons[key], Vec3(0, 0, 0))
            else:
                center_orbit = Vec3(0, 0, 0)
            # Calcula os pontos exatos de periastro e apoastro
            r_peri = a * AU * MODEL_SIZE_FACTOR * (1 - e)
            r_apo  = a * AU * MODEL_SIZE_FACTOR * (1 + e)
            # As posições locais (no plano orbital, alinhadas com o eixo X)
            peri_pos_local = Vec3(r_peri, 0, 0)
            apo_pos_local  = Vec3(-r_apo, 0, 0)
            # Função para rotacionar o vetor considerando Ω, i e ω
            def rotate_marker(vec, ω, i, Ω):
                # Rotação por ω
                x1 = vec[0] * math.cos(ω) - vec[1] * math.sin(ω)
                y1 = vec[0] * math.sin(ω) + vec[1] * math.cos(ω)
                z1 = vec[2]
                # Inclinação i (rotaciona em torno de X)
                x2 = x1
                y2 = y1 * math.cos(i) - z1 * math.sin(i)
                z2 = y1 * math.sin(i) + z1 * math.cos(i)
                # Rotação por Ω (nó ascendente)
                x3 = x2 * math.cos(Ω) - y2 * math.sin(Ω)
                y3 = x2 * math.sin(Ω) + y2 * math.cos(Ω)
                return Vec3(x3, y3, z2)
            peri_pos = center_orbit + rotate_marker(peri_pos_local, ω_rad, i_rad, Ω_rad)
            apo_pos  = center_orbit + rotate_marker(apo_pos_local, ω_rad, i_rad, Ω_rad)
            # Cria marcador de periastro "P"
            tn_p = TextNode('peri')
            tn_p.setText("P")
            tn_p.setTextColor(1, 1, 1, 1)
            peri_np = self.orbit_markers.attachNewNode(tn_p)
            peri_np.setScale(marker_scale)
            peri_np.setBillboardPointEye()
            peri_np.setPos(peri_pos - self.camera_current_pos)
            # Cria marcador de apoastro "A"
            tn_a = TextNode('apo')
            tn_a.setText("A")
            tn_a.setTextColor(1, 1, 1, 1)
            apo_np = self.orbit_markers.attachNewNode(tn_a)
            apo_np.setScale(marker_scale)
            apo_np.setBillboardPointEye()
            apo_np.setPos(apo_pos - self.camera_current_pos)

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
        self.camera.setPos(0, 0, new_altitude)
        self.camera.lookAt(0, 0, 0)
        sim_datetime = ref_date + timedelta(days=sim_days)
        self.text_date.setText(sim_datetime.strftime("%d/%m/%Y, %H:%M:%S"))
        self.text_speed.setText(f"Velocidade: x{controles.simulation_state['speed']:.1f}")
        self.text_zoom.setText(f"Zoom: x{self.zoom_current:.1f}")
        astro_focus = astros.get(target.lower(), {"nome": target})
        self.text_focus.setText(astro_focus["nome"])
        return Task.cont

# ====== Ponto de Entrada ======
app = SistemaSolar()
app.run()