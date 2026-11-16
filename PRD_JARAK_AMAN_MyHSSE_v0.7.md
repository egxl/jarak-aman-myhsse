# PRD JARAK AMAN — Safety Induction dan Pemantauan Pekerja di MyHSSE
> Nov 1, 2026 · @Someone  

---

## Ringkasan

JARAK AMAN adalah modul untuk aplikasi MyHSSE Pelindo. Modul ini memastikan setiap orang yang masuk area operasi, terutama pekerja eksternal seperti TKBM, sopir truk, dan pekerja mitra, sudah menjalani safety induction hari itu, posisinya di dalam area terpantau per zona, serta pelanggaran dan near miss di lapangan tercatat secara digital.
Modul ini dirancang sebagai quick win: hanya perangkat lunak, tanpa sensor atau perangkat baru di alat berat maupun di pekerja (keputusan kelompok, 16 Nov 2026).
- Inti (fase 1): safety induction harian yang terhubung ke data gate (F11), pemantauan posisi tingkat zona dan headcount (F4, F5), pelaporan pelanggaran dan near miss digital (F12), serta dashboard kepatuhan untuk ruang kendali dan HSSE (F7).
- Modul evakuasi (fase 1b): perintah evakuasi dari ruang kendali, panduan arah, timer, dan status Aman (F1–F3, F9, F10). Modul ini memakai data posisi yang sama.
- Roadmap (rekomendasi, di luar cakupan quick win): peringatan zona alat berbasis data TOS (F13), henti total lewat TOS (F8), dan integrasi deteksi jarak dekat dengan guidance system atau emergency stop internal Pelindo (F6).
Yang diselesaikan dan yang tidak. Modul ini menutup tiga celah: induksi pihak ketiga yang minim, pencatatan yang masih manual dan terpisah-pisah, serta tidak adanya data posisi orang di area. Modul ini tidak mencegah tabrakan secara langsung. Blind spot alat berat (kategori Mesin di fishbone) hanya bisa diatasi dengan deteksi di alat, yang masuk roadmap.
Output proyek ALP adalah rekomendasi siap kembang untuk tim pengembang MyHSSE, bukan pilot (keputusan kelompok, 2 Nov 2026).
> Versi 0.7 · draf untuk review tim K3, IT, dan pengembang MyHSSE · pemilik dokumen: [nama PIC]

---

## Latar belakang dan masalah

Korban jiwa di area operasi Pelindo hampir seluruhnya pekerja eksternal, sementara pengendalian yang ada sebagian besar masih berupa aturan dan sosialisasi.

| Tahun | Fatalitas karyawan | Fatalitas eksternal | Cedera karyawan | Cedera eksternal |
| --- | --- | --- | --- | --- |
| 2023 | 1 | 17 | 15 | 55 |
| 2024 | 1 | 5 | 23 | 48 |
| 2025 | 0 | 7 | 14 | 37 |

> **Sumber:** Sustainability Report Pelindo 2025, hlm. 125. Pada 2025, 85,71% fatalitas terjadi di dermaga dan 57,14% karena benturan (hlm. 126).
- Kejadian berulang. Reach stacker melindas orang dengan mekanisme serupa pada Januari 2024 (depo di kawasan Tanjung Perak, alat mundur dan operator tidak tahu ada orang di belakang) dan Juli 2026 (Pelabuhan Sikka, Maumere).
- Pihak eksternal. Evaluasi internal Pelindo menyebut sekitar 80% insiden kerja di pelabuhan yang dikelola Pelindo berasal dari aktivitas eksternal: kontraktor, PBM, dan koperasi TKBM (Jatim TIMES, 10 Okt 2025, mengutip Direktur SDM Pelindo Multi Terminal).
- Pengendalian saat ini. CLSR, identifikasi bahaya lewat MyHSSE, kampanye Stop Fatality 2026, sosialisasi blind spot, CSMS (pilot sejak Okt 2025), aplikasi Port Safe di IPC TPK, dan Fit to Work. Sebagian besar bersifat administratif. Menurut tim K3, MyHSSE masih dibenahi dan fungsinya pencatatan serta KPI kepatuhan; pencatatan pelanggaran masih manual dan terpisah-pisah; live tracking belum terintegrasi (mentoring K3, 12 Nov 2026).
- Celah KPI. Satu-satunya KPI K3 dalam KPI Direksi kolegial 2025 adalah LTIFR, dengan bobot 5 dari 100 dan target 0,93. Realisasinya 0,04, skor 110% (Laporan Tahunan 2025, hlm. 496 dan 624), padahal 7 pekerja eksternal meninggal pada tahun yang sama. K3 juga tidak menjadi parameter RJPP 2021–2025 (hlm. 457–458).
Masalah yang dijawab PRD ini: orang yang paling sering menjadi korban justru paling sedikit tersentuh induksi, posisinya di area tidak tercatat, dan bahaya yang mereka temui di lapangan tidak terekam sebagai data.

---

## Tujuan, non-tujuan, dan metrik

### Tujuan

1. Setiap orang yang masuk area operasi sudah menjalani safety induction hari itu sebelum turun ke lapangan, termasuk pekerja eksternal tanpa smartphone.
2. Ruang kendali tahu siapa ada di zona mana, dari data gate dan aplikasi, dan bisa melakukan headcount saat darurat.
3. Pelanggaran dan near miss tercatat digital dari lapangan, menjadi satu sumber data untuk MyHSSE, dan tindak lanjutnya terpantau.
4. HSSE punya indikator leading yang melengkapi LTIFR, terutama untuk pekerja eksternal.

### Non-tujuan

- Mencegah tabrakan orang–alat secara langsung atau memberi peringatan jarak dekat. Itu membutuhkan deteksi di alat (roadmap F6 dan F13).
- Memasang sensor atau perangkat baru di alat berat maupun di pekerja.
- Menilai kinerja atau disiplin kerja dari data lokasi.
- Melacak orang di luar area pelabuhan.
- Mengambil data peringatan dari BMKG atau sumber lain secara otomatis.
- Menggantikan ERP terminal, CLSR, CSMS, atau pengawasan lapangan.

### Metrik yang disarankan untuk Pelindo (hipotesis; baseline diambil dari data HSSE sebelum modul dipakai)

| Metrik | Target usulan | Jenis | Cara ukur |
| --- | --- | --- | --- |
| Orang di data gate yang terinduksi sebelum masuk zona kerja | ≥ 95% per hari, dipisah karyawan dan eksternal | Leading | Data gate dibanding catatan induction |
| Waktu rata-rata induction | ≤ 2 menit | Proses | Log aplikasi |
| Salah tolak deteksi APD | < 5% sebelum fitur diwajibkan | Kualitas | Banding ke petugas gate |
| Orang di area yang posisinya terpantau | ≥ 90% | Leading | Data gate dibanding heartbeat aplikasi |
| Laporan pelanggaran dan near miss digital | Naik dibanding baseline pencatatan manual | Leading | MyHSSE |
| Temuan ditutup tepat waktu | ≥ 95% | Leading | Antrean tindak lanjut |
| Headcount saat drill | 100% orang terhitung dalam ≤ 10 menit | Leading | Dashboard dan catatan petugas titik kumpul |
| Fatalitas dan LTI, dipisah karyawan dan eksternal | Tren turun | Lagging | Laporan HSSE |

Fatalitas tetap dicatat, tetapi tidak dipakai sebagai ukuran keberhasilan jangka pendek karena kejadiannya jarang. Yang bisa dibuktikan dalam bulan-bulan pertama adalah perubahan indikator leading.

---

## Pengguna

Ada sebelas kelompok pengguna. Prioritasnya pekerja eksternal, karena merekalah korban terbanyak.

| Pengguna | Akses | Kebutuhan utama | Catatan |
| --- | --- | --- | --- |
| Pekerja lapangan Pelindo (checker, tally, foreman) | Aplikasi MyHSSE | Induction, info zona hari ini, lapor bahaya | Di zona alat berat sepanjang shift |
| TKBM dan pekerja mitra | Aplikasi atau kiosk gate | Induction harian, info bahaya zona | Pihak ketiga; daftar dari koperasi TKBM |
| Sopir truk eksternal | Aplikasi, tautan web, atau kiosk gate | Induction singkat saat antre, instruksi soal truk | Terdata lewat STID dan transaksi gate; induction ditunda saat kendaraan bergerak |
| Operator alat berat | Aplikasi (di luar kabin) | Induction, info zona, lapor near miss | Dilarang memegang HP saat mengoperasikan alat |
| Tamu, ABK, dan petugas instansi lain | Kiosk atau pendaftaran di gate | Induction singkat dua bahasa | Tetap terhitung saat evakuasi |
| Petugas safety patrol dan HSSE lapangan | Aplikasi (peran khusus) | Mencatat pelanggaran dan near miss, cek APD acak | Menggantikan formulir manual |
| HSSE Terminal | Dashboard | Menyetujui konten induction, memantau kepatuhan dan temuan | Pemilik konten induction |
| Petugas ruang kendali (command center) | Dashboard | Memantau orang per zona dan antrean laporan, menyiapkan perintah evakuasi | Berjaga 24 jam |
| Komandan insiden | Dashboard atau tablet | Memerintahkan dan mencabut evakuasi | Ditunjuk dalam ERP terminal |
| Petugas gate | Kiosk atau tablet | Induction bagi orang tanpa HP, APD pinjaman | Mencatat hasil induction di pos gate |
| Petugas titik kumpul | Tablet | Mencocokkan orang yang hadir saat evakuasi | Tetap berjalan tanpa jaringan |

---

## Kebutuhan fungsional

Kebutuhan dibagi menjadi tiga kelompok: inti (fase 1, P0), modul evakuasi (fase 1b, P1), dan roadmap (rekomendasi di luar cakupan quick win). Nomor fitur dipertahankan dari versi sebelumnya agar rujukan FR tidak berubah; urutan di bawah mengikuti prioritas.

### Inti · fase 1 (P0)

Fitur-fitur ini adalah quick win: hanya perangkat lunak, memakai data gate yang sudah ada, dan langsung menjawab celah induksi, pencatatan, dan data posisi.

#### F11. Safety induction harian (P0)

