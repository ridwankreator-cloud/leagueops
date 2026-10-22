// ==========================================
// MDL_LEN_ENGINE.JS
// FASE 11 — Simulasi Engine MDL ID & LEN (Round Robin + Playoff Degradasi BO5)
// ==========================================
//
// Latar belakang: engine simulasi yang sudah ada (buatJadwalMusim, dkk di
// script.js) ditulis SPESIFIK untuk 4 region MPL (8-9 tim, 9 minggu).
// Engine ini TIDAK bisa dipakai langsung untuk MDL ID (16 tim) & LEN
// (9 tim) karena asumsi jumlah tim & minggu yang berbeda. File ini
// membangun engine round-robin generik yang reusable, sambil tetap
// memanfaatkan fungsi yang sudah teruji (hitungPerformaMatch, pola BO3).
//
// Lingkup Fase 11 (sesuai rangkuman desain):
// - Generator jadwal Round Robin generik (bisa dipakai liga manapun)
// - Simulasi pertandingan MDL ID & LEN (skip-time, bukan per-pertandingan
//   manual seperti MPL -- karena player TIDAK bermain di liga lain selain
//   liganya sendiri; tim lain di liganya disimulasikan otomatis)
// - Klasemen MDL ID SATU gabungan (label AFILIASI/INDEPENDEN, sesuai
//   keputusan desain), klasemen LEN biasa
// - Akhir musim: deteksi bottom 2 Independen MDL ID -> Playoff Degradasi
//   BO5 vs Juara 1 & 2 LEN
//
// File ini dimuat SETELAH database.js, financial_ai_patch.js,
// acquisition_merger_patch.js, dan SEBELUM script.js (karena beberapa
// fungsi UI nanti akan memanggil fungsi render dari sini).
// ==========================================

// ------------------------------------------------------------------
// [11.1] GENERATOR JADWAL ROUND ROBIN GENERIK
// Algoritma round-robin standar (circle method), MENDUKUNG jumlah tim
// ganjil (otomatis kasih "BYE") maupun genap. Mengembalikan array of
// match { home, away, week, sudahMain, skorHome, skorAway }.
// Berbeda dari bikinJadwal() versi MPL (yang asumsi tetap 9 minggu),
// di sini jumlah minggu dihitung otomatis dari jumlah tim.
// ------------------------------------------------------------------
function buatJadwalRoundRobinGenerik(daftarTimLiga, jumlahPutaran = 2) {
    let timList = daftarTimLiga.map(t => ({ ref: t, nama: t.nama }));
    let adaBye = timList.length % 2 !== 0;
    if (adaBye) timList.push({ nama: "BYE", ref: null });

    let n = timList.length;
    let jumlahRondaPerPutaran = n - 1;
    let matches = [];
    let mingguCounter = 1;

    for (let putaran = 0; putaran < jumlahPutaran; putaran++) {
        // Reset urutan tim di awal tiap putaran supaya pairing putaran 1
        // (kandang) dan putaran 2 (tandang) konsisten dengan tim asli
        let urutanRonda = [...timList];

        for (let r = 0; r < jumlahRondaPerPutaran; r++) {
            for (let i = 0; i < n / 2; i++) {
                let timA = urutanRonda[i];
                let timB = urutanRonda[n - 1 - i];

                if (timA.nama !== "BYE" && timB.nama !== "BYE") {
                    let home = putaran % 2 === 0 ? timA : timB;
                    let away = putaran % 2 === 0 ? timB : timA;
                    matches.push({
                        home: home.ref,
                        away: away.ref,
                        week: mingguCounter,
                        sudahMain: false,
                        skorHome: 0,
                        skorAway: 0
                    });
                }
            }
            // Rotasi ala round-robin circle method
            let last = urutanRonda.pop();
            urutanRonda.splice(1, 0, last);
            mingguCounter++;
        }
    }

    return matches;
}

// ------------------------------------------------------------------
// [11.2] INISIALISASI STATISTIK KLASEMEN TIM (reset di awal musim liga)
// Memastikan semua field statistik ada & ter-reset ke 0, supaya klasemen
// dimulai bersih tiap musim baru (sama prinsipnya dengan tim MPL).
// ------------------------------------------------------------------
function resetStatistikKlasemen(daftarTimLiga) {
    daftarTimLiga.forEach(t => {
        t.matchW = 0;
        t.matchL = 0;
        t.gameW = 0;
        t.gameL = 0;
        t.poin = 0;
        t.netGame = 0;
    });
}

// ------------------------------------------------------------------
// [11.3] SIMULASI SATU MATCH (format BO3, sama pola dgn engine MPL yg
// sudah ada) -- generik, bisa dipakai tim manapun yang punya roster/staff.
// ------------------------------------------------------------------
function simulasikanMatchBO3Generik(match) {
    if (!match.home || !match.away) return; // safety utk slot BYE/kosong

    let skorHome = 0, skorAway = 0;
    for (let game = 0; game < 3; game++) {
        if (skorHome === 2 || skorAway === 2) break;
        let performaHome = hitungPerformaMatch(match.home);
        let performaAway = hitungPerformaMatch(match.away);
        if (performaHome > performaAway) skorHome++;
        else skorAway++;
    }

    match.skorHome = skorHome;
    match.skorAway = skorAway;
    match.sudahMain = true;

    match.home.gameW += skorHome;
    match.home.gameL += skorAway;
    match.away.gameW += skorAway;
    match.away.gameL += skorHome;
    match.home.netGame = (match.home.gameW || 0) - (match.home.gameL || 0);
    match.away.netGame = (match.away.gameW || 0) - (match.away.gameL || 0);

    if (skorHome > skorAway) {
        match.home.matchW = (match.home.matchW || 0) + 1;
        match.away.matchL = (match.away.matchL || 0) + 1;
        match.home.poin = (match.home.poin || 0) + 1;
    } else {
        match.away.matchW = (match.away.matchW || 0) + 1;
        match.home.matchL = (match.home.matchL || 0) + 1;
        match.away.poin = (match.away.poin || 0) + 1;
    }
}

// ==========================================
// BAGIAN 2 — SIKLUS MUSIM (SKIP-TIME) & DETEKSI DEGRADASI
// ==========================================
//
// Ritme: SATU pertandingan disimulasikan tiap kali player skip 1 hari,
// PERSIS sama dengan ritme MPL yang sudah ada (lihat simulasikanAI() di
// script.js). Berlaku konsisten baik player bermain langsung di liga itu
// ATAU cuma "menonton" dari liga lain (misal player ada di MPL, MDL ID
// & LEN tetap berjalan di belakang layar dengan ritme yang sama).
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// [11.4] INISIALISASI MUSIM BARU UTK MDL ID & LEN
// Dipanggil sekali di awal musim (bersamaan dgn buatJadwalMusim() versi
// MPL), generate jadwal round-robin & reset statistik klasemen.
// ------------------------------------------------------------------
function inisialisasiMusimMDLdanLEN() {
    if (typeof daftarTimMDL_ID === "undefined" || typeof daftarTimLEN === "undefined") {
        console.warn("Database MDL ID / LEN belum termuat, skip inisialisasi.");
        return;
    }

    resetStatistikKlasemen(daftarTimMDL_ID);
    resetStatistikKlasemen(daftarTimLEN);

    // 2 putaran (kandang-tandang) round robin, sama seperti MPL
    window.jadwalMDL_ID = buatJadwalRoundRobinGenerik(daftarTimMDL_ID, 2);
    window.jadwalLEN = buatJadwalRoundRobinGenerik(daftarTimLEN, 2);

    // Urutan eksekusi: dari belakang (pop), sama pola dgn jadwalMatchID dkk
    // di script.js, supaya konsisten cara "mengonsumsi" jadwal tiap skip hari.
    window.jadwalMDL_ID.reverse();
    window.jadwalLEN.reverse();

    window._musimMDLLENSelesai = false;
}

// ------------------------------------------------------------------
// [11.5] SIMULASIKAN SATU PERTANDINGAN MDL ID & SATU LEN
// Dipanggil tiap skip hari (hook ke script.js, lihat catatan integrasi
// di akhir file). Kalau jadwal sudah habis tapi musim belum "ditutup",
// trigger prosesAkhirMusimMDLdanLEN() otomatis.
// ------------------------------------------------------------------
function tickSimulasiMDLdanLEN() {
    if (window._musimMDLLENSelesai) return;
    if (typeof window.jadwalMDL_ID === "undefined" && typeof window.jadwalLEN === "undefined") return;

    let adaJadwalTersisa = false;

    // ── MDL ID: Senin-Kamis saja, 4 match/hari ──────────────────────────
    // MDL main 4 hari/minggu (Sen-Kam), 4 match/hari = 16 match/minggu.
    // 16 tim double RR = 240 match → 15 minggu aktif (9 Feb - 21 Mei).
    // Tick dipanggil setiap hari oleh kalenderGame, tapi MDL hanya
    // memproses match di hari Senin(1), Selasa(2), Rabu(3), Kamis(4).
    // kalenderGame.getDay(): 0=Min,1=Sen,2=Sel,3=Rab,4=Kam,5=Jum,6=Sab
    let hariMDL = kalenderGame.getDay(); // 0=Min, 1-4=Sen-Kam, 5=Jum, 6=Sab
    let bolehTickMDL = (hariMDL >= 1 && hariMDL <= 4); // Sen-Kam
    if (bolehTickMDL) {
        for (let i = 0; i < 4; i++) {
            if (window.jadwalMDL_ID && window.jadwalMDL_ID.length > 0) {
                simulasikanMatchBO3Generik(window.jadwalMDL_ID.pop());
                adaJadwalTersisa = true;
            }
        }
    }

    // ── LEN: Jumat/Sabtu/Minggu, pola 2/3/3 per minggu (sama kayak MPL ID) ──
    // LEN: 9 tim double RR = 72 match, 8 match/minggu × 9 minggu = 72 ✅
    // Mulai 27 Mar (Jumat), selesai 24 Mei (Minggu) — tepat bareng MPL.
    // Tick LEN hanya di Jum(5)/Sab(6)/Min(0), jumlah match ikut pola MPL:
    // Jumat = 2, Sabtu = 3, Minggu = 3.
    // Gating: tidak boleh main sebelum mplLenMulai (27 Mar).
    let bolehMulaiLEN = true;
    if (typeof ambilTabelTanggalMusimSaatIni === "function" && typeof tanggalSetelahAtauSama === "function") {
        let tabelTanggal = ambilTabelTanggalMusimSaatIni();
        bolehMulaiLEN = tabelTanggal ? tanggalSetelahAtauSama(kalenderGame, tabelTanggal.mplLenMulai) : true;
    }
    if (bolehMulaiLEN) {
        let hariLEN = kalenderGame.getDay(); // 0=Min, 5=Jum, 6=Sab
        let matchLEN = 0;
        if (hariLEN === 5) matchLEN = 2;      // Jumat
        else if (hariLEN === 6) matchLEN = 3; // Sabtu
        else if (hariLEN === 0) matchLEN = 3; // Minggu
        for (let i = 0; i < matchLEN; i++) {
            if (window.jadwalLEN && window.jadwalLEN.length > 0) {
                simulasikanMatchBO3Generik(window.jadwalLEN.pop());
                adaJadwalTersisa = true;
            }
        }
        if (matchLEN > 0) adaJadwalTersisa = true;
    }

    // Cek apakah keduanya sudah habis → trigger prosesAkhir + set flag
    // untuk playoff degradasi (akan dijalankan di Fase 1 Playoff, 10 Jun).
    let mdlHabis = !window.jadwalMDL_ID || window.jadwalMDL_ID.length === 0;
    let lenHabis = !window.jadwalLEN || window.jadwalLEN.length === 0;
    let keduanyaHabis = mdlHabis && lenHabis;

    if (keduanyaHabis && !window._musimMDLLENSelesai) {
        window._musimMDLLENSelesai = true;
        prosesAkhirMusimMDLdanLEN();
    }

    return adaJadwalTersisa;
}

