from pathlib import Path
from playwright.sync_api import sync_playwright

APP_URL = Path(r"c:\GitHub\PELINDO\jarak-aman\app\index.html").resolve().as_uri()

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)

        page.goto(APP_URL, wait_until="load")
        assert "MyHSSE" in page.locator(".shell-brand").inner_text()
        for view_id in ["split", "mobile", "control", "kiosk", "marshal"]:
            assert page.locator(f'[data-view-btn="{view_id}"]').is_visible()

        initial_theme = page.evaluate("document.documentElement.dataset.theme")
        assert initial_theme == "dark"

        # Switching views keeps global theme without per-view overrides
        for view_id in ["mobile", "control", "kiosk", "marshal", "split"]:
            page.click(f'[data-view-btn="{view_id}"]')
            assert page.evaluate("document.documentElement.dataset.theme") == "dark"

        page.click("#btn-theme-toggle")
        toggled_theme = page.evaluate("document.documentElement.dataset.theme")
        assert toggled_theme == "light"

        # Verify shell bar, control room map, and phone mini-map respond to light tokens
        shell_bg = page.evaluate("getComputedStyle(document.querySelector('.shell-bar')).backgroundColor")
        map_bg = page.evaluate("getComputedStyle(document.querySelector('.terminal-map-box')).backgroundColor")
        assert shell_bg == "rgb(255, 255, 255)", f"Expected light shell-bar bg, got {shell_bg}"
        assert map_bg == "rgb(248, 250, 252)", f"Expected light map bg, got {map_bg}"

        # Cross-tab live sync + persistence across ?view=mobile navigation
        tab2 = page.context.new_page()
        tab2.goto(APP_URL + "?view=kiosk", wait_until="load")
        assert tab2.evaluate("document.documentElement.dataset.theme") == "light"
        page.click("#btn-theme-toggle")
        tab2.wait_for_function("document.documentElement.dataset.theme === 'dark'")
        tab2.close()

        # Re-toggle to light, navigate to ?view=mobile, verify persisted light theme
        page.click("#btn-theme-toggle")
        page.goto(APP_URL + "?view=mobile", wait_until="load")
        assert page.evaluate("document.documentElement.dataset.theme") == "light"
        assert page.locator("#mount-mobile").is_visible()
        assert not page.locator("#mount-control").is_visible()
        assert not page.locator("#mount-kiosk").is_visible()
        assert not page.locator("#mount-marshal").is_visible()

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_smoke.py: PASS")

if __name__ == "__main__":
    run()