Setiap orang yang masuk area menyelesaikan induction singkat sekali sehari sebelum turun ke lapangan. Fitur ini menjawab salah satu akar masalah di fishbone: pekerja pihak ketiga (TKBM, sopir) minim induksi dan pelatihan K3. Padahal 29 dari 31 korban jiwa di area operasi Pelindo pada 2023–2025 adalah pihak eksternal (Sustainability Report Pelindo 2025, hlm. 125).
Induction terdiri dari tiga langkah: selfie APD, panduan evakuasi, serta bahaya dan kelalaian hari ini. Isi langkah ketiga diperbarui dari dashboard ruang kendali.
- FR-11.1 Pemicu. Saat HP masuk geofence dan cocok dengan transaksi gate (F4), aplikasi meminta induction bila pengguna belum melakukannya hari itu. Induction berlaku sampai pengguna keluar gate, maksimal 24 jam. Masuk dan keluar berkali-kali di hari yang sama tidak mengulang induction. Untuk sopir, induction ditunda selama kendaraan bergerak dan diminta saat truk berhenti di area antrean.
- FR-11.2 Selfie APD. Model deteksi APD yang berjalan di HP memeriksa helm dan rompi. Sepatu safety dan sarung tangan tidak terlihat di selfie, jadi dikonfirmasi pengguna. Bila helm atau rompi tidak terdeteksi, induction tertahan: pengguna diminta memakai APD (tersedia APD pinjaman di pos gate) lalu foto ulang, dan dashboard menandai orang itu. Tidak ada pengenalan wajah. Yang dikirim ke server hanya hasil cek APD dan foto kecil untuk audit HSSE, dengan masa simpan terbatas (usulan 30 hari, diputuskan dalam kajian dampak privasi).
- FR-11.3 Panduan evakuasi. Isinya mengikuti zona kerja dari jadwal: titik kumpul terdekat, jarak, rute berbasis patokan, peta, dan tiga aturan utama. Satu pertanyaan cek pemahaman harus dijawab benar sebelum lanjut. Jawaban salah diberi penjelasan dan bisa dicoba lagi.
- FR-11.4 Bahaya dan kelalaian hari ini. Isinya empat kelompok: korban jiwa di area operasi Pelindo (data tahunan), kejadian terbaru (termasuk laporan near miss dari F12), kelalaian yang sering terjadi, dan info zona hari ini. Info yang berubah sejak kemarin diberi label BARU. Jumlah butir dibatasi (usulan maksimal 10) agar bisa dibaca dalam ±1 menit.
- FR-11.5 Editor di dashboard. Operator ruang kendali bisa menyembunyikan atau menampilkan butir, serta menambahkan butir dari usulan sistem: laporan pelanggaran dan near miss (F12), laporan petugas gate, jadwal operasi, dan near miss kemarin. Aplikasi asli juga menyediakan formulir isi bebas; di prototipe formulir ini diganti usulan siap pakai. Data korban jiwa tahunan terkunci dan hanya diubah HSSE saat laporan baru terbit.
- FR-11.6 Persetujuan dan versi. Perubahan dari operator berstatus draf dan baru terbit ke semua HP setelah disetujui HSSE. Setiap terbitan punya nomor revisi dan waktu terbit, dan HP menampilkan revisi yang sedang dipakai. Untuk info darurat, HSSE bisa mewajibkan orang yang sudah selesai membaca ulang langkah 3.
- FR-11.7 Status dan kepatuhan. Dashboard menampilkan status induction setiap orang: selesai (dengan jam), belum, APD tidak lengkap, atau di pos gate (tanpa aplikasi). Orang yang belum selesai menerima pengingat otomatis. Riwayat induction tersimpan untuk MyHSSE.
- FR-11.8 Tanpa aplikasi. Orang tanpa smartphone mengikuti induction di pos gate lewat layar atau poster, dengan pemeriksaan APD oleh petugas. Petugas mencatat hasilnya di dashboard.
**Kriteria penerimaan (target awal, ditetapkan ulang setelah uji kegunaan):**
- Pengguna dengan APD lengkap menyelesaikan induction dalam ≤ 2 menit.
- Konten yang disetujui HSSE sampai ke HP aktif dalam ≤ 5 menit; HP yang offline tetap menampilkan revisi terakhir yang tersimpan.
- Deteksi helm dan rompi diuji pada siang hari, malam hari, dan saat hujan; tingkat salah tolak dicatat sebelum fitur diwajibkan.
- Dashboard menampilkan status induction semua orang yang tercatat dari data gate.
**Catatan kritis.**
- Selfie hanya membuktikan APD dipakai saat foto diambil, bukan sepanjang shift. Induction tetap kontrol administratif; pengawasan lapangan tetap dibutuhkan, dan peringatan jarak dekat ada di roadmap (F6, F13).
- Tanpa pengenalan wajah, foto bisa saja diambil orang lain. Ini sengaja dipilih agar sistem tidak memproses data biometrik. Penggantinya adalah cek acak oleh petugas gate. Bila Pelindo ingin pencocokan wajah, perlu kajian dampak privasi tersendiri.
- Induction yang panjang atau isinya sama setiap hari akan dilewati tanpa dibaca. Karena itu jumlah butir dibatasi, ada label BARU, dan ada satu pertanyaan cek.
- Pertanyaan terbuka untuk Pelindo: apakah induction yang belum selesai boleh menahan palang gate, atau cukup ditandai di dashboard? Menahan palang gate menambah antrean truk.
- Perlu dicek apakah MyHSSE atau sistem gate sudah punya induction untuk tamu dan kontraktor, supaya F11 memperluas yang sudah ada dan tidak menduplikasinya.

#### F4. Live tracking di dalam area pelabuhan (P0)

Aplikasi melacak posisi pengguna, termasuk sopir truk, hanya selama ia berada di dalam area pelabuhan.
- FR-4.1 Tim K3 menggambar batas area pelabuhan (geofence) dan zona di dalamnya: dermaga, lapangan penumpukan, lapangan barang berbahaya, jalur alat, dan tepi dermaga.
- FR-4.2 Aktif otomatis. Aplikasi aktif sendiri saat HP memasuki geofence; tidak ada pindai QR atau langkah lain di gate. Pengguna diberi tahu lewat notifikasi "JARAK AMAN aktif" dan ikon tetap di layar.
- FR-4.3 Konfirmasi dengan data gate. Geofence bawaan HP bisa terlambat beberapa menit dan meleset ratusan meter. Karena itu status "di dalam area" dikonfirmasi dengan transaksi gate yang sudah ada (tap kartu pegawai atau TKBM, identitas truk). HP di luar pagar yang terdeteksi geofence tetapi tanpa transaksi gate tidak dihitung.
- FR-4.4 Selama di dalam area, aplikasi mengirim posisi setiap 10 detik saat bergerak dan setiap 60 detik saat diam.
- FR-4.5 Heartbeat. HP yang tidak mengirim sinyal lebih dari 5 menit ditandai tidak terpantau di dashboard. Saat pendaftaran, aplikasi memandu pengguna mengecualikan JARAK AMAN dari penghemat baterai, yang sering mematikan aplikasi di HP Android.
- FR-4.6 Tracking berhenti otomatis saat transaksi gate keluar tercatat, atau saat HP berada di luar geofence lebih dari 2 menit (usulan awal).
- FR-4.7 GPS hanya dipakai untuk zona (puluhan meter) dan headcount, tidak untuk peringatan jarak dekat.
- FR-4.8 Aplikasi meminta izin lokasi "selalu" dan menjelaskan alasannya. Bila izin ditolak, pengguna tetap terhitung lewat data gate dan status Aman otomatis di titik kumpul.
**Kriteria penerimaan:**
- Setelah transaksi gate keluar, server tidak menerima posisi apa pun dari HP tersebut.
- Dalam uji 1 minggu, tidak ada orang di luar pagar yang terhitung sebagai orang di area.
- Uji akurasi GPS di 20 titik terminal sebelum modul dipakai; hasilnya menentukan lebar minimum zona.

#### F5. Pendaftaran dan daftar orang di area (P0)

Pengguna mendaftar sekali, lalu tidak ada langkah tambahan di gate. Daftar orang di area disusun dari data gate dan data kerja, bukan dari jumlah orang yang memasang aplikasi.
- FR-5.1 Pendaftaran sekali dengan nomor HP dan identitas kerja (NIPP, kartu TKBM, atau kartu induksi sopir), persetujuan pemberitahuan privasi, dan uji izin lokasi serta notifikasi darurat.
- FR-5.2 Sumber data orang di area adalah gabungan transaksi gate, jadwal shift pegawai, daftar TKBM dari koperasi, daftar ABK dari agen kapal, dan pendaftaran tamu.
- FR-5.3 Orang tanpa smartphone atau tanpa aplikasi tetap terdata lewat gate dan tampil berlabel "tanpa aplikasi" di dashboard.
- FR-5.4 Tamu, ABK yang turun ke dermaga, dan petugas instansi lain didaftarkan di gate, dan menerima SMS peringatan bila memberikan nomor HP.
- FR-5.5 Saat evakuasi, dashboard menyusun daftar orang belum ditemukan dari selisih data orang di area dengan status Aman, lengkap dengan lokasi terakhir yang diketahui.
**Kriteria penerimaan:**
- Tidak ada langkah tambahan di gate dibanding prosedur sekarang.
- Daftar orang belum ditemukan siap diserahkan ke tim SAR ≤ 15 menit setelah perintah evakuasi.

#### F12. Pelaporan pelanggaran dan near miss digital (P0)

Pencatatan pelanggaran K3 di Pelindo masih manual dan datanya terpisah-pisah (mentoring K3, 12 Nov 2026). F12 memindahkan pencatatan itu ke aplikasi, sehingga setiap temuan punya lokasi, waktu, bukti, dan tindak lanjut yang terpantau.
- FR-12.1 Siapa yang melapor. Petugas safety patrol dan HSSE lapangan mencatat pelanggaran (unsafe act dan unsafe condition). Semua pengguna bisa melaporkan near miss dan kondisi berbahaya. Pekerja eksternal tanpa akun bisa melapor lewat QR di lapangan atau tautan web.
- FR-12.2 Isi laporan. Kategori (mengacu pada elemen CLSR, misalnya area terbatas dan posisi di zona aman), lokasi otomatis dari GPS dan zona, waktu, foto, keterangan singkat, serta alat atau pihak yang terlibat bila diketahui. Pelapor near miss boleh memilih anonim.
- FR-12.3 Cepat di lapangan. Laporan bisa dibuat dalam ≤ 30 detik dengan pilihan kategori. Laporan tersimpan di HP saat tidak ada sinyal dan terkirim otomatis saat sinyal kembali.
- FR-12.4 Tindak lanjut. Setiap laporan masuk antrean dengan penanggung jawab dan batas waktu penutupan sesuai tingkat risiko. Laporan berisiko tinggi langsung muncul di dashboard ruang kendali. Pelapor menerima status tindak lanjutnya.
- FR-12.5 Tanpa hukuman bagi pelapor near miss. Laporan near miss tidak dipakai untuk menjatuhkan sanksi kepada pelapornya. Pelanggaran yang dicatat petugas mengikuti mekanisme sanksi yang berlaku.
- FR-12.6 Satu sumber data. Semua laporan masuk MyHSSE. Temuan terbaru bisa diusulkan sebagai butir "kejadian terbaru" di safety induction harian (FR-11.5), dan lokasi laporan membentuk peta titik rawan mingguan (FR-7.7).
- FR-12.7 Selaras dengan yang sudah ada. Laporan dari Port Safe (IPC TPK) dan HSSE Dashboard (PTP Nonpetikemas) dipetakan ke kategori yang sama, agar data grup tidak terpisah lagi. Bentuk integrasinya ditentukan tim IT Pelindo.
**Kriteria penerimaan (target awal):**
- Laporan pelanggaran atau near miss selesai dibuat dalam ≤ 30 detik pada uji kegunaan.
- Laporan yang dibuat tanpa sinyal terkirim otomatis ≤ 5 menit setelah sinyal kembali.
- ≥ 95% temuan ditutup sebelum batas waktunya.
**Catatan kritis.** Near miss di F12 berasal dari laporan manusia, bukan deteksi otomatis, sehingga jumlahnya bergantung pada budaya melapor. Di awal penerapan, jumlah laporan yang naik adalah tanda baik, bukan tanda risiko bertambah.

#### F7. Dashboard ruang kendali (P0)