// ------------------------------------------------------------------
// [11.6] DETEKSI BOTTOM 2 INDEPENDEN MDL ID (klasemen gabungan, tapi
// filter cuma yang tipeSlot === "Independen" sesuai keputusan desain)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// [11.7] AMBIL JADWAL SELANJUTNYA UNTUK PLAYER YANG MAIN DI LEN/MDL/MAL
// buatJadwalMusim() (script.js) cuma ngecek region MPL ID/PH/MY/SG buat
// ngisi jadwalTimPlayer -- liga lain gak pernah dicek di sana, jadi
// jadwalTimPlayer permanen kosong selamanya buat player non-MPL.
// Fungsi ini dipanggil tiap updateDashboard() buat refresh manual,
// nyari match terdekat milik player dari array jadwal liga yang sesuai.
// READ ONLY (gak nge-pop) -- biar gak dobel proses sama tickSimulasi-nya,
// dan gak nampilin match liga yang belum waktunya mulai (LEN/MAL MY masih
// nunggu 27 Mar meskipun jadwalnya udah dibuat dari 9 Feb).
// ------------------------------------------------------------------
function ambilJadwalSelanjutnyaNonMPL() {
    if (typeof timPlayer === "undefined" || typeof ligaPlayer === "undefined") return null;

    function cariDariArray(arr) {
        if (!arr) return null;
        for (let i = arr.length - 1; i >= 0; i--) {
            let m = arr[i];
            if (m && m.home && m.away && (m.home.nama === timPlayer || m.away.nama === timPlayer)) return m;
        }
        return null;
    }

    function bolehTampilMPLLenSchedule() {
        // Gerbang yang SAMA kayak yang dipakai tickSimulasiMDLdanLEN/MALMY
        // -- LEN & MAL MY ikut tanggal mulai MPL (27 Mar), bukan MDL (9 Feb).
        if (typeof ambilTabelTanggalMusimSaatIni !== "function" || typeof tanggalSetelahAtauSama !== "function") return true;
        let tabelTanggal = ambilTabelTanggalMusimSaatIni();
        return tabelTanggal ? tanggalSetelahAtauSama(kalenderGame, tabelTanggal.mplLenMulai) : true;
    }

    if (ligaPlayer === "LEN") {
        return bolehTampilMPLLenSchedule() ? cariDariArray(window.jadwalLEN) : null;
    }
    if (ligaPlayer === "MDL") {
        // MDL (ID/PH) mulai 9 Feb, gak perlu gerbang tambahan
        let arrayMDL = (typeof regionPlayer !== "undefined" && regionPlayer === "PH") ? window.jadwalMDL_PH : window.jadwalMDL_ID;
        return cariDariArray(arrayMDL);
    }
    if (ligaPlayer === "MAL") {
        if (!bolehTampilMPLLenSchedule()) return null;
        return cariDariArray(window.jadwalMAL_Affiliated) || cariDariArray(window.jadwalMAL_Challenger);
    }
    return null;
}

// ------------------------------------------------------------------
// [11.7b] PROYEKSI TANGGAL MATCH SELANJUTNYA (NON-MPL) -- match liga
// LEN/MDL/MAL gak punya tanggal fix per match (jadwal background,
// diproses tickSimulasiXXX() tiap hari dengan kuota beda-beda per liga
// & array-nya di-pop dari BELAKANG). Fungsi ini MENGHITUNG (bukan
// ngejalanin apapun) proyeksi tanggal kapan match tertentu bakal
// ke-pop & disimulasikan, berdasarkan posisinya di array + kuota
// harian + gerbang mulai liga masing-masing. READ ONLY.
// ------------------------------------------------------------------
function proyeksiTanggalMatchNonMPL(matchTarget) {
    if (!matchTarget || typeof kalenderGame === "undefined") return null;

    let arr = null, tipe = null;
    if (window.jadwalLEN && window.jadwalLEN.includes(matchTarget)) { arr = window.jadwalLEN; tipe = "LEN"; }
    else if (window.jadwalMDL_ID && window.jadwalMDL_ID.includes(matchTarget)) { arr = window.jadwalMDL_ID; tipe = "MDL_ID"; }
    else if (window.jadwalMDL_PH && window.jadwalMDL_PH.includes(matchTarget)) { arr = window.jadwalMDL_PH; tipe = "MDL_PH"; }
    else if (window.jadwalMAL_Affiliated && window.jadwalMAL_Affiliated.includes(matchTarget)) { arr = window.jadwalMAL_Affiliated; tipe = "MAL"; }
    else if (window.jadwalMAL_Challenger && window.jadwalMAL_Challenger.includes(matchTarget)) { arr = window.jadwalMAL_Challenger; tipe = "MAL"; }

    if (!arr) return null;

    let idx = arr.indexOf(matchTarget);
    if (idx === -1) return null;
    // Jumlah match yang bakal ke-pop DULUAN sebelum match target (array
    // di-pop dari index paling akhir, jadi makin kecil idx makin belakangan).
    let sisaSebelum = arr.length - 1 - idx;

    let tabelTanggal = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;

    let tglProyeksi = new Date(kalenderGame);
    let sisa = sisaSebelum;
    let pengaman = 0;

    while (pengaman < 500) {
        pengaman++;
        tglProyeksi.setDate(tglProyeksi.getDate() + 1);
        let hari = tglProyeksi.getDay(); // 0=Min,1=Sen,2=Sel,3=Rab,4=Kam,5=Jum,6=Sab
        let kuotaHariIni = 0;

        if (tipe === "MDL_ID") {
            if (hari >= 1 && hari <= 4) kuotaHariIni = 4; // Sen-Kam
        } else if (tipe === "MDL_PH") {
            kuotaHariIni = 2; // tiap hari
        } else {
            // LEN & MAL sama-sama gerbang mplLenMulai (27 Mar / 25 Sep)
            let bolehMulai = tabelTanggal
                ? (typeof tanggalSetelahAtauSama === "function" ? tanggalSetelahAtauSama(tglProyeksi, tabelTanggal.mplLenMulai) : true)
                : true;
            if (bolehMulai) {
                if (tipe === "LEN") {
                    if (hari === 5) kuotaHariIni = 2;      // Jumat
                    else if (hari === 6) kuotaHariIni = 3; // Sabtu
                    else if (hari === 0) kuotaHariIni = 3; // Minggu
                } else if (tipe === "MAL") {
                    kuotaHariIni = 1; // tiap hari, 1 match per array
                }
            }
        }

        if (kuotaHariIni <= 0) continue;

        if (sisa < kuotaHariIni) {
            return tglProyeksi; // match ini yang ke-pop di hari ini
        }
        sisa -= kuotaHariIni;
    }

    return null; // safety fallback kalau proyeksi kelewat jauh
}

function ambilKlasemenMDL_ID() {
    // Urut berdasarkan poin desc, lalu netGame desc sbg tiebreaker
    return [...daftarTimMDL_ID].sort((a, b) => {
        if ((b.poin || 0) !== (a.poin || 0)) return (b.poin || 0) - (a.poin || 0);
        return (b.netGame || 0) - (a.netGame || 0);
    });
}

function ambilBottom2Independen() {
    let klasemen = ambilKlasemenMDL_ID();
    let independenSaja = klasemen.filter(t => t.tipeSlot === "Independen");
    // Bottom 2 dari klasemen GABUNGAN, tapi hanya gelar Independen
    // (urutan klasemen tetap dihormati -- bottom 2 INDEPENDEN paling
    // bawah versi klasemen gabungan, bukan klasemen independen terpisah)
    let sortedByRankDesc = [...independenSaja].sort((a, b) => {
        let rankA = klasemen.indexOf(a);
        let rankB = klasemen.indexOf(b);
        return rankB - rankA; // makin besar index (makin bawah klasemen) -> makin "bottom"
    });
    return sortedByRankDesc.slice(0, 2);
}

// ------------------------------------------------------------------
// [11.7] AMBIL JUARA 1 & 2 LEN (utk Playoff Degradasi)
// ------------------------------------------------------------------
function ambilJuara1dan2LEN() {
    let klasemen = [...daftarTimLEN].sort((a, b) => {
        if ((b.poin || 0) !== (a.poin || 0)) return (b.poin || 0) - (a.poin || 0);
        return (b.netGame || 0) - (a.netGame || 0);
    });
    return { juara1: klasemen[0], juara2: klasemen[1] };
}

