import hashlib
import logging
import pprint

from rapidfuzz import fuzz
from sklearn.metrics.pairwise import cosine_similarity
from data_sourcing.sourcing.episodes import SentenceExtractor, get_guest_name
from data_sourcing.sourcing.youtube import QuoteExtractor
from sentence_transformers import SentenceTransformer

class QuoteMatcher:
    def __init__(self, transcript_folder, sentence_extractor: SentenceExtractor, quote_extractor: QuoteExtractor, model: SentenceTransformer):
        self.transcript_folder = transcript_folder
        self.logger = logging.getLogger(__name__)
        self.sentence_extractor = sentence_extractor
        self.quote_extractor = quote_extractor
        self.model = model

    @staticmethod
    def clean_sentence(text):
        text = text.replace("’", "'").strip()
        return text.lower()

    @staticmethod
    def calc_score(quote_text, sentence_text, quote_embedding, sentence_embedding):
        ratio_score = fuzz.ratio(quote_text, sentence_text)
        partial_ratio_score = fuzz.partial_ratio(quote_text, sentence_text)
        semantic_score = cosine_similarity([quote_embedding], [sentence_embedding])[0][0] * 100
        return (max(ratio_score, partial_ratio_score) + semantic_score) / 2

    @staticmethod
    def precompute_window_data(model, sentences, window_size=2):
        window_texts = []
        window_indices = []
        for i in range(len(sentences) - window_size + 1):
            for j in range(window_size):
                window_text = " ".join(QuoteMatcher.clean_sentence(s["text"]) for s in sentences[i:i+j+1])
                window_texts.append(window_text)
                window_indices.append((i, j))
        window_embeddings = model.encode(window_texts)
        return window_texts, window_indices, window_embeddings

    @staticmethod
    def find_match_with_window(model, quote, transcript_sentences, window_texts, window_embeddings, window_indices, score_threshold=80):
        best_score = 0
        matched_sentence_idx_range = None
        matched_embedding_idx = None
        quote_text = QuoteMatcher.clean_sentence(quote["quote"])
        quote_embedding = model.encode([quote_text])[0]
        for idx, (i, j) in enumerate(window_indices):
            score = QuoteMatcher.calc_score(quote_text, window_texts[idx], quote_embedding, window_embeddings[idx])
            if score > best_score and score >= score_threshold:
                best_score = score
                matched_sentence_idx_range = (i, i+j+1)
                matched_embedding_idx = idx

        if matched_sentence_idx_range is None:
            return None
        
        return {
            "sentences": transcript_sentences[matched_sentence_idx_range[0]:matched_sentence_idx_range[1]],
            "score": best_score,
            "embedding": window_embeddings[matched_embedding_idx]
        }
    
    def extract_matched_quotes(self, episode, window_size, score_threshold, like_threshold, min_quote_length, max_comments):
        """
        Only returns quotes that match the transcript well. Discards non-matches immediately.
        """
        
        ignore_keywords = episode.guest_name.split() if episode.guest_name else []
        
        sentences = self.sentence_extractor.get_sentences(episode.transcript_file_path)
        window_texts, window_indices, window_embeddings = self.precompute_window_data(self.model, sentences, window_size=window_size)
        
        legit_quotes = []
        for candidate in self.quote_extractor.iter_candidates(
            video_id=episode.youtube_video_id,
            like_threshold=like_threshold,
            min_quote_length = min_quote_length,
            ignore_keywords=ignore_keywords,
            max_comments=max_comments
            ):
            print(f"Evaluating candidate quote: {pprint.pformat(candidate)}")
            match = self.find_match_with_window(
                self.model,
                candidate,
                sentences,
                window_texts,
                window_embeddings,
                window_indices,
                score_threshold=score_threshold
                )

            if not match:
                continue

            quote_text = " ".join(s["text"] for s in match["sentences"])
            text_hash = hashlib.sha256(quote_text.encode()).hexdigest()

            if text_hash not in [q["text_hash"] for q in legit_quotes]:
                legit_quotes.append({
                    "text": quote_text,
                    "text_hash": text_hash,
                    "text_embedding": match["embedding"],
                    "source_type": "youtube_comment",
                    "timestamp": match["sentences"][0]["startTimeMs"],
                })
        return legit_quotes
