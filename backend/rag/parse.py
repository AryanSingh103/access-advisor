"""Shared violation schema for structured extraction via Claude tool use."""

VIOLATION_TOOL = {
    "name": "report_violations",
    "description": (
        "Report all WCAG 2.1 accessibility violations found in the analyzed content. "
        "Call this exactly once with the complete list; pass an empty list if none were found."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "violations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "criterion": {
                            "type": "string",
                            "description": "Success criterion number, e.g. '1.1.1'",
                        },
                        "criterion_name": {
                            "type": "string",
                            "description": "Success criterion name, e.g. 'Non-text Content'",
                        },
                        "level": {
                            "type": "string",
                            "enum": ["A", "AA", "AAA"],
                        },
                        "line_number": {
                            "type": ["integer", "null"],
                            "description": (
                                "Line number where the violation occurs. For diffs: the NEW-file "
                                "line number derived from @@ hunk headers. Null if not determinable."
                            ),
                        },
                        "description": {
                            "type": "string",
                            "description": "The specific issue found in this content",
                        },
                        "fix": {
                            "type": "string",
                            "description": "Exact code change that fixes the violation",
                        },
                    },
                    "required": ["criterion", "criterion_name", "level", "description", "fix"],
                },
            }
        },
        "required": ["violations"],
    },
}


def violations_from_tool_response(message) -> list[dict]:
    """Extract and normalize the violations list from a Claude tool-use response."""
    for block in message.content:
        if block.type == "tool_use" and block.name == VIOLATION_TOOL["name"]:
            raw = block.input.get("violations", [])
            return [_normalize(v) for v in raw if isinstance(v, dict)]
    return []


def _normalize(v: dict) -> dict:
    line = v.get("line_number")
    if not isinstance(line, int) or line < 1:
        line = None
    level = str(v.get("level", "")).strip().upper()
    return {
        "criterion": str(v.get("criterion", "")).strip(),
        "criterion_name": str(v.get("criterion_name", "")).strip(),
        "level": level if level in ("A", "AA", "AAA") else "A",
        "line_number": line,
        "description": str(v.get("description", "")).strip(),
        "fix": str(v.get("fix", "")).strip(),
    }
