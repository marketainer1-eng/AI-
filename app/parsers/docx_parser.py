"""
DocxParser — extracts evidence placeholder anchors from a DOCX file.

Placeholder format (configurable regex):
  {{갑 제N호증}}  or  {{을 제N호증}}  or  {갑 제N호증}  or  (갑 제N호증)

The parser does NOT interpret or validate the number inside the placeholder.
It records:
  - placeholder_text: the full raw match
  - paragraph_index: 0-based paragraph index in the doc body
  - char_offset: character offset of the match start within the paragraph text
  - context_snippet: up to 200 chars of surrounding paragraph text
"""

import re
from pathlib import Path
from docx import Document as DocxDocument

# Default placeholder patterns — ordered from most specific to least specific.
# The dedup key (para_idx, placeholder_text, char_offset) prevents exact duplicates,
# but overlapping patterns at the same position are avoided by running a single combined
# regex that prefers the longest match at each position.
#
# Pattern priority:
#   1. {{...}}  (double-brace, most specific — matched first)
#   2. {호증...} (single-brace, only when NOT preceded by another {)
#   3. (호증...) (parenthesis form)

PLACEHOLDER_PATTERNS: list[re.Pattern] = [
    # {{갑 제1호증}} — double brace (greedy innermost, excludes nested braces)
    re.compile(r"\{\{([^{}]+)\}\}"),
    # {갑 제1호증} — single brace, NOT preceded by { (negative lookbehind)
    re.compile(r"(?<!\{)\{([^{}]+)\}(?!\})"),
    # (갑 제1호증) — parenthesis
    re.compile(r"\(([^()]+호증[^()]*)\)"),
]


class DocxParser:
    """
    Synchronous DOCX placeholder parser.
    Returns a list of dicts, each representing one found placeholder anchor.
    """

    def __init__(self, patterns: list[re.Pattern] | None = None):
        self.patterns = patterns or PLACEHOLDER_PATTERNS

    def extract_placeholders(self, docx_path: Path) -> list[dict]:
        """
        Open the DOCX file at docx_path and extract all placeholder anchors.

        Returns:
            list of {
                "placeholder_text": str,
                "paragraph_index": int,
                "char_offset": int,
                "context_snippet": str,
            }
        """
        doc = DocxDocument(str(docx_path))
        results: list[dict] = []
        seen: set[tuple] = set()

        for para_idx, paragraph in enumerate(doc.paragraphs):
            text = paragraph.text
            if not text.strip():
                continue

            # Track which character positions have already been claimed by a match.
            # This prevents lower-priority patterns from matching inside a higher-priority match.
            covered: set[int] = set()

            for pattern in self.patterns:
                for match in pattern.finditer(text):
                    placeholder_text = match.group(0)
                    char_offset = match.start()
                    match_positions = set(range(match.start(), match.end()))

                    # Skip if this position was already consumed by a higher-priority match
                    if match_positions & covered:
                        continue

                    dedup_key = (para_idx, placeholder_text, char_offset)
                    if dedup_key in seen:
                        continue
                    seen.add(dedup_key)
                    covered |= match_positions

                    # Context snippet: 100 chars before + placeholder + 100 chars after
                    start = max(0, char_offset - 100)
                    end = min(len(text), match.end() + 100)
                    context_snippet = text[start:end]

                    results.append({
                        "placeholder_text": placeholder_text,
                        "paragraph_index": para_idx,
                        "char_offset": char_offset,
                        "context_snippet": context_snippet,
                    })

        return results

    def list_paragraphs(self, docx_path: Path) -> list[str]:
        """Return all paragraph texts in order."""
        doc = DocxDocument(str(docx_path))
        return [p.text for p in doc.paragraphs]