Dashboard adalah tempat ruang kendali melihat seluruh situasi dan mengambil tindakan.
- FR-7.1 Peta terminal real time: posisi pengguna (warna menurut status), alat berat beserta status geraknya bila data TOS tersedia (F13), zona, titik kumpul, dan ruas jalur yang ditutup.
- FR-7.2 Antrean alarm diurutkan menurut keparahan: Butuh bantuan, Belum keluar, alat belum berhenti, laporan pelanggaran dan near miss (F12). Setiap alarm bisa diambil alih petugas dan ditutup dengan catatan.
- FR-7.3 Mode evakuasi: hitungan Aman / Belum keluar / Butuh bantuan / Tidak terpantau per zona, sisa daya tampung tiap titik kumpul, dan posisi terakhir beserta waktu pembaruannya.
- FR-7.4 Kirim perintah evakuasi manual per jenis bahaya ke zona tertentu atau seluruh terminal, memakai template per jenis bahaya dan konfirmasi (F1); tutup ruas jalur evakuasi yang rusak atau terhalang.
- FR-7.5 Halaman admin K3 untuk mengatur zona, titik kumpul dan daya tampungnya, rute utama dan cadangan, timer per kelompok kerja, dan radius alarm.
- FR-7.6 Orang belum ditemukan. Daftar nama, peran, dan lokasi terakhir orang yang belum tercatat Aman, siap diekspor untuk tim SAR dan BPBD.
- FR-7.7 Laporan near miss dan peta titik rawan per minggu. Ekspor otomatis ke MyHSSE masuk P1; sebelum integrasi selesai cukup ekspor berkas.
- FR-7.8 Akses berbasis peran. Posisi orang secara real time diperlakukan sebagai data keamanan fasilitas pelabuhan sesuai rencana keamanan ISPS terminal. Setiap akses ke riwayat lokasi tercatat.
- FR-7.9 Ruang kendali dijaga 24 jam. SOS harus diambil alih ≤ 60 detik; bila tidak, alarm dieskalasi ke supervisor K3 lewat telepon atau radio.
- FR-7.10 Setiap SOS punya alur tindak lanjut tertulis: petugas menghubungi tim penyelamat lewat radio, mencatat waktu tiba, dan menutup alarm dengan hasilnya.
- FR-7.11 Pos komando cadangan. Dashboard bisa dijalankan dari tablet berbaterai di gedung evakuasi, karena ruang kendali bisa berada di zona bahaya atau kehilangan listrik. Perpindahan komando tercatat beserta waktunya.
- FR-7.12 Dashboard kepatuhan. Per zona dan per kelompok (karyawan, TKBM, sopir, tamu): jumlah orang di area dari data gate, persentase yang sudah induction, APD tidak lengkap, orang tanpa posisi, serta temuan pelanggaran dan near miss yang terbuka. Data bisa diekspor untuk laporan HSSE dan KPI.

### Modul evakuasi · fase 1b (P1)

Modul ini memakai data posisi dan daftar orang dari fase 1, dan dikerjakan setelah fitur inti stabil.

#### F1. Perintah evakuasi dari ruang kendali (P1)

Evakuasi hanya dimulai oleh perintah dari ruang kendali (command center). Sistem tidak mengambil data peringatan BMKG atau sumber lain secara otomatis (keputusan 15 Nov 2026). Petugas ruang kendali memantau info resmi BMKG lewat kanal yang sudah ada, laporan dari lapangan, dan kondisi terminal, lalu komandan insiden memutuskan.
- FR-1.1 Wewenang. Hanya komandan insiden dan wakil yang ditunjuk dalam ERP untuk setiap shift yang bisa mengirim perintah evakuasi. Akses diatur per peran, dan setiap perintah tercatat dengan nama, waktu, dan dasar keputusan.
- FR-1.2 Isi perintah. Jenis bahaya (tsunami, gempa, kebakaran atau kebocoran B3, angin kencang), zona terdampak atau seluruh terminal, tingkat (Waspada, Siaga, Awas), instruksi singkat, dan dasar keputusan (info BMKG yang dilihat petugas, laporan lapangan, atau pengamatan langsung). Rute dan timer mengikuti jenis bahaya (FR-2.3, FR-3.1).
- FR-1.3 Template dua ketukan. Setiap jenis bahaya punya template siap pakai. Komandan memilih template, lalu mengonfirmasi. Layar konfirmasi menampilkan ringkasan zona dan jumlah orang yang akan menerima perintah.
- FR-1.4 Kirim serentak. Satu perintah dikirim sekaligus ke notifikasi HP, SMS, sirene, dan radio. Henti total alat lewat TOS menyusul di fase 3 (F8).
- FR-1.5 Laporan lapangan sebagai masukan. Tombol Saya merasakan guncangan kuat (FR-2.10) dan SOS masuk ke antrean alarm sebagai laporan, dikelompokkan per zona (misalnya "3 laporan guncangan kuat di Dermaga B dalam 1 menit"). Laporan ini tidak memicu evakuasi seluruh terminal; keputusan tetap di komandan insiden.
- FR-1.6 Batal dan koreksi. Perintah yang salah bisa dibatalkan, atau zonanya diubah. HP menerima pembaruan dengan label yang jelas, misalnya "Perintah dibatalkan" atau "Zona diperluas".
- FR-1.7 Pos komando cadangan. Tablet di pos komando cadangan bisa mengirim perintah yang sama bila ruang kendali tidak bisa dipakai (FR-7.11).
- FR-1.8 Mode latihan. Drill memakai perintah berlabel LATIHAN di semua HP dan dashboard.
- FR-1.9 Data pendukung keputusan. Server tetap menerima arah dan kecepatan angin dari anemometer terminal untuk rute kebakaran dan B3. Setiap perintah dipetakan ke zona terminal.
**Kriteria penerimaan (target awal):**
- Komandan bisa mengirim perintah evakuasi ≤ 30 detik sejak membuka dashboard.
- ≥ 95% HP di zona menerima notifikasi ≤ 60 detik setelah perintah dikirim.
- Perintah latihan tidak pernah tampil tanpa label LATIHAN.
- Hanya peran berwenang yang bisa mengirim perintah, dan setiap perintah tercatat.
**Catatan kritis.**
- Menghapus integrasi BMKG menyederhanakan sistem dan menghindari masalah feed (Lampiran A), tetapi menambah jeda manusia: petugas harus melihat info BMKG, komandan harus memutuskan, lalu menekan tombol. SOP ruang kendali perlu menetapkan siapa yang memantau info BMKG di setiap shift dan berapa target waktu dari info diterima sampai perintah dikirim.
- Ruang kendali menjadi titik tunggal kegagalan. Wakil komandan per shift, pos komando cadangan, dan sirene manual tetap wajib.
- Untuk tsunami yang sumbernya dekat, gelombang bisa tiba sebelum perintah sempat dikirim. Karena itu evakuasi mandiri tetap diajarkan (FR-2.10, FR-11.3): guncangan kuat di dekat pantai berarti langsung bergerak tanpa menunggu notifikasi.

#### F2. Notifikasi bencana dan navigasi ke titik aman (P1)

Saat bencana, setiap pengguna di zona terdampak menerima notifikasi dan rute ke titik aman.
- FR-2.1 Notifikasi berbunyi keras, bergetar kuat, dan menembus mode senyap: jenis bahaya, tingkat bahaya, instruksi singkat, dan sumbernya (misalnya "Ruang kendali, 14.02 WIB"). Aplikasi meminta izin yang dibutuhkan: Critical Alerts di iOS (perlu persetujuan Apple) dan izin notifikasi darurat atau mode Jangan Ganggu di Android. Bila izin ditolak, dashboard menandai pengguna itu.
- FR-2.2 Peringatan yang sama tampil di dashboard dengan daftar zona dan jumlah orang di dalamnya.
- FR-2.3 Rute per jenis bahaya. Tsunami: ke tempat tinggi atau gedung evakuasi vertikal. Gempa: ke area terbuka, jauh dari tumpukan kontainer, crane, dan tepi dermaga. Kebakaran atau kebocoran B3: melawan arah angin dan di luar radius yang ditetapkan tim K3. Angin kencang: masuk ke gedung.
- FR-2.4 Rute utama dan rute cadangan ditetapkan tim K3 dan disimpan di HP bersama peta terminal, sehingga navigasi tetap berjalan tanpa internet. Ruang kendali dapat menutup ruas jalur yang rusak atau terhalang, dan aplikasi beralih ke rute cadangan.
- FR-2.5 Daya tampung. Setiap titik kumpul dan gedung evakuasi punya batas daya tampung. Aplikasi membagi orang ke beberapa tujuan menurut posisi dan sisa kapasitas.
- FR-2.6 Panduan di layar kunci. Selama evakuasi, panduan tampil tanpa membuka aplikasi: Dynamic Island dan Live Activity di iOS, notifikasi tetap layar penuh di Android. Isinya panah arah, jarak tersisa, timer, dan instruksi berbasis patokan (misalnya "lurus ke Jalan Utama, belok kanan di Gate 2"). Rincian logika panah, pemberitahuan belokan, pola getar, dan batas teknisnya ada di F10.
- FR-2.7 Arah panah. Arah dihitung dari arah gerak GPS saat pengguna berjalan, bukan dari kompas, karena baja kontainer dan crane mengganggu sensor magnet HP. Saat pengguna diam atau GPS lemah, panah disembunyikan dan yang tampil instruksi patokan serta "ikuti rambu evakuasi".
- FR-2.8 Suara dan getaran. Panduan utama disampaikan lewat suara (Bahasa Indonesia dan Inggris) dan pola getaran, misalnya getar dua kali untuk belok. Pengguna tidak perlu menatap layar sambil berlari di dekat alat.
- FR-2.9 Bila data internet putus, server mengirim SMS ke pengguna yang tercatat di zona. Sirene dan radio terminal tetap berjalan.
- FR-2.10 Tombol Saya merasakan guncangan kuat di beranda langsung memulai panduan evakuasi tanpa menunggu perintah ruang kendali. Bila ada koneksi, tombol ini juga mengirim laporan guncangan kuat ke antrean ruang kendali (FR-1.5); evakuasi seluruh terminal tetap diputuskan komandan insiden. Ini mengikuti anjuran BMKG untuk evakuasi mandiri di pantai.
- FR-2.11 Saat pertama kali memakai aplikasi, pengguna melihat penjelasan singkat bahwa aplikasi tidak menggantikan SOP evakuasi mandiri.
**Kriteria penerimaan:**
- Dalam drill, ≥ 95% HP di area menerima notifikasi ≤ 60 detik.
- Panduan di layar kunci muncul ≤ 2 detik setelah notifikasi atau tombol guncangan kuat, juga dalam mode pesawat.
- Rute cadangan aktif ≤ 5 detik setelah ruang kendali menutup ruas jalur.
- Uji lapangan membuktikan panah arah tidak menunjuk salah di antara tumpukan kontainer.

#### F3. Timer evakuasi, status Aman, dan bantuan (P1)

