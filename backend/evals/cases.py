"""Hand-authored WCAG 2.1 eval cases.

Each case is a minimal HTML/JSX snippet containing ONE clear, well-known
violation. `expected` is the success criterion any correct reviewer must
report. `also_acceptable` lists criteria that a reasonable reviewer may
additionally flag on the same snippet without being wrong.
"""

CASES = [
    # --- 1.1.1 Non-text Content ---
    {"id": "img_no_alt", "expected": "1.1.1", "also_acceptable": [],
         "code": '<img src="/logo.png">'},
    {"id": "input_image_no_alt", "expected": "1.1.1", "also_acceptable": ["4.1.2"],
         "code": '<input type="image" src="/search.png">'},
    {"id": "icon_button_no_name", "expected": "4.1.2", "also_acceptable": ["1.1.1", "2.4.4"],
         "code": '<button class="icon-btn"><svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg></button>'},

    # --- 1.2.x Time-based media ---
    {"id": "video_no_captions", "expected": "1.2.2", "also_acceptable": ["1.2.3", "1.2.5"],
         "code": '<video src="/promo.mp4" controls></video>'},
    {"id": "audio_no_transcript", "expected": "1.2.1", "also_acceptable": [],
         "code": '<audio src="/podcast-ep1.mp3" controls></audio>'},

    # --- 1.3.1 Info and Relationships ---
    {"id": "input_no_label", "expected": "1.3.1", "also_acceptable": ["3.3.2", "4.1.2"],
         "code": '<input type="email" placeholder="Email address" name="email">'},
    {"id": "fake_heading", "expected": "1.3.1", "also_acceptable": ["2.4.6"],
         "code": '<div style="font-size:32px;font-weight:bold">Quarterly Results</div>'},
    {"id": "layout_table_no_headers", "expected": "1.3.1", "also_acceptable": [],
         "code": '<table><tr><td>Name</td><td>Score</td></tr><tr><td>Ada</td><td>99</td></tr></table>'},
    {"id": "radio_group_no_fieldset", "expected": "1.3.1", "also_acceptable": ["3.3.2"],
         "code": '<div><input type="radio" name="plan" value="a"> Basic<input type="radio" name="plan" value="b"> Pro</div>'},

    # --- 1.3.5 Identify Input Purpose ---
    {"id": "no_autocomplete", "expected": "1.3.5", "also_acceptable": ["1.3.1"],
         "code": '<label for="fn">First name</label><input id="fn" type="text" name="fname">'},

    # --- 1.4.x Contrast / visual ---
    {"id": "low_contrast_text", "expected": "1.4.3", "also_acceptable": [],
         "code": '<p style="color:#bbbbbb;background:#ffffff">Read our terms and conditions.</p>'},
    {"id": "color_only_meaning", "expected": "1.4.1", "also_acceptable": ["1.3.3"],
         "code": '<p>Fields marked in <span style="color:red">red</span> are required.</p>'},
    {"id": "no_zoom_viewport", "expected": "1.4.4", "also_acceptable": ["1.4.10"],
         "code": '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">'},
    {"id": "text_in_image", "expected": "1.4.5", "also_acceptable": ["1.1.1"],
         "code": '<img src="/pricing-table.png" alt="Pricing: Basic $10, Pro $25, Enterprise $99">'},

    # --- 2.1.1 Keyboard ---
    {"id": "div_onclick", "expected": "2.1.1", "also_acceptable": ["4.1.2"],
         "code": '<div onclick="submitForm()">Submit</div>'},
    {"id": "positive_tabindex", "expected": "2.4.3", "also_acceptable": ["1.3.2"],
         "code": '<input tabindex="5" name="a"><input tabindex="3" name="b"><input tabindex="9" name="c">'},

    # --- 2.2.x Timing ---
    {"id": "auto_refresh", "expected": "2.2.1", "also_acceptable": ["2.2.4", "3.2.5"],
         "code": '<meta http-equiv="refresh" content="15">'},
    {"id": "marquee_no_pause", "expected": "2.2.2", "also_acceptable": [],
         "code": '<marquee>Breaking news: sale ends today!</marquee>'},

    # --- 2.3.1 Flashing ---
    {"id": "flashing_animation", "expected": "2.3.1", "also_acceptable": [],
         "code": '<div class="strobe" style="animation: flash 0.1s infinite alternate">SALE</div>'},

    # --- 2.4.x Navigation ---
    {"id": "no_skip_link", "expected": "2.4.1", "also_acceptable": [],
         "code": '<body><nav><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a></nav><main><h1>Docs</h1></main></body>'},
    {"id": "no_page_title", "expected": "2.4.2", "also_acceptable": [],
         "code": '<html lang="en"><head><meta charset="utf-8"></head><body><h1>Report</h1></body></html>'},
    {"id": "click_here_link", "expected": "2.4.4", "also_acceptable": ["2.4.9"],
         "code": '<p>To read the full accessibility policy, <a href="/policy.pdf">click here</a>.</p>'},
    {"id": "focus_outline_removed", "expected": "2.4.7", "also_acceptable": [],
         "code": '<style>a:focus, button:focus { outline: none; }</style>'},

    # --- 2.5.x Input modalities ---
    {"id": "tiny_target", "expected": "2.5.5", "also_acceptable": [],
         "code": '<a href="/x" style="display:inline-block;width:12px;height:12px">×</a>'},

    # --- 3.1.x Language ---
    {"id": "no_lang_attr", "expected": "3.1.1", "also_acceptable": [],
         "code": '<html><head><title>Shop</title></head><body><p>Welcome</p></body></html>'},
    {"id": "no_lang_of_parts", "expected": "3.1.2", "also_acceptable": [],
         "code": '<html lang="en"><body><p>Our motto is <span>c\'est la vie</span>.</p></body></html>'},

    # --- 3.2.x Predictable ---
    {"id": "onchange_navigates", "expected": "3.2.2", "also_acceptable": ["3.2.5"],
         "code": '<select onchange="window.location=this.value"><option value="/a">A</option><option value="/b">B</option></select>'},

    # --- 3.3.x Input assistance ---
    {"id": "error_color_only", "expected": "3.3.1", "also_acceptable": ["1.4.1"],
         "code": '<input name="zip" class="error" style="border-color:red"><span style="color:red">!</span>'},
    {"id": "required_not_indicated", "expected": "3.3.2", "also_acceptable": ["1.3.1"],
         "code": '<form><input type="password" name="pw" required><button>Sign in</button></form>'},

    # --- 4.1.2 Name, Role, Value ---
    {"id": "fake_checkbox", "expected": "4.1.2", "also_acceptable": ["2.1.1"],
         "code": '<div class="checkbox" data-checked="false" onclick="toggle(this)"></div>'},
]

assert len({c["id"] for c in CASES}) == len(CASES), "duplicate case ids"
