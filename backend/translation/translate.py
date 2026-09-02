from .indictrans import IndicTranslator, TranslationUnavailable

_translator = IndicTranslator()


def translate_hindi_to_santali(text: str) -> str:
    return _translator.translate(text, source_language="hin_Deva", target_language="sat_Olck")


def translate_text(text: str, source_language: str = "hin_Deva", target_language: str = "sat_Olck") -> str:
    return _translator.translate(text, source_language=source_language, target_language=target_language)


def translator_ready() -> bool:
    return _translator.is_ready
