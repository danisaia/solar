# Importa a classe que gerencia o sistema solar.
from src.sistema_solar import SistemaSolar

# Inicia o programa quando executado diretamente.
if __name__ == '__main__':
    # Instancia e executa a aplicação do sistema solar.
    app = SistemaSolar()
    app.run()