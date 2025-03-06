# Remover a importação do pygame e criar função para registrar controles em Panda3D

# Atualize o estado inicial para que o foco seja a Terra
simulation_state = {
    'target': 'terra',        # Inicialmente com foco na Terra
    'speed': 1.0,
    'zoom': 1.0,
    'current_planet_index': 2,  # Terra é o 3º na ordem
    'current_moon_index': 0,
    'camera_inclination': 0.2,  # Inclinação padrão da câmera
    'target_inclination': 0.2,  # Valor alvo inicial também com inclinação padrão
    'horizontal_rotation': 0.0,  # Ângulo de rotação horizontal (0 = visão frontal)
    'target_rotation': 0.0,     # Valor alvo para transição suave da rotação
}

planets_order = ['mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno']
moon_mapping = {
    'terra': ['lua'],
    'jupiter': ['io', 'europa', 'ganimedes', 'calisto'],
    'saturno': ['tita', 'encelado'],
    'urano': ['titania', 'oberon']
}

# Funções de controle
def centralizar_no_sol():
    simulation_state['target'] = 'sol'
    print("Centralizado no Sol")

def proximo_planeta():
    # Se o foco estiver no Sol, definir índice para o mais próximo (Mercúrio)
    if simulation_state['target'] == 'sol':
        simulation_state['current_planet_index'] = 0
    else:
        simulation_state['current_moon_index'] = 0
        simulation_state['current_planet_index'] = (simulation_state['current_planet_index'] + 1) % len(planets_order)
    simulation_state['target'] = planets_order[simulation_state['current_planet_index']]
    print("Planeta atual:", simulation_state['target'])

def planeta_anterior():
    # Se o foco estiver no Sol, definir índice para o mais distante (Netuno)
    if simulation_state['target'] == 'sol':
        simulation_state['current_planet_index'] = len(planets_order) - 1
    else:
        simulation_state['current_moon_index'] = 0
        simulation_state['current_planet_index'] = (simulation_state['current_planet_index'] - 1) % len(planets_order)
    simulation_state['target'] = planets_order[simulation_state['current_planet_index']]
    print("Planeta atual:", simulation_state['target'])

def proxima_lua():
    planet = planets_order[simulation_state['current_planet_index']]
    moons = moon_mapping.get(planet)
    if moons:
        simulation_state['current_moon_index'] = (simulation_state['current_moon_index'] + 1) % len(moons)
        simulation_state['target'] = moons[simulation_state['current_moon_index']]
        print("Lua atual:", simulation_state['target'])
    else:
        print("O planeta", planet, "não tem luas.")

def lua_anterior():
    planet = planets_order[simulation_state['current_planet_index']]
    moons = moon_mapping.get(planet)
    if moons:
        simulation_state['current_moon_index'] = (simulation_state['current_moon_index'] - 1) % len(moons)
        simulation_state['target'] = moons[simulation_state['current_moon_index']]
        print("Lua atual:", simulation_state['target'])
    else:
        print("O planeta", planet, "não tem luas.")

def centralizar_no_planeta():
    planet = planets_order[simulation_state['current_planet_index']]
    simulation_state['target'] = planet
    print("Centralizado no planeta:", planet)

def velocidade_real():
    simulation_state['speed'] = 1.0
    print("Velocidade de simulação real:", simulation_state['speed'])

def aumentar_velocidade():
    # Aumenta a velocidade por um fator de 10, mas limita ao máximo de 1,000,000
    simulation_state['speed'] = min(simulation_state['speed'] * 10, 1000000.0)
    print("Velocidade aumentada para:", simulation_state['speed'])

def diminuir_velocidade():
    # Diminui a velocidade por um fator de 10, mas limita ao mínimo de 1.0
    simulation_state['speed'] = max(simulation_state['speed'] / 10, 1.0)
    print("Velocidade diminuída para:", simulation_state['speed'])

def aumentar_zoom():
    simulation_state['zoom'] *= 1.5
    print("Zoom aumentado para:", simulation_state['zoom'])