Setelah notifikasi, setiap orang mendapat batas waktu untuk keluar dari zona bahaya dan bisa melihat siapa yang di sekitarnya masih perlu dibantu.
- FR-3.1 Timer mundur dimulai saat notifikasi diterima atau tombol guncangan kuat ditekan. Durasinya diatur tim K3 per jenis bahaya, per zona, dan per kelompok kerja: pekerja darat, operator crane dan pekerja di ketinggian, serta pekerja di atas kapal. Untuk tsunami, komandan insiden dapat memasukkan perkiraan waktu tiba gelombang dari info resmi yang dipantau petugas, dikurangi margin keselamatan; bila tidak ada, timer memakai nilai SOP.
- FR-3.2 Status Aman otomatis. Pengguna tidak perlu melakukan apa pun di titik kumpul. Status Aman dicatat dari geofence titik kumpul dan dicocokkan petugas titik kumpul (FR-3.3). Beacon BLE di titik kumpul, yang lebih andal di dalam gedung dan di lantai atas, adalah perangkat tambahan dan masuk roadmap.
- FR-3.3 Petugas titik kumpul. Petugas mencocokkan orang yang hadir dengan daftar di tablet, termasuk orang tanpa HP. Bila berbeda dengan deteksi otomatis, catatan petugas yang dipakai. Aplikasi petugas tetap berjalan tanpa jaringan dan menyinkronkan data saat sinyal kembali.
- FR-3.4 Bila timer habis dan pengguna belum Aman, statusnya menjadi Belum keluar dan tampil merah di dashboard.
- FR-3.5 Bantuan. Tombol Butuh bantuan selalu tersedia. Pekerja biasa yang melihat permintaan bantuan hanya mendapat keterangan "bantuan sedang dikirim" dan tidak diarahkan ke korban. Detail lokasi korban hanya tampil untuk tim penyelamat dan P3K.
- FR-3.6 Orang di sekitar. Selama pengguna masih dalam perjalanan, aplikasi menampilkan orang dalam radius yang diatur tim K3 (usulan awal 100 m) yang belum aman: nama depan, jarak, dan waktu pembaruan terakhir. Tujuannya mengajak mereka ikut ke arah yang sama, bukan berbalik arah. Setelah pengguna tercatat Aman, daftar ini disembunyikan.
- FR-3.7 Untuk tsunami, aplikasi tidak pernah mengarahkan orang kembali ke zona merah; orang yang tertinggal menjadi tugas tim penyelamat.
**Kriteria penerimaan:**
- Status Aman otomatis tercatat ≤ 30 detik setelah pengguna tiba di titik kumpul, tanpa tindakan apa pun.
- Dashboard menampilkan hitungan Aman / Belum keluar / Butuh bantuan yang diperbarui ≤ 10 detik.
- Tim K3 dapat mengubah durasi timer tanpa merilis ulang aplikasi.

#### F9. Setelah evakuasi (P1)

Orang hanya boleh kembali ke zona yang sudah dinyatakan aman oleh komandan insiden.
- FR-9.1 Status evakuasi hanya berakhir bila komandan insiden mencabutnya, setelah petugas memastikan peringatan resmi sudah diakhiri.
- FR-9.2 Untuk tsunami, aplikasi mengingatkan bahwa gelombang berikutnya bisa lebih besar dari yang pertama.
- FR-9.3 Setiap zona dibuka kembali setelah pemeriksaan struktur dan alat, misalnya dermaga, rel crane, dan trestle. Dashboard mencatat siapa yang memeriksa dan kapan.
- FR-9.4 Aplikasi tidak menampilkan rute ke zona yang belum dibuka, dan memberi peringatan bila pengguna memasuki zona tertutup.
- FR-9.5 Gempa susulan memicu ulang panduan evakuasi dengan aturan yang sama.
- FR-9.6 Laporan kejadian (waktu evakuasi per zona, headcount, korban, near miss) tersimpan untuk evaluasi dan MyHSSE.
**Kriteria penerimaan:**
- Dalam drill, tidak ada pengguna yang mendapat rute ke zona yang belum dibuka.

#### F10. Navigasi evakuasi belok demi belok di luar aplikasi (P1)

Saat evakuasi, pengguna harus tahu arah tanpa membuka aplikasi dan tanpa menatap layar lama. F10 merinci FR-2.6 sampai FR-2.8: panah arah, jarak ke belokan, dan sisa waktu tetap terlihat walau pengguna sedang membuka aplikasi lain atau HP terkunci.

| Kondisi HP | iOS | Android |
| --- | --- | --- |
| Aplikasi JARAK AMAN terbuka | Panah besar, instruksi belokan, peta rute (bagian yang sudah dilalui garis tegas, sisanya putus-putus), timer | Sama |
| Sedang membuka aplikasi lain | Dynamic Island: panah dan jarak ke belokan di kiri, sisa waktu di kanan; tekan lama untuk tampilan diperluas | Notifikasi tetap berprioritas tinggi; di Android 16 memakai notifikasi progres dengan titik untuk tiap belokan |
| Layar terkunci | Live Activity: panah, instruksi, progres, pola getar | Notifikasi tetap di layar kunci |
| iPhone tanpa Dynamic Island | Live Activity di layar kunci, muncul sebagai banner saat ada pembaruan penting | Tidak berlaku |

- FR-10.1 Rute sebagai daftar ruas. Setiap rute dari FR-2.4 disimpan sebagai urutan ruas: panjang, arah, manuver di ujung ruas (lurus, belok kanan, belok kiri, tiba), dan nama patokan (misalnya Jalan Utama, Gate 2). Data ini tersimpan di HP sehingga navigasi berjalan tanpa internet.
- FR-10.2 Posisi di rute. Aplikasi mencocokkan posisi GPS ke ruas terdekat, lalu menghitung jarak ke manuver berikutnya dan sisa jarak ke tujuan.
- FR-10.3 Logika panah. Panah menunjuk manuver berikutnya. Selama belokan masih lebih dari 30 m, panah lurus dengan teks "X m, lalu belok kanan di Gate 2". Dalam 30 m, panah berubah menjadi belok kanan atau kiri dengan teks "dalam X m". Arah dihitung dari arah gerak GPS terhadap arah ruas, bukan kompas (FR-2.7). Bila pengguna diam atau akurasi GPS di bawah ambang, panah disembunyikan dan yang tampil instruksi patokan serta "ikuti rambu evakuasi". Angka 30 m adalah asumsi awal (sekitar 20 detik pada kecepatan jalan cepat 1,5 m/detik) dan disesuaikan setelah uji lapangan.
- FR-10.4 Pemberitahuan belokan. Saat masuk 30 m sebelum belokan, HP berbunyi instruksi suara, bergetar, dan Dynamic Island membesar sebentar. Di iOS ini memakai pembaruan Live Activity dengan alert, yang membuat sistem menampilkan tampilan diperluas sebentar.
- FR-10.5 Pola getar. Dua getar pendek berarti belok kanan, tiga getar pendek berarti belok kiri, satu getar panjang berarti putar balik. Pola diuji dengan pekerja agar bisa dibedakan saat HP di saku dan pengguna memakai sarung tangan.
- FR-10.6 Salah arah. Bila pengguna keluar dari rute atau bergerak menjauhi tujuan beberapa detik berturut-turut, panah berbalik 180°, teks berubah menjadi "Putar balik", dan HP bergetar panjang. Dashboard menandai orang itu. Bila pengguna masuk ruas yang ditutup ruang kendali, aplikasi menghitung ulang ke rute cadangan (FR-2.4).
- FR-10.7 Isi Dynamic Island. Tampilan ringkas: panah dalam lingkaran dan jarak ke belokan di kiri, sisa waktu evakuasi di kanan. Tampilan minimal (bila ada Live Activity lain, misalnya musik): panah saja. Tampilan diperluas: panah besar, instruksi dan patokan, manuver berikutnya, sisa jarak ke tujuan, bilah progres, sisa waktu, dan arti pola getar. Ketuk membuka aplikasi di layar evakuasi; tekan lama membuka tampilan diperluas (perilaku standar iOS). Live Activity evakuasi diberi relevance score tertinggi agar didahulukan tampil di Dynamic Island.
- FR-10.8 Batas teknis iOS. Live Activity tidak bisa membaca lokasi atau internet sendiri, jadi aplikasi yang memperbaruinya dari latar belakang memakai pembaruan lokasi. Data Live Activity maksimal 4 KB, sehingga yang dikirim hanya kode manuver, jarak, teks pendek, dan timer. Sistem mengabaikan animasi buatan, jadi panah memakai ikon per arah, bukan rotasi beranimasi. Live Activity bisa aktif sampai 8 jam, cukup untuk satu kejadian evakuasi. Pengguna bisa mematikan Live Activities di Pengaturan; dashboard menandai pengguna itu, sama seperti izin notifikasi yang ditolak.
- FR-10.9 Android sebagai kanal utama. Panduan tampil di notifikasi tetap dari layanan latar depan, berisi panah, instruksi, jarak, dan timer. Di Android 16, notifikasi ini memakai format notifikasi progres dengan titik untuk tiap belokan dan tujuan. Sebagian besar sopir dan TKBM diperkirakan memakai Android; perkiraan ini dicek dari data pendaftaran.
- FR-10.10 Selesai. Saat status Aman tercatat (FR-3.2), Live Activity atau notifikasi diakhiri dengan pesan terakhir "Tercatat Aman · jangan kembali".
- FR-10.11 Aksesibilitas. Panah punya label suara untuk pembaca layar (misalnya "Belok kanan dalam 20 meter"), berkontras tinggi, dan terbaca di bawah terik matahari.
**Kriteria penerimaan (target awal, ditetapkan ulang setelah uji kegunaan oleh tim pengembang MyHSSE):**
- Panduan tetap terlihat saat pengguna membuka aplikasi lain dan saat layar terkunci, di iOS dan Android.
- Pemberitahuan belokan muncul sebelum titik belok pada ≥ 90% belokan dalam uji jalan kaki.
- Salah arah terdeteksi ≤ 10 detik setelah pengguna keluar rute.
- ≥ 90% pekerja uji bisa membedakan pola getar kanan, kiri, dan putar balik tanpa melihat layar.
**Catatan kritis.** Dynamic Island hanya ada di sebagian model iPhone, sedangkan sebagian besar pekerja lapangan kemungkinan memakai Android. Karena itu, di presentasi fitur ini sebaiknya disebut "panduan arah di luar aplikasi" (Dynamic Island di iOS, notifikasi tetap di Android), bukan Dynamic Island saja. Prototipe UI memakai ketuk untuk memperluas pulau agar mudah didemokan; aplikasi asli mengikuti perilaku iOS (tekan lama).
> **Rujukan teknis:** Apple Developer, Displaying live data with Live Activities · Android Developers, Progress-centric notifications (Android 16), diperbarui 3 Mar 2026

### Roadmap · rekomendasi di luar cakupan quick win

Fitur berikut tidak dikerjakan dalam quick win. Isinya dipertahankan sebagai arah pengembangan bagi Pelindo, dengan urutan: peringatan zona berbasis data TOS (tanpa sensor baru), henti total lewat TOS, lalu integrasi deteksi jarak dekat.

#### F13. Peringatan zona alat berbasis data TOS (roadmap fase 2)

Bila TOS sudah mencatat posisi alat berat seperti reach stacker dan RTG per blok, posisi HP pekerja (F4) bisa dicocokkan dengan blok tempat alat sedang beroperasi, tanpa sensor baru.
- FR-13.1 Saat HP masuk blok tempat alat beroperasi, pengguna menerima peringatan zona, misalnya "Anda masuk blok C3, reach stacker sedang beroperasi". Operator alat belum menerima apa pun di fase ini.
- FR-13.2 Dashboard menampilkan jumlah orang di blok yang sedang ada alat beroperasi.
- FR-13.3 Ini peringatan tingkat zona (puluhan meter), bukan peringatan jarak dekat, karena GPS HP tidak cukup akurat untuk itu.
**Prasyarat:** TOS punya data posisi alat yang bisa dibaca secara real time. Perlu dikonfirmasi dengan tim IT dan TOS Pelindo.

#### F8. Henti total operasi terminal saat evakuasi (roadmap fase 3)

