import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Languages,
  Mic,
  MicOff,
  PanelsTopLeft,
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

  const tabs = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'voice', label: 'Voice Translator', icon: Mic },
    { id: 'worksheets', label: 'Worksheets', icon: Wand2 },
    { id: 'flashcards', label: 'Flashcards', icon: PanelsTopLeft },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PA</div>
          <div>
            <p className="eyebrow">Hackathon Prototype</p>
            <h1>PALASH AI</h1>
          </div>
        </div>
        <nav>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-card">
          <Mic size={20} />
          <strong>Voice roadmap</strong>
          <p>Browser recording is implemented. ASR/TTS endpoints clearly report unavailable until AI4Bharat checkpoints are configured.</p>
        </div>
      </aside>

      <main>
        <header className="hero">
          <div>
            <p className="eyebrow">Hindi ↔ Santali classroom support</p>
            <h2>Mother Tongue Education Assistant</h2>
            <p>
              PALASH AI helps Hindi-medium primary teachers explain concepts in Santali through translation,
              bilingual lesson aids, flashcards, worksheets, and a transparent voice-translation pipeline.
            </p>
          </div>
          <div className="hero-badge">
            <Volume2 size={28} />
            <span>Current language Hindi ↔ Santali</span>
          </div>
        </header>

        {contentError && <div className="alert">Backend content could not load: {contentError}</div>}
        {loadingContent ? <section className="panel">Loading classroom content...</section> : null}

        {activeTab === 'home' && (
          <Dashboard
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
    </div>
  )
}

function Dashboard({ lessons, worksheets, flashcards, phrases, setActiveTab }) {
  const phraseCount = phrases.reduce((total, set) => total + (set.phrases?.length || 0), 0)
  const flashcardCount = flashcards.reduce((total, set) => total + (set.cards?.length || 0), 0)
  const cards = [
    { label: 'Lessons', icon: BookOpen, tab: 'lessons' },
    { label: 'Voice Translator', icon: Mic, tab: 'voice' },
    { label: 'Worksheet Generator', icon: Wand2, tab: 'worksheets' },
    { label: 'Flashcards', icon: PanelsTopLeft, tab: 'flashcards' },
  ]

  return (
    <div className="grid dashboard-grid">
      <section className="panel large-panel">
        <p className="eyebrow">PALASH AI</p>
        <h3>Mother Tongue Education Assistant</h3>
        <p>Use ready lesson content, translate teacher prompts, generate number worksheets, and practise vocabulary with bilingual cards.</p>
        <div className="action-grid">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <button key={card.label} className="action-card" onClick={() => setActiveTab(card.tab)}>
                <Icon size={22} />
                <span>{card.label}</span>
              </button>
            )
          })}
        </div>
      </section>
      <Metric label="Available lessons" value={lessons.length} />
      <Metric label="Flashcards" value={flashcardCount} />
      <Metric label="Prototype status" value="Demo" />
      <Metric label="Worksheets" value={worksheets.length} />
      <section className="panel phrase-panel">
        <p className="eyebrow">Quick classroom phrases · {phraseCount} available</p>
        {phrases.flatMap((set) => set.phrases || []).slice(0, 4).map((phrase) => (
          <div className="phrase-row" key={phrase.hindi}>
            <strong>{phrase.hindi}</strong>
            <span>{phrase.santali}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <section className="panel metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </section>
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
    <section className="panel translator-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Hindi → Santali Voice Translator</p>
          <h3>{sourceLabel} to {targetLabel}</h3>
        </div>
        <button className="record-button" onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          {isRecording ? 'Stop recording' : 'Use microphone'}
        </button>
      </div>

      <div className="pipeline">
        <span>Browser mic</span><span>FastAPI</span><span>IndicConformer</span><span>IndicTrans2</span><span>Indic Parler-TTS</span><span>Playback</span>
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

      <textarea aria-label="Hindi transcription" value={text} onChange={(event) => setText(event.target.value)} />
      <div className="prompt-chips">
        {samplePrompts.map((prompt) => (
          <button key={prompt} onClick={() => setText(prompt)}>{prompt}</button>
        ))}
      </div>
      <button className="primary-button" disabled={!text.trim() || isTranslating} onClick={handleTranslate}>
        {isTranslating ? 'Processing...' : 'Translate typed Hindi'}
      </button>
      {isRecording && <div className="status-pill">Recording Hindi audio...</div>}
      {latencyMs !== null && <div className="status-pill">Latency: {latencyMs} ms</div>}
      {error && <div className="alert">{error}</div>}
      {voiceResult && (
        <div className="translation-output">
          <span>Hindi transcription</span>
          <strong>{voiceResult.hindi_transcription}</strong>
          <span>Santali translation</span>
          <strong>{voiceResult.santali_translation}</strong>
          <button className="secondary-button" disabled>Audio playback pending TTS checkpoint</button>
        </div>
      )}
      {translated && <div className="translation-output"><span>Santali translation</span><strong>{translated}</strong></div>}
    </section>
  )
}

function Lessons({ lessons }) {
  return (
    <div className="grid two-column">
      {lessons.map((lesson) => (
        <section className="panel lesson-card" key={lesson.id}>
          <p className="eyebrow">{lesson.grade} · {lesson.subject}</p>
          <h3>{lesson.title}</h3>
          <p>{lesson.objective}</p>
          {lesson.teacherInstructionHindi && (
            <div className="teacher-prompt">
              <strong>Teacher instruction:</strong> {lesson.teacherInstructionHindi}<br />
              <strong>Santali support:</strong> {lesson.teacherInstructionSantali}
              <button className="audio-button" disabled><Volume2 size={16} /> Audio pending</button>
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
        </section>
      ))}
    </div>
  )
}

function Flashcards({ sets }) {
  return (
    <div className="grid cards-grid">
      {sets.flatMap((set) => set.cards || []).map((card) => (
        <section className="flashcard" key={`${card.hindi}-${card.english}`}>
          <span>{card.english}</span>
          {card.visual && <small>{card.visual}</small>}
          <strong>{card.hindi}</strong>
          <p>{card.santali}</p>
        </section>
      ))}
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
    <div className="grid two-column">
      <section className="panel large-panel">
        <p className="eyebrow">Worksheet Generator</p>
        <h3>Class 1 Numbers 1–10</h3>
        <p>Generate a bilingual count-and-match worksheet from the FastAPI backend.</p>
        <button className="primary-button" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate worksheet'}
        </button>
        {error && <div className="alert">{error}</div>}
        {generated && <WorksheetPreview worksheet={generated} />}
      </section>
      {worksheets.map((worksheet) => <WorksheetPreview worksheet={worksheet} key={worksheet.id || worksheet.title} />)}
    </div>
  )
}

function WorksheetPreview({ worksheet }) {
  return (
    <section className="panel">
      <p className="eyebrow">{worksheet.grade || worksheet.difficulty}</p>
      <h3>{worksheet.title}</h3>
      <p>{worksheet.instructions || worksheet.hindiInstruction}</p>
      {worksheet.santaliInstruction && <p>{worksheet.santaliInstruction}</p>}
      {worksheet.questions?.map((question, index) => (
        <div className="question" key={`${question.prompt || question.promptHindi}-${index}`}>
          <strong>{index + 1}. {question.prompt || question.promptHindi}</strong>
          {question.promptSantali && <p>{question.promptSantali}</p>}
          {question.options && <div>{question.options.map((option) => <span key={option}>{option}</span>)}</div>}
          <small>Answer: {question.answer}</small>
        </div>
      ))}
    </section>
  )
}

export default App
