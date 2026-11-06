import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { S, SHOTS, SHOT_META, HW_PHOTOS, ARTICLE } from './content'

let SP = 1
// Emil Kowalski strong custom easing curves
const EZ_OUT = [0.23, 1, 0.32, 1] as const
const EZ_MOVE = [0.77, 0, 0.175, 1] as const

const J = (a: number[]) => a
const JA = J([40, 0, 0, -60, 0, 50, -40, 0, 0, 0, 60, 0, 0, -50, 0, 40])
const JB = J([-50, 0, 0, 50, 0, -40, 50, 0, 0, 0, -50, 0, 0, 40, 0, -50])
const J0 = Array(16).fill(0)

const P = (cx: number, cy: number, rx: number, ry: number, a = 0.5523, j: number[] = J0) =>
  `M${cx},${cy - ry} C${cx + a * rx + j[0]},${cy - ry + j[1]} ${cx + rx + j[2]},${cy - a * ry + j[3]} ${cx + rx},${cy} C${cx + rx + j[4]},${cy + a * ry + j[5]} ${cx + a * rx + j[6]},${cy + ry + j[7]} ${cx},${cy + ry} C${cx - a * rx + j[8]},${cy + ry + j[9]} ${cx - rx + j[10]},${cy + a * ry + j[11]} ${cx - rx},${cy} C${cx - rx + j[12]},${cy - a * ry + j[13]} ${cx - a * rx + j[14]},${cy - ry + j[15]} ${cx},${cy - ry}Z`

const createOrganicBlob = (cx: number, cy: number, rx: number, ry: number, inset = 0) => {
  const rX = rx - inset
  const rY = ry - inset

  const topX = cx + 20
  const topY = cy - rY

  const rightX = cx + rX
  const rightY = cy - 10

  const btmX = cx + 30
  const btmY = cy + rY - 5

  const blExtraX = inset === 0 ? 55 : 0
  const blExtraY = inset === 0 ? 65 : 10

  const leftX = cx - rX - (inset === 0 ? 30 : 0)
  const leftY = cy + 40

  const cp1X = topX + rX * 0.52
  const cp1Y = topY - 10
  const cp2X = rightX + 8
  const cp2Y = cy - rY * 0.52

  const cp3X = rightX - 5
  const cp3Y = cy + rY * 0.55
  const cp4X = btmX + rX * 0.52
  const cp4Y = btmY + 8

  const cp5X = btmX - rX * 0.45 - blExtraX
  const cp5Y = btmY + blExtraY
  const cp6X = leftX - blExtraX * 0.9
  const cp6Y = cy + rY * 0.55 + blExtraY * 0.5

  const cp7X = leftX + 10
  const cp7Y = cy - rY * 0.45
  const cp8X = topX - rX * 0.55
  const cp8Y = topY + 5

  return `M ${topX},${topY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${rightX},${rightY} C ${cp3X},${cp3Y} ${cp4X},${cp4Y} ${btmX},${btmY} C ${cp5X},${cp5Y} ${cp6X},${cp6Y} ${leftX},${leftY} C ${cp7X},${cp7Y} ${cp8X},${cp8Y} ${topX},${topY} Z`
}

// PALETA OFICIAL BAROPRESS 2.0
const BL = '#2457E7' // Electric Blue
const NAVY = '#0D1830' // Midnight Navy
const ICE = '#F5F8FF' // Ice White
const WHITE = '#FFFFFF' // Pure White
const CYAN = '#38D8DC' // Signal Cyan
const GRAPHITE = '#17243A' // Graphite Blue

export type SlideVariant = 'white-editorial' | 'electric-blue' | 'midnight-tech'

export type SlideTheme = {
  variant: SlideVariant
  stageBg: string
}

// DISTRIBUIÇÃO OFICIAL DE FUNDOS (11 SLIDES)
// A revisão acrescenta a cena 12, mantendo os fundos das onze cenas originais.
export const SLIDE_THEMES: SlideTheme[] = [
  { variant: 'white-editorial', stageBg: '#FFFFFF' }, // Slide 1: branco
  { variant: 'white-editorial', stageBg: '#F5F8FF' }, // Slide 2: Ice White
  { variant: 'midnight-tech', stageBg: '#0D1830' },   // Slide 3: Midnight Navy
  { variant: 'electric-blue', stageBg: '#2457E7' },   // Slide 4: Electric Blue
  { variant: 'white-editorial', stageBg: '#FFFFFF' }, // Slide 5: branco
  { variant: 'midnight-tech', stageBg: '#0D1830' },   // Slide 6: Midnight Navy
  { variant: 'white-editorial', stageBg: '#FFFFFF' }, // Slide 7: branco
  { variant: 'white-editorial', stageBg: '#F5F8FF' }, // Slide 8: Ice White
  { variant: 'electric-blue', stageBg: '#2457E7' },   // Slide 9: Electric Blue
  { variant: 'white-editorial', stageBg: '#FFFFFF' }, // Slide 10: branco
  { variant: 'midnight-tech', stageBg: '#0D1830' },   // Slide 11: Midnight Navy (encerramento)
  { variant: 'white-editorial', stageBg: '#F5F8FF' }, // Slide 12: artigo do projeto
]

type G = { x: number; y: number; s: number; m: 'off' | 'flat' | 'heat' | 'logo' }
type H = { d: string; f: string; st: string; a: G; b?: G }

const off = (x = 960, y = 330): G => ({ x, y, s: 0.85, m: 'off' })

const HERO = (i: number, ph: number, evoReal = false): H => {
  if (i === 0 && !ph) return { d: P(960, 310, 44, 44), f: BL, st: BL, a: off(836, 186) }
  const logoWhite: H = { d: P(960, 310, 190, 190, 0.93), f: BL, st: BL, a: { x: 836, y: 186, s: 0.6, m: 'logo' } }
  const logoDark: H = { d: P(960, 310, 190, 190, 0.93), f: BL, st: CYAN, a: { x: 836, y: 186, s: 0.6, m: 'logo' } }

  return (
    [
      logoWhite, // 1: branco
      { d: createOrganicBlob(1420, 520, 360, 360, 0), f: '#93C5FD', st: '#3B82F6', a: off() }, // 2: Ice White (forma orgânica gradiente)
      { d: P(1560, 540, 130, 380, 0.9), f: '#0B1325', st: '#2457E7', a: off() }, // 3: Midnight Navy
      { d: P(1460, 540, 330, 330, 0.5523, JB), f: '#1E47C7', st: 'rgba(255,255,255,0.25)', a: off() }, // 4: Electric Blue
      { d: P(1515, 575, 345, 335, 0.94), f: '#F8FAFF', st: '#CFDCF8', a: off() }, // 5: branco
      { d: P(360, 445, 175, 175, 0.93), f: '#0A1326', st: '#2457E7', a: { x: 219, y: 304, s: 0.68, m: 'heat' } }, // 6: Midnight Navy (Captura - Matriz 15x15)
      { d: P(960, 560, 780, 370, 0.96), f: '#F8FAFF', st: '#CFDCF8', a: off() }, // 7: branco (Software Real - Janela Centralizada)
      { d: P(960, 560, 780, 370, 0.96), f: '#F8FAFF', st: '#CFDCF8', a: off(), b: off() }, // 8: Ice White (Comparação - Janela Centralizada)
      { d: P(1355, 540, 410, 470, 0.98), f: '#FFFFFF', st: 'rgba(255,255,255,0.4)', a: off() }, // 9: Electric Blue (Relatório A4)
      { d: P(1390, 592.5, 410, 337.5, 0.95), f: '#2457E7', st: '#2457E7', a: off() }, // 10: branco (Painel Comercial BAROPRESS)
      logoDark, // 11: Midnight Navy
      { d: P(1430, 540, 360, 460, 0.96), f: BL, st: '#CFDCF8', a: off() }, // 12: suporte orgânico da página do artigo
    ] as H[]
  )[i]
}

const hv = (r: number, c: number, alt: boolean) => {
  const f = (cx: number, cy: number, sx: number, sy: number) =>
    Math.exp(-(((c - cx) / sx) ** 2 + ((r - cy) / sy) ** 2))
  const L = 0.55 * f(4, 3.2, 1.8, 1.7) + 0.95 * f(4, 11.2, 1.6, 2)
  const R = 0.55 * f(10, 3.2, 1.8, 1.7) + 0.95 * f(10, 11.2, 1.6, 2)
  const n = ((r * 7 + c * 13) % 5) / 60
  return Math.min(1, (alt ? 0.7 : 0.9) * L + (alt ? 0.95 : 0.7) * R + n)
}

const col = (h: number) =>
  h > 0.8
    ? '#38D8DC'
    : `rgb(${Math.round(227 - 191 * h)},${Math.round(236 - 137 * h)},${Math.round(253 - 18 * h)})`