// ==========================================
// BAGIAN 3 — PLAYOFF DEGRADASI BO5 & EKSEKUSI AKHIR MUSIM
// ==========================================
//
// Sesuai keputusan desain:
//   Bottom 1 MDL Independen vs Juara 2 LEN
//   Bottom 2 MDL Independen vs Juara 1 LEN
//   MENANG -> tetap/masuk MDL musim depan
//   KALAH  -> turun/tetap di LEN musim depan
// Format BO5, pakai simulasikanSeriesDramatis() yang sudah ada & teruji
// (otomatis menangani narasi kalau match melibatkan tim player).
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// [11.8] EKSEKUSI SATU PERTANDINGAN PLAYOFF DEGRADASI
// Mengembalikan { menang, kalah, hasilSeries } -- tim "menang" akan
// ditempatkan di slot MDL, tim "kalah" ditempatkan di slot LEN.
// ------------------------------------------------------------------
function jalankanPlayoffDegradasiSatuPertandingan(timMDL, timLEN) {
    let hasilSeries = (typeof simulasikanSeriesDramatis === "function")
        ? simulasikanSeriesDramatis(timMDL, timLEN, 5, "playoff_degradasi", false)
        : null;

    if (!hasilSeries) {
        // Fallback sederhana kalau simulasikanSeriesDramatis entah kenapa
        // belum termuat -- pakai logika BO5 minimal tanpa narasi
        let butuhWin = 3, sA = 0, sB = 0;
        for (let i = 0; i < 5; i++) {
            if (sA === butuhWin || sB === butuhWin) break;
            let pA = hitungPerformaMatch(timMDL);
            let pB = hitungPerformaMatch(timLEN);
            if (pA > pB) sA++; else sB++;
        }
        hasilSeries = { menang: sA > sB ? timMDL : timLEN, kalah: sA > sB ? timLEN : timMDL, skorHome: sA, skorAway: sB };
    }

    return { menang: hasilSeries.menang, kalah: hasilSeries.kalah, hasilSeries };
}

// ------------------------------------------------------------------
// [11.9] JALANKAN PLAYOFF DEGRADASI PENUH (2 pertandingan paralel sesuai
// desain) & TUKAR POSISI tim yang menang/kalah di database MDL ID/LEN.
// ------------------------------------------------------------------
function jalankanPlayoffDegradasiPenuh() {
    let bottom2MDL = ambilBottom2Independen();
    let { juara1, juara2 } = ambilJuara1dan2LEN();

    if (bottom2MDL.length < 2 || !juara1 || !juara2) {
        console.warn("Data tidak cukup untuk Playoff Degradasi (butuh 2 tim bottom MDL Independen + juara1/2 LEN).");
        return [];
    }

    let bottom1MDL = bottom2MDL[0]; // paling bawah
    let bottom2MDL_ = bottom2MDL[1];

    // Sesuai desain: Bottom 1 MDL vs Juara 2 LEN, Bottom 2 MDL vs Juara 1 LEN
    let pertandingan1 = jalankanPlayoffDegradasiSatuPertandingan(bottom1MDL, juara2);
    let pertandingan2 = jalankanPlayoffDegradasiSatuPertandingan(bottom2MDL_, juara1);

    // FIX BUG (ditemukan saat audit): hasil playoff degradasi sebelumnya
    // TIDAK PERNAH disimpan dalam format yang bisa dirender sbg bracket
    // visual -- cuma muncul lewat berita teks biasa. Sekarang disimpan
    // ke window._bracketPlayoffDegradasiMDLLEN dalam format kompatibel
    // renderBoxBracket() (sama persis pola yg dipakai bracket MPL).
    let bracketData = [
        { home: bottom1MDL, away: juara2, sudahMain: true, skorHome: pertandingan1.hasilSeries.skorHome ?? 0, skorAway: pertandingan1.hasilSeries.skorAway ?? 0, menang: pertandingan1.menang.nama },
        { home: bottom2MDL_, away: juara1, sudahMain: true, skorHome: pertandingan2.hasilSeries.skorHome ?? 0, skorAway: pertandingan2.hasilSeries.skorAway ?? 0, menang: pertandingan2.menang.nama }
    ];

    let hasilLog = [];

    [pertandingan1, pertandingan2].forEach(({ menang, kalah, hasilSeries }) => {
        // Tukar posisi: tim "menang" ambil slot MDL, tim "kalah" ambil slot LEN
        let timMDLAsli = menang === bottom1MDL || menang === bottom2MDL_ ? null : kalah; // tim MDL asli = yg kalah kalau menangnya LEN
        let slotMDLIdx = daftarTimMDL_ID.findIndex(t => t.nama === bottom1MDL.nama || t.nama === bottom2MDL_.nama);

        // Identifikasi mana yg representasi MDL & mana yg representasi LEN
        // di pertandingan ini (karena urutan param tetap timMDL dulu, timLEN kedua)
        let representasiMDL = (menang.nama === bottom1MDL.nama || menang.nama === bottom2MDL_.nama) ? menang
                             : (kalah.nama === bottom1MDL.nama || kalah.nama === bottom2MDL_.nama) ? kalah
                             : null;
        let representasiLEN = representasiMDL === menang ? kalah : menang;

        if (menang.nama === representasiMDL.nama) {
            // Tim MDL bertahan -- tidak ada pertukaran posisi, LEN tetap di LEN
            if (typeof tambahBerita === "function") {
                tambahBerita(`🛡️ Defend Slot: <span>${representasiMDL.nama}</span> berhasil mempertahankan slot MDL melawan <b>${representasiLEN.nama}</b> di Playoff Degradasi.`);
            }
            hasilLog.push({ tipe: "DEFEND", timMDL: representasiMDL.nama, timLEN: representasiLEN.nama });
        } else {
            // Tim LEN menang -- TUKAR posisi di database
            let idxMDL = daftarTimMDL_ID.findIndex(t => t.nama === representasiMDL.nama);
            let idxLEN = daftarTimLEN.findIndex(t => t.nama === representasiLEN.nama);

            if (idxMDL !== -1 && idxLEN !== -1) {
                let timNaik = { ...representasiLEN, liga: "MDL", region: representasiMDL.region || "ID", tipeSlot: "Independen" };
                let timTurun = { ...representasiMDL, liga: "LEN", region: "ID", tipeSlot: "Independen" };

                daftarTimMDL_ID[idxMDL] = timNaik;
                daftarTimLEN[idxLEN] = timTurun;

                // Sinkronkan juga ke array daftarTimMDL_Independen_ID (krn
                // daftarTimMDL_ID cuma array gabungan utk tampilan/klasemen)
                let idxIndependenArr = daftarTimMDL_Independen_ID.findIndex(t => t.nama === representasiMDL.nama);
                if (idxIndependenArr !== -1) daftarTimMDL_Independen_ID[idxIndependenArr] = timNaik;

                if (typeof tambahBerita === "function") {
                    tambahBerita(`📈 Promosi & Degradasi: <span>${timNaik.nama}</span> menang Playoff Degradasi dan naik ke MDL ID. <b>${timTurun.nama}</b> turun ke LEN musim depan.`);
                }
                hasilLog.push({ tipe: "TUKAR_POSISI", naik: timNaik.nama, turun: timTurun.nama });
            }
        }
    });

    window._bracketPlayoffDegradasiMDLLEN = bracketData;

    return hasilLog;
}

// ------------------------------------------------------------------
// [11.9b] PREVIEW MATCHUP PLAYOFF DEGRADASI (belum disimulasikan)
// Dipakai buat nampilin bracket H-1 sebelum jalankanPlayoffDegradasiPenuh()
// beneran dieksekusi (10 Jun, bareng Play-In MPL). Cuma nentuin PASANGAN
// tim dari klasemen final MDL Independen & LEN -- TIDAK mensimulasikan
// hasil apapun, jadi aman dipanggil berkali-kali tanpa efek samping.
// ------------------------------------------------------------------
function ambilPreviewPlayoffDegradasiMDLLEN() {
    let bottom2MDL = ambilBottom2Independen();
    let { juara1, juara2 } = ambilJuara1dan2LEN();

    if (bottom2MDL.length < 2 || !juara1 || !juara2) return [];

    let bottom1MDL = bottom2MDL[0];
    let bottom2MDL_ = bottom2MDL[1];

    return [
        { home: bottom1MDL, away: juara2, sudahMain: false },
        { home: bottom2MDL_, away: juara1, sudahMain: false }
    ];
}
window.ambilPreviewPlayoffDegradasiMDLLEN = ambilPreviewPlayoffDegradasiMDLLEN;

