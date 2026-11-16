from pathlib import Path
from playwright.sync_api import sync_playwright

APP_URL = Path(r"c:\GitHub\PELINDO\jarak-aman\app\index.html").resolve().as_uri()

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)

        page.goto(APP_URL, wait_until="load")
        assert "MyHSSE" in page.locator(".shell-brand").inner_text()
        for view_id in ["split", "mobile", "control", "kiosk", "marshal"]:
            assert page.locator(f'[data-view-btn="{view_id}"]').is_visible()

        initial_theme = page.evaluate("document.documentElement.dataset.theme")
        assert initial_theme in ("dark", "light")
        page.click("#btn-theme-toggle")
        toggled_theme = page.evaluate("document.documentElement.dataset.theme")
        assert toggled_theme != initial_theme

        # Query param ?view=mobile
        page.goto(APP_URL + "?view=mobile", wait_until="load")
        assert page.locator("#mount-mobile").is_visible()
        assert not page.locator("#mount-control").is_visible()
        assert not page.locator("#mount-kiosk").is_visible()
        assert not page.locator("#mount-marshal").is_visible()

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_smoke.py: PASS")

if __name__ == "__main__":
    run()
