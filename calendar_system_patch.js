// ==========================================
// CALENDAR_SYSTEM_PATCH.JS
// OVERHAUL SISTEM KALENDER — TANGGAL PASTI SEBAGAI SUMBER KEBENARAN
// ==========================================
//
// Latar belakang: sistem kalender lama pakai "lompat ke perkiraan tanggal
// terdekat" (mis. kalenderGame = new Date(tahun, 1, 10), lalu cari Jumat
// terdekat) dan hitungan mundur generik (hariJeda 14 hari tanpa tanggal
// pasti). Ini diganti total dengan TABEL TANGGAL PASTI sebagai sumber
// kebenaran tunggal, sesuai kalender yang sudah disepakati bersama user:
//
// MUSIM GANJIL (S1):
//   PRAMUSIM:    1 Jan - 8 Feb
//   MDL S1:      9 Feb - 24 Mei (15 minggu, semua region paralel)
//   MPL/LEN S1:  27 Mar - 24 Mei (semua berakhir BARENG dgn MDL)
//   Playoff S1:  10-14 Jun (bracket detail per hari, lihat [B].3)
//   Jeda MSC:    14 hari setelah Playoff selesai
//   MSC:         30 Jul - 1 Ags
//   Transfer Window: jeda alami sampai MDL S2 mulai
//
// MUSIM GENAP (S2): pola identik, offset +1 tahun kalender dari S1
//   MDL S2:      10 Ags - 22 Nov
//   MPL/LEN S2:  25 Sep - 22 Nov
//   Playoff S2:  9-13 Des
//   Jeda M-Series: 14 hari
//   M-Series:    21-23 Jan (TAHUN BERIKUTNYA)
//   Transfer Window: jeda alami sampai MDL S1 berikutnya
//
// Kalender LINEAR maju terus dari 1 Jan 2026, tidak ada reset/loop balik
// ke tahun yang sama (sesuai keputusan: skenario reset tidak relevan).
//
// File ini dimuat SETELAH database.js dan SEBELUM script.js, karena
// script.js akan memanggil fungsi-fungsi di sini untuk menentukan
// transisi statusGame berdasarkan tanggal kalenderGame saat ini.
// ==========================================