Saat evakuasi diperintahkan, terminal harus berhenti beroperasi dengan aman sebelum orang melintasi jalur alat.
- FR-8.1 Perintah henti total dikirim lewat TOS ke semua alat, bersamaan dengan perintah evakuasi atau terpisah oleh komandan insiden: hentikan pekerjaan, turunkan muatan yang tergantung ke posisi aman, parkir di area yang ditentukan, matikan mesin.
- FR-8.2 Operator mengonfirmasi lewat layar kabin. Dashboard menampilkan alat yang belum berhenti beserta operatornya.
- FR-8.3 Operator crane dan pekerja di ketinggian mengikuti prosedur turun tersendiri. Jalur turun dan penerangan darurat harus berfungsi saat listrik padam.
- FR-8.4 Pekerja di atas kapal dan di palka diperintahkan turun lewat jalur yang ditetapkan. Keputusan soal kapal yang sedang sandar dikoordinasikan dengan nakhoda dan KSOP.
- FR-8.5 Kendaraan. SOP terminal menetapkan apakah sopir meninggalkan truk tanpa menghalangi jalur darurat, atau keluar lewat jalur khusus. Aplikasi menampilkan instruksi yang berlaku kepada sopir.
- FR-8.6 Gate. Palang gate terbuka otomatis saat evakuasi, termasuk saat listrik padam, dan jalur kendaraan darurat dijaga kosong.
**Kriteria penerimaan:**
- Semua alat di zona terdampak tercatat berhenti ≤ 2 menit setelah perintah, saat drill.
- Palang gate terbuka ≤ 30 detik setelah perintah evakuasi.

#### F6. Integrasi deteksi jarak dekat (roadmap fase 3)

Tidak termasuk cakupan quick win (keputusan kelompok, 16 Nov 2026). Rincian di bawah dipertahankan sebagai acuan bila Pelindo melanjutkan ke deteksi di alat. Pilihan yang disarankan adalah mengintegrasikan inovasi internal yang sudah ada, yaitu guidance system dengan sensor emergency stop dan prototipe pendeteksi orang di Surabaya, ditambah deteksi tanpa tag (kamera AI atau sensor rompi reflektif), karena sopir dan tamu jarang membawa tag.
Rompi UWB pekerja terhubung ke HP lewat Bluetooth. Rompi bekerja bersama unit UWB di alat berat untuk mencegah tabrakan.
- FR-6.1 Pairing. Rompi dipasangkan sekali ke aplikasi; setelah itu rompi tersambung otomatis ke HP saat pengguna masuk area. Tanpa rompi terhubung, pekerja zona alat berat tampil kuning di dashboard. Pada pilot, rompi dipakai di satu zona dengan 1–2 alat berat yang sudah dipasangi unit UWB.
- FR-6.2 Rompi terpisah dari HP. Bila koneksi Bluetooth rompi–HP putus lebih dari 60 detik (usulan awal), rompi bergetar dan dashboard menerima notifikasi. Sistem tidak memakai perkiraan jarak dari Bluetooth karena tidak akurat. Opsi: gateway UWB di lapangan meneruskan status rompi langsung ke server, sehingga rompi tidak bergantung pada HP; dipilih setelah uji vendor.
- FR-6.3 Alat mendekat. Rompi dan unit di alat saling mengukur jarak langsung lewat UWB, tanpa HP dan tanpa internet. Bila alat bergerak ke arah pekerja di lajur yang sama dan masuk radius near miss, rompi bergetar kuat dan berbunyi, dan kabin operator menampilkan peringatan. Getaran wajib karena bunyi bisa tidak terdengar di area bising.
- FR-6.4 Near miss tercatat. Setiap alarm jarak dekat diteruskan ke server sebagai near miss otomatis: waktu, lokasi, ID alat, dan jarak terdekat. Data ini dihitung terpisah dari laporan manual.
- FR-6.5 Permintaan bantuan. Status darurat dikirim ke dashboard bila pekerja menekan tombol SOS di rompi atau aplikasi, atau bila setelah alarm jarak dekat pekerja tidak menjawab pertanyaan "Anda aman?" dalam 30 detik. Near miss tanpa korban tidak otomatis dianggap kecelakaan.
- FR-6.6 Radius alarm diatur per jenis alat (reach stacker, RTG, truk terminal). Alarm hanya berbunyi bila orang dan alat berada di lajur yang sama, untuk menekan alarm palsu.
- FR-6.7 Peringatan saja. Pada pilot, sistem hanya memberi peringatan di rompi dan kabin; alat tidak dihentikan otomatis oleh UWB. Opsi perlambatan atau henti otomatis dinilai setelah data alarm palsu tersedia.
- FR-6.8 Sopir truk. Sopir yang turun dari kabin di zona alat berat wajib memakai tag UWB pinjaman dari gate. Kamera AI di alat yang mendeteksi orang tanpa tag diuji sebagai pembanding (P1).
- FR-6.9 Mode evakuasi. Setelah perintah henti total dan semua alat di zona tercatat berhenti, alarm jarak dekat diredam agar tidak menutupi panduan evakuasi. Alat yang masih bergerak tetap memicu alarm.
**Kriteria penerimaan:**
- Alarm rompi berbunyi dan bergetar ≤ 1 detik setelah alat masuk radius, saat HP mati maupun hidup.
- Putusnya Bluetooth rompi–HP tampil di dashboard ≤ 90 detik.
- Alarm palsu < 10% dari total alarm, ditinjau mingguan.

---

## Alur utama

Alur evakuasi (modul fase 1b). Setiap perintah evakuasi berakhir di salah satu dari dua status: orang sudah Aman, atau ditangani tim penyelamat dari ruang kendali.
Status Aman tercatat dari geofence titik kumpul dan dicocokkan petugas titik kumpul. Henti total alat lewat TOS masuk roadmap (F8); sebelum itu alat dihentikan lewat radio sesuai ERP. Dua jalan pintas memotong alur ini: tombol Saya merasakan guncangan kuat langsung memulai panduan tanpa menunggu perintah ruang kendali sekaligus melapor ke ruang kendali, dan tombol Butuh bantuan bisa ditekan kapan saja.

### Alur masuk dan safety induction

1. Pengguna melewati gate seperti biasa (tap kartu, atau STID untuk truk). Tidak ada langkah tambahan di palang gate.
2. Data gate memicu aplikasi aktif, dan HP yang masuk geofence menjadi konfirmasi. Orang tanpa aplikasi tetap tercatat dari data gate.
3. Bila belum induction hari itu, aplikasi meminta safety induction: selfie APD, panduan evakuasi, serta bahaya dan kelalaian hari ini. Sopir menyelesaikannya saat truk berhenti di antrean; orang tanpa HP menyelesaikannya di kiosk pos gate.
4. Dashboard menampilkan status setiap orang: sudah induction, belum, APD tidak lengkap, atau tanpa aplikasi. Yang belum menerima pengingat.
5. Selama di area, aplikasi mengirim posisi per zona dan heartbeat. Saat transaksi gate keluar tercatat, tracking berhenti.

### Alur pelaporan pelanggaran dan near miss

1. Petugas patrol atau pekerja melihat pelanggaran, near miss, atau kondisi berbahaya.
2. Laporan dibuat di aplikasi atau lewat QR: kategori, foto, dan lokasi otomatis. Tanpa sinyal, laporan disimpan lalu dikirim kemudian.
3. Laporan masuk antrean dengan penanggung jawab dan batas waktu. Laporan berisiko tinggi langsung muncul di dashboard ruang kendali.
4. Temuan ditutup dengan bukti perbaikan, dan pelapor menerima statusnya.
5. Data masuk MyHSSE, membentuk peta titik rawan mingguan, dan temuan terbaru diusulkan menjadi butir safety induction esok harinya.

---

## Arsitektur dan integrasi

Semua komponen fase 1 adalah perangkat lunak di atas infrastruktur yang sudah ada: HP pengguna, kiosk atau tablet di pos gate, data gate, dan MyHSSE. Server menyatukan data orang di area, induction, posisi per zona, dan laporan untuk ruang kendali dan HSSE.
Server dan dashboard punya cadangan di lokasi yang tidak terdampak, dan dashboard bisa dijalankan dari tablet di pos komando cadangan. Radio HT tetap menjadi jalur komunikasi utama saat jaringan seluler padat atau mati.

| Integrasi | Data | Arah | Catatan |
| --- | --- | --- | --- |
| BMKG | Tidak diintegrasikan; petugas ruang kendali memantau info BMKG lewat kanal resmi yang sudah ada | — | Keputusan 15 Nov 2026: evakuasi hanya dipicu perintah ruang kendali (F1) |
| Sistem gate | Transaksi masuk dan keluar orang dan truk | Masuk | Sumber utama daftar orang di area dan pemicu aktivasi aplikasi, termasuk STID untuk truk; palang gate terbuka otomatis saat evakuasi |
| TOS | Posisi dan status alat, perintah henti total | Dua arah | Roadmap: posisi alat per blok (F13) dan henti total (F8) |
| Jadwal shift, koperasi TKBM, agen kapal | Daftar orang yang seharusnya ada di area | Masuk | Bahan rekonsiliasi daftar orang belum ditemukan |
| Anemometer terminal | Arah dan kecepatan angin | Masuk | Arah evakuasi kebakaran dan B3, batas operasi crane |
| Deteksi di alat (roadmap) | Guidance system dan emergency stop internal, prototipe Surabaya, atau vendor | Masuk | Hanya bila roadmap F6 dijalankan |
| Port Safe dan HSSE Dashboard | Laporan unsafe condition dan safety patrol | Masuk | Dipetakan ke kategori F12 agar data grup tidak terpisah |
| MyHSSE | Induction, pelanggaran, near miss, insiden | Keluar | Pekerja tidak perlu dua aplikasi K3 |
| Sirene, radio, SMS gateway | Perintah evakuasi | Keluar | Jalur cadangan saat data seluler putus |
| Tim SAR dan BPBD | Daftar orang belum ditemukan | Keluar | Diekspor dari dashboard |

---

## Kebutuhan non-fungsional

Syarat terpenting: sistem tetap berguna saat internet, listrik, atau HP gagal, karena bencana justru sering memutus ketiganya.

| Aspek | Kebutuhan |
| --- | --- |
| Tanpa internet | Konten induction terakhir, peta, zona, serta rute utama dan cadangan tersimpan di HP. Laporan pelanggaran dan near miss disimpan dulu bila tidak ada sinyal. Aplikasi petugas titik kumpul berjalan tanpa jaringan dan menyinkronkan data saat sinyal kembali. SMS, sirene, dan radio menjadi jalur cadangan. |
| Listrik dan komunikasi | Server, Wi-Fi terminal, sirene, dan palang gate punya catu daya cadangan. Dashboard bisa dipindah ke tablet berbaterai di pos komando cadangan. |
| Latensi | Perintah evakuasi ruang kendali → notifikasi di HP ≤ 60 detik. Status pengguna → dashboard ≤ 10 detik. Konten induction yang disetujui HSSE → HP aktif ≤ 5 menit. Laporan berisiko tinggi → dashboard ≤ 30 detik. |
| Akurasi lokasi | GPS HP biasanya meleset sampai sekitar 10 m di area terbuka, dan 2–4× lebih jauh bila terhalang (MDPI Sensors, Jul 2025). GPS hanya dipakai untuk zona, headcount, dan arah gerak, tidak untuk peringatan jarak dekat. Arah panah tidak memakai kompas karena baja mengganggu sensor magnet. |
| Izin perangkat | Lokasi "selalu" dan notifikasi darurat (Critical Alerts di iOS, izin setara di Android) diminta saat pendaftaran. Aplikasi dikecualikan dari penghemat baterai. Pengguna yang menolak tetap terhitung lewat data gate. |
| HP pribadi | Sopir eksternal dan TKBM memakai HP pribadi. Aplikasi harus ringan, berjalan di Android versi lama, dan hanya meminta akses lokasi, notifikasi, dan kamera (untuk selfie APD). |
| Baterai | Tracking hanya aktif di dalam area. Target pemakaian baterai HP ditetapkan dari uji perangkat sebelum modul diwajibkan. |
| Bahasa dan aksesibilitas | Instruksi dalam Bahasa Indonesia dan Inggris. Semua peringatan memakai getaran kuat selain bunyi, karena area bising dan untuk pekerja tuna rungu. Tampilan tetap terbaca di bawah terik matahari dan malam hari. |
| Keamanan | Data terenkripsi saat dikirim dan disimpan. Login dashboard memakai akun perusahaan dan akses berbasis peran. Posisi orang real time diperlakukan sebagai data keamanan fasilitas pelabuhan (ISPS). Perintah evakuasi hanya bisa dikirim peran yang berwenang, dan setiap perintah tercatat. |
| Privasi | Mengikuti UU 27/2022 tentang Pelindungan Data Pribadi dan PP 33/2026 sebagai aturan pelaksananya (Bisnis, 8 Sep 2026). Karena check-in kini otomatis, persetujuan diambil saat pendaftaran dan ikon tracking selalu tampil. Lokasi hanya direkam di dalam area pelabuhan, hanya untuk keselamatan, dengan masa simpan terbatas. DPIA selesai sebelum pengembangan, karena PP 33/2026 berlaku mulai 16 Jan 2027. Foto APD tidak dipakai untuk pengenalan wajah. |
| Sertifikasi perangkat | Fase 1 tidak memakai perangkat baru selain kiosk atau tablet di pos gate. Bila roadmap F6 dijalankan, perangkat impor perlu dicek kewajiban sertifikasi SDPPI. |
| Area mudah terbakar | Di area tangki BBM dan curah cair, hanya perangkat yang sesuai aturan area yang boleh dipakai. |
| Integrasi | Data near miss dan insiden dikirim ke MyHSSE, sehingga pekerja tidak perlu dua aplikasi K3. |

