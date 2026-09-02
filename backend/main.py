from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from asr.speech_to_text import SpeechRecognitionUnavailable, speech_to_text as transcribe_audio
from translation.translate import translate_text, translator_ready
from translation.indictrans import TranslationUnavailable
from tts.text_to_speech import TextToSpeechUnavailable, text_to_speech as synthesize_speech

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content"

app = FastAPI(
    title="PALASH AI Backend",
    description="Hackathon API for Hindi-Santali classroom translation support.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    source_language: Literal["hin_Deva", "sat_Olck"] = "hin_Deva"
    target_language: Literal["sat_Olck", "hin_Deva"] = "sat_Olck"


class TranslationResponse(BaseModel):
    source_text: str
    translated_text: str
    source_language: str
    target_language: str
    model: str


class WorksheetRequest(BaseModel):
    grade: Literal["Class 1"] = "Class 1"
    topic: Literal["Numbers 1-10"] = "Numbers 1-10"
    question_count: int = Field(5, ge=3, le=10)
    difficulty: Literal["easy", "medium"] = "easy"


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: Literal["sat_Olck"] = "sat_Olck"


def read_json_folder(folder: str):
    path = CONTENT_DIR / folder
    if not path.exists():
        return []
    import json

    items = []
    for file_path in sorted(path.glob("*.json")):
        with file_path.open("r", encoding="utf-8") as handle:
            item = json.load(handle)
            item["id"] = item.get("id") or file_path.stem
            items.append(item)
    return items


def build_numbers_worksheet(request: WorksheetRequest):
    numbers = [
        (1, "एक", "ᱢᱤᱫ"),
        (2, "दो", "ᱵᱟᱨ"),
        (3, "तीन", "ᱯᱮ"),
        (4, "चार", "ᱯᱩᱱ"),
        (5, "पाँच", "ᱢᱚᱬᱮ"),
        (6, "छह", "ᱛᱩᱨᱩᱭ"),
        (7, "सात", "ᱮᱭᱟᱭ"),
        (8, "आठ", "ᱤᱨᱟᱹᱞ"),
        (9, "नौ", "ᱟᱨᱮ"),
        (10, "दस", "ᱜᱮᱞ"),
    ]
    selected = numbers[: request.question_count]
    return {
        "title": f"{request.grade} {request.topic} Worksheet",
        "hindiInstruction": "गिनो, मिलाओ और खाली स्थान भरो।",
        "santaliInstruction": "ᱞᱮᱠᱷᱟᱭ ᱢᱮ, ᱢᱮᱞᱟᱣ ᱢᱮ ᱟᱨ ᱠᱷᱟᱹᱞᱤ ᱡᱟᱭᱜᱟ ᱯᱮᱨᱮᱡ ᱢᱮ᱾",
        "difficulty": request.difficulty,
        "questions": [
            {
                "type": "visual-counting",
                "promptHindi": f"कितने बिंदु हैं? {'●' * number}",
                "promptSantali": f"ᱛᱤᱱᱟᱹᱜ ᱴᱤᱯ ᱢᱮᱱᱟᱜ-ᱟ? {'●' * number}",
                "answer": str(number),
            }
            for number, _, _ in selected[:3]
        ]
        + [
            {
                "type": "matching",
                "promptHindi": f"{hindi} को सही संख्या से मिलाओ।",
                "promptSantali": f"{santali} ᱫᱚ ᱴᱷᱤᱠ ᱞᱮᱠᱷᱟ ᱥᱟᱶ ᱢᱮᱞᱟᱣ ᱢᱮ᱾",
                "answer": str(number),
            }
            for number, hindi, santali in selected[3:6]
        ]
        + [
            {
                "type": "fill-blank",
                "promptHindi": f"{number - 1}, ___, {number + 1}",
                "promptSantali": "ᱠᱷᱟᱹᱞᱤ ᱡᱟᱭᱜᱟ ᱯᱮᱨᱮᱡ ᱢᱮ᱾",
                "answer": str(number),
            }
            for number, _, _ in selected[6:]
            if 1 < number < 10
        ],
    }


@app.get("/")
def root():
    return {
        "name": "PALASH AI",
        "goal": "Hindi-Santali vernacular pedagogy prototype for primary education",
        "endpoints": [
            "/health",
            "/translate",
            "/voice-translate",
            "/speech-to-text",
            "/text-to-speech",
            "/generate-worksheet",
            "/lessons",
            "/flashcards",
            "/worksheets",
            "/phrases",
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "translator_ready": translator_ready()}


@app.post("/translate", response_model=TranslationResponse)
def translate(payload: TranslationRequest):
    if payload.source_language == payload.target_language:
        return TranslationResponse(
            source_text=payload.text,
            translated_text=payload.text,
            source_language=payload.source_language,
            target_language=payload.target_language,
            model="identity",
        )
    try:
        translated = translate_text(
            payload.text,
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
    except TranslationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return TranslationResponse(
        source_text=payload.text,
        translated_text=translated,
        source_language=payload.source_language,
        target_language=payload.target_language,
        model="ai4bharat/indictrans2-indic-indic-dist-320M",
    )


@app.post("/generate-worksheet")
def generate_worksheet(payload: WorksheetRequest):
    return build_numbers_worksheet(payload)


@app.post("/voice-translate")
async def voice_translate(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    try:
        hindi_text = transcribe_audio(audio_bytes, language="hin_Deva")
        santali_text = translate_text(hindi_text, source_language="hin_Deva", target_language="sat_Olck")
        audio_response = synthesize_speech(santali_text, language="sat_Olck")
    except SpeechRecognitionUnavailable as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except TextToSpeechUnavailable as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except TranslationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {
        "hindi_transcription": hindi_text,
        "santali_translation": santali_text,
        "audio_bytes": len(audio_response),
        "message": "Voice pipeline completed. Replace this JSON with streamed audio in a production build.",
    }


@app.get("/lessons")
def lessons():
    return read_json_folder("lessons")


@app.get("/flashcards")
def flashcards():
    return read_json_folder("flashcards")


@app.get("/worksheets")
def worksheets():
    return read_json_folder("worksheets")


@app.get("/phrases")
def phrases():
    return read_json_folder("phrases")


@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    try:
        return {"text": transcribe_audio(audio_bytes, language="hin_Deva"), "language": "hin_Deva"}
    except SpeechRecognitionUnavailable as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc


@app.post("/text-to-speech")
def text_to_speech(payload: TTSRequest):
    try:
        audio_bytes = synthesize_speech(payload.text, language=payload.language)
    except TextToSpeechUnavailable as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    return {"audio_bytes": len(audio_bytes), "language": payload.language}
