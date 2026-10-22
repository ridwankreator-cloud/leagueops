// ============================================================
// ADVANCED SYSTEMS v2.0 — MLBB PRO CIRCUIT MANAGER
// Patch ini di-load SETELAH script.js
//
// PERUBAHAN v2.0:
//   - Tidak override simulasikanSeriesDramatis (fungsi asli script.js tetap jalan)
//   - Inject highlight kaya via override buatHighlightGame & buatHighlightDramatis
//   - Inject momentum via override hitungPerformaMatch (sudah di-expose ke window)
//   - Chemistry AI via hitungPerformaMatch juga
//   - Upset factor via override simulasikanSeries (AI vs AI only)
//   - [FIX] Playoff modal tidak muncul: patch simulasiPlayoffMatch lindungi _lastMatchResult
// ============================================================

// ============================================================
// [1] HIGHLIGHT KAYA
// ============================================================

const HIGHLIGHT_PER_ROLE = {
    Roamer: {
        ketat: [
            "ROAM MAUT! {hero} {tim} rebut objective kritis dengan timing setengah detik sebelum musuh tiba!",
            "Visioner! {hero} {tim} baca rotasi musuh lebih awal dan pasang ward di titik yang tepat — seri berubah arah.",
            "{hero} (Roamer) {tim} ulang-ulang flicker + crowd control di teamfight paling penting!"
        ],
        normal: [
            "Simbiosis sempurna! {hero} (Roamer) terus enable {tim} — draft berlapis terbayar lunas.",
            "Zona proteksi {hero} bikin carry {tim} hampir tidak bisa disentuh sepanjang game.",
            "Map awareness {hero} {tim} keterlaluan — semua rotasi musuh terbaca sebelum terjadi."
        ],
        telak: [
            "Roamer dominan! {hero} {tim} bikin musuh tidak pernah nyaman — setiap gank dapat, setiap objective aman.",
            "Vision control total oleh {hero} — {tim} bermain dengan informasi sempurna sepanjang game."
        ]
    },
    Jungler: {
        ketat: [
            "INVASI! {hero} (Jungler) masuk jungle musuh menit ke-2, rampas buff — {tim} unggul ekonomi sepanjang laga!",
            "Counter-gank magis dari {hero} — {tim} hampir kalah, tapi {hero} balik situasi dalam 4 detik!",
            "Smite perfect! Lord hampir lepas, {hero} {tim} rebut dengan satu klik tepat!"
        ],
        normal: [
            "Farm efficiency {hero} luar biasa — {tim} selalu unggul gold di setiap cek timer.",
            "Rotasi {hero} mulus, tidak ada lane yang struggling — {tim} tumbuh merata dan menang.",
            "Objective control ketat! {hero} {tim} selalu ada di tempat yang tepat saat turtle muncul."
        ],
        telak: [
            "Hyper farm + aggression! {hero} {tim} besar lebih cepat dari siapapun.",
            "Gank simulator! {hero} datang ke setiap lane, musuh tidak bisa berkembang — {tim} snowball tak tertahan."
        ]
    },
    Midlaner: {
        ketat: [
            "Mid lane memanas! {hero} {tim} meledak dengan burst damage — momentum berubah total!",
            "Micro luar biasa dari {hero} — {tim} hampir kena solo kill tapi {hero} berbalik dan one-shot musuhnya!",
            "Poke game {hero} {tim} melelahkan mental musuh — ketika teamfight terjadi, lawan setengah HP lebih dulu."
        ],
        normal: [
            "Zone kontrol {hero} (Mid) membuat rotasi musuh selalu terlambat — {tim} selangkah lebih cepat.",
            "{hero} {tim} dominasi mid lane, pressure melebar ke semua lane.",
            "Assassin timing sempurna! {hero} hapus support + carry musuh dalam satu rotasi."
        ],
        telak: [
            "{hero} (Mid) {tim} tidak terkejar — level advantage sejak menit 5, musuh kalah sebelum teamfight.",
            "Killing spree mid lane! {hero} {tim} tidak biarkan satu pun musuh aman."
        ]
    },
    Goldlaner: {
        ketat: [
            "Comeback ekonomi! {hero} (Gold) {tim} tetap farm tenang meski ditekan — ketika item ke-3 lengkap, pembalasan datang!",
            "Clutch carry! {hero} {tim} tersisa sendiri, musuh mengerubuti — tapi {hero} kite sempurna dan bersihkan semua!",
            "Tekanan tidak menggoyahkan {hero} {tim}. Disiplin farm, keluar sebagai terkuat di late game."
        ],
        normal: [
            "Late game monster! {hero} (Gold) {tim} full-build dan musuh tidak punya jawaban.",
            "Positioning {hero} {tim} sempurna — tidak pernah mati, selalu output damage maksimal.",
            "CS lead {hero} {tim} terbesar — advantage gold berujung kemenangan."
        ],
        telak: [
            "Hyper carry mode! {hero} {tim} tidak bisa dibunuh dan tidak bisa dihentikan.",
            "Economic supremacy! {hero} {tim} unggul jauh dalam gold — musuh tidak punya harapan."
        ]
    },
    "EXP Laner": {
        ketat: [
            "Duel EXP lane berlangsung lama! {hero} {tim} akhirnya menang duel kritis yang membuka path ke base musuh!",
            "Tank walk! {hero} {tim} nyebur ke tengah musuh dengan HP nyaris kosong — stun, carry bebas menghancurkan!",
            "Split push genius! {hero} {tim} terus menekan sisi jauh — musuh bingung kehabisan pilihan."
        ],
        normal: [
            "Frontline kokoh! {hero} {tim} jadi tembok yang tidak bisa ditembus.",
            "EXP Laner kelas dunia! {hero} {tim} kuasai top lane, turret pertama jatuh cepat.",
            "Teleport clutch! {hero} {tim} datang dari lane jauh tepat saat teamfight krusial."
        ],
        telak: [
            "{hero} (EXP) {tim} selesaikan lane dan langsung bantu semua sisi — musuh tidak punya jawaban.",
            "Split push {hero} {tim} tidak ada obatnya — turret hancur satu per satu tanpa perlawanan."
        ]
    }
};

const DAFTAR_RIVALRI = [
    ["EVOS","ONIC"],["RRQ","ONIC"],["EVOS","RRQ"],
    ["AP BREN","TLPH"],["AP BREN","ONIC PH"],["Aurora Gaming","AP BREN"],
    ["Selangor Red Giants","Team Vamos"],["TLID","BTR"],["GEEK","DEWA"]
];

function deteksiRivalry(namaA, namaB) {
    return DAFTAR_RIVALRI.some(p =>
        (p[0]===namaA && p[1]===namaB) || (p[1]===namaA && p[0]===namaB)
    );
}

let _usedHeroKeys = new Set();

