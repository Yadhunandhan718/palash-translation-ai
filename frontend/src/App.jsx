import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Languages,
  Mic,
  MicOff,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react'
import {
  generateWorksheet,
  getFlashcards,
  getLessons,
  getPhrases,
  getWorksheets,
  translateText,
  voiceTranslate,
} from './services/api.js'

const languageOptions = [
  { label: 'Hindi', value: 'hin_Deva' },
  { label: 'Santali', value: 'sat_Olck' },
]

const samplePrompts = [
  'आज हम जानवरों के घरों के बारे में सीखेंगे।',
  'सब लोग ध्यान से सुनो और उत्तर बोलो।',
  'इन बीजों को गिनो और संख्या बोलो।',
]

const tabs = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'lessons', label: 'Lessons', icon: BookOpen },
  { id: 'voice', label: 'Translator', icon: Languages },
  { id: 'worksheets', label: 'Worksheets', icon: Wand2 },
  { id: 'flashcards', label: 'Flashcards', icon: PanelsTopLeft },
]

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [lessons, setLessons] = useState([])
  const [flashcardSets, setFlashcardSets] = useState([])
  const [worksheets, setWorksheets] = useState([])
  const [phraseSets, setPhraseSets] = useState([])
  const [loadingContent, setLoadingContent] = useState(true)
  const [contentError, setContentError] = useState('')

  useEffect(() => {
    Promise.all([getLessons(), getFlashcards(), getWorksheets(), getPhrases()])
      .then(([lessonData, flashcardData, worksheetData, phraseData]) => {
        setLessons(lessonData)
        setFlashcardSets(flashcardData)
        setWorksheets(worksheetData)
        setPhraseSets(phraseData)
      })
      .catch((error) => setContentError(error.message))
      .finally(() => setLoadingContent(false))
  }, [])

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content" id="main-content">
        {contentError && <div className="alert">Backend content could not load: {contentError}</div>}
        {loadingContent ? (
          <section className="card loading-card">
            <Logo compact />
            <span>Loading classroom content...</span>
          </section>
        ) : null}

        {activeTab === 'home' && (
          <LandingPage
            lessons={lessons}
            worksheets={worksheets}
            flashcards={flashcardSets}
            phrases={phraseSets}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'voice' && <VoiceTranslator />}
        {activeTab === 'lessons' && <Lessons lessons={lessons} />}
        {activeTab === 'flashcards' && <Flashcards sets={flashcardSets} />}
        {activeTab === 'worksheets' && <Worksheets worksheets={worksheets} />}
      </main>

      <Footer />
    </div>
  )
}

function Logo({ compact = false }) {
  return (
    <div className={compact ? 'logo compact' : 'logo'} aria-label="PALASH AI">
      <svg className="logo-mark" viewBox="0 0 48 48" role="img" aria-label="Palash flower mark">
        <path d="M23.7 6.7c7 7.3 6.5 17.6-.1 24.5-6.9-6.9-7.6-17-.1-24.5Z" />
        <path d="M11 16.1c9.7 1.7 16.1 9.2 15.6 18.8-9.7-.3-17-7-15.6-18.8Z" />
        <path d="M37.2 15.7c1.4 11.7-5.8 18.7-15.4 19.1-.8-9.6 5.6-17.2 15.4-19.1Z" />
        <circle cx="24" cy="35" r="4.6" />
      </svg>
      {!compact && (
        <div>
          <p className="eyebrow">Hackathon prototype</p>
          <strong>PALASH AI</strong>
        </div>
      )}
    </div>
  )
}

function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="topbar">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Logo />
      <nav className="nav-tabs" aria-label="Primary navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}

function Button({ children, className = '', ...props }) {
  return <button className={`button ${className}`.trim()} {...props}>{children}</button>
}

function Card({ children, className = '', as: Component = 'section', ...props }) {
  return <Component className={`card ${className}`.trim()} {...props}>{children}</Component>
}

