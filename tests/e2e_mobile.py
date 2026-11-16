from pathlib import Path
from playwright.sync_api import sync_playwright

APP_URL = Path(r"c:\GitHub\PELINDO\jarak-aman\app\index.html").resolve().as_uri() + "?view=mobile"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors = []
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)

        page.goto(APP_URL, wait_until="load")

        # 1. Scenario 4: Selfie APD fail (immediate) -> photo retake -> confirm shoes -> advance to Step 2
        page.click('[data-scenario="apdfail"]')
        assert "Helm tidak terdeteksi" in page.locator("#mount-mobile").inner_text()
        page.click('[data-mobile-action="ind-next"]') # Foto ulang (ok)
        assert "Konfirmasi sepatu safety" in page.locator("#mount-mobile").inner_text()
        page.click('[data-mobile-action="toggle-shoes"]')
        page.click('[data-mobile-action="ind-next"]') # -> Step 2

        # 2. Step 2 quiz -> Step 3 -> Finish induction
        assert "Panduan evakuasi zona Anda" in page.locator("#mount-mobile").inner_text()
        page.click('[data-quiz-opt="b"]')
        page.click('[data-mobile-action="ind-next"]') # -> Step 3
        assert "Bahaya dan kelalaian hari ini" in page.locator("#mount-mobile").inner_text()
        page.click('[data-mobile-action="ind-next"]') # -> indDone
        assert "Safety induction selesai" in page.locator("#mount-mobile").inner_text()

        # 3. 30s CLSR Report -> pushes live alarm
        page.click('[data-scenario="report"]')
        assert "Apa yang Anda lihat?" in page.locator("#mount-mobile").inner_text()
        page.click('[data-report-cat="nm"]')
        page.click('[data-mobile-action="send-report"]')
        assert "LP-0" in page.locator("#mount-mobile").inner_text()

        # 4. Dynamic Island vs Lock Screen & external sim controls (Android 16 toggle removed)
        page.click('[data-scenario="island"]')
        assert page.locator("[data-os-toggle]").count() == 0
        assert page.locator(".ja-island.is-live").is_visible()
        # Verify simulator view tabs are outside .phone-frame
        assert page.locator(".phone-frame [data-evac-view]").count() == 0
        assert page.locator(".sim-controls-bar [data-evac-view]").count() == 3
        # Verify Dynamic Island expands on click
        page.click('[data-mobile-action="toggle-island"]')
        assert page.locator(".ja-island.is-expanded").is_visible()
        # Switch to Lock Screen view
        page.click('[data-evac-view="lock"]')
        assert "LIVE ACTIVITY" in page.locator(".phone-frame").inner_text()

        # 5. Verify true tall smartphone aspect ratio (>= 1.95) and zero vertical scrollbar overflow across scenarios
        box = page.locator(".phone-frame").bounding_box()
        assert box is not None and box["height"] / box["width"] >= 1.95, f"Skewed phone aspect ratio: {box}"
        for sc in ["reg", "enter", "induct", "apdfail", "mandiri", "bmkg", "island", "arrive", "report", "out"]:
            page.click(f'[data-scenario="{sc}"]')
            overflow = page.evaluate("() => { const el = document.querySelector('.phone-scroll'); return el ? (el.scrollHeight - el.clientHeight) : 0; }")
            assert overflow <= 2, f"Phone scroll overflow ({overflow}px) on scenario {sc}"

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_mobile.py: PASS")

if __name__ == "__main__":
    run()