function _rnd(arr) {
    if (!arr || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function buatHighlightKaya(timMenang, timKalah, selisih, konteks) {
    let starter = (window.ambilStarter5 ? window.ambilStarter5(timMenang) : []);
    let kandidat = starter.filter(p => !_usedHeroKeys.has(p.nama));
    if (!kandidat.length) { _usedHeroKeys.clear(); kandidat = starter; }
    let hero = kandidat.length
        ? kandidat[Math.floor(Math.random() * kandidat.length)]
        : { nama: timMenang.nama, role: "Jungler", ovr: timMenang.power || 65 };
    _usedHeroKeys.add(hero.nama);

    let kat = selisih < 1 ? "ketat" : selisih < 4 ? "normal" : "telak";
    let isPlayoff = konteks && (konteks.includes("playoff")||konteks.includes("msc")||konteks.includes("mseries"));
    let isRivalry = timKalah && deteksiRivalry(timMenang.nama, timKalah.nama);

    let templates;
    if (isRivalry && Math.random() < 0.5) {
        templates = {
            ketat:["DERBY KLASIK! {hero} {tim} tidak mau kalah dari rival abadi — setiap inch diperebutkan!","LAGA DENDAM! {hero} {tim} tampil seperti menanggung beban seluruh fanbase!"],
            normal:["Class terbukti di laga bergengsi! {hero} {tim} bermain dengan composure luar biasa."],
            telak:["STATEMENT GAME! {hero} {tim} hancurkan rival dengan telak — dominasi tak terbantahkan!"]
        }[kat];
    } else if (isPlayoff && Math.random() < 0.45) {
        templates = {
            ketat:["NYAWA DIPERTARUHKAN! {hero} {tim} lakukan play paling krusial di momen paling menegangkan!","Jantung penonton berhenti! {hero} {tim} clutch di momen yang menentukan lolos atau pulang!"],
            normal:["Playoff composure kelas satu! {hero} {tim} tidak bergetar meski tekanan penuh."],
            telak:["PLAYOFF DEMOLITION! {hero} {tim} tidak memberi kesempatan — ini pesan untuk semua tim!"]
        }[kat];
    }
    if (!templates || !templates.length) {
        let role = hero.role || "Jungler";
        let pool = HIGHLIGHT_PER_ROLE[role] || HIGHLIGHT_PER_ROLE["Jungler"];
        templates = pool[kat] || pool["normal"];
    }
    if (!templates || !templates.length) {
        templates = (window.TEMPLATE_HIGHLIGHT||{})[kat] || ["{hero} ({role}) membawa {tim} meraih kemenangan!"];
    }

    let teks = _rnd(templates)
        .replace(/{hero}/g, hero.nama)
        .replace(/{role}/g, hero.role||"Player")
        .replace(/{tim}/g, timMenang.nama);

    return { teks, hero, tim: timMenang.nama, kategori: kat };
}

// Override fungsi highlight — ini AMAN, hanya mengubah output teks
window.buatHighlightGame = function(timMenang, timKalah, selisih, konteks) {
    _usedHeroKeys.clear();
    return buatHighlightKaya(timMenang, timKalah, selisih, konteks||"regular");
};

// Override buatHighlightDramatis yang dipanggil DARI DALAM simulasikanSeriesDramatis
// Fungsi asli script.js memanggilnya di setiap game dalam seri playoff
window.buatHighlightDramatis = function(timMenang, timKalah, selisih, konteks) {
    return buatHighlightKaya(timMenang, timKalah, selisih, konteks||"playoff_semi");
};

// ============================================================
// [2] MOMENTUM — via hitungPerformaMatch (streak lintas-match)
// ============================================================

window._streakTracker = window._streakTracker || {};

window.updateStreakMomentum = function(menang, kalah) {
    [menang,kalah].forEach(n => {
        if (!window._streakTracker[n]) window._streakTracker[n] = {menang:0,kalah:0};
    });
    window._streakTracker[menang].menang++;
    window._streakTracker[menang].kalah = 0;
    window._streakTracker[kalah].kalah++;
    window._streakTracker[kalah].menang = 0;
};

window.getStreakModifier = function(nama) {
    let s = window._streakTracker[nama];
    if (!s) return 0;
    if (s.menang >= 5) return 2.0;
    if (s.menang >= 3) return 1.2;
    if (s.menang >= 2) return 0.6;
    if (s.kalah >= 5) return -2.5 + (Math.random()<0.15?1.5:0);
    if (s.kalah >= 3) return -1.5 + (Math.random()<0.20?1.0:0);
    if (s.kalah >= 2) return -0.7;
    return 0;
};

// ============================================================
// [3] CHEMISTRY AI + [2] MOMENTUM — inject via hitungPerformaMatch
// ============================================================

window.hitungChemistryAI = function(timObj) {
    if (!timObj||!timObj.roster||!timObj.roster.length) return 0;
    let total = Math.min(timObj.roster.length,5);
    let lama = timObj.roster.filter(p=>(p.sisaKontrak||0)>=2&&!p.sudahTransfer).length;
    let score = timObj.chemistryAI !== undefined
        ? timObj.chemistryAI
        : Math.min(100,(lama/total)*100);
    if (score>=80) return 2.5;
    if (score>=60) return 1.5;
    if (score>=40) return 0;
    if (score>=20) return -1;
    return -2;
};

// Patch SATU KALI hitungPerformaMatch untuk streak + chemistry
const _origPerforma = window.hitungPerformaMatch;
window.hitungPerformaMatch = function(timObj) {
    let base = _origPerforma(timObj);
    // Streak momentum (berlaku semua tim)
    base += window.getStreakModifier(timObj.nama);
    // Chemistry hanya AI
    if (timObj.nama !== (window.timPlayer||"")) {
        base += window.hitungChemistryAI(timObj);
    }
    return base;
};

// ============================================================
// [4] UPSET FACTOR — dalam simulasikanSeries (AI vs AI)
// ============================================================

const _origSimSeries = window.simulasikanSeries;
window.simulasikanSeries = function(timA, timB, formatBO) {
    let butuhWin = Math.ceil(formatBO/2);
    let sA=0, sB=0;
    for (let i=0; i<formatBO; i++) {
        if (sA===butuhWin||sB===butuhWin) break;
        let pA = window.hitungPerformaMatch(timA);
        let pB = window.hitungPerformaMatch(timB);
        let gap = Math.abs(pA-pB);

        // Penentu menang-kalah sekarang lewat sistem probability + momentum
        // (close_score_patch.js), bukan pA>pB mentah lagi.
        let aMenangGame = window.tentukanPemenangGame
            ? window.tentukanPemenangGame(pA, pB, sA, sB, formatBO)
            : pA > pB;

        // Narasi UPSET tetap jalan: dipicu kalau yang menang justru
        // yang performanya lebih rendah di game itu.
        let favoritA = pA > pB;
        let underdogMenang = (favoritA && !aMenangGame) || (!favoritA && aMenangGame);
        if (gap > 2 && underdogMenang) {
            let underdog = favoritA ? timB : timA;
            let favorit  = favoritA ? timA : timB;
            let level = gap>8?"major":gap>5?"medium":"minor";
            if (level!=="minor"&&Math.random()<0.35) {
                let msgs = {
                    medium:[`UPSET! ${underdog.nama} kalahkan ${favorit.nama}!`],
                    major:[`UPSET RAKSASA! ${underdog.nama} bunuh raksasa ${favorit.nama}!!!`]
                };
                window.tambahBerita?.(`${msgs[level]?.[0]||""}`);
            }
        }

        if (aMenangGame) sA++; else sB++;
    }
    return {
        home:timA, away:timB,
        skorHome:sA, skorAway:sB,
        sudahMain:true, format:"BO"+formatBO,
        menang:sA>sB?timA:timB, kalah:sA>sB?timB:timA
    };
};

// ============================================================
// [FIX] PLAYOFF MODAL TIDAK MUNCUL
// Root cause: beberapa simulasiPlayoffMatch() jalan berurutan,
// _lastMatchResult di-overwrite match berikutnya sebelum
// cekDanTampilHasilDramatis() dipanggil.
// Fix: simpan hasil player segera setelah match-nya selesai.
// ============================================================

window._savedPlayerMatchResult = null;

const _origSimPlayoff = window.simulasiPlayoffMatch;
window.simulasiPlayoffMatch = function(timA, timB, formatBO, konteks) {
    _usedHeroKeys.clear(); // reset anti-repetisi per seri baru
    let hasil = _origSimPlayoff(timA, timB, formatBO, konteks);
    // Langsung selamatkan kalau ada hasil player
    if (window._lastMatchResult && !window._savedPlayerMatchResult) {
        window._savedPlayerMatchResult = window._lastMatchResult;
        window._lastMatchResult = null;
    }
    return hasil;
};

const _origSimGlobal = window.simulasiGlobalMatch;
if (typeof _origSimGlobal === "function") {
    window.simulasiGlobalMatch = function(timA, timB, formatBO, konteks) {
        _usedHeroKeys.clear();
        let hasil = _origSimGlobal(timA, timB, formatBO, konteks);
        if (window._lastMatchResult && !window._savedPlayerMatchResult) {
            window._savedPlayerMatchResult = window._lastMatchResult;
            window._lastMatchResult = null;
        }
        return hasil;
    };
}

// Patch cekDanTampilHasilDramatis untuk ambil dari saved result
window.cekDanTampilHasilDramatis = function() {
    let tampil = window._savedPlayerMatchResult || window._lastMatchResult;
    if (tampil) {
        window._savedPlayerMatchResult = null;
        window._lastMatchResult = null;
        setTimeout(() => {
            if (typeof window.bukaHasilMatch === "function") {
                window.bukaHasilMatch(tampil);
            }
        }, 150);
    }
};

// ============================================================
// Berita streak + hook ke bukaHasilMatch
// ============================================================

window.prosesBeritaStreak = function() {
    let s = window._streakTracker[window.timPlayer];
    if (!s) return;
    if (s.menang===3) window.tambahBerita?.(`ON FIRE! <span>${window.timPlayer}</span> menang 3 beruntun!`);
    else if (s.menang===5) window.tambahBerita?.(`UNSTOPPABLE! <span>${window.timPlayer}</span> menang 5 beruntun!`);
    else if (s.kalah===3) {
        window.tambahBerita?.(`KRISIS! <span>${window.timPlayer}</span> kalah 3 beruntun. Fanbase gelisah...`);
        window.tambahEmail?.("Evaluasi Internal","Komite Teknis","<b>Tim sudah kalah 3 kali beruntun.</b> Manajemen meminta evaluasi mendalam.");
    } else if (s.kalah===5)
        window.tambahBerita?.(`DARURAT! <span>${window.timPlayer}</span> kalah 5 beruntun!`);
};

const _origBukaHasil = window.bukaHasilMatch;
if (typeof _origBukaHasil === "function") {
    window.bukaHasilMatch = function(data) {
        if (data && data.mvpTim) {
            let namaHome = data.home?.nama||"";
            let namaAway = data.away?.nama||"";
            let menang = data.mvpTim;
            let kalah = menang===namaHome ? namaAway : namaHome;
            if (kalah) { window.updateStreakMomentum(menang,kalah); window.prosesBeritaStreak(); }
        }
        return _origBukaHasil(data);
    };
}

// exports
window.deteksiRivalry = deteksiRivalry;
window.buatHighlightKaya = buatHighlightKaya;

console.log("Advanced Systems v2.0 loaded — playoff fix aktif, semua sistem inject aman.");


// ==========================================
// FANBASE.JS — SISTEM FANBASE & MERCHANDISE (INTI)
// Versi: 2.0 UNIFIED — Gabungan fanbase.js + fanbase_patch.js
// Semua hook & integrasi inti ditulis langsung di sini.
// CATATAN: merchandise_system_v3_patch.js (file terpisah, load setelah
// file ini) meng-extend/wrap sebagian fungsi di sini -- lihat komentar
// "Wrap fungsi lama" di file itu untuk detail apa yang di-override.
// ==========================================
// Sistem:
// 1. JUMLAH FANBASE  : Naik/turun berdasarkan performa, event, reputasi
// 2. MORAL FANBASE   : Mood fans (0-100)
// 3. KRITIK FANS     : Muncul saat losestreak ≥ 3 & moral rendah
// 4. MENTAL PEMAIN   : Kondisi psikologis pemain
// 5. STAMINA TIM     : Kesiapan fisik pemain
// 6. MERCHANDISE     : Toko item — pendapatan pasif mingguan
// ==========================================

// ==========================================
// STATE GLOBAL FANBASE
// ==========================================
let fanbase = {
    jumlah: 0,
    moral: 70,
    streakKalahKita: 0,
    totalMatchMainKita: 0,
    winRateMusimKita: 0,
    historiMatch: [],
    statusKritik: "MENDUKUNG",
    merchandise: [],
    pendapatanMerchandise: 0,
    eventAktif: null
};

// ==========================================
// KONSTANTA & KONFIGURASI
// ==========================================
const FANBASE_CONFIG = {
    growthMenang: 2,
    growthMenangBesar: 5,
    growthJuaraMPL: 50,
    growthJuaraMSC: 100,
    growthJuaraMSeries: 250,

    dropKalah: 1,
    dropKalahBeruntun3: 5,
    dropKalahBeruntun5: 15,
    dropReleasePemainBintang: 10,

    moralDropPerKalah: 8,
    moralNaikPerMenang: 6,
    moralMax: 100,
    moralMin: 0,

    batasKhawatir: 2,
    batasKritis: 3,
    batasKrisis: 5,

    merkPerItem: {
        jersey:   { nama: "Jersey Tim",             harga: 350000, produksi: 150000, kapasitas: 100 },
        hoodie:   { nama: "Hoodie Eksklusif",        harga: 500000, produksi: 225000, kapasitas: 60  },
        cap:      { nama: "Topi Esports",            harga: 150000, produksi: 50000,  kapasitas: 200 },
        mousepad: { nama: "Mousepad Limited",        harga: 200000, produksi: 80000,  kapasitas: 150 },
        keychain: { nama: "Gantungan Kunci",         harga: 50000,  produksi: 15000,  kapasitas: 500 },
        figurine: { nama: "Figurin Pemain Bintang",  harga: 750000, produksi: 350000, kapasitas: 30  }
    },

    pengaruhMentalKePerforma: 0.08,
    staminaDropPerMatch: 5,
    staminaRecoveryPerMinggu: 10,
    staminaMin: 20
};

// ==========================================
// [A] INISIALISASI
// ==========================================
function inisialFanbase(timData) {
    let rep = timData.reputasi || 50;
    fanbase.jumlah = Math.max(10, Math.floor(rep * 1.5 + Math.random() * 20));
    fanbase.moral = 70;
    fanbase.merchandise = [];
    fanbase.pendapatanMerchandise = 0;
    fanbase.streakKalahKita = 0;
    fanbase.historiMatch = [];
    fanbase.statusKritik = "MENDUKUNG";

    if (typeof rosterKita !== "undefined") {
        rosterKita.forEach(p => {
            if (p.mental === undefined)  p.mental  = 70 + Math.floor(Math.random() * 20);
            if (p.stamina === undefined) p.stamina = 80 + Math.floor(Math.random() * 20);
        });
    }

    if (rep >= 70) {
        fanbase.merchandise.push({ tipe: "jersey", aktif: true, mingguAktif: 0 });
        fanbase.merchandise.push({ tipe: "cap",    aktif: true, mingguAktif: 0 });
    } else {
        fanbase.merchandise.push({ tipe: "cap", aktif: true, mingguAktif: 0 });
    }

    renderFanbaseUI();
}

// ==========================================
// [B] PASCA MATCH
// ==========================================
function prosesFanbasePascaMatch(hasilMatch) {
    let menang = hasilMatch.menang;
    let selisihSkor = Math.abs((hasilMatch.skorKita || 0) - (hasilMatch.skorLawan || 0));
    let besar = selisihSkor >= 2;

    // Streak
    if (menang) fanbase.streakKalahKita = 0;
    else        fanbase.streakKalahKita++;

    // Histori
    fanbase.historiMatch.unshift({ hasil: menang ? "MENANG" : "KALAH", minggu: mingguKe });
    if (fanbase.historiMatch.length > 5) fanbase.historiMatch.pop();

    // Moral
    if (menang) {
        let naik = besar ? FANBASE_CONFIG.moralNaikPerMenang + 3 : FANBASE_CONFIG.moralNaikPerMenang;
        fanbase.moral = Math.min(FANBASE_CONFIG.moralMax, fanbase.moral + naik);
    } else {
        let turun = besar ? FANBASE_CONFIG.moralDropPerKalah + 4 : FANBASE_CONFIG.moralDropPerKalah;
        fanbase.moral = Math.max(FANBASE_CONFIG.moralMin, fanbase.moral - turun);
    }

    // Jumlah fanbase
    if (menang) {
        let growth = besar ? FANBASE_CONFIG.growthMenangBesar : FANBASE_CONFIG.growthMenang;
        fanbase.jumlah = Math.max(1, fanbase.jumlah + growth);
    } else {
        let drop = FANBASE_CONFIG.dropKalah;
        if (fanbase.streakKalahKita >= 5)      drop = FANBASE_CONFIG.dropKalahBeruntun5;
        else if (fanbase.streakKalahKita >= 3) drop = FANBASE_CONFIG.dropKalahBeruntun3;
        fanbase.jumlah = Math.max(1, fanbase.jumlah - drop);
    }

    // Status kritik
    let statusLama = fanbase.statusKritik;
    if (fanbase.streakKalahKita >= FANBASE_CONFIG.batasKrisis || fanbase.moral <= 20)
        fanbase.statusKritik = "KRISIS";
    else if (fanbase.streakKalahKita >= FANBASE_CONFIG.batasKritis || fanbase.moral <= 35)
        fanbase.statusKritik = "KRITIS";
    else if (fanbase.streakKalahKita >= FANBASE_CONFIG.batasKhawatir || fanbase.moral <= 50)
        fanbase.statusKritik = "KHAWATIR";
    else
        fanbase.statusKritik = "MENDUKUNG";

    if (statusLama !== fanbase.statusKritik && fanbase.statusKritik !== "MENDUKUNG") {
        kirimEmailKritikFans();
    }

    // [WIRING FIX] updateMentalPemainPascaMatch() & updateStaminaPemainPascaMatch()
    // SENGAJA tidak dipanggil di sini. p.mental & p.stamina buat rosterKita
    // sudah diurus oleh window.prosesStaminaMental() (ui.js, dipanggil live
    // dari script.js setelah tiap match) -- kalau dua-duanya jalan bareng,
    // mental/stamina bakal diproses 2x per match pakai formula yang beda.
    // Fungsi lama dibiarkan tetap ada (bukan dihapus) buat referensi/rollback.
    cekDanTriggerIntervensiMental();
    renderFanbaseUI();
}

// ==========================================
// [C] MENTAL & STAMINA PEMAIN
// ==========================================
function updateMentalPemainPascaMatch(menang, selisihSkor) {
    if (typeof rosterKita === "undefined") return;
    rosterKita.forEach(p => {
        if (p.mental === undefined) p.mental = 70;
        let stabil = p.mental >= 80 ? 0.7 : 1.0;
        if (menang) {
            p.mental = Math.min(100, p.mental + (3 + selisihSkor) * stabil);
        } else {
            let drop = (5 + selisihSkor) * stabil;
            if (fanbase.streakKalahKita >= 3) drop *= 1.5;
            p.mental = Math.max(10, p.mental - drop);
        }

        let historiKalah = fanbase.historiMatch.filter(h => h.hasil === "KALAH").length;
        if (historiKalah >= 4 && p.mental < 50 && Math.random() < 0.15) {
            tambahEmail(
                `😔 Saya Butuh Dukungan — ${p.nama}`,
                `${p.nama} (${p.role})`,
                `Manajer, saya ingin berbicara jujur.<br><br>
                Setelah ${historiKalah} kekalahan beruntun, mentalitas saya sedang di titik terendah.
                Saya kehilangan kepercayaan diri dan takut membuat kesalahan.<br><br>
                Apakah ada sesi latihan tambahan atau sesi psikolog yang bisa dijadwalkan?<br><br>
                <i>Mental saat ini: <b style="color:#E5484D;">${Math.floor(p.mental)}/100</b></i><br><br>
                <span style="color:#5C6472;font-size:11px;">*Jika dibiarkan, performa pertandingan akan menurun signifikan.</span>`
            );
        }
    });
}

function updateStaminaPemainPascaMatch() {
    if (typeof rosterKita === "undefined") return;
    rosterKita.forEach(p => {
        if (p.stamina === undefined) p.stamina = 85;
        p.stamina = Math.max(FANBASE_CONFIG.staminaMin, p.stamina - FANBASE_CONFIG.staminaDropPerMatch);
    });
}

// ==========================================
// [D] PROSES PER MINGGU
// ==========================================
function prosesFanbasePerMinggu() {
    if (typeof rosterKita === "undefined") return;
    rosterKita.forEach(p => {
        if (p.stamina === undefined) p.stamina = 85;
        p.stamina = Math.min(100, p.stamina + FANBASE_CONFIG.staminaRecoveryPerMinggu);

        if (p.mental === undefined) p.mental = 70;
        if (fanbase.streakKalahKita === 0)     p.mental = Math.min(100, p.mental + 3);
        else if (fanbase.streakKalahKita < 3)  p.mental = Math.min(100, p.mental + 1);
    });

    prosesRevenueMerchandise();
}

// ==========================================
// [E] CEK INTERVENSI MENTAL DARURAT
// ==========================================
function cekDanTriggerIntervensiMental() {
    if (typeof rosterKita === "undefined") return;
    let rendah = rosterKita.filter(p => (p.mental || 70) < 40);
    if (rendah.length >= 3 && fanbase.statusKritik === "KRISIS") {
        let stafNama = (typeof staffKita !== "undefined" && staffKita && staffKita.pelatih)
            ? staffKita.pelatih.nama : "Tim Coaching";
        tambahEmail(
            "🚨 DARURAT: Kondisi Mental Tim Kritis!",
            stafNama,
            `Bos, ini situasi serius.<br><br>
            <b>${rendah.length} pemain</b> memiliki kondisi mental di bawah ambang kritis:<br><br>
            ${rendah.map(p => `• <b>${p.nama}</b> (${p.role}): Mental <span style="color:#E5484D;">${Math.floor(p.mental)}/100</span>`).join("<br>")}<br><br>
            Kondisi ini <b>langsung mempengaruhi performa di pertandingan</b>.
            Jika tidak ditangani dalam 2 minggu, kita berisiko kehilangan mereka di transfer window.<br><br>
            <span style="color:#E8720C;font-weight:bold;">Rekomendasi: Sesi team building & rotasi pemain.</span>`
        );
    }
}

// ==========================================
// [F] EMAIL KRITIK FANS
// ==========================================
function kirimEmailKritikFans() {
    let streak = fanbase.streakKalahKita;
    let moral  = Math.floor(fanbase.moral);
    let status = fanbase.statusKritik;
    let subjek, pengirim, isi;

    if (status === "KHAWATIR") {
        subjek   = `😟 Fans Mulai Khawatir — ${streak}x Kekalahan Beruntun`;
        pengirim = `Komunitas Fan Club ${timPlayer}`;
        isi = `Manajer,<br><br>
            Kami menyampaikan kekhawatiran kami. Tim sudah <b>${streak} kekalahan beruntun</b>
            dan moral kami mulai terguncang (Moral: <span style="color:#E8720C">${moral}/100</span>).<br><br>
            Kami masih percaya, tapi butuh sinyal positif. Evaluasi strategi dan komposisi pemain!<br><br>
            <span style="color:#5C6472;font-size:11px;">— Fanbase ${timPlayer} (${fanbase.jumlah}rb orang)</span>`;

    } else if (status === "KRITIS") {
        subjek   = `😤 FANS MARAH — ${streak}x Kalah! Evaluasi Segera!`;
        pengirim = `Front Supporter ${timPlayer}`;
        isi = `MANAJER!<br><br>
            <b>${streak} kekalahan beruntun</b> adalah hal yang TIDAK BISA diterima!
            Moral fans sudah di level <span style="color:#E5484D;font-weight:bold;">${moral}/100</span>.<br><br>
            Kami menuntut: evaluasi total strategi, rotasi pemain buruk, dan transparansi rencana tim.<br><br>
            <span style="color:#E5484D;font-weight:bold;">Fanbase yang pergi: -${FANBASE_CONFIG.dropKalahBeruntun3}rb orang minggu ini.</span>`;

    } else if (status === "KRISIS") {
        subjek   = `🔥 KRISIS TOTAL — FANS MEMBOIKOT! ${streak}x KALAH!`;
        pengirim = `Aliansi Fans ${timPlayer} (Frustrasi)`;
        isi = `INI BUKAN EMAIL BIASA.<br><br>
            Kami menyatakan kondisi <b style="color:#E5484D;">KRISIS TOTAL FANBASE</b>.<br><br>
            <b>${streak} kekalahan beruntun</b>. Moral fans di titik terendah: <span style="color:#E5484D;font-weight:bold;">${moral}/100</span>.<br><br>
            Dampak: penjualan merchandise turun 60%, ribuan fans mempertimbangkan pindah dukungan,
            reputasi tim dalam ancaman serius.<br><br>
            <span style="color:#5B3DF5;font-size:11px;">— ${fanbase.jumlah}rb Fans yang Kecewa</span>`;
    }

    if (subjek) tambahEmail(subjek, pengirim, isi);
}

// ==========================================
// [G] EVENT BESAR (JUARA, PLAYOFF, DST)
// ==========================================
function prosesFanbaseEventBesar(tipe) {
    let growth = 0, moralBoost = 0, pesanBerita = "";

    switch(tipe) {
        case "JUARA_MPL":
            growth = FANBASE_CONFIG.growthJuaraMPL; moralBoost = 30;
            pesanBerita = `🏆 Ledakan Fanbase. Kemenangan MPL ${timPlayer} tambah <b>${growth}rb fans baru</b>.`;
            kirimEmailSelebrasiJuara("MPL"); break;
        case "GRAND_FINAL":
            growth = 20; moralBoost = 20;
            pesanBerita = `🥈 Penampilan di Grand Final ${timPlayer} tambah <b>${growth}rb fans baru</b>.`; break;
        case "LOLOS_PLAYOFF":
            growth = 8; moralBoost = 10;
            pesanBerita = `✅ Lolos Playoff ${timPlayer} tambah <b>${growth}rb fans</b>.`; break;
        case "JUARA_MSC":
            growth = FANBASE_CONFIG.growthJuaraMSC; moralBoost = 40;
            pesanBerita = `🌏 Juara Asia Tenggara. Fanbase ${timPlayer} meledak tambah <b>${growth}rb fans</b>.`;
            kirimEmailSelebrasiJuara("MSC"); break;
        case "JUARA_MSERIES":
            growth = FANBASE_CONFIG.growthJuaraMSeries; moralBoost = 50;
            pesanBerita = `👑 Juara Dunia. ${timPlayer} mengguncang planet ini. Fanbase tambah <b>${growth}rb penggemar global</b>.`;
            kirimEmailSelebrasiJuara("M-Series"); break;
    }

    fanbase.jumlah += growth;
    fanbase.moral = Math.min(100, fanbase.moral + moralBoost);
    fanbase.statusKritik = "MENDUKUNG";
    fanbase.streakKalahKita = 0;
    if (pesanBerita) tambahBerita(pesanBerita);

    if (typeof rosterKita !== "undefined") {
        rosterKita.forEach(p => {
            p.mental  = Math.min(100, (p.mental  || 70) + moralBoost * 0.5);
            p.stamina = Math.min(100, (p.stamina || 80) + 10);
        });
    }

    renderFanbaseUI();
}

function kirimEmailSelebrasiJuara(turnamen) {
    tambahEmail(
        `🏆 KITA JUARA ${turnamen.toUpperCase()}! Pesan dari Para Fans`,
        `Fanbase ${timPlayer} (${fanbase.jumlah}rb orang)`,
        `MANAJER TERBAIK!!! 🎉🎉🎉<br><br>
        <b>${timPlayer}</b> adalah <b>JUARA ${turnamen.toUpperCase()}!!!</b><br><br>
        Dampak positif:<br>
        • 🚀 Fanbase meledak! Ribuan penggemar baru bergabung<br>
        • 💰 Merchandise habis terjual! Harap segera restock<br>
        • 🌟 Reputasi tim meroket di level internasional<br><br>
        <span style="color:#5B3DF5;font-weight:bold;">— ${fanbase.jumlah}rb Fans yang Super Bangga</span>`
    );
}

// ==========================================
// [H] MODIFIER MENTAL & STAMINA KE PERFORMA
// Dipanggil langsung dari hitungPerformaMatch di script.js
// ==========================================
function getModifierMentalStamina() {
    if (typeof rosterKita === "undefined" || rosterKita.length === 0) return 0;

    let starter = typeof window.ambilStarter5 === "function"
        ? window.ambilStarter5({ nama: timPlayer, roster: rosterKita })
        : rosterKita.slice(0, 5);

    let totalMental = 0, totalStamina = 0, count = starter.length || 1;
    starter.forEach(p => {
        totalMental  += (p.mental  || 70);
        totalStamina += (p.stamina || 85);
    });

    let avgMental  = totalMental  / count;
    let avgStamina = totalStamina / count;

    let modMental  = (avgMental  - 70) * 0.05;
    let modStamina = (avgStamina - 80) * 0.03;

    return modMental + modStamina;
}

// ==========================================
// [I] SISTEM MERCHANDISE
// ==========================================
function hitungEstimasiMerchandise(tipe) {
    let item = FANBASE_CONFIG.merkPerItem[tipe];
    let profit = item.harga - item.produksi;
    let konversi = 0.02 + (fanbase.moral / 100) * 0.06;
    let pembeli = Math.floor(fanbase.jumlah * 1000 * konversi);
    pembeli = Math.min(pembeli, item.kapasitas * 4);
    return Math.floor(profit * pembeli);
}

function prosesRevenueMerchandise() {
    if (fanbase.merchandise.length === 0) return;
    let totalRevenue = 0;

    fanbase.merchandise.forEach(m => {
        if (!m.aktif) return;
        m.mingguAktif++;
        let revenue = hitungEstimasiMerchandise(m.tipe);
        if (fanbase.moral >= 80)     revenue = Math.floor(revenue * 1.3);
        else if (fanbase.moral <= 30) revenue = Math.floor(revenue * 0.4);
        totalRevenue += revenue;
    });

    if (totalRevenue > 0) {
        kasTim += totalRevenue;
        fanbase.pendapatanMerchandise += totalRevenue;
        catatKas("MASUK", totalRevenue, "Pendapatan Merchandise Mingguan");
    }
}

window.bukaTambahMerchandise = function() {
    let tipeAktif = fanbase.merchandise.map(m => m.tipe);
    let tipeAvailable = Object.keys(FANBASE_CONFIG.merkPerItem).filter(k => !tipeAktif.includes(k));

    if (tipeAvailable.length === 0) {
        bukaModal("Semua Item Aktif 🛍️", "Semua lini merchandise sudah aktif!", "#00B37E");
        return;
    }

    let listHtml = tipeAvailable.map(tipe => {
        let item = FANBASE_CONFIG.merkPerItem[tipe];
        let est  = hitungEstimasiMerchandise(tipe);
        return `
        <div style="background:#F1F3F8;border:1px solid #333;border-radius:6px;padding:12px;margin-bottom:8px;">
            <div style="font-weight:bold;color:#5B3DF5;margin-bottom:4px;">${item.nama}</div>
            <div style="font-size:11px;color:#5C6472;">
                Harga: Rp ${item.harga.toLocaleString("id-ID")} | Produksi: Rp ${item.produksi.toLocaleString("id-ID")}
            </div>
            <div style="font-size:11px;color:#00B37E;margin-top:3px;">
                Est. Rp ${est.toLocaleString("id-ID")}/minggu
            </div>
            <button class="modal-btn btn-green" style="margin-top:8px;width:100%;font-size:11px;padding:7px;"
                onclick="konfirmasiTambahMerchandise('${tipe}')">
                + Jual ${item.nama}
            </button>
        </div>`;
    }).join("");

    bukaModal("🛍️ Tambah Lini Merchandise",
        `<div style="font-size:11px;color:#5C6472;margin-bottom:12px;">
            Fanbase: <b style="color:#5B3DF5;">${fanbase.jumlah}rb orang</b>
        </div>${listHtml}`, "#E8720C");
};

window.konfirmasiTambahMerchandise = function(tipe) {
    let item     = FANBASE_CONFIG.merkPerItem[tipe];
    let biayaAwal = item.produksi * 10;

    if (kasTim < biayaAwal) {
        bukaModal("Kas Tidak Cukup 💸",
            `Butuh modal awal <b>Rp ${biayaAwal.toLocaleString("id-ID")}</b> untuk produksi batch pertama ${item.nama}.`,
            "#E5484D");
        return;
    }

    kasTim -= biayaAwal;
    catatKas("KELUAR", biayaAwal, `Modal Produksi Merchandise: ${item.nama}`);
    fanbase.merchandise.push({ tipe, aktif: true, mingguAktif: 0 });
    tutupModal();
    tambahEmail(
        `🎁 ${item.nama} Siap Dijual!`,
        `Tim Merchandise ${timPlayer}`,
        `<b>${item.nama}</b> kini tersedia untuk para penggemar setia ${timPlayer}.<br><br>
        Estimasi pendapatan per minggu: <b style="color:#00B37E;">Rp ${hitungEstimasiMerchandise(tipe).toLocaleString("id-ID")}</b>`
    );
    renderFanbaseUI();
};

// ==========================================
// [J] RECOVERY MANUAL (STAMINA & MENTAL)
// ==========================================
window.recoveryManual = function(tipe) {
    if (typeof rosterKita === "undefined" || rosterKita.length === 0) {
        bukaModal("Roster Kosong", "Tidak ada pemain di roster!", "#E5484D");
        return;
    }

    const BIAYA = { STAMINA: 25000000, MENTAL: 50000000, SEMUA: 65000000 };
    let biaya = BIAYA[tipe] || BIAYA.SEMUA;
    let namaLayanan = tipe === "STAMINA" ? "Sesi Fisioterapi & Gym"
                    : tipe === "MENTAL"  ? "Sesi Psikolog & Team Building"
                    : "Recovery Package Lengkap";

    if (typeof kasTim === "undefined" || kasTim < biaya) {
        bukaModal("Kas Tidak Cukup 💸",
            `Butuh <b>Rp ${biaya.toLocaleString("id-ID")}</b> untuk <b>${namaLayanan}</b>.<br><br>
             Kas tim saat ini: <b>Rp ${(kasTim || 0).toLocaleString("id-ID")}</b>`, "#E5484D");
        return;
    }

    kasTim -= biaya;
    catatKas("KELUAR", biaya, `Recovery Manual: ${namaLayanan}`);

    let pesan = [];
    rosterKita.forEach(p => {
        if (tipe === "STAMINA" || tipe === "SEMUA") {
            let lama = Math.floor(p.stamina || 85);
            p.stamina = Math.min(100, (p.stamina || 85) + 30);
            pesan.push(`• ${p.nama}: Stamina ${lama} → ${Math.floor(p.stamina)}`);
        }
        if (tipe === "MENTAL" || tipe === "SEMUA") {
            let lama = Math.floor(p.mental || 70);
            p.mental  = Math.min(100, (p.mental || 70) + 25);
            let line  = `• ${p.nama}: Mental ${lama} → ${Math.floor(p.mental)}`;
            if (tipe === "SEMUA") {
                let idx = pesan.findIndex(s => s.includes(p.nama));
                if (idx !== -1) pesan[idx] += ` | Mental ${lama} → ${Math.floor(p.mental)}`;
                else pesan.push(line);
            } else {
                pesan.push(line);
            }
        }
    });

    fanbase.moral = Math.min(100, fanbase.moral + 5);
    if (fanbase.statusKritik === "KRISIS" || fanbase.statusKritik === "KRITIS")
        fanbase.statusKritik = "KHAWATIR";

    if (typeof updateDashboard === "function") updateDashboard();
    renderFanbaseUI();

    let judul = tipe === "STAMINA" ? "💪 Stamina Dipulihkan!"
              : tipe === "MENTAL"  ? "🧠 Mental Dipulihkan!"
              : "🌟 Recovery Lengkap Berhasil!";

    bukaModal(judul,
        `<b>${namaLayanan}</b> selesai dilaksanakan.<br>
         Biaya: <b style="color:#E8720C;">-Rp ${biaya.toLocaleString("id-ID")}</b><br><br>
         <div style="text-align:left;font-size:11px;max-height:150px;overflow-y:auto;line-height:1.8;">
             ${pesan.join("<br>")}
         </div>`, "#00B37E");
};

window.recoveryStamina = () => window.recoveryManual("STAMINA");
window.recoveryMental  = () => window.recoveryManual("MENTAL");
window.recoverySemua   = () => window.recoveryManual("SEMUA");

window.bukaMenuRecovery = function() {
    let staminaRata = 0, mentalRata = 0;
    if (typeof rosterKita !== "undefined" && rosterKita.length > 0) {
        rosterKita.forEach(p => { staminaRata += (p.stamina || 85); mentalRata += (p.mental || 70); });
        staminaRata = Math.floor(staminaRata / rosterKita.length);
        mentalRata  = Math.floor(mentalRata  / rosterKita.length);
    }

    let wS = staminaRata >= 70 ? "#0891B2" : staminaRata >= 45 ? "#E8720C" : "#E5484D";
    let wM = mentalRata  >= 70 ? "#00B37E" : mentalRata  >= 45 ? "#E8720C" : "#E5484D";

    bukaModal("🏥 Menu Recovery Tim", `
        <div style="font-size:12px;color:#5C6472;margin-bottom:14px;text-align:left;">
            Kondisi rata-rata tim: Stamina <b style="color:${wS};">${staminaRata}/100</b> &nbsp;|&nbsp; Mental <b style="color:${wM};">${mentalRata}/100</b>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="background:#F1F3F8;border:1px solid #E9ECF2;border-radius:8px;padding:12px;text-align:left;">
                <div style="font-weight:bold;color:#0891B2;margin-bottom:4px;">💪 Sesi Fisioterapi & Gym</div>
                <div style="font-size:11px;color:#888;margin-bottom:6px;">+30 Stamina semua pemain</div>
                <div style="font-size:11px;color:#C9971F;margin-bottom:8px;">Biaya: Rp 25.000.000</div>
                <button class="modal-btn btn-blue" style="width:100%;padding:8px;font-size:11px;"
                    onclick="tutupModal();recoveryStamina();">Pesan Sesi Fisio</button>
            </div>
            <div style="background:#F1F3F8;border:1px solid #E9ECF2;border-radius:8px;padding:12px;text-align:left;">
                <div style="font-weight:bold;color:#00B37E;margin-bottom:4px;">🧠 Sesi Psikolog & Team Building</div>
                <div style="font-size:11px;color:#888;margin-bottom:6px;">+25 Mental semua pemain + Moral Fans +5</div>
                <div style="font-size:11px;color:#C9971F;margin-bottom:8px;">Biaya: Rp 50.000.000</div>
                <button class="modal-btn btn-green" style="width:100%;padding:8px;font-size:11px;"
                    onclick="tutupModal();recoveryMental();">Jadwalkan Sesi Psikolog</button>
            </div>
            <div style="background:#F1F3F8;border:1px solid #5B3DF5;border-radius:8px;padding:12px;text-align:left;">
                <div style="font-weight:bold;color:#5B3DF5;margin-bottom:4px;">🌟 Recovery Package Lengkap</div>
                <div style="font-size:11px;color:#888;margin-bottom:6px;">+30 Stamina + +25 Mental + Moral Fans +5</div>
                <div style="font-size:11px;color:#C9971F;margin-bottom:8px;">Biaya: Rp 65.000.000 <span style="color:#00B37E;">(Hemat 10 Jt!)</span></div>
                <button class="modal-btn" style="width:100%;padding:8px;font-size:11px;background:#5B3DF5;color:#fff;font-weight:bold;"
                    onclick="tutupModal();recoverySemua();">Ambil Package Lengkap</button>
            </div>
        </div>`, "#2563EB");
};

// ==========================================
// [K] RENDER UI
// ==========================================
function renderFanbaseUI() {
    let elJ = document.getElementById("txtFanbaseJumlah");
    if (elJ) elJ.innerText = fanbase.jumlah + "rb";

    let elM = document.getElementById("txtMoralFans");
    if (elM) elM.innerText = Math.floor(fanbase.moral) + "%";

    let barM = document.getElementById("barMoralFans");
    if (barM) {
        barM.style.width = fanbase.moral + "%";
        barM.style.background = fanbase.moral >= 70 ? "#00B37E" : fanbase.moral >= 40 ? "#E8720C" : "#E5484D";
    }

    let elS = document.getElementById("txtStatusFans");
    let dotS = document.getElementById("dotStatusFans");
    let boxS = document.getElementById("boxStatusFans");
    if (elS) {
        let map = {
            "MENDUKUNG": { teks: "Mendukung Penuh", warna: "#00B37E", bg: "rgba(0,179,126,0.10)",  border: "rgba(0,179,126,0.25)" },
            "KHAWATIR":  { teks: "Mulai Khawatir",  warna: "#E8720C", bg: "rgba(232,114,12,0.10)", border: "rgba(232,114,12,0.25)" },
            "KRITIS":    { teks: "Kritis & Marah",  warna: "#E8720C", bg: "rgba(232,114,12,0.10)", border: "rgba(232,114,12,0.25)" },
            "KRISIS":    { teks: "KRISIS TOTAL",     warna: "#E5484D", bg: "rgba(229,72,77,0.10)",  border: "rgba(229,72,77,0.25)" }
        };
        let s = map[fanbase.statusKritik] || map["MENDUKUNG"];
        elS.innerText    = s.teks;
        elS.style.color  = s.warna;
        if (dotS) dotS.style.background = s.warna;
        if (boxS) {
            boxS.style.background  = s.bg;
            boxS.style.borderColor = s.border;
        }
    }

    let elMerch = document.getElementById("txtMerchandiseAktif");
    if (elMerch) elMerch.innerText = fanbase.merchandise.filter(m => m.aktif).length + " item aktif";

    let elRev = document.getElementById("txtRevenueMerchandise");
    if (elRev) elRev.innerText = "Rp " + fanbase.pendapatanMerchandise.toLocaleString("id-ID");

    renderMentalStaminaUI();
}

function renderMentalStaminaUI() {
    // Delegasi ke renderer utama (ui.js) supaya markup & style selalu konsisten,
    // sebelumnya fungsi ini nulis HTML versi lama sendiri (class mstam-row) yang
    // nimpa hasil render dari ui.js setiap kali renderFanbaseUI() jalan.
    if (typeof renderMentalStamina === "function") renderMentalStamina();
}

// ==========================================
// [L] LAYAR FANBASE
// ==========================================
window.bukaLayarFanbase = function() {
    bukaSubLayar("layarFanbase");
    renderLayarFanbase();
};

function renderLayarFanbase() {
    let container = document.getElementById("listMerchandiseDiJual");
    if (!container) return;

    if (fanbase.merchandise.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:#666;margin-top:20px;">Belum ada merchandise. Tambahkan lewat tombol + di bawah.</div>`;
    } else {
        container.innerHTML = fanbase.merchandise.map(m => {
            let item = FANBASE_CONFIG.merkPerItem[m.tipe];
            let est  = hitungEstimasiMerchandise(m.tipe);
            return `
            <div style="background:#F1F3F8;border:1px solid #E9ECF2;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:bold;color:#12151C;margin-bottom:3px;">${item.nama}</div>
                    <div style="font-size:10px;color:#888;">Aktif sejak ${m.mingguAktif} minggu lalu</div>
                    <div style="font-size:11px;color:#00B37E;margin-top:2px;">Est. +Rp ${est.toLocaleString("id-ID")}/minggu</div>
                </div>
                <div style="font-size:20px;">${m.aktif ? "✅" : "⏸️"}</div>
            </div>`;
        }).join("");
    }

    let elFB  = document.getElementById("statFanbaseBesar");
    let elMD  = document.getElementById("statMoralFansDetail");
    let elTMR = document.getElementById("statTotalMerchRevenue");
    let elSK  = document.getElementById("statStatusKritik");
    if (elFB)  elFB.innerText  = fanbase.jumlah + "rb orang";
    if (elMD)  elMD.innerText  = Math.floor(fanbase.moral) + "/100";
    if (elTMR) elTMR.innerText = "Rp " + fanbase.pendapatanMerchandise.toLocaleString("id-ID");
    if (elSK)  elSK.innerText  = fanbase.statusKritik;
}

// ==========================================
// [M] SAVE & LOAD
// ==========================================
function saveFanbaseData() {
    return { fanbase };
}

function loadFanbaseData(data) {
    // [FIX] Root cause "fanbase jadi 0 abis save+lanjut": script.js nyimpen
    // objek `fanbase` LANGSUNG (gak dibungkus), tapi fungsi ini sebelumnya
    // expect bentuk terbungkus {fanbase: {...}} (match sama saveFanbaseData()
    // di file ini, yang ternyata gak pernah dipake sama script.js). Karena
    // `data.fanbase` selalu undefined, Object.assign gak pernah kepanggil,
    // dan fanbase balik ke nilai default/awal tiap kali abis load save.
    // Sekarang terima dua-duanya (data terbungkus ATAU data mentah) biar aman
    // buat kedua kemungkinan bentuk.
    let fanbaseSumber = (data && data.fanbase) ? data.fanbase : data;
    if (fanbaseSumber) Object.assign(fanbase, fanbaseSumber);
    renderFanbaseUI();
}

// ==========================================
// [N] WINDOW HOOKS — Dipanggil dari script.js
// Semua hook di bawah mengarah ke fungsi asli di file ini.
// window.hookFanbasePascaMatch DI-WRAP ULANG oleh
// merchandise_system_v3_patch.js (load setelah file ini) untuk nambah
// tracking merchStreakMenang -- jadi referensi window.hookFanbasePascaMatch
// akan mengarah ke versi yang sudah di-wrap, bukan fungsi mentah di sini.
// ==========================================
window.hookInisialFanbase    = inisialFanbase;
window.hookFanbasePascaMatch = prosesFanbasePascaMatch;
window.hookFanbaseEventBesar = prosesFanbaseEventBesar;
window.hookFanbasePerMinggu  = prosesFanbasePerMinggu;
window.saveFanbase           = saveFanbaseData;
window.loadFanbase           = loadFanbaseData;
window.getFanbaseModifier    = getModifierMentalStamina;

console.log("[FANBASE.JS v2.0 UNIFIED] ✅ Sistem Fanbase inti (jumlah/moral/mental/stamina) berhasil dimuat dari patches_postgame.js. Catatan: merchandise_system_v3_patch.js tetap file terpisah yang extend sistem ini (revenue mingguan, batch produksi, Limited Edition).");


/* ==========================================================
   REDESIGN UX — NAVIGATION LAYER
   File ini TIDAK menyentuh logika gameplay/simulasi/database.
   Isinya cuma: routing antar layar, state bottom-nav, dan
   sinkronisasi tampilan dashboard (Reputasi & Fanbase).
   Dimuat PALING TERAKHIR supaya bisa membungkus fungsi yang
   sudah ada tanpa mengubah file aslinya.
   ========================================================== */

(function () {
    "use strict";

    // ---------------------------------------------------------
    // 1. PETA: layar -> tab bottom-nav mana yang aktif
    // ---------------------------------------------------------
    var PETA_NAV = {
        layarDashboard: "dashboard",
        layarRoster: "tim",
        layarTransfer: "transfer",
        layarTrialPlayer: "transfer",
        layarHubOrganisasi: "organisasi",
        layarKeuanganSponsor: "organisasi",
        layarFanbase: "organisasi",
        layarFasilitas: "organisasi",
        layarHubLainnya: "lainnya",
        layarEmail: "lainnya",
        layarJadwalHasil: "lainnya",
        layarRiwayat: "lainnya",
        layarDuniaEsports: "lainnya",
        layarAkuisisiMerger: "lainnya",
        layarMSC: "lainnya",
        layarMSeries: "lainnya",
        layarKlasemenMPLID: "lainnya",
        layarKlasemenMPLPH: "lainnya",
        layarKlasemenMPLMY: "lainnya",
        layarKlasemenMPLSG: "lainnya",
        layarKlasemenMDLID: "lainnya",
        layarKlasemenMDLPH: "lainnya",
        layarKlasemenLEN: "lainnya",
        layarKlasemenMALMY: "lainnya",
        // [MSC x EWC 2026 - FASE 3] 9 region baru
        layarKlasemenKH: "lainnya",
        layarKlasemenMM: "lainnya",
        layarKlasemenMENA: "lainnya",
        layarKlasemenTR: "lainnya",
        layarKlasemenEECA: "lainnya",
        layarKlasemenEA: "lainnya",
        layarKlasemenAM: "lainnya",
        layarKlasemenIN: "lainnya",
        layarKlasemenWEU: "lainnya",
        layarKlaimAfiliasi: "lainnya",
        layarDetailTim: "lainnya"
    };

    window.__hubAsal = null; // hub mana yang harus dituju saat tombol "Kembali" ditekan

    function getEl(id) { return document.getElementById(id); }

    function setNavAktif(key) {
        var items = document.querySelectorAll("#globalBottomNav .gnav-item");
        items.forEach(function (el) {
            if (el.getAttribute("data-target") === key) el.classList.add("aktif");
            else el.classList.remove("aktif");
        });
    }

    function tampilkanGlobalNav() {
        var nav = getEl("globalBottomNav");
        if (nav) nav.classList.remove("sembunyi");
    }

    // ---------------------------------------------------------
    // 2. BUNGKUS bukaSubLayar — tambah sinkronisasi nav + render
    //    untuk layar hasil pemindahan (Keuangan & Jadwal)
    // ---------------------------------------------------------
    var aslinyaBukaSubLayar = window.bukaSubLayar;
    window.bukaSubLayar = function (idLayar) {
        if (typeof aslinyaBukaSubLayar === "function") aslinyaBukaSubLayar(idLayar);

        if (idLayar === "layarKeuanganSponsor") {
            if (typeof renderKas === "function") renderKas();
            if (typeof window.renderSponsorUI === "function") window.renderSponsorUI();
        }
        if (idLayar === "layarJadwalHasil") {
            if (typeof renderLogSkenaMpl === "function") renderLogSkenaMpl();
        }

        if (PETA_NAV[idLayar]) setNavAktif(PETA_NAV[idLayar]);

        // [UPDATE] Global bottom nav SEKARANG cuma boleh nongol di Dashboard.
        // Begitu masuk sub-layar apapun (Tim/Transfer/Organisasi/Lainnya dan
        // semua turunannya termasuk layarDetailTim), nav-nya disembunyiin.
        // Buat balik nampilin nav lagi, user WAJIB pencet "Kembali" dulu
        // (lewat tutupSubLayar / navKeDashboard) sampai balik ke Dashboard.
        var navGlobal = getEl("globalBottomNav");
        if (navGlobal) navGlobal.classList.add("sembunyi");
    };

    // ---------------------------------------------------------
    // 3. BUNGKUS tutupSubLayar — kalau dibuka dari hub, balik ke
    //    hub asal. Kalau bukan, balik ke Dashboard seperti biasa.
    // ---------------------------------------------------------
    var aslinyaTutupSubLayar = window.tutupSubLayar;
    window.tutupSubLayar = function () {
        if (window.__hubAsal) {
            var tujuan = window.__hubAsal;
            window.__hubAsal = null;
            window.bukaSubLayar(tujuan);
            return;
        }
        if (typeof aslinyaTutupSubLayar === "function") aslinyaTutupSubLayar();
        setNavAktif("dashboard");
        // [FIX] Jalur ini gak lewat bukaSubLayar() sama sekali, jadi kalau
        // sebelumnya lagi di layarDetailTim (nav-nya disembunyiin), harus
        // ditampilin manual lagi di sini -- kalau enggak, nav bakal ilang
        // permanen abis pencet "Kembali" dari layar itu.
        var navGlobal = getEl("globalBottomNav");
        if (navGlobal) navGlobal.classList.remove("sembunyi");
    };

    // ---------------------------------------------------------
    // 4. Helper dipanggil dari kartu di layar Hub
    // ---------------------------------------------------------
    window.bukaDariHub = function (idLayarTujuan, idHubAsal) {
        window.__hubAsal = idHubAsal || null;
        if (idLayarTujuan) window.bukaSubLayar(idLayarTujuan);
    };

    // ---------------------------------------------------------
    // 5. Aksi tombol Global Bottom Navigation
    // ---------------------------------------------------------
    window.navKeDashboard = function () {
        window.__hubAsal = null;
        if (typeof aslinyaTutupSubLayar === "function") aslinyaTutupSubLayar();
        setNavAktif("dashboard");
        // [UPDATE] Fungsi ini manggil aslinyaTutupSubLayar langsung (bukan
        // tutupSubLayar yang udah dibungkus), jadi harus nampilin nav lagi
        // di sini juga -- kalau enggak, nav bakal ilang permanen abis
        // tombol "KE MENU UTAMA" dipencet dari dalam sub-layar.
        var navGlobal = getEl("globalBottomNav");
        if (navGlobal) navGlobal.classList.remove("sembunyi");
    };
    window.navKeTim = function () {
        window.__hubAsal = null;
        window.bukaSubLayar("layarRoster");
    };
    window.navKeTransfer = function () {
        window.__hubAsal = null;
        window.bukaSubLayar("layarTransfer");
    };
    window.navKeOrganisasi = function () {
        window.__hubAsal = null;
        window.bukaSubLayar("layarHubOrganisasi");
    };
    window.navKeLainnya = function () {
        window.__hubAsal = null;
        window.bukaSubLayar("layarHubLainnya");
    };

    // ---------------------------------------------------------
    // 6. Tampilkan Global Nav begitu karir dimulai / save dimuat
    // ---------------------------------------------------------
    ["pilihTimDanMulai", "loadGame"].forEach(function (namaFn) {
        var aslinya = window[namaFn];
        if (typeof aslinya !== "function") return;
        window[namaFn] = function () {
            var hasil = aslinya.apply(this, arguments);
            tampilkanGlobalNav();
            setNavAktif("dashboard");
            return hasil;
        };
    });

    // ---------------------------------------------------------
    // 7. Sinkronisasi quick-stat Reputasi & Fanbase di Dashboard
    // ---------------------------------------------------------
    var aslinyaUpdateDashboard = window.updateDashboard;
    window.updateDashboard = function () {
        var hasil;
        if (typeof aslinyaUpdateDashboard === "function") hasil = aslinyaUpdateDashboard.apply(this, arguments);

        var elRep = getEl("dashReputasiQS");
        if (elRep && typeof reputasiTim !== "undefined") {
            elRep.innerHTML = reputasiTim + ' <span class="unit">Poin</span>';
        }
        var elFan = getEl("dashFanbaseQS");
        if (elFan && typeof fanbase !== "undefined" && fanbase && typeof fanbase.jumlah !== "undefined") {
            elFan.innerHTML = fanbase.jumlah + '<span class="unit">rb</span>';
        }

        return hasil;
    };
    // ---------------------------------------------------------
    // 8. Sederhanakan gantiTabManajemen — layar Roster sekarang
    //    cuma berisi konten "Tim" (Keuangan & Jadwal sudah pindah
    //    ke layar terpisah lewat hub Organisasi/Lainnya), jadi
    //    tab-switch lama (yang mencari elemen yang sudah tidak
    //    ada) diganti versi aman ini.
    // ---------------------------------------------------------
    window.gantiTabManajemen = function () {
        var judul = getEl("judulManajemen");
        if (judul) judul.innerHTML = '<i class="fa-solid fa-users"></i> ROSTER TIM';
    };
})();
