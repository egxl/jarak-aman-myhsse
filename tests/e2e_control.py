from pathlib import Path
from playwright.sync_api import sync_playwright

APP_URL = Path(r"c:\GitHub\PELINDO\jarak-aman\app\index.html").resolve().as_uri() + "?view=control"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)

        page.goto(APP_URL, wait_until="load")
        page.set_default_timeout(3000)

        # 1. Fits inside 1440x900 without large vertical page bloat
        doc_height = page.evaluate("document.documentElement.scrollHeight")
        assert doc_height <= 940, f"Expected viewport-fit <= 940px, got {doc_height}"

        # 2. Switch tabs -> Kepatuhan & Titik Rawan -> Editor Induction -> back to Peta & Evakuasi
        page.click('[data-ctrl-tab="compliance"]')
        assert "Peta Titik Rawan Mingguan" in page.locator("#mount-control").inner_text()
        page.click('[data-compliance-filter="noapp"]')
        assert "Made" in page.locator("#mount-control").inner_text()

        page.click('[data-ctrl-tab="induction"]')
        page.click('[data-ind-add="c1"]')
        page.click('[data-ctrl-action="submit-ind"]')
        page.click('[data-ctrl-action="approve-ind"]')
        assert "Rev 2" in page.locator("#mount-control").inner_text() or "REV 2" in page.locator("#mount-control").inner_text()

        page.click('[data-ctrl-tab="map"]')

        # 3. 2-step Evacuation Command: Gempa + Dermaga A & B + LATIHAN
        page.click('[data-ctrl-action="open-confirm"]')
        page.click('[data-draft-hazard="gempa"]')
        page.click('[data-draft-zone="dermaga"]')
        page.click('[data-draft-drill="true"]')
        page.click('[data-ctrl-action="send-evac"]')
        ctrl_text = page.locator("#mount-control").inner_text()
        assert "LATIHAN · PERINTAH EVAKUASI" in ctrl_text
        assert "Area Terbuka Timur" in ctrl_text

        # 4. Open SAR export modal
        page.click('[data-ctrl-action="export-sar"]')
        assert "Ekspor Daftar SAR" in page.locator("#modal-portal").inner_text()
        page.click('[data-modal-close]')

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_control.py: PASS")

if __name__ == "__main__":
    run()
