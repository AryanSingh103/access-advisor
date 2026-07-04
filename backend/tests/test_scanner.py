import pytest
from fastapi import HTTPException

from routers import scanner
from routers.scanner import MAX_HTML_CHARS, _prepare_html, _validate_url


def _fake_getaddrinfo(ip: str):
    def fake(host, port):
        return [(2, 1, 6, "", (ip, 0))]

    return fake


def test_rejects_non_http_scheme():
    with pytest.raises(HTTPException) as exc:
        _validate_url("ftp://example.com")
    assert exc.value.status_code == 400


def test_rejects_missing_hostname():
    with pytest.raises(HTTPException):
        _validate_url("http://")


@pytest.mark.parametrize(
    "ip",
    ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.9", "169.254.169.254", "0.0.0.0"],
)
def test_rejects_private_and_internal_ips(monkeypatch, ip):
    monkeypatch.setattr(scanner.socket, "getaddrinfo", _fake_getaddrinfo(ip))
    with pytest.raises(HTTPException) as exc:
        _validate_url("http://evil.example.com")
    assert "private or internal" in exc.value.detail


def test_allows_public_ip(monkeypatch):
    monkeypatch.setattr(scanner.socket, "getaddrinfo", _fake_getaddrinfo("93.184.216.34"))
    _validate_url("https://example.com")  # should not raise


def test_rejects_unresolvable_hostname(monkeypatch):
    import socket as socket_mod

    def boom(host, port):
        raise socket_mod.gaierror("nope")

    monkeypatch.setattr(scanner.socket, "getaddrinfo", boom)
    with pytest.raises(HTTPException) as exc:
        _validate_url("http://does-not-exist.invalid")
    assert "resolve" in exc.value.detail


def test_prepare_html_strips_scripts_styles_svg():
    html = (
        "<div>keep</div><script>var x=1;</script><style>.a{}</style>"
        "<svg><path d='M0 0'/></svg><noscript>no</noscript><!-- comment -->"
    )
    cleaned = _prepare_html(html)
    assert "keep" in cleaned
    assert "var x=1" not in cleaned
    assert ".a{}" not in cleaned
    assert "path" not in cleaned
    assert "comment" not in cleaned


def test_prepare_html_caps_length():
    huge = "<p>x</p>" * 50_000
    cleaned = _prepare_html(huge)
    assert len(cleaned) <= MAX_HTML_CHARS + 100
    assert cleaned.endswith("<!-- truncated for analysis -->")
