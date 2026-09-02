class TextToSpeechUnavailable(RuntimeError):
    pass


class IndicParlerTTS:
    model_name = "AI4Bharat Indic Parler-TTS"

    def synthesize(self, text: str, language: str = "sat_Olck") -> bytes:
        raise TextToSpeechUnavailable(
            "Indic Parler-TTS Santali checkpoint is not bundled. Configure the AI4Bharat model before enabling audio playback."
        )


_tts = IndicParlerTTS()


def text_to_speech(text: str, language: str = "sat_Olck") -> bytes:
    return _tts.synthesize(text, language=language)
