from types import SimpleNamespace

from rag.parse import VIOLATION_TOOL, _normalize, violations_from_tool_response


def _tool_message(violations):
    block = SimpleNamespace(
        type="tool_use",
        name=VIOLATION_TOOL["name"],
        input={"violations": violations},
    )
    return SimpleNamespace(content=[block])


def test_extracts_violations_from_tool_block():
    message = _tool_message([
        {
            "criterion": "1.1.1",
            "criterion_name": "Non-text Content",
            "level": "A",
            "line_number": 4,
            "description": "img has no alt",
            "fix": "add alt",
        }
    ])
    result = violations_from_tool_response(message)
    assert len(result) == 1
    assert result[0]["criterion"] == "1.1.1"
    assert result[0]["line_number"] == 4


def test_empty_violations_list():
    assert violations_from_tool_response(_tool_message([])) == []


def test_no_tool_block_returns_empty():
    text_block = SimpleNamespace(type="text", name=None, input=None)
    message = SimpleNamespace(content=[text_block])
    assert violations_from_tool_response(message) == []


def test_non_dict_entries_are_skipped():
    message = _tool_message(["garbage", 42, None])
    assert violations_from_tool_response(message) == []


def test_normalize_invalid_line_numbers_become_none():
    assert _normalize({"line_number": 0})["line_number"] is None
    assert _normalize({"line_number": -3})["line_number"] is None
    assert _normalize({"line_number": "7"})["line_number"] is None
    assert _normalize({"line_number": None})["line_number"] is None
    assert _normalize({"line_number": 12})["line_number"] == 12


def test_normalize_level_defaults_to_a_when_invalid():
    assert _normalize({"level": "AAAA"})["level"] == "A"
    assert _normalize({"level": "aa"})["level"] == "AA"
    assert _normalize({})["level"] == "A"


def test_normalize_strips_whitespace():
    v = _normalize({"criterion": " 1.4.3 ", "description": "  low contrast  ", "fix": " x "})
    assert v["criterion"] == "1.4.3"
    assert v["description"] == "low contrast"
    assert v["fix"] == "x"