// ------------------------------------------------------------------
// [11.10] PROSES AKHIR MUSIM MDL ID & LEN (dipanggil otomatis dari
// tickSimulasiMDLdanLEN() begitu jadwal regular season habis)
// ------------------------------------------------------------------
function prosesAkhirMusimMDLdanLEN() {
    let klasemenMDL = ambilKlasemenMDL_ID();
    let juaraMDL = klasemenMDL[0];
    let { juara1: juaraLEN, juara2: runnerUpLEN } = ambilJuara1dan2LEN();

    if (typeof tambahBerita === "function") {
        tambahBerita(`🏆 Akhir Musim: <span>${juaraMDL ? juaraMDL.nama : "?"}</span> menjuarai MDL ID musim ini. <span>${juaraLEN ? juaraLEN.nama : "?"}</span> menjadi juara LEN.`);
    }


    // Catat trofi buat faktor Prestasi di harga pasar pemain
    if (typeof catatTrofiPemain === "function") {
        if (juaraMDL) catatTrofiPemain(juaraMDL, "mdl");
        if (juaraLEN) catatTrofiPemain(juaraLEN, "len");
    }

    // [FIX] distribusiHadiahJuaraTier2AI() di bawah ini SENGAJA cuma
    // ngasih hadiah ke tim AI (skip kalau juara.nama === player) --
    // tapi gak ada titik lain yang ngasih reward ke PLAYER kalau
    // tim-nya sendiri yang juara MDL ID/LEN. Jadi player yang main di
    // liga ini gak pernah dapet prize pool/reputasi apapun walau juara.
    if (juaraMDL && juaraMDL.nama === timPlayer) {
        kasTim += 60000000;
        if (typeof catatKas === "function") catatKas("MASUK", 60000000, `Prize Pool Juara MDL ID S${musimKe}`);
        if (typeof reputasiManajer !== "undefined") reputasiManajer += 20;
        if (typeof reputasiTim !== "undefined") reputasiTim = Math.min(100, reputasiTim + 10);
        if (typeof tambahBerita === "function") tambahBerita(`🏆 Juara! <span>${timPlayer}</span> memenangkan MDL ID Season ${musimKe}.`);
        if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara MDL Indonesia S${musimKe}`, "dev");
    }
    if (juaraLEN && juaraLEN.nama === timPlayer) {
        kasTim += 15000000;
        if (typeof catatKas === "function") catatKas("MASUK", 15000000, `Prize Pool Juara LEN S${musimKe}`);
        if (typeof reputasiManajer !== "undefined") reputasiManajer += 10;
        if (typeof reputasiTim !== "undefined") reputasiTim = Math.min(100, reputasiTim + 5);
        if (typeof tambahBerita === "function") tambahBerita(`🏆 Juara! <span>${timPlayer}</span> memenangkan LEN Season ${musimKe}.`);
        if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara Liga Esports Nasional S${musimKe}`, "len");
    }

    // [BUGFIX] Hadiah akhir musim utk MDL ID & LEN -- sebelumnya tim2 di
    // liga ini gak pernah dapat hadiah uang/reputasi sama sekali (cakupan
    // distribusi hadiah lama hanya 4 region MPL). MDL ekonominya lebih
    // kecil dari MPL (~1/4 skala), LEN lebih kecil lagi (~1/10 skala).
    if (typeof distribusiHadiahRegularSeasonAI === "function") {
        distribusiHadiahRegularSeasonAI(daftarTimMDL_ID, 0.25);
        distribusiHadiahRegularSeasonAI(daftarTimLEN, 0.1);
    }
    if (typeof distribusiHadiahJuaraTier2AI === "function") {
        distribusiHadiahJuaraTier2AI(juaraMDL, klasemenMDL[1], 60000000, 25000000);
        distribusiHadiahJuaraTier2AI(juaraLEN, runnerUpLEN, 15000000, 7000000);
    }
    // [MERCH V3] Hook prestasi merchandise -- akhir musim MDL & LEN
    if (typeof window.catatPrestasiMerchandiseV3 === "function") {
        if (juaraMDL && juaraMDL.nama === timPlayer) window.catatPrestasiMerchandiseV3("MDL_MAL", "juara");
        else if (klasemenMDL[1] && klasemenMDL[1].nama === timPlayer) window.catatPrestasiMerchandiseV3("MDL_MAL", "runnerUp");
        if (juaraLEN && juaraLEN.nama === timPlayer) window.catatPrestasiMerchandiseV3("LEN", "juara");
        else if (runnerUpLEN && runnerUpLEN.nama === timPlayer) window.catatPrestasiMerchandiseV3("LEN", "runnerUp");
    }

    // FIX FINANSIAL: pendapatan sponsor + bayar gaji tiap akhir musim MDL/LEN.
    // Keduanya sebelumnya hanya jalan saat OFFSEASON MPL (1x/tahun), padahal
    // MDL/LEN main 2 musim/tahun → kas tidak realistis.
    // Urutan: sponsor masuk dulu, baru gaji keluar.
    let _timMDLLEN = [
        ...daftarTimMDL_ID.filter(t => t.nama !== timPlayer),
        ...daftarTimLEN.filter(t => t.nama !== timPlayer),
    ];

    // Pendapatan sponsor per musim (hanya tim MDL ID & LEN)
    if (typeof prosesSponsorTimList === "function") {
        prosesSponsorTimList(_timMDLLEN);
    } else if (typeof prosesSponsorMusimAI === "function") {
        // Fallback: filter manual supaya tidak double-count dengan OFFSEASON MPL
        _timMDLLEN.forEach(tim => {
            let pendapatan = tim.sponsorAI ? (tim.sponsorAI.pendapatanPerMusim || 0) : 0;
            let reputasi = tim.reputasi || 50;
            let ovrRataRata = (tim.roster && tim.roster.length > 0)
                ? Math.floor(tim.roster.reduce((s, p) => s + (p.ovr || tim.power), 0) / tim.roster.length)
                : tim.power;
            let modRep = 0.7 + (reputasi / 100) * 0.6;
            let modOvr = 0.8 + (ovrRataRata / 100) * 0.4;
            tim.kas = (tim.kas || 0) + Math.floor(pendapatan * modRep * modOvr);
            // Cek upgrade/downgrade sponsor
            if (reputasi >= 90 && tim.sponsorAI && tim.sponsorAI.tier !== "S") {
                tim.sponsorAI = { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 180000000 };
            } else if (reputasi >= 75 && tim.sponsorAI && tim.sponsorAI.tier === "C") {
                tim.sponsorAI = { nama: "Red Bull", tier: "A", pendapatanPerMusim: 80000000 };
            } else if (reputasi < 40 && tim.sponsorAI && tim.sponsorAI.tier !== "C") {
                tim.sponsorAI = { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 };
            }
            // [FIX] Godaan/investigasi sponsor ilegal sebelumnya cuma jalan
            // buat tim MPL -- tim MDL ID/LEN gak pernah kena drama sponsor
            // gelap sama sekali. Sekarang diperluas biar semua liga sama.
            if (typeof prosesSponsorIlegalAI === "function") prosesSponsorIlegalAI(tim);
        });
    }

    // Bayar gaji roster (setelah sponsor masuk)
    if (typeof bayarGajiRosterAI === "function") {
        _timMDLLEN.forEach(tim => bayarGajiRosterAI(tim));
    }

    // Update status keuangan
    if (typeof cekStatusKeuanganAI === "function") {
        _timMDLLEN.forEach(tim => { tim.statusKeuangan = cekStatusKeuanganAI(tim); });
    }

    // FIX: playoff degradasi MDL-LEN TIDAK dijalankan di sini.
    // prosesAkhirMusimMDLdanLEN() sekarang hanya mengurus hadiah + berita
    // akhir musim + set flag _siapPlayoffDegradasiMDLLEN = true.
    // Playoff degradasi dan inisialisasi musim baru sudah dipindahkan ke
    // playoffFase === 1 di script.js (10 Jun, bareng Play-In MPL),
    // supaya tidak double-run dan tidak jalan terlalu awal (~Mei).
    window._siapPlayoffDegradasiMDLLEN = true;
}




// ==========================================
// FASE 12 — ENGINE MDL PHILIPPINES
// ==========================================
//
// Struktur SAMA dengan MDL ID (1 klasemen gabungan, afiliasi kebal
// degradasi, independen bisa degradasi) KECUALI:
// - Tidak ada liga tier-3 di PH (tidak ada padanan LEN)
// - Bottom 2 independen langsung terdegradasi + slot diisi lewat
//   Open Qualifier (disimulasikan dengan reset/generate tim placeholder
//   sampai sistem Open Qualifier penuh dibangun di Fase nanti)
// - Slot afiliasi bisa di-forfeit oleh tim MPL PH
//   (contoh real: AP.Bren musim S17 forfeit slot MDL PH-nya)
// ==========================================

// ------------------------------------------------------------------
// [12.1] INISIALISASI MUSIM MDL PH
// ------------------------------------------------------------------
function inisialisasiMusimMDLPH() {
    if (typeof daftarTimMDL_PH === "undefined") {
        console.warn("Database MDL PH belum termuat, skip inisialisasi.");
        return;
    }

    resetStatistikKlasemen(daftarTimMDL_PH);
    window.jadwalMDL_PH = buatJadwalRoundRobinGenerik(daftarTimMDL_PH, 2);
    window.jadwalMDL_PH.reverse();
    window._musimMDLPHSelesai = false;
}

// ------------------------------------------------------------------
// [12.2] TICK SIMULASI MDL PH (1 match per skip-hari)
// ------------------------------------------------------------------
function tickSimulasiMDLPH() {
    if (window._musimMDLPHSelesai) return;
    if (typeof window.jadwalMDL_PH === "undefined") return;

    // FIX: MDL PH 132 match / 2 match per hari = 66 hari (selesai sebelum 24 Mei ✅)
    const MDL_PH_MATCH_PER_HARI = 2;
    for (let i = 0; i < MDL_PH_MATCH_PER_HARI; i++) {
        if (window.jadwalMDL_PH && window.jadwalMDL_PH.length > 0) {
            simulasikanMatchBO3Generik(window.jadwalMDL_PH.pop());
        }
    }

    let habis = !window.jadwalMDL_PH || window.jadwalMDL_PH.length === 0;
    if (habis && !window._musimMDLPHSelesai) {
        window._musimMDLPHSelesai = true;
        prosesAkhirMusimMDLPH();
    }
}

// ------------------------------------------------------------------
// [12.3] KLASEMEN & DETEKSI BOTTOM 2 INDEPENDEN MDL PH
// ------------------------------------------------------------------
function ambilKlasemenMDL_PH() {
    return [...daftarTimMDL_PH].sort((a, b) => {
        if ((b.poin||0) !== (a.poin||0)) return (b.poin||0) - (a.poin||0);
        return (b.netGame||0) - (a.netGame||0);
    });
}

function ambilBottom2IndependenPH() {
    let klasemen = ambilKlasemenMDL_PH();
    let independenSaja = klasemen.filter(t => t.tipeSlot === "Independen");
    let sortedByRankDesc = [...independenSaja].sort((a, b) => {
        return klasemen.indexOf(b) - klasemen.indexOf(a);
    });
    return sortedByRankDesc.slice(0, 2);
}

// ------------------------------------------------------------------
// [12.4] DEGRADASI MDL PH — tidak ada liga bawah, bottom 2 independen
// langsung terdegradasi. Slotnya diisi tim placeholder (Open Qualifier)
// sampai sistem Open Qualifier penuh tersedia di fase berikutnya.
// ------------------------------------------------------------------
const POOL_NAMA_OQ_PH = [
    "PH Rising Stars", "Manila Underdogs", "Visayas Gaming",
    "Mindanao Wolves", "Cebu Phoenix", "Davao Raiders",
    "Iloilo Strikers", "Pampanga Kings"
];

function eksekusiDegradasiMDLPH() {
    let bottom2 = ambilBottom2IndependenPH();
    let hasilLog = [];
    let namaYangTerdegradasi = bottom2.map(t => t.nama);

    bottom2.forEach(timDegradasi => {
        let idx = daftarTimMDL_PH.findIndex(t => t.nama === timDegradasi.nama);
        let idxIndependen = daftarTimMDL_Independen_PH.findIndex(t => t.nama === timDegradasi.nama);

        // Hindari nama yang sudah dipakai DAN nama tim yang sedang terdegradasi
        let namaTerpakai = [...daftarTimMDL_PH.map(t => t.nama), ...namaYangTerdegradasi];
        let namaOQ = POOL_NAMA_OQ_PH.find(n => !namaTerpakai.includes(n))
            || `OQ Team PH ${Math.floor(Math.random()*999)}`;

        let timBaru = {
            nama: namaOQ,
            logo: namaOQ.replace(/\s+/g, "_") + ".png",
            power: timDegradasi.power + Math.floor(Math.random()*5) - 2, // sedikit variatif
            matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
            kas: 600000000 + Math.floor(Math.random()*400000000),
            levelGH: 1,
            reputasi: Math.max(20, (timDegradasi.reputasi || 30) - 5),
            sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: timDegradasi.power * 70000 },
            liga: "MDL", region: "PH", tipeSlot: "Independen",
            indukMPL: null,
            ceo: (typeof generateCEOBaruLengkap === "function")
                ? generateCEOBaruLengkap({ liga: "MDL", reputasi: 30 })
                : { nama: "CEO Baru", umur: 32, keahlianFinansial: 45 },
            statusKeuangan: "SEHAT"
        };

        if (idx !== -1) daftarTimMDL_PH[idx] = timBaru;
        if (idxIndependen !== -1) daftarTimMDL_Independen_PH[idxIndependen] = timBaru;

        if (typeof tambahBerita === "function") {
            tambahBerita(`📉 Degradasi MDL PH: <span>${timDegradasi.nama}</span> terdegradasi dari MDL Philippines. Slot mereka akan diisi oleh tim hasil Open Qualifier: <b>${namaOQ}</b>.`);
        }

        hasilLog.push({ terdegradasi: timDegradasi.nama, pengisi: namaOQ });
    });

    return hasilLog;
}

