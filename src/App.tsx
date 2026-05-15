import { useEffect, useMemo, useState } from 'react'
import logo from './assets/logo.svg'

type Locale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'fr' | 'de' | 'es' | 'it' | 'pt'
type OS = 'Windows' | 'macOS' | 'Linux'
type TerminalKey = 'windows_terminal' | 'alacritty' | 'wezterm' | 'warp' | 'iterm2' | 'foot'

type LocalizedText = { en: string } & Partial<Record<Locale, string>>

interface InstallConfig {
  command?: string
  url: string
  note?: LocalizedText
}

interface TerminalDetail {
  name: string
  description: LocalizedText
  features: LocalizedText[]
  install: Partial<Record<OS, InstallConfig>>
}

interface QuestionOption {
  text: LocalizedText
  scores: Partial<Record<TerminalKey, number>>
  os?: OS
}

interface Question {
  id: number
  text: LocalizedText
  isOSQuestion?: boolean
  options: QuestionOption[]
}

const LOCALE_OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh-CN', label: '中文' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
]

const TERMINAL_KEYS: TerminalKey[] = ['windows_terminal', 'alacritty', 'wezterm', 'warp', 'iterm2', 'foot']

const createInitialScores = (): Record<TerminalKey, number> =>
  TERMINAL_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<TerminalKey, number>)

const tr = (text: LocalizedText, locale: Locale) => text[locale] ?? text.en
const APP_VERSION = __APP_VERSION__
const SOURCE_URL = (import.meta.env.VITE_SOURCE_URL ?? '').trim()

const detectLocale = (): Locale => {
  const raw = navigator.language.toLowerCase()
  if (raw.startsWith('ja')) return 'ja'
  if (raw.startsWith('ko')) return 'ko'
  if (raw.startsWith('zh')) return 'zh-CN'
  if (raw.startsWith('fr')) return 'fr'
  if (raw.startsWith('de')) return 'de'
  if (raw.startsWith('es')) return 'es'
  if (raw.startsWith('it')) return 'it'
  if (raw.startsWith('pt')) return 'pt'
  return 'en'
}

const UI_TEXT: Record<
  Locale,
  {
    appName: string
    heading: string
    subtitle: string
    questionLabel: string
    completedLabel: string
    selectedOSFallback: string
    languageLabel: string
    recommended: string
    keyFeatures: string
    installFor: string
    copyCommand: string
    copied: string
    copyFailed: string
    noInstallCommand: string
    officialSite: string
    previousQuestion: string
    retry: string
  }