// ------------------------------------------------------------------
// [A.1] BANGUN TABEL TANGGAL KUNCI UNTUK SATU TAHUN MUSIM (S1 atau S2)
// Parameter tahunAwal = tahun kalender saat PRAMUSIM/MDL/MPL musim itu
// dimulai. M-Series S2 jatuh di TAHUN BERIKUTNYA (21-23 Jan).
// ------------------------------------------------------------------
function bangunTabelTanggalMusim(tahunAwal, tipeMusim) {
    // tipeMusim: "GANJIL" (S1) atau "GENAP" (S2)
    if (tipeMusim === "GANJIL") {
        return {
            tipeMusim: "GANJIL",
            tahunAwal,
            pramusimMulai: new Date(tahunAwal, 0, 1),       // 1 Jan
            mdlMulai: new Date(tahunAwal, 1, 9),            // 9 Feb
            mplLenMulai: new Date(tahunAwal, 2, 27),        // 27 Mar
            // [EKSTRAPOLASI] Belum ada data resmi buat musim ganjil kayak
            // S18 (genap). Dihitung pake rasio offset yang SAMA persis
            // dari data real S18 (transferWindowMulaiMPL 81 hari sebelum
            // mplLenMulai, rosterLockMPL 18 hari sebelum mplLenMulai) --
            // gampang di-update kalau nanti ada pengumuman resmi.
            transferWindowMulaiMPL: new Date(tahunAwal, 0, 5),  // ~5 Jan (81 hari sblm 27 Mar)
            rosterLockMPL: new Date(tahunAwal, 2, 9),           // ~9 Mar (18 hari sblm 27 Mar)
            regulerSelesai: new Date(tahunAwal, 4, 24),     // 24 Mei (MDL & MPL/LEN bareng)
            playoffMulai: new Date(tahunAwal, 5, 10),       // 10 Jun
            playoffSelesai: new Date(tahunAwal, 5, 14),     // 14 Jun
            // [MSC x EWC 2026] Timeline resmi -- gantiin turnamenGlobalMulai/
            // Selesai lama (30 Jul - 1 Ags) yang cuma 1 tanggal blok doang.
            rosterLockMSC: new Date(tahunAwal, 5, 21),      // 21 Jun
            wildCardMulai: new Date(tahunAwal, 6, 1),       // 1 Jul
            wildCardSelesai: new Date(tahunAwal, 6, 4),     // 4 Jul
            groupStageMulai: new Date(tahunAwal, 6, 22),    // 22 Jul
            groupStageSelesai: new Date(tahunAwal, 6, 26),  // 26 Jul
            knockoutMulai: new Date(tahunAwal, 6, 29),      // 29 Jul
            knockoutSelesai: new Date(tahunAwal, 6, 31),    // 31 Jul
            grandFinalTanggal: new Date(tahunAwal, 7, 1),   // 1 Ags
            // Alias dipertahankan buat kompatibilitas kode lama (hitungan
            // "hariJeda" jeda persiapan) -- span penuh WC awal s/d GF akhir.
            turnamenGlobalMulai: new Date(tahunAwal, 6, 1), // = wildCardMulai
            turnamenGlobalSelesai: new Date(tahunAwal, 7, 1), // = grandFinalTanggal
            namaTurnamenGlobal: "MSC",
            // Musim berikutnya (S2) MDL mulai 10 Ags tahun yg sama
            musimBerikutnyaMdlMulai: new Date(tahunAwal, 7, 10)
        };
    } else {
        return {
            tipeMusim: "GENAP",
            tahunAwal,
            mdlMulai: new Date(tahunAwal, 7, 10),           // 10 Ags
            // [UPDATE REAL MPL ID S18] Sebelumnya 25 Sep (asumsi/template) --
            // diganti sesuai pengumuman resmi: MPL SELURUH REGION & LEN
            // sama-sama mulai 14 Agustus 2026.
            mplLenMulai: new Date(tahunAwal, 7, 14),        // 14 Ags
            // [BARU] Sebelumnya roster lock cuma dihitung otomatis "-7 hari
            // dari mplLenMulai" (lihat ui.js) -- gak akurat buat S18 asli
            // yang gap-nya 18 hari. Sekarang dikasih tanggal eksplisit
            // sesuai pengumuman resmi, biar gak bergantung ke asumsi offset.
            transferWindowMulaiMPL: new Date(tahunAwal, 4, 25), // 25 Mei (transfer window buka)
            rosterLockMPL: new Date(tahunAwal, 6, 27),          // 27 Jul (transfer window ditutup)
            regulerSelesai: new Date(tahunAwal, 10, 22),    // 22 Nov
            playoffMulai: new Date(tahunAwal, 11, 9),       // 9 Des
            playoffSelesai: new Date(tahunAwal, 11, 13),    // 13 Des
            // [M7 WORLD CHAMPIONSHIP] Timeline resmi -- gantiin turnamenGlobalMulai/
            // Selesai lama (21-23 Jan) yang cuma 1 tanggal blok doang, sesuai
            // MASTER PROMPT M7. Semua tanggal jatuh di TAHUN BERIKUTNYA.
            // Roster Lock: 10 hari sebelum Wild Card mulai (konvensi sama kayak
            // rosterLockMSC di musim ganjil -- gak dikasih tanggal eksplisit di
            // dokumen M7, jadi dipakai konvensi yang sudah ada).
            rosterLockM7: new Date(tahunAwal, 11, 24),      // 24 Des tahunAwal (10 hari sblm 3 Jan)
            wildCardMulai: new Date(tahunAwal + 1, 0, 3),   // 3 Jan (Group Stage Day 1)
            wildCardSelesai: new Date(tahunAwal + 1, 0, 6), // 6 Jan (Qualification Match)
            swissR1: new Date(tahunAwal + 1, 0, 10),        // 10 Jan
            swissR2: new Date(tahunAwal + 1, 0, 11),        // 11 Jan
            swissR3a: new Date(tahunAwal + 1, 0, 12),       // 12 Jan (bracket 2-0 & 1-1)
            swissR3b: new Date(tahunAwal + 1, 0, 13),       // 13 Jan (bracket 0-2)
            swissR4: new Date(tahunAwal + 1, 0, 15),        // 15 Jan
            swissR5: new Date(tahunAwal + 1, 0, 17),        // 17 Jan
            swissMulai: new Date(tahunAwal + 1, 0, 10),     // = swissR1
            swissSelesai: new Date(tahunAwal + 1, 0, 17),   // = swissR5
            knockoutUBQF: new Date(tahunAwal + 1, 0, 18),   // 18 Jan
            knockoutUBSF: new Date(tahunAwal + 1, 0, 21),   // 21 Jan
            knockoutUBFinal: new Date(tahunAwal + 1, 0, 22),// 22 Jan
            knockoutSelesai: new Date(tahunAwal + 1, 0, 24),// 24 Jan (akhir window Knockout per timeline)
            grandFinalTanggal: new Date(tahunAwal + 1, 0, 25), // 25 Jan
            // Alias dipertahankan buat kompatibilitas kode lama (hitungan
            // "hariJeda" jeda persiapan) -- span penuh WC awal s/d GF akhir.
            turnamenGlobalMulai: new Date(tahunAwal + 1, 0, 3), // = wildCardMulai
            turnamenGlobalSelesai: new Date(tahunAwal + 1, 0, 25), // = grandFinalTanggal
            namaTurnamenGlobal: "M7 WORLD CHAMPIONSHIP",
            // Musim berikutnya (S1 tahun depan) MDL mulai 9 Feb tahun depan
            musimBerikutnyaMdlMulai: new Date(tahunAwal + 1, 1, 9)
        };
    }
}

