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

        # 1. Scenario 4: Selfie APD fail -> blocked -> photo retake -> confirm shoes -> advance to Step 2
        page.click('[data-scenario="apdfail"]')
        assert "Selfie dengan APD lengkap" in page.locator("#mount-mobile").inner_text()
        page.click('[data-mobile-action="ind-next"]') # Ambil foto (fails helm)
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

        # 4. Dynamic Island vs Android 16 toggle during evacuation
        page.click('[data-scenario="island"]')
        assert page.locator(".ja-island").is_visible()
        page.click('[data-os-toggle="android"]')
        assert page.locator(".android-notif-banner").is_visible()

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_mobile.py: PASS")

if __name__ == "__main__":
    run()
