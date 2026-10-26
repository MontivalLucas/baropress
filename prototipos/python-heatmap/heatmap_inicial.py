import serial
import serial.tools.list_ports
import time
import sys
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation

# Configure a porta COM correspondente ao seu ESP32
PORTA_SERIAL = 'COM4'
BAUD_RATE = 115200
ROWS, COLS = 15, 15

# Verifica portas seriais disponiveis
available_ports = [p.device for p in serial.tools.list_ports.comports()]
if PORTA_SERIAL not in available_ports:
    print(f'Porta {PORTA_SERIAL} nao detectada. Portas encontradas: {available_ports}')
    if len(available_ports) == 1:
        PORTA_SERIAL = available_ports[0]
        print(f'Usando porta disponivel: {PORTA_SERIAL}')

try:
    ser = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=0.1)
    # Evita que o ESP32 fique travado em modo bootloader
    ser.setDTR(False)
    ser.setRTS(False)
    time.sleep(2)  # Aguarda estabilizacao da conexao
    print(f'Conectado com sucesso a porta {PORTA_SERIAL}!')
except Exception as e:
    print(f'Erro ao abrir a porta serial: {e}')
    sys.exit(1)

# Matriz que armazena a leitura de repouso de cada um dos 225 pontos
baseline_matrix = None
calibration_frames = 0
TOTAL_CALIBRATION_FRAMES = 30  # Primeiros ~1 a 2 segundos com a esteira livre

# Limiar de corte (Deadzone): ignora qualquer variacao residual abaixo deste valor
# Se os "fantasmas" continuarem aparecendo, aumente para 250 ou 300
THRESHOLD = 180 

def process_frame(raw_vals):
    global baseline_matrix, calibration_frames
    
    # 1. Monta a matriz 15x15 e corrige a orientacao horizontal
    matrix = np.array(raw_vals).reshape((ROWS, COLS))
    matrix = np.fliplr(matrix)

    # 2. Fase de Tara Inicial (coleta o repouso mecanico de cada ponto)
    if calibration_frames < TOTAL_CALIBRATION_FRAMES:
        if baseline_matrix is None:
            baseline_matrix = matrix.astype(float)
        else:
            # Mantem a leitura maxima de repouso de cada ponto como margem de seguranca
            baseline_matrix = np.maximum(baseline_matrix, matrix)
        calibration_frames += 1
        return np.zeros((ROWS, COLS))

    # 3. Subtracao do ruido de fundo ponto a ponto
    clean_matrix = matrix - baseline_matrix
    
    # 4. Filtro de Limiar (Deadzone) para eliminar crosstalk/caminhos de fuga
    clean_matrix[clean_matrix < THRESHOLD] = 0
    
    # 5. Saturacao entre 0 e o valor maximo esperado
    return np.clip(clean_matrix, 0, 4095)

# Matriz inicial zerada
data_matrix = np.zeros((ROWS, COLS))

# Configuracao da janela do Matplotlib
fig, ax = plt.subplots(figsize=(8, 7))
try:
    fig.canvas.manager.set_window_title('Mapa de Pressao em Tempo Real - ESP32')
except Exception:
    pass

# interpolation='gaussian' ou 'bicubic' cria o efeito termico suave
cax = ax.imshow(data_matrix, cmap='turbo', vmin=0, vmax=3500, interpolation='gaussian')
cbar = fig.colorbar(cax, ax=ax, fraction=0.046, pad=0.04)
cbar.set_label('Intensidade de Pressao (0 a 4095)', rotation=270, labelpad=15)

title_text = ax.set_title('Matriz de Pressao 15x15', fontsize=14, fontweight='bold')
status_text = ax.text(0.5, -0.05, 'Aguardando dados da porta serial...', transform=ax.transAxes,
                      ha='center', fontsize=10, color='gray')
ax.axis('off')

def update(frame):
    global data_matrix
    
    # Processa todas as linhas pendentes no buffer da serial
    while ser.is_open and ser.in_waiting > 0:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
        except Exception:
            break
            
        if line:
            parts = line.split(',')
            if len(parts) == ROWS * COLS:
                try:
                    raw_vals = [float(p) for p in parts]
                    data_matrix = process_frame(raw_vals)
                    
                    if calibration_frames < TOTAL_CALIBRATION_FRAMES:
                        status_text.set_text(f'Calibrando tara... ({calibration_frames}/{TOTAL_CALIBRATION_FRAMES})')
                    else:
                        max_val = np.max(data_matrix)
                        status_text.set_text(f'Ao vivo | Max: {max_val:.0f}')
                except ValueError:
                    pass
                    
    cax.set_data(data_matrix)
    return [cax, status_text]

def on_close(event):
    if ser.is_open:
        ser.close()
        print('Porta serial fechada.')

fig.canvas.mpl_connect('close_event', on_close)

# Inicia a animacao e abre a janela grafica do mapa de calor
ani = animation.FuncAnimation(fig, update, interval=30, blit=False, cache_frame_data=False)

plt.tight_layout()
plt.show()
