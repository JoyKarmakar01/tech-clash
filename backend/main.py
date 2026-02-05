import os
import re
from typing import List, Literal, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import pipeline

# ==================================================
# CONFIG
# ==================================================
MODEL_NAME = os.getenv("MODEL_NAME", "jy46604790/Fake-News-Bert-Detect")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title="Fake News Detection API (Rule + ML Hybrid)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# LOAD MODEL
# ==================================================
clf = pipeline("text-classification", model=MODEL_NAME, tokenizer=MODEL_NAME)

# ==================================================
# SCAM / MISINFORMATION RULES (EXTENDED)
# ==================================================

SCAM_PATTERNS = [
    # Money / giveaway
    r"\bfree money\b",
    r"\bguaranteed (profit|income|returns)\b",
    r"\bdouble your money\b",
    r"\binstant cash\b",

    # UPI / banking
    r"\bupi\b",
    r"\baccount blocked\b",
    r"\bbank (alert|warning)\b",
    r"\bkyc (update|required)\b",
    r"\botp\b",

    # Links / phishing
    r"\bclick (this|the) link\b",
    r"\bverify your account\b",
    r"\blogin immediately\b",
    r"\bshortened link\b",

    # Social forwarding
    r"\bwhatsapp forward\b",
    r"\bshare (this|the) post\b",
    r"\bforward to\b",

    # Crypto / investment scams
    r"\bcrypto\b",
    r"\bbitcoin\b",
    r"\bforex\b",
    r"\btrading signal\b",
    r"\b100% safe investment\b",

    # Job / loan scams
    r"\bwork from home\b",
    r"\bpart[- ]?time job\b",
    r"\bno experience required\b",
    r"\binstant loan\b",
]

HIGH_RISK_PATTERNS = [
    r"\bbill gates\b",
    r"\belon musk\b",
    r"\bmiracle cure\b",
    r"\bcancer cure\b",
    r"\bcovid\b",
    r"\bgovernment secret\b",
    r"\bclassified information\b",
]

EMOTIONAL_PATTERNS = [
    r"\bshocking\b",
    r"\bunbelievable\b",
    r"\byou won't believe\b",
    r"\bmust read\b",
    r"\bbefore it's deleted\b",
    r"\bviral\b",
]

ABSOLUTE_PATTERNS = [
    r"\balways\b",
    r"\bnever\b",
    r"\beveryone\b",
    r"\bnobody\b",
    r"\b100%\b",
]

# ==================================================
# SCHEMAS
# ==================================================
class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=20, max_length=8000)

class AnalyzeResponse(BaseModel):
    label: Literal["LIKELY_FAKE", "LIKELY_REAL"]
    probability_fake: float
    model_label: str
    notes: List[str]
    suggestions: List[str]

    # optional diagnostics
    score: int
    failed_levels: List[str]

# ==================================================
# UTILS
# ==================================================
def count_matches(patterns: List[str], text: str) -> int:
    return sum(1 for p in patterns if re.search(p, text, flags=re.IGNORECASE))

def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))

def map_ml_prob(out: dict) -> float:
    """
    Robust mapping for HF classifiers.
    Default assumption: LABEL_0 = FAKE.
    """
    label = str(out.get("label", "")).upper()
    score = float(out.get("score", 0.0))
    return clamp01(score if label == "LABEL_0" else 1.0 - score)

def build_notes_and_suggestions(
    text: str,
    score: int,
    probability_fake: float,
    failed: List[str],
    ml_fake_prob: float,
) -> Tuple[List[str], List[str]]:

    notes: List[str] = []

    if "LEVEL_1_SCAM_RULE" in failed:
        notes.append("Matched strong scam patterns (financial / phishing indicators).")

    if "LEVEL_2_HIGH_RISK_CLAIM" in failed:
        notes.append("High-risk claim detected involving sensitive topic or celebrity.")

    if "LEVEL_3_LINGUISTIC_FLAGS" in failed:
        notes.append("Emotionally manipulative or sensational language detected.")

    if "LEVEL_4_ML_SIGNAL" in failed:
        notes.append(f"ML model ({MODEL_NAME}) indicates high fake-news probability.")

    if "LEVEL_5_ABSOLUTE_CLAIMS" in failed:
        notes.append("Uses absolute or exaggerated claims without nuance.")

    notes.append(f"ML-estimated fake risk ≈ {round(ml_fake_prob*100)}%.")
    notes.append(f"Rule-engine score = {score}/100.")

    if not re.search(r"https?://", text, flags=re.I):
        notes.append("No credible source or reference link detected.")

    # Guarantee non-empty
    if not notes:
        notes = [
            "Claim-heavy text with limited verifiable context.",
            "Source credibility is unclear.",
            "Pattern resembles common misinformation templates.",
        ]

    # Suggestions
    if probability_fake >= 0.6:
        suggestions = [
            "Verify the claim with at least 2 trusted news outlets.",
            "Search for official statements from government/agency/company.",
            "Check date, location, and original author of the claim.",
            "Avoid sharing until independent confirmation is found.",
        ]
    else:
        suggestions = [
            "Cross-check the source and publication date.",
            "Look for primary references or official documentation.",
            "Compare with reputable news outlets before sharing.",
        ]

    return notes[:8], suggestions[:6]

# ==================================================
# ENDPOINT
# ==================================================
@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    original = req.text.strip()
    text = original.lower()

    score = 0
    failed: List[str] = []

    # LEVEL 1: HARD SCAM (instant block)
    if count_matches(SCAM_PATTERNS, text) > 0:
        out = clf(original, truncation=True, max_length=512)[0]
        ml_fake_prob = map_ml_prob(out)

        notes, suggestions = build_notes_and_suggestions(
            original, 100, 0.95, ["LEVEL_1_SCAM_RULE"], ml_fake_prob
        )

        return {
            "label": "LIKELY_FAKE",
            "probability_fake": 0.95,
            "model_label": MODEL_NAME,
            "notes": notes,
            "suggestions": suggestions,
            "score": 100,
            "failed_levels": ["LEVEL_1_SCAM_RULE"],
        }

    # LEVEL 2: High-risk claims
    if count_matches(HIGH_RISK_PATTERNS, text) > 0:
        score += 25
        failed.append("LEVEL_2_HIGH_RISK_CLAIM")

    # LEVEL 3: Linguistic manipulation
    if text.count("!") >= 3 or count_matches(EMOTIONAL_PATTERNS, text) > 0:
        score += 20
        failed.append("LEVEL_3_LINGUISTIC_FLAGS")

    # LEVEL 4: ML signal
    out = clf(original, truncation=True, max_length=512)[0]
    ml_fake_prob = map_ml_prob(out)

    if ml_fake_prob > 0.6:
        score += 25
        failed.append("LEVEL_4_ML_SIGNAL")

    # LEVEL 5: Absolute claims
    if count_matches(ABSOLUTE_PATTERNS, text) > 0:
        score += 15
        failed.append("LEVEL_5_ABSOLUTE_CLAIMS")

    probability_fake = clamp01(score / 100)
    label: Literal["LIKELY_FAKE", "LIKELY_REAL"] = (
        "LIKELY_FAKE" if probability_fake >= 0.5 else "LIKELY_REAL"
    )

    notes, suggestions = build_notes_and_suggestions(
        original, score, probability_fake, failed, ml_fake_prob
    )

    return {
        "label": label,
        "probability_fake": probability_fake,
        "model_label": MODEL_NAME,
        "notes": notes,
        "suggestions": suggestions,
        "score": score,
        "failed_levels": failed,
    }
