"""
Visualizador de Mapa de Calor Baropodométrico - Matriz 15x15 (ESP32)
====================================================================
Controles Interativos (Widgets):
1. Slider 'Escala Máx' (VMAX): 500 a 4000 (controla set_clim e saturação de cores)
2. Slider 'Limiar': 0 a 500 (deadzone contra ruídos de contato residual)
3. Slider 'Gama': 0.5 a 2.5 (afia e realça os pontos de carga plantar)
4. Botão 'Zerar Tara': reinicia a coleta da baseline de repouso em tempo real
5. Métrica no Título: cálculo contínuo do balanço Pé Esquerdo (cols 0-6) vs Pé Direito (cols 8-14)
"""

import sys
import time
import argparse
import numpy as np
import serial
import serial.tools.list_ports
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from matplotlib.widgets import Slider, Button

# ==========================================
# PARÂMETROS E CONSTANTES DO SISTEMA
# ==========================================
PORTA_PADRAO = 'COM5'
BAUDRATE_PADRAO = 115200
TIMEOUT_SERIAL = 0.05       # 0.05s para baixa latência

DIM_LINHAS = 15
DIM_COLUNAS = 15
TOTAL_SENSORES = DIM_LINHAS * DIM_COLUNAS  # 225

QTD_QUADROS_TARA = 30       # Quadros para baseline de repouso
INTERPOLACAO_IMSHOW = 'bicubic'

# Valores iniciais dos controles
VMIN_PRESSAO = 0.0
VMAX_INICIAL = 2100.0       # Faixa de 500 a 4000
LIMIAR_INICIAL = 150.0      # Faixa de 0 a 500
GAMA_INICIAL = 1.30         # Faixa de 0.5 a 2.5


class GerenciadorEstado:
    """Armazena o estado dinâmico dos dados, calibração e sliders."""
    def __init__(self, vmax=VMAX_INICIAL, limiar=LIMIAR_INICIAL, gama=GAMA_INICIAL):
        self.buffer_tara = []
        self.matriz_tara = None
        self.tara_concluida = False
        self.solicitar_retara = False
        
        # Parâmetros controlados pelos widgets
        self.vmax = float(vmax)
        self.limiar_corte = float(limiar)
        self.gama = float(gama)
        
        self.ultimo_quadro_valido = np.zeros((DIM_LINHAS, DIM_COLUNAS), dtype=np.float32)
        
        # Métricas baropodométricas
        self.pct_esq = 0.0
        self.pct_dir = 0.0
        self.pico_pressao = 0.0
        
        # Telemetria
        self.fps = 0.0
        self.ultimo_tempo_fps = time.time()
        self.contagem_quadros = 0


def conectar_dispositivo_serial(porta=PORTA_PADRAO, baud=BAUDRATE_PADRAO, timeout=TIMEOUT_SERIAL):
    """Inicializa a comunicação serial desabilitando DTR/RTS para evitar reset contínuo no Windows."""
    try:
        ser = serial.Serial(porta, baudrate=baud, timeout=timeout)
        ser.dtr = False
        ser.rts = False
        print(f"[SERIAL] Conectado na porta {porta} ({baud} bps, timeout {timeout}s).")
        time.sleep(1.0)
        ser.reset_input_buffer()
        return ser
    except serial.SerialException as err:
        print(f"\n[ERRO] Não foi possível abrir a porta {porta}: {err}")
        print("\nPortas seriais detectadas no sistema:")
        portas = list(serial.tools.list_ports.comports())
        if portas:
            for p in portas:
                print(f"  * {p.device}: {p.description}")
        else:
            print("  Nenhuma porta serial ativa encontrada.")
        sys.exit(1)


def capturar_leitura_tempo_real(ser):
    """
    Esvazia o buffer acumulado para garantir taxa em tempo real (zero lag visual)
    e extrai a leitura mais recente de 225 valores.
    """
    if ser.in_waiting > 1200:
        ser.reset_input_buffer()
        ser.readline()

    ultima_linha_valida = None

    while ser.in_waiting > 0:
        try:
            linha = ser.readline().decode('utf-8', errors='ignore').strip()
            if linha:
                tokens = linha.split(',')
                if len(tokens) == TOTAL_SENSORES:
                    ultima_linha_valida = tokens
        except Exception:
            continue

    if ultima_linha_valida is None:
        try:
            linha = ser.readline().decode('utf-8', errors='ignore').strip()
            if linha:
                tokens = linha.split(',')
                if len(tokens) == TOTAL_SENSORES:
                    ultima_linha_valida = tokens
        except Exception:
            pass

    if ultima_linha_valida is not None:
        try:
            valores = [int(v) for v in ultima_linha_valida]
            matriz = np.array(valores, dtype=np.float32).reshape((DIM_LINHAS, DIM_COLUNAS))
            # Inversão horizontal para alinhar direita da esteira com a tela
            matriz = np.fliplr(matriz)
            return matriz
        except ValueError:
            return None

    return None