function Grid({ g, alt = false }: { g: G; alt?: boolean }) {
  const isOff = g.m === 'off'
  return (
    <motion.div
      className="pointer-events-none absolute z-[2] grid"
      style={{
        width: 414,
        height: 414,
        gridTemplateColumns: 'repeat(15,22px)',
        gap: 6,
        transformOrigin: '0 0',
      }}
      animate={{
        x: g.x,
        y: g.y,
        scale: isOff ? 0.88 : g.s,
        opacity: isOff ? 0 : 1,
      }}
      transition={{ duration: 1.1 * SP, ease: EZ_MOVE }}
    >
      {Array.from({ length: 225 }, (_, k) => {
        const r = Math.floor(k / 15)
        const c = k % 15
        const d = Math.hypot(r - 7, c - 7)
        const bg =
          g.m === 'heat'
            ? col(hv(r, c, alt))
            : g.m === 'logo'
              ? `rgba(255,255,255,${0.3 + hv(r, c, false) * 0.7})`
              : '#C9D9F8'
        const delay = (g.m === 'heat' ? (r + c) * 0.022 : g.m === 'logo' ? 0.35 + d * 0.018 : d * 0.015) * SP
        return (
          <motion.div
            key={k}
            style={{ width: 22, height: 22, borderRadius: 6 }}
            animate={{
              scale: isOff ? 0.35 : 1,
              opacity: isOff ? 0 : 1,
              backgroundColor: bg,
            }}
            transition={{
              scale: { type: 'spring', stiffness: 300, damping: 22, delay },
              opacity: { duration: 0.35 * SP, delay, ease: EZ_OUT },
              backgroundColor: { duration: 0.75 * SP, delay },
            }}
          />
        )
      })}
    </motion.div>
  )
}

const Rv = ({ children, d = 0, cls = '' }: { children: ReactNode; d?: number; cls?: string }) => (
  <motion.div
    className={cls}
    initial={{ clipPath: 'inset(0 100% 0 0)', filter: 'blur(8px)' }}
    animate={{ clipPath: 'inset(0 0% 0 0)', filter: 'blur(0px)' }}
    transition={{ duration: 0.75 * SP, delay: (0.45 + d) * SP, ease: EZ_OUT }}
  >
    {children}
  </motion.div>
)

