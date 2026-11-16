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
        page.set_default_timeout(10000)

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

        # 6. Kiosk Gate Spotlight Tour: walks 1/6 -> 6/6, preserves worker count, restores draft on close
        page.click('[data-view-btn="kiosk"]')
        page.click('[data-kiosk-action="reset-flow"]')
        page.fill('#kiosk-name', 'DraftTemp')
        page.click('[data-kiosk-action="start-tour"]')
        assert "1 / 6" in page.locator(".kiosk-tour-card").inner_text()
        page.click('[data-kiosk-action="tour-next"]')
        assert page.locator("#kiosk-name").input_value() == "Slamet"
        for _ in range(4):
            page.click('[data-kiosk-action="tour-next"]')
        assert "6 / 6" in page.locator(".kiosk-tour-card").inner_text()
        page.click('[data-kiosk-action="close-tour"]')
        assert page.locator(".kiosk-tour-card").count() == 0
        assert page.locator("#kiosk-name").input_value() == "DraftTemp"

        # 7. Split: HP + Kendali Spotlight Tour: walks 1/8 -> 8/8, avoids overlap at 1280x720, restores pre-tour state
        page.click('[data-view-btn="control"]')
        assert not page.locator('[data-ctrl-action="start-split-tour"]').is_visible()
        page.click('[data-view-btn="split"]')
        assert page.locator('[data-ctrl-action="start-split-tour"]').is_visible()

        page.set_viewport_size({"width": 1280, "height": 720})
        pre_control_text = page.locator("#mount-control").inner_text()
        assert "PERINTAH EVAKUASI · KOMANDAN INSIDEN" in pre_control_text

        page.click('[data-ctrl-action="start-split-tour"]')
        assert "1 / 8" in page.locator(".split-tour-card").inner_text()

        def assert_no_card_spotlight_overlap():
            spot = page.locator(".split-tour-spotlight").bounding_box()
            card = page.locator(".split-tour-card").bounding_box()
            assert spot is not None and card is not None
            overlap_x = min(spot["x"] + spot["width"], card["x"] + card["width"]) - max(spot["x"], card["x"])
            overlap_y = min(spot["y"] + spot["height"], card["y"] + card["height"]) - max(spot["y"], card["y"])
            assert not (overlap_x > 2 and overlap_y > 2), f"Tour card overlaps spotlight: spot={spot}, card={card}"

        # Step 2: APD fail sync
        page.click('[data-split-tour="next"]')
        assert "2 / 8" in page.locator(".split-tour-card").inner_text()
        assert "Helm tidak terdeteksi" in page.locator("#mount-mobile").inner_text()
        assert "3 APD bermasalah" in page.locator("#mount-control").inner_text()
        assert_no_card_spotlight_overlap()

        # Step 3: Scenario dock
        page.click('[data-split-tour="next"]')
        assert "3 / 8" in page.locator(".split-tour-card").inner_text()

        # Step 4: Near Miss F12 -> Antrean Alarm
        page.click('[data-split-tour="next"]')
        assert "4 / 8" in page.locator(".split-tour-card").inner_text()
        assert "Forklift nyaris menyenggol" in page.locator("#mount-control").inner_text()

        # Step 5: Tab 2 Compliance & Hotspot
        page.click('[data-split-tour="next"]')
        assert "5 / 8" in page.locator(".split-tour-card").inner_text()
        assert "15 LAPORAN" in page.locator("#mount-control").inner_text()

        # Step 6: Tab 3 Induction Rev 2 -> INFO DARURAT BARU on phone
        page.click('[data-split-tour="next"]')
        assert "6 / 8" in page.locator(".split-tour-card").inner_text()
        assert "INFO DARURAT BARU" in page.locator("#mount-mobile").inner_text()
        assert_no_card_spotlight_overlap()

        # Step 7: Tsunami evac across both panes
        page.click('[data-split-tour="next"]')
        assert "7 / 8" in page.locator(".split-tour-card").inner_text()
        assert "Gedung Evakuasi B" in page.locator("#mount-mobile").inner_text()
        assert_no_card_spotlight_overlap()

        # Step 8: Road closed reroute
        page.click('[data-split-tour="next"]')
        assert "8 / 8" in page.locator(".split-tour-card").inner_text()
        assert "Rute Cadangan" in page.locator("#mount-mobile").inner_text()
        assert_no_card_spotlight_overlap()

        # Close restores pre-tour state cleanly
        page.click('.split-tour-card [data-split-tour="close"]')
        assert page.locator(".split-tour-card").count() == 0
        assert "PERINTAH EVAKUASI · KOMANDAN INSIDEN" in page.locator("#mount-control").inner_text()

        # Leaving split view auto-closes open tour
        page.click('[data-ctrl-action="start-split-tour"]')
        assert page.locator(".split-tour-card").is_visible()
        page.evaluate("document.querySelector('[data-view-btn=\"control\"]').click()")
        assert page.locator(".split-tour-card").count() == 0

        assert errors == [], f"Unexpected browser errors: {errors}"
        browser.close()
        print("e2e_closed_loop.py: PASS")

if __name__ == "__main__":
    run()