> = {
  en: {
    appName: 'Terminal Emulator Selector',
    heading: 'Find the best terminal for your workflow',
    subtitle: 'Answer 7 quick questions and get one recommendation tailored to you.',
    questionLabel: 'Question',
    completedLabel: 'Diagnosis complete.',
    selectedOSFallback: 'selected OS',
    languageLabel: 'Language',
    recommended: 'Recommended',
    keyFeatures: 'Key Features',
    installFor: 'Install for',
    copyCommand: 'Copy command',
    copied: 'Copied!',
    copyFailed: 'Copy failed. Please copy the command manually.',
    noInstallCommand: 'No install command is available for this OS.',
    officialSite: 'Open official site',
    previousQuestion: 'Previous question',
    retry: 'Start over',
  },
  ja: {
    appName: 'Terminal Emulator Selector',
    heading: 'あなたに最適なターミナルを診断します',
    subtitle: '7つの質問に答えるだけで、ワークフローに合う1本を提案します。',
    questionLabel: '質問',
    completedLabel: '診断完了。',
    selectedOSFallback: '選択したOS',
    languageLabel: '言語',
    recommended: 'おすすめ',
    keyFeatures: '主な特徴',
    installFor: 'インストール',
    copyCommand: 'コマンドをコピー',
    copied: 'コピーしました',
    copyFailed: 'コピーに失敗しました。手動でコピーしてください。',
    noInstallCommand: 'このOS向けのコマンドは提供されていません。',
    officialSite: '公式サイトを見る',
    previousQuestion: '前の質問に戻る',
    retry: 'もう一度診断する',
  },
  ko: {
    appName: '터미널 에뮬레이터 추천기',
    heading: '워크플로에 맞는 터미널을 찾아보세요',
    subtitle: '7개의 질문에 답하면 당신에게 맞는 터미널 하나를 추천합니다.',
    questionLabel: '질문',
    completedLabel: '진단 완료.',
    selectedOSFallback: '선택한 OS',
    languageLabel: '언어',
    recommended: '추천',
    keyFeatures: '주요 기능',
    installFor: '설치 대상',
    copyCommand: '명령어 복사',
    copied: '복사되었습니다!',
    copyFailed: '복사에 실패했습니다. 수동으로 복사해 주세요.',
    noInstallCommand: '이 OS용 설치 명령어가 없습니다.',
    officialSite: '공식 사이트 열기',
    previousQuestion: '이전 질문',
    retry: '다시 시작',
  },
  'zh-CN': {
    appName: '终端模拟器推荐器',
    heading: '为你的工作流找到最合适的终端',
    subtitle: '回答 7 个简短问题，获得一个最适合你的推荐。',
    questionLabel: '问题',
    completedLabel: '诊断完成。',
    selectedOSFallback: '所选操作系统',
    languageLabel: '语言',
    recommended: '推荐',
    keyFeatures: '主要特性',
    installFor: '安装到',
    copyCommand: '复制命令',
    copied: '已复制！',
    copyFailed: '复制失败，请手动复制命令。',
    noInstallCommand: '该操作系统暂无可用安装命令。',
    officialSite: '打开官网',
    previousQuestion: '上一题',
    retry: '重新开始',
  },
  fr: {
    appName: 'Sélecteur de terminal',
    heading: 'Trouvez le meilleur terminal pour votre workflow',
    subtitle: 'Répondez à 7 questions rapides et obtenez une recommandation adaptée.',
    questionLabel: 'Question',
    completedLabel: 'Diagnostic terminé.',
    selectedOSFallback: 'OS sélectionné',
    languageLabel: 'Langue',
    recommended: 'Recommandé',
    keyFeatures: 'Fonctionnalités clés',
    installFor: 'Installer pour',
    copyCommand: 'Copier la commande',
    copied: 'Copié !',
    copyFailed: 'Échec de la copie. Veuillez copier manuellement.',
    noInstallCommand: "Aucune commande d'installation pour cet OS.",
    officialSite: 'Ouvrir le site officiel',
    previousQuestion: 'Question précédente',
    retry: 'Recommencer',
  },
  de: {
    appName: 'Terminal-Auswahl',
    heading: 'Finde das beste Terminal für deinen Workflow',
    subtitle: 'Beantworte 7 kurze Fragen und erhalte eine passende Empfehlung.',
    questionLabel: 'Frage',
    completedLabel: 'Analyse abgeschlossen.',
    selectedOSFallback: 'ausgewähltes OS',
    languageLabel: 'Sprache',
    recommended: 'Empfohlen',
    keyFeatures: 'Hauptfunktionen',
    installFor: 'Installieren für',
    copyCommand: 'Befehl kopieren',
    copied: 'Kopiert!',
    copyFailed: 'Kopieren fehlgeschlagen. Bitte manuell kopieren.',
    noInstallCommand: 'Für dieses OS ist kein Installationsbefehl verfügbar.',
    officialSite: 'Offizielle Seite öffnen',
    previousQuestion: 'Vorherige Frage',
    retry: 'Neu starten',
  },
  es: {
    appName: 'Selector de terminal',
    heading: 'Encuentra el mejor terminal para tu flujo de trabajo',
    subtitle: 'Responde 7 preguntas rápidas y obtén una recomendación a medida.',
    questionLabel: 'Pregunta',
    completedLabel: 'Diagnóstico completado.',
    selectedOSFallback: 'SO seleccionado',
    languageLabel: 'Idioma',
    recommended: 'Recomendado',
    keyFeatures: 'Características clave',
    installFor: 'Instalar para',
    copyCommand: 'Copiar comando',
    copied: '¡Copiado!',
    copyFailed: 'Error al copiar. Copia el comando manualmente.',
    noInstallCommand: 'No hay comando de instalación para este SO.',
    officialSite: 'Abrir sitio oficial',
    previousQuestion: 'Pregunta anterior',
    retry: 'Empezar de nuevo',
  },
  it: {
    appName: 'Selettore terminale',
    heading: 'Trova il terminale migliore per il tuo flusso di lavoro',
    subtitle: 'Rispondi a 7 domande rapide e ottieni una raccomandazione su misura.',
    questionLabel: 'Domanda',
    completedLabel: 'Diagnosi completata.',
    selectedOSFallback: 'OS selezionato',
    languageLabel: 'Lingua',
    recommended: 'Consigliato',
    keyFeatures: 'Funzionalità principali',
    installFor: 'Installa per',
    copyCommand: 'Copia comando',
    copied: 'Copiato!',
    copyFailed: 'Copia non riuscita. Copia il comando manualmente.',
    noInstallCommand: "Nessun comando d'installazione disponibile per questo OS.",
    officialSite: 'Apri sito ufficiale',
    previousQuestion: 'Domanda precedente',
    retry: 'Ricomincia',
  },
  pt: {
    appName: 'Seletor de terminal',
    heading: 'Encontre o melhor terminal para seu fluxo de trabalho',
    subtitle: 'Responda 7 perguntas rápidas e receba uma recomendação sob medida.',
    questionLabel: 'Pergunta',
    completedLabel: 'Diagnóstico concluído.',
    selectedOSFallback: 'SO selecionado',
    languageLabel: 'Idioma',
    recommended: 'Recomendado',
    keyFeatures: 'Principais recursos',
    installFor: 'Instalar para',
    copyCommand: 'Copiar comando',
    copied: 'Copiado!',
    copyFailed: 'Falha ao copiar. Copie o comando manualmente.',
    noInstallCommand: 'Não há comando de instalação para este SO.',
    officialSite: 'Abrir site oficial',
    previousQuestion: 'Pergunta anterior',
    retry: 'Recomeçar',
  },
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: {
      en: 'What matters most in your terminal experience?',
      ja: 'ターミナルに最も求めるものは何ですか？',
      ko: '터미널 사용 경험에서 가장 중요한 것은 무엇인가요?',
      'zh-CN': '你最看重终端的哪一点？',
      fr: "Qu'est-ce qui compte le plus dans votre expérience terminal ?",
      de: 'Was ist dir bei deinem Terminal am wichtigsten?',
      es: '¿Qué es lo más importante en tu experiencia con el terminal?',
      it: "Cosa conta di più nella tua esperienza d'uso del terminale?",
      pt: 'O que mais importa na sua experiência com terminal?',
    },
    options: [
      {
        text: {
          en: 'Raw performance and low latency',
          ja: '生のパフォーマンスと低遅延',
          ko: '순수 성능과 낮은 지연 시간',
          'zh-CN': '极致性能和低延迟',
          fr: 'Performance brute et faible latence',
          de: 'Rohleistung und geringe Latenz',
          es: 'Rendimiento puro y baja latencia',
          it: 'Prestazioni pure e bassa latenza',
          pt: 'Desempenho bruto e baixa latência',
        },
        scores: { foot: 5, alacritty: 4, wezterm: 3 },
      },
      {
        text: {
          en: 'Modern UI and polished workflow',
          ja: 'モダンUIと洗練された操作感',
          ko: '현대적인 UI와 다듬어진 워크플로',
          'zh-CN': '现代化界面与流畅工作流',
          fr: 'Interface moderne et workflow soigné',
          de: 'Moderne UI und ausgereifter Workflow',
          es: 'Interfaz moderna y flujo pulido',
          it: 'UI moderna e workflow curato',
          pt: 'UI moderna e fluxo de trabalho refinado',
        },
        scores: { warp: 5, iterm2: 4, windows_terminal: 3 },
      },
      {
        text: {
          en: 'Balanced speed and features',
          ja: '速度と機能のバランス',
          ko: '속도와 기능의 균형',
          'zh-CN': '速度与功能平衡',
          fr: 'Équilibre entre vitesse et fonctionnalités',
          de: 'Ausgewogenes Verhältnis aus Tempo und Funktionen',
          es: 'Equilibrio entre velocidad y funciones',
          it: 'Bilanciamento tra velocità e funzionalità',
          pt: 'Equilíbrio entre velocidade e recursos',
        },
        scores: { wezterm: 4, alacritty: 3, iterm2: 3 },
      },
    ],
  },
  {
    id: 2,
    text: {
      en: 'How important is deep customization?',
      ja: '深いカスタマイズ性はどれくらい重要ですか？',
      ko: '세부 커스터마이징은 얼마나 중요한가요?',
      'zh-CN': '深度自定义对你有多重要？',
      fr: 'Quelle importance accordez-vous à la personnalisation avancée ?',
      de: 'Wie wichtig ist dir tiefgehende Anpassbarkeit?',
      es: '¿Qué tan importante es la personalización profunda?',
      it: 'Quanto è importante la personalizzazione avanzata?',
      pt: 'Quão importante é a personalização avançada?',
    },
    options: [
      {
        text: {
          en: 'I tweak everything',
          ja: '細かく設定を追い込みたい',
          ko: '모든 것을 세밀하게 조정한다',
          'zh-CN': '我会精细调整一切',
          fr: 'Je règle tout en détail',
          de: 'Ich passe alles bis ins Detail an',
          es: 'Ajusto todo al detalle',
          it: 'Ottimizzo tutto nei minimi dettagli',
          pt: 'Ajusto tudo nos mínimos detalhes',
        },
        scores: { wezterm: 5, alacritty: 4, foot: 3 },
      },
      {
        text: {
          en: 'Some tuning is enough',
          ja: 'ある程度調整できれば十分',
          ko: '어느 정도 조정이면 충분하다',
          'zh-CN': '适度可调就够了',
          fr: 'Quelques réglages me suffisent',
          de: 'Einige Anpassungen reichen mir',
          es: 'Me basta con algunos ajustes',
          it: 'Mi basta qualche regolazione',
          pt: 'Alguns ajustes já são suficientes',
        },
        scores: { iterm2: 4, windows_terminal: 4, warp: 3 },
      },
      {
        text: {
          en: 'I prefer ready-to-use defaults',
          ja: 'すぐ使える標準設定が好き',
          ko: '바로 쓸 수 있는 기본 설정이 좋다',
          'zh-CN': '我更喜欢开箱即用',
          fr: "Je préfère des réglages prêts à l'emploi",
          de: 'Ich bevorzuge sofort nutzbare Standards',
          es: 'Prefiero valores listos para usar',
          it: "Preferisco impostazioni pronte all'uso",
          pt: 'Prefiro padrões prontos para uso',
        },
        scores: { warp: 5, windows_terminal: 4, iterm2: 3 },
      },
    ],
  },
  {
    id: 3,
    text: {
      en: 'Which interface style do you prefer?',
      ja: 'どのUIスタイルを好みますか？',
      ko: '어떤 인터페이스 스타일을 선호하나요?',
      'zh-CN': '你偏好哪种界面风格？',
      fr: "Quel style d'interface préférez-vous ?",
      de: 'Welchen Oberflächenstil bevorzugst du?',
      es: '¿Qué estilo de interfaz prefieres?',
      it: 'Quale stile di interfaccia preferisci?',
      pt: 'Qual estilo de interface você prefere?',
    },
    options: [
      {
        text: {
          en: 'Minimal and keyboard-first',
          ja: 'ミニマルでキーボード中心',
          ko: '미니멀하고 키보드 중심',
          'zh-CN': '极简且键盘优先',
          fr: 'Minimaliste et orienté clavier',
          de: 'Minimal und keyboard-first',
          es: 'Minimalista y centrado en teclado',
          it: 'Minimalista e orientato alla tastiera',
          pt: 'Minimalista e focado no teclado',
        },
        scores: { foot: 5, alacritty: 4 },
      },
      {
        text: {
          en: 'Tabs, panes, and rich UI',
          ja: 'タブ・ペインが充実したリッチUI',
          ko: '탭/패널이 풍부한 UI',
          'zh-CN': '标签页、分屏与丰富 UI',
          fr: 'Onglets, volets et interface riche',
          de: 'Tabs, Splits und umfangreiche UI',
          es: 'Pestañas, paneles e interfaz rica',
          it: 'Schede, pannelli e interfaccia ricca',
          pt: 'Abas, painéis e interface rica',
        },
        scores: { iterm2: 5, windows_terminal: 4, warp: 4 },
      },
      {
        text: {
          en: 'Scriptable with modern rendering',
          ja: 'モダン描画＋スクリプト性',
          ko: '현대적 렌더링 + 스크립트 가능',
          'zh-CN': '现代渲染且可脚本化',
          fr: 'Scriptable avec rendu moderne',
          de: 'Skriptbar mit modernem Rendering',
          es: 'Automatizable con renderizado moderno',
          it: 'Scriptabile con rendering moderno',
          pt: 'Scriptável com renderização moderna',
        },
        scores: { wezterm: 5, alacritty: 3 },
      },
    ],
  },
  {
    id: 4,
    text: {
      en: 'How often do you work with remote systems?',
      ja: 'リモート環境での作業頻度は？',
      ko: '원격 시스템 작업 빈도는 어느 정도인가요?',
      'zh-CN': '你使用远程系统的频率如何？',
      fr: 'À quelle fréquence travaillez-vous sur des systèmes distants ?',
      de: 'Wie oft arbeitest du mit entfernten Systemen?',
      es: '¿Con qué frecuencia trabajas con sistemas remotos?',
      it: 'Quanto spesso lavori con sistemi remoti?',
      pt: 'Com que frequência você trabalha com sistemas remotos?',
    },
    options: [
      {
        text: {
          en: 'Constantly (SSH / cloud / containers)',
          ja: '常に使う（SSH / クラウド / コンテナ）',
          ko: '항상 사용 (SSH / 클라우드 / 컨테이너)',
          'zh-CN': '经常（SSH / 云 / 容器）',
          fr: 'En permanence (SSH / cloud / conteneurs)',
          de: 'Ständig (SSH / Cloud / Container)',
          es: 'Constantemente (SSH / nube / contenedores)',
          it: 'Costantemente (SSH / cloud / container)',
          pt: 'Constantemente (SSH / nuvem / containers)',
        },
        scores: { wezterm: 5, foot: 4, iterm2: 3 },
      },
      {
        text: {
          en: 'Sometimes',
          ja: 'ときどき使う',
          ko: '가끔 사용',
          'zh-CN': '有时',
          fr: 'Parfois',
          de: 'Manchmal',
          es: 'A veces',
          it: 'A volte',
          pt: 'Às vezes',
        },
        scores: { windows_terminal: 4, alacritty: 4, iterm2: 3 },
      },
      {
        text: {
          en: 'Rarely',
          ja: 'ほとんど使わない',
          ko: '거의 사용하지 않음',
          'zh-CN': '很少',
          fr: 'Rarement',
          de: 'Selten',
          es: 'Rara vez',
          it: 'Raramente',
          pt: 'Raramente',
        },
        scores: { warp: 4, windows_terminal: 3 },
      },
    ],
  },
  {
    id: 5,
    text: {
      en: 'How much does startup speed matter?',
      ja: '起動速度はどの程度重要ですか？',
      ko: '시작 속도는 얼마나 중요한가요?',
      'zh-CN': '启动速度对你有多重要？',
      fr: 'Quelle importance a la vitesse de démarrage ?',
      de: 'Wie wichtig ist die Startgeschwindigkeit?',
      es: '¿Cuánto importa la velocidad de arranque?',
      it: 'Quanto conta la velocità di avvio?',
      pt: 'Quão importante é a velocidade de inicialização?',
    },
    options: [
      {
        text: {
          en: 'Critical',
          ja: '最重要',
          ko: '매우 중요',
          'zh-CN': '非常关键',
          fr: 'Critique',
          de: 'Entscheidend',
          es: 'Crítica',
          it: 'Critica',
          pt: 'Crítica',
        },
        scores: { foot: 5, alacritty: 5 },
      },
      {
        text: {
          en: 'Nice to have',
          ja: '速いと嬉しい',
          ko: '빠르면 좋다',
          'zh-CN': '有更好',
          fr: 'Appréciable',
          de: 'Wünschenswert',
          es: 'Deseable',
          it: 'Gradita',
          pt: 'Bom ter',
        },
        scores: { wezterm: 4, windows_terminal: 3, iterm2: 3 },
      },
      {
        text: {
          en: 'Not a major factor',
          ja: 'そこまで重視しない',
          ko: '중요하지 않다',
          'zh-CN': '不是主要因素',
          fr: 'Pas un facteur majeur',
          de: 'Kein Hauptfaktor',
          es: 'No es un factor principal',
          it: 'Non è un fattore principale',
          pt: 'Não é um fator principal',
        },
        scores: { warp: 4, iterm2: 3 },
      },
    ],
  },
  {
    id: 6,
    text: {
      en: 'What best describes your workflow?',
      ja: 'あなたのワークフローに最も近いのは？',
      ko: '당신의 작업 방식에 가장 가까운 것은?',
      'zh-CN': '哪项最符合你的工作流？',
      fr: 'Quelle option décrit le mieux votre workflow ?',
      de: 'Welche Beschreibung passt am besten zu deinem Workflow?',
      es: '¿Qué describe mejor tu flujo de trabajo?',
      it: 'Quale descrizione rappresenta meglio il tuo workflow?',
      pt: 'O que melhor descreve seu fluxo de trabalho?',
    },
    options: [
      {
        text: {
          en: 'Heavy CLI + tmux + scripting',
          ja: 'CLI + tmux + スクリプト中心',
          ko: 'CLI + tmux + 스크립트 중심',
          'zh-CN': '重度 CLI + tmux + 脚本',
          fr: 'CLI intensive + tmux + scripts',
          de: 'Intensiv CLI + tmux + Scripting',
          es: 'CLI intensivo + tmux + scripts',
          it: 'Uso intenso di CLI + tmux + scripting',
          pt: 'CLI pesado + tmux + scripts',
        },
        scores: { foot: 5, alacritty: 4, wezterm: 4 },
      },
      {
        text: {
          en: 'Mix of CLI and GUI development tools',
          ja: 'CLIとGUI開発ツールを併用',
          ko: 'CLI와 GUI 개발 도구를 혼합 사용',
          'zh-CN': 'CLI 与 GUI 开发工具混合使用',
          fr: 'Mélange CLI et outils GUI',
          de: 'Mischung aus CLI- und GUI-Tools',
          es: 'Mezcla de CLI y herramientas GUI',
          it: 'Mix di strumenti CLI e GUI',
          pt: 'Mistura de CLI e ferramentas GUI',
        },
        scores: { iterm2: 4, warp: 4, windows_terminal: 3 },
      },
      {
        text: {
          en: 'Mostly PowerShell / Windows-native tools',
          ja: 'PowerShell / Windows系ツール中心',
          ko: '주로 PowerShell / Windows 기본 도구 사용',
          'zh-CN': '主要使用 PowerShell / Windows 原生工具',
          fr: 'Surtout PowerShell / outils natifs Windows',
          de: 'Meist PowerShell / Windows-native Tools',
          es: 'Principalmente PowerShell / herramientas nativas de Windows',
          it: 'Per lo più PowerShell / strumenti nativi Windows',
          pt: 'Principalmente PowerShell / ferramentas nativas do Windows',
        },
        scores: { windows_terminal: 5, wezterm: 2 },
      },
    ],
  },
  {
    id: 7,
    text: {
      en: 'How important are advanced extras (GPU rendering, split panes, shell integration)?',
      ja: '高度な機能（GPU描画、分割ペイン、シェル連携）は重要ですか？',
      ko: '고급 기능(GPU 렌더링, 분할 패널, 셸 통합)은 얼마나 중요한가요?',
      'zh-CN': '高级功能（GPU 渲染、分屏、Shell 集成）有多重要？',
      fr: "Quelle importance ont les fonctionnalités avancées (GPU, splits, intégration shell) ?",
      de: 'Wie wichtig sind erweiterte Funktionen (GPU, Splits, Shell-Integration)?',
      es: '¿Qué tan importantes son los extras avanzados (GPU, paneles, integración shell)?',
      it: "Quanto sono importanti le funzioni avanzate (GPU, split pane, integrazione shell)?",
      pt: 'Quão importantes são os recursos avançados (GPU, painéis, integração shell)?',
    },
    options: [
      {
        text: {
          en: 'Essential',
          ja: '必須',
          ko: '필수',
          'zh-CN': '必需',
          fr: 'Essentiel',
          de: 'Unverzichtbar',
          es: 'Esencial',
          it: 'Essenziale',
          pt: 'Essencial',
        },
        scores: { wezterm: 5, iterm2: 4, warp: 4 },
      },
      {
        text: {
          en: 'Useful but not required',
          ja: 'あると便利だが必須ではない',
          ko: '있으면 좋지만 필수는 아님',
          'zh-CN': '有用但非必须',
          fr: 'Utile mais non indispensable',
          de: 'Nützlich, aber nicht zwingend',
          es: 'Útil pero no imprescindible',
          it: 'Utile ma non necessario',
          pt: 'Útil, mas não obrigatório',
        },
        scores: { windows_terminal: 4, alacritty: 3, iterm2: 3 },
      },
      {
        text: {
          en: 'Keep it simple',
          ja: 'シンプルさ重視',
          ko: '단순함 중시',
          'zh-CN': '保持简单',
          fr: 'Rester simple',
          de: 'Lieber einfach',
          es: 'Mantenerlo simple',
          it: 'Mantenerlo semplice',
          pt: 'Manter simples',
        },
        scores: { foot: 4, alacritty: 3 },
      },
    ],
  },
  {
    id: 8,
    text: {
      en: 'Select your operating system',
      ja: '使用しているOSを選択してください',
      ko: '운영체제를 선택하세요',
      'zh-CN': '请选择你的操作系统',
      fr: "Sélectionnez votre système d'exploitation",
      de: 'Wähle dein Betriebssystem',
      es: 'Selecciona tu sistema operativo',
      it: 'Seleziona il tuo sistema operativo',
      pt: 'Selecione seu sistema operacional',
    },
    isOSQuestion: true,
    options: [
      { text: { en: 'Windows' }, scores: {}, os: 'Windows' },
      { text: { en: 'macOS' }, scores: {}, os: 'macOS' },
      { text: { en: 'Linux' }, scores: {}, os: 'Linux' },
    ],
  },
]

