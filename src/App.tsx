import { useEffect, useMemo, useState } from 'react'
import logo from './assets/logo.svg'
import rawQuestions from './data/questions.json'
import rawQuestionTexts from './data/questionTexts.json'
import rawTerminalDetails from './data/terminalDetails.json'
import rawUiText from './data/uiText.json'

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

interface UIText {
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
const QUESTION_TEXTS = rawQuestionTexts as LocalizedText[]
const RAW_QUESTIONS = rawQuestions as Array<{
  id: number
  textIndex: number
  isOSQuestion?: boolean
  options: QuestionOption[]
}>

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
const UI_TEXT = rawUiText as Record<Locale, UIText>

const QUESTIONS: Question[] = RAW_QUESTIONS.map((question) => ({
  id: question.id,
  text: QUESTION_TEXTS[question.textIndex],
  isOSQuestion: question.isOSQuestion,
  options: question.options,
}))

const TERMINAL_DETAILS = rawTerminalDetails as Record<TerminalKey, TerminalDetail>

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
