from pathlib import Path
from playwright.sync_api import sync_playwright

APP_URL = Path(r"c:\GitHub\PELINDO\jarak-aman\app\index.html").resolve().as_uri()

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.set_default_timeout(3000)
        errors = []
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)

        page.goto(APP_URL, wait_until="load")

        # 1. Kiosk Gate: toggle EN -> ID, check-in TKBM Suherman + 1 passenger + PPE enforcement + borrowed APD
        page.click('[data-view-btn="kiosk"]')
        page.click('[data-kiosk-lang="en"]')
        assert "Gate Check-In & Safety Induction" in page.locator("#mount-kiosk").inner_text()
        page.click('[data-kiosk-lang="id"]')

        page.fill('#kiosk-name', 'Suherman')
        page.fill('#kiosk-card', 'TKBM-881')
        page.click('[data-kiosk-action="pass-inc"]')
        page.click('[data-kiosk-action="next-step"]') # -> step 2
        page.click('[data-kiosk-action="next-step"]') # -> step 3
        # Uncheck Helm -> submit must be disabled until Pinjam APD is toggled
        page.click('[data-kiosk-apd="apdHelm"]')
        assert page.locator('[data-kiosk-action="submit-checkin"]').is_disabled()
        page.click('[data-kiosk-action="toggle-borrow"]')
        assert page.locator('[data-kiosk-action="submit-checkin"]').is_enabled()
        page.click('[data-kiosk-action="submit-checkin"]') # -> step 4
        assert "Suherman" in page.locator("#mount-kiosk").inner_text()

        # Verify Control Room headcount increased from 24 to 26
        page.click('[data-view-btn="control"]')
        assert "26" in page.locator(".ctrl-kpi-grid").inner_text()

        # 2. Split View: Mobile near-miss -> Control Room Alarm + Heatmap + Induction Rev 2 + Reread banner
        page.click('[data-view-btn="split"]')
        page.click('[data-scenario="report"]')
        page.click('[data-report-cat="nm"]')
        page.fill('#mobile-report-note', 'Forklift hampir menyenggol di C3')
        page.click('[data-mobile-action="send-report"]')
        assert "Forklift hampir menyenggol di C3" in page.locator("#mount-control").inner_text()

        page.click('[data-ctrl-tab="induction"]')
        page.click('[data-ind-add="c1"]')
        page.click('[data-ctrl-action="toggle-reread"]')
        page.click('[data-ctrl-action="submit-ind"]')
        page.click('[data-ctrl-action="approve-ind"]')
        assert "INFO DARURAT BARU" in page.locator("#mount-mobile").inner_text()

        # 3. Trigger Gempa evacuation -> Mobile routes to Area Terbuka Timur
        page.click('[data-ctrl-tab="map"]')
        page.click('[data-ctrl-action="open-confirm"]')
        page.click('[data-draft-hazard="gempa"]')
        page.click('[data-ctrl-action="send-evac"]')
        assert "Area Terbuka Timur" in page.locator("#mount-mobile").inner_text()

        # 4. Marshal Tablet: Offline queue -> bulk confirm Oki & Suherman -> go Online -> syncs to Control Room
        page.click('[data-view-btn="marshal"]')
        page.click('[data-marshal-action="toggle-offline"]')
        assert "Tanpa Sinyal" in page.locator("#mount-marshal").inner_text()
        page.click('[data-marshal-bulk="Oki"]')
        page.click('[data-marshal-bulk="Suherman"]')
        page.click('[data-marshal-action="bulk-confirm"]')
        assert "2 antrean offline" in page.locator("#mount-marshal").inner_text()

        # Still offline: Oki not Aman in Control Room yet
        page.click('[data-view-btn="control"]')
        assert "Oki" in page.locator("#mount-control").inner_text()

        # Back online -> flushes queue
        page.click('[data-view-btn="marshal"]')
        page.click('[data-marshal-action="toggle-offline"]')
        assert "0 antrean" in page.locator("#mount-marshal").inner_text() or "Sinkron Real-time" in page.locator("#mount-marshal").inner_text()

        page.click('[data-view-btn="control"]')
        page.click('[data-ctrl-action="export-sar"]')
        sar_text = page.locator("#modal-portal").inner_text()
        assert "Oki" not in sar_text
        assert "Suherman" not in sar_text
        page.click('[data-modal-close]')

        # 5. Zone-scoped Dermaga evacuation excludes Lapangan C workers from Marshal "Perlu Konfirmasi"
        page.click('[data-view-btn="control"]')
        page.click('[data-ctrl-action="end-evac"]')
        page.click('[data-ctrl-action="reopen-zones"]')
        page.click('[data-ctrl-action="open-confirm"]')
        page.click('[data-draft-hazard="tsunami"]')
        page.click('[data-draft-zone="dermaga"]')
        page.click('[data-ctrl-action="send-evac"]')
        page.click('[data-view-btn="marshal"]')
        page.click('[data-marshal-filter="pending"]')
        marshal_pending = page.locator("#mount-marshal").inner_text()
        assert "Oki" in marshal_pending
        assert "Joko" not in marshal_pending

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_closed_loop.py: PASS")

if __name__ == "__main__":
    run()