const TERMINAL_DETAILS: Record<TerminalKey, TerminalDetail> = {
  windows_terminal: {
    name: 'Windows Terminal',
    description: {
      en: 'Microsoft’s modern first-party terminal with strong PowerShell and WSL integration.',
      ja: 'Microsoft公式のモダンターミナル。PowerShell/WSLとの親和性が高い。',
    },
    features: [
      { en: 'GPU accelerated rendering', ja: 'GPUアクセラレーション描画' },
      { en: 'Tabbed interface', ja: 'タブ型インターフェース' },
      { en: 'Excellent Windows/WSL integration', ja: 'Windows/WSL連携に優れる' },
    ],
    install: {
      Windows: {
        command: 'winget install --id Microsoft.WindowsTerminal -e',
        url: 'https://aka.ms/terminal',
      },
    },
  },
  alacritty: {
    name: 'Alacritty',
    description: {
      en: 'A fast, minimal GPU-accelerated terminal with straightforward YAML configuration.',
      ja: '高速でシンプルなGPUアクセラレーション端末。設定はYAMLで明快。',
    },
    features: [
      { en: 'Very fast startup', ja: '非常に高速な起動' },
      { en: 'Cross-platform', ja: 'クロスプラットフォーム対応' },
      { en: 'Minimal footprint', ja: '軽量で無駄が少ない' },
    ],
    install: {
      macOS: {
        command: 'brew install --cask alacritty',
        url: 'https://github.com/alacritty/alacritty',
      },
      Linux: {
        command: 'sudo apt install alacritty',
        url: 'https://github.com/alacritty/alacritty',
        note: {
          en: 'Use dnf/pacman or your distribution package manager as needed.',
          ja: 'ディストリビューションに応じてdnf/pacman等を使用してください。',
        },
      },
      Windows: {
        command: 'winget install --id Alacritty.Alacritty -e',
        url: 'https://github.com/alacritty/alacritty',
      },
    },
  },
  wezterm: {
    name: 'WezTerm',
    description: {
      en: 'A powerful terminal that combines Lua-based configuration with advanced capabilities.',
      ja: 'Lua設定と高度な機能を両立する高機能ターミナル。',
    },
    features: [
      { en: 'Powerful customization', ja: '高いカスタマイズ性' },
      { en: 'Multiplexer-like panes', ja: 'マルチプレクサ風ペイン管理' },
      { en: 'Cross-platform consistency', ja: 'OS間で一貫した操作感' },
    ],
    install: {
      macOS: {
        command: 'brew install --cask wezterm',
        url: 'https://wezfurlong.org/wezterm/',
      },
      Linux: {
        command: 'curl -fsSL https://apt.fury.io/wez/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/wezterm-fury.gpg',
        url: 'https://wezfurlong.org/wezterm/install/linux.html',
      },
      Windows: {
        command: 'winget install --id wez.wezterm -e',
        url: 'https://wezfurlong.org/wezterm/',
      },
    },
  },
  warp: {
    name: 'Warp',
    description: {
      en: 'A next-generation terminal with AI assistance and command-block UX.',
      ja: 'AI補助やコマンドブロックUIを備えた次世代ターミナル。',
    },
    features: [
      { en: 'Modern command blocks', ja: 'モダンなコマンドブロック' },
      { en: 'Collaboration features', ja: 'コラボレーション機能' },
      { en: 'Integrated productivity tools', ja: '生産性向上ツールを統合' },
    ],
    install: {
      macOS: {
        command: 'brew install --cask warp',
        url: 'https://www.warp.dev/',
      },
      Linux: {
        url: 'https://www.warp.dev/download',
        note: {
          en: 'Install from the official download page for your distribution.',
          ja: '公式ページからディストリビューションに合わせて導入してください。',
        },
      },
      Windows: {
        command: 'winget install --id Warp.Warp -e',
        url: 'https://www.warp.dev/',
      },
    },
  },
  iterm2: {
    name: 'iTerm2',
    description: {
      en: 'A popular high-feature terminal for macOS with strong keybinding and profile support.',
      ja: 'macOSで定番の高機能端末。キーバインドとプロファイル管理が強力。',
    },
    features: [
      { en: 'Best-in-class macOS UX', ja: 'macOSで優れたUX' },
      { en: 'Strong profile management', ja: '強力なプロファイル管理' },
      { en: 'Rich shell integration', ja: '豊富なシェル連携' },
    ],
    install: {
      macOS: {
        command: 'brew install --cask iterm2',
        url: 'https://iterm2.com/',
      },
    },
  },
  foot: {
    name: 'foot',
    description: {
      en: 'A lightweight, high-performance Linux terminal optimized for Wayland.',
      ja: 'Wayland向けに最適化された、軽量かつ高速なLinuxターミナル。',
    },
    features: [
      { en: 'Very lightweight', ja: '非常に軽量' },
      { en: 'Excellent Wayland performance', ja: 'Waylandで高い描画性能' },
      { en: 'Keyboard-first workflow', ja: 'キーボード中心の操作' },
    ],
    install: {
      Linux: {
        command: 'sudo apt install foot',
        url: 'https://codeberg.org/dnkl/foot',
      },
    },
  },
}

