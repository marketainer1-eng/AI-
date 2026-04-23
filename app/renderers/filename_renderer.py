"""
FilenameRenderer — computes planned filenames for evidence attachments.

Naming convention:
  갑 제N호증_[label].[ext]
  을 제N호증_[label].[ext]

Rules:
  - Filename computation is a PROJECTION.
  - Actual file rename on disk happens ONLY at commit time.
  - Illegal filename characters are sanitized.
"""

import re
from pathlib import Path

from app.api.schemas.preview import FileRenameEntryPreview


# Characters not allowed in filenames (Windows + Linux safe)
_ILLEGAL_CHARS = re.compile(r'[\\/:*?"<>|]')


def sanitize_filename(name: str) -> str:
    """Remove or replace characters illegal in filenames."""
    return _ILLEGAL_CHARS.sub("_", name).strip()


class FilenameRenderer:
    def render(
        self,
        case_id: int,
        evidence_repo,
        file_link_repo,
        file_repo,
        number_map: dict[int, str],
    ) -> list[FileRenameEntryPreview]:
        """
        Compute planned filenames for all evidence file attachments.

        Naming: {rendered_number}_{label}.{ext}
        If an evidence has multiple files, suffix _1, _2, ... is appended before the ext.
        """
        results: list[FileRenameEntryPreview] = []
        evidences = evidence_repo.get_by_case(case_id)

        for evidence in sorted(evidences, key=lambda e: (e.party, e.sort_order)):
            rendered_number = number_map.get(evidence.id)
            if not rendered_number:
                continue

            links = file_link_repo.get_by_evidence(evidence.id)
            if not links:
                continue

            multi = len(links) > 1

            for link in sorted(links, key=lambda l: l.file_order):
                sf = file_repo.get_by_id(link.source_file_id)
                if not sf:
                    continue

                original_path = Path(sf.original_filename)
                ext = original_path.suffix  # e.g. ".docx", ".pdf"
                label_part = sanitize_filename(evidence.label)

                if multi:
                    planned_name = f"{rendered_number}_{label_part}_{link.file_order + 1}{ext}"
                else:
                    planned_name = f"{rendered_number}_{label_part}{ext}"

                # Only include if rename is needed
                if sf.original_filename != planned_name:
                    results.append(
                        FileRenameEntryPreview(
                            source_file_id=sf.id,
                            current_filename=sf.original_filename,
                            planned_filename=planned_name,
                        )
                    )

        return results