---

## Risiko, asumsi, dan pertanyaan terbuka

### Risiko dan mitigasinya

| Risiko | Mitigasi |
| --- | --- |
| Alat berat masih bergerak saat orang berevakuasi | Perintah henti alat lewat radio sesuai ERP; henti total lewat TOS di roadmap (F8) |
| Ruang kendali berada di zona bahaya atau kehilangan listrik | Pos komando cadangan dengan tablet berbaterai; server di lokasi yang tidak terdampak |
| Rute evakuasi rusak setelah gempa atau tertutup asap | Rute cadangan, penutupan ruas jalur dari dashboard, rute kebakaran mengikuti arah angin |
| Evakuasi terlambat karena menunggu peringatan resmi | Tombol guncangan kuat, evakuasi manual oleh komandan insiden, pelatihan SOP evakuasi mandiri |
| Orang tidak terhitung (tanpa aplikasi, HP mati, izin ditolak) | Daftar orang di area dari data gate dan data kerja; heartbeat; petugas titik kumpul |
| Geofence menghitung orang di luar pagar | Konfirmasi dengan transaksi gate |
| Panah arah menunjuk salah di antara kontainer | Arah dari gerak GPS, bukan kompas; instruksi patokan; ikuti rambu |
| Pengguna menatap layar sambil berlari di dekat alat | Panduan utama lewat suara dan getaran; henti total alat |
| Titik kumpul melebihi daya tampung | Pembagian tujuan menurut sisa kapasitas |
| Truk macet di gate saat evakuasi | SOP kendaraan, palang gate terbuka otomatis, jalur darurat dijaga kosong |
| Pekerja kembali ke zona bahaya terlalu cepat | Status evakuasi hanya dicabut komandan insiden; zona dibuka setelah pemeriksaan; peringatan gelombang susulan |
| Pekerja tidak terlatih berusaha menolong dan menjadi korban | Detail korban hanya untuk tim penyelamat; pekerja biasa melihat "bantuan sedang dikirim" |
| Peringatan palsu atau hoaks memicu evakuasi massal | Evakuasi hanya bisa diperintahkan peran berwenang di ruang kendali, dengan konfirmasi dan label LATIHAN untuk drill |
| Perintah evakuasi terlambat karena menunggu keputusan ruang kendali | Template dua ketukan, petugas pemantau info BMKG per shift, wakil komandan, pos komando cadangan, dan evakuasi mandiri saat guncangan kuat |
| Data posisi bocor dan dipakai untuk kejahatan | Akses berbasis peran sesuai rencana keamanan ISPS; log akses |
| Induction dianggap rutinitas dan dilewati tanpa dibaca | Jumlah butir dibatasi, label BARU, satu pertanyaan cek pemahaman, rotasi konten harian |
| Solusi dianggap tidak menyelesaikan blind spot alat berat | Cakupan dinyatakan terbuka sejak awal; deteksi di alat ada di roadmap (F13, F6) dengan mengintegrasikan inovasi internal Pelindo |
| MyHSSE masih dibenahi sehingga modul tertunda | Jalur tanpa instal (tautan web, QR, kiosk gate) dan layanan terpisah yang datanya dikirim ke MyHSSE |
| Pekerja eksternal tidak memasang aplikasi atau menolak dilacak | Data gate tetap menjadi dasar daftar orang; kiosk gate; tracking hanya di dalam area; larangan tertulis memakai data lokasi untuk menilai kinerja; libatkan koperasi TKBM dan perusahaan angkutan |
| Deteksi APD salah tolak dan memicu antrean di gate | Mode saran (tidak menahan akses) selama masa uji, banding cepat ke petugas gate, uji di HP kelas bawah |

### Asumsi

- Terminal tujuan punya sinyal seluler atau Wi-Fi di sebagian besar area.
- Sistem gate, termasuk STID, menyediakan data transaksi yang bisa diintegrasikan. Data TOS hanya dibutuhkan untuk roadmap.
- MyHSSE menyediakan API atau ruang modul tempat fitur ini bisa ditambahkan.
- Terminal sudah punya ERP, SOP evakuasi, titik kumpul, dan struktur komando yang bisa dimasukkan ke aplikasi.
- Sebagian besar pekerja dan sopir memiliki smartphone Android atau iOS. Asumsi ini diuji lewat wawancara di minggu 1.

### Pertanyaan terbuka

- [ ] Terminal mana yang menjadi lokasi penerapan pertama?
- [ ] Berapa durasi timer evakuasi per jenis bahaya dan per kelompok kerja menurut SOP K3 terminal?
- [ ] Siapa komandan insiden per shift, dan apa ambang evakuasi manual dalam ERP?
- [ ] Apakah TOS bisa mengirim perintah henti total ke layar kabin, atau perlu perangkat tambahan?
- [ ] Apakah sopir meninggalkan truk atau keluar lewat jalur khusus saat evakuasi?
- [ ] Di mana pos komando cadangan, dan berapa daya tampung tiap titik kumpul?
- [ ] Apakah LTIFR hanya menghitung karyawan, dan apakah RKAP 2026 sudah punya KPI fatalitas?
- [ ] Siapa yang memiliki server: IT Pelindo, subholding, atau vendor?
- [ ] Berapa lama data lokasi disimpan sebelum dihapus?
- [ ] Bagaimana arsitektur MyHSSE saat ini (teknologi dan API), dan kapan pembenahannya selesai?
- [ ] Apakah TOS mencatat posisi alat berat per blok secara real time (prasyarat F13)?
- [ ] Apakah induction yang belum selesai boleh menahan palang gate, atau cukup ditandai di dashboard?

---

## Roadmap rekomendasi

Output ALP adalah rekomendasi. Urutan pengembangan yang disarankan untuk Pelindo:

| Fase | Isi | Prasyarat | Ukuran untuk keputusan lanjut |
| --- | --- | --- | --- |
| 1 · Inti (quick win) | F11, F4, F5, F12, F7 | Akses data gate dan STID, API MyHSSE, DPIA, konten induction dari HSSE | ≥ 95% orang terinduksi, ≥ 90% terpantau, laporan digital menggantikan formulir manual |
| 1b · Modul evakuasi | F1–F3, F9, F10 | Fase 1 stabil; SOP evakuasi dan titik kumpul per terminal | Headcount drill 100% dalam ≤ 10 menit |
| 2 · Peringatan zona | F13 | TOS mencatat posisi alat per blok | Jumlah orang di blok alat beroperasi turun dibanding baseline |
| 3 · Deteksi di alat | F8, F6 | Integrasi guidance system dan emergency stop internal, prototipe Surabaya, atau vendor; anggaran perangkat | Alarm terlewat mendekati nol, alarm palsu < 10% |

Setiap fase diakhiri keputusan lanjut, ubah, atau berhenti berdasarkan ukurannya sendiri. Drill evakuasi tetap dilakukan siang dan malam, termasuk satu drill dengan jaringan seluler dimatikan.
**Perkiraan biaya:** belum dihitung untuk cakupan baru tanpa sensor. Angka ±Rp0,25–0,6 miliar dari pitch 30 Okt 2026 mencakup perangkat UWB untuk satu zona dan tidak berlaku lagi. Fase 1 hanya membutuhkan pengembangan perangkat lunak, kiosk atau tablet di pos gate, dan server; rinciannya disusun setelah tim IT Pelindo menjelaskan arsitektur MyHSSE.

---

## Lampiran A. Analisis skeptis PRD v0.5

Lampiran ini menguji PRD dengan anggapan setiap asumsi bisa salah. Setiap temuan berisi asumsi di PRD, alasan asumsi itu bisa gagal beserta buktinya, dan perbaikan yang diusulkan. Isi lampiran ini adalah usulan; bagian utama PRD belum diubah.
> **Status per v0.7 (16 Nov 2026).** Temuan nomor 1–3, 4 (BMKG), dan 8 (UWB) sudah ditindaklanjuti: output berupa rekomendasi tanpa pilot, fokus pada induksi dan pemantauan pekerja, fitur dibagi ke fase, integrasi BMKG dihapus, dan sensor dipindah ke roadmap. Temuan lainnya masih berlaku.

### A1. Sepuluh perbaikan terpenting

| # | Temuan | Tingkat | Perbaikan singkat |
| --- | --- | --- | --- |
| 1 | PRD masih ditulis untuk pilot 8 minggu, padahal kelompok sudah memutuskan output berupa rekomendasi tanpa pilot | Kritis | Ubah ringkasan, metrik, dan rencana rilis menjadi rekomendasi pengembangan bertahap untuk Pelindo |
| 2 | Judul dan urutan fitur menempatkan bencana di depan, padahal data korban menunjuk ke risiko orang–alat | Kritis | Jadikan orang–alat (F4, F6, F11) inti produk dan bencana (F1–F3, F10) modul tambahan |
| 3 | Semua sebelas fitur berstatus P0 | Tinggi | Bagi ke tiga fase yang sama dengan roadmap deck |
| 4 | Feed terbuka BMKG tidak punya kanal peringatan tsunami khusus. Ditindaklanjuti 15 Nov 2026: integrasi BMKG dihapus | Tinggi | Evakuasi dipicu perintah ruang kendali (F1); tetapkan SOP pemantauan info BMKG dan target waktu keputusan |
| 5 | Notifikasi yang menembus mode senyap tidak dijamin diizinkan Apple dan Google | Tinggi | Ajukan izin sejak awal, siapkan jalur cadangan, ukur persentase HP yang mengizinkan |
| 6 | Aktivasi otomatis bergantung pada geofence OS yang bisa terlambat sampai 6 menit | Tinggi | Pemicu utama dari transaksi gate; geofence hanya cadangan |
| 7 | Korban terbanyak pihak eksternal, tetapi sistem bergantung pada HP pribadi mereka | Tinggi | Jalur "tanpa aplikasi pun terhitung" menjadi desain utama untuk eksternal; ukur adopsi per kelompok |
| 8 | Target alarm rompi ≤ 1 detik belum pernah dibuktikan; yang diukur hanya alarm palsu | Tinggi | Tambah metrik alarm terlewat; jadikan latensi syarat uji penerimaan vendor |
| 9 | Deteksi APD dari selfie belum teruji di malam hari, hujan, dan HP murah | Sedang | Mulai sebagai mode saran (tidak menahan), kumpulkan data salah tolak dulu |
| 10 | Pemantauan lokasi dan AI kemungkinan wajib DPIA menurut PP 33/2026 | Sedang | DPIA sebelum pengembangan; dasar hukum khusus untuk pekerja eksternal |

