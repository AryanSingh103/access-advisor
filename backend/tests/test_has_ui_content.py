import pytest

from rag.query import has_ui_content


@pytest.mark.parametrize(
    "content",
    [
        '<div class="card">hello</div>',
        "<button>Go</button>",
        '<img src="x.png">',
        "<table><tr><td>1</td></tr></table>",
        "<h1>Title</h1>",
        "<h3>Sub</h3>",
        '<video src="a.mp4"></video>',
        '<iframe src="x"></iframe>',
        "<ul><li>item</li></ul>",
        "<nav>links</nav>",
        "<dialog open>hi</dialog>",
        "export default function App() { return <div /> } // .tsx file",
    ],
)
def test_ui_markup_is_detected(content):
    assert has_ui_content(content)


@pytest.mark.parametrize(
    "content",
    [
        "def add(a, b):\n    return a + b",
        "SELECT * FROM users;",
        "# A README heading\nplain prose only",
        "const x = 1 + 2;",
        "",
    ],
)
def test_non_ui_content_is_skipped(content):
    assert not has_ui_content(content)