function LandingPage({ lessons, worksheets, flashcards, phrases, setActiveTab }) {
  const phraseCount = phrases.reduce((total, set) => total + (set.phrases?.length || 0), 0)
  const flashcardCount = flashcards.reduce((total, set) => total + (set.cards?.length || 0), 0)
  const features = [
    { title: 'Translate teacher prompts', text: 'Send typed Hindi or Santali text to the FastAPI translation endpoint.', icon: Languages, tab: 'voice' },
    { title: 'Teach with bilingual aids', text: 'Use lesson cards grounded in early-grade classroom routines.', icon: BookOpen, tab: 'lessons' },
    { title: 'Practise vocabulary', text: 'Flip through Hindi, Santali, and English flashcard prompts.', icon: PanelsTopLeft, tab: 'flashcards' },
    { title: 'Generate worksheets', text: 'Create Class 1 number worksheets from the backend generator.', icon: Wand2, tab: 'worksheets' },
  ]

  return (
    <div className="page-stack">
      <section className="hero-card reveal">
        <div className="hero-copy">
          <p className="eyebrow">Hindi ↔ Santali classroom support</p>
          <h1>Mother-tongue lesson support for Jharkhand classrooms.</h1>
          <p>
            PALASH AI helps Hindi-speaking primary teachers deliver Santali-supported instruction with translation,
            bilingual lesson material, flashcards, and worksheets for foundational learning.
          </p>
          <div className="hero-actions">
            <Button className="primary" onClick={() => setActiveTab('voice')}>Open translator</Button>
            <Button className="secondary" onClick={() => setActiveTab('lessons')}>Browse lessons</Button>
          </div>
        </div>
      </section>

      <section className="metrics-grid reveal" aria-label="Loaded classroom content">
        <Metric label="Lessons" value={lessons.length} />
        <Metric label="Flashcards" value={flashcardCount} />
        <Metric label="Worksheets" value={worksheets.length} />
        <Metric label="Classroom phrases" value={phraseCount} />
      </section>

      <section className="section-block reveal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>Four practical classroom surfaces</h2>
          </div>
        </div>
        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <button
                className="feature-card stagger"
                style={{ '--delay': `${index * 70}ms` }}
                key={feature.title}
                onClick={() => setActiveTab(feature.tab)}
              >
                <Icon size={24} aria-hidden="true" />
                <strong>{feature.title}</strong>
                <span>{feature.text}</span>
              </button>
            )
          })}
        </div>
      </section>

      <Card className="phrase-panel reveal">
        <p className="eyebrow">Quick classroom phrases</p>
        {phrases.flatMap((set) => set.phrases || []).slice(0, 4).map((phrase) => (
          <div className="phrase-row" key={phrase.hindi}>
            <strong>{phrase.hindi}</strong>
            <span>{phrase.santali}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <Card className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </Card>
  )
}

function VoiceTranslator() {
  const [text, setText] = useState(samplePrompts[0])
  const [sourceLanguage, setSourceLanguage] = useState('hin_Deva')
  const [targetLanguage, setTargetLanguage] = useState('sat_Olck')
  const [translated, setTranslated] = useState('')
  const [voiceResult, setVoiceResult] = useState(null)
  const [error, setError] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [latencyMs, setLatencyMs] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const sourceLabel = useMemo(
    () => languageOptions.find((language) => language.value === sourceLanguage)?.label,
    [sourceLanguage],
  )
  const targetLabel = useMemo(
    () => languageOptions.find((language) => language.value === targetLanguage)?.label,
    [targetLanguage],
  )

  async function handleTranslate() {
    setError('')
    setTranslated('')
    setIsTranslating(true)
    const startedAt = performance.now()
    try {
      const result = await translateText({ text, sourceLanguage, targetLanguage })
      setTranslated(result.translated_text)
      setLatencyMs(Math.round(performance.now() - startedAt))
    } catch (translationError) {
      setError(translationError.message)
    } finally {
      setIsTranslating(false)
    }
  }

  async function startRecording() {
    setError('')
    setVoiceResult(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser microphone access is unavailable in this environment.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const startedAt = performance.now()
        setIsTranslating(true)
        try {
          const result = await voiceTranslate(audioBlob)
          setVoiceResult(result)
          setLatencyMs(Math.round(performance.now() - startedAt))
        } catch (voiceError) {
          setError(voiceError.message)
        } finally {
          setIsTranslating(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (microphoneError) {
      setError(microphoneError.message)
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <div className="page-stack">
      <Card className="translator-panel reveal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Typed translation now · voice pipeline experimental</p>
            <h1>{sourceLabel} to {targetLabel}</h1>
          </div>
          <Button className="secondary" onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
            {isRecording ? 'Stop recording' : 'Use microphone'}
          </Button>
        </div>

        <div className="pipeline" aria-label="Voice translation pipeline">
          <span>Browser mic</span><span>FastAPI</span><span>ASR checkpoint</span><span>IndicTrans2</span><span>TTS checkpoint</span>
        </div>

        <div className="language-grid">
          <label>
            From
            <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}>
              {languageOptions.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
            </select>
          </label>
          <label>
            To
            <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
              {languageOptions.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
            </select>
          </label>
        </div>

        <textarea aria-label="Text to translate" value={text} onChange={(event) => setText(event.target.value)} />
        <div className="prompt-chips">
          {samplePrompts.map((prompt) => (
            <button key={prompt} onClick={() => setText(prompt)}>{prompt}</button>
          ))}
        </div>
        <Button className="primary" disabled={!text.trim() || isTranslating} onClick={handleTranslate}>
          {isTranslating ? 'Processing...' : 'Translate typed text'}
        </Button>
        {isRecording && <div className="status-pill">Recording audio only while this indicator is active.</div>}
        {latencyMs !== null && <div className="status-pill">Latency: {latencyMs} ms</div>}
        {error && <div className="alert">{error}</div>}
        {voiceResult && (
          <div className="translation-output">
            <span>Hindi transcription</span>
            <strong>{voiceResult.hindi_transcription}</strong>
            <span>Santali translation</span>
            <strong>{voiceResult.santali_translation}</strong>
            <Button className="secondary" disabled>Audio playback pending TTS checkpoint</Button>
          </div>
        )}
        {translated && <div className="translation-output"><span>Translation</span><strong>{translated}</strong></div>}
      </Card>
    </div>
  )
}

function Lessons({ lessons }) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Lesson library" title="Bilingual lesson support" text="Ready classroom material with Hindi instruction and Santali support." />
      <div className="grid two-column">
        {lessons.map((lesson, index) => (
          <Card className="lesson-card stagger" key={lesson.id} style={{ '--delay': `${index * 55}ms` }}>
            <p className="eyebrow">{lesson.grade} · {lesson.subject}</p>
            <h2>{lesson.title}</h2>
            <p>{lesson.objective}</p>
            {lesson.teacherInstructionHindi && (
              <div className="teacher-prompt">
                <strong>Teacher instruction:</strong> {lesson.teacherInstructionHindi}<br />
                <strong>Santali support:</strong> {lesson.teacherInstructionSantali}
                <Button className="audio-button" disabled><Volume2 size={16} aria-hidden="true" /> Audio pending</Button>
              </div>
            )}
            <div className="vocab-grid">
              {lesson.vocabulary?.map((word) => (
                <div key={word.hindi} className="vocab-card">
                  <small>{word.visual}</small>
                  <strong>{word.hindi}</strong>
                  <span>{word.santali}</span>
                  <small>{word.english}</small>
                </div>
              ))}
            </div>
            <p><strong>Activity:</strong> {lesson.activity}</p>
            <ol>
              {lesson.steps?.map((step) => <li key={step}>{step}</li>)}
            </ol>
            {lesson.exampleQuestions?.map((question) => (
              <div className="question" key={question.hindi}>
                <strong>{question.hindi}</strong>
                <p>{question.santali}</p>
                <small>Answer: {question.answer}</small>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  )
}

function Flashcards({ sets }) {
  return (
    <div className="page-stack">
      <PageTitle eyebrow="Flashcards" title="Vocabulary practice" text="Short bilingual cards for Hindi, Santali, and English recall." />
      <div className="grid cards-grid">
        {sets.flatMap((set) => set.cards || []).map((card, index) => (
          <Card className="flashcard stagger" key={`${card.hindi}-${card.english}`} style={{ '--delay': `${index * 35}ms` }}>
            <span>{card.english}</span>
            {card.visual && <small>{card.visual}</small>}
            <strong>{card.hindi}</strong>
            <p>{card.santali}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Worksheets({ worksheets }) {
  const [generated, setGenerated] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setError('')
    setIsGenerating(true)
    try {
      setGenerated(await generateWorksheet({ questionCount: 7, difficulty: 'easy' }))
    } catch (worksheetError) {
      setError(worksheetError.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="page-stack">
      <PageTitle eyebrow="Worksheets" title="Class 1 Numbers 1–10" text="Generate or reuse bilingual count-and-match worksheets." />
      <div className="grid two-column">
        <Card className="large-panel">
          <p className="eyebrow">Generator</p>
          <h2>Numbers 1–10</h2>
          <p>Requests a fresh worksheet from the FastAPI backend.</p>
          <Button className="primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate worksheet'}
          </Button>
          {error && <div className="alert">{error}</div>}
          {generated && <WorksheetPreview worksheet={generated} />}
        </Card>
        {worksheets.map((worksheet) => <WorksheetPreview worksheet={worksheet} key={worksheet.id || worksheet.title} />)}
      </div>
    </div>
  )
}

function WorksheetPreview({ worksheet }) {
  return (
    <Card className="worksheet-card">
      <p className="eyebrow">{worksheet.grade || worksheet.difficulty}</p>
      <h2>{worksheet.title}</h2>
      <p>{worksheet.instructions || worksheet.hindiInstruction}</p>
      {worksheet.santaliInstruction && <p>{worksheet.santaliInstruction}</p>}
      {worksheet.questions?.map((question, index) => (
        <div className="question" key={`${question.prompt || question.promptHindi}-${index}`}>
          <strong>{index + 1}. {question.prompt || question.promptHindi}</strong>
          {question.promptSantali && <p>{question.promptSantali}</p>}
          {question.options && <div className="option-row">{question.options.map((option) => <span key={option}>{option}</span>)}</div>}
          <small>Answer: {question.answer}</small>
        </div>
      ))}
    </Card>
  )
}

function PageTitle({ eyebrow, title, text }) {
  return (
    <section className="page-title reveal">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <Logo />
      <div className="transparency-note">
        <ShieldCheck size={20} aria-hidden="true" />
        <p>
          Text you enter is sent to the FastAPI translation endpoint. Microphone access is requested only when you press “Use microphone”; recorded audio is posted to the voice endpoint and the browser stream is stopped after recording. The backend reads bundled classroom JSON files and does not write submitted text or audio to project storage. This is a hackathon prototype, not an official government product.
        </p>
      </div>
    </footer>
  )
}

export default App