// ------------------------------------------------------------------
// [A.2] BANGUN JADWAL PLAYOFF MPL PER HARI (5 hari: Rabu-Minggu)
// Setiap entri berisi tanggal pasti + label fase, dipetakan langsung
// ke playoffFase (1-5) yang SUDAH ADA di script.js -- TIDAK mengubah
// logika pertandingannya, cuma menambahkan jangkar tanggal.
// ------------------------------------------------------------------
function bangunJadwalPlayoffPerHari(playoffMulai) {
    let h = (n) => { let d = new Date(playoffMulai); d.setDate(d.getDate() + n); return d; };
    return {
        1: { tanggal: h(0), label: "Round 1 (Play-In)" },           // Rabu
        2: { tanggal: h(1), label: "Round 2 (UB Semi Final)" },     // Kamis
        3: { tanggal: h(2), label: "LB Semi + UB Final" },          // Jumat
        4: { tanggal: h(3), label: "Lower Bracket Final" },         // Sabtu
        5: { tanggal: h(4), label: "Grand Final" }                  // Minggu
    };
}

// ------------------------------------------------------------------
// [A.3] BANGUN JADWAL PLAYOFF MAL MY PER HARI (3 hari: QF/SF/Final,
// jatuh di Rabu-Jumat, paralel dengan hari 1-3 Playoff MPL)
// ------------------------------------------------------------------
function bangunJadwalPlayoffMALMYPerHari(playoffMulai) {
    let h = (n) => { let d = new Date(playoffMulai); d.setDate(d.getDate() + n); return d; };
    return {
        QF: { tanggal: h(0), label: "Quarter Final" },   // Rabu (bareng MPL R1 & Playoff Degradasi)
        SF: { tanggal: h(1), label: "Semi Final" },      // Kamis (bareng MPL R2)
        FINAL: { tanggal: h(2), label: "Final MAL MY" }  // Jumat (bareng MPL LB Semi+UB Final)
    };
}