### A2. Masalah di tingkat dokumen

1. Pilot vs rekomendasi. Ringkasan masih menulis "rilis pertama berupa pilot 8 minggu", ada tabel "metrik keberhasilan pilot", rencana rilis pilot, dan perkiraan biaya pilot. Padahal keputusan kelompok (2 Nov 2026) adalah rekomendasi tanpa pilot. Coach atau direksi yang membaca PRD dan deck berdampingan akan melihat dua cerita yang berbeda.
- Perbaikan: ganti "pilot" menjadi "rencana pengembangan yang direkomendasikan". Ganti "metrik keberhasilan pilot" menjadi "metrik yang disarankan untuk Pelindo saat modul dikembangkan". Pindahkan biaya ke bagian asumsi sebagai angka yang belum divalidasi.
2. Fokus masalah. Data Sustainability Report Pelindo 2025 menunjukkan 31 korban jiwa pada 2023–2025, 29 di antaranya pihak eksternal. Pada 2025, 86% korban jatuh di area dermaga dan jenis kejadian terbanyak adalah benturan (57%). Pengguna dari Pelindo juga menyebut peringatan dini bencana dan risiko orang–alat sebagai dua masalah berbeda. Sementara itu, judul PRD dimulai dengan "Mitigasi Bencana" dan F1–F3 membahas bencana.
- Perbaikan: ubah judul menjadi "Keselamatan orang dan alat berat di area operasi, dengan modul peringatan bencana". Urutkan fitur: F4, F5, F11, F6, F7 lebih dulu; F1–F3, F8–F10 sebagai modul bencana.
3. Prioritas. Sebelas fitur P0 berarti tidak ada yang bisa dikorbankan bila anggaran atau waktu terbatas.
- Perbaikan, mengikuti roadmap deck:
  - Fase 1, modul perangkat lunak di MyHSSE: F1 perintah evakuasi dari ruang kendali, F4 (tanpa UWB), F5, F11, F7 dasar, notifikasi dan rute dari F2, laporan near miss manual.
  - Fase 2, deteksi jarak dekat: F6 (rompi UWB atau prototipe Surabaya), near miss otomatis.
  - Fase 3, integrasi operasi: F8 henti total lewat TOS, F10, kamera AI.
4. Posisi terhadap MyHSSE. Pertanyaan terbuka masih menulis "apakah aplikasi berdiri sendiri atau langsung menjadi modul MyHSSE", padahal posisinya sudah diputuskan sebagai modul MyHSSE. Keputusan ini mengubah banyak hal teknis: login, cara distribusi aplikasi, teknologi yang dipakai MyHSSE, dan siapa pemilik server.
- Perbaikan: tulis sebagai keputusan, lalu tambahkan pertanyaan baru untuk tim IT: teknologi apa yang dipakai MyHSSE, dan apakah MyHSSE sudah punya kanal notifikasi.
5. Angka target tanpa baseline. Contohnya: headcount ≤ 10 menit, ≥ 95% HP menerima notifikasi ≤ 60 detik, dan laporan near miss ≥ 3× baseline. Tidak satu pun baseline-nya sudah diketahui.
- Perbaikan: beri label "hipotesis" pada setiap angka target dan minta data drill terakhir dari tim K3 sebagai baseline.
6. Ketergantungan pada HP pribadi pihak eksternal. Kelompok yang paling sering menjadi korban justru yang paling sulit dijangkau aplikasi. Sopir dan TKBM harus memasang aplikasi, memberi izin lokasi "selalu", dan tidak mematikannya. Survei di sektor konstruksi menemukan 59% pekerja tidak bersedia memakai perangkat pelacak, dengan privasi sebagai alasan utama (EHS Today, Mei 2025).
- Perbaikan: perlakukan "tanpa aplikasi pun terhitung" sebagai desain utama untuk pihak eksternal: data gate, tag pinjaman, petugas titik kumpul, dan induction di pos gate. Ukur adopsi terpisah untuk karyawan dan eksternal. Libatkan koperasi TKBM dan perusahaan angkutan sejak awal. Tegaskan secara tertulis bahwa data lokasi tidak dipakai untuk menilai kinerja.

### A3. Temuan per fitur

##### F1. Data BMKG (ditindaklanjuti 15 Nov 2026)

- Asumsi: server mengambil peringatan dini tsunami dari feed BMKG dan memeriksanya tiap 30 detik.
- Risiko: halaman data terbuka BMKG (diperbarui 18 Mei 2025) hanya menyediakan gempa terbaru, 15 gempa M5,0+ terkini, dan 15 gempa dirasakan, dengan parameter "potensi tsunami atau tidak". Tidak ada feed peringatan tsunami tersendiri. Batas aksesnya 60 permintaan per menit per IP, dan BMKG wajib dicantumkan sebagai sumber. Peringatan tsunami 2 Apr 2026 juga baru terbit 2 menit 45 detik setelah gempa.
- Tindak lanjut: integrasi BMKG dihapus dan evakuasi hanya dipicu perintah ruang kendali (F1). Risiko yang tersisa adalah jeda keputusan manusia; lihat catatan kritis di F1.

##### F2. Notifikasi darurat

- Asumsi: notifikasi berbunyi walau mode senyap di semua HP.
- Risiko: di iOS, level notifikasi critical (yang melewati tombol senyap) membutuhkan entitlement khusus dari Apple, dan persetujuannya tidak dijamin. Di Android, sejak 22 Januari 2025 izin notifikasi layar penuh hanya aktif otomatis untuk aplikasi panggilan dan alarm; aplikasi lain harus meminta izin pengguna. Firebase juga bisa menurunkan prioritas pesan bila pesan prioritas tinggi tidak menghasilkan notifikasi yang terlihat (dinilai dari perilaku 7 hari). Di tingkat nasional, Komdigi sudah memakai SMS blast dan siaran TV digital untuk peringatan dini (detik, Mar 2025).
- Perbaikan: ajukan entitlement Critical Alerts sejak awal dengan alasan keselamatan. Siapkan cadangan berupa notifikasi time sensitive dan Live Activity. Di Android, minta izin layar penuh dan akses Jangan Ganggu saat pendaftaran. Tampilkan di dashboard persentase HP yang izinnya lengkap. Jangan pakai push senyap untuk heartbeat. Posisikan JARAK AMAN sebagai pelengkap SMS blast nasional, sirene, dan radio, bukan pengganti.

##### F2 dan F10. Panah navigasi

- Asumsi: panah belok demi belok cukup akurat di antara tumpukan kontainer.
- Risiko: GPS HP bisa meleset sekitar 10 m di area terbuka dan 2–4× lebih jauh bila terhalang (MDPI Sensors, Jul 2025). Lorong antartumpukan lebih sempit dari angka itu, jadi "belok kanan dalam 20 m" bisa menunjuk lorong yang salah.
- Perbaikan: desain rute sebagai koridor besar (jalan utama, gate, gedung), bukan lorong kecil. Pasang rambu fisik bernomor yang sama dengan nama patokan di aplikasi. Bila keyakinan posisi rendah, tampilkan patokan saja, bukan panah.

##### F3. Status Aman otomatis

- Asumsi: beacon di titik kumpul mencatat orang yang tiba ≤ 30 detik, dengan selisih ≤ 2% dibanding catatan petugas.
- Risiko: deteksi beacon bergantung pada Bluetooth HP yang menyala dan perilaku latar belakang yang berbeda per merek HP. Saat ratusan orang tiba bersamaan, petugas juga kewalahan.
- Perbaikan: catatan petugas tetap menjadi sumber kebenaran. Uji target ≤ 2% dalam drill sebelum dipakai sebagai angka resmi. Sediakan mode "hitung massal" di tablet petugas.

##### F4. Aktivasi otomatis dan tracking

- Asumsi: aplikasi aktif sendiri saat HP masuk geofence, lalu mengirim posisi tiap 10 detik.
- Risiko: dokumentasi Android (diperbarui 28 Okt 2026) menyebut latensi geofence biasanya kurang dari 2 menit, rata-rata 2–3 menit bila batas lokasi latar belakang berlaku, dan bisa sampai 6 menit bila HP lama diam. Radius minimum yang dianjurkan 100–150 m, dengan batas 100 geofence per aplikasi. iOS membatasi 20 kondisi per aplikasi. Kirim posisi tiap 10 detik juga menguras baterai HP pribadi.
- Perbaikan: jadikan transaksi gate pemicu utama (server mengirim push "aktifkan"), dengan geofence OS sebagai cadangan. Hitung zona internal (dermaga, lajur alat) di dalam aplikasi dari posisi, bukan dengan geofence OS. Pakai interval adaptif: kirim saat pindah zona dan heartbeat berkala, bukan posisi terus-menerus.

##### F5. Daftar orang di area

- Asumsi: data gate akurat.
- Risiko: kartu dipinjam, satu truk berisi sopir dan kenek, atau tamu yang tidak tercatat membuat data gate meleset.
- Perbaikan: tambahkan jumlah penumpang pada transaksi truk. Lakukan audit rekonsiliasi gate dibanding jadwal secara berkala.

##### F6. Rompi UWB

- Asumsi: alarm ≤ 1 detik, alarm palsu < 10%.
- Risiko: prototipe UWB dan LoRa yang diuji di lorong simulasi terowongan mencatat jeda alarm 5–8 detik dan peringatan yang tidak selalu muncul tepat di ambang jarak (Buildings, Jul 2025). Sistem komersial bisa lebih baik, tetapi angka ≤ 1 detik harus dibuktikan di lapangan. PRD hanya mengukur alarm palsu, padahal alarm yang tidak berbunyi saat alat benar-benar dekat jauh lebih berbahaya.
- Perbaikan: tambahkan metrik "alarm terlewat" dengan target mendekati nol. Jadikan latensi dan alarm terlewat sebagai syarat uji penerimaan vendor, dengan skenario alat mundur, persimpangan, hujan, dan malam hari. Ranging harus terjadi langsung antara rompi dan alat, tanpa melewati HP atau server.

##### F7. Dashboard dan SOS

- Asumsi: ruang kendali menanggapi SOS ≤ 60 detik, 24 jam.
- Risiko: ini beban kerja baru bagi ruang kendali yang sudah sibuk dengan operasi.
- Perbaikan: tetapkan siapa pemilik antrean alarm per shift, dan batasi alarm yang masuk antrean (near miss cukup diringkas harian).

##### F8. Henti total lewat TOS

- Asumsi: TOS bisa mengirim perintah henti ke semua alat.
- Risiko: TOS adalah sistem inti operasi. Perubahan butuh vendor TOS dan pengujian panjang, dan henti palsu berarti kerugian operasi.
- Perbaikan: perintah henti hanya dari manusia (komandan insiden) dengan konfirmasi dua langkah. Taruh integrasi TOS di fase 3; sebelum itu pakai radio dan layar kabin yang ada.

##### F10. Dynamic Island