def aumentar_zoom_curto():
    simulation_state['zoom'] *= 1.1
    print("Zoom aumentado para:", simulation_state['zoom'])

def diminuir_zoom():
    simulation_state['zoom'] /= 1.5
    print("Zoom diminuído para:", simulation_state['zoom'])

def diminuir_zoom_curto():
    simulation_state['zoom'] /= 1.1
    print("Zoom diminuído para:", simulation_state['zoom'])

def resetar_zoom():
    simulation_state['zoom'] = 1.0
    print("Zoom resetado para:", simulation_state['zoom'])

def aumentar_inclinacao():
    simulation_state['target_inclination'] = min(simulation_state['target_inclination'] + 0.1, 1.5)
    print(f"Inclinação da câmera aumentada para: {simulation_state['target_inclination']:.2f}")

def diminuir_inclinacao():
    simulation_state['target_inclination'] = max(simulation_state['target_inclination'] - 0.1, 0.2)
    print(f"Inclinação da câmera diminuída para: {simulation_state['target_inclination']:.2f}")

def aumentar_inclinacao_preciso():
    simulation_state['target_inclination'] = min(simulation_state['target_inclination'] + 0.01, 1.5)
    print(f"Inclinação da câmera aumentada precisamente para: {simulation_state['target_inclination']:.2f}")

def diminuir_inclinacao_preciso():
    simulation_state['target_inclination'] = max(simulation_state['target_inclination'] - 0.01, 0.2)
    print(f"Inclinação da câmera diminuída precisamente para: {simulation_state['target_inclination']:.2f}")

def resetar_inclinacao():
    simulation_state['target_inclination'] = 0.2  # Reseta para a inclinação padrão
    print("Inclinação da câmera resetada para o padrão (0.2)")

def orbitar_esquerda():
    simulation_state['target_rotation'] -= 0.3
    print(f"Orbitando para a esquerda: {simulation_state['target_rotation']:.2f}")

def orbitar_direita():
    simulation_state['target_rotation'] += 0.3
    print(f"Orbitando para a direita: {simulation_state['target_rotation']:.2f}")

def orbitar_esquerda_preciso():
    simulation_state['target_rotation'] -= 0.1
    print(f"Orbitando precisamente para a esquerda: {simulation_state['target_rotation']:.2f}")

def orbitar_direita_preciso():
    simulation_state['target_rotation'] += 0.1
    print(f"Orbitando precisamente para a direita: {simulation_state['target_rotation']:.2f}")

# Nova função para registrar controles em Panda3D
def register_controls(base):
    base.accept('s', centralizar_no_sol)
    base.accept('d', proximo_planeta)
    base.accept('a', planeta_anterior)
    base.accept('e', proxima_lua)
    base.accept('q', lua_anterior)
    base.accept('w', centralizar_no_planeta)
    base.accept('0', velocidade_real)
    base.accept('=', aumentar_velocidade)
    base.accept('-', diminuir_velocidade)
    base.accept('wheel_up', aumentar_zoom)
    base.accept('wheel_down', diminuir_zoom)
    base.accept('shift-wheel_up', aumentar_zoom_curto)
    base.accept('shift-wheel_down', diminuir_zoom_curto)
    base.accept('f', aumentar_inclinacao)
    base.accept('r', diminuir_inclinacao)
    base.accept('v', resetar_inclinacao)
    base.accept('z', orbitar_esquerda)
    base.accept('c', orbitar_direita)
    
    # Registrar comandos precisos com Shift
    base.accept('shift-r', aumentar_inclinacao_preciso)
    base.accept('shift-f', diminuir_inclinacao_preciso)
    base.accept('shift-z', orbitar_esquerda_preciso)
    base.accept('shift-c', orbitar_direita_preciso)

if __name__ == '__main__':
    # Exemplo de teste: a função handle_key_event pode ser chamada no loop de eventos de solar.py.
    print("Controles carregados. Utilize handle_key_event(event) para processar eventos.")