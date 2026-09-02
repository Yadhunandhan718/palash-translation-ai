class TranslationUnavailable(RuntimeError):
    pass


class IndicTranslator:
    model_name = "ai4bharat/indictrans2-indic-indic-dist-320M"

    def __init__(self):
        self._tokenizer = None
        self._model = None
        self._load_error = None

    @property
    def is_ready(self):
        return self._model is not None and self._tokenizer is not None

    def _load(self):
        if self.is_ready:
            return
        if self._load_error:
            raise TranslationUnavailable(self._load_error)

        try:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        except ImportError as exc:
            self._load_error = (
                "Translation dependencies are not installed. Run `pip install -r backend/requirements.txt`."
            )
            raise TranslationUnavailable(self._load_error) from exc

        try:
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
            self._model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name, trust_remote_code=True)
        except Exception as exc:  # model download/auth/compatibility errors should be explicit to the UI
            self._tokenizer = None
            self._model = None
            self._load_error = (
                f"Could not load {self.model_name}: {exc}. "
                "Check network access, Hugging Face cache, model license/access, and Python compatibility."
            )
            raise TranslationUnavailable(self._load_error) from exc

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        self._load()
        prompt = f"{source_language} {target_language} {text.strip()}"
        inputs = self._tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = self._model.generate(
            **inputs,
            max_length=512,
            num_beams=4,
            early_stopping=True,
        )
        result = self._tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
        return result.strip()