def ciclo_animacao(num_frame, ser, im, titulo_ax, status_hud, estado):
    """Loop principal de atualização chamado pelo FuncAnimation."""
    
    # 4. Botão 'Zerar Tara': Reinicia a coleta da baseline de repouso
    if estado.solicitar_retara:
        estado.buffer_tara.clear()
        estado.matriz_tara = None
        estado.tara_concluida = False
        estado.solicitar_retara = False
        print("\n[TARA] Coletando nova baseline de repouso da esteira...")

    leitura = capturar_leitura_tempo_real(ser)
    if leitura is not None:
        estado.ultimo_quadro_valido = leitura
    else:
        leitura = estado.ultimo_quadro_valido

    # Calibração e Tara Automática: Coleta dos primeiros quadros
    if not estado.tara_concluida:
        estado.buffer_tara.append(leitura)
        contagem = len(estado.buffer_tara)
        
        titulo_ax.set_text(f"CALIBRANDO TARA ({contagem}/{QTD_QUADROS_TARA}) - ESTEIRA LIVRE")
        titulo_ax.set_color("#f39c12")
        status_hud.set_text("Calculando média de ruído estático em repouso...")

        if contagem >= QTD_QUADROS_TARA:
            estado.matriz_tara = np.mean(estado.buffer_tara, axis=0)
            estado.tara_concluida = True
            print(f"[TARA] Concluída! Ruído baseline médio: {np.mean(estado.matriz_tara):.1f} ADC")

        im.set_array(np.zeros((DIM_LINHAS, DIM_COLUNAS), dtype=np.float32))
        return [im, titulo_ax, status_hud]

    # Subtração da baseline de repouso
    quadro_tarado = leitura - estado.matriz_tara
    quadro_tarado = np.maximum(0.0, quadro_tarado)

    # 2. Slider 'Limiar': corte de ruído residual (deadzone)
    quadro_limpo = np.where(quadro_tarado >= estado.limiar_corte, quadro_tarado, 0.0)

    # 5. Métrica no Título: Cálculo contínuo do balanço bilateral
    # Pé Esquerdo: colunas 0 a 6 (sensores 1 a 7)
    # Pé Direito: colunas 8 a 14 (sensores 9 a 15)
    carga_esq = np.sum(quadro_limpo[:, 0:7])
    carga_dir = np.sum(quadro_limpo[:, 8:15])
    carga_total = carga_esq + carga_dir
    
    estado.pico_pressao = np.max(quadro_limpo)

    if carga_total > 50:
        estado.pct_esq = (carga_esq / carga_total) * 100.0
        estado.pct_dir = (carga_dir / carga_total) * 100.0
        texto_balanco = f"Esq: {estado.pct_esq:.0f}% | Dir: {estado.pct_dir:.0f}%"
    else:
        estado.pct_esq = 0.0
        estado.pct_dir = 0.0
        texto_balanco = "Esq: 0% | Dir: 0%"

    # Exibição no Título
    titulo_texto = f"{texto_balanco} | Carga Máx: {int(estado.pico_pressao)} ADC"
    titulo_ax.set_text(titulo_texto)
    titulo_ax.set_color("#00ff88" if estado.pico_pressao > 0 else "#8b949e")

    # 3. Slider 'Gama': Correção de potência para realce dos pontos de apoio
    vmax_efetivo = max(100.0, estado.vmax)
    quadro_norm = np.clip(quadro_limpo / vmax_efetivo, 0.0, 1.0)
    quadro_realcado = np.power(quadro_norm, estado.gama) * vmax_efetivo

    # Telemetria FPS
    estado.contagem_quadros += 1
    agora = time.time()
    dt = agora - estado.ultimo_tempo_fps
    if dt >= 0.5:
        estado.fps = estado.contagem_quadros / dt
        estado.contagem_quadros = 0
        estado.ultimo_tempo_fps = agora

    # Atualiza texto informativo de rodapé
    ativos = np.count_nonzero(quadro_limpo)
    status_hud.set_text(
        f"Sensores Ativos: {ativos:2d}/225   |   "
        f"FPS: {estado.fps:4.1f}   |   "
        f"VMax: {int(estado.vmax)}   |   "
        f"Limiar: {int(estado.limiar_corte)}   |   "
        f"Gama: {estado.gama:.2f}"
    )

    im.set_array(quadro_realcado)
    return [im, titulo_ax, status_hud]


