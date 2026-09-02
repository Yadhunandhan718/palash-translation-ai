const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.detail || 'PALASH service is unavailable')
  }
  return data
}

export function getLessons() {
  return request('/lessons')
}

export function getFlashcards() {
  return request('/flashcards')
}

export function getWorksheets() {
  return request('/worksheets')
}

export function getPhrases() {
  return request('/phrases')
}

export function translateText({ text, sourceLanguage, targetLanguage }) {
  return request('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    }),
  })
}

export function generateWorksheet({ questionCount = 5, difficulty = 'easy' }) {
  return request('/generate-worksheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grade: 'Class 1',
      topic: 'Numbers 1-10',
      question_count: questionCount,
      difficulty,
    }),
  })
}

export async function voiceTranslate(audioBlob) {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  return request('/voice-translate', {
    method: 'POST',
    body: formData,
  })
}
