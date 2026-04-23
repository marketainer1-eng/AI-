"""
Unit tests for DocxParser.
Creates temporary DOCX files in memory for testing.
"""

import io
import tempfile
from pathlib import Path

import pytest
from docx import Document as DocxDocument

from app.parsers.docx_parser import DocxParser


def _make_docx(paragraphs: list[str]) -> Path:
    """Create a temporary DOCX file with given paragraphs. Returns path."""
    doc = DocxDocument()
    for p in paragraphs:
        doc.add_paragraph(p)
    tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
    doc.save(tmp.name)
    tmp.close()
    return Path(tmp.name)


class TestDocxParser:
    def test_extract_double_brace_placeholder(self):
        path = _make_docx(["이 사건은 {{갑 제1호증}}에 의거합니다."])
        parser = DocxParser()
        results = parser.extract_placeholders(path)
        assert len(results) == 1
        assert results[0]["placeholder_text"] == "{{갑 제1호증}}"
        assert results[0]["paragraph_index"] == 0

    def test_extract_multiple_placeholders(self):
        path = _make_docx([
            "{{갑 제1호증}} 참조.",
            "{{갑 제2호증}} 및 {{을 제1호증}} 참조.",
        ])
        parser = DocxParser()
        results = parser.extract_placeholders(path)
        assert len(results) == 3

    def test_extract_no_placeholder(self):
        path = _make_docx(["플레이스홀더가 없는 문단입니다."])
        parser = DocxParser()
        results = parser.extract_placeholders(path)
        assert results == []

    def test_context_snippet_included(self):
        path = _make_docx(["앞부분 {{갑 제1호증}} 뒷부분"])
        parser = DocxParser()
        results = parser.extract_placeholders(path)
        assert "앞부분" in results[0]["context_snippet"]
        assert "뒷부분" in results[0]["context_snippet"]

    def test_char_offset_correct(self):
        text = "시작 {{갑 제1호증}} 끝"
        path = _make_docx([text])
        parser = DocxParser()
        results = parser.extract_placeholders(path)
        offset = results[0]["char_offset"]
        assert text[offset:offset + 2] == "{{"

    def test_list_paragraphs(self):
        path = _make_docx(["문단 1", "문단 2", "문단 3"])
        parser = DocxParser()
        paras = parser.list_paragraphs(path)
        assert "문단 1" in paras
        assert "문단 2" in paras
        assert "문단 3" in paras

    def test_deduplicate_same_position(self):
        # If two patterns match the same text at same position, should not duplicate
        path = _make_docx(["{{갑 제1호증}}"])
        parser = DocxParser()
        results = parser.extract_placeholders(path)
        # The double-brace pattern matches {{...}}, single-brace also could match {갑...}
        # inside — but the dedup key (para_idx, placeholder_text, char_offset) prevents dupe
        texts = [r["placeholder_text"] for r in results]
        assert len(texts) == len(set((r["paragraph_index"], r["placeholder_text"], r["char_offset"]) for r in results))
