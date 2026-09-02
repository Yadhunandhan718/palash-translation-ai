class SpeechRecognitionUnavailable(RuntimeError):
    pass


class IndicConformerRecognizer:
    model_name = "ai4bharat/indicconformer_stt_sat_hybrid_ctc_rnnt_large"

    def transcribe(self, audio_bytes: bytes, language: str = "hin_Deva") -> str:
        raise SpeechRecognitionUnavailable(
            "IndicConformer ASR checkpoint is not bundled. Configure the AI4Bharat model before enabling voice translation."
        )


_recognizer = IndicConformerRecognizer()


def speech_to_text(audio_bytes: bytes, language: str = "hin_Deva") -> str:
    return _recognizer.transcribe(audio_bytes, language=language)
