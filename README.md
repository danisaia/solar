# Sistema Solar 3D

Uma simulação interativa do Sistema Solar em 3D usando Panda3D, permitindo a exploração dos planetas, luas e suas órbitas com um alto grau de precisão astronômica.

![Sistema Solar](https://github.com/seu-usuario/Sistema-Solar/raw/main/screenshots/sistema_solar.png)

## Sobre o Projeto

Este simulador do Sistema Solar oferece uma representação visual e interativa dos principais corpos celestes do nosso sistema planetário, incluindo o Sol, os oito planetas e várias luas importantes. A simulação utiliza dados astronômicos reais para calcular as órbitas e posições relativas dos corpos celestes.

## Características Principais

- Modelo completo do Sistema Solar com o Sol, 8 planetas e 9 luas principais
- Órbitas precisas baseadas em parâmetros orbitais reais
- Controle de tempo (aceleração/desaceleração da simulação)
- Navegação intuitiva entre planetas e luas
- Controles de câmera para zoom, inclinação e órbita ao redor dos corpos celestes
- Renderização 3D com iluminação e anti-aliasing

## Requisitos

- Python 3.7+
- Panda3D
- PyYAML

## Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/Sistema-Solar.git
   cd Sistema-Solar/solar
   ```

2. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```

## Executando a Simulação

Execute o arquivo principal para iniciar a simulação:

```
python solar.py
```

## Controles

### Navegação entre Corpos Celestes
- `S` - Focar no Sol
- `D` - Próximo planeta
- `A` - Planeta anterior
- `W` - Voltar ao planeta atual (após visitar uma lua)
- `E` - Próxima lua do planeta atual
- `Q` - Lua anterior do planeta atual

### Controle de Tempo
- `0` - Restaurar velocidade normal (1x)
- `+` / `=` - Aumentar velocidade de simulação (10x)
- `-` - Diminuir velocidade de simulação (0.1x)

### Controle de Câmera
- Roda do mouse - Zoom in/out
- `Shift` + Roda do mouse - Zoom in/out mais preciso
- `F` - Aumentar inclinação da câmera
- `R` - Diminuir inclinação da câmera
- `Shift` + `F` - Diminuir inclinação precisamente
- `Shift` + `R` - Aumentar inclinação precisamente
- `V` - Resetar inclinação da câmera
- `Z` - Orbitar para a esquerda
- `C` - Orbitar para a direita
- `Shift` + `Z` - Orbitar precisamente para a esquerda
- `Shift` + `C` - Orbitar precisamente para a direita

## Detalhes Técnicos

### Física e Modelos Orbitais
A simulação utiliza parâmetros orbitais derivados de dados astronômicos reais:
- Semieixo maior (a)
- Período orbital (T)
- Excentricidade (e)
- Inclinação (i)
- Longitude do nodo ascendente (Ω)
- Argumento do periélio (ω)
- Anomalia média (M)

Esses dados estão configurados no arquivo `src/parametros/corpos.yaml`.

### Renderização
- Engine gráfica: Panda3D
- Anti-aliasing multisample (4x)
- Sistema de iluminação com luzes ambiente, direcional e pontual (para o Sol)

## Estrutura do Projeto

```
Sistema-Solar/
├── solar/
│   ├── solar.py                 # Ponto de entrada principal
│   ├── requirements.txt         # Dependências do projeto
│   ├── src/
│   │   ├── sistema.py           # Classe principal do sistema solar
│   │   ├── controles.py         # Gerenciamento de controles e estado da simulação
│   │   ├── camera.py            # Controlador de câmera
│   │   └── parametros/
│   │       └── corpos.yaml      # Dados dos corpos celestes
```

## Funcionalidades Detalhadas

### Visualização de Órbitas
A simulação renderiza automaticamente as órbitas dos corpos celestes com base em seu posicionamento astronômico, ajustando a visibilidade dinamicamente conforme o nível de zoom para maior clareza visual.

### Iluminação Realista
O Sol é representado como uma fonte de luz pontual que ilumina os planetas e suas luas, proporcionando um ciclo realista de dia e noite nas superfícies dos planetas.

### Escalas Dinâmicas
O Sistema Solar é apresentado usando escalas relativas para facilitar a visualização, uma vez que as distâncias reais tornariam a maioria dos corpos celestes invisíveis.

## Possíveis Melhorias Futuras

- Texturização de planetas e luas
- Visualização de anéis (para Saturno, Júpiter, Urano e Netuno)
- Adição de mais corpos celestes (asteroides, cometas, planetas anões)
- Opção para exibir informações astronômicas detalhadas
- Interface gráfica para controles

## Licença

[Inserir informações de licença aqui]

## Créditos

Desenvolvido como um projeto de simulação astronômica com Panda3D.

---

*"O espaço não é apenas mais uma fronteira, é a forma como vemos o universo e nosso lugar nele."*
