# JARAK AMAN — Modul Safety Induction & Pemantauan Pekerja (MyHSSE v0.7)

Prototipe interaktif **4 peran** untuk Action Learning Project (ALP) Kelompok 36 — **PT Pelabuhan Indonesia (Persero)**.  
Dirancang sebagai *quick win* perangkat lunak murni di dalam **MyHSSE** (tanpa sensor atau perangkat keras baru pada alat maupun pekerja), mengacu pada [PRD_JARAK_AMAN_MyHSSE_v0.7.md](./docs/PRD_JARAK_AMAN_MyHSSE_v0.7.md) dan [Handbook_Presentasi_ALP36_JARAK_AMAN_v3.md](./docs/Handbook_Presentasi_ALP36_JARAK_AMAN_v3.md).

---

## Menjalankan Secara Lokal (`file://` atau HTTP)

- **Langsung klik ganda:** Buka [`app/index.html`](./app/index.html) di Chrome/Edge (tidak perlu Node/server).
- **Via local server (opsional):**
  ```bash
  py -m http.server 8080
  # Buka http://localhost:8080/app/
  ```

---

## Deploy Gratis ke GitHub Pages / Netlify / Cloudflare Pages

1. Push folder ini ke repository GitHub baru (saran nama: `jarak-aman-myhsse`).
2. Di GitHub: **Settings → Pages → Build and deployment → Deploy from a branch** (`main` / root `/`).
3. URL demo utama: `https://<username>.github.io/jarak-aman-myhsse/`
4. URL khusus **QR Code HP Pekerja** (untuk dipindai peserta saat presentasi):
   `https://<username>.github.io/jarak-aman-myhsse/?view=mobile`

---

## Alur Demo 4 Peran (Untuk Tim K3 / HSSE & MyHSSE)

1. **Split View (`HP Pekerja` + `Ruang Kendali`):**
   - Tunjukkan **Safety Induction Harian (F11)** pada HP (selfie APD + gagal/ulang, kuis evakuasi, info bahaya).
   - Kirim laporan **Near Miss ≤ 30 detik (F12)** dari HP → langsung muncul di **Antrean Alarm**, **Peta Titik Rawan**, dan **Usulan Editor Induction** di Ruang Kendali.
   - Setujui revisi baru (**Rev 2**) dengan opsi *Wajib baca ulang* → banner darurat langsung tampil di HP.
2. **Kiosk Pos Gate (`Tanpa HP`, FR-11.8):**
   - Simulasikan TKBM / sopir truk tanpa smartphone (termasuk jumlah penumpang & APD pinjaman) + toggle **ID / EN**. Data langsung menambah headcount di Ruang Kendali.
3. **Evakuasi & Rute Per Jenis Bahaya (Modul 1b):**
   - Di Ruang Kendali, pilih `Perintahkan evakuasi` (**Tsunami → Gedung Evakuasi B**, **Gempa → Area Terbuka Timur**, mode **Sungguhan / LATIHAN**).
   - Toggle tampilan HP antara **iOS Dynamic Island** dan **Android 16 Notifikasi Progres**.
   - Tutup `Jalan Dermaga B` di Ruang Kendali → HP otomatis beralih ke rute cadangan.
4. **Tablet Petugas Titik Kumpul (FR-3.3):**
   - Aktifkan `Mode Tanpa Sinyal` (offline queue), lakukan `Konfirmasi Terpilih Aman`, lalu kembali ke `Online` untuk menyinkronkan headcount ke daftar SAR Ruang Kendali.

---

## Verifikasi Otomatis

```powershell
node --test tests/store.test.js
py tests/e2e_smoke.py
py tests/e2e_mobile.py
py tests/e2e_control.py
py tests/e2e_closed_loop.py
```