// ------------------------------------------------------------------
// [12.5] CEK SLOT AFILIASI FORFEIT — kalau tim MPL PH kolaps/KOSONG,
// slot afiliasi di MDL PH ikut kosong. Slot itu lalu diisi Open Qualifier
// (sama pola dengan degradasi independen di atas).
// ------------------------------------------------------------------
function cekDanTanganiSlotAfiliasiForefeitPH() {
    if (typeof daftarTimMDL_Afiliasi_PH === "undefined") return;

    daftarTimMDL_Afiliasi_PH.forEach((timAfiliasi, idx) => {
        if (!timAfiliasi.indukMPL) return;
        let timInduk = cariTimAsliDiDatabase(timAfiliasi.indukMPL);

        if (!timInduk || timInduk.statusKeuangan === "KOSONG_FRANCHISE") {
            // Induk MPL kolaps -- konversikan slot afiliasi menjadi slot
            // independen sementara (sambil menunggu Open Qualifier mengisi)
            let namaTerpakai = daftarTimMDL_PH.map(t => t.nama);
            let namaOQ = POOL_NAMA_OQ_PH.find(n => !namaTerpakai.includes(n))
                || `OQ Afiliasi PH ${idx}`;

            let timPengganti = {
                nama: namaOQ,
                logo: namaOQ.replace(/\s+/g, "_") + ".png",
                power: timAfiliasi.power || 40,
                matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
                kas: 600000000,
                levelGH: 1,
                reputasi: 25,
                sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 25000000 },
                liga: "MDL", region: "PH", tipeSlot: "Independen",
                indukMPL: null,
                ceo: (typeof generateCEOBaruLengkap === "function")
                    ? generateCEOBaruLengkap({ liga: "MDL", reputasi: 25 })
                    : { nama: "CEO Sementara", umur: 30, keahlianFinansial: 40 },
                statusKeuangan: "SEHAT"
            };

            let idxGabungan = daftarTimMDL_PH.findIndex(t => t.nama === timAfiliasi.nama);
            if (idxGabungan !== -1) daftarTimMDL_PH[idxGabungan] = timPengganti;
            daftarTimMDL_Afiliasi_PH[idx] = timPengganti;

            if (typeof tambahBerita === "function") {
                tambahBerita(`⚠️ Slot Forfeit: Slot afiliasi MDL PH milik <span>${timAfiliasi.nama}</span> (induk: ${timAfiliasi.indukMPL}) dikosongkan karena tim induk kolaps. Akan diisi lewat Open Qualifier.`);
            }
        }
    });
}

// ------------------------------------------------------------------
// [12.6] PROSES AKHIR MUSIM MDL PH
// ------------------------------------------------------------------
function prosesAkhirMusimMDLPH() {
    let klasemen = ambilKlasemenMDL_PH();
    let juara = klasemen[0];

    if (typeof tambahBerita === "function") {
        tambahBerita(`🏆 Akhir Musim MDL PH: <span>${juara ? juara.nama : "?"}</span> menjuarai MDL Philippines musim ini.`);
    }


    if (typeof catatTrofiPemain === "function" && juara) catatTrofiPemain(juara, "mdl");

    // [FIX] Sama kayak MDL ID -- player gak pernah dapet reward apapun
    // kalau tim-nya sendiri yang juara MDL PH (distribusiHadiahJuaraTier2AI
    // di bawah SENGAJA skip player).
    if (juara && juara.nama === timPlayer) {
        kasTim += 60000000;
        if (typeof catatKas === "function") catatKas("MASUK", 60000000, `Prize Pool Juara MDL PH S${musimKe}`);
        if (typeof reputasiManajer !== "undefined") reputasiManajer += 20;
        if (typeof reputasiTim !== "undefined") reputasiTim = Math.min(100, reputasiTim + 10);
        if (typeof tambahBerita === "function") tambahBerita(`🏆 Juara! <span>${timPlayer}</span> memenangkan MDL PH Season ${musimKe}.`);
    }

    // [BUGFIX] Hadiah akhir musim utk MDL PH -- sebelumnya gak ada
    // sama sekali (cakupan distribusi hadiah lama hanya 4 region MPL).
    if (typeof distribusiHadiahRegularSeasonAI === "function") {
        distribusiHadiahRegularSeasonAI(daftarTimMDL_PH, 0.25);
    }
    if (typeof distribusiHadiahJuaraTier2AI === "function") {
        distribusiHadiahJuaraTier2AI(juara, klasemen[1], 60000000, 25000000);
    }
    // [MERCH V3] Hook prestasi merchandise -- akhir musim MDL PH
    if (typeof window.catatPrestasiMerchandiseV3 === "function") {
        if (juara && juara.nama === timPlayer) window.catatPrestasiMerchandiseV3("MDL_MAL", "juara");
        else if (klasemen[1] && klasemen[1].nama === timPlayer) window.catatPrestasiMerchandiseV3("MDL_MAL", "runnerUp");
    }

    // FIX FINANSIAL: sponsor masuk + gaji keluar tiap akhir musim MDL PH
    let _timMDLPH = daftarTimMDL_PH.filter(t => t.nama !== timPlayer);
    _timMDLPH.forEach(tim => {
        let pendapatan = tim.sponsorAI ? (tim.sponsorAI.pendapatanPerMusim || 0) : 0;
        let reputasi = tim.reputasi || 50;
        let ovrRataRata = (tim.roster && tim.roster.length > 0)
            ? Math.floor(tim.roster.reduce((s, p) => s + (p.ovr || tim.power), 0) / tim.roster.length)
            : tim.power;
        let modRep = 0.7 + (reputasi / 100) * 0.6;
        let modOvr = 0.8 + (ovrRataRata / 100) * 0.4;
        tim.kas = (tim.kas || 0) + Math.floor(pendapatan * modRep * modOvr);
        if (reputasi >= 90 && tim.sponsorAI && tim.sponsorAI.tier !== "S") {
            tim.sponsorAI = { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 180000000 };
        } else if (reputasi >= 75 && tim.sponsorAI && tim.sponsorAI.tier === "C") {
            tim.sponsorAI = { nama: "Red Bull", tier: "A", pendapatanPerMusim: 80000000 };
        } else if (reputasi < 40 && tim.sponsorAI && tim.sponsorAI.tier !== "C") {
            tim.sponsorAI = { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 };
        }
        // [FIX] Perluasan sponsor ilegal ke MDL PH (sebelumnya cuma MPL).
        if (typeof prosesSponsorIlegalAI === "function") prosesSponsorIlegalAI(tim);
    });
    if (typeof bayarGajiRosterAI === "function") {
        _timMDLPH.forEach(tim => bayarGajiRosterAI(tim));
    }
    if (typeof cekStatusKeuanganAI === "function") {
        _timMDLPH.forEach(tim => { tim.statusKeuangan = cekStatusKeuanganAI(tim); });
    }

    cekDanTanganiSlotAfiliasiForefeitPH();
    let hasilDegradasi = eksekusiDegradasiMDLPH();

    inisialisasiMusimMDLPH();

    return hasilDegradasi;
}


// ==========================================
// FASE 13 — ENGINE MAL MALAYSIA
// ==========================================
//
// Struktur BERBEDA dari MDL ID/PH:
// - 2 conference TERPISAH (Affiliated 7 tim + Challenger 8 tim)
// - Regular season: tiap conference main sendiri-sendiri
// - Top 4 masing-masing conference -> Playoff (campuran kedua conference)
// - Juara Challenger Conference -> LANGSUNG PROMOSI ke MPL MY
// - Runner-up Challenger -> tantang tim MPL MY posisi terbawah
// - Tim terbawah Challenger -> degradasi (diisi Open Qualifier)
// - Affiliated Conference kebal degradasi (hanya Challenger yg bisa turun)
// - Tidak ada liga tier-3 di Malaysia (Challenger = paling bawah)
// ==========================================

// ------------------------------------------------------------------
// [13.1] INISIALISASI MUSIM MAL MY (2 jadwal terpisah)
// ------------------------------------------------------------------
function inisialisasiMusimMALMY() {
    if (typeof daftarTimMAL_Affiliated_MY === "undefined") {
        console.warn("Database MAL MY belum termuat, skip.");
        return;
    }

    resetStatistikKlasemen(daftarTimMAL_Affiliated_MY);
    resetStatistikKlasemen(daftarTimMAL_Challenger_MY);

    // 2 jadwal terpisah per conference
    window.jadwalMAL_Affiliated = buatJadwalRoundRobinGenerik(daftarTimMAL_Affiliated_MY, 2);
    window.jadwalMAL_Challenger = buatJadwalRoundRobinGenerik(daftarTimMAL_Challenger_MY, 2);
    window.jadwalMAL_Affiliated.reverse();
    window.jadwalMAL_Challenger.reverse();

    window._musimMALMYSelesai = false;
    window._playoffMALMYSelesai = false;
    window._hasilPlayoffMALMY = null;
}