// ------------------------------------------------------------------
// [A.4] HELPER — BANDINGKAN TANGGAL (cuma tanggal, abaikan jam/menit)
// ------------------------------------------------------------------
function tanggalSama(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function tanggalSetelahAtauSama(a, b) {
    // true kalau a >= b (berdasarkan tanggal kalender, bukan jam)
    let aOnly = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    let bOnly = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return aOnly.getTime() >= bOnly.getTime();
}

function selisihHari(a, b) {
    let aOnly = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    let bOnly = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((bOnly - aOnly) / (1000 * 60 * 60 * 24));
}

// ------------------------------------------------------------------
// [A.5] AMBIL TABEL TANGGAL UNTUK MUSIM SAAT INI, BERDASARKAN musimKe
// musimKe ganjil = S1 (tahun kalenderGame saat ini / tahun mulai musim itu)
// musimKe genap = S2
// Tahun ditentukan dari window._tahunMusimSaatIni yang di-track terpisah
// (supaya tidak perlu re-derive dari kalenderGame yang bisa berubah-ubah
// posisi tanggalnya sepanjang musim berjalan).
// ------------------------------------------------------------------
function ambilTabelTanggalMusimSaatIni() {
    if (!window._tahunMusimSaatIni) window._tahunMusimSaatIni = 2026;
    let tipeMusim = (typeof musimKe !== "undefined" && musimKe % 2 === 0) ? "GENAP" : "GANJIL";
    return bangunTabelTanggalMusim(window._tahunMusimSaatIni, tipeMusim);
}

// ==========================================
// [B] SISTEM ROSTER LOCK PER-LIGA
// ==========================================
//
// Sesuai keputusan bersama user:
// - Roster Lock mulai 7 HARI SEBELUM musim reguler liga itu mulai
// - Berlaku TERPISAH per liga (MDL lock duluan krn mulai duluan,
//   MPL/LEN lock belakangan sesuai tanggal mulainya sendiri)
// - Begitu lock aktif, TERTUTUP TOTAL sampai musim itu BERAKHIR --
//   TIDAK ada celah buka-lagi di tengah (termasuk "melewati" mid-season
//   window 7 hari tanpa terbuka, sesuai sistem lama yang memang tidak
//   py logika buka-khusus di titik itu)
// - Field/flag BARU, terpisah dari transferBuka global yang sudah ada --
//   transferBuka tetap dipakai utk Pramusim/Transfer Window biasa,
//   rosterLock jadi LAPISAN VALIDASI TAMBAHAN khusus per-liga
// ==========================================

// ------------------------------------------------------------------
// [B.1] CEK STATUS ROSTER LOCK UNTUK SATU LIGA TERTENTU
// liga: "MDL" atau "MPL" (LEN disamakan dgn MPL krn mulai bareng 27 Mar)
// ------------------------------------------------------------------
function cekStatusRosterLock(liga) {
    let tabelTanggal = ambilTabelTanggalMusimSaatIni();
    if (!tabelTanggal) return { terkunci: false };

    // [FIX] Celah Mid-Season (4 hari, minggu ke-4 -> ke-5) khusus liga
    // "MPL" (dipakai jg oleh LEN/MAL krn jadwalnya sama persis). Dibuka
    // berdasarkan statusGame == "MID_SEASON" yang SESUNGGUHNYA jalan
    // tiap klik hari (bukan hitungan tanggal terpisah) -- biar gak ada
    // risiko selisih/drift antara 2 sumber kebenaran yang berbeda.
    // Sebelumnya sistem ini gak py celah sama sekali, jadi window
    // Mid-Season yang diumumkan di statusGame gak pernah beneran
    // ngebuka transfer (roster lock nutup terus tanpa jeda).
    if (liga === "MPL" && typeof statusGame !== "undefined" && statusGame === "MID_SEASON") {
        return { terkunci: false, midSeasonWindowTerbuka: true };
    }

    let tanggalMulaiLiga = (liga === "MDL") ? tabelTanggal.mdlMulai : tabelTanggal.mplLenMulai;
    let tanggalLockMulai = new Date(tanggalMulaiLiga);
    tanggalLockMulai.setDate(tanggalLockMulai.getDate() - 7);

    let tanggalMusimBerakhir = tabelTanggal.regulerSelesai;

    // Belum masuk window lock sama sekali
    if (!tanggalSetelahAtauSama(kalenderGame, tanggalLockMulai)) {
        return { terkunci: false, tanggalLockMulai };
    }

    // Sudah lewat musim berakhir -> lock otomatis lepas (musim baru/jeda)
    if (tanggalSetelahAtauSama(kalenderGame, tanggalMusimBerakhir)
        && !tanggalSama(kalenderGame, tanggalMusimBerakhir)) {
        // kalenderGame > regulerSelesai (bukan PAS di hari itu) -> sudah lewat musim
        return { terkunci: false, sudahLewatMusim: true };
    }

    // Di antara tanggalLockMulai dan akhir musim (inklusif) -> TERKUNCI
    return {
        terkunci: true,
        tanggalLockMulai,
        tanggalMusimBerakhir,
        sisaHariMenujuMulai: Math.max(0, selisihHari(kalenderGame, tanggalMulaiLiga))
    };
}

// ------------------------------------------------------------------
// [B.2] CEK APAKAH TIM PLAYER SAAT INI SEDANG TERKENA ROSTER LOCK
// Liga ditentukan dari ligaPlayer ("MDL" tetap MDL, "MPL"/"MAL"/"LEN"
// semua disamakan dgn jadwal MPL/LEN krn mulai bareng 27 Mar -- MAL MY
// juga ikut tanggal sama persis dgn ID sesuai keputusan sebelumnya).
// ------------------------------------------------------------------
function timPlayerSedangRosterLock() {
    if (typeof ligaPlayer === "undefined") return { terkunci: false };
    let ligaUntukCek = (ligaPlayer === "MDL") ? "MDL" : "MPL"; // MAL/LEN/MPL semua pakai jadwal "MPL"
    return cekStatusRosterLock(ligaUntukCek);
}

// ------------------------------------------------------------------
// [B.3] PESAN STANDAR UNTUK DITAMPILKAN SAAT TRANSFER DITOLAK KRN LOCK
// ------------------------------------------------------------------
function pesanRosterLockAktif(statusLock) {
    if (!statusLock || !statusLock.terkunci) return null;
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    function fmt(d) { return hari[d.getDay()] + ', ' + d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear(); }

    return `🔒 Roster Lock aktif! Bursa transfer tertutup sampai musim ini berakhir (${fmt(statusLock.tanggalMusimBerakhir)}).`;
}

// ==========================================
// [C] TRANSFER WINDOW TERPISAH PER LIGA
// ==========================================
// Sesuai keputusan bersama user: MPL, MDL, dan LEN/MAL punya siklus
// transfer window MASING-MASING, gak numpang ke jadwal MPL/MSC lagi.
//
// - MPL: tetap ikutin siklus lama (transferBuka global, yang sudah
//   di-drive oleh statusGame -- PRAMUSIM / MID_SEASON / JEDA_TRANSFER
//   pasca-MSC/M-Series). Gak diubah, cuma sekarang MID_SEASON-nya
//   beneran kebuka berkat fix [B.1] di atas.
//
// - MDL & LEN/MAL: window transfer mereka JALAN SENDIRI --
//   * TERTUTUP selama reguler season + Playoff Degradasi/Promosi
//     (yang barengan minggu Playoff MPL, s/d tabelTanggal.playoffSelesai)
//   * TERBUKA begitu Playoff Degradasi/Promosi kelar, TANPA nunggu
//     MSC/M-Series MPL selesai
//   * TERTUTUP LAGI begitu kena roster lock liga masing-masing (7 hari
//     sebelum musim berikutnya liga itu sendiri dimulai -- MDL & LEN
//     dihitung terpisah lewat cekStatusRosterLock("MDL"/"MPL"))
// ------------------------------------------------------------------
function apakahTransferTerbuka() {
    if (typeof ligaPlayer === "undefined") return (typeof transferBuka !== "undefined") ? transferBuka : false;

    if (ligaPlayer === "MDL" || ligaPlayer === "MAL" || ligaPlayer === "LEN") {
        let tabel = ambilTabelTanggalMusimSaatIni();
        if (tabel && typeof kalenderGame !== "undefined") {
            let tanggalMulaiLigaSendiri = (ligaPlayer === "MDL") ? tabel.mdlMulai : tabel.mplLenMulai;
            // Masih dalam rentang reguler season s/d Playoff Degradasi/Promosi
            // kelar (playoffSelesai) -> belum kebuka, apapun kata roster lock.
            if (tanggalSetelahAtauSama(kalenderGame, tanggalMulaiLigaSendiri)
                && !tanggalSetelahAtauSama(kalenderGame, tabel.playoffSelesai)) {
                return false;
            }
        }
        // Playoff Degradasi/Promosi sudah kelar -> terbuka selama belum
        // kena roster lock liga sendiri (independen dari MPL/MSC).
        let ligaCek = (ligaPlayer === "MDL") ? "MDL" : "MPL"; // LEN/MAL ikut jadwal MPL (mulai bareng)
        let statusLock = cekStatusRosterLock(ligaCek);
        return !statusLock.terkunci;
    }

    // MPL: tetap pakai transferBuka global seperti sebelumnya.
    return (typeof transferBuka !== "undefined") ? transferBuka : false;
}
window.apakahTransferTerbuka = apakahTransferTerbuka;

// ==========================================
// [C] ELIGIBILITY PEMAIN UNTUK MSC / M7
// ==========================================
//
// Konteks: transfer window MPL/LEN kebuka jauh lebih lama daripada durasi
// roster-lock turnamen internasional (MSC/M7). Roster buat MSC di-lock
// duluan (rosterLockMSC), padahal MSC sendiri baru MULAI & masih JALAN
// belakangan (wildCardMulai s/d grandFinalMSC) -- di tengah situ transfer
// window MASIH KEBUKA. Jadi tim bisa aja beli pemain baru SAAT MSC lagi
// berlangsung, padahal roster-nya udah dikunci duluan.
//
// Aturan (hasil diskusi bareng user):
// - CUMA berlaku buat tim level MPL (tim.liga === "MPL"). MDL/MAL/LEN
//   gak punya jalur ke turnamen internasional, jadi gak relevan.
// - Pemain yang gabung (tanggalBergabung) SETELAH roster-lock turnamen
//   yang lagi relevan (rosterLockMSC utk musim ganjil, rosterLockM7 utk
//   musim genap) dianggap BELUM ELIGIBLE main di turnamen itu.
// - Status "belum eligible" itu ilang otomatis begitu musim MPL
//   BERIKUTNYA resmi mulai (mplLenMulai musim depan) -- bukan pas
//   turnamen internasionalnya kelar, tapi pas musim MPL baru dimulai.
// - Kalau di 1 role cuma ada 1 pemain & dia ineligible (gak ada
//   pengganti), tetap dimainkan apa adanya -- skenario ini dianggap
//   sangat jarang (tim yang lolos MSC/M7 biasanya gak bakal jual core
//   roster mereka sendiri).
// - Gak ada indikator UI -- murni logic simulasi di belakang layar.
// ==========================================

// Ambil tabel tanggal musim MPL BERIKUTNYA dari suatu tabel musim
// tertentu -- dipakai buat nentuin kapan status "belum eligible" ilang.
// GANJIL(Y) -> GENAP(Y) [tahun sama]. GENAP(Y) -> GANJIL(Y+1) [tahun +1].
function ambilTabelMusimBerikutnya(tabelSaatIni) {
    if (!tabelSaatIni) return null;
    if (tabelSaatIni.tipeMusim === "GANJIL") {
        return bangunTabelTanggalMusim(tabelSaatIni.tahunAwal, "GENAP");
    }
    return bangunTabelTanggalMusim(tabelSaatIni.tahunAwal + 1, "GANJIL");
}
window.ambilTabelMusimBerikutnya = ambilTabelMusimBerikutnya;

// [BARU] Sebelumnya begitu MSC/M7 kelar, transfer window selalu dikasih
// FIX 30 hari (event-driven, gak peduli tanggal kalender). Padahal di
// realita transfer window MPL/LEN itu CALENDAR-DRIVEN (buka 25 Mei,
// tutup 27 Jul buat S18) -- seringkali udah KETUTUP duluan SEBELUM MSC/M7
// bahkan kelar. Helper ini hitung sisa hari yang BENERAN sesuai tanggal
// rosterLockMPL musim ini, bukan angka 30 asal comot. Kalau rosterLockMPL
// udah kelewat (kasus paling umum, sesuai timeline real S18), hasilnya
// 0 -- transfer ditutup di hari itu juga, gak ada jeda "30 hari gratis".
function hitungHariJedaTransferPascaTurnamen() {
    let tabel = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
    if (!tabel || !tabel.rosterLockMPL || typeof kalenderGame === "undefined" || !kalenderGame) return 30; // fallback safety kalau data gak lengkap

    let sisaMs = tabel.rosterLockMPL.getTime() - kalenderGame.getTime();
    let sisaHari = Math.round(sisaMs / 86400000);
    return Math.max(sisaHari, 0);
}
window.hitungHariJedaTransferPascaTurnamen = hitungHariJedaTransferPascaTurnamen;

// Cek apakah 1 pemain boleh diturunin di match MSC/M7. timObjek dibutuhin
// buat ngecek liga-nya (cuma MPL yang kena aturan ini).
function apakahPemainEligibleMSCM7(pemain, timObjek) {
    if (!pemain) return false;
    if (!timObjek || timObjek.liga !== "MPL") return true; // MDL/MAL/LEN gak kena aturan ini
    if (!pemain.tanggalBergabung) return true; // pemain lama (dari awal musim), otomatis eligible

    let tabel = ambilTabelTanggalMusimSaatIni();
    if (!tabel || typeof tanggalSetelahAtauSama !== "function") return true;

    let rosterLockRelevan = (tabel.tipeMusim === "GANJIL") ? tabel.rosterLockMSC : tabel.rosterLockM7;
    if (!rosterLockRelevan) return true;

    // Gabung SEBELUM/PAS roster lock -> udah eligible dari awal.
    // [FIX] Defensif: tanggalBergabung SEHARUSNYA selalu objek Date, tapi
    // kalau somehow masih string (misal ada jalur save/load lain yang
    // belum ke-cover sama revive pass di loadGame), convert dulu di sini
    // biar gak crash "getTime is not a function".
    let tglGabung = (pemain.tanggalBergabung instanceof Date) ? pemain.tanggalBergabung : new Date(pemain.tanggalBergabung);
    if (tglGabung.getTime() <= rosterLockRelevan.getTime()) {
        return true;
    }

    // Gabung SETELAH roster lock -> ineligible sampai musim MPL
    // berikutnya resmi mulai.
    let tabelBerikutnya = ambilTabelMusimBerikutnya(tabel);
    if (!tabelBerikutnya) return true; // safety fallback, jangan sampai nge-block permanen krn data gak lengkap

    return tanggalSetelahAtauSama(kalenderGame, tabelBerikutnya.mplLenMulai);
}
window.apakahPemainEligibleMSCM7 = apakahPemainEligibleMSCM7;