function Shot({
  src,
  title,
  tag,
  h,
  pos,
  darkBg = true,
  onClose,
}: {
  src: string
  title: string
  tag?: string
  h: number
  pos: string
  darkBg?: boolean
  onClose?: () => void
}) {
  const [ok, set] = useState(true)
  useEffect(() => set(true), [src])

  return (
    <div
      className={
        'absolute z-10 ' +
        pos +
        ' flex flex-col rounded-3xl overflow-hidden border-2 border-[#CFDCF8] shadow-[0_24px_48px_-12px_rgba(11,17,32,0.18)] ' +
        (darkBg ? 'bg-[#0D1830]' : 'bg-white')
      }
      style={{ height: h }}
    >
      {/* Window Chrome com controles compactos e acessíveis */}
      <div
        className={
          'flex items-center justify-between px-4 py-2 text-[13px] font-medium border-b shrink-0 ' +
          (darkBg
            ? 'bg-[#111C33] border-slate-800 text-slate-300'
            : 'bg-[#F5F8FF] border-[#DCE7FC] text-[#0D1830]')
        }
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                title="Fechar demonstração (Esc)"
                aria-label="Fechar tela de demonstração"
                className="group flex items-center justify-center w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 focus-visible:ring-2 focus-visible:ring-rose-400 transition cursor-pointer"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-white leading-none">×</span>
              </button>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            )}
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-1.5 font-semibold tracking-tight text-[13px] truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tag && (
            <span
              className={
                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold ' +
                (darkBg ? 'bg-[#2457E7]/25 text-[#93C5FD]' : 'bg-[#EBF2FE] text-[#2457E7]')
              }
            >
              {tag}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Fechar tela de demonstração (Esc)"
              aria-label="Fechar tela de demonstração"
              className="pressable ml-1 flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-slate-200 border border-white/15 transition focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
            >
              <span className="text-[12px] leading-none">✕</span>
              <span>Fechar</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={src}
            className="w-full h-full flex items-center justify-center p-2"
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
            transition={{ duration: 0.24 * SP, ease: EZ_OUT }}
          >
            {ok ? (
              <img
                src={src}
                alt={title}
                className="w-full h-full object-contain rounded-xl"
                onError={() => set(false)}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-center text-[24px] text-slate-400 p-10">
                Imagem não encontrada em public/{src}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Scene({
  i,
  theme,
  tab,
  setTab,
  hwIdx,
  setHwIdx,
  evoReal,
  setEvoReal,
}: {
  i: number
  theme: SlideTheme
  tab: string
  setTab: (t: string) => void
  hwIdx: number
  setHwIdx: (n: number) => void
  evoReal: boolean
  setEvoReal: (v: boolean) => void
}) {
  const c = S[i]
  const isDark = theme.variant === 'midnight-tech'
  const isBlue = theme.variant === 'electric-blue'

  const titleCls = isDark || isBlue ? 'text-white' : 'text-[#0D1830]'
  const subCls = isDark ? 'text-[#CBD5E1]' : isBlue ? 'text-[#F5F8FF]' : 'text-[#17243A]'

  const T = (top: number, sz = 76, w = 900) => (
    <div className="absolute left-[120px]" style={{ top, width: w }}>
      <Rv cls={`font-bold leading-[1.04] tracking-[-0.035em] text-balance ${titleCls}`}>
        <span style={{ fontSize: sz }}>{c.t}</span>
      </Rv>
      {c.s && (
        <Rv d={0.18} cls={`mt-5 text-[28px] leading-[1.35] ${subCls}`}>
          {c.s}
        </Rv>
      )}
    </div>
  )

  // Cena 1 (Abertura) & Cena 11 (Encerramento)
  if (i === 0 || i === 10) {
    return (
      <div className="absolute left-[190px] right-[190px] text-center" style={{ top: i ? 525 : 545 }}>
        <Rv cls={`font-bold ${i ? 'text-[88px]' : 'text-[76px]'} leading-[1.06] tracking-[-0.035em] text-balance ${titleCls}`}>
          <span>{c.t}</span>
        </Rv>
        <Rv d={0.22} cls={`mt-5 mx-auto max-w-[1200px] text-[30px] leading-[1.4] font-medium ${subCls}`}>
          {c.s}
        </Rv>
        {i === 0 && (
          <Rv d={0.42} cls="mt-8 text-[26px] font-semibold tracking-[0.08em] text-[#2457E7]">
            BAROPRESS
          </Rv>
        )}
        {i === 10 && (
          <Rv d={0.42} cls="mt-7 text-[34px] font-semibold text-[#38D8DC]">
            Buscamos parceiros de ensino, pesquisa e profissionais<br />
            para as próximas etapas de validação.
          </Rv>
        )}
        {i === 10 && (
          <Rv d={0.58} cls="mt-8 text-[24px] font-medium text-[#94A3B8]">
            Montival Lucas &amp; Raphaela Teles · TCC de Engenharia de Computação · protótipo experimental
          </Rv>
        )}
      </div>
    )
  }

  // Cena 2 — O cuidado não acontece em apenas um lugar (White Editorial · Ice White)
  if (i === 1) {
    const outerBlobD = createOrganicBlob(1420, 520, 360, 360, 0)
    const innerBlobD = createOrganicBlob(1420, 520, 360, 360, 24)
    return (
      <>
        {/* Lado Esquerdo: Tipografia e pílulas fiéis ao design de referência */}
        <div className="absolute left-[120px] top-[160px] w-[860px]">
          <Rv cls="font-bold text-[74px] leading-[1.08] tracking-[-0.035em] text-[#0D1830]">
            {c.t}
          </Rv>

          <Rv d={0.16} cls="mt-7 text-[25px] leading-[1.4] text-[#475569] max-w-[720px]">
            <span>
              {c.s}
            </span>
          </Rv>

          <Rv d={0.3} cls="mt-10 max-w-[820px]">
            <div className="grid grid-cols-2 gap-8 text-[23px] leading-[1.35] text-[#17243A]">
              <div>
                <h2 className="font-semibold text-[#2457E7]">Avaliação clínica</h2>
                <p className="mt-2">Histórico, observação e testes funcionais.</p>
              </div>
              <div>
                <h2 className="font-semibold text-[#2457E7]">Informações instrumentais</h2>
                <p className="mt-2">Registros e medidas complementares, quando validados.</p>
              </div>
            </div>
            <svg aria-hidden="true" className="mt-4 w-full h-[42px]" viewBox="0 0 820 42" fill="none">
              <path d="M195 0 V15 Q195 25 205 25 H615 Q625 25 625 15 V0 M410 25 V42" stroke="#2457E7" strokeWidth="2" />
            </svg>
            <p className="text-center text-[28px] font-semibold text-[#0D1830]">Decisão do profissional</p>
          </Rv>
          <Rv d={0.54} cls="mt-7 max-w-[780px] text-[25px] leading-[1.35] font-medium text-[#2457E7]">
            A tecnologia amplia as informações. A decisão continua com o fisioterapeuta.
          </Rv>
        </div>

        {/* Lado Direito: Imagem homecare.png com moldura orgânica em dégradé e sombra */}
        <Rv d={0.2} cls="pointer-events-none absolute inset-0">
          <svg width="1920" height="1080" className="absolute inset-0">
            <defs>
              <linearGradient id="blobGradSlide2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C5D8FE" />
                <stop offset="45%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <clipPath id="homecareBlobClip">
                <path d={innerBlobD} />
              </clipPath>
            </defs>

            {/* Forma orgânica externa com dégradé azul e drop shadow */}
            <path
              d={outerBlobD}
              fill="url(#blobGradSlide2)"
              style={{ filter: 'drop-shadow(0 25px 45px rgba(37,99,235,0.22))' }}
            />

            {/* Foto homecare.png enquadrada com precisão na curva orgânica interna */}
            <image
              href="shots/homecare.png"
              x="1000"
              y="110"
              width="820"
              height="820"
              clipPath="url(#homecareBlobClip)"
              preserveAspectRatio="xMidYMid slice"
            />
          </svg>
        </Rv>
      </>
    )
  }

  // Cena 3 — Quando a tecnologia custa caro, o acesso fica limitado (Midnight Tech · Midnight Navy)
  if (i === 2) {
    const capsuleD = P(1560, 540, 130, 380, 0.9)
    return (
      <>
        {/* Lado Esquerdo: Conteúdo narrativo fiel à imagem de referência */}
        <div className="absolute left-[120px] top-[185px] w-[1200px]">
          <Rv cls="font-bold text-[74px] leading-[1.1] tracking-[-0.035em] text-white">
            <span className="block max-w-[1150px]">{c.t}</span>
          </Rv>

          <Rv d={0.22} cls="mt-9 text-[28px] leading-[1.4] text-[#CBD5E1] max-w-[820px]">
            <span>
              {c.s}
            </span>
          </Rv>

          <Rv
            d={0.32}
            cls="mt-10 max-w-[820px] text-[32px] font-medium leading-[1.3] text-[#38D8DC]"
          >
            Sistemas validados de medição plantar têm custo e disponibilidade como desafios.
          </Rv>

          <Rv d={0.42} cls="mt-9 max-w-[920px] text-[34px] font-bold tracking-tight leading-[1.3]">
            <span className="text-white">Como ampliar o acesso a ferramentas que </span>
            <span className="text-[#38D8DC]">apoiem o cuidado?</span>
          </Rv>
          <Rv d={0.52} cls="mt-8 max-w-[1000px] text-[21px] leading-[1.4] text-[#CBD5E1]">
            IWGDF, 2023 · Recomendação 8c, fundamentação, p. 20 do PDF.<br />
            Contexto: prevenção de recorrência de úlceras em pessoas com diabetes e calçados terapêuticos.
          </Rv>
        </div>

        {/* Lado Direito: Ilustração neon de barreira financeira na cápsula */}
        <Rv d={0.25} cls="pointer-events-none absolute inset-0">
          <svg width="1920" height="1080" className="absolute inset-0">
            <defs>
              <linearGradient id="barGradS3" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(36, 87, 231, 0.45)" />
                <stop offset="100%" stopColor="rgba(56, 216, 220, 0.9)" />
              </linearGradient>
              <clipPath id="capsuleClipS3">
                <path d={capsuleD} />
              </clipPath>
            </defs>

            {/* Brilho de contorno ciano da cápsula */}
            <path
              d={capsuleD}
              fill="none"
              stroke="#38D8DC"
              strokeWidth="1.2"
              strokeOpacity="0.6"
              style={{ filter: 'drop-shadow(0 0 8px rgba(56, 216, 220, 0.45))' }}
            />

            {/* Elementos internos recortados na cápsula */}
            <g clipPath="url(#capsuleClipS3)">
              {/* Linhas verticais de grade suave */}
              <line x1="1490" y1="160" x2="1490" y2="920" stroke="rgba(56, 216, 220, 0.08)" strokeDasharray="4 6" />
              <line x1="1540" y1="160" x2="1540" y2="920" stroke="rgba(56, 216, 220, 0.1)" strokeDasharray="4 6" />
              <line x1="1580" y1="160" x2="1580" y2="920" stroke="rgba(56, 216, 220, 0.1)" strokeDasharray="4 6" />
              <line x1="1630" y1="160" x2="1630" y2="920" stroke="rgba(56, 216, 220, 0.08)" strokeDasharray="4 6" />

              {/* Linha horizontal de base */}
              <line x1="1445" y1="710" x2="1675" y2="710" stroke="rgba(56, 216, 220, 0.35)" strokeWidth="1.5" />

              {/* 7 Barras ascendentes em degradê e borda neon ciano */}
              <rect x="1460" y="675" width="14" height="35" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />
              <rect x="1482" y="650" width="14" height="60" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />
              <rect x="1504" y="620" width="14" height="90" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />
              <rect x="1526" y="580" width="14" height="130" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />
              <rect x="1548" y="525" width="14" height="185" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />
              <rect x="1570" y="465" width="14" height="245" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />
              <rect x="1592" y="395" width="14" height="315" rx="3" fill="url(#barGradS3)" stroke="#38D8DC" strokeWidth="1.5" />

              {/* Flechas verticais de alta pressão / custo */}
              <g style={{ filter: 'drop-shadow(0 0 8px rgba(56, 216, 220, 0.7))' }}>
                <line x1="1520" y1="380" x2="1520" y2="265" stroke="#38D8DC" strokeWidth="3" strokeLinecap="round" />
                <polygon points="1520,250 1511,272 1529,272" fill="#38D8DC" />
              </g>

              <g style={{ filter: 'drop-shadow(0 0 6px rgba(56, 216, 220, 0.5))' }}>
                <line x1="1475" y1="460" x2="1475" y2="330" stroke="rgba(56, 216, 220, 0.7)" strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="1475,320 1468,336 1482,336" fill="#38D8DC" />
              </g>

              <g opacity="0.6">
                <line x1="1585" y1="360" x2="1585" y2="290" stroke="#38D8DC" strokeWidth="2" strokeLinecap="round" />
                <polygon points="1585,282 1580,294 1590,294" fill="#38D8DC" />
              </g>

              {/* 4 Moedas flutuantes "R$" com brilho neon */}
              <g transform="translate(1468, 595)" opacity="0.75">
                <circle cx="0" cy="0" r="22" fill="#0D1A33" stroke="#38D8DC" strokeWidth="1.8" />
                <text x="0" y="6" fill="#38D8DC" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">R$</text>
              </g>

              <g transform="translate(1580, 310)">
                <circle cx="0" cy="0" r="34" fill="#0D1A33" stroke="#38D8DC" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 10px rgba(56,216,220,0.5))' }} />
                <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(56, 216, 220, 0.4)" strokeWidth="1" />
                <text x="0" y="8" fill="#38D8DC" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">R$</text>
              </g>

              <g transform="translate(1485, 490)">
                <circle cx="0" cy="0" r="30" fill="#0D1A33" stroke="#38D8DC" strokeWidth="2.2" style={{ filter: 'drop-shadow(0 0 8px rgba(56,216,220,0.4))' }} />
                <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(56, 216, 220, 0.4)" strokeWidth="1" />
                <text x="0" y="7" fill="#38D8DC" fontSize="19" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">R$</text>
              </g>

              {/* Moeda principal central */}
              <g transform="translate(1545, 410)">
                <circle cx="0" cy="0" r="50" fill="#0A162D" stroke="#38D8DC" strokeWidth="3.5" style={{ filter: 'drop-shadow(0 0 16px rgba(56,216,220,0.7))' }} />
                <circle cx="0" cy="0" r="42" fill="none" stroke="rgba(56, 216, 220, 0.5)" strokeWidth="1.5" />
                <text x="0" y="12" fill="#FFFFFF" fontSize="32" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">R$</text>
              </g>
            </g>

            {/* Flecha ascendente em zigue-zague cortando a cápsula */}
            <g style={{ filter: 'drop-shadow(0 0 14px rgba(56, 216, 220, 0.85))' }}>
              <polyline
                points="1455,615 1495,545 1530,575 1660,370"
                fill="none"
                stroke="#38D8DC"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 1660,370 L 1622,382 M 1660,370 L 1645,408"
                fill="none"
                stroke="#38D8DC"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </Rv>
      </>
    )
  }

  // Cena 4 — A oportunidade (Electric Blue · cartões brancos com textos escuros)
  if (i === 3)
    return (
      <>
        {/* Lado Esquerdo: Conteúdo narrativo fiel à imagem de referência */}
        <div className="absolute left-[120px] top-[140px] w-[860px]">
          <Rv cls="font-bold text-[74px] leading-[1.08] tracking-[-0.035em] text-white">
            <span>E se essa tecnologia</span>
            <br />
            <span>pudesse chegar a</span>
            <br />
            <span>mais profissionais?</span>
          </Rv>

          <Rv d={0.18} cls="mt-7 text-[30px] font-semibold leading-[1.28] tracking-[-0.015em] text-white max-w-[780px]">
            <span>{c.s}</span>
          </Rv>

          <Rv d={0.28} cls="mt-9 text-[20px] font-medium text-white/85 tracking-[-0.01em]">
            <span>Três diretrizes orientam o projeto, desde a bancada até o software:</span>
          </Rv>

          <div className="mt-10 flex items-center gap-5">
            {['Acessibilidade', 'Mobilidade', 'Acompanhamento'].map((pill, k) => (
              <Rv
                key={pill}
                d={0.38 + k * 0.12}
                cls="rounded-2xl bg-white border border-white/80 px-8 py-5 text-[24px] font-bold text-[#0D1830] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
              >
                {pill}
              </Rv>
            ))}
          </div>
        </div>

        {/* Lado Direito: Visualização 3D em perspectiva do tapete eletrônico real isolado */}
        <Rv d={0.25} cls="pointer-events-none absolute inset-0">
          <div
            className="absolute left-0 top-0"
            style={{
              width: 1572,
              height: 812,
              transformOrigin: '0 0',
              transform:
                'matrix3d(0.40748118, 0.10682189, 0, 0.00006766, -0.40879483, 0.28581696, 0, -0.00002166, 0, 0, 1, 0, 1264.04169528, 350.21958617, 0, 1)',
              filter: 'drop-shadow(0 35px 50px rgba(0,0,0,0.55))',
            }}
          >
            <img
              src="shots/tapete-isolado.png"
              alt="Conceito visual de acabamento do tapete BAROPRESS; não representa o equipamento final."
              className="w-full h-full block"
            />
          </div>
        </Rv>
        <Rv d={0.4} cls="absolute left-[1200px] top-[880px] text-[22px] font-medium text-white">
          Conceito de acabamento · em desenvolvimento
        </Rv>
      </>
    )

  // Cena 5 — Conheça o BAROPRESS / Apresentação do Hardware (White Editorial · Pure White)
  if (i === 4) {
    const curHw = HW_PHOTOS[hwIdx]
    return (
      <>
        {/* Cabeçalho Superior com cores em destaque */}
        <div className="absolute left-[120px] top-[70px] w-[1680px]">
          <Rv cls="font-extrabold text-[50px] leading-tight tracking-[-0.03em] text-[#0D1830]">
            {c.t}
          </Rv>
          <Rv d={0.12} cls="mt-3 text-[24px] font-medium text-[#475569] tracking-[-0.01em]">
            <span>{c.s}</span>
          </Rv>
        </div>

        {/* Lado Esquerdo: Fotografia real em grande destaque e legenda técnica */}
        <div className="absolute left-[120px] top-[235px] w-[980px]">
          <Rv
            d={0.2}
            cls="w-[980px] h-[560px] rounded-3xl overflow-hidden bg-[#EAE8E4] border-2 border-[#E2E8F0] shadow-[0_20px_45px_rgba(0,0,0,0.08)] flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={curHw.src}
                src={curHw.src}
                alt={curHw.label}
                className="w-full h-full object-contain rounded-2xl"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(3px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
                transition={{ duration: 0.28 * SP, ease: EZ_OUT }}
              />
            </AnimatePresence>
          </Rv>

          <Rv
            d={0.3}
            cls="mt-5 w-[980px] rounded-2xl bg-[#F0F5FF] border border-[#D6E4FC] px-7 py-4 text-[19.5px] leading-snug text-[#1E293B] font-medium"
          >
            <strong className="text-[#2457E7] font-bold">{curHw.id === 'produto' ? 'Conceito ilustrativo: ' : 'Bancada experimental: '}</strong>
            <span>{curHw.spec}</span>
          </Rv>
        </div>

        {/* Lado Direito: Linha do tempo e 5 etapas visuais perfeitamente centralizadas na forma */}
        <div className="absolute left-[1205px] top-[255px] w-[620px] h-[640px] flex flex-col justify-center px-2.5">
          <Rv d={0.22} cls="text-[14px] font-bold tracking-[0.14em] uppercase text-[#475569] mb-4 ml-[56px]">
            <span>ETAPAS DE DESENVOLVIMENTO</span>
          </Rv>

          <div className="relative flex flex-col gap-3">
            {/* Linha vertical conectora da linha do tempo */}
            <div className="pointer-events-none absolute left-[18px] top-[36px] bottom-[36px] w-[2.5px] bg-[#CBD5E1] z-[1]" />

            {HW_PHOTOS.map((item, idx) => {
              const active = idx === hwIdx
              return (
                <Rv key={item.id} d={0.25 + idx * 0.06} cls="relative flex items-center gap-4 z-[2]">
                  {/* Nó circular da linha do tempo */}
                  <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">
                    <div
                      className={
                        'rounded-full transition-all duration-300 ' +
                        (active
                          ? 'w-[23px] h-[23px] border-[2.5px] border-[#2457E7] bg-white flex items-center justify-center shadow-sm'
                          : 'w-[19px] h-[19px] border-[2.5px] border-[#94A3B8] bg-white')
                      }
                    >
                      {active && <div className="w-[10px] h-[10px] rounded-full bg-[#2457E7]" />}
                    </div>
                  </div>

                  {/* Cartão da etapa */}
                  <button
                    type="button"
                    onClick={() => setHwIdx(idx)}
                    className={
                      'pressable flex-1 flex items-center gap-3.5 rounded-2xl p-3 text-left border-2 transition-all duration-300 cursor-pointer ' +
                      (active
                        ? 'bg-gradient-to-r from-[#2457E7] to-[#3B82F6] border-[#2457E7] text-white shadow-[0_12px_26px_rgba(36,87,231,0.32)] translate-x-1'
                        : 'bg-[#F8FAFF] hover:bg-white border-[#E2E8F0] hover:border-[#CFDCF8] text-[#0D1830] shadow-sm')
                    }
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className="w-[68px] h-[48px] rounded-xl object-cover shrink-0 border border-black/10 bg-white"
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className={
                          'w-fit text-[10.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ' +
                          (active ? 'bg-white/25 text-white' : 'bg-[#2457E7] text-white')
                        }
                      >
                        Etapa {item.code}
                      </span>
                      <span
                        className={
                          'text-[18.5px] font-bold tracking-[-0.015em] leading-tight truncate ' +
                          (active ? 'text-white' : 'text-[#0D1830]')
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                </Rv>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  // Cena 6 — Como funciona (Midnight Tech · Midnight Navy)
  if (i === 5)
    return (
      <>
        {/* Cabeçalho: Título original preservado e subtítulo alinhado */}
        <div className="absolute left-[140px] top-[95px] w-[1640px]">
          <Rv cls="font-bold text-[66px] leading-[1.08] tracking-[-0.035em] text-white">
            <span>Como funciona</span>
          </Rv>
          <Rv d={0.12} cls="mt-3 text-[22px] font-medium text-[#94A3B8] tracking-[-0.01em]">
            <span>225 posições de leitura integradas a um sistema de aquisição e análise relativa.</span>
          </Rv>
        </div>

        {/* ======================================================== */}
        {/* BLOCO 1: CAPTURA (Matriz 15×15 · 225 Posições)           */}
        {/* O container squircle principal é o HERO(5) animado SVG  */}
        {/* ======================================================== */}
        {/* Brilho radial ambiente atrás do squircle da matriz */}
        <div className="pointer-events-none absolute left-[210px] top-[295px] w-[300px] h-[300px] rounded-full bg-[#2457E7]/20 blur-3xl z-[0]" />

        {/* Informações e Badge abaixo do Bloco 1 */}
        <div className="absolute left-[135px] top-[665px] w-[450px]">
          <Rv d={0.25} cls="flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#2457E7] text-white font-extrabold text-[17px] flex items-center justify-center shadow-[0_0_14px_rgba(36,87,231,0.6)]">
                1
              </span>
              <span className="text-[25px] font-black tracking-[0.05em] uppercase text-white">
                CAPTURA
              </span>
            </div>
            <div className="mt-4 text-[24px] font-bold text-white">Matriz experimental</div>
            <div className="text-[24px] font-extrabold text-[#38BDF8] mt-0.5">15×15 · 225 posições</div>
            <div className="text-[17px] text-[#94A3B8] font-medium mt-1.5">Multiplexação matricial</div>
          </Rv>
        </div>

        {/* ======================================================== */}
        {/* SETA DE FLUXO 1: Captura → Processamento                */}
        {/* ======================================================== */}
        <Rv d={0.32} cls="pointer-events-none absolute left-[545px] top-[425px] w-[220px] h-[40px] flex items-center justify-center z-[2]">
          <svg width="200" height="36" viewBox="0 0 200 36" className="overflow-visible">
            <defs>
              <filter id="arrowGlow1" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect x="25" y="16" width="26" height="4.5" rx="2.25" fill="#2457E7" filter="url(#arrowGlow1)" />
            <rect x="63" y="16" width="26" height="4.5" rx="2.25" fill="#2457E7" filter="url(#arrowGlow1)" />
            <rect x="101" y="16" width="26" height="4.5" rx="2.25" fill="#2563EB" filter="url(#arrowGlow1)" />
            <polygon points="138,8 162,18.25 138,28.5" fill="#38BDF8" filter="url(#arrowGlow1)" />
          </svg>
        </Rv>

        {/* ======================================================== */}
        {/* BLOCO 2: PROCESSAMENTO (ESP32 · Circuitos)               */}
        {/* ======================================================== */}
        {/* Brilho radial ambiente atrás do processador */}
        <div className="pointer-events-none absolute left-[810px] top-[295px] w-[300px] h-[300px] rounded-full bg-[#2457E7]/20 blur-3xl z-[0]" />

        {/* Ilustração rica do Chip ESP32 e barramentos */}
        <Rv d={0.38} cls="absolute left-[785px] top-[270px] w-[350px] h-[350px] flex items-center justify-center z-[2]">
          <svg width="350" height="350" viewBox="0 0 350 350" className="overflow-visible">
            <defs>
              <filter id="chipGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="chipBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#111F3E" />
                <stop offset="50%" stopColor="#0A1428" />
                <stop offset="100%" stopColor="#060C1A" />
              </linearGradient>
            </defs>

            {/* Trilhas superiores: onda quadrada digital de clock */}
            <path
              d="M 130,95 L 130,55 L 140,55 L 140,75 L 150,75 L 150,45 L 160,45 L 160,75 L 170,75 L 170,45 L 180,45 L 180,75 L 190,75 L 190,45 L 200,45 L 200,75 L 210,75 L 210,55 L 220,55 L 220,95"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <circle cx="160" cy="38" r="3" fill="#38BDF8" />
            <circle cx="190" cy="38" r="3" fill="#38BDF8" />

            {/* Trilhas esquerdas: binário 1001 e marcadores de polaridade */}
            <path
              d="M 95,125 L 65,125 L 65,110 M 95,150 L 50,150 M 95,200 L 50,200 M 95,225 L 65,225 L 65,240"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx="65" cy="110" r="3" fill="#38BDF8" />
            <circle cx="65" cy="240" r="3" fill="#38BDF8" />
            <text x="35" y="154" fill="#38BDF8" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="end">1001</text>
            <text x="75" y="112" fill="#38BDF8" fontSize="16" fontWeight="bold" textAnchor="middle">+</text>
            <text x="75" y="246" fill="#38BDF8" fontSize="18" fontWeight="bold" textAnchor="middle">-</text>

            {/* Trilhas direitas: ondas analógicas ADC de leitura relativa */}
            <path
              d="M 255,145 L 275,145 Q 285,130 295,145 T 315,145 L 330,145"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M 255,205 L 275,205 Q 285,190 295,205 T 315,205 L 330,205"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="330" cy="145" r="3.2" fill="#38BDF8" />
            <circle cx="330" cy="205" r="3.2" fill="#38BDF8" />

            {/* Trilhas inferiores para terra e barramento */}
            <path
              d="M 130,255 L 130,290 L 145,290 M 165,255 L 165,305 M 185,255 L 185,305 M 220,255 L 220,290 L 205,290"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx="145" cy="290" r="3" fill="#38BDF8" />
            <circle cx="165" cy="305" r="3" fill="#38BDF8" />
            <circle cx="185" cy="305" r="3" fill="#38BDF8" />
            <circle cx="205" cy="290" r="3" fill="#38BDF8" />

            {/* Pinos do Chip em cada quadrante */}
            {[115, 133, 151, 169, 187, 205, 223].map((pos) => (
              <g key={pos}>
                <line x1={pos} y1="84" x2={pos} y2="98" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
                <line x1={pos} y1="252" x2={pos} y2="266" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
                <line x1="84" y1={pos} x2="98" y2={pos} stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
                <line x1="252" y1={pos} x2="266" y2={pos} stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
              </g>
            ))}

            {/* Encapsulamento central do processador */}
            <rect
              x="98"
              y="98"
              width="154"
              height="154"
              rx="22"
              fill="url(#chipBodyGrad)"
              stroke="#38BDF8"
              strokeWidth="2.5"
              filter="url(#chipGlow)"
            />

            {/* Moldura metálica chanfrada */}
            <rect
              x="108"
              y="108"
              width="134"
              height="134"
              rx="16"
              fill="none"
              stroke="rgba(56,189,248,0.3)"
              strokeWidth="1.2"
            />

            {/* Núcleo do Chip com o Símbolo Baropress */}
            <circle cx="175" cy="175" r="45" fill="#0D1A35" stroke="#2457E7" strokeWidth="2.2" />

            <g transform="translate(175, 175) scale(0.68) translate(-50, -50)">
              <path
                d="M 50 12 A 38 38 0 0 1 88 50 A 38 38 0 0 1 50 88 A 38 38 0 0 1 20 74"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              <path
                d="M 50 26 A 24 24 0 0 1 74 50 A 24 24 0 0 1 50 74 A 24 24 0 0 1 32 64"
                fill="none"
                stroke="#38D8DC"
                strokeWidth="4.8"
                strokeLinecap="round"
              />
              <path
                d="M 50 40 A 10 10 0 0 1 60 50 A 10 10 0 0 1 50 60"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </Rv>

        {/* Informações e Badge abaixo do Bloco 2 */}
        <div className="absolute left-[735px] top-[665px] w-[450px]">
          <Rv d={0.44} cls="flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#2457E7] text-white font-extrabold text-[17px] flex items-center justify-center shadow-[0_0_14px_rgba(36,87,231,0.6)]">
                2
              </span>
              <span className="text-[25px] font-black tracking-[0.05em] uppercase text-white">
                PROCESSAMENTO
              </span>
            </div>
            <div className="mt-4 text-[34px] font-extrabold text-[#38BDF8] tracking-tight">ESP32</div>
            <div className="text-[17px] text-[#94A3B8] font-medium mt-2">Comunicação com o computador</div>
          </Rv>
        </div>

        {/* ======================================================== */}
        {/* SETA DE FLUXO 2: Processamento → Visualização           */}
        {/* ======================================================== */}
        <Rv d={0.48} cls="pointer-events-none absolute left-[1145px] top-[425px] w-[220px] h-[40px] flex items-center justify-center z-[2]">
          <svg width="200" height="36" viewBox="0 0 200 36" className="overflow-visible">
            <rect x="25" y="16" width="26" height="4.5" rx="2.25" fill="#2457E7" filter="url(#arrowGlow1)" />
            <rect x="63" y="16" width="26" height="4.5" rx="2.25" fill="#2457E7" filter="url(#arrowGlow1)" />
            <rect x="101" y="16" width="26" height="4.5" rx="2.25" fill="#2563EB" filter="url(#arrowGlow1)" />
            <polygon points="138,8 162,18.25 138,28.5" fill="#38BDF8" filter="url(#arrowGlow1)" />
          </svg>
        </Rv>

        {/* ======================================================== */}
        {/* BLOCO 3: VISUALIZAÇÃO (Mapa de Calor & Software)         */}
        {/* ======================================================== */}
        {/* Brilho radial ambiente atrás da janela */}
        <div className="pointer-events-none absolute left-[1395px] top-[295px] w-[310px] h-[300px] rounded-full bg-[#2457E7]/25 blur-3xl z-[0]" />

        {/* Janela do Software e Card de Exames */}
        <Rv d={0.52} cls="absolute left-[1365px] top-[270px] w-[370px] h-[350px] z-[2]">
          {/* Janela Principal */}
          <div className="relative w-[335px] h-[245px] rounded-2xl bg-[#081226] border-2 border-[#2457E7]/80 shadow-[0_15px_35px_rgba(0,0,0,0.5),0_0_30px_rgba(36,87,231,0.25)] flex flex-col overflow-hidden">
            {/* Header da Janela com 3 botões */}
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0C1A38] border-b border-[#2457E7]/40 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#93C5FD]" />
            </div>

            {/* Conteúdo da Janela: Mapa Térmico Plantar + Indicadores */}
            <div className="flex-1 flex p-3 gap-2.5 items-center justify-between">
              {/* Mapa de Calor Plantar Autêntico (Pés E e D) */}
              <div className="flex-1 h-full rounded-xl bg-[#050D1E] border border-blue-950 flex items-center justify-center p-1">
                <svg viewBox="0 0 160 140" className="w-full h-full">
                  <defs>
                    <radialGradient id="hotspotForefootL" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="40%" stopColor="#F59E0B" />
                      <stop offset="75%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <radialGradient id="hotspotHeelL" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="45%" stopColor="#F59E0B" />
                      <stop offset="80%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <radialGradient id="hotspotForefootR" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="40%" stopColor="#F59E0B" />
                      <stop offset="75%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <radialGradient id="hotspotHeelR" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="45%" stopColor="#F59E0B" />
                      <stop offset="80%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>

                  {/* Pé Esquerdo */}
                  <g transform="translate(14, 8)">
                    {/* Contorno de suporte suave / baixa intensidade */}
                    <path
                      d="M 30 6 C 45 6 48 24 46 45 C 44 60 32 72 30 86 C 28 102 40 118 30 122 C 16 122 12 102 12 86 C 12 70 10 54 14 34 C 18 16 18 6 30 6 Z"
                      fill="#0369A1"
                      opacity="0.35"
                    />
                    {/* Antepé / Metatarso */}
                    <ellipse cx="30" cy="38" rx="17" ry="15" fill="url(#hotspotForefootL)" />
                    {/* Hálux e artelhos */}
                    <circle cx="37" cy="13" r="6" fill="#10B981" />
                    <circle cx="37" cy="13" r="3.5" fill="#F59E0B" />
                    <circle cx="28" cy="11" r="3.2" fill="#06B6D4" />
                    <circle cx="21" cy="13" r="2.8" fill="#06B6D4" />
                    {/* Calcanhar */}
                    <ellipse cx="26" cy="102" rx="13" ry="13" fill="url(#hotspotHeelL)" />
                  </g>

                  {/* Pé Direito */}
                  <g transform="translate(86, 8)">
                    {/* Contorno de suporte */}
                    <path
                      d="M 26 6 C 38 6 38 16 42 34 C 46 54 44 70 44 86 C 44 102 40 122 26 122 C 16 118 28 102 26 86 C 24 72 12 60 10 45 C 8 24 11 6 26 6 Z"
                      fill="#0369A1"
                      opacity="0.35"
                    />
                    {/* Antepé / Metatarso */}
                    <ellipse cx="26" cy="38" rx="17" ry="15" fill="url(#hotspotForefootR)" />
                    {/* Hálux e artelhos */}
                    <circle cx="19" cy="13" r="6" fill="#10B981" />
                    <circle cx="19" cy="13" r="3.5" fill="#F59E0B" />
                    <circle cx="28" cy="11" r="3.2" fill="#06B6D4" />
                    <circle cx="35" cy="13" r="2.8" fill="#06B6D4" />
                    {/* Calcanhar */}
                    <ellipse cx="30" cy="102" rx="13" ry="13" fill="url(#hotspotHeelR)" />
                  </g>
                </svg>
              </div>

              {/* Painel lateral de métricas / escala térmica */}
              <div className="w-[85px] h-full flex flex-col justify-between py-1">
                {/* Escala Térmica */}
                <div className="w-full h-[55px] rounded-lg bg-gradient-to-t from-[#2563EB] via-[#10B981] via-[#F59E0B] to-[#EF4444] p-0.5 border border-blue-900 shadow-inner flex flex-col justify-between px-1.5 py-1 text-[8px] font-bold text-white/90">
                  <span>MAX</span>
                  <span className="self-end">REL</span>
                </div>
                {/* Barras de Indicadores */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="w-full h-2 rounded bg-[#102A54] overflow-hidden">
                    <div className="w-[75%] h-full bg-[#38BDF8]" />
                  </div>
                  <div className="w-full h-2 rounded bg-[#102A54] overflow-hidden">
                    <div className="w-[58%] h-full bg-[#2457E7]" />
                  </div>
                  <div className="w-full h-2 rounded bg-[#102A54] overflow-hidden">
                    <div className="w-[84%] h-full bg-[#10B981]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Flutuante de Registros e Prontuário sobreposto no canto inferior direito */}
          <div className="absolute -bottom-2 right-0 w-[155px] h-[115px] rounded-xl bg-[#0A162E]/95 backdrop-blur-md border border-[#38BDF8]/70 shadow-[0_12px_28px_rgba(0,0,0,0.65)] p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-2 rounded bg-[#15294E] flex items-center px-1">
                <div className="w-2.5 h-1 bg-[#38BDF8] rounded-sm" />
              </div>
              <div className="w-[85%] h-2 rounded bg-[#15294E] flex items-center px-1">
                <div className="w-2.5 h-1 bg-[#38BDF8] rounded-sm" />
              </div>
              <div className="w-full h-2 rounded bg-[#15294E] flex items-center px-1">
                <div className="w-2.5 h-1 bg-[#38BDF8] rounded-sm" />
              </div>
              <div className="w-[70%] h-2 rounded bg-[#15294E] flex items-center px-1">
                <div className="w-2.5 h-1 bg-[#38BDF8] rounded-sm" />
              </div>
            </div>
          </div>
        </Rv>

        {/* Informações e Badge abaixo do Bloco 3 */}
        <div className="absolute left-[1325px] top-[665px] w-[450px]">
          <Rv d={0.58} cls="flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#2457E7] text-white font-extrabold text-[17px] flex items-center justify-center shadow-[0_0_14px_rgba(36,87,231,0.6)]">
                3
              </span>
              <span className="text-[25px] font-black tracking-[0.05em] uppercase text-white">
                VISUALIZAÇÃO
              </span>
            </div>
            <div className="mt-4 text-[26px] font-extrabold text-white tracking-wide">MAPA DE CALOR</div>
            <div className="text-[17px] text-[#94A3B8] font-medium mt-2">Sinais ADC relativos e registros · diagrama ilustrativo</div>
          </Rv>
        </div>
      </>
    )

  // Cena 7 — O software real (White Editorial · Pure White)
  if (i === 6) {
    const meta = SHOT_META[tab] ?? SHOT_META['Mapa']
    return (
      <>
        {/* Cabeçalho Superior: Título, Subtítulo e Seletor com as 3 abas oficiais */}
        <div className="absolute left-[160px] right-[160px] top-[75px] flex items-center justify-between z-[4]">
          <div>
            <Rv cls="font-bold text-[48px] leading-[1.1] tracking-[-0.03em] text-[#0D1830]">
              <span>Do exame ao histórico. Tudo em um único sistema.</span>
            </Rv>
            <Rv d={0.12} cls="mt-2 text-[22px] font-medium text-[#475569] tracking-[-0.01em]">
              <span>Aquisição, visualização, registros e relatórios integrados ao fluxo do profissional.</span>
            </Rv>
          </div>
          <div className="flex gap-2.5 bg-white/95 p-1.5 rounded-full border border-[#CFDCF8] shadow-sm shrink-0">
            {['Mapa', 'Indicadores', 'Histórico'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={
                  'pressable rounded-full px-7 py-2.5 text-[20px] font-semibold transition-all duration-300 cursor-pointer ' +
                  (tab === k
                    ? 'bg-[#2457E7] text-white shadow-md'
                    : 'bg-transparent text-[#0D1830] hover:bg-[#F5F8FF]')
                }
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Janela do Software Centralizada na Grande Moldura da Cena */}
        <Shot
          src={SHOTS[tab]}
          title={`BAROPRESS Desktop — ${meta.title}`}
          tag={meta.tag}
          h={650}
          pos="left-[240px] top-[235px] w-[1440px]"
        />
      </>
    )
  }

  // Cena 8 — Evolução / Comparação Longitudinal (White Editorial · Ice White)
  if (i === 7)
    return (
      <>
        {/* Cabeçalho: Título original preservado e novo subtítulo de acompanhamento */}
        <div className="absolute left-[160px] right-[160px] top-[75px] z-[4]">
          <Rv cls="font-bold text-[48px] leading-[1.1] tracking-[-0.03em] text-[#0D1830]">
            <span>{c.t}</span>
          </Rv>
          <Rv d={0.12} cls="mt-2 text-[22px] font-medium text-[#475569] tracking-[-0.01em]">
            <span>{c.s}</span>
          </Rv>
        </div>

        {/* Janela Oficial do Módulo de Comparação Centralizada na Forma */}
        <Shot
          src={SHOTS['Comparação']}
          title="BAROPRESS Desktop — Comparação Longitudinal (Exames #2, #3, #4 e #9)"
          tag="Comparação de sinais · sem inferência clínica"
          h={650}
          pos="left-[240px] top-[235px] w-[1440px]"
        />
      </>
    )

  // Cena 9 — Do mapa ao relatório (Electric Blue · A4 Protagonista)
  if (i === 8)
    return (
      <>
        {/* Lado Esquerdo: Título, Benefício e os 3 Tópicos de Fluxo */}
        <div className="absolute left-[140px] top-[180px] w-[760px]">
          <Rv cls="font-bold text-[72px] leading-[1.08] tracking-[-0.035em] text-white">
            <span>Informação que vai</span>
            <br />
            <span>além da tela.</span>
          </Rv>

          <Rv d={0.16} cls="mt-8 text-[25px] leading-[1.38] font-medium text-white/90 max-w-[700px] tracking-[-0.015em]">
            <span>Organize os resultados em relatórios exportáveis e consulte os registros quando necessário.</span>
          </Rv>

          {/* 3 Tópicos de Palavras em Substituição ao Card Extenso */}
          <div className="mt-14 flex items-center gap-4">
            <Rv d={0.3} cls="rounded-2xl bg-white border border-white/80 px-7 py-4 text-[23px] font-extrabold text-[#0D1830] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              MAPA
            </Rv>
            <span className="text-[30px] font-black text-white/75">›</span>
            <Rv d={0.38} cls="rounded-2xl bg-white border border-white/80 px-7 py-4 text-[23px] font-extrabold text-[#0D1830] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              Relatório
            </Rv>
            <span className="text-[30px] font-black text-white/75">›</span>
            <Rv d={0.46} cls="rounded-2xl bg-white border border-white/80 px-7 py-4 text-[23px] font-extrabold text-[#0D1830] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              Exportação PDF
            </Rv>
          </div>
        </div>

        {/* Lado Direito: Prévia Oficial A4 Ampliada e com Máximo Protagonismo */}
        <Shot
          src="shots/relatorio-a4.png"
          title="BAROPRESS Desktop — Trecho do relatório de sinais"
          tag="Identificação ocultada · captura parcial"
          h={860}
          pos="left-[975px] top-[110px] w-[760px]"
          darkBg={false}
        />
      </>
    )

  // Cena 10 — Reformulação Comercial (White Editorial · Pure White)
  if (i === 9)
    return (
      <>
        {/* Cabeçalho Comercial */}
        <div className="absolute left-[120px] top-[75px] w-[1680px]">
          <Rv cls="font-bold text-[62px] leading-[1.08] tracking-[-0.035em] text-[#0D1830]">
            <span>{c.t}</span>
          </Rv>
          <Rv d={0.14} cls="mt-4 text-[28px] leading-[1.38] text-[#475569]">
            <span>{c.s}</span>
          </Rv>
        </div>

        {/* Dois Painéis Principais de Comparação Comercial */}
        <div className="absolute left-[120px] top-[255px] w-[1680px] flex gap-10">
          {/* PAINEL 1: REFERÊNCIA DE MERCADO (Fundo Ice White, Texto Midnight Navy) */}
          <Rv
            d={0.24}
            cls="w-[820px] h-[675px] rounded-[32px] bg-[#F8FAFC] border-2 border-[#DCE7FC] p-[56px] flex flex-col text-[#0D1830]"
          >
            {/* Título do Produto */}
            <div>
              <h3 className="text-[44px] font-bold tracking-[-0.025em]">BaroScan</h3>
              <p className="mt-2 text-[26px] text-[#475569]">Referência de mercado</p>
            </div>

            {/* Bloco de Preço Comercial Anunciado */}
            <div className="mt-[48px]">
              <div className="text-[24px] text-[#475569]">Preço anunciado</div>
              <div className="mt-3 flex items-baseline gap-4 whitespace-nowrap">
                <span className="text-[34px] font-medium">R$</span>
                <span className="text-[92px] leading-none font-bold tracking-[-0.035em] tabular-nums">24.961,25</span>
              </div>
              {/* Barras com a mesma escala de preço: BaroScan é a referência de 100% */}
              <div role="img" aria-label="Preço BaroScan: R$ 24.961,25, barra de referência completa" className="mt-8 h-[36px] w-[704px] rounded-full bg-[#DCE7FC] overflow-hidden">
                <motion.div
                  className="h-full w-full origin-left rounded-full bg-[#0D1830]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7 * SP, delay: 0.3 * SP, ease: EZ_OUT }}
                />
              </div>
            </div>


          </Rv>

          {/* PAINEL 2: BAROPRESS (Fundo Electric Blue, Texto Branco) */}
          <Rv
            d={0.34}
            cls="w-[820px] h-[675px] rounded-[32px] bg-[#2457E7] p-[56px] flex flex-col text-white shadow-[0_24px_50px_-10px_rgba(36,87,231,0.25)]"
          >
            {/* Título do Produto */}
            <div>
              <h3 className="text-[44px] font-bold tracking-[-0.025em]">BAROPRESS</h3>
              <p className="mt-2 text-[26px] text-white/90">Tapete + software</p>
            </div>

            {/* Preço-Alvo Comercial */}
            <div className="mt-[48px]">
              <div className="text-[24px] text-white/90">Preço-alvo hipotético</div>
              <div className="mt-3 flex items-baseline gap-4 whitespace-nowrap">
                <span className="text-[34px] font-medium">R$</span>
                <span className="text-[92px] leading-none font-bold tracking-[-0.035em] tabular-nums">2.990</span>
              </div>
              {/* Comprimento proporcional ao valor de venda, na mesma escala da referência */}
              <div role="img" aria-label="Preço-alvo hipotético BAROPRESS: R$ 2.990; comparação somente de valores, sem equivalência de desempenho" className="mt-8 h-[36px] w-[704px] rounded-full bg-white/15 overflow-hidden">
                <motion.div
                  className="h-full origin-left rounded-full bg-[#38D8DC]"
                  style={{ width: `${(2990 / 24961.25) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7 * SP, delay: 0.4 * SP, ease: EZ_OUT }}
                />
              </div>
            </div>

            {/* Custo e margem considerando apenas os materiais por unidade */}
            <div className="mt-auto border-t border-white/30 pt-6">
              <dl className="grid grid-cols-2 gap-8">
                <div>
                  <dt className="text-[22px] text-white/90">Materiais de bancada</dt>
                  <dd className="mt-1 text-[36px] leading-tight font-semibold tabular-nums">≈ R$ 500</dd>
                </div>
                <div>
                  <dt className="text-[22px] text-white/90">Próxima etapa</dt>
                  <dd className="mt-1 text-[30px] leading-tight font-semibold">Validar viabilidade</dd>
                </div>
              </dl>
              <p className="mt-3 text-[20px] leading-[1.35] text-white/90">
                Estimativa preliminar; não é custo fabril completo nem lucro validado.
              </p>
            </div>


          </Rv>
        </div>

        {/* Fonte do valor de referência */}
        <div className="absolute left-[120px] top-[956px] w-[1680px]">
          <Rv d={0.4} cls="text-[20px] leading-[1.4] text-[#475569]">
            <span>Podotech · podotech.com.br/baroscan · consulta em 06/11/2026. Comparação de valores, sem equivalência técnica ou clínica.</span>
          </Rv>
        </div>
      </>
    )

  if (i === 11)
    return (
      <>
        <div className="absolute left-[120px] top-[140px] w-[860px]">
          <Rv cls="font-bold text-[72px] leading-[1.08] tracking-[-0.035em] text-[#0D1830]">
            {c.t}
          </Rv>
          <Rv d={0.16} cls="mt-7 max-w-[760px] text-[28px] leading-[1.4] text-[#17243A]">
            {c.s}
          </Rv>
          <Rv d={0.3} cls="mt-9 text-[30px] font-semibold text-[#2457E7]">
            Ensaios de bancada, sem pacientes.
          </Rv>
          <Rv d={0.4} cls="mt-4 max-w-[760px] text-[25px] leading-[1.4] text-[#17243A]">
            O protótipo respondeu à aplicação de cargas. A calibração candidata não atingiu o critério adotado; a aplicação clínica depende de validação.
          </Rv>
          <Rv d={0.5} cls="mt-7 max-w-[820px] text-[25px] leading-[1.4] text-[#2457E7]">
            <p className="font-semibold">{ARTICLE.editorialStatus}</p>
            <p className="mt-2 text-[21px] text-[#475569]">{ARTICLE.editorialDetail}</p>
          </Rv>
          <Rv d={0.6} cls="mt-7 max-w-[820px] text-[20px] leading-[1.4] text-[#475569]">
            <p>{ARTICLE.title}</p>
            <p className="mt-2">{ARTICLE.reference} · Aceite editorial não comprova validação clínica.</p>
          </Rv>
        </div>
        <Rv d={0.2} cls="absolute left-[1160px] top-[150px] w-[540px]">
          <img
            src={ARTICLE.image}
            alt="Primeira página do artigo BAROPRESS, com título, resumo e resultados preliminares dos ensaios de bancada."
            width={1200}
            height={1697}
            className="block w-full h-auto rounded-[4px] shadow-[0_24px_55px_-12px_rgba(13,24,48,0.3)]"
          />
        </Rv>
      </>
    )

  return T(300, 84)
}

const sceneIndexFromHash = (hash: string) =>
  Math.max(0, Math.min(S.length - 1, (parseInt(hash.slice(2)) || 1) - 1))

export default function App() {
  const rm = useReducedMotion()
  const [i, setI] = useState(() => sceneIndexFromHash(location.hash))
  const [ph, setPh] = useState(0)
  const [tab, setTab] = useState('Mapa')
  const [hwIdx, setHwIdx] = useState(0)
  const [evoReal, setEvoReal] = useState(false)
  const [pres, setPres] = useState(false)
  const presenterRef = useRef<HTMLElement>(null)
  const [presenterHeight, setPresenterHeight] = useState(0)
  const [sp, setSp] = useState(1)
  const [t0, setT0] = useState(Date.now())
  const [now, setNow] = useState(Date.now())
  const [sc, setSc] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [isHoveringNav, setIsHoveringNav] = useState(false)

  const curTheme = SLIDE_THEMES[i] ?? SLIDE_THEMES[0]

  SP = rm ? 0.01 : sp
  const go = (n: number) => {
    setI(Math.max(0, Math.min(S.length - 1, n)))
    setIsNavVisible(true)
  }

  useEffect(() => {
    const t = setTimeout(() => setPh(1), 420)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    history.replaceState(null, '', '#s' + (i + 1))
  }, [i])

  useEffect(() => {
    const onHash = () => {
      const n = sceneIndexFromHash(location.hash)
      setI(n)
      history.replaceState(null, '', '#s' + (n + 1))
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  // Avanço automático das etapas do hardware a cada 2.5s no Slide 5
  useEffect(() => {
    if (i !== 4) return
    const timer = setInterval(() => {
      setHwIdx((prev) => (prev + 1) % HW_PHOTOS.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [i, hwIdx])

  // Reset para Etapa A ao navegar para o Slide 5
  useEffect(() => {
    if (i === 4) setHwIdx(0)
  }, [i])

  // Avanço automático das abas do software a cada 3s no Slide 7 (Mapa -> Indicadores -> Histórico)
  useEffect(() => {
    if (i !== 6) return
    const softwareTabs = ['Mapa', 'Indicadores', 'Histórico']
    const timer = setInterval(() => {
      setTab((prev) => {
        const nextIdx = (softwareTabs.indexOf(prev) + 1) % softwareTabs.length
        return softwareTabs[nextIdx]
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [i, tab])

  // Reset para 'Mapa' ao navegar para o Slide 7
  useEffect(() => {
    if (i === 6) setTab('Mapa')
  }, [i])

  // Atalhos de teclado preservados e estendidos
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (e.key !== 'Escape' && e.target instanceof HTMLElement && e.target.closest('button, input, select, textarea, a, [contenteditable], [role="tab"], [role="region"]'))) return
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        go(i + 1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go(i - 1)
      } else if (e.key === 'f' || e.key === 'F') {
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen()
      } else if (e.key === 'p' || e.key === 'P') {
        setPres((p) => !p)
      } else if (e.key === 'Escape') {
        if (pres) {
          setPres(false)
        } else if (evoReal) {
          setEvoReal(false)
        }
      }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [i, pres, evoReal])

  useEffect(() => {
    const panel = presenterRef.current
    if (!panel) {
      setPresenterHeight(0)
      return
    }
    const observer = new ResizeObserver(() => setPresenterHeight(panel.getBoundingClientRect().height))
    observer.observe(panel)
    return () => observer.disconnect()
  }, [pres])

  // Ajuste de escala e enquadramento 16:9 rigoroso com margens de segurança
  useEffect(() => {
    const updateDimensions = () => {
      const isFs = Boolean(document.fullscreenElement)
      setIsFullscreen(isFs)

      const bottomBuffer = isFs ? 0 : 54
      const presBuffer = pres ? presenterHeight : 0
      const availH = Math.max(1, window.innerHeight - bottomBuffer - presBuffer)
      const availW = window.innerWidth
      const s = Math.min(availW / 1920, availH / 1080)
      setSc(Math.max(0.2, s))
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    document.addEventListener('fullscreenchange', updateDimensions)
    const t = setInterval(() => setNow(Date.now()), 500)

    return () => {
      window.removeEventListener('resize', updateDimensions)
      document.removeEventListener('fullscreenchange', updateDimensions)
      clearInterval(t)
    }
  }, [pres, presenterHeight])

  // Em tela cheia: esconde a barra automaticamente após inatividade
  useEffect(() => {
    if (!isFullscreen) {
      setIsNavVisible(true)
      return
    }

    const timer = setTimeout(() => {
      if (!isHoveringNav) {
        setIsNavVisible(false)
      }
    }, 2400)

    return () => clearTimeout(timer)
  }, [isFullscreen, i, isHoveringNav])

  // Detecção de aproximação do cursor da base da tela em fullscreen
  useEffect(() => {
    if (!isFullscreen) return

    const onMouseMove = (e: MouseEvent) => {
      const nearBottom = e.clientY >= window.innerHeight - 70
      if (nearBottom) {
        setIsNavVisible(true)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [isFullscreen])

  const h = HERO(i, ph, evoReal)
  const el = Math.floor((now - t0) / 1000)
  const tr = { duration: 1.1 * SP, ease: EZ_MOVE }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#070D18] overflow-hidden select-none" style={{ paddingBottom: pres ? presenterHeight : 0 }}>
      {/* Palco 16:9 perfeitamente centralizado com escala proporcional e fundo temático do slide */}
      <div
        className="relative overflow-hidden shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] shrink-0 transition-colors duration-200 ease-out"
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${sc})`,
          transformOrigin: 'center center',
          backgroundColor: curTheme.stageBg,
        }}
      >
        <svg className="pointer-events-none absolute inset-0 z-[1]" width="1920" height="1080">
          <motion.path
            animate={{ d: h.d, fill: h.f, stroke: h.st }}
            transition={tr}
            strokeWidth={3}
            style={{ filter: 'drop-shadow(0 28px 38px rgba(36,87,231,0.2))' }}
          />
        </svg>

        <Grid g={h.a} />
        <Grid g={h.b ?? { ...h.a, m: 'off' }} alt />

        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="absolute inset-0 z-[3]"
            exit={{ opacity: 0, filter: 'blur(3px)' }}
            transition={{ duration: 0.18 * SP, ease: EZ_OUT }}
          >
            <Scene
              i={i}
              theme={curTheme}
              tab={tab}
              setTab={setTab}
              hwIdx={hwIdx}
              setHwIdx={setHwIdx}
              evoReal={evoReal}
              setEvoReal={setEvoReal}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de navegação inferior flutuante com auto-hide em fullscreen e estilo adaptativo */}
      <nav
        aria-label="Controles da apresentação"
        style={{ bottom: (pres ? presenterHeight : 0) + 12 }}
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        className={
          'fixed left-1/2 -translate-x-1/2 bottom-3 z-20 flex gap-2.5 items-center rounded-full px-4 py-2 transition-all duration-300 text-sm shadow-xl backdrop-blur-md ' +
          (curTheme.variant === 'midnight-tech'
            ? 'bg-[#17243A]/95 border border-[#2B3F63] text-white '
            : 'bg-white/95 border border-[#CFDCF8] text-[#0D1830] ') +
          (isFullscreen
            ? isNavVisible || isHoveringNav
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
            : 'opacity-85 hover:opacity-100 focus-within:opacity-100 translate-y-0')
        }
      >
        <button
          type="button"
          aria-label="Cena anterior (Seta esquerda)"
          onClick={() => go(i - 1)}
          className={`pressable px-2 py-1 rounded-full font-bold focus-visible:ring-2 focus-visible:ring-[#2457E7] ${
            curTheme.variant === 'midnight-tech' ? 'text-slate-200 hover:bg-slate-800' : 'text-[#0D1830] hover:bg-[#F5F8FF]'
          }`}
        >
          ←
        </button>
        {S.map((scItem, k) => {
          const active = k === i
          const activeDot =
            curTheme.variant === 'midnight-tech'
              ? 'bg-[#38D8DC]'
              : 'bg-[#2457E7]'
          const inactiveDot =
            curTheme.variant === 'midnight-tech'
              ? 'bg-slate-700 hover:bg-slate-500'
              : 'bg-[#CFDCF8] hover:bg-[#93C5FD]'

          return (
            <button
              key={k}
              type="button"
              aria-label={`Cena ${k + 1}: ${scItem.t}`}
              onClick={() => go(k)}
              className={
                'pressable h-2.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-[#2457E7] ' +
                (active ? `w-7 ${activeDot}` : `w-2.5 ${inactiveDot}`)
              }
            />
          )
        })}
        <button
          type="button"
          aria-label="Próxima cena (Seta direita)"
          onClick={() => go(i + 1)}
          className={`pressable px-2 py-1 rounded-full font-bold focus-visible:ring-2 focus-visible:ring-[#2457E7] ${
            curTheme.variant === 'midnight-tech' ? 'text-slate-200 hover:bg-slate-800' : 'text-[#0D1830] hover:bg-[#F5F8FF]'
          }`}
        >
          →
        </button>
        <span
          className={`h-4 w-[1px] mx-1 ${
            curTheme.variant === 'midnight-tech' ? 'bg-slate-700' : 'bg-[#DCE7FC]'
          }`}
        />
        <button
          type="button"
          aria-label="Alternar modo tela cheia (Atalho: F)"
          onClick={() =>
            document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen()
          }
          className={`pressable px-2.5 py-1 rounded-full font-medium focus-visible:ring-2 focus-visible:ring-[#2457E7] ${
            curTheme.variant === 'midnight-tech' ? 'text-slate-200 hover:bg-slate-800' : 'text-[#0D1830] hover:bg-[#F5F8FF]'
          }`}
        >
          {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        </button>
        <button
          type="button"
          aria-label="Alternar modo apresentador (Atalho: P)"
          onClick={() => setPres(!pres)}
          className={
            'pressable px-2.5 py-1 rounded-full font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#2457E7] ' +
            (pres
              ? 'bg-[#2457E7] text-white shadow-sm'
              : curTheme.variant === 'midnight-tech'
                ? 'text-slate-200 hover:bg-slate-800'
                : 'text-[#0D1830] hover:bg-[#F5F8FF]')
          }
        >
          Apresentador
        </button>
        <select
          aria-label="Velocidade das animações"
          value={sp}
          onChange={(e) => setSp(+e.target.value)}
          className={`rounded-full border px-2.5 py-1 font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2457E7] ${
            curTheme.variant === 'midnight-tech'
              ? 'bg-[#0D1830] border-slate-700 text-slate-200'
              : 'bg-[#F5F8FF] border-[#CFDCF8] text-[#0D1830]'
          }`}
        >
          <option value={1.6}>Lento</option>
          <option value={1}>Normal</option>
          <option value={0.5}>Rápido</option>
        </select>
      </nav>

      {/* Painel do Apresentador com fechamento explícito e acessível */}
      {pres && (
        <aside
          ref={presenterRef}
          role="region"
          aria-label="Painel de notas e cronômetro do apresentador"
          className="fixed inset-x-0 bottom-0 z-30 bg-[#0D1830] text-white px-8 py-3.5 flex items-center justify-between border-t border-slate-800 shadow-2xl backdrop-blur-md"
        >
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <button
              type="button"
              title="Clique para zerar o cronômetro"
              aria-label="Zerar cronômetro da apresentação"
              className="pressable shrink-0 tabular-nums text-3xl font-bold text-[#38D8DC] hover:text-[#5eead4] transition focus-visible:ring-2 focus-visible:ring-[#38D8DC]"
              onClick={() => setT0(Date.now())}
            >
              {String(Math.floor(el / 60)).padStart(2, '0')}:{String(el % 60).padStart(2, '0')}
            </button>
            <span role="region" aria-label="Notas da cena atual" tabIndex={0} className="max-h-[140px] overflow-y-auto text-lg text-slate-200">
              <strong className="text-white tabular-nums">
                Cena {i + 1}/{S.length}
              </strong>{' '}
              — {S[i].n}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPres(false)}
            aria-label="Fechar painel do apresentador"
            title="Fechar apresentador (P ou Esc)"
            className="pressable ml-6 flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          >
            <span>✕</span>
            <span>Fechar</span>
          </button>
        </aside>
      )}
    </div>
  )
}