// ------------------------------------------------------------------
// [13.2] TICK SIMULASI MAL MY (1 match per conference per skip-hari)
// Satu skip = 1 match Affiliated + 1 match Challenger (kalau masih ada)
// ------------------------------------------------------------------
function tickSimulasiMALMY() {
    if (window._musimMALMYSelesai) return;
    if (typeof window.jadwalMAL_Affiliated === "undefined" && typeof window.jadwalMAL_Challenger === "undefined") return;

    // FIX: MAL MY ikut tanggal mulai MPL/LEN (27 Mar), bukan MDL (9 Feb) --
    // sebelumnya kena bug yang sama kayak LEN, simulasi jalan 47 hari kepagian.
    if (typeof ambilTabelTanggalMusimSaatIni === "function" && typeof tanggalSetelahAtauSama === "function") {
        let tabelTanggal = ambilTabelTanggalMusimSaatIni();
        let bolehMulaiMALMY = tabelTanggal ? tanggalSetelahAtauSama(kalenderGame, tabelTanggal.mplLenMulai) : true;
        if (!bolehMulaiMALMY) return;
    }

    if (window.jadwalMAL_Affiliated && window.jadwalMAL_Affiliated.length > 0) {
        simulasikanMatchBO3Generik(window.jadwalMAL_Affiliated.pop());
    }
    if (window.jadwalMAL_Challenger && window.jadwalMAL_Challenger.length > 0) {
        simulasikanMatchBO3Generik(window.jadwalMAL_Challenger.pop());
    }

    let keduanyaHabis = (!window.jadwalMAL_Affiliated || window.jadwalMAL_Affiliated.length === 0)
                     && (!window.jadwalMAL_Challenger || window.jadwalMAL_Challenger.length === 0);

    if (keduanyaHabis && !window._musimMALMYSelesai) {
        window._musimMALMYSelesai = true;
        prosesAkhirMusimMALMY();
    }
}

// ------------------------------------------------------------------
// [13.3] KLASEMEN MASING-MASING CONFERENCE (terpisah, tidak digabung)
// ------------------------------------------------------------------
function ambilKlasemenAffiliatedMY() {
    return [...daftarTimMAL_Affiliated_MY].sort((a, b) =>
        (b.poin||0) - (a.poin||0) || (b.netGame||0) - (a.netGame||0));
}

function ambilKlasemenChallengerMY() {
    return [...daftarTimMAL_Challenger_MY].sort((a, b) =>
        (b.poin||0) - (a.poin||0) || (b.netGame||0) - (a.netGame||0));
}

// ------------------------------------------------------------------
// [13.4] AMBIL TOP 4 DARI MASING-MASING CONFERENCE UNTUK PLAYOFF
// ------------------------------------------------------------------
function ambilTop4Affiliated() {
    return ambilKlasemenAffiliatedMY().slice(0, 4);
}

function ambilTop4Challenger() {
    return ambilKlasemenChallengerMY().slice(0, 4);
}

// ------------------------------------------------------------------
// [13.5] PLAYOFF CAMPURAN (Top 4 Affiliated + Top 4 Challenger)
// Format sederhana: playoff bracket 8 tim, pakai simulasikanSeriesDramatis
// QF: 4 Affiliated vs 4 Challenger (cross-bracket), best of 3
// SF: 2 pemenang QF, best of 3
// Final: BO5
// Juara dari sisi Challenger -> LANGSUNG PROMOSI ke MPL MY
// ------------------------------------------------------------------
function jalankanPlayoffMALMY() {
    let top4Aff = ambilTop4Affiliated();
    let top4Cha = ambilKlasemenChallengerMY().slice(0, 4);

    if (top4Aff.length < 4 || top4Cha.length < 4) return null;

    // QF: Aff1 vs Cha4, Aff2 vs Cha3, Cha1 vs Aff4, Cha2 vs Aff3
    let qfPasangan = [
        { a: top4Aff[0], b: top4Cha[3] },
        { a: top4Aff[1], b: top4Cha[2] },
        { a: top4Cha[0], b: top4Aff[3] },
        { a: top4Cha[1], b: top4Aff[2] }
    ];

    let pemenangQF = qfPasangan.map(p => {
        let hasil = simulasikanSeriesDramatis(p.a, p.b, 3, "playoff_mal", false);
        return hasil ? hasil.menang : (Math.random() < 0.5 ? p.a : p.b);
    });

    // SF: QF1 vs QF2, QF3 vs QF4
    let pemenangSF = [];
    for (let i = 0; i < 4; i += 2) {
        let hasil = simulasikanSeriesDramatis(pemenangQF[i], pemenangQF[i+1], 3, "playoff_mal_sf", false);
        pemenangSF.push(hasil ? hasil.menang : pemenangQF[i]);
    }

    // Final BO5
    let hasilFinal = simulasikanSeriesDramatis(pemenangSF[0], pemenangSF[1], 5, "playoff_mal_final", false);
    let juaraMAL = hasilFinal ? hasilFinal.menang : pemenangSF[0];
    let runnerUp = hasilFinal ? hasilFinal.kalah : pemenangSF[1];

    return { juara: juaraMAL, runnerUp };
}

// ==========================================
// OVERHAUL KALENDER — MAL MY PLAYOFF DIPECAH 3 HARI
// (Rabu QF, Kamis SF, Jumat Final) sesuai keputusan bersama user,
// dipanggil dari script.js di playoffFase 1/2/3 secara berurutan.
// State antar-fase disimpan di window._malMyPlayoffState supaya
// "nyambung" dari QF -> SF -> Final di klik/hari yang berbeda.
// ------------------------------------------------------------------
function jalankanQuarterFinalMALMY() {
    let top4Aff = ambilTop4Affiliated();
    let top4Cha = ambilKlasemenChallengerMY().slice(0, 4);
    if (top4Aff.length < 4 || top4Cha.length < 4) {
        window._malMyPlayoffState = null;
        return null;
    }

    let qfPasangan = [
        { a: top4Aff[0], b: top4Cha[3] },
        { a: top4Aff[1], b: top4Cha[2] },
        { a: top4Cha[0], b: top4Aff[3] },
        { a: top4Cha[1], b: top4Aff[2] }
    ];

    let pemenangQF = qfPasangan.map(p => {
        let hasil = simulasikanSeriesDramatis(p.a, p.b, 3, "playoff_mal", false);
        return hasil ? hasil.menang : (Math.random() < 0.5 ? p.a : p.b);
    });

    window._malMyPlayoffState = { pemenangQF };

    if (typeof tambahBerita === "function") {
        tambahBerita(`🇲 MAL MY Quarter Final: ${pemenangQF.map(t => t.nama).join(", ")} melaju ke Semi Final.`);
    }

    return { pemenangQF };
}

function jalankanSemiFinalMALMY() {
    if (!window._malMyPlayoffState || !window._malMyPlayoffState.pemenangQF) return null;
    let pemenangQF = window._malMyPlayoffState.pemenangQF;

    let pemenangSF = [];
    for (let i = 0; i < 4; i += 2) {
        let hasil = simulasikanSeriesDramatis(pemenangQF[i], pemenangQF[i + 1], 3, "playoff_mal_sf", false);
        pemenangSF.push(hasil ? hasil.menang : pemenangQF[i]);
    }

    window._malMyPlayoffState.pemenangSF = pemenangSF;

    if (typeof tambahBerita === "function") {
        tambahBerita(`🇲 MAL MY Semi Final: ${pemenangSF.map(t => t.nama).join(" & ")} melaju ke Final.`);
    }

    return { pemenangSF };
}