def executar_visualizador(porta=PORTA_PADRAO, baud=BAUDRATE_PADRAO, timeout=TIMEOUT_SERIAL):
    """Configura interface com Sliders, Botão e Animação em tempo real."""
    estado = GerenciadorEstado()
    ser = conectar_dispositivo_serial(porta, baud, timeout)

    # Configuração de Estilo Visual Dark
    plt.style.use('dark_background')
    fig = plt.figure(figsize=(9.0, 9.4), facecolor='#0d1117')
    try:
        fig.canvas.manager.set_window_title(f"Baropodometria 15x15 ESP32 - {porta}")
    except Exception:
        pass

    # Cabeçalho da aplicação
    fig.suptitle(
        "ESTEIRA BAROPODOMÉTRICA 15x15",
        fontsize=13,
        fontweight='bold',
        color='#c9d1d9',
        y=0.985
    )

    # 1. Eixo Principal do Mapa de Calor [left, bottom, width, height]
    ax = fig.add_axes([0.10, 0.28, 0.70, 0.64], facecolor='#161b22')

    # Título no Topo do Eixo com as Métricas em Tempo Real
    titulo_ax = ax.set_title(
        "Esq: 0% | Dir: 0% | Carga Máx: 0 ADC",
        fontsize=13,
        fontweight='bold',
        color='#8b949e',
        pad=10
    )

    matriz_vazia = np.zeros((DIM_LINHAS, DIM_COLUNAS), dtype=np.float32)
    im = ax.imshow(
        matriz_vazia,
        cmap='turbo',
        interpolation=INTERPOLACAO_IMSHOW,
        vmin=VMIN_PRESSAO,
        vmax=estado.vmax,
        origin='upper',
        extent=[0.5, 15.5, 15.5, 0.5]
    )

    # Linha divisória sutil central
    ax.axvline(x=8.0, color='#30363d', linestyle='--', linewidth=1.2, alpha=0.6)

    # Formatação dos eixos
    ax.set_xticks(range(1, 16))
    ax.set_yticks(range(1, 16))
    ax.tick_params(colors='#8b949e', labelsize=8)
    ax.set_xlabel("Pé Esquerdo (1-7)   |   Centro (8)   |   Pé Direito (9-15)", color='#8b949e', fontsize=8.5, labelpad=5)
    ax.set_ylabel("Linha (1 - 15)", color='#8b949e', fontsize=8.5, labelpad=5)

    # Barra de cores lateral dedicada
    cbar_ax = fig.add_axes([0.82, 0.28, 0.03, 0.64], facecolor='#161b22')
    cbar = fig.colorbar(im, cax=cbar_ax)
    cbar.set_label('Pressão (ADC)', fontsize=9.5, fontweight='bold', color='#c9d1d9')
    cbar.ax.tick_params(colors='#8b949e', labelsize=8)
    cbar.outline.set_edgecolor('#30363d')

    # HUD de status entre o mapa e os controles
    status_hud = fig.text(
        0.50, 0.24, "Inicializando conexões e baseline...",
        ha='center', va='center',
        fontsize=8.5, color='#8b949e', fontfamily='monospace'
    )

    # ==========================================
    # CONTROLES INTERATIVOS (WIDGETS) NO RODAPÉ
    # ==========================================
    # 1. Slider 'Escala Máx' (VMAX): 500 a 4000
    ax_vmax = fig.add_axes([0.22, 0.165, 0.48, 0.026], facecolor='#21262d')
    slider_vmax = Slider(
        ax=ax_vmax,
        label='Escala Máx',
        valmin=500.0,
        valmax=4000.0,
        valinit=VMAX_INICIAL,
        valstep=50.0,
        valfmt='%0.0f ADC',
        color='#58a6ff'
    )
    slider_vmax.label.set_color('#c9d1d9')
    slider_vmax.label.set_fontsize(8.5)
    slider_vmax.valtext.set_color('#58a6ff')
    slider_vmax.valtext.set_fontsize(8.5)

    # 2. Slider 'Limiar': 0 a 500
    ax_limiar = fig.add_axes([0.22, 0.115, 0.48, 0.026], facecolor='#21262d')
    slider_limiar = Slider(
        ax=ax_limiar,
        label='Limiar',
        valmin=0.0,
        valmax=500.0,
        valinit=LIMIAR_INICIAL,
        valstep=10.0,
        valfmt='%0.0f ADC',
        color='#f39c12'
    )
    slider_limiar.label.set_color('#c9d1d9')
    slider_limiar.label.set_fontsize(8.5)
    slider_limiar.valtext.set_color('#f39c12')
    slider_limiar.valtext.set_fontsize(8.5)

    # 3. Slider 'Gama': 0.5 a 2.5
    ax_gama = fig.add_axes([0.22, 0.065, 0.48, 0.026], facecolor='#21262d')
    slider_gama = Slider(
        ax=ax_gama,
        label='Gama',
        valmin=0.50,
        valmax=2.50,
        valinit=GAMA_INICIAL,
        valstep=0.05,
        valfmt='%0.2f',
        color='#a371f7'
    )
    slider_gama.label.set_color('#c9d1d9')
    slider_gama.label.set_fontsize(8.5)
    slider_gama.valtext.set_color('#a371f7')
    slider_gama.valtext.set_fontsize(8.5)

    # 4. Botão 'Zerar Tara'
    ax_btn = fig.add_axes([0.74, 0.065, 0.18, 0.126], facecolor='#238636')
    btn_tara = Button(
        ax=ax_btn,
        label='Zerar Tara\n(Baseline)',
        color='#238636',
        hovercolor='#2ea043'
    )
    btn_tara.label.set_color('#ffffff')
    btn_tara.label.set_fontsize(9.5)
    btn_tara.label.set_weight('bold')

    # ==========================================
    # CALLBACKS DOS WIDGETS
    # ==========================================
    def atualizar_vmax(val):
        estado.vmax = float(val)
        # 1. Controla o set_clim e a saturação de cores quentes
        im.set_clim(VMIN_PRESSAO, estado.vmax)
        fig.canvas.draw_idle()

    def atualizar_limiar(val):
        estado.limiar_corte = float(val)

    def atualizar_gama(val):
        estado.gama = float(val)

    def acionar_tara(event):
        estado.solicitar_retara = True

    slider_vmax.on_changed(atualizar_vmax)
    slider_limiar.on_changed(atualizar_limiar)
    slider_gama.on_changed(atualizar_gama)
    btn_tara.on_clicked(acionar_tara)

    # Atalhos de Teclado Adicionais
    def on_press(event):
        if event.key in ('t', 'T'):
            estado.solicitar_retara = True
        elif event.key in ('q', 'Q', 'escape'):
            plt.close('all')

    fig.canvas.mpl_connect('key_press_event', on_press)

    # Animação em tempo real
    anim = FuncAnimation(
        fig,
        ciclo_animacao,
        fargs=(ser, im, titulo_ax, status_hud, estado),
        interval=20,
        blit=False,
        cache_frame_data=False
    )

    def encerrar_recursos(event=None):
        if ser and ser.is_open:
            print("\n[ENCERRAMENTO] Fechando porta serial com segurança...")
            ser.close()
            print("[ENCERRAMENTO] Porta serial liberada.")

    fig.canvas.mpl_connect('close_event', encerrar_recursos)

    # Guardar referências dos widgets para evitar garbage collection do Python
    fig._widgets = [slider_vmax, slider_limiar, slider_gama, btn_tara]

    try:
        plt.show()
    except KeyboardInterrupt:
        pass
    finally:
        encerrar_recursos()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Baropodometria 15x15 ESP32 com Controles Interativos")
    parser.add_argument('--port', type=str, default=PORTA_PADRAO, help="Porta serial (Padrão: COM5)")
    parser.add_argument('--baud', type=int, default=BAUDRATE_PADRAO, help="Baudrate (Padrão: 115200)")
    parser.add_argument('--timeout', type=float, default=TIMEOUT_SERIAL, help="Timeout em segundos (Padrão: 0.05)")
    args = parser.parse_args()

    executar_visualizador(
        porta=args.port,
        baud=args.baud,
        timeout=args.timeout
    )