const getCompatibleTerminals = (selectedOS: OS): TerminalKey[] => {
  if (selectedOS === 'Windows') return ['windows_terminal', 'alacritty', 'wezterm', 'warp']
  if (selectedOS === 'macOS') return TERMINAL_KEYS.filter((key) => key !== 'windows_terminal' && key !== 'foot')
  return TERMINAL_KEYS.filter((key) => key !== 'windows_terminal' && key !== 'iterm2')
}

const detectOS = (): OS | null => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('win')) return 'Windows'
  if (userAgent.includes('mac')) return 'macOS'
  if (userAgent.includes('linux')) return 'Linux'
  return null
}

const copyWithFallback = async (value: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fallback below for restricted environments such as iframes.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', 'true')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  textArea.style.top = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  const legacyDocument = document as unknown as {
    execCommand?: (commandId: string) => boolean
  }
  const copied = legacyDocument.execCommand?.('copy') ?? false
  document.body.removeChild(textArea)
  return copied
}

function App() {
  const [locale, setLocale] = useState<Locale>(() => detectLocale())
  const [selectedOS, setSelectedOS] = useState<OS | null>(() => detectOS())
  const [scores, setScores] = useState<Record<TerminalKey, number>>(createInitialScores)
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const t = UI_TEXT[locale]

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const visibleQuestions = useMemo(
    () => (selectedOS ? QUESTIONS.filter((question) => !question.isOSQuestion) : QUESTIONS),
    [selectedOS],
  )

  const currentQuestion = visibleQuestions[currentStep]
  const progressLabel = completed
    ? `${t.completedLabel} ${(selectedOS ?? t.selectedOSFallback).toString()}`
    : `${t.questionLabel} ${Math.min(currentStep + 1, visibleQuestions.length)} / ${visibleQuestions.length}`

  const recommendation = useMemo(() => {
    if (!completed || !selectedOS) return null
    const compatible = getCompatibleTerminals(selectedOS)
    const [bestTerminal] = compatible.sort((a, b) => scores[b] - scores[a])
    return { key: bestTerminal, detail: TERMINAL_DETAILS[bestTerminal] }
  }, [completed, scores, selectedOS])

  const resetQuiz = () => {
    setSelectedOS(detectOS())
    setScores(createInitialScores())
    setCurrentStep(0)
    setCompleted(false)
    setCopyStatus('idle')
  }

  const handleOptionClick = (option: QuestionOption) => {
    setCopyStatus('idle')

    if (currentQuestion.isOSQuestion && option.os) {
      setSelectedOS(option.os)
    } else {
      setScores((previous) => {
        const next = { ...previous }
        for (const [terminal, score] of Object.entries(option.scores)) {
          const key = terminal as TerminalKey
          next[key] += score ?? 0
        }
        return next
      })
    }

    if (currentStep >= visibleQuestions.length - 1) {
      setCompleted(true)
      return
    }

    setCurrentStep((step) => step + 1)
  }

  const handleCopyCommand = async (command: string) => {
    const copied = await copyWithFallback(command)
    setCopyStatus(copied ? 'copied' : 'failed')
  }

  const handlePreviousQuestion = () => {
    if (currentStep === 0) return
    setCopyStatus('idle')
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const installConfig = recommendation && selectedOS ? recommendation.detail.install[selectedOS] : undefined

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <div aria-live="polite" className="sr-only">
        {progressLabel}
      </div>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-6 shadow-2xl sm:p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Terminal Emulator Selector logo" className="h-8 w-8" />
              <p className="text-sm tracking-wide text-emerald-400">{t.appName}</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <span>{t.languageLabel}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-slate-100"
              >
                {LOCALE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100 sm:text-3xl">{t.heading}</h1>
          <p className="mt-3 text-sm text-slate-300">{t.subtitle}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{
                width: `${Math.round((Math.min(currentStep + 1, visibleQuestions.length) / visibleQuestions.length) * 100)}%`,
              }}
            />
          </div>
        </header>

        {!completed && currentQuestion && (
          <section key={currentQuestion.id} className="panel-enter">
            <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl">{tr(currentQuestion.text, locale)}</h2>
            <div className="mt-5 grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className="option-enter w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-left text-slate-100 transition hover:border-emerald-400 hover:bg-slate-800"
                >
                  {tr(option.text, locale)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handlePreviousQuestion}
              disabled={currentStep === 0}
              className="mt-4 rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.previousQuestion}
            </button>
          </section>
        )}

        {completed && recommendation && selectedOS && (
          <section className="panel-enter space-y-5">
            <div className="scan-effect rounded-xl border border-emerald-400/50 bg-slate-800/70 p-5">
              <p className="text-xs uppercase tracking-wider text-emerald-300">{t.recommended}</p>
              <h2 className="mt-2 text-2xl font-semibold text-emerald-300">{recommendation.detail.name}</h2>
              <p className="mt-2 text-sm text-slate-200">{tr(recommendation.detail.description, locale)}</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{t.keyFeatures}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {recommendation.detail.features.map((feature, index) => (
                  <li key={`${recommendation.key}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    <span>{tr(feature, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{`${t.installFor} ${selectedOS}`}</h3>
              {installConfig?.command ? (
                <div className="mt-3">
                  <div className="flex items-stretch gap-2 rounded-md border border-slate-700 bg-slate-900 p-2">
                    <code className="block min-w-0 flex-1 overflow-x-auto px-1 py-2 text-xs text-emerald-300">
                      {installConfig.command}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(installConfig.command ?? '')}
                      className="self-center whitespace-nowrap rounded-md border border-emerald-400 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-400/10"
                    >
                      {copyStatus === 'copied' ? t.copied : t.copyCommand}
                    </button>
                  </div>
                  {copyStatus === 'failed' && <p className="mt-2 text-xs text-red-300">{t.copyFailed}</p>}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">{t.noInstallCommand}</p>
              )}
              {installConfig?.note && <p className="mt-2 text-xs text-slate-400">{tr(installConfig.note, locale)}</p>}
              {installConfig?.url && (
                <a
                  href={installConfig.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm text-emerald-300 underline underline-offset-4"
                >
                  {t.officialSite}
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={resetQuiz}
              className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              {t.retry}
            </button>
          </section>
        )}
      </main>

      <footer className="mx-auto mt-6 flex w-full max-w-3xl items-center justify-between gap-3 px-1 text-xs text-slate-400">
        <span>{`Build v${APP_VERSION}`}</span>
        {SOURCE_URL ? (
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-300 underline underline-offset-4"
          >
            View source
          </a>
        ) : (
          <span className="opacity-70">View source (URL pending)</span>
        )}
      </footer>
    </div>
  )
}

export default App