function jalankanFinalMALMY() {
    if (!window._malMyPlayoffState || !window._malMyPlayoffState.pemenangSF) return null;
    let pemenangSF = window._malMyPlayoffState.pemenangSF;

    let hasilFinal = simulasikanSeriesDramatis(pemenangSF[0], pemenangSF[1], 5, "playoff_mal_final", false);
    let juaraMAL = hasilFinal ? hasilFinal.menang : pemenangSF[0];
    let runnerUp = hasilFinal ? hasilFinal.kalah : pemenangSF[1];

    window._hasilPlayoffMALMYTerakhir = { juara: juaraMAL, runnerUp };
    window._malMyPlayoffState = null; // bersihkan state sementara

    if (typeof tambahBerita === "function") {
        tambahBerita(`🏆 Juara MAL MY: <span>${juaraMAL.nama}</span>.`);
    }


    // MAL MY diperlakukan setara tier MDL (liga pengembangan/kualifikasi ke MPL MY)
    if (typeof catatTrofiPemain === "function") catatTrofiPemain(juaraMAL, "mdl");

    // [FIX] Sama kayak MDL ID/PH -- player gak pernah dapet reward apapun
    // kalau tim-nya sendiri yang juara MAL MY (distribusiHadiahJuaraTier2AI
    // di bawah SENGAJA skip player).
    if (juaraMAL && juaraMAL.nama === timPlayer) {
        kasTim += 50000000;
        if (typeof catatKas === "function") catatKas("MASUK", 50000000, `Prize Pool Juara MAL MY S${musimKe}`);
        if (typeof reputasiManajer !== "undefined") reputasiManajer += 20;
        if (typeof reputasiTim !== "undefined") reputasiTim = Math.min(100, reputasiTim + 10);
        if (typeof tambahBerita === "function") tambahBerita(`🏆 Juara! <span>${timPlayer}</span> memenangkan MAL MY Season ${musimKe}.`);
        if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara MAL Malaysia S${musimKe}`, "dev");
    }

    // [BUGFIX] Hadiah turnamen (playoff gabungan kedua conference) utk
    // MAL MY -- sebelumnya gak ada sama sekali (cakupan distribusi
    // hadiah lama hanya 4 region MPL).
    if (typeof distribusiHadiahJuaraTier2AI === "function") {
        distribusiHadiahJuaraTier2AI(juaraMAL, runnerUp, 50000000, 20000000);
    }
    // [MERCH V3] Hook prestasi merchandise -- akhir musim MAL MY
    if (typeof window.catatPrestasiMerchandiseV3 === "function") {
        if (juaraMAL && juaraMAL.nama === timPlayer) window.catatPrestasiMerchandiseV3("MDL_MAL", "juara");
        else if (runnerUp && runnerUp.nama === timPlayer) window.catatPrestasiMerchandiseV3("MDL_MAL", "runnerUp");
    }

    if (typeof prosesPromosiChallengerKeMPL === "function") {
        prosesPromosiChallengerKeMPL(juaraMAL, runnerUp);
    }
    if (typeof eksekusiDegradasiChallengerMY === "function") {
        eksekusiDegradasiChallengerMY();
    }

    // Siapkan musim regular MAL MY berikutnya, sekarang setelah Playoff
    // manual benar2 tuntas (bukan langsung di prosesAkhirMusimMALMY lagi)
    window._mainMYRegulerSelesaiMenungguPlayoff = false;
    if (typeof inisialisasiMusimMALMY === "function") {
        inisialisasiMusimMALMY();
    }

    return { juara: juaraMAL, runnerUp };
}

// ------------------------------------------------------------------
// [13.6] PROMOSI JUARA CHALLENGER KE MPL MY
// Kalau juara playoff adalah tim dari Challenger Conference,
// mereka langsung promosi ke MPL MY. Kalau juara dari Affiliated,
// tidak ada promosi (mereka sudah di-bawah MPL, bukan di MPL).
// ------------------------------------------------------------------
function prosesPromosiChallengerKeMPL(juara, runnerUp) {
    let juaraIsChallenger = daftarTimMAL_Challenger_MY.some(t => t.nama === juara.nama);
    let runnerUpIsChallenger = daftarTimMAL_Challenger_MY.some(t => t.nama === runnerUp.nama);

    // Juara Challenger -> LANGSUNG PROMOSI
    if (juaraIsChallenger) {
        if (typeof tambahBerita === "function") {
            tambahBerita(`🚀 Promosi: <span>${juara.nama}</span> juara MAL Malaysia dan langsung promosi ke MPL MY musim depan.`);
        }
        // Slot di Challenger diisi tim OQ
        let idx = daftarTimMAL_Challenger_MY.findIndex(t => t.nama === juara.nama);
        if (idx !== -1) {
            daftarTimMAL_Challenger_MY[idx] = buatTimOQMY(juara);
        }
        // Slot di MPL MY diisi (cari slot KOSONG_FRANCHISE atau tim terbawah)
        let slotMPLMY = cariSlotKosongAtauTerbawahMPLMY();
        if (slotMPLMY) {
            slotMPLMY.nama = juara.nama;
            slotMPLMY.power = juara.power || 68;
            slotMPLMY.reputasi = Math.min(75, (juara.reputasi || 40) + 10);
            slotMPLMY.statusKeuangan = "SEHAT";
            slotMPLMY.liga = "MPL";
            slotMPLMY.region = "MY";
            slotMPLMY.tipeSlot = "Franchise";
        }
    }

    // Runner-up Challenger -> tantang tim MPL MY terbawah (BO5)
    if (runnerUpIsChallenger && !juaraIsChallenger) {
        let timMPLTerbawah = cariTimMPLTerbawahMY();
        if (timMPLTerbawah) {
            let hasilPromoRelasi = simulasikanSeriesDramatis(runnerUp, timMPLTerbawah, 5, "promosi_my", false);
            let pemenang = hasilPromoRelasi ? hasilPromoRelasi.menang : timMPLTerbawah;
            if (pemenang.nama === runnerUp.nama) {
                if (typeof tambahBerita === "function") {
                    tambahBerita(`🔄 PROMOSI/DEGRADASI MY: <span>${runnerUp.nama}</span> mengalahkan ${timMPLTerbawah.nama} dan naik ke MPL MY. ${timMPLTerbawah.nama} turun ke MAL Malaysia.`);
                }
                // Tukar posisi
                let idxCha = daftarTimMAL_Challenger_MY.findIndex(t => t.nama === runnerUp.nama);
                let idxMPL = daftarTimMY.findIndex(t => t.nama === timMPLTerbawah.nama);
                if (idxCha !== -1 && idxMPL !== -1) {
                    let timNaikMPL = { ...runnerUp, liga: "MPL", region: "MY", tipeSlot: "Franchise" };
                    let timTurunMAL = { ...timMPLTerbawah, liga: "MAL", region: "MY", tipeSlot: "Challenger" };
                    daftarTimMY[idxMPL] = timNaikMPL;
                    daftarTimMAL_Challenger_MY[idxCha] = timTurunMAL;
                }
            } else {
                if (typeof tambahBerita === "function") {
                    tambahBerita(`🛡️ Bertahan: <span>${timMPLTerbawah.nama}</span> berhasil mempertahankan slot MPL MY dari tantangan ${runnerUp.nama}.`);
                }
            }
        }
    }
}

function cariSlotKosongAtauTerbawahMPLMY() {
    let kosong = daftarTimMY.find(t => t.statusKeuangan === "KOSONG_FRANCHISE");
    if (kosong) return kosong;
    return [...daftarTimMY].sort((a,b) => (a.power||0)-(b.power||0))[0];
}

function cariTimMPLTerbawahMY() {
    return [...daftarTimMY].sort((a,b) => (a.poin||0)-(b.poin||0)||(a.netGame||0)-(b.netGame||0))[0];
}

// ------------------------------------------------------------------
// [13.7] DEGRADASI TIM TERBAWAH CHALLENGER CONFERENCE
// ------------------------------------------------------------------
const POOL_NAMA_OQ_MY = [
    "KL Strikers", "Penang Legends", "JDT Esports", "Sabah Warriors",
    "Pahang Phoenix", "Perak United", "Terengganu Dragons", "Johor Rising"
];

function buatTimOQMY(timLama) {
    let namaTerpakai = [
        ...daftarTimMAL_Challenger_MY.map(t=>t.nama),
        ...daftarTimMAL_Affiliated_MY.map(t=>t.nama)
    ];
    let namaOQ = POOL_NAMA_OQ_MY.find(n=>!namaTerpakai.includes(n))
        || `OQ MY ${Math.floor(Math.random()*999)}`;
    return {
        nama: namaOQ,
        logo: namaOQ.replace(/\s+/g,"_")+".png",
        power: Math.max(30, (timLama.power||40)-3),
        matchW:0,matchL:0,gameW:0,gameL:0,poin:0,netGame:0,
        kas: 600000000+Math.floor(Math.random()*300000000),
        levelGH:1, reputasi: Math.max(15, (timLama.reputasi||25)-5),
        sponsorAI:{nama:"Konter Pulsa Barokah",tier:"C",pendapatanPerMusim:20000000},
        liga:"MAL",region:"MY",tipeSlot:"Challenger",indukMPL:null,
        ceo:(typeof generateCEOBaruLengkap==="function")
            ? generateCEOBaruLengkap({liga:"MDL",reputasi:25})
            : {nama:"CEO Baru",umur:30,keahlianFinansial:40},
        statusKeuangan:"SEHAT"
    };
}

function eksekusiDegradasiChallengerMY() {
    let klasemen = ambilKlasemenChallengerMY();
    let timTerbawah = klasemen[klasemen.length-1];
    if (!timTerbawah) return null;

    let idx = daftarTimMAL_Challenger_MY.findIndex(t=>t.nama===timTerbawah.nama);
    let timBaru = buatTimOQMY(timTerbawah);
    if (idx !== -1) daftarTimMAL_Challenger_MY[idx] = timBaru;

    if (typeof tambahBerita === "function") {
        tambahBerita(`📉 Degradasi MAL MY: <span>${timTerbawah.nama}</span> terdegradasi dari Challenger Conference. Digantikan oleh tim Open Qualifier: <b>${timBaru.nama}</b>.`);
    }
    return { terdegradasi: timTerbawah.nama, pengisi: timBaru.nama };
}

// ------------------------------------------------------------------
// [13.8] PROSES AKHIR MUSIM MAL MY
// ------------------------------------------------------------------
function prosesAkhirMusimMALMY() {
    let klasemenAff = ambilKlasemenAffiliatedMY();
    let klasemenCha = ambilKlasemenChallengerMY();

    if (typeof tambahBerita === "function") {
        tambahBerita(`🏆 Akhir Musim MAL MY: Regular season selesai. Top 4 Affiliated & Top 4 Challenger akan bertanding di Playoff (10-12 Juni, bareng Playoff MPL).`);
    }

    // [BUGFIX] Hadiah regular season utk kedua conference MAL MY --
    // sebelumnya gak ada sama sekali (cakupan distribusi hadiah lama
    // hanya 4 region MPL). Hadiah juara turnamen (gabungan kedua
    // conference) dipasang terpisah di jalankanFinalMALMY(), karena
    // standing klasemen ini SENGAJA belum di-reset sampai playoff manual
    // selesai (lihat catatan di bawah).
    if (typeof distribusiHadiahRegularSeasonAI === "function") {
        distribusiHadiahRegularSeasonAI(daftarTimMAL_Affiliated_MY, 0.25);
        distribusiHadiahRegularSeasonAI(daftarTimMAL_Challenger_MY, 0.15);
    }

    // FIX FINANSIAL: sponsor masuk + gaji keluar tiap akhir musim MAL MY
    let _timMALMY = [
        ...daftarTimMAL_Affiliated_MY.filter(t => t.nama !== timPlayer),
        ...daftarTimMAL_Challenger_MY.filter(t => t.nama !== timPlayer),
    ];
    _timMALMY.forEach(tim => {
        let pendapatan = tim.sponsorAI ? (tim.sponsorAI.pendapatanPerMusim || 0) : 0;
        let reputasi = tim.reputasi || 50;
        let ovrRataRata = (tim.roster && tim.roster.length > 0)
            ? Math.floor(tim.roster.reduce((s, p) => s + (p.ovr || tim.power), 0) / tim.roster.length)
            : tim.power;
        let modRep = 0.7 + (reputasi / 100) * 0.6;
        let modOvr = 0.8 + (ovrRataRata / 100) * 0.4;
        tim.kas = (tim.kas || 0) + Math.floor(pendapatan * modRep * modOvr);
        if (reputasi >= 90 && tim.sponsorAI && tim.sponsorAI.tier !== "S") {
            tim.sponsorAI = { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 180000000 };
        } else if (reputasi >= 75 && tim.sponsorAI && tim.sponsorAI.tier === "C") {
            tim.sponsorAI = { nama: "Red Bull", tier: "A", pendapatanPerMusim: 80000000 };
        } else if (reputasi < 40 && tim.sponsorAI && tim.sponsorAI.tier !== "C") {
            tim.sponsorAI = { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 };
        }
        // [FIX] Perluasan sponsor ilegal ke MAL MY (sebelumnya cuma MPL).
        if (typeof prosesSponsorIlegalAI === "function") prosesSponsorIlegalAI(tim);
    });
    if (typeof bayarGajiRosterAI === "function") {
        _timMALMY.forEach(tim => bayarGajiRosterAI(tim));
    }
    if (typeof cekStatusKeuanganAI === "function") {
        _timMALMY.forEach(tim => { tim.statusKeuangan = cekStatusKeuanganAI(tim); });
    }

    // === OVERHAUL KALENDER: Playoff MAL MY TIDAK lagi dijalankan instan
    // di sini -- sekarang dijadwalkan manual via jalankanQuarterFinalMALMY()
    // / jalankanSemiFinalMALMY() / jalankanFinalMALMY(), dipanggil dari
    // script.js tepat di playoffFase 1/2/3 (Rabu/Kamis/Jumat), supaya
    // SINKRON dgn jadwal Playoff MPL & tidak dobel-eksekusi.
    //
    // Klasemen top 4 masing-masing conference TETAP dipertahankan apa
    // adanya (TIDAK di-reset) sampai Playoff manual benar2 dijalankan,
    // supaya ambilTop4Affiliated()/ambilKlasemenChallengerMY() di titik
    // pemanggilan manual nanti masih merujuk ke hasil regular season
    // musim ini, bukan musim yang sudah di-reset.
    window._mainMYRegulerSelesaiMenungguPlayoff = true;

    return;
}


// ==========================================
// FASE 14 — SISTEM KLAIM SLOT AFILIASI OLEH TIM MPL BARU
// ==========================================
//
// Sesuai rangkuman desain: Tim MPL bisa bentuk afiliasi baru kalau:
//   - Sudah bertahan di MPL minimal 1 musim
//   - Kas tim MPL >= 2 Miliar
//   - Reputasi >= 60
//   - Ada slot independen/challenger tier-2 yang TERSEDIA (belum
//     punya induk MPL) di region yang sama
//
// Berlaku utk SEMUA region franchise (ID, PH, MY) -- MPL SG dikecualikan
// (non-franchise, tidak punya struktur afiliasi tier-2 sama sekali).
//
// Skenario munculnya slot tersedia:
//   1. Slot afiliasi yang di-forfeit lalu dikonversi jadi Independen
//      (sudah ditangani Fase 12 utk PH; ID & MY belum ada conversion
//      serupa sebelumnya -- ditambahkan eksplisit di sini juga)
//   2. Tim Independen/Challenger biasa yang TIDAK PERNAH diklaim siapapun
//      (tipeSlot tetap "Independen"/"Challenger" terus, tidak masalah --
//      mereka tetap bisa diklaim kapan saja oleh tim MPL yang memenuhi
//      syarat, MENGGANTI status mereka jadi "Afiliasi")
// ==========================================

// ------------------------------------------------------------------
// [14.1] TRACKING MUSIM DI MPL (semua tim MPL franchise, AI + player)
// Disimpan langsung di objek tim (field musimDiMPL), increment tiap
// akhir musim. Direset ke 0 kalau tim baru saja masuk MPL (akuisisi/
// merger/promosi) supaya syarat "1 musim" tetap berlaku adil.
// ------------------------------------------------------------------
function updateTrackingMusimDiMPL() {
    let semuaTimMPLFranchise = [
        ...daftarTim, ...daftarTimPH, ...daftarTimMY
        // SG sengaja dikecualikan -- non-franchise
    ];

    semuaTimMPLFranchise.forEach(tim => {
        if (tim.statusKeuangan === "KOSONG_FRANCHISE") {
            tim.musimDiMPL = 0; // slot kosong, belum ada yg "menjabat"
            return;
        }
        tim.musimDiMPL = (tim.musimDiMPL || 0) + 1;
    });
}

// ------------------------------------------------------------------
// [14.2] CEK APAKAH SATU TIM MPL MEMENUHI SYARAT KLAIM SLOT AFILIASI
// ------------------------------------------------------------------
function timMPLBolehKlaimAfiliasi(tim) {
    if (!tim) return { boleh: false, alasan: "Tim tidak ditemukan." };
    if (tim.region === "SG") return { boleh: false, alasan: "MPL Singapura non-franchise, tidak punya struktur afiliasi." };
    if (tim.statusKeuangan === "KOSONG_FRANCHISE") return { boleh: false, alasan: "Slot ini kosong, belum ada tim yang menjabat." };

    let musimCukup = (tim.musimDiMPL || 0) >= 1;
    let kasCukup = (tim.kas || 0) >= 2000000000;
    let reputasiCukup = (tim.reputasi || 0) >= 60;

    if (!musimCukup) return { boleh: false, alasan: "Tim harus bertahan minimal 1 musim di MPL." };
    if (!kasCukup) return { boleh: false, alasan: `Kas minimal Rp 2 Miliar (kas saat ini: Rp ${(tim.kas||0).toLocaleString("id-ID")}).` };
    if (!reputasiCukup) return { boleh: false, alasan: `Reputasi minimal 60 (reputasi saat ini: ${tim.reputasi||0}).` };

    return { boleh: true };
}

// ------------------------------------------------------------------
// [14.3] CARI SLOT TIER-2 YANG TERSEDIA DI REGION YANG SAMA
// "Tersedia" = tipeSlot Independen/Challenger TANPA induk (belum
// pernah diklaim), di region yang sama dengan tim MPL yang mengklaim.
// ------------------------------------------------------------------
function cariSlotTier2TersediaUntukKlaim(regionMPL) {
    let kandidat = [];

    if (regionMPL === "ID" && typeof daftarTimMDL_Independen_ID !== "undefined") {
        kandidat = daftarTimMDL_Independen_ID.filter(t => !t.pernahDiklaimSebagaiAfiliasi);
    } else if (regionMPL === "PH" && typeof daftarTimMDL_Independen_PH !== "undefined") {
        kandidat = daftarTimMDL_Independen_PH.filter(t => !t.pernahDiklaimSebagaiAfiliasi);
    } else if (regionMPL === "MY" && typeof daftarTimMAL_Challenger_MY !== "undefined") {
        kandidat = daftarTimMAL_Challenger_MY.filter(t => !t.pernahDiklaimSebagaiAfiliasi);
    }

    return kandidat;
}

// ------------------------------------------------------------------
// [14.4] EKSEKUSI KLAIM SLOT AFILIASI
// Tim MPL "mengadopsi" satu tim tier-2 sbg afiliasi resminya: ubah
// tipeSlot jadi "Afiliasi", set indukMPL, kas dikonversi ke model
// "dikelola induk" (kas:0, statusKeuangan: DIKELOLA_INDUK), CEO
// dilepas (afiliasi tidak py CEO sendiri sesuai aturan yg sudah ada).
// ------------------------------------------------------------------
function eksekusiKlaimSlotAfiliasi(timMPLNama, timTier2Nama) {
    let timMPL = cariTimAsliDiDatabase(timMPLNama);
    let cekBoleh = timMPLBolehKlaimAfiliasi(timMPL);
    if (!cekBoleh.boleh) {
        return { sukses: false, pesan: cekBoleh.alasan };
    }

    let slotTersedia = cariSlotTier2TersediaUntukKlaim(timMPL.region);
    let timTier2 = slotTersedia.find(t => t.nama === timTier2Nama);
    if (!timTier2) {
        return { sukses: false, pesan: "Tim tier-2 ini tidak tersedia untuk diklaim (sudah punya induk atau tidak ditemukan)." };
    }

    // Konversi tim tier-2 jadi afiliasi resmi tim MPL ini
    timTier2.tipeSlot = "Afiliasi";
    timTier2.indukMPL = timMPLNama;
    timTier2.pernahDiklaimSebagaiAfiliasi = true;
    timTier2.kas = 0; // mulai dikelola induk
    timTier2.ceo = null; // afiliasi tidak punya CEO sendiri
    timTier2.statusKeuangan = "DIKELOLA_INDUK";

    // Sinkronkan ke array gabungan (kalau ada)
    if (timMPL.region === "ID" && typeof daftarTimMDL_ID !== "undefined") {
        let idx = daftarTimMDL_ID.findIndex(t => t.nama === timTier2Nama);
        if (idx !== -1) daftarTimMDL_ID[idx] = timTier2;
    } else if (timMPL.region === "PH" && typeof daftarTimMDL_PH !== "undefined") {
        let idx = daftarTimMDL_PH.findIndex(t => t.nama === timTier2Nama);
        if (idx !== -1) daftarTimMDL_PH[idx] = timTier2;
    }

    if (typeof tambahBerita === "function") {
        tambahBerita(`🤝 Afiliasi Baru: <span>${timMPLNama}</span> resmi membentuk hubungan afiliasi dengan <b>${timTier2Nama}</b>.`);
    }

    return { sukses: true, timMPL: timMPLNama, timAfiliasiBaru: timTier2Nama };
}

// ------------------------------------------------------------------
// [14.5] KONVERSI SLOT AFILIASI YANG DI-FORFEIT (ID & MY) -- versi
// generik dari logika yang sudah ada di Fase 12 khusus PH, supaya
// konsisten di semua region franchise.
// ------------------------------------------------------------------
function cekDanTanganiSlotAfiliasiForfeitSemuaRegion() {
    function prosesSatuRegion(daftarAfiliasi, daftarGabungan, region) {
        if (typeof daftarAfiliasi === "undefined") return;

        daftarAfiliasi.forEach((timAfiliasi, idx) => {
            if (!timAfiliasi.indukMPL) return;
            let timInduk = cariTimAsliDiDatabase(timAfiliasi.indukMPL);

            if (!timInduk || timInduk.statusKeuangan === "KOSONG_FRANCHISE") {
                let timKonversi = {
                    ...timAfiliasi,
                    tipeSlot: region === "MY" ? "Challenger" : "Independen",
                    indukMPL: null,
                    pernahDiklaimSebagaiAfiliasi: false, // bisa diklaim ulang tim MPL lain
                    kas: 600000000 + Math.floor(Math.random()*300000000),
                    reputasi: Math.max(20, (timAfiliasi.reputasi || 30) - 5),
                    ceo: (typeof generateCEOBaruLengkap === "function")
                        ? generateCEOBaruLengkap({ liga: region === "MY" ? "MAL" : "MDL", reputasi: 30 })
                        : { nama: "CEO Baru", umur: 30, keahlianFinansial: 40 },
                    statusKeuangan: "SEHAT"
                };

                daftarAfiliasi[idx] = timKonversi;
                if (daftarGabungan) {
                    let idxG = daftarGabungan.findIndex(t => t.nama === timAfiliasi.nama);
                    if (idxG !== -1) daftarGabungan[idxG] = timKonversi;
                }

                if (typeof tambahBerita === "function") {
                    tambahBerita(`⚠️ Slot Forfeit: Slot afiliasi milik <span>${timAfiliasi.nama}</span> (induk: ${timAfiliasi.indukMPL}) dikosongkan karena tim induk kolaps. Status berubah jadi independen, bisa diklaim tim MPL lain.`);
                }
            }
        });
    }

    prosesSatuRegion(
        typeof daftarTimMDL_Afiliasi_ID !== "undefined" ? daftarTimMDL_Afiliasi_ID : undefined,
        typeof daftarTimMDL_ID !== "undefined" ? daftarTimMDL_ID : undefined,
        "ID"
    );
    prosesSatuRegion(
        typeof daftarTimMAL_Affiliated_MY !== "undefined" ? daftarTimMAL_Affiliated_MY : undefined,
        undefined, // MAL tidak punya array gabungan
        "MY"
    );
}
