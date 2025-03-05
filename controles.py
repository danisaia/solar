# Remover a importação do pygame e criar função para registrar controles em Panda3D

# Atualize o estado inicial para que o foco seja a Terra
simulation_state = {
    'target': 'terra',        # Inicialmente com foco na Terra
    'speed': 1.0,
    'zoom': 1.0,
    'current_planet_index': 2,  # Terra é o 3º na ordem
    'current_moon_index': 0,
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
    simulation_state['speed'] *= 10
    print("Velocidade aumentada para:", simulation_state['speed'])

def diminuir_velocidade():
    simulation_state['speed'] /= 10
    print("Velocidade diminuída para:", simulation_state['speed'])

def aumentar_zoom():
    simulation_state['zoom'] *= 1.2
    print("Zoom aumentado para:", simulation_state['zoom'])

def diminuir_zoom():
    simulation_state['zoom'] /= 1.2
    print("Zoom diminuído para:", simulation_state['zoom'])

def resetar_zoom():
    simulation_state['zoom'] = 1.0
    print("Zoom resetado para:", simulation_state['zoom'])

# Nova função para registrar controles em Panda3D
def register_controls(base):
    base.accept('s', centralizar_no_sol)
    base.accept('d', proximo_planeta)
    base.accept('a', planeta_anterior)
    base.accept('e', proxima_lua)
    base.accept('q', lua_anterior)
    base.accept('w', centralizar_no_planeta)
    base.accept('x', velocidade_real)
    base.accept('c', aumentar_velocidade)
    base.accept('z', diminuir_velocidade)
    base.accept('r', aumentar_zoom)
    base.accept('f', diminuir_zoom)
    base.accept('v', resetar_zoom)

if __name__ == '__main__':
    # Exemplo de teste: a função handle_key_event pode ser chamada no loop de eventos de solar.py.
    print("Controles carregados. Utilize handle_key_event(event) para processar eventos.")