import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor


class TranslationUnavailable(RuntimeError):
    pass


class IndicTranslator:
    model_name = "ai4bharat/indictrans2-indic-indic-dist-320M"

    def __init__(self):
        self._tokenizer = None
        self._model = None
        self._processor = None
        self._load_error = None

    @property
    def is_ready(self):
        return (
            self._model is not None
            and self._tokenizer is not None
            and self._processor is not None
        )

    def _load(self):
        if self.is_ready:
            return

        if self._load_error:
            raise TranslationUnavailable(self._load_error)

        try:
            print(f"Loading {self.model_name}...")

            self._tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True,
            )

            self._model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                trust_remote_code=True,
            )

            self._processor = IndicProcessor(inference=True)

            self._model.eval()

            print("IndicTrans2 loaded successfully!")

        except Exception as exc:
            self._tokenizer = None
            self._model = None
            self._processor = None

            self._load_error = f"Could not load IndicTrans2: {exc}"

            raise TranslationUnavailable(self._load_error) from exc

    def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> str:

        self._load()

        if not text.strip():
            return ""

        sentences = [text.strip()]

        # Prepare input for IndicTrans2
        batch = self._processor.preprocess_batch(
            sentences,
            src_lang=source_language,
            tgt_lang=target_language,
        )

        inputs = self._tokenizer(
            batch,
            padding="longest",
            truncation=True,
            max_length=256,
            return_tensors="pt",
        )

        with torch.no_grad():
            generated_tokens = self._model.generate(
                **inputs,
                max_length=256,
                num_beams=5,
                num_return_sequences=1,
            )

        decoded = self._tokenizer.batch_decode(
            generated_tokens,
            skip_special_tokens=True,
        )

        translations = self._processor.postprocess_batch(
            decoded,
            lang=target_language,
        )

        return translations[0].strip()