- Risiko: menurut StatCounter (Okt 2026), pangsa iOS di Indonesia sekitar 21% dan Android sekitar 79%. Angka ini diukur dari lalu lintas web, jadi porsi Android di kalangan pekerja lapangan kemungkinan lebih besar.
- Perbaikan: kembangkan dan uji notifikasi tetap Android lebih dulu; Dynamic Island mengikuti.

##### F11. Selfie APD dan induction harian

- Risiko: studi deteksi helm dan rompi (Frontiers in Built Environment, Apr 2025) mencapai AP sekitar 93% pada dataset yang relatif kecil dan sebagian besar diambil dalam kondisi terkontrol. Penulisnya menyebut kerja malam hari dan cuaca buruk belum diuji, dan model belum diuji di perangkat berdaya rendah. Artinya beberapa dari setiap 100 foto bisa salah dinilai, dan salah tolak di gate langsung menjadi antrean dan keluhan. Induction yang isinya mirip setiap hari juga akan dilewati tanpa dibaca.
- Perbaikan: mulai sebagai mode saran (tidak menahan akses) selama masa uji dan catat tingkat salah tolak. Sediakan banding cepat oleh petugas gate. Uji model di HP kelas bawah, malam hari, dan saat hujan. Rotasi isi langkah 3 dan batasi jumlah butir.

### A4. Privasi dan hukum

- PP 33/2026 diundangkan 16 Juli 2026 dan berlaku 16 Januari 2027. DPIA wajib untuk pemrosesan berisiko tinggi, termasuk pemantauan sistematis, pemrosesan skala besar, data pribadi spesifik, dan teknologi baru seperti AI. Kebocoran data harus diberitahukan dalam 3 × 24 jam (RSM Indonesia, diperbarui 27 Okt 2026).
- JARAK AMAN memenuhi beberapa kriteria itu sekaligus: tracking lokasi orang di area kerja, deteksi APD dengan AI, dan jumlah orang yang besar.
- Perbaikan: DPIA selesai sebelum pengembangan, bukan sebelum pilot. Tentukan dasar hukum pemrosesan untuk pekerja eksternal yang bukan karyawan Pelindo (misalnya lewat perjanjian dengan perusahaan angkutan dan koperasi TKBM). Tetapkan masa simpan lokasi dan foto APD. Muat larangan pemakaian data untuk menilai kinerja di kebijakan privasi.

### A5. Metrik yang belum ada

- Alarm terlewat UWB (alat dekat, rompi tidak berbunyi).
- Adopsi aplikasi per kelompok: karyawan, TKBM, sopir, tamu.
- Persentase HP dengan izin lengkap: lokasi "selalu", notifikasi darurat, tanpa penghemat baterai.
- Waktu rata-rata induction dan tingkat salah tolak APD.
- Persentase orang yang menyelesaikan induction sebelum turun ke lapangan.

---

## Lampiran B. Best practice teknis aplikasi

Lampiran ini merangkum praktik yang dianjurkan dokumentasi resmi platform dan regulasi yang berlaku, untuk dipakai tim pengembang MyHSSE.

### B1. Arsitektur

- Modul MyHSSE, satu identitas. Pakai login yang sama dengan MyHSSE, satu set izin, dan satu kanal notifikasi, agar pekerja tidak punya dua aplikasi K3.
- Bagian yang wajib native. Layanan lokasi latar belakang, Live Activity, kamera untuk selfie APD, dan notifikasi layar penuh butuh kode native, walau MyHSSE dibangun dengan kerangka lintas platform.
- Offline lebih dulu. Peta, zona, rute, timer, dan konten induction disimpan di HP dengan nomor versi. Kejadian penting (SOS, near miss, status Aman) disimpan dalam antrean lokal dan dikirim ulang saat sinyal kembali, dengan ID unik agar tidak tercatat dua kali.
- Server berbasis kejadian. Alurnya: peringatan masuk → aturan zona → kirim paralel ke push, SMS, sirene, dan radio. Setiap HP mengirim tanda terima, sehingga dashboard tahu siapa yang belum menerima.
- Konfigurasi dari server. Timer, radius alarm, rute, dan konten induction diubah tanpa merilis ulang aplikasi.

### B2. Lokasi dan geofence

- Pemicu. Transaksi gate memicu aktivasi; geofence OS hanya cadangan dengan radius minimal 100–150 m. Pakai transisi dwell (berhenti beberapa saat di dalam area) agar kendaraan yang lewat di jalan luar pagar tidak memicu aktivasi.
- Android 14 ke atas. Tracking memakai foreground service bertipe location dengan izin FOREGROUND_SERVICE_LOCATION. Layanan ini tidak bisa dimulai dari latar belakang tanpa izin lokasi latar belakang.
- Google Play. Lokasi latar belakang butuh formulir deklarasi untuk satu fitur, video ≤ 30 detik yang menunjukkan fitur berjalan dari latar belakang, dan pengungkapan jelas di dalam aplikasi sebelum dialog izin. Pengungkapan itu harus memuat kata "lokasi", frasa seperti "saat aplikasi ditutup", dan daftar fitur yang memakainya.
- iOS. Maksimal 20 kondisi pemantauan per aplikasi. Sistem meluncurkan ulang aplikasi saat kondisi terpenuhi, tetapi pemantauan baru berjalan setelah HP dibuka kuncinya sekali sesudah restart.
- Hemat baterai. Hitung zona di HP; kirim perubahan zona dan heartbeat, bukan posisi terus-menerus. Ukur pemakaian baterai di HP kelas bawah yang umum dipakai pekerja.

### B3. Notifikasi darurat

- iOS. Level critical melewati tombol senyap dan butuh entitlement dari Apple. Level time sensitive menembus pengaturan notifikasi sistem, tetapi tidak melewati tombol senyap. Siapkan keduanya.
- Android. Buat kanal notifikasi darurat tersendiri berprioritas tinggi. Sejak 22 Januari 2025, aplikasi yang bukan aplikasi panggilan atau alarm harus meminta izin layar penuh dari pengguna.
- Firebase. Kirim pesan prioritas tinggi hanya bila pesan itu menampilkan notifikasi, agar prioritasnya tidak diturunkan.
- Bukti terima. Bila HP tidak mengirim tanda terima dalam 60 detik, server mengirim SMS dan dashboard menandai orang itu.
- Uji rutin. Kirim pesan uji yang terlihat setiap bulan untuk menguji jalur dan melatih pengguna.

### B4. Perintah evakuasi manual

- Template per jenis bahaya dan konfirmasi dua langkah, supaya perintah cepat tetapi tidak terkirim karena salah tekan.
- Mode latihan dengan label LATIHAN di semua layar, terpisah dari perintah sungguhan.
- Log audit yang tidak bisa diubah: siapa mengirim, kapan, ke zona mana, dan apa dasarnya.
- SOP pemantauan info BMKG oleh petugas di setiap shift, dengan target waktu dari info diterima sampai keputusan.
- Uji kirim perintah latihan setiap bulan dari ruang kendali dan dari pos komando cadangan.

### B5. UWB dan beacon (roadmap)

- Syarat pengadaan:
  - ranging langsung antara rompi dan alat dengan latensi yang dibuktikan di lapangan;
  - rompi tetap memberi alarm saat HP mati;
  - log near miss tersimpan di rompi saat offline;
  - baterai cukup minimal satu shift;
  - tahan hujan dan debu;
  - bersertifikat SDPPI.
- Uji penerimaan mengukur alarm palsu dan alarm terlewat, dalam skenario nyata di terminal.

### B6. Deteksi APD

- Jalankan model ringan langsung di HP; foto penuh tidak dikirim ke server.
- Tanpa pengenalan wajah.
- Pakai ambang keyakinan: hasil yang meragukan diteruskan ke petugas, tidak langsung ditolak.
- Uji di HP kelas bawah, malam hari, saat hujan, dan saat silau matahari sebelum fitur diwajibkan.

### B7. Keamanan dan privasi

- Ikuti OWASP MASVS untuk keamanan aplikasi mobile. Versi terbarunya, v2.1, terbit 2024 dan sudah memuat kategori privasi. Versi ini di luar rentang referensi 2025–2026, tetapi tetap dipakai karena belum ada versi baru.
- Enkripsi data saat dikirim dan disimpan. Kanal peringatan memakai koneksi terverifikasi.
- Dashboard memakai login perusahaan dengan verifikasi dua langkah dan akses berbasis peran; setiap akses ke riwayat lokasi tercatat.
- Siapkan prosedur pemberitahuan kebocoran 3 × 24 jam sesuai PP 33/2026.

### B8. Pengujian dan operasi

- Matriks perangkat. Uji di model Android yang paling banyak dipakai pekerja, terutama merek dengan penghemat baterai agresif, dan beberapa model iPhone.
- Uji gangguan. Matikan server, pindahkan komando ke pos cadangan, dan padamkan jaringan seluler saat drill.
- Dashboard kesehatan sistem. Tampilkan persentase HP dengan heartbeat, persentase izin lengkap, dan latensi notifikasi terakhir.
- Aksesibilitas. Beri label pembaca layar pada panah dan tombol, kontras tinggi, dan getaran kuat untuk area bising.

---

## Sumber

- Investor Trust, 2 Apr 2026: TPK Bitung dan Ternate kembali beroperasi pascagempa M7,6
- Liputan6, 12 Jul 2026: karyawan tewas terlindas alat berat di Pelabuhan Sikka
- The Star, 23 Sep 2026: dua pekerja tewas jatuh ke laut di Tuas Port
- ICHCA Severe Risks Dashboard, Jun 2025
- MDPI Sensors, Jul 2025: akurasi GNSS smartphone
- CyberLogitec/PR Newswire, 6 Okt 2026: collision prevention tanpa tag di Busan New Port
- Bisnis, 8 Sep 2026: UU dan PP PDP, lembaga belum terbentuk
- Pelindo, Laporan Tahunan 2025, hlm. 764–765 (risiko kecelakaan kerja dan mitigasinya)
- Apple Developer, 2026: Displaying live data with Live Activities (Dynamic Island, batas 4 KB dan 8 jam)
- Android Developers, diperbarui 3 Mar 2026: Progress-centric notifications di Android 16
- BMKG Data Terbuka: Gempabumi (diperbarui 18 Mei 2025; batas 60 permintaan/menit/IP)
- Google Play Console Help: full-screen intent untuk aplikasi panggilan dan alarm, berlaku 22 Jan 2025
- Google Play Console Help: akses lokasi latar belakang
- Android Developers: Geofencing (diperbarui 28 Okt 2026)
- Android Developers: Foreground service types (diperbarui 28 Okt 2026)
- Firebase: Android message priority (diperbarui 12 Nov 2026)
- Apple Developer: UNNotificationInterruptionLevel (critical, time sensitive)
- Apple Developer: Monitoring the user's proximity to geographic regions (batas 20 kondisi)
- detik, 27 Mar 2025: Komdigi dan operator siagakan layanan 112 dan EWS lewat SMS blast dan TV digital
- EHS Today, 20 Mei 2025: 59% pekerja konstruksi enggan memakai perangkat pelacak
- Buildings (MDPI), 28 Jul 2025: RTLS-enabled bidirectional alert system for proximity risk mitigation in tunnel environments
- Frontiers in Built Environment, 11 Apr 2025: deteksi helm dan rompi SD-YOLOv5s
- RSM Indonesia, 18 Sep 2026 (diperbarui 27 Okt 2026): PP 33/2026, enam prioritas sebelum 16 Jan 2027
- StatCounter: pangsa OS mobile Indonesia, Okt 2026
- OWASP MASVS releases (v2.1, 2024)
