// ==========================================
// MLBB PRO CIRCUIT MANAGER — SCRIPT.JS
// Versi: 2.0 (Refactored & Optimized)
// ==========================================
// getEl defined in ui.js

// ==========================================
// GLOBAL STATE & VARIABEL UTAMA
// =========================================

// 1. STATE WAKTU & MUSIM
let musimKe = 1;
let mingguKe = 1;
let indeksHari = 0;
let waktuJeda = 0;
let hariJeda = 0;      // Pengganti waktuJeda — satuan HARI (1 klik = 1 hari)
let midSeasonHari = 0;
let hariPramusim = 14;
const totalMinggu = 14;
let kalenderGame = new Date(2026, 0, 1); // 1 Januari 2026 (Kamis) — overhaul kalender pasti
// [FIX] Sebelumnya turnamen M-Series SELALU dilabelin "M7" hardcode, gak
// peduli ini turnamen M-Series ke berapa buat karir player -- makanya
// pemain baru langsung disuguhin "M7" padahal ini turnamen M-Series
// PERTAMA mereka. Sekarang dihitung dinamis: mulai dari M1, naik 1 tiap
// kali turnamen M-Series (Musim Genap) berjalan.
let edisiMSeries = 0;
let statusGame = "PRAMUSIM";
let timPlayer = "TIM";
let reputasiTim = 50;

// 2. STATE KEUANGAN & MANAJEMEN
let kasTim = 1000000000; // akan ditimpa oleh kasAwalRandomPerLiga() saat pilih tim (Fase 4)
let levelGH = 1;
let ligaPlayer = "MPL"; // "MPL" | "MDL" | "MAL" | "LEN" — diset saat pilih tim (Fase 4)
let regionPlayer = "ID"; // "ID" | "PH" | "MY" | "SG" — diset saat pilih tim (Fase 4)
let ligaTerpilihSementara = "MPL"; // dipakai sementara antara langkah 1 & 2 pemilihan tim
let sponsorDiambil = false;
window.sponsorTim = {
    utama: null,   // Slot Dada (Sponsor besar, Tier S/A)
    minor1: null,  // Slot Lengan 1 (Sponsor kecil, Tier B/C)
    minor2: null   // Slot Lengan 2 (Sponsor kecil, Tier B/C)
};

let penawaranSponsor = [];
let riwayatKas = [];

// 3. STATE TRANSFER & NEGOSIASI
let transferBuka = true;
let pendingJualIndex = -1;
let antrianTransfer = [];
let targetPelatihNego = null;
let indexPelatihNego = -1;
let dataNego = {
    tipe: "",
    index: -1,
    pemain: null,
    demandGaji: 0,
    demandDurasi: 0
};

// 4. STATE TURNAMEN & JADWAL
let counterMatchKita = 0;
let bankJadwalMaster = [];
let jadwalMatch = [];
let jadwalTimPlayer = [];
let bankRiwayatJuara = [];
let playoffFase = 0;
let pData = {};
window.pData = pData;
let mscFase = 0;
let mscData = {};
let mSeriesFase = 0;
let mSeriesData = {};

// 5. DATABASE BERITA & EMAIL
let inboxEmail = [];
let emailBelumDibaca = 0;
let bankBerita = [
    {
        tanggal: "Pra-Musim",
        teks: "Selamat datang di <span>Moba Manager</span>! Bangun tim impianmu."
    }
];

// ==========================================
// DATABASE KONSTANTA (Fasilitas, dll)
// ==========================================
const databaseGH = [
    {
        level: 1,
        nama: "🏠 RUKO SEDERHANA",
        sewa: 25000000,
        biayaUpgrade: 0,
        limitRoster: 6,
        limitStaff: 1,
        desc: "Fasilitas pas-pasan. Maksimal 6 pemain & cuma bisa sewa Pelatih Kepala."
    },
    {
        level: 2,
        nama: "🏡 RUMAH MEWAH",
        sewa: 75000000,
        biayaUpgrade: 300000000,
        limitRoster: 8,
        limitStaff: 2,
        desc: "Fasilitas mumpuni. Maksimal 8 pemain & membuka slot Asisten Pelatih."
    },
    {
        level: 3,
        nama: "🏢 GH ESPORTS PREMIUM",
        sewa: 150000000,
        biayaUpgrade: 800000000,
        limitRoster: 10,
        limitStaff: 3,
        desc: "Fasilitas sultan standar global! Maksimal 10 pemain & full 3 staff kepelatihan."
    }
];

// KAMUS DATA REAL (Dengan Tambahan Database Reputasi)
const dataReal = {
    // --- MPL ID ---
    EVOS: {
        pelatih: "Vyn",
        asisten: "Rid1",
        roster: ["Kyy", "Albertt", "Pheww", "Erlan", "Luke"],
        reputasi: 75
    },
    ONIC: {
        pelatih: "CW",
        asisten: "Yeb",
        roster: ["Kiboy", "Kairi", "S A N Z", "Kelra", "Lutpii"],
        reputasi: 88
    },
    RRQ: {
        pelatih: "Khezcute",
        asisten: "Yachya",
        roster: ["Idok", "Super Kenn", "Yehezkiel", "Super Toyy", "Super Dan"],
        reputasi: 86
    },
    TLID: {
        pelatih: "Honjaw",
        asisten: "Pahlevi",
        roster: ["Lyoni", "Kevinn", "Dricel", "Kyou", "Aran"],
        reputasi: 82
    },
    BTR: {
        pelatih: "Theonael",
        asisten: "K Dot",
        roster: ["Finn", "Nnael", "Moreno", "EMANN", "Shogun"],
        reputasi: 78
    },
    GEEK: {
        pelatih: "MxMoore",
        asisten: "Vivy",
        roster: ["Baloyskie", "Nazara", "A B O Y", "KennzyySkie", "MarceL"],
        reputasi: 70
    },
    AE: {
        pelatih: "Xepher",
        asisten: "Styx",
        roster: ["Alekk", "Yazukee", "Hijumee", "Arfy", "Nino"],
        reputasi: 72
    },
    DEWA: {
        pelatih: "Right",
        asisten: "Ily",
        roster: ["Muezzaa", "Dolynn", "Octa", "Maybeee", "QINN"],
        reputasi: 65
    },
    NAVI: {
        pelatih: "Ynot",
        asisten: "Jackleee",
        roster: ["APHRO", "Andoryuuu", "xMagic", "Xyve", "Karss"],
        reputasi: 60
    },

    // --- MPL PH ---
    "AP BREN": {
        pelatih: "Giee",
        asisten: "Cons",
        roster: ["xNova", "Jamespangks", "Aqua", "Shizou", "Kielvj"],
        reputasi: 90
    },
    "TLPH": {
        pelatih: "Aeon",
        asisten: "SN4P",
        roster: ["Jaypee", "KarlTzy", "Sanji", "Teddy", "Sanford"],
        reputasi: 88
    },
    "Aurora Gaming": {
        pelatih: "Master the Basics",
        asisten: "Dexter",
        roster: ["Renejay", "Demonkite", "Yue", "OHEB", "Edward"],
        reputasi: 82
    },
    "ONIC PH": {
        pelatih: "Ynot",
        asisten: "E2MAX",
        roster: ["Escalera", "K1NGKONG", "Super Frince", "Kelra", "Jem"],
        reputasi: 84
    },
    "Smart Omega": {
        pelatih: "Ron",
        asisten: "Navi",
        roster: ["Ch4knu", "Haze", "Jowm", "Ribo", "Exort"],
        reputasi: 75
    },

    // --- MPL MY ---
    "Selangor Red Giants": {
        pelatih: "Arcadia",
        asisten: "OzoraVuki",
        roster: ["YumS", "Sekys", "Stormie", "Innocent", "GoJes"],
        reputasi: 85
    },
    "Team Vamos": {
        pelatih: "Pabz",
        asisten: "Kuci",
        roster: ["Xorn", "Chibi", "Warlord", "Neto", "Sepat"],
        reputasi: 80
    },

    // --- MPL Turkiye ---
    "Aurora Turkiye": {
        pelatih: "Midnight",
        // asisten belum ada datanya -- dibiarin kosong, sistem otomatis
        // generate asisten AI biasa (lihat cekDanIsi() di generateRosterAIAwal).
        roster: ["Pagu", "Tienzy", "Rosa", "Sigibum", "Lunar"], // urutan: Roamer, Jungler, Midlaner, Goldlaner, EXP Laner
        reputasi: 82
    }
};

// ==========================================
// DATABASE BENDERA MANUAL — PEMAIN REAL
// ==========================================
// Kamus KHUSUS buat nentuin negara/bendera pemain REAL (namanya ada di
// roster `dataReal` di atas), biar TIDAK di-roll random lagi sama ui.js
// (lihat fungsi tampilkanProfil, cek `daftarBendera`).
//
// CARA EDIT MANUAL: tinggal ubah value-nya, formatnya:
//   "NamaPemain": "🇮🇩 Indonesia"
// Kalau nama pemain belum ada di list ini, sistem pakai bendera DEFAULT
// sesuai region asal tim (lihat DEFAULT_BENDERA_REGION di bawah), jadi
// tetap konsisten & tidak acak lagi walau belum sempat lu isi manual.
const DATABASE_BENDERA_PEMAIN_REAL = {
    // --- MPL ID (EVOS) ---
    "Kyy": "🇮🇩 Indonesia", "Albertt": "🇮🇩 Indonesia", "Pheww": "🇮🇩 Indonesia",
    "Erlan": "🇮🇩 Indonesia", "Luke": "🇮🇩 Indonesia",

    // --- MPL ID (ONIC) ---
    "Kiboy": "🇵🇭 Filipina", "Kairi": "🇮🇩 Indonesia", "S A N Z": "🇮🇩 Indonesia",
    "Kelra": "🇮🇩 Indonesia", "Lutpii": "🇮🇩 Indonesia",

    // --- MPL ID (RRQ) ---
    "Idok": "🇮🇩 Indonesia", "Super Kenn": "🇮🇩 Indonesia", "Yehezkiel": "🇮🇩 Indonesia",
    "Super Toyy": "🇮🇩 Indonesia", "Super Dan": "🇮🇩 Indonesia",

    // --- MPL ID (TLID) ---
    "Lyoni": "🇮🇩 Indonesia", "Kevinn": "🇮🇩 Indonesia", "Dricel": "🇮🇩 Indonesia",
    "Kyou": "🇮🇩 Indonesia", "Aran": "🇮🇩 Indonesia",

    // --- MPL ID (BTR) ---
    "Finn": "🇮🇩 Indonesia", "Nnael": "🇮🇩 Indonesia", "Moreno": "🇮🇩 Indonesia",
    "EMANN": "🇮🇩 Indonesia", "Shogun": "🇮🇩 Indonesia",

    // --- MPL ID (GEEK) ---
    "Baloyskie": "🇵🇭 Filipina", "Nazara": "🇮🇩 Indonesia", "A B O Y": "🇮🇩 Indonesia",
    "KennzyySkie": "🇵🇭 Filipina", "MarceL": "🇮🇩 Indonesia",

    // --- MPL ID (AE) ---
    "Alekk": "🇮🇩 Indonesia", "Yazukee": "🇮🇩 Indonesia", "Hijumee": "🇮🇩 Indonesia",
    "Arfy": "🇮🇩 Indonesia", "Nino": "🇮🇩 Indonesia",

    // --- MPL ID (DEWA) ---
    "Muezzaa": "🇮🇩 Indonesia", "Dolynn": "🇮🇩 Indonesia", "Octa": "🇮🇩 Indonesia",
    "Maybeee": "🇮🇩 Indonesia", "QINN": "🇮🇩 Indonesia",

    // --- MPL ID (NAVI) ---
    "APHRO": "🇮🇩 Indonesia", "Andoryuuu": "🇮🇩 Indonesia", "xMagic": "🇮🇩 Indonesia",
    "Xyve": "🇮🇩 Indonesia", "Karss": "🇮🇩 Indonesia",

    // --- MPL PH (AP BREN) ---
    "xNova": "🇵🇭 Filipina", "Jamespangks": "🇵🇭 Filipina", "Aqua": "🇵🇭 Filipina",
    "Shizou": "🇵🇭 Filipina", "Kielvj": "🇵🇭 Filipina",

    // --- MPL PH (TLPH) ---
    "Jaypee": "🇵🇭 Filipina", "KarlTzy": "🇵🇭 Filipina", "Sanji": "🇵🇭 Filipina",
    "Teddy": "🇵🇭 Filipina", "Sanford": "🇵🇭 Filipina",

    // --- MPL PH (Aurora Gaming) ---
    "Renejay": "🇵🇭 Filipina", "Demonkite": "🇵🇭 Filipina", "Yue": "🇵🇭 Filipina",
    "OHEB": "🇵🇭 Filipina", "Edward": "🇵🇭 Filipina",

    // --- MPL PH (ONIC PH) ---
    "Escalera": "🇵🇭 Filipina", "K1NGKONG": "🇵🇭 Filipina", "Super Frince": "🇵🇭 Filipina",
    "Jem": "🇵🇭 Filipina",

    // --- MPL PH (Smart Omega) ---
    "Ch4knu": "🇵🇭 Filipina", "Haze": "🇵🇭 Filipina", "Jowm": "🇵🇭 Filipina",
    "Ribo": "🇵🇭 Filipina", "Exort": "🇵🇭 Filipina",

    // --- MPL MY (Selangor Red Giants) ---
    "YumS": "🇲🇾 Malaysia", "Sekys": "🇲🇾 Malaysia", "Stormie": "🇲🇾 Malaysia",
    "Innocent": "🇲🇾 Malaysia", "GoJes": "🇲🇾 Malaysia",

    // --- MPL MY (Team Vamos) ---
    "Xorn": "🇲🇾 Malaysia", "Chibi": "🇲🇾 Malaysia", "Warlord": "🇲🇾 Malaysia",
    "Neto": "🇲🇾 Malaysia", "Sepat": "🇲🇾 Malaysia"
};
window.DATABASE_BENDERA_PEMAIN_REAL = DATABASE_BENDERA_PEMAIN_REAL;

// Region asal tiap tim yang punya entri di dataReal (dipakai buat fallback
// bendera default, karena di titik generateRosterAIAwal jalan, properti
// tim._region belum tentu ke-attach ke objek tim).
const TIM_REGION_MAP = {
    EVOS: "ID", ONIC: "ID", RRQ: "ID", TLID: "ID", BTR: "ID",
    GEEK: "ID", AE: "ID", DEWA: "ID", NAVI: "ID",
    "AP BREN": "PH", "TLPH": "PH", "Aurora Gaming": "PH",
    "ONIC PH": "PH", "Smart Omega": "PH",
    "Selangor Red Giants": "MY", "Team Vamos": "MY",
    "Aurora Turkiye": "TR"
};
window.TIM_REGION_MAP = TIM_REGION_MAP;

// Bendera default per region kalau nama pemain belum diinput manual
// di DATABASE_BENDERA_PEMAIN_REAL (fallback aman, BUKAN random lagi).
const DEFAULT_BENDERA_REGION = {
    ID: "🇮🇩 Indonesia", PH: "🇵🇭 Filipina", MY: "🇲🇾 Malaysia", SG: "🇸🇬 Singapura",
    KH: "🇰🇭 Kamboja", MM: "🇲🇲 Myanmar", MENA: "🌍 MENA", TR: "🇹🇷 Turkiye",
    EECA: "🌍 EECA", EA: "🌏 East Asia", AM: "🌎 Americas", IN: "🇮🇳 India",
    WEU: "🌍 Western Europe"
};
window.DEFAULT_BENDERA_REGION = DEFAULT_BENDERA_REGION;

// Helper: ambil bendera pemain real.
// Prioritas: 1) manual di DATABASE_BENDERA_PEMAIN_REAL, 2) default region tim.
function ambilBenderaPemainReal(namaPemain, kodeRegion) {
    if (DATABASE_BENDERA_PEMAIN_REAL[namaPemain]) {
        return DATABASE_BENDERA_PEMAIN_REAL[namaPemain];
    }
    return DEFAULT_BENDERA_REGION[kodeRegion] || "🌐 Global";
}
window.ambilBenderaPemainReal = ambilBenderaPemainReal;

// ==========================================
// BENDERA PEMAIN AKADEMI (fiktif/hasil scouting)
// ==========================================
// Region satu-negara: pemain akademi PASTI dapet bendera negara itu.
// Region multi-negara (MENA/EECA/EA/AM/WEU): pemain akademi dapet bendera
// ACAK dari daftar negara di region tersebut.
const POOL_BENDERA_AKADEMI_REGION = {
    ID:   ["🇮🇩 Indonesia"],
    PH:   ["🇵🇭 Filipina"],
    MY:   ["🇲🇾 Malaysia"],
    SG:   ["🇸🇬 Singapura"],
    TR:   ["🇹🇷 Turkiye"],
    IN:   ["🇮🇳 India"],
    KH:   ["🇰🇭 Kamboja"],
    MM:   ["🇲🇲 Myanmar"],
    MENA: [
        "🇸🇦 Arab Saudi", "🇦🇪 Uni Emirat Arab", "🇪🇬 Mesir", "🇮🇶 Irak",
        "🇯🇴 Yordania", "🇲🇦 Maroko", "🇩🇿 Aljazair", "🇹🇳 Tunisia"
    ],
    EECA: [
        "🇷🇺 Russia", "🇰🇿 Kazakhstan", "🇺🇿 Uzbekistan", "🇦🇿 Azerbaijan",
        "🇺🇦 Ukraina", "🇧🇾 Belarus", "🇬🇪 Georgia", "🇦🇲 Armenia"
    ],
    EA: [
        "🇨🇳 China", "🇯🇵 Jepang", "🇰🇷 Korea Selatan", "🇹🇼 Taiwan",
        "🇭🇰 Hongkong", "🇲🇴 Makau", "🇲🇳 Mongolia", "🇰🇵 Korea Utara"
    ],
    AM: [
        "🇧🇷 Brazil", "🇦🇷 Argentina", "🇲🇽 Meksiko", "🇺🇸 Amerika Serikat",
        "🇨🇦 Kanada", "🇨🇴 Kolombia", "🇵🇪 Peru", "🇨🇱 Chile"
    ],
    WEU: [
        "🇫🇷 Perancis", "🇩🇪 Jerman", "🇪🇸 Spanyol", "🇮🇹 Italia",
        "🇬🇧 Inggris", "🇳🇱 Belanda", "🇵🇹 Portugal", "🇨🇭 Swiss"
    ]
};
window.POOL_BENDERA_AKADEMI_REGION = POOL_BENDERA_AKADEMI_REGION;

// Ambil bendera buat pemain akademi/fiktif berdasarkan kode region tim
// (tim.region, atau regionPlayer buat tim milik player sendiri).
function benderaAkademiUntukRegion(kodeRegion) {
    let pool = POOL_BENDERA_AKADEMI_REGION[kodeRegion];
    if (!pool || pool.length === 0) return "🌐 Global";
    return pool[Math.floor(Math.random() * pool.length)];
}
window.benderaAkademiUntukRegion = benderaAkademiUntukRegion;

// ==========================================
// FASE 4 — SISTEM PEMILIHAN LIGA/TIM & KAS AWAL
// ==========================================

// Daftar liga yang bisa dipilih player, dengan deskripsi singkat buat UI
const DAFTAR_LIGA_PILIHAN = [
    {
        kode: "LEN",
        nama: "Liga Esports Nasional",
        deskripsi: "Mulai dari paling bawah. Tantangan terbesar, kas paling minim.",
        rangeKas: [150000000, 250000000]
    },
    {
        kode: "MDL",
        nama: "MDL / MAL (Liga Pengembangan)",
        deskripsi: "Level menengah. Tim Independen/Challenger punya kas mandiri, tim Afiliasi dikelola induk MPL.",
        rangeKas: [600000000, 1000000000]
    },
    {
        kode: "MPL",
        nama: "MPL (Liga Tertinggi)",
        deskripsi: "Mulai dari puncak. Kas besar, tapi ekspektasi & tekanan juga besar.",
        rangeKas: [2500000000, 4000000000]
    }
];

// Generate kas awal random di dalam range liga yang ditentukan
function kasAwalRandomPerLiga(kodeLiga) {
    let liga = DAFTAR_LIGA_PILIHAN.find(l => l.kode === kodeLiga);
    if (!liga) return 1000000000; // fallback aman
    let [min, max] = liga.rangeKas;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ambil semua tim AI dari satu liga (lintas region), dengan info region disisipkan
function ambilTimUntukLiga(kodeLiga) {
    let hasil = [];

    if (kodeLiga === "MPL") {
        hasil.push(...daftarTim.map(t => ({ ...t, _region: "ID", _bendera: "🇮🇩" })));
        hasil.push(...daftarTimPH.map(t => ({ ...t, _region: "PH", _bendera: "🇵🇭" })));
        hasil.push(...daftarTimMY.map(t => ({ ...t, _region: "MY", _bendera: "🇲🇾" })));
        hasil.push(...daftarTimSG.map(t => ({ ...t, _region: "SG", _bendera: "🇸🇬" })));
        // [MSC x EWC 2026 - FASE 3] 9 region baru single-tier -- masuk grup
        // "MPL (Liga Tertinggi)" yang sama, karena statusnya setara (top-tier,
        // gak ada tier-2 di bawahnya).
        if (typeof daftarTimKH !== "undefined") hasil.push(...daftarTimKH.map(t => ({ ...t, _region: "KH", _bendera: "🇰🇭" })));
        if (typeof daftarTimMM !== "undefined") hasil.push(...daftarTimMM.map(t => ({ ...t, _region: "MM", _bendera: "🇲🇲" })));
        if (typeof daftarTimMENA !== "undefined") hasil.push(...daftarTimMENA.map(t => ({ ...t, _region: "MENA", _bendera: "🌍" })));
        if (typeof daftarTimTR !== "undefined") hasil.push(...daftarTimTR.map(t => ({ ...t, _region: "TR", _bendera: "🇹🇷" })));
        if (typeof daftarTimEECA !== "undefined") hasil.push(...daftarTimEECA.map(t => ({ ...t, _region: "EECA", _bendera: "🌍" })));
        if (typeof daftarTimEA !== "undefined") hasil.push(...daftarTimEA.map(t => ({ ...t, _region: "EA", _bendera: "🌏" })));
        if (typeof daftarTimAM !== "undefined") hasil.push(...daftarTimAM.map(t => ({ ...t, _region: "AM", _bendera: "🌎" })));
        if (typeof daftarTimIN !== "undefined") hasil.push(...daftarTimIN.map(t => ({ ...t, _region: "IN", _bendera: "🇮🇳" })));
        if (typeof daftarTimWEU !== "undefined") hasil.push(...daftarTimWEU.map(t => ({ ...t, _region: "WEU", _bendera: "🌍" })));
    } else if (kodeLiga === "MDL") {
        // MDL ID + MDL PH (gabungan), plus MAL MY (2 conference digabung tampilannya saja)
        hasil.push(...daftarTimMDL_ID.map(t => ({ ...t, _region: "ID", _bendera: "🇮🇩" })));
        hasil.push(...daftarTimMDL_PH.map(t => ({ ...t, _region: "PH", _bendera: "🇵🇭" })));
        hasil.push(...daftarTimMAL_Affiliated_MY.map(t => ({ ...t, _region: "MY", _bendera: "🇲🇾" })));
        hasil.push(...daftarTimMAL_Challenger_MY.map(t => ({ ...t, _region: "MY", _bendera: "🇲🇾" })));
    } else if (kodeLiga === "LEN") {
        hasil.push(...daftarTimLEN.map(t => ({ ...t, _region: "ID", _bendera: "🇮🇩" })));
    }

    return hasil;
}

// Cari objek tim asli (bukan copy) di database manapun berdasarkan nama
function cariTimAsliDiDatabase(namaTim) {
    let semuaDb = [
        daftarTim, daftarTimPH, daftarTimMY, daftarTimSG,
        daftarTimMDL_Afiliasi_ID, daftarTimMDL_Independen_ID,
        daftarTimMDL_Afiliasi_PH, daftarTimMDL_Independen_PH,
        daftarTimMAL_Affiliated_MY, daftarTimMAL_Challenger_MY,
        daftarTimLEN
    ];
    // [MSC x EWC 2026 - FASE 1] 9 region baru single-tier
    if (typeof daftarTimKH !== "undefined") semuaDb.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaDb.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaDb.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaDb.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaDb.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaDb.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaDb.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaDb.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaDb.push(daftarTimWEU);

    for (let db of semuaDb) {
        let found = db.find(t => t.nama === namaTim);
        if (found) return found;
    }
    return null;
}

// FUNGSI MENAMBAH EMAIL BARU
function tambahEmail(subjek, pengirim, isiHtml) {
    let tgl =
        statusGame === "PRAMUSIM" ? "Off-Season" : `S${musimKe}-W${mingguKe}`;
    inboxEmail.unshift({
        subjek: subjek,
        pengirim: pengirim,
        tanggal: tgl,
        isi: isiHtml,
        dibaca: false
    });

    emailBelumDibaca++;

    // --- OPTIMASI LEVEL 1: LIMIT INBOX EMAIL ---
    if (inboxEmail.length > 40) {
        let emailDibuang = inboxEmail.pop();
        // Kurangi notif badge merah kalau email yang kehapus itu belum dibaca
        if (!emailDibuang.dibaca && emailBelumDibaca > 0) {
            emailBelumDibaca--;
        }
    }
    // -------------------------------------------

    updateBadgeEmail();
    renderEmail();
}

window.prosesBeliPemainLain = function (namaPemain, namaTim, hargaPemain, dariTrial) {
    if (!apakahTransferTerbuka()) {
        alert("⚠️ Bursa transfer belum dibuka!");
        return;
    }
    // === OVERHAUL KALENDER: Roster Lock per-liga (lapisan tambahan,
    // terpisah dari transferBuka global) ===
    if (typeof timPlayerSedangRosterLock === "function") {
        let statusLock = timPlayerSedangRosterLock();
        if (statusLock.terkunci) {
            alert(pesanRosterLockAktif(statusLock));
            return;
        }
    }
    // [FIX] SEBELUMNYA nyari tim manual cuma di 4 region lama (daftarTim,
    // PH, MY, SG) -- gak nyertain MDL/MAL/LEN atau 9 region baru (MSC x
    // EWC 2026). Kalau pemain trial berasal dari region yang gak ke-cover,
    // `tim` jadi undefined -> crash "reading 'roster'". Sekarang pake
    // cariTimAsliDiDatabase() yang udah nyertain SEMUA 13 region (helper
    // yang sama dipake di banyak tempat lain di proyek ini).
    let tim = cariTimAsliDiDatabase(namaTim);
    if (!tim) {
        bukaModal("Tim Tidak Ditemukan", `Data tim ${namaTim} gak ketemu di database. Transaksi dibatalkan.`, "#E5484D");
        return;
    }
    let p = tim.roster.find(x => x.nama === namaPemain);
    if (!p) {
        bukaModal("Pemain Tidak Ditemukan", `${namaPemain} gak ketemu di roster ${namaTim} (kemungkinan udah pindah tim). Transaksi dibatalkan.`, "#E5484D");
        return;
    }
    // [UPDATE] Pemain inti (top-5 OVR) SEBELUMNYA gak bisa dibeli dengan
    // alasan apapun. Sekarang bisa dibeli, tapi klausul rilisnya dinaikin
    // jauh lebih mahal (3x, bukan 1.8x standar) -- konsisten sama konsep
    // "release clause astronomis" buat pemain bintang di dunia nyata:
    // susah, bukan mustahil. Flag ini dipake buat nentuin multiplier
    // klausul di bawah.
    let pemainIniInti = !!(window.cekPemainIntiAI && window.cekPemainIntiAI(tim, namaPemain));
    dataNego.pemainIniInti = pemainIniInti;

    // [UPDATE] Proteksi "satu-satunya pemain di role ini" DIHAPUS TOTAL --
    // sekarang boleh dibeli. Konsekuensinya udah otomatis ke-handle sama
    // sistem penalti performa yang UDAH ADA di match_engine.js
    // (hitungDraftBonus: role kosong di starter = -1.5 performa), persis
    // analogi pemain out-of-position kayak kasus Sanz/Samuel di ONIC.
    if (p.sudahTransfer) {
        alert(
            `⚠️ ${p.nama} baru saja bergabung dengan ${namaTim} musim ini. Regulasi melarang pemain pindah tim 2x dalam semusim!`
        );
        return;
    }

    dataNego.tipe = "BELI_LAIN";
    dataNego.index = -1;
    dataNego.pemain = p;
    dataNego.namaTimLain = namaTim;

    // AI Minta Uang Transfer minimal harga pasar
    dataNego.demandTransfer = hargaPemain;
    // [NEW] Kalau ini buyout hasil TRIAL, kandidat minta gaji berdasar
    // performa trial-nya (tren + sifat), BUKAN cuma gaji lama flat --
    // sesuai request tester: "gaji yang diminta pemain setelah lolos
    // trial". Buat pembelian normal dari bursa transfer (bukan trial),
    // tetep pake gaji lama kayak biasa.
    if (dariTrial) {
        let ekspektasi = (typeof hitungEkspektasiGajiTrial === "function") ? hitungEkspektasiGajiTrial(namaPemain) : null;
        dataNego.demandGaji = ekspektasi || p.gaji;
        dataNego.dariTrialBuyout = true;
    } else {
        dataNego.demandGaji = p.gaji; // Pemain minta gaji lamanya dipertahankan
        dataNego.dariTrialBuyout = false;
    }
    dataNego.demandDurasi = 3;

    // [UPDATE] Klausul rilis pemain inti dinaikin ke 3x (bukan 1.8x standar).
    let klausulRilis = Math.floor(hargaPemain * (pemainIniInti ? 3 : 1.8));
    let tampilOvr = p.scouted ? p.ovr : "?";
    getEl("negoPlayerInfo").innerHTML = `${p.nama} (${namaTim})<br>
    <span style="font-size:11px; color:#C9971F;">OVR: ${tampilOvr} | Harga Pasar: Rp ${(hargaPemain / 1000000).toFixed(1)} Jt</span><br>
    <span style="font-size:11px; color:#E5484D; font-weight:bold;">Klausul Rilis (Auto-Deal): Rp ${(klausulRilis / 1000000).toFixed(1)} Jt</span>${dariTrial ? `<br><span style="font-size:11px; color:#2563EB;">💬 Berdasarkan performa trial, dia minta gaji lebih tinggi dari biasanya. Kalau nego gagal, biaya buyout HANGUS!</span>` : ""}`;

    // Munculin UI Transfer
    getEl("barisDemandTransfer").classList.remove("sembunyi");
    getEl("grupNegoTransfer").classList.remove("sembunyi");
    getEl("labelInputTransfer").innerText = "Biaya Transfer ke Tim (Juta Rp):";
    getEl("negoDemandTransfer").innerText =
        `Rp ${(dataNego.demandTransfer / 1000000).toFixed(1)} Jt`;
    getEl("negoDemandGaji").innerText =
        `Rp ${(dataNego.demandGaji / 1000000).toFixed(1)} Jt`;
    getEl("negoDemandDurasi").innerText = "3";

    getEl("inputNegoTransfer").value = "";
    getEl("inputNegoGaji").value = "";
    getEl("inputNegoDurasi").value = "";
    getEl("modalNego").classList.remove("sembunyi");
};

window.prosesPinjamPemainLain = function (namaPemain, namaTim, hargaPemain) {
    if (!apakahTransferTerbuka()) {
        alert("⚠️ Bursa transfer belum dibuka!");
        return;
    }
    if (typeof timPlayerSedangRosterLock === "function") {
        let statusLock = timPlayerSedangRosterLock();
        if (statusLock.terkunci) {
            alert(pesanRosterLockAktif(statusLock));
            return;
        }
    }
    // [FIX] Sama kayak bug di prosesBeliPemainLain -- ganti pencarian
    // manual 4-region jadi cariTimAsliDiDatabase() yang nyertain semua
    // 13 region.
    let tim = cariTimAsliDiDatabase(namaTim);
    if (!tim) {
        bukaModal("Tim Tidak Ditemukan", `Data tim ${namaTim} gak ketemu di database. Transaksi dibatalkan.`, "#E5484D");
        return;
    }
    let p = tim.roster.find(x => x.nama === namaPemain);
    if (!p) {
        bukaModal("Pemain Tidak Ditemukan", `${namaPemain} gak ketemu di roster ${namaTim} (kemungkinan udah pindah tim). Transaksi dibatalkan.`, "#E5484D");
        return;
    }
    if (p.sudahTransfer) {
        alert(
            `⚠️ ${p.nama} tidak bisa dipinjam karena dia baru saja melakukan transfer musim ini!`
        );
        return;
    }

    dataNego.tipe = "PINJAM_LAIN";
    dataNego.index = -1;
    dataNego.pemain = p;
    dataNego.namaTimLain = namaTim;
    // [FIX] Reset eksplisit -- cegah nilai true nyangkut dari transaksi
    // BELI_LAIN (buyout trial) sebelumnya yang gak sengaja kebawa ke sini.
    dataNego.dariTrialBuyout = false;
    dataNego.pemainIniInti = false;

    dataNego.demandTransfer = Math.floor(hargaPemain * 0.15); // Loan Fee (15% harga) buat tim AI
    dataNego.demandGaji = Math.floor(p.gaji * 0.8); // Lu bayarin 80% gajinya selama dipinjam
    dataNego.demandDurasi = 1;

    let tampilOvr = p.scouted ? p.ovr : "?";
    getEl("negoPlayerInfo").innerHTML =
        `🧳 PINJAM: ${p.nama} (${namaTim})<br><span style="font-size:11px; color:#C9971F;">OVR: ${tampilOvr} | Est. Harga: Rp ${(hargaPemain / 1000000).toFixed(1)} Jt</span>`;

    getEl("barisDemandTransfer").classList.remove("sembunyi");
    getEl("grupNegoTransfer").classList.remove("sembunyi");
    getEl("labelInputTransfer").innerText =
        "Loan Fee / Biaya Pinjam (Juta Rp):";
    getEl("negoDemandTransfer").innerText =
        `Rp ${(dataNego.demandTransfer / 1000000).toFixed(1)} Jt`;
    getEl("negoDemandGaji").innerText =
        `Rp ${(dataNego.demandGaji / 1000000).toFixed(1)} Jt`;
    getEl("negoDemandDurasi").innerText = "1";

    getEl("inputNegoTransfer").value = "";
    getEl("inputNegoGaji").value = "";
    getEl("inputNegoDurasi").value = 1;
    getEl("inputNegoDurasi").disabled = true;
    getEl("modalNego").classList.remove("sembunyi");
};

function prosesRadarBeritaGlobal() {
    // 1. RADAR KEJUTAN GLOBAL (TIM KUAT LUAR NEGERI NYUNGSEP)
    if (statusGame === "REGULER" && mingguKe === 9 && indeksHari === 2) {
        let regionPH = [...daftarTimPH].sort(
            (a, b) => b.poin - a.poin || b.gameW - b.gameL - (a.gameW - a.gameL)
        );
        let regionMY = [...daftarTimMY].sort(
            (a, b) => b.poin - a.poin || b.gameW - b.gameL - (a.gameW - a.gameL)
        );

        // Cek Top 2 PH (Biasanya AP BREN / Liquid PH / ONIC PH) nyungsep ke peringkat 6 ke bawah
        let timKuatPH = ["AP BREN", "Team Liquid PH", "ONIC PH"];
        timKuatPH.forEach(nama => {
            let idx = regionPH.findIndex(t => t.nama === nama);
            if (idx >= 5) {
                // Peringkat 6, 7, 8 (Gagal/Hampir Gagal)
                tambahBerita(
                    `🌍 Kejutan MPL PH: Tim raksasa Filipina <span>${nama}</span> terpuruk di peringkat ${idx + 1} Regular Season.`
                );
            }
        });

        // Cek Malaysia (Selangor Red Giants / Team Vamos)
        let timKuatMY = ["Selangor Red Giants", "Team Vamos"];
        timKuatMY.forEach(nama => {
            let idx = regionMY.findIndex(t => t.nama === nama);
            if (idx >= 5) {
                tambahBerita(
                    `🌍 Kejutan MPL MY: Sang jawara Malaysia <span>${nama}</span> secara mengejutkan gagal mengamankan papan atas.`
                );
            }
        });
    }

    // 2. RUMUS ACAK GOSIP & RUMOR TRANSFER (KHUSUS OFF-SEASON)
    if (statusGame === "OFFSEASON" && Math.random() < 0.3) {
        let gosipPemain =
            pemainTransfer[Math.floor(Math.random() * pemainTransfer.length)];
        let semuaTimAI = [...daftarTim, ...daftarTimPH, ...daftarTimMY].filter(
            t => t.nama !== timPlayer
        );
        let gosipTim =
            semuaTimAI[Math.floor(Math.random() * semuaTimAI.length)];

        if (gosipPemain && gosipTim) {
            let templateRumor = [
                `🔥 Rumor Panas: Agen <span>${gosipPemain.nama}</span> tertangkap kamera sedang melakukan pertemuan rahasia dengan CEO <span>${gosipTim.nama}</span>.`,
                `💰 Transfer Gossip: Demi ambisi juara, <span>${gosipTim.nama}</span> dikabarkan siap pecahkan rekor nilai transfer demi mendatangkan <span>${gosipPemain.nama}</span>.`,
                `✈️ Bursa Rumor: <span>${gosipPemain.nama}</span> dirumorkan bakal melakoni *trial* di luar negeri bersama tim <span>${gosipTim.nama}</span>.`
            ];
            tambahBerita(
                templateRumor[Math.floor(Math.random() * templateRumor.length)]
            );
        }
    }
}
// --- SISTEM KEUANGAN & TRANSFER ANTAR AI ---
function initKeuanganAI() {
    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    // [BUGFIX] Sebelumnya cuma 4 region MPL, jadi tim MDL/MAL/LEN gak
    // pernah punya kas/levelGH/reputasi/sponsorAI yang ter-inisialisasi
    // (semuanya undefined selamanya). Sekarang ikutsertakan semua region,
    // pola sama dgn yg sudah dipakai di prosesTransferAI dkk.
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegionAI.push(daftarTimLEN);

    semuaRegionAI.forEach(region => {
        region.forEach(tim => {
            if (tim.nama !== timPlayer) {
                // Hanya isi kalau belum ada (data baru sudah dipasang di database.js)
                if (tim.kas === undefined) {
                    tim.kas = tim.power * 50000000 + Math.floor(Math.random() * 5000000000);
                }
                if (tim.levelGH === undefined) {
                    tim.levelGH = tim.power >= 84 ? 3 : tim.power >= 78 ? 2 : 1;
                }
                if (tim.reputasi === undefined) {
                    tim.reputasi = tim.power - 10 + Math.floor(Math.random() * 15);
                }
                if (tim.sponsorAI === undefined) {
                    // Sponsor otomatis berdasarkan tier power
                    if (tim.power >= 85) {
                        tim.sponsorAI = { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 150000000 };
                    } else if (tim.power >= 80) {
                        tim.sponsorAI = { nama: "Red Bull", tier: "A", pendapatanPerMusim: 80000000 };
                    } else if (tim.power >= 75) {
                        tim.sponsorAI = { nama: "Tokopedia", tier: "A", pendapatanPerMusim: 55000000 };
                    } else if (tim.power >= 70) {
                        tim.sponsorAI = { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 30000000 };
                    } else {
                        tim.sponsorAI = { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 };
                    }
                }
            }
        });
    });
}

// Langsung panggil saat game diload
initKeuanganAI();

// ============================================================
// SISTEM SURAT KETERTARIKAN STAFF (RAYUAN AKHIR KONTRAK)
// ============================================================
let daftarSuratStaff = []; // { staff, timAsal, roleTuju, musimKirim, status: "PENDING"|"DITERIMA"|"DITOLAK" }

// Kirim surat ketertarikan ke staff tim lawan
window.kirimSuratKetertarikanStaff = function(namaStaff, namaTimAsal, roleTarget) {
    // Validasi: transfer harus terbuka (pramusim / mid season / offseason)
    if (statusGame === "REGULER") {
        bukaModal("Bukan Waktu yang Tepat ⏳",
            "Kamu hanya bisa mengirim surat ketertarikan saat <b>Pramusim</b> atau <b>Off-Season</b>. Tunggu jendela transfer dibuka!",
            "#E8720C");
        return;
    }

    // Cari data staffnya
    let staffTarget = null;
    let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    for (let region of semuaRegion) {
        let tim = region.find(t => t.nama === namaTimAsal);
        if (tim && tim.staff) {
            let roleKeys = ["pelatih", "asisten", "analis"];
            for (let rk of roleKeys) {
                if (tim.staff[rk] && tim.staff[rk].nama === namaStaff) {
                    staffTarget = tim.staff[rk];
                    break;
                }
            }
        }
        if (staffTarget) break;
    }
    if (!staffTarget) return;

    // Cek apakah sudah pernah kirim surat di musim ini
    let sudahKirim = daftarSuratStaff.find(s =>
        s.staff.nama === namaStaff && s.musimKirim === musimKe && s.status === "PENDING"
    );
    if (sudahKirim) {
        bukaModal("Sudah Dikirim ✉️",
            `Kamu sudah mengirim surat ketertarikan ke <b>${namaStaff}</b> musim ini. Tunggu respons mereka di akhir musim.`,
            "#888");
        return;
    }

    // Cek kapasitas slot staff kita
    if (staffKita[roleTarget] !== null && staffKita[roleTarget] !== undefined) {
        bukaModal("Slot Staff Terisi 🚫",
            `Slot <b>${roleTarget}</b> kamu sudah terisi oleh <b>${staffKita[roleTarget].nama}</b>. Lepas mereka dulu sebelum mendekati kandidat baru.`,
            "#E5484D");
        return;
    }

    // Simpan ke antrian
    daftarSuratStaff.push({
        staff: { ...staffTarget },
        timAsal: namaTimAsal,
        roleTarget: roleTarget,
        musimKirim: musimKe,
        status: "PENDING"
    });

    // Email konfirmasi ke player
    tambahEmail(
        `✉️ Surat Ketertarikan Terkirim — ${namaStaff}`,
        `Agen ${namaStaff}`,
        `Surat ketertarikan resmi kamu kepada <b>${namaStaff}</b> (${staffTarget.role} — ${namaTimAsal}) telah dikirimkan.<br><br>
        ${namaStaff} sedang mempertimbangkan tawaran ini. Kontrak mereka dengan ${namaTimAsal} akan berakhir di akhir musim ini.<br><br>
        Jawaban akan kamu terima di <b>awal Off-Season</b>. Jika tertarik, mereka akan langsung bergabung tanpa biaya transfer. Jika tidak, kamu perlu mencari kandidat lain di bursa staff.`
    );

    bukaModal("Surat Terkirim! ✉️",
        `Surat ketertarikan kepada <b>${namaStaff}</b> berhasil dikirim.<br><br>Mereka akan memberikan jawaban di awal <b>Off-Season</b>. Pantau kotak masuk kamu!`,
        "#00B37E");
};

// Proses semua surat yang pending di awal offseason
function prosesSuratKetertarikanOffseason() {
    if (daftarSuratStaff.length === 0) return;

    let pending = daftarSuratStaff.filter(s => s.status === "PENDING" && s.musimKirim === musimKe);
    pending.forEach(surat => {
        let staff = surat.staff;

        // Faktor keputusan staff:
        // 1. Reputasi manajer (makin tinggi makin tertarik)
        // 2. Gaji staff saat ini vs rata-rata bursa (kalau gajinya rendah, lebih mudah dipikat)
        // 3. Sedikit random (faktor personal)
        let skorTertarik = 0;
        if (reputasiManajer >= 200) skorTertarik += 40;
        else if (reputasiManajer >= 100) skorTertarik += 25;
        else if (reputasiManajer >= 50) skorTertarik += 10;

        // Staff bergaji rendah lebih tertarik pindah (harapan gaji lebih baik)
        let gajiStaff = staff.gaji || 10000000;
        if (gajiStaff < 10000000) skorTertarik += 30;
        else if (gajiStaff < 15000000) skorTertarik += 15;

        // Random faktor personal (25-50% base chance)
        let rng = Math.floor(Math.random() * 50) + 25;
        skorTertarik += rng;

        let diterima = skorTertarik >= 60; // Threshold keputusan

        if (diterima) {
            surat.status = "DITERIMA";
            // Langsung masukkan ke staffKita
            let rk = surat.roleTarget;
            staffKita[rk] = { ...staff, sisaKontrak: 2 };

            // Hapus dari tim asal
            let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
            for (let region of semuaRegion) {
                let tim = region.find(t => t.nama === surat.timAsal);
                if (tim && tim.staff) {
                    let roleKeys = ["pelatih", "asisten", "analis"];
                    for (let roleKey of roleKeys) {
                        if (tim.staff[roleKey] && tim.staff[roleKey].nama === staff.nama) {
                            tim.staff[roleKey] = null;
                            break;
                        }
                    }
                }
            }

            tambahEmail(
                `🎉 ${staff.nama} Menerima Tawaranmu!`,
                `Agen ${staff.nama}`,
                `Kabar baik! <b>${staff.nama}</b> memutuskan untuk bergabung dengan <b>${timPlayer}</b> mulai musim depan.<br><br>
                Mereka terkesan dengan visi dan reputasi tim kamu. Kontrak 2 musim sudah ditandatangani.<br><br>
                Gaji yang disepakati: <b>Rp ${(staff.gaji || 10000000).toLocaleString("id-ID")}/musim</b>.<br><br>
                Selamat datang di keluarga besar ${timPlayer}, ${staff.nama}! 💪`
            );
            tambahBerita(`🔔 Rekrutan Baru: <b>${staff.nama}</b> resmi bergabung dengan <span>${timPlayer}</span> sebagai ${staff.role}.`);

        } else {
            surat.status = "DITOLAK";
            let alasan = reputasiManajer < 50
                ? "merasa reputasi tim belum cukup meyakinkan untuk pindah"
                : "memilih untuk memperpanjang kontrak dengan tim lama";

            tambahEmail(
                `❌ ${staff.nama} Menolak Tawaranmu`,
                `Agen ${staff.nama}`,
                `Setelah pertimbangan matang, <b>${staff.nama}</b> memutuskan untuk tidak bergabung dengan ${timPlayer} saat ini.<br><br>
                Mereka ${alasan}.<br><br>
                Jangan menyerah — tingkatkan reputasi tim dan coba lagi musim depan, atau cari kandidat lain di bursa staff.`
            );
        }
    });

    // Bersihkan surat lama (lebih dari 1 musim)
    daftarSuratStaff = daftarSuratStaff.filter(s => s.musimKirim >= musimKe - 1);
}

// ============================================================
// EM-EL PRO CIRCUIT MANAGER 2026 — AI ECOSYSTEM v2.0
// 4 Sistem Baru: Finansial, Fasilitas, Sponsor, Transfer Proaktif
// ============================================================

// ------------------------------------------------------------------
// [SISTEM 1] DISTRIBUSI HADIAH TURNAMEN KE TIM AI
// Dipanggil setelah hasil playoff/MSC/M-Series selesai disimulasikan
// ------------------------------------------------------------------
function distribusiHadiahTurnamenAI(dataPlayoff, jenisEvent) {
    // Tabel prize pool berdasarkan jenis event (dalam Rupiah)
    const tabelPrize = {
        MPL:     { juara1: 500000000, juara2: 200000000, top4: 100000000, lolosPlayoff: 50000000 },
        MSC:     { juara1: 1500000000, juara2: 600000000, top4: 300000000, lolosPlayoff: 150000000 },
        MSERIES: { juara1: 3000000000, juara2: 1200000000, top4: 600000000, lolosPlayoff: 300000000 }
    };

    let prize = tabelPrize[jenisEvent] || tabelPrize.MPL;

    // Bayar hadiah ke tim yang sampai di babak final (m8 = Grand Final, m7 = semi)
    if (dataPlayoff.m8) {
        let juara1 = dataPlayoff.m8.menang;
        let juara2 = dataPlayoff.m8.kalah;
        if (juara1 && juara1.nama !== timPlayer) { juara1.kas = (juara1.kas || 0) + prize.juara1; juara1.reputasi = Math.min(100, (juara1.reputasi||50) + 15); }
        if (juara2 && juara2.nama !== timPlayer) { juara2.kas = (juara2.kas || 0) + prize.juara2; juara2.reputasi = Math.min(100, (juara2.reputasi||50) + 8); }
    }
    // Top 4 (semifinalis yang kalah)
    if (dataPlayoff.s1) {
        let sf1 = dataPlayoff.s1.kalah;
        if (sf1 && sf1.nama !== timPlayer) sf1.kas = (sf1.kas || 0) + prize.top4;
    }
    if (dataPlayoff.s2) {
        let sf2 = dataPlayoff.s2.kalah;
        if (sf2 && sf2.nama !== timPlayer) sf2.kas = (sf2.kas || 0) + prize.top4;
    }
    // Tim yang lolos playoff tapi kalah di quarter final
    if (dataPlayoff.q1) { let t = dataPlayoff.q1.kalah; if (t && t.nama !== timPlayer) t.kas = (t.kas||0) + prize.lolosPlayoff; }
    if (dataPlayoff.q2) { let t = dataPlayoff.q2.kalah; if (t && t.nama !== timPlayer) t.kas = (t.kas||0) + prize.lolosPlayoff; }
    if (dataPlayoff.q3) { let t = dataPlayoff.q3.kalah; if (t && t.nama !== timPlayer) t.kas = (t.kas||0) + prize.lolosPlayoff; }
    if (dataPlayoff.q4) { let t = dataPlayoff.q4.kalah; if (t && t.nama !== timPlayer) t.kas = (t.kas||0) + prize.lolosPlayoff; }
}

// Distribusi hadiah regular season berdasarkan poin klasemen
function distribusiHadiahRegularSeasonAI(daftarTimRegion, multiplier = 1) {
    // Urutkan berdasarkan poin untuk tentukan ranking
    let urut = [...daftarTimRegion].sort((a, b) => (b.poin||0) - (a.poin||0));
    const tabelBonus = [200000000, 150000000, 100000000, 75000000, 50000000, 30000000, 20000000, 10000000];
    urut.forEach((tim, idx) => {
        if (tim.nama === timPlayer) return;
        let bonus = Math.floor((tabelBonus[idx] || 5000000) * multiplier);
        tim.kas = (tim.kas || 0) + bonus;
        // Bonus reputasi kecil dari performa regular season
        if (idx === 0) tim.reputasi = Math.min(100, (tim.reputasi||50) + 5);
    });
}

// ------------------------------------------------------------------
// [BUGFIX] HADIAH JUARA/RUNNER-UP UNTUK LIGA TIER-2/3 (MDL/LEN/MAL)
// distribusiHadiahTurnamenAI() di atas dirancang khusus utk bracket
// playoff MPL (struktur m8/s1/s2/q1-4), yang gak cocok dipakai
// langsung utk MDL/LEN/MAL (struktur bracket beda / cuma 1 liga tanpa
// playoff gelar terpisah). Helper ringan ini dipakai dari
// mdl_len_engine.js di titik akhir-musim/final masing2 liga, supaya
// MDL/MAL/LEN juga punya hadiah uang & reputasi atas gelar musim ini --
// sebelumnya gak ada sama sekali (cakupan distribusi hadiah lama hanya
// 4 region MPL).
// ------------------------------------------------------------------
function distribusiHadiahJuaraTier2AI(juara, runnerUp, prizeJuara, prizeRunnerUp) {
    let pemain = typeof timPlayer !== "undefined" ? timPlayer : null;
    if (juara && juara.nama !== pemain) {
        juara.kas = (juara.kas || 0) + (prizeJuara || 0);
        juara.reputasi = Math.min(100, (juara.reputasi || 50) + 10);
    }
    if (runnerUp && runnerUp.nama !== pemain) {
        runnerUp.kas = (runnerUp.kas || 0) + (prizeRunnerUp || 0);
        runnerUp.reputasi = Math.min(100, (runnerUp.reputasi || 50) + 5);
    }
}
window.distribusiHadiahRegularSeasonAI = distribusiHadiahRegularSeasonAI;
window.distribusiHadiahJuaraTier2AI = distribusiHadiahJuaraTier2AI;

// ------------------------------------------------------------------
// [SISTEM 2] VALIDASI KAPASITAS GAMING HOUSE AI
// Fungsi helper: cek apakah tim AI boleh rekrut pemain/staff
// ------------------------------------------------------------------
const LIMIT_GH_AI = {
    1: { limitRoster: 6, limitStaff: 1 },
    2: { limitRoster: 8, limitStaff: 2 },
    3: { limitRoster: 10, limitStaff: 3 }
};

function aiKapasitasRoster(tim) {
    let lvl = tim.levelGH || 1;
    return LIMIT_GH_AI[lvl] ? LIMIT_GH_AI[lvl].limitRoster : 6;
}

function aiKapasitasStaff(tim) {
    let lvl = tim.levelGH || 1;
    return LIMIT_GH_AI[lvl] ? LIMIT_GH_AI[lvl].limitStaff : 1;
}

// Upgrade GH AI otomatis kalau kas cukup dan butuh ruang lebih
function upgradeGhAI(tim) {
    if (!tim || tim.nama === timPlayer) return;
    let lvl = tim.levelGH || 1;
    if (lvl >= 3) return; // Sudah max
    const biayaUpgrade = [0, 300000000, 800000000]; // index = level tujuan - 1
    let biaya = biayaUpgrade[lvl]; // lvl=1 berarti upgrade ke 2 butuh biayaUpgrade[1]=300jt
    // Upgrade kalau: kas cukup (min 3x biaya) DAN roster sudah penuh
    let kapasitasSekarang = aiKapasitasRoster(tim);
    let rosterSekarang = (tim.roster || []).length;
    if (tim.kas >= biaya * 3 && rosterSekarang >= kapasitasSekarang - 1) {
        tim.kas -= biaya;
        tim.levelGH = lvl + 1;
    }
}

// ------------------------------------------------------------------
// [SISTEM 3] EKOSISTEM SPONSOR AI (PENDAPATAN MUSIMAN)
// Dipanggil di awal setiap musim baru
// ------------------------------------------------------------------
// Godaan & investigasi sponsor ilegal khusus tim AI. Dipanggil per-tim,
// per-musim, dari dalam prosesSponsorMusimAI().
function prosesSponsorIlegalAI(tim) {
    tim._investigasiAI = tim._investigasiAI || { level: 0, cicilan: [] };

    // 1. Tagih dulu cicilan denda pelanggaran musim2 sebelumnya (kalau ada)
    tagihCicilanDendaIlegal(tim._investigasiAI, tim, tim.nama);

    // 2. Kalau lagi pegang sponsor ilegal aktif -> cek investigasi musim ini
    if (tim._sponsorIlegalAI) {
        if (Math.random() < PELUANG_INVESTIGASI_AI) {
            let sp = tim._sponsorIlegalAI;
            let hasil = eksekusiPelanggaranIlegal(tim._investigasiAI, sp.nilaiTotal, sp.nama);
            tim.reputasi = Math.max(0, (tim.reputasi || 50) - 10);
            tim._sponsorIlegalAI = null; // kontrak diputus paksa
            tagihCicilanDendaIlegal(tim._investigasiAI, tim, tim.nama); // cicilan pertama musim ini juga

            let labelLevel = ["Pertama", "Kedua", "Ketiga (Maksimal)"][hasil.level - 1] || `Level ${hasil.level}`;
        } else {
            tim._sponsorIlegalAI.durasiSisa--;
            if (tim._sponsorIlegalAI.durasiSisa <= 0) tim._sponsorIlegalAI = null; // kontrak habis normal, aman
        }
        return; // gak boleh ambil sponsor ilegal baru di musim yang sama
    }

    // 3. Belum ada sponsor ilegal aktif -> roll peluang ambil baru (0-35%, ditimbang)
    //    Makin rendah reputasi & makin kering kas, makin mendekati 35%.
    let reputasi = tim.reputasi || 50;
    let kas = tim.kas || 0;
    let skorReputasi = (100 - Math.min(100, Math.max(0, reputasi))) / 100; // 0 (reputasi 100) - 1 (reputasi 0)
    let skorKas = kas < 200000000 ? 1 : (kas < 500000000 ? 0.5 : 0); // <200Jt kering, <500Jt seret, sisanya aman
    let peluangAmbil = 0.35 * ((skorReputasi * 0.7) + (skorKas * 0.3));

    if (Math.random() < peluangAmbil) {
        let daftarDark = daftarSponsor.filter(s => s.tier === "DARK");
        if (daftarDark.length === 0) return;
        let pilihan = daftarDark[Math.floor(Math.random() * daftarDark.length)];
        let durasi = Math.floor(Math.random() * 2) + 1;
        let nilaiTotal = pilihan.bayar * durasi;

        tim._sponsorIlegalAI = { nama: pilihan.nama, nilaiTotal: nilaiTotal, durasiSisa: durasi };
        tim.kas = (tim.kas || 0) + nilaiTotal;
        tim.reputasi = Math.max(0, reputasi - 15);
    }
}

function prosesSponsorMusimAI() {
    // FIX: hanya MPL (ID/PH/MY/SG) yang dapat sponsor di sini.
    // MDL ID, MDL PH, LEN, MAL MY sudah dapat sponsor per akhir musim
    // masing-masing di prosesAkhirMusimMDLdanLEN() / prosesAkhirMusimMDLPH()
    // / prosesAkhirMusimMALMY() — memanggil mereka di sini juga akan
    // double-count (2x pendapatan per tahun vs MPL yang cuma 1x).
    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    semuaRegionAI.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return;

            let pendapatanSponsor = 0;

            // Pendapatan dari sponsor yang sudah ada
            if (tim.sponsorAI) {
                pendapatanSponsor += tim.sponsorAI.pendapatanPerMusim || 0;
            }

            // Bonus sponsor berdasarkan reputasi tim (scale factor)
            let reputasi = tim.reputasi || 50;
            let ovrRataRata = 0;
            if (tim.roster && tim.roster.length > 0) {
                tim.roster.forEach(p => ovrRataRata += (p.ovr || tim.power));
                ovrRataRata = Math.floor(ovrRataRata / tim.roster.length);
            } else {
                ovrRataRata = tim.power;
            }

            // Formula: pendapatan sponsor * modifier reputasi & OVR
            let modifierReputasi = 0.7 + (reputasi / 100) * 0.6; // range ~0.7 - 1.3
            let modifierOVR = 0.8 + (ovrRataRata / 100) * 0.4;  // range ~0.8 - 1.2
            pendapatanSponsor = Math.floor(pendapatanSponsor * modifierReputasi * modifierOVR);

            // Cek apakah bisa dapat sponsor upgrade (naik tier kalau reputasi meningkat)
            if (reputasi >= 90 && tim.sponsorAI && tim.sponsorAI.tier !== "S") {
                tim.sponsorAI = { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 180000000 };
            } else if (reputasi >= 75 && tim.sponsorAI && tim.sponsorAI.tier === "C") {
                tim.sponsorAI = { nama: "Red Bull", tier: "A", pendapatanPerMusim: 80000000 };
            } else if (reputasi < 40 && tim.sponsorAI && tim.sponsorAI.tier !== "C") {
                // Sponsor kabur kalau reputasi jeblok
                tim.sponsorAI = { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 };
            }

            tim.kas = (tim.kas || 0) + pendapatanSponsor;

            // Godaan & investigasi sponsor ilegal (0-35%, ditimbang reputasi & kas)
            prosesSponsorIlegalAI(tim);
        });
    });
}

// ------------------------------------------------------------------
// [SISTEM 4] BURSA TRANSFER AI PROAKTIF
// Dipanggil di setiap transisi Off-Season
// ------------------------------------------------------------------
function prosesTransferAI() {
    // [NEW] Reset tracker "tim kena bajak" tiap kali fungsi ini jalan --
    // dipake Fase 2 di bawah buat ngasih giliran reaksi sama-musim.
    window._timKenaBajakTickIni = [];

    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    // FIX: ikutsertakan tim MDL/MAL/LEN supaya mereka juga punya otak transfer
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegionAI.push(daftarTimLEN);

    // ================================================================
    // PRE-PROCESS: Tentukan tim terkuat per region (untuk reaksi rival)
    // [FIX] Sebelumnya dikunci ke `["ID","PH","MY","SG"][idx]` -- cuma
    // valid buat 4 region pertama. Begitu semuaRegionAI diperluas sampai
    // 17+ region/liga (13 MPL + MDL/MAL/LEN), region ke-5 dst dapet
    // namaRegion = undefined dan numpuk nulis ke key "undefined" yang
    // sama, bikin rivalDominan-nya salah total buat mayoritas tim.
    // Sekarang dikunci pakai INDEX ARRAY LANGSUNG (idx), yang otomatis
    // konsisten berapapun jumlah region-nya, gak perlu daftar nama manual.
    // ================================================================
    let timTerkuatPerRegion = {};
    semuaRegionAI.forEach((region, idx) => {
        let sorted = [...region].filter(t => t.nama !== timPlayer)
                                .sort((a,b) => (b.poin||0) - (a.poin||0));
        timTerkuatPerRegion[idx] = sorted[0] || null;
    });

    semuaRegionAI.forEach((region, idxRegion) => {
        let rivalDominan = timTerkuatPerRegion[idxRegion];

        region.forEach(tim => {
            if (tim.nama === timPlayer) return;
            if (!tim.roster) tim.roster = [];

            let kapasitasMax = aiKapasitasRoster(tim);

            // ============================================================
            // [A] JUAL PAKSA KALAU KAS MINUS
            // ============================================================
            if (tim.kas < 0) {
                // Jual pemain yang paling mahal tapi bukan pemain bintang di role inti
                // (AI tidak mau jual ace-nya kecuali terpaksa banget)
                let rosterUrut = [...tim.roster].sort((a,b) => (b.harga||0) - (a.harga||0));
                // Coba jual sub dulu, baru starter
                let targetJual = rosterUrut.find(p => !p.isStarter) || rosterUrut[0];
                if (targetJual) {
                    let hargaJual = Math.floor((targetJual.harga || targetJual.gaji * 1.5) * 0.85);
                    tim.kas += hargaJual;
                    tim.roster = tim.roster.filter(x => x.nama !== targetJual.nama);
                    targetJual.sisaKontrak = 2;
                    targetJual.harga = hargaJual;
                    pemainTransfer.push(targetJual);
                }
            }

            // ============================================================
            // [1] PRIORITAS STRATEGI — Evaluasi kelemahan role per posisi
            // Skor tiap role = rata-rata OVR pemain di role itu
            // Role dengan skor terendah = prioritas rekrut utama
            // ============================================================
            const semuaRole = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
            let skorRole = {};
            semuaRole.forEach(role => {
                let pemainDiRole = tim.roster.filter(p => p.role === role);
                if (pemainDiRole.length === 0) {
                    skorRole[role] = 0; // Role kosong = prioritas darurat
                } else {
                    let total = pemainDiRole.reduce((s,p) => s + (p.ovr||60), 0);
                    skorRole[role] = Math.floor(total / pemainDiRole.length);
                }
            });

            // Urutkan role dari yang paling lemah ke terkuat
            let roleByPrioritas = [...semuaRole].sort((a,b) => skorRole[a] - skorRole[b]);

            // ============================================================
            // [4] REAKSI TERHADAP RIVAL — Kalau ada rival dominan di region
            // AI akan lebih agresif merekrut di role yang rival-nya lemah,
            // atau counter dengan menguatkan role yang rival-nya kuat
            // ============================================================
            let roleCounterRival = null;
            if (rivalDominan && rivalDominan.nama !== tim.nama && rivalDominan.roster) {
                // Hitung OVR per role rival
                let skorRoleRival = {};
                semuaRole.forEach(role => {
                    let pr = rivalDominan.roster.filter(p => p.role === role);
                    skorRoleRival[role] = pr.length > 0
                        ? Math.floor(pr.reduce((s,p) => s+(p.ovr||60),0) / pr.length)
                        : 60;
                });
                // Cari role yang tim kita paling jauh tertinggal dari rival
                let maxGap = 0;
                semuaRole.forEach(role => {
                    let gap = (skorRoleRival[role]||60) - (skorRole[role]||60);
                    if (gap > maxGap) { maxGap = gap; roleCounterRival = role; }
                });
                // Kalau gap < 3, tidak perlu counter khusus
                if (maxGap < 3) roleCounterRival = null;
            }

            // Sisipkan roleCounterRival ke urutan teratas kalau ada
            if (roleCounterRival) {
                roleByPrioritas = roleByPrioritas.filter(r => r !== roleCounterRival);
                roleByPrioritas.unshift(roleCounterRival);
            }

            // ============================================================
            // [2] NEGOSIASI GAJI — AI tidak mau bayar sembarangan
            // Budget per pemain dihitung berdasarkan kas dan jumlah slot kosong
            // ============================================================
            let kasReserve = 500000000;
            let slotKosong = Math.max(1, kapasitasMax - tim.roster.length);
            // Budget per pemain = sisa kas yang "aman" dibagi slot yang perlu diisi
            let budgetPerPemain = Math.floor(((tim.kas || 0) - kasReserve) / slotKosong);
            budgetPerPemain = Math.max(0, budgetPerPemain);

            // Modifier negosiasi: tim kaya lebih fleksibel, tim miskin lebih ketat
            let negoModifier = tim.kas > 5000000000 ? 1.3   // Kaya raya: mau bayar premium
                             : tim.kas > 2000000000 ? 1.0   // Menengah: harga wajar
                             : tim.kas > 500000000  ? 0.75  // Pas-pasan: minta diskon
                             : 0.5;                          // Sekarat: tawar semurah mungkin

            // ============================================================
            // [3] SCOUTING — AI hanya bisa scout potensi kalau punya analis
            // Kualitas scouting berdasarkan dataAnalysis analis tim
            // ============================================================
            let analisAI     = tim.staff && tim.staff.analis;
            let modeScouting = !!analisAI; // wajib punya analis
            let daAI         = (analisAI && analisAI.atribut) ? (analisAI.atribut.dataAnalysis || 0) : 0;
            // Bobot potensi dalam keputusan scouting AI naik seiring kualitas analis:
            // daAI < 40  → bobotPotensi 0.1 (baru bisa sedikit lihat potensi)
            // daAI 40-59 → 0.2
            // daAI 60-79 → 0.3
            // daAI 80-89 → 0.4
            // daAI 90+   → 0.5 (sangat akurat)
            let bobotPotensi = daAI >= 90 ? 0.5 : daAI >= 80 ? 0.4 : daAI >= 60 ? 0.3 : daAI >= 40 ? 0.2 : 0.1;
            let bobotOvr     = 1 - bobotPotensi;

            // ============================================================
            // PROSES REKRUT — Iterasi per role berdasarkan prioritas
            // ============================================================
            roleByPrioritas.forEach(roleTarget => {
                let adaRuang = tim.roster.length < kapasitasMax;
                if (!adaRuang) return;

                let pemainDiRole = tim.roster.filter(p => p.role === roleTarget);
                let ovrRoleSekarang = skorRole[roleTarget] || 0;
                let darurat = pemainDiRole.length === 0;

                // [3] SCOUTING: Filter kandidat dari bursa
                let kandidat = pemainTransfer.filter(p => {
                    if (p.role !== roleTarget) return false;
                    let harga = p.harga || (p.gaji * 1.5);

                    // [2] NEGOSIASI: Harga harus dalam budget yang sudah dinegosiasikan
                    let hargaMax = darurat
                        ? budgetPerPemain * 1.5  // Darurat: mau bayar lebih
                        : budgetPerPemain * negoModifier;
                    if (harga > hargaMax && !darurat) return false;
                    if (tim.kas - harga < (darurat ? 0 : kasReserve)) return false;

                    // [3] SCOUTING: Nilai pemain berbeda tergantung mode
                    if (modeScouting) {
                        // Tim punya analis: pertimbangkan OVR + potensi (bobot dari dataAnalysis)
                        let nilaiScouting = (p.ovr||60) * bobotOvr + (p.potensi||p.ovr||60) * bobotPotensi;
                        return nilaiScouting > ovrRoleSekarang * 0.95;
                    } else {
                        // Tim biasa: hanya lihat OVR sekarang
                        return (p.ovr||60) > ovrRoleSekarang + (darurat ? -5 : 2);
                    }
                });

                // ============================================================
                // [NEW] POACHING — AI juga ngevaluasi kandidat dari ROSTER AKTIF
                // tim AI lain (bukan cuma free agent di bursa transfer), sesuai
                // kebutuhan role tim ini. Semua tim AI py peluang sama (gak ada
                // prioritas tim kuat->lemah). Harga pake "klausul rilis" (1.8x
                // normal, 3x kalau target pemain inti/top-5 OVR timnya). Kas
                // WAJIB cukup sebelum eksekusi (beda dari rekrut free-agent yang
                // boleh boncos). "Satu-satunya di role" TIDAK diblokir lagi --
                // konsekuensinya otomatis ke-handle sistem penalti role-kosong
                // yang udah ada di match_engine.js.
                // ============================================================
                let kandidatBajakan = [];
                semuaRegionAI.forEach(regionLain => {
                    regionLain.forEach(timLain => {
                        if (timLain === tim || timLain.nama === timPlayer || !timLain.roster) return;
                        timLain.roster.forEach(pTarget => {
                            if (pTarget.role !== roleTarget || pTarget.sudahTransfer) return;
                            let nilaiTarget = modeScouting
                                ? (pTarget.ovr || 60) * bobotOvr + (pTarget.potensi || pTarget.ovr || 60) * bobotPotensi
                                : (pTarget.ovr || 60);
                            // Ambang lebih tinggi dari free-agent (1.05x/+5, bukan
                            // 0.95x/-2) -- bajak lebih mahal & beresiko, jadi cuma
                            // worth it kalau upgrade-nya cukup berarti.
                            let lolosNilai = modeScouting
                                ? nilaiTarget > ovrRoleSekarang * 1.05
                                : (pTarget.ovr || 60) > ovrRoleSekarang + 5;
                            if (!lolosNilai) return;

                            let iniInti = (typeof window.cekPemainIntiAI === "function") && window.cekPemainIntiAI(timLain, pTarget.nama);
                            let hargaDasar = pTarget.harga || (pTarget.gaji * 1.5 + 5000000);
                            let hargaBajak = Math.floor(hargaDasar * (iniInti ? 3 : 1.8));
                            // [KEPUTUSAN] Kas harus cukup SEBELUM eksekusi -- beda
                            // dari rekrut free-agent biasa yang boleh boncos dulu.
                            if (tim.kas - hargaBajak < kasReserve) return;

                            kandidatBajakan.push({ pemain: pTarget, timAsal: timLain, harga: hargaBajak, nilai: nilaiTarget });
                        });
                    });
                });
                kandidatBajakan.sort((a, b) => b.nilai - a.nilai);
                let bajakanTerbaik = kandidatBajakan[0] || null;

                // Bandingin kandidat FA terbaik (kalau ada) vs bajakan terbaik --
                // FA diprioritasin kalau nilainya deket² aja (lebih murah & aman),
                // bajakan cuma diambil kalau JAUH lebih bagus (>15%).
                let nilaiFaTerbaik = kandidat.length > 0
                    ? (modeScouting
                        ? (kandidat[0].ovr || 60) * bobotOvr + (kandidat[0].potensi || kandidat[0].ovr || 60) * bobotPotensi
                        : (kandidat[0].ovr || 60))
                    : -Infinity;
                let pakaiBajakan = bajakanTerbaik && bajakanTerbaik.nilai > nilaiFaTerbaik * 1.15;

                if (pakaiBajakan) {
                    let target = bajakanTerbaik;
                    tim.kas -= target.harga;
                    // [KEPUTUSAN] Duit masuk ke kas tim yang KEHILANGAN pemainnya
                    // (beda dari beli free-agent yang duitnya "lenyap" ke pasar).
                    target.timAsal.kas = (target.timAsal.kas || 0) + target.harga;
                    target.timAsal.roster = target.timAsal.roster.filter(p => p.nama !== target.pemain.nama);
                    target.pemain.sisaKontrak = Math.floor(Math.random() * 2) + 2;
                    target.pemain.sudahTransfer = true;
                    tim.roster.push(target.pemain);
                    catatTransferRealTime(target.pemain, tim.nama, false);

                    // [FASE 2] Catat tim yang baru kehilangan pemain, biar dapet
                    // giliran ekstra cari pengganti DI MUSIM YANG SAMA (gak
                    // gantung urutan array kayak sebelumnya).
                    window._timKenaBajakTickIni = window._timKenaBajakTickIni || [];
                    if (!window._timKenaBajakTickIni.includes(target.timAsal.nama)) {
                        window._timKenaBajakTickIni.push(target.timAsal.nama);
                    }

                    skorRole[roleTarget] = Math.floor(
                        tim.roster.filter(p => p.role === roleTarget)
                                  .reduce((s, p) => s + (p.ovr || 60), 0) /
                        tim.roster.filter(p => p.role === roleTarget).length
                    );
                    return; // Role ini udah keisi lewat bajakan, skip proses FA di bawah
                }

                if (kandidat.length === 0) {
                    // Tidak ada di bursa — darurat → orbitkan akademi
                    if (darurat) {
                        let pAkademi = {
                            nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : ("Akademi " + tim.nama.split(" ")[0] + " " + roleTarget.split(" ")[0]),
                            role: roleTarget,
                            ovr: Math.max(40, tim.power - 8),
                            umur: 17,
                            sisaKontrak: 3,
                            gaji: 3000000,
                            harga: 8000000,
                            negara: benderaAkademiUntukRegion(tim.region),
                            sifat: "Normal",
                            mekanik: Math.max(35, tim.power - 10),
                            makro: Math.max(35, tim.power - 10),
                            mental: Math.max(35, tim.power - 10),
                            stamina: Math.min(99, Math.max(50, tim.power - 5 + Math.floor(Math.random() * 10))),
                            spesialis: Math.max(35, tim.power - 10),
                            potensi: Math.max(50, tim.power)
                        };
                        pAkademi.historyOvr = [pAkademi.ovr];
                        tim.roster.push(pAkademi);
                        catatTransferRealTime(pAkademi, tim.nama, false);
                    }
                    return;
                }

                // [3] SCOUTING: Sorting berbeda tergantung mode
                if (modeScouting) {
                    // Tim punya analis: urutkan berdasarkan nilai gabungan OVR+Potensi (bobot dari dataAnalysis)
                    kandidat.sort((a,b) => {
                        let nilaiA = (a.ovr||60)*bobotOvr + (a.potensi||a.ovr||60)*bobotPotensi;
                        let nilaiB = (b.ovr||60)*bobotOvr + (b.potensi||b.ovr||60)*bobotPotensi;
                        return nilaiB - nilaiA;
                    });
                } else {
                    // Tim biasa: urutkan berdasarkan OVR tertinggi
                    kandidat.sort((a,b) => (b.ovr||0) - (a.ovr||0));
                }

                let incaran = kandidat[0];
                let hargaBeli = incaran.harga || (incaran.gaji * 1.5 + 5000000);

                // [4] REAKSI RIVAL: Kalau ini role counter-rival, AI lebih berani bayar
                if (roleTarget === roleCounterRival) hargaBeli = Math.floor(hargaBeli * 0.9); // "Tawar lebih keras"

                tim.kas -= hargaBeli;
                incaran.sisaKontrak = Math.floor(Math.random() * 2) + 2;
                tim.roster.push(incaran);

                let idx = pemainTransfer.findIndex(x => x.nama === incaran.nama);
                if (idx !== -1) pemainTransfer.splice(idx, 1);

                catatTransferRealTime(incaran, tim.nama, false);

                // Update skor role setelah rekrut
                skorRole[roleTarget] = Math.floor(
                    tim.roster.filter(p => p.role === roleTarget)
                              .reduce((s,p) => s+(p.ovr||60), 0) /
                    tim.roster.filter(p => p.role === roleTarget).length
                );

                // Berita rekrutmen notable
                if (darurat) {
                    // (senyap)
                } else if (roleTarget === roleCounterRival && rivalDominan) {
                    // (senyap)
                } else if (modeScouting && (incaran.potensi||0) >= 88 && (incaran.ovr||0) < 75) {
                    // (senyap)
                } else if ((incaran.ovr||0) >= 78) {
                    tambahBerita(`🔥 Transfer: <span>${tim.nama}</span> rekrut bintang <b>${incaran.nama}</b> (OVR ${incaran.ovr}).`);
                }

                // [1] UPGRADE pemain terlemah di role yang sudah punya pemain
                // (hanya kalau kas masih aman dan ada slot)
                if (!darurat && adaRuang && tim.kas > kasReserve * 1.5) {
                    let pemainTermalas = pemainDiRole.sort((a,b) => (a.ovr||0)-(b.ovr||0))[0];
                    if (pemainTermalas && (pemainTermalas.ovr||0) < ovrRoleSekarang - 8) {
                        pemainTermalas.sisaKontrak = 2;
                        pemainTransfer.push(pemainTermalas);
                        tim.roster = tim.roster.filter(x => x.nama !== pemainTermalas.nama);
                    }
                }
            });

            // Update power tim
            if (tim.roster && tim.roster.length > 0) {
                let tot = 0;
                tim.roster.forEach(p => tot += (p.ovr || tim.power));
                tim.power = Math.floor(tot / tim.roster.length);
            }

            // Upgrade GH kalau memungkinkan
            upgradeGhAI(tim);
        });
    });

    // ============================================================
    // [NEW] FASE 2 — REAKSI SAMA-MUSIM buat tim yang baru kebajak
    // pemainnya di Fase 1 di atas. Sebelumnya reaksi cuma kejadian kalau
    // KEBETULAN posisi tim itu di array lebih belakang dari tim pembajak
    // (gantung urutan, gak reliable). Sekarang giliran ekstra dikasih
    // EKSPLISIT ke semua tim yang kena bajak, gak peduli urutan.
    // ============================================================
    if (window._timKenaBajakTickIni && window._timKenaBajakTickIni.length > 0) {
        const semuaRoleF2 = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
        window._timKenaBajakTickIni.forEach(namaTimKena => {
            let timKena = null;
            for (let region of semuaRegionAI) {
                timKena = region.find(t => t.nama === namaTimKena);
                if (timKena) break;
            }
            if (!timKena || !timKena.roster) return;

            semuaRoleF2.forEach(role => {
                let pemainDiRole = timKena.roster.filter(p => p.role === role);
                if (pemainDiRole.length > 0) return; // role masih keisi, gak darurat

                // Role kosong total -- coba cari pengganti dari bursa free-agent dulu
                let kandidatPengganti = pemainTransfer
                    .filter(p => p.role === role)
                    .sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0];

                if (kandidatPengganti && timKena.kas >= (kandidatPengganti.harga || 0)) {
                    timKena.kas -= (kandidatPengganti.harga || 0);
                    kandidatPengganti.sisaKontrak = Math.floor(Math.random() * 2) + 2;
                    timKena.roster.push(kandidatPengganti);
                    let idxF2 = pemainTransfer.findIndex(x => x.nama === kandidatPengganti.nama);
                    if (idxF2 !== -1) pemainTransfer.splice(idxF2, 1);
                    catatTransferRealTime(kandidatPengganti, timKena.nama, false);
                } else {
                    // Gak ada/gak mampu beli di bursa -- orbitkan akademi darurat
                    // (pola sama kayak fallback darurat di Fase 1).
                    let pAkademiF2 = {
                        nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : ("Akademi " + timKena.nama.split(" ")[0] + " " + role.split(" ")[0]),
                        role: role,
                        ovr: Math.max(40, timKena.power - 8),
                        umur: 17,
                        sisaKontrak: 3,
                        gaji: 3000000,
                        harga: 8000000,
                        negara: (typeof benderaAkademiUntukRegion === "function") ? benderaAkademiUntukRegion(timKena.region) : "🏳️",
                        sifat: "Normal",
                        mekanik: Math.max(35, timKena.power - 10),
                        makro: Math.max(35, timKena.power - 10),
                        mental: Math.max(35, timKena.power - 10),
                        stamina: Math.min(99, Math.max(50, timKena.power - 5 + Math.floor(Math.random() * 10))),
                        spesialis: Math.max(35, timKena.power - 10),
                        potensi: Math.max(50, timKena.power)
                    };
                    pAkademiF2.historyOvr = [pAkademiF2.ovr];
                    timKena.roster.push(pAkademiF2);
                    catatTransferRealTime(pAkademiF2, timKena.nama, false);
                }
            });

            // Update power tim abis reaksi
            if (timKena.roster.length > 0) {
                let totF2 = 0;
                timKena.roster.forEach(p => totF2 += (p.ovr || timKena.power));
                timKena.power = Math.floor(totF2 / timKena.roster.length);
            }
        });
        window._timKenaBajakTickIni = []; // reset buat tick berikutnya
    }
}

// ------------------------------------------------------------------
// FUNGSI UTAMA PEMROSESAN AKHIR MUSIM AI (DIPANGGIL DI OFFSEASON)
// Menggabungkan semua 4 sistem di atas dalam urutan yang benar
// ------------------------------------------------------------------
function prosesEkosistemAI(dataPlayoffID, dataPlayoffPH, dataPlayoffMY, dataPlayoffSG) {
    // 1. Distribusi hadiah tournament ke kas tim AI
    if (dataPlayoffID) distribusiHadiahTurnamenAI(dataPlayoffID, "MPL");
    if (dataPlayoffPH) distribusiHadiahTurnamenAI(dataPlayoffPH, "MPL");
    if (dataPlayoffMY) distribusiHadiahTurnamenAI(dataPlayoffMY, "MPL");
    if (dataPlayoffSG) distribusiHadiahTurnamenAI(dataPlayoffSG, "MPL");

    // Distribusi berdasarkan performa regular season
    distribusiHadiahRegularSeasonAI(daftarTim);
    distribusiHadiahRegularSeasonAI(daftarTimPH);
    distribusiHadiahRegularSeasonAI(daftarTimMY);
    distribusiHadiahRegularSeasonAI(daftarTimSG);

    // [BUGFIX] Catatan: hadiah turnamen & regular season utk MDL/MAL/LEN
    // SENGAJA TIDAK ditaruh di sini. prosesEkosistemAI() ini hanya
    // dipanggil SEKALI per musim MPL (saat transisi off-season), tapi
    // musim MDL/MAL/LEN punya kalender sendiri yang siklusnya gak
    // sinkron dengan MPL (bisa sudah reset beberapa kali duluan). Kalau
    // dipanggil di sini, standing-nya bisa sudah ke-reset jadi 0 (data
    // basi) atau malah dihitung dobel. Distribusinya sekarang dipasang
    // tepat di titik akhir-musim masing2 liga (fresh standing, sebelum
    // reset) di mdl_len_engine.js: prosesAkhirMusimMDLdanLEN(),
    // prosesAkhirMusimMDLPH(), prosesAkhirMusimMALMY(), &
    // jalankanFinalMALMY() -- lihat fungsi2 tsb utk detailnya.

    // 2. Sponsor musiman masuk ke kas
    prosesSponsorMusimAI();

    // === FASE 5: financial_ai_patch.js ===
    // Bayar gaji roster AI (gap yang sebelumnya bikin tim AI tidak pernah
    // benar2 boncos), terapkan modifier CEO, dan update status keuangan
    // tiap tim (SEHAT/PERINGATAN/KRISIS/KOLAPS) berdasarkan runway.
    if (typeof prosesFinansialAI === "function") {
        window._ringkasanFinansialAITerakhir = prosesFinansialAI();

        // === FASE 6: resolusi krisis otomatis (merger/jual slot/kolaps) ===
        if (typeof prosesResolusiKrisisAI === "function") {
            window._logResolusiKrisisTerakhir = prosesResolusiKrisisAI(window._ringkasanFinansialAITerakhir);
        }

        // === FASE 7: pensiun & resign CEO + regenerasi ===
        if (typeof prosesPensiunResignCEO === "function") {
            window._logPergantianCEOTerakhir = prosesPensiunResignCEO();
        }

        // === FASE 10: notifikasi berita & email peluang akuisisi MPL ===
        if (typeof prosesNotifikasiPeluangAkuisisi === "function") {
            prosesNotifikasiPeluangAkuisisi();
        }

        // === FASE 14: tracking musim di MPL & penanganan slot forfeit ===
        if (typeof updateTrackingMusimDiMPL === "function") {
            updateTrackingMusimDiMPL();
        }
        if (typeof cekDanTanganiSlotAfiliasiForfeitSemuaRegion === "function") {
            cekDanTanganiSlotAfiliasiForfeitSemuaRegion();
        }

        // === FASE 17: risiko kandidat trial diambil tim AI lain ===
        if (typeof prosesRisikoTrialDiambilAI === "function") {
            prosesRisikoTrialDiambilAI();
        }
    }

    // 3. Rekrut staff untuk slot yang kosong
    prosesRekrutStaffAI();

    // 4. Bursa transfer proaktif (rekrut, jual paksa, isi role kosong)
    prosesTransferAI();
}

// ---------------------------------------------------------------
// REKRUT STAFF AI — Isi slot pelatih/asisten/analis yang kosong
// ---------------------------------------------------------------
function prosesRekrutStaffAI() {
    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    // [BUGFIX] Sebelumnya cuma 4 region MPL -- tim MDL/MAL/LEN gak pernah
    // bisa rekrut staff baru walau slot pelatih/asisten/analis kosong.
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegionAI.push(daftarTimLEN);

    // Mapping role string di bursaStaff → key di tim.staff
    const roleMap = {
        "Pelatih":         "pelatih",
        "Asisten Pelatih": "asisten",
        "Analis":          "analis"
    };

    semuaRegionAI.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return;
            if (!tim.staff) tim.staff = { pelatih: null, asisten: null, analis: null };

            // Cek setiap slot — kalau kosong, coba rekrut
            ["Pelatih", "Asisten Pelatih", "Analis"].forEach(roleLabel => {
                let slotKey = roleMap[roleLabel];
                if (tim.staff[slotKey] !== null && tim.staff[slotKey] !== undefined) return; // Sudah terisi

                // Filter kandidat dari bursaStaff yang sesuai role
                let kandidat = bursaStaff.filter(s => s.role === roleLabel);
                if (kandidat.length === 0) return; // Bursa kosong untuk role ini

                // Urutkan berdasarkan buffPower tertinggi
                kandidat.sort((a, b) => (b.buffPower || 0) - (a.buffPower || 0));

                // Pilih kandidat terbaik yang mampu dibayar tim
                // Tim bereputasi tinggi berani bayar lebih, tim kecil ambil yang terjangkau
                let batasGaji = tim.reputasi >= 80 ? Infinity
                              : tim.reputasi >= 60 ? 15000000
                              : tim.reputasi >= 40 ? 10000000
                              : 8000000;

                let pilihanIdx = kandidat.findIndex(s => (s.gaji || 0) <= batasGaji && (tim.kas || 0) >= (s.gaji || 0) * 3);

                // Kalau tidak ada yang sesuai budget, ambil yang termurah
                if (pilihanIdx === -1) {
                    kandidat.sort((a, b) => (a.gaji || 0) - (b.gaji || 0));
                    pilihanIdx = kandidat.findIndex(s => (tim.kas || 0) >= (s.gaji || 0) * 3);
                }

                if (pilihanIdx === -1) return; // Kas tidak cukup sama sekali

                let dipilih = kandidat[pilihanIdx];

                // Bayar signing fee (3x gaji pertama) dan potong dari kas AI
                let signingFee = (dipilih.gaji || 0) * 3;
                tim.kas = (tim.kas || 0) - signingFee;

                // Pasang ke slot staff tim AI
                tim.staff[slotKey] = {
                    nama:         dipilih.nama,
                    role:         dipilih.role,
                    buffPower:    dipilih.buffPower || 1,
                    gaji:         dipilih.gaji || 5000000,
                    harga:        dipilih.harga || 10000000,
                    umur:         dipilih.umur || 30,
                    sisaKontrak:  2,
                    negara:       dipilih.negara || "🌐 Global",
                    kepribadian:  dipilih.kepribadian || "Normal"
                };

                // Hapus dari bursaStaff agar tidak direkrut ganda
                let idxBursa = bursaStaff.findIndex(s => s.nama === dipilih.nama);
                if (idxBursa !== -1) bursaStaff.splice(idxBursa, 1);

                // Berita kalau staffnya cukup terkenal (buffPower >= 3)
                if ((dipilih.buffPower || 0) >= 3) {
                    tambahBerita(`🧑‍💼 Rekrut Staff: <span>${tim.nama}</span> resmi menunjuk <b>${dipilih.nama}</b> sebagai ${dipilih.role} baru mereka.`);
                }
            });
        });
    });
}

function prosesTransferAntarAI() {
    if (!apakahTransferTerbuka()) return;
    if (Math.random() > 0.12) return;

    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    // FIX: ikutsertakan tim MDL/MAL/LEN supaya mereka juga bisa transfer antar-AI
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegionAI.push(daftarTimLEN);
    let semuaTimAI = [];
    semuaRegionAI.forEach(r =>
        r.forEach(t => { if (t.nama !== timPlayer) semuaTimAI.push(t); })
    );

    // ================================================================
    // [CERDAS] Pilih pembeli berdasarkan kebutuhan nyata, bukan random
    // ================================================================
    const semuaRole = ["Roamer","Jungler","Midlaner","Goldlaner","EXP Laner"];

    // Cari tim yang paling "butuh" — ada role kosong atau jauh di bawah rata-rata
    let kandidatPembeli = semuaTimAI
        .filter(t => t.kas >= 50000000 && t.roster && t.roster.length > 0)
        .map(t => {
            let skorRole = {};
            semuaRole.forEach(role => {
                let pemainDiRole = t.roster.filter(p => p.role === role);
                skorRole[role] = pemainDiRole.length === 0
                    ? 0
                    : Math.floor(pemainDiRole.reduce((s,p)=>s+(p.ovr||60),0)/pemainDiRole.length);
            });
            let roleTermiskin = semuaRole.reduce((a,b) => skorRole[a]<skorRole[b]?a:b);
            let defisit = (t.power||70) - (skorRole[roleTermiskin]||0);
            return { tim: t, roleButuh: roleTermiskin, defisit, skorRole };
        })
        .filter(x => x.defisit >= 5) // Hanya tim yang punya gap signifikan
        .sort((a,b) => b.defisit - a.defisit);

    if (kandidatPembeli.length === 0) return;

    // Ambil yang paling butuh (atau random dari top-3 biar ada variasi)
    let idx = Math.floor(Math.random() * Math.min(3, kandidatPembeli.length));
    let { tim: timPembeli, roleButuh, skorRole: skorRolePembeli } = kandidatPembeli[idx];
    let ovrRoleSekarang = skorRolePembeli[roleButuh] || 0;

    // ================================================================
    // [CERDAS] Cari penjual yang punya pemain kelebihan di role itu
    // ================================================================
    let kandidatTransfer = [];
    semuaTimAI.forEach(timJual => {
        if (timJual.nama === timPembeli.nama) return;
        if (!timJual.roster || timJual.roster.length <= 5) return;

        let pemainDiRole = timJual.roster
            .filter(p => p.role === roleButuh && !p.isLoan && !p.sudahTransfer)
            .sort((a,b) => (b.ovr||0)-(a.ovr||0));

        // Penjual hanya mau jual kalau punya lebih dari 1 di role itu (bukan satu-satunya)
        if (pemainDiRole.length < 2) return;

        // Jual yang ke-2 terkuat (lindungi ace), tapi hanya kalau lebih bagus dari pembeli
        let target = pemainDiRole[1];
        if (!target || (target.ovr||0) <= ovrRoleSekarang + 2) return;

        // Jangan jual pemain OVR tertinggi di seluruh roster (ace sejati)
        let aceRoster = [...timJual.roster].sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0];
        if (target.nama === aceRoster?.nama) return;

        kandidatTransfer.push({ timJual, target });
    });

    if (kandidatTransfer.length === 0) return;

    // Pilih penjual terbaik (yang punya pemain paling upgrade untuk pembeli)
    kandidatTransfer.sort((a,b) => (b.target.ovr||0)-(a.target.ovr||0));
    let { timJual: timPenjual, target: pTarget } = kandidatTransfer[0];

    let hargaPasar = pTarget.harga || pTarget.gaji * 1.5 + 5000000;
    let hargaTransfer = Math.floor(hargaPasar * 1.3);

    // [PATCH] Tim yang kasnya cekak lebih milih PINJAM (15% harga) ketimbang
    // BELI permanen -- biar tim kecil bisa tetep nambal role kosong tanpa
    // harus punya kas segede tim besar.
    const kasReserveMinimal = 30000000;
    let pilihPinjam = (timPembeli.kas - hargaTransfer) < kasReserveMinimal;

    if (pilihPinjam) {
        let feePinjam = Math.floor(hargaPasar * 0.15);
        if (timPembeli.kas < feePinjam) return;

        timPembeli.kas -= feePinjam;
        timPenjual.kas += feePinjam;

        let idxRoster = timPenjual.roster.findIndex(x => x.nama === pTarget.nama);
        timPenjual.roster.splice(idxRoster, 1);
        pTarget.isLoan = true;
        pTarget.timAsli = timPenjual.nama;
        pTarget.durasiPinjam = 1;
        timPembeli.roster.push(pTarget);
        catatTransferRealTime(pTarget, timPembeli.nama, true);

        tambahBerita(
            `🧳 Pinjaman Cerdas AI: <span>${timPembeli.nama}</span> menambal kelemahan <b>${roleButuh}</b>-nya dengan meminjam <b>${pTarget.nama}</b> (OVR ${pTarget.ovr}) dari <span>${timPenjual.nama}</span> seharga Rp ${(feePinjam/1000000).toFixed(1)} Jt.`
        );
    } else {
        if (timPembeli.kas < hargaTransfer) return;

        timPembeli.kas -= hargaTransfer;
        timPenjual.kas += hargaTransfer;

        let idxRoster = timPenjual.roster.findIndex(x => x.nama === pTarget.nama);
        timPenjual.roster.splice(idxRoster, 1);
        pTarget.sisaKontrak = Math.floor(Math.random() * 2) + 2;
        pTarget.sudahTransfer = true;
        timPembeli.roster.push(pTarget);
        catatTransferRealTime(pTarget, timPembeli.nama, false);

        tambahBerita(
            `💸 Transfer Cerdas AI: <span>${timPembeli.nama}</span> menambal kelemahan <b>${roleButuh}</b>-nya dengan merekrut <b>${pTarget.nama}</b> (OVR ${pTarget.ovr}) dari <span>${timPenjual.nama}</span> seharga Rp ${(hargaTransfer/1000000).toFixed(1)} Jt.`
        );
    }

    // Penjual ganti rugi dari bursa atau akademi
    let kandidatDarurat = window.pilihPelapisTerbaik ? window.pilihPelapisTerbaik(roleButuh) : null;
    if (kandidatDarurat) {
        let rekruDarurat = pemainTransfer.splice(kandidatDarurat.idx, 1)[0];
        rekruDarurat.sisaKontrak = 2;
        timPenjual.roster.push(rekruDarurat);
    } else {
        timPenjual.roster.push({
            nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : ("Akademi " + timPenjual.nama.split(" ")[0]),
            role: roleButuh,
            ovr: Math.max(40, timPenjual.power - 8),
            umur: 17, sisaKontrak: 3, gaji: 3000000, harga: 8000000,
            negara: benderaAkademiUntukRegion(timPenjual.region), sifat: "Normal",
            mekanik: Math.max(35, timPenjual.power-10),
            makro: Math.max(35, timPenjual.power-10),
            mental: Math.max(35, timPenjual.power-10),
            stamina: Math.min(99, Math.max(50, timPenjual.power - 5 + Math.floor(Math.random() * 10))),
            spesialis: Math.max(35, timPenjual.power-10),
            potensi: Math.max(50, timPenjual.power)
        });
    }
}

// ================================================================
// [LEVEL 4] MANAJEMEN KONTRAK AI
// Tiap offseason, AI cek pemain bintangnya yang kontraknya mau habis
// dan otomatis perpanjang — biar gak kehilangan ace secara diam-diam.
// ================================================================
function prosesManajemenKontrakAI() {
    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    // [BUGFIX] Sebelumnya cuma 4 region MPL -- pemain di tim MDL/MAL/LEN
    // kontraknya gak pernah diproses (gak pernah diperpanjang/dilepas).
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegionAI.push(daftarTimLEN);

    semuaRegionAI.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer || !tim.roster) return;

            let rosterUrut = [...tim.roster].sort((a,b) => (b.ovr||0)-(a.ovr||0));

            rosterUrut.forEach((p, idx) => {
                if (p.sisaKontrak > 1) return; // Masih aman, skip

                // Top-3 pemain OVR tertinggi = inti tim, wajib diperpanjang
                let adalahInti = idx < 3;
                // Pemain biasa: perpanjang kalau OVR-nya di atas power rata-rata tim
                let layakPerpanjang = (p.ovr||0) >= (tim.power||65) - 3;

                if (adalahInti || layakPerpanjang) {
                    let biayaPerpanjang = Math.floor((p.gaji||3000000) * 1.1); // Naik 10%
                    if (tim.kas >= biayaPerpanjang * 2) { // Pastikan kas cukup
                        p.sisaKontrak = Math.floor(Math.random() * 2) + 2;
                        p.gaji = biayaPerpanjang;
                        if (adalahInti && idx === 0) {
                            tambahBerita(`📝 Perpanjang Kontrak: <span>${tim.nama}</span> amankan bintang utama <b>${p.nama}</b> dengan kontrak baru.`);
                        }
                    }
                }
                // Kalau gak diperpanjang, pemain akan dilepas saat offseason berjalan normal
            });
        });
    });
}

// ================================================================
// [LEVEL 4] ADAPTASI MID-SEASON (RESPONS LOSING STREAK)
// Kalau AI lagi losing streak ≥3x, tim melakukan tindakan nyata:
// - Coba rekrut darurat dari bursa
// - Rotasi starter (swap pemain OVR terbaik ke slot starter)
// - Berita "evaluasi" yang sebelumnya hanya teks kosong
// ================================================================
function prosesAdaptasiLosingStreakAI() {
    let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

    // [BUGFIX BONUS] Sama dgn fix2 lain di atas -- tim MDL/MAL/LEN
    // sebelumnya gak pernah dapat respons losing-streak (rotasi starter /
    // rekrut darurat) krn cuma 4 region MPL yg dicek.
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegionAI.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegionAI.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegionAI.push(daftarTimLEN);

    semuaRegionAI.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer || !tim.roster) return;

            let streak = tim.streakKalah || 0;
            if (streak < 3) return;

            // --- TINDAKAN 1: Rotasi Starter ---
            // Pastikan 5 pemain dengan OVR tertinggi jadi starter
            let sorted = [...tim.roster].sort((a,b) => (b.ovr||0)-(a.ovr||0));
            sorted.forEach((p, idx) => {
                p.isStarter = idx < 5;
            });

            // --- TINDAKAN 2: Rekrut Darurat dari Bursa (jika ada slot & kasnya cukup) ---
            if (streak >= 4 && pemainTransfer.length > 0 && tim.roster.length < 7) {
                const semuaRole = ["Roamer","Jungler","Midlaner","Goldlaner","EXP Laner"];
                let skorRole = {};
                semuaRole.forEach(role => {
                    let pr = tim.roster.filter(p => p.role === role);
                    skorRole[role] = pr.length === 0 ? 0
                        : Math.floor(pr.reduce((s,p)=>s+(p.ovr||60),0)/pr.length);
                });
                let roleTermiskin = semuaRole.reduce((a,b) => skorRole[a]<skorRole[b]?a:b);

                let kandidat = pemainTransfer
                    .filter(p => p.role === roleTermiskin && (p.harga||0) <= (tim.kas * 0.3))
                    .sort((a,b) => (b.ovr||0)-(a.ovr||0));

                if (kandidat.length > 0) {
                    let incaran = kandidat[0];
                    let harga = incaran.harga || incaran.gaji * 1.5;
                    tim.kas -= harga;
                    incaran.sisaKontrak = 2;
                    tim.roster.push(incaran);
                    pemainTransfer.splice(pemainTransfer.indexOf(incaran), 1);

                    tim.streakKalah = 0; // Reset streak setelah tindakan diambil
                    tim.alarmStreak3Ditampilkan = false;
                }
            }

            // FIX: dulu kondisi ini cuma `streak === 3`, jadi alarm yang sama
            // muncul berulang TIAP klik lewati 1 hari selama streak masih 3
            // (krn streakKalah cuma berubah pas tim itu beneran main lagi).
            // Sekarang dikasih flag biar cuma muncul SEKALI per kejadian streak.
            if (streak === 3 && !tim.alarmStreak3Ditampilkan) {
                tambahBerita(`⚠️ Alarm: <span>${tim.nama}</span> dalam tekanan berat setelah 3 kekalahan beruntun — manajemen rotasi starter.`);
                tim.alarmStreak3Ditampilkan = true;
            }
        });
    });
}

function tambahBerita(teksBerita) {
    let tgl =
        statusGame === "PRAMUSIM" ? "Off-Season" : `S${musimKe}-W${mingguKe}`;
    bankBerita.unshift({ tanggal: tgl, teks: teksBerita });

    // Ganti batasnya dari 3 jadi 50 biar bisa nampung banyak di dalam modal
    if (bankBerita.length > 50) bankBerita.pop();
    renderBerita();
}

function dapetTanggalTeks() {
    return kalenderGame.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}
// AI GENERATOR: Otomatis ngisi skuad musuh pakai NAMA REAL LIFE!
// --- RUMUS HARGA PASAR DINAMIS v2 ---
// Indikator: OVR (base) + Potensi + Umur (sync retirement chance) + Prestasi (trofi per-region) + Sisa Kontrak
// [FIX] Blok ini DIPINDAH ke sini (sebelum generateRosterAIAwal) karena
// sebelumnya taruh jauh di bawah dengan const -- generateRosterAIAwal()
// dipanggil duluan pas game load, jadi BREAKPOINT_HARGA_OVR dkk masih
// "belum diinisialisasi" (temporal dead zone) pas diakses -> ReferenceError.

// 1. Base value dari OVR, interpolasi linear antar breakpoint (kurva mulus, gak patah per-bracket)
const BREAKPOINT_HARGA_OVR = [
    { ovr: 1,  harga: 5000000 },
    { ovr: 20, harga: 15000000 },
    { ovr: 40, harga: 25000000 },
    { ovr: 50, harga: 30000000 },
    { ovr: 60, harga: 45000000 },
    { ovr: 70, harga: 75000000 },
    { ovr: 80, harga: 140000000 },
    { ovr: 90, harga: 240000000 },
    { ovr: 99, harga: 400000000 },
];

function hitungBaseValueOVR(ovr) {
    ovr = Math.max(1, Math.min(99, ovr || 1));
    let bp = BREAKPOINT_HARGA_OVR;
    for (let i = 0; i < bp.length - 1; i++) {
        let a = bp[i], b = bp[i + 1];
        if (ovr >= a.ovr && ovr <= b.ovr) {
            let t = (ovr - a.ovr) / (b.ovr - a.ovr);
            return a.harga + (b.harga - a.harga) * t;
        }
    }
    return bp[bp.length - 1].harga;
}

// 2. Faktor Potensi (gap potensi-ovr, self-regulating karena gap ngecil sendiri seiring prosesPerkembanganPemain)
function hitungFaktorPotensi(p) {
    let gap = Math.max(0, (p.potensi || p.ovr || 0) - (p.ovr || 0));
    return 1 + (gap * 0.03);
}

// 3. Chance pensiun (usia + jarang dimainkan). Field p.jarangDimainkanBonus disiapkan buat
//    nanti di-isi sistem tracking jam main per musim (belum wired, default 0 dulu).
const TABEL_CHANCE_PENSIUN_USIA = {
    26: 10, 27: 20, 28: 30, 29: 40, 30: 50,
    31: 65, 32: 80, 33: 95, 34: 100,
};

function hitungChancePensiun(p) {
    let umur = p.umur || 0;
    if (umur < 26) return 0;
    let baseChance = TABEL_CHANCE_PENSIUN_USIA[umur] !== undefined
        ? TABEL_CHANCE_PENSIUN_USIA[umur]
        : (umur > 34 ? 100 : 0);
    let bonusJarangMain = p.jarangDimainkanBonus || 0; // +5%/musim, reset tiap 2 musim (belum wired)
    return Math.min(100, baseChance + bonusJarangMain);
}

// 4. Faktor Umur (≤25 pakai bracket wonderkid, ≥26 sync sama chance pensiun)
function hitungMultiplierUsia(umur, chancePensiun) {
    if (umur <= 19) return 2.5;
    if (umur <= 22) return 1.8;
    if (umur <= 25) return 1.3;
    let m = 1.2 - (chancePensiun / 100) * 0.9;
    return Math.max(0.3, Math.min(1.2, m));
}

// 5. Faktor Prestasi (trofi per-region/tier, TANPA MVP karena MVP masih random)
const BOBOT_TROFI = {
    mSeries: 0.35,
    msc: 0.25,
    mpl: { ID: 0.15, PH: 0.15, MY: 0.10, SG: 0.10, other: 0.06 },
    mdl: 0.08,
    len: 0.03,
};

function hitungFaktorPrestasi(trofi) {
    trofi = trofi || {};
    let bonus = (trofi.mSeries || 0) * BOBOT_TROFI.mSeries
              + (trofi.msc || 0) * BOBOT_TROFI.msc
              + (trofi.mdl || 0) * BOBOT_TROFI.mdl
              + (trofi.len || 0) * BOBOT_TROFI.len;

    // [FIX] Iterasi dari key yang BENERAN ada di trofi.mpl pemain (bukan cuma
    // key yang punya bobot sendiri di BOBOT_TROFI.mpl), biar region Tier 2
    // yang sekarang dicatat pakai kode aslinya sendiri-sendiri (KH/MM/MENA/
    // TR/EECA/EA/AM/IN/WEU) tetap kehitung -- pakai bobot .other buat semua
    // region yang gak punya bobot spesifik (sama kayak sebelumnya, gak ada
    // perubahan besaran harga).
    let mpl = trofi.mpl || {};
    for (let region in mpl) {
        let bobotRegion = (BOBOT_TROFI.mpl[region] !== undefined) ? BOBOT_TROFI.mpl[region] : BOBOT_TROFI.mpl.other;
        bonus += (mpl[region] || 0) * bobotRegion;
    }
    return 1 + bonus;
}

// 6. Faktor Sisa Kontrak (makin mepet, makin didiskon - risiko bosman)
function hitungFaktorKontrak(sisaKontrak) {
    sisaKontrak = sisaKontrak === undefined ? 2 : sisaKontrak;
    if (sisaKontrak <= 0) return 0.35;
    if (sisaKontrak === 1) return 0.55;
    if (sisaKontrak === 2) return 0.80;
    if (sisaKontrak === 3) return 0.95;
    return 1.0;
}

// --- FUNGSI UTAMA ---
function hitungHargaPasar(p) {
    let baseValue = hitungBaseValueOVR(p.ovr);
    let faktorPotensi = hitungFaktorPotensi(p);
    let chancePensiun = hitungChancePensiun(p);
    let multiplierUsia = hitungMultiplierUsia(p.umur, chancePensiun);
    let faktorPrestasi = hitungFaktorPrestasi(p.trofi);
    let faktorKontrak = hitungFaktorKontrak(p.sisaKontrak);

    let harga = baseValue * faktorPotensi * multiplierUsia * faktorPrestasi * faktorKontrak;

    // Minimum 1 Juta biar nggak ada pemain harga 0
    return Math.max(Math.floor(harga), 1000000);
}

function generateRosterAIAwal() {
    let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];

    // FIX: tambahkan tim MDL & LEN supaya dapat roster+staff permanen di awal,
    // bukan cuma dummy instan saat pertandingan. Power-based, sama seperti MPL.
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined") semuaRegion.push(daftarTimMDL_Afiliasi_ID);
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegion.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined") semuaRegion.push(daftarTimMDL_Afiliasi_PH);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegion.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") semuaRegion.push(daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegion.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegion.push(daftarTimLEN);

    // [MSC x EWC 2026 - FASE 1] 9 region baru single-tier
    if (typeof daftarTimKH !== "undefined") semuaRegion.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegion.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegion.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegion.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegion.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegion.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegion.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegion.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegion.push(daftarTimWEU);

    let roles = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];

    // Fallback kalau timnya gak ada di kamus di atas (kayak tim SG atau tier 2)
    let fallbackNames = [
        "Zey",
        "Ken",
        "Ry",
        "San",
        "Boy",
        "Lex",
        "Fin",
        "Tzy",
        "Lin",
        "Ben"
    ];

    semuaRegion.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return; // Skip tim kita sendiri

            let dataTim = dataReal[tim.nama]; // Cari di kamus

            if (!tim.reputasi) {
                // Tarik reputasi dari kamus. Kalau timnya gak ada (contoh: tim SG/custom), set ke 50 (Medioker)
                tim.reputasi =
                    dataTim && dataTim.reputasi ? dataTim.reputasi : 50;
            }

            // Generate Skuad Musuh
            if (!tim.roster) {
                tim.roster = [];
                for (let i = 0; i < 5; i++) {
                    let namaPemain = dataTim
                        ? dataTim.roster[i]
                        : (typeof generateNicknameEsports === "function"
                            ? generateNicknameEsports()
                            : fallbackNames[Math.floor(Math.random() * fallbackNames.length)] + Math.floor(Math.random() * 99));
                    let pemainBaru = {
                        nama: namaPemain,
                        role: roles[i],
                        ovr: tim.power + (Math.floor(Math.random() * 6) - 3),
                        umur: Math.floor(Math.random() * 8) + 18, // Umur acak 18-25
                        sisaKontrak: Math.floor(Math.random() * 3) + 1, // Kontrak 1-3 musim
                        negara: dataTim
                            ? ambilBenderaPemainReal(namaPemain, TIM_REGION_MAP[tim.nama])
                            : "🌐 Global",
                        sifat: "Normal"
                    };
                    // [FIX] SEBELUMNYA harga/gaji pemain AI cuma pake rumus flat
                    // dari tim.power (mis. power 90 -> harga cuma Rp17,2 Jt),
                    // gak nyambung ke OVR asli si pemain. Sekarang dari awal
                    // generate langsung pake hitungHargaPasar() yang sama
                    // dipakai buat semua recalculation lain di game ini.
                    pemainBaru.harga = hitungHargaPasar(pemainBaru);
                    pemainBaru.gaji = Math.floor(pemainBaru.harga * 0.15);
                    tim.roster.push(pemainBaru);
                }
            }

            // Generate Coach
            if (!tim.staff) {
                // FAIRNESS FIX: buffPower staff AI dihitung dari power tim,
                // biar tim kuat (ONIC, TLID dll) dapet bonus staff lebih besar
                // daripada tim lemah (RRQ, NAVI dll), bukan nilai flat sama semua.
                let buffPelatihAI =
                    tim.power >= 85
                        ? 4
                        : tim.power >= 80
                          ? 3
                          : tim.power >= 75
                            ? 2
                            : 1;
                let buffAsistenAI = Math.max(1, buffPelatihAI - 1);

                tim.staff = {
                    pelatih: {
                        nama: dataTim
                            ? dataTim.pelatih
                            : (typeof generateNicknameEsports === "function" ? generateNicknameEsports() : "Coach " + tim.nama.split(" ")[0]),
                        role: "Pelatih",
                        sisaKontrak: 2,
                        buffPower: buffPelatihAI,
                        gaji: buffPelatihAI * 3000000 + 5000000,
                        harga: (buffPelatihAI * 3000000 + 5000000) * 1.2,
                        umur: Math.floor(Math.random() * 15) + 30
                    },
                    asisten:
                        dataTim && dataTim.asisten && dataTim.asisten !== "-"
                            ? {
                                  nama: dataTim.asisten,
                                  role: "Asisten Pelatih",
                                  sisaKontrak: 2,
                                  buffPower: buffAsistenAI,
                                  gaji: buffAsistenAI * 2500000 + 4000000,
                                  umur: Math.floor(Math.random() * 12) + 28
                              }
                            : null,
                    // Tim bereputasi tinggi langsung punya analis, lainnya kosong
                    analis: (tim.reputasi || 50) >= 75
                        ? {
                              nama: (typeof generateNicknameEsports === "function" ? generateNicknameEsports() : "Analis " + tim.nama.split(" ")[0]),
                              role: "Analis",
                              sisaKontrak: 2,
                              buffPower: Math.max(1, buffAsistenAI - 1),
                              gaji: 7000000 + Math.floor(Math.random() * 3000000),
                              umur: Math.floor(Math.random() * 10) + 25
                          }
                        : null
                };
            }

            // Riwayat Bawaan (Pre-Season)
            if (!tim.riwayatLama) {
                tim.riwayatLama = [];
            }
        });
    });
}
// Langsung jalanin pas game dibuka
generateRosterAIAwal();

// ==========================================
// SISTEM ATRIBUT STAFF BARU
// ==========================================

// Fungsi buat ngisi atribut saat staff baru dibikin
function generateAtributStaff(role) {
    let attr = {};
    // Bikin angka random antara 60 sampai 95 biar staffnya guna
    let randAngka = () => Math.floor(Math.random() * 36) + 60;

    if (role === "Pelatih") {
        attr = {
            drafting: randAngka(),
            leadership: randAngka(),
            adaptation: randAngka(),
            discipline: randAngka()
        };
    } else if (role === "Asisten Pelatih" || role === "Asisten") {
        attr = {
            training: randAngka(),
            motivation: randAngka(),
            communication: randAngka(),
            development: randAngka()
        };
    } else if (role === "Analis") {
        attr = {
            oppAnalysis: randAngka(),
            dataAnalysis: randAngka(),
            strategy: randAngka(),
            metaReading: randAngka()
        };
    }
    return attr;
}

// Fungsi patching otomatis: ngecek semua staff yang udah ada di game
// Kalau mereka belum punya atribut, langsung dikasih!
function lengkapiSemuaAtributStaff() {
    let cekDanIsi = staff => {
        if (staff && !staff.atribut) {
            staff.atribut = generateAtributStaff(staff.role);
        }
    };

    // 1. Cek Staff Kita
    if (staffKita) {
        cekDanIsi(staffKita.pelatih);
        cekDanIsi(staffKita.asisten);
        cekDanIsi(staffKita.analis);
    }

    // 2. Cek Staff di Bursa Transfer
    if (typeof bursaStaff !== "undefined") {
        bursaStaff.forEach(s => cekDanIsi(s));
    }

    // 3. Cek Staff Tim AI
    let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    semuaRegion.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return; // Staf kita sendiri, skip

            if (tim.staff) {
                cekDanIsi(tim.staff.pelatih);
                cekDanIsi(tim.staff.asisten);
                cekDanIsi(tim.staff.analis);

                // FAIRNESS FIX: Patch save lama -> kasih buffPower
                // berdasarkan power tim, bukan fallback flat di simulasi.
                let buffPelatihAI =
                    tim.power >= 85
                        ? 4
                        : tim.power >= 80
                          ? 3
                          : tim.power >= 75
                            ? 2
                            : 1;
                let buffAsistenAI = Math.max(1, buffPelatihAI - 1);

                if (tim.staff.pelatih && tim.staff.pelatih.buffPower === undefined) {
                    tim.staff.pelatih.buffPower = buffPelatihAI;
                }
                if (tim.staff.asisten && tim.staff.asisten.buffPower === undefined) {
                    tim.staff.asisten.buffPower = buffAsistenAI;
                }
            }
        });
    });
}

// Fungsi untuk Nampilin Atribut ke HTML pas Modal Staff dibuka
// (Panggil fungsi ini di dalam fungsi window.bukaProfilStaff lu nanti)
function renderAtributUIStaff(staff) {
    let container = document.getElementById("profilStaffAtribut");
    if (!container || !staff || !staff.atribut) return;

    let html = "";
    if (staff.role === "Pelatih") {
        html = `
            <div style="display:flex; justify-content: space-between;"><span>Drafting:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.drafting}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Leadership:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.leadership}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Adaptation:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.adaptation}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Discipline:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.discipline}</span></div>
        `;
    } else if (staff.role === "Asisten Pelatih" || staff.role === "Asisten") {
        html = `
            <div style="display:flex; justify-content: space-between;"><span>Training:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.training}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Motivation:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.motivation}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Communication:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.communication}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Development:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.development}</span></div>
        `;
    } else if (staff.role === "Analis") {
        html = `
            <div style="display:flex; justify-content: space-between;"><span>Opp. Analysis:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.oppAnalysis}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Data Analysis:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.dataAnalysis}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Strategy:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.strategy}</span></div>
            <div style="display:flex; justify-content: space-between;"><span>Meta Reading:</span> <span style="color:#12151C; font-weight:bold;">${staff.atribut.metaReading}</span></div>
        `;
    }
    container.innerHTML = html;
}

// Jalankan patch otomatis ini sekali pas game nge-load
setTimeout(lengkapiSemuaAtributStaff, 1000);

function dapetTanggalPendek(tglStr) {
    let d = new Date(tglStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// [FIX] Buat nampilin "Rabu, 10 Juni 2026" -- dipakai buat proyeksi
// tanggal match liga LEN/MDL/MAL yang gak punya tanggalRaw fix per match.
function dapetHariTanggalLengkap(tglStr) {
    let d = new Date(tglStr);
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ------------------------------------------------------------------
// [FIX] Label subtitle fase musim (dipasang di bawah header "STATUS
// MUSIM"). Dihitung SEKALI per render, terpisah dari logika matchup
// widgetJadwalData -- baca state global (statusGame, mingguKe,
// playoffFase, window.mscEwcState, window.m7State) buat nentuin
// fase spesifik yang sedang/segera berjalan. READ ONLY, gak nyimulasiin apapun.
// ------------------------------------------------------------------
function hitungLabelFaseMusim() {
    if (typeof statusGame === "undefined") return "";

    // Cari label pertama yang flag-nya BELUM true di sebuah urutan tahap
    // [flag, label] -- artinya itu tahap yang lagi/segera berjalan.
    // Kalau semua flag udah true, balikin label terakhir (tahap final).
    function _cariTahapAktif(st, urutan) {
        if (!st) return urutan[0][1];
        for (let i = 0; i < urutan.length; i++) {
            if (!st[urutan[i][0]]) return urutan[i][1];
        }
        return urutan[urutan.length - 1][1];
    }

    switch (statusGame) {
        case "PRAMUSIM":
            return "Pra-Musim";
        case "OFFSEASON":
            return "Off-Season";
        case "MID_SEASON":
            return "Mid-Season Break";
        case "JEDA_TRANSFER":
            return "Bursa Transfer Terbuka";
        case "JEDA_PLAYOFF":
            return "Jeda Pra-Playoff";
        case "JEDA_MSC":
        case "JEDA_MSC_EWC":
            return "Persiapan MSC";
        case "JEDA_MSERIES":
        case "JEDA_M7":
            return `Persiapan M${edisiMSeries || 1} World Championship`;
        case "REGULER": {
            // [FIX] mingguKe itu counter GLOBAL yang jalan terus dari mdlMulai
            // (9 Feb) tanpa peduli liga -- direset ke 1 cuma pas kalenderGame
            // PERTAMA KALI mencapai mplLenMulai, dan reset itu baru kejadian
            // di proses klik "Hari Berikutnya" (bukan saat render). Akibatnya,
            // di HARI PERTAMA mplLenMulai sendiri (sebelum diklik), mingguKe
            // masih nunjukin sisa hitungan MDL (mis. W7) padahal buat MPL/LEN/MAL
            // itu Week 1. Makanya dihitung ULANG dari tanggal, independen dari
            // mingguKe, biar selalu akurat per-liga.
            let _liga = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
            let _tblReg = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;

            // [FIX] Player MPL/LEN/MAL masih di fase transisi (MDL udah
            // jalan dari 9 Feb, tapi liga mereka sendiri belum mulai sampai
            // mplLenMulai/27 Mar) -- widget matchup di bawahnya nampilin
            // "🏕️ PRA-MUSIM" buat fase ini (lihat ui.js), jadi subtitle
            // header WAJIB samain, JANGAN numpang tampilin sisa hitungan
            // minggu MDL yang gak relevan buat liga player.
            if (_liga !== "MDL" && _tblReg && _tblReg.mplLenMulai && typeof kalenderGame !== "undefined" &&
                typeof tanggalSetelahAtauSama === "function" && !tanggalSetelahAtauSama(kalenderGame, _tblReg.mplLenMulai)) {
                return "Pra-Musim";
            }

            let _mgg = (typeof mingguKe !== "undefined") ? mingguKe : 1;
            if (_tblReg && typeof kalenderGame !== "undefined") {
                // MPL/LEN/MAL sama-sama gerbang mplLenMulai (lihat proyeksiTanggalMatchNonMPL).
                let _startLiga = (_liga === "MDL") ? _tblReg.mdlMulai : _tblReg.mplLenMulai;
                if (_startLiga) {
                    let _diffHari = Math.floor((kalenderGame - new Date(_startLiga)) / 86400000);
                    if (_diffHari >= 0) _mgg = Math.floor(_diffHari / 7) + 1;
                }
            }
            return `Week ${_mgg} Regular Season`;
        }
        case "PLAYOFF": {
            let _liga = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
            if (_liga === "LEN") return "Playoff Promosi";
            if (_liga === "MDL" || _liga === "MAL") return "Playoff Degradasi";
            let _faseMap = {
                1: "Play-In",
                2: "Upper Bracket Semifinal",
                3: "Upper Bracket Final & Lower Bracket Semifinal",
                4: "Lower Bracket Final",
                5: "Grand Final"
            };
            return (typeof playoffFase !== "undefined" && _faseMap[playoffFase]) || "Playoff";
        }
        case "MSC":
        case "MSC_EWC": {
            let st = window.mscEwcState;
            if (st && st.gfDone) return "Grand Final";
            // [FIX] Sebelumnya referensi ke flag "wcGauntlet"/"wcFinal" yang
            // GAK PERNAH ada di window.mscEwcState (flag asli namanya
            // wcGauntletLeg1/2 & wcFinalLeg1/2) -- karena _cariTahapAktif
            // berhenti di flag pertama yang falsy, label ini permanen
            // "nyangkut" di "Wild Card - Final Bracket (Day 4)" bahkan pas
            // udah masuk Group Stage/Knockout. Sekalian disinkronin sama
            // flag day-pacing baru (WC 4 hari, Group Stage 5 hari per-grup).
            let _urutanMSC = [
                ["wcMulai",        "Wild Card - Day 2"],
                ["wcDay2",         "Wild Card - Gauntlet (Day 3)"],
                ["wcGauntletLeg2", "Wild Card - Final Bracket (Day 4)"],
                ["wcFinalLeg2",    "Group Stage - Grup A Round 1"],
                ["gsMulai",        "Group Stage - Grup B Round 1"],
                ["gsR1B",          "Group Stage - Grup A Round 2"],
                ["gsR2A",          "Group Stage - Grup B Round 2"],
                ["gsR2B",          "Group Stage - Round 3 (Grup A & B)"],
                ["gsR3",           "Knockout Stage - Quarterfinal"],
                ["koMulai",        "Knockout Stage - Quarterfinal"],
                ["koQf",           "Knockout Stage - Semifinal"],
                ["koSf",           "Knockout Stage - Perebutan Juara 3"],
                ["koJuara3",       "Grand Final"]
            ];
            return _cariTahapAktif(st, _urutanMSC);
        }
        case "MSERIES":
        case "M7": {
            let st = window.m7State;
            if (st && st.gfDone) return "Grand Final";
            let _urutanM7 = [
                ["wcMulai",    "Wild Card - Day 1"],
                ["wcDay1",     "Wild Card - Day 2"],
                ["wcDay2",     "Wild Card - Day 3"],
                ["wcDay3",     "Wild Card - Kualifikasi"],
                ["wcQualif",   "Swiss Stage - Round 1"],
                ["swMulai",    "Swiss Stage - Round 1"],
                ["swR1",       "Swiss Stage - Round 2"],
                ["swR2",       "Swiss Stage - Round 3"],
                ["swR3a",      "Swiss Stage - Round 3 (Lanjutan)"],
                ["swR3b",      "Swiss Stage - Round 4"],
                ["swR4",       "Swiss Stage - Round 5"],
                ["swR5",       "Knockout Stage - Upper Bracket QF"],
                ["koMulai",    "Knockout Stage - Upper Bracket QF"],
                ["koUbqf",     "Knockout Stage - Lower Bracket R1"],
                ["koLbr1",     "Knockout Stage - Upper Bracket SF"],
                ["koUbsf",     "Knockout Stage - Lower Bracket R2"],
                ["koLbr2",     "Knockout Stage - Upper Bracket Final"],
                ["koUbfinal",  "Knockout Stage - Lower Bracket R3"],
                ["koLbr3",     "Knockout Stage - Lower Bracket Final"],
                ["koLbfinal",  "Grand Final"]
            ];
            return _cariTahapAktif(st, _urutanM7);
        }
        case "JUARA":
            return "Musim Berakhir";
        default:
            return "";
    }
}
window.hitungLabelFaseMusim = hitungLabelFaseMusim;


// --- PENCATATAN TROFI PEMAIN (buat faktor Prestasi di hitungHargaPasar) ---
// Dipanggil sekali tiap kali sebuah tim resmi jadi juara di titik-titik akhir musim.
// jenisTrofi: "mSeries" | "msc" | "mpl" | "mdl" | "len"
// regionKode dipakai KHUSUS kalau jenisTrofi === "mpl": salah satu dari 13
// kode region MPL ("ID"|"PH"|"MY"|"SG"|"KH"|"MM"|"MENA"|"TR"|"EECA"|"EA"|
// "AM"|"IN"|"WEU"), atau "other" (dipertahankan cuma buat backward-compat
// sama save lama yang udah kadung nyimpen trofi Tier-2 non-SG digabung jadi
// satu, dari SEBELUM tiap region dapet key sendiri-sendiri).
// [FIX] Dulu semua region Tier 2 selain SG (KH/MM/MENA/TR/EECA/EA/AM/IN/WEU)
// di-hardcode "other" pas manggil fungsi ini dari m7_engine.js/msc_ewc_engine.js,
// padahal kode region aslinya (`kode`) udah tersedia di titik pemanggilan --
// makanya trofi MPL-nya ketiban ke 1 label ambigu "MPL Region Lain" yang gak
// jelas asalnya dari region mana. Sekarang tiap region dicatat pakai kode
// aslinya sendiri-sendiri.
const GPR_SEMUA_KODE_MPL = ["ID", "PH", "MY", "SG", "KH", "MM", "MENA", "TR", "EECA", "EA", "AM", "IN", "WEU"];
function catatTrofiPemain(timJuara, jenisTrofi, regionKode) {
    if (!timJuara || !Array.isArray(timJuara.roster)) return;

    timJuara.roster.forEach(p => {
        if (!p.trofi) {
            p.trofi = { mSeries: 0, msc: 0, mpl: { ID: 0, PH: 0, MY: 0, SG: 0, other: 0 }, mdl: 0, len: 0 };
        }
        if (jenisTrofi === "mpl") {
            if (!p.trofi.mpl) p.trofi.mpl = { ID: 0, PH: 0, MY: 0, SG: 0, other: 0 };
            let key = GPR_SEMUA_KODE_MPL.includes(regionKode) ? regionKode : "other";
            p.trofi.mpl[key] = (p.trofi.mpl[key] || 0) + 1;
        } else if (jenisTrofi === "mSeries" || jenisTrofi === "msc" || jenisTrofi === "mdl" || jenisTrofi === "len") {
            p.trofi[jenisTrofi] = (p.trofi[jenisTrofi] || 0) + 1;
        }

        // Harga langsung diupdate biar efek trofi kerasa seketika, bukan nunggu OVR berubah
        p.harga = hitungHargaPasar(p);
    });
}
window.catatTrofiPemain = catatTrofiPemain;

function cekPeluangDitawarAI(pemain) {
    // 1. Base probabilitas sangat kecil kalau pemain nggak diapa-apain (cuma 5%)
    let peluang = 0.05;

    // 2. Cek apakah pemain masuk daftar jualan/pinjaman tim lu
    if (pemain.statusTransfer === "TRANSFER") {
        peluang += 0.55; // Peluang naik 50% kalau sengaja dijual
    } else if (pemain.statusTransfer === "PINJAM") {
        peluang += 0.65; // Peluang naik 40% kalau dipinjamkan
    }

    // 3. Cek Grafik Performa (Naik atau Turun)
    // Asumsi lu nyimpen history OVR di array (misal: pemain.historyOvr = [42, 43, 44])
    if (pemain.historyOvr && pemain.historyOvr.length >= 2) {
        let ovrSekarang = pemain.historyOvr[pemain.historyOvr.length - 1];
        let ovrSebelumnya = pemain.historyOvr[pemain.historyOvr.length - 2];

        if (ovrSekarang > ovrSebelumnya) {
            peluang += 0.3; // Kalau grafik lagi NAIK, AI makin nafsu (+30%)
        } else if (ovrSekarang < ovrSebelumnya) {
            peluang -= 0.15; // Kalau grafik TURUN, AI males (-15%)
        }
    }

    // Pastikan peluang nggak lebih dari 100% (1.0) dan nggak minus
    if (peluang > 1.0) peluang = 1.0;
    if (peluang < 0) peluang = 0;

    return peluang;
}

function prosesPerkembanganPemain() {
    rosterKita.forEach(p => {
        let sifat = p.sifat ? p.sifat : "Normal";
        let umur = p.umur;
        let oldOvr = p.ovr;

        // --- 🎲 SISTEM RNG POTENSI (DINAMIS) ---
        // Fungsi ini jalan tiap 4 match, jadi kita kasih peluang kecil (sekitar 3-4%)
        let rngPotensi = Math.random();

        if (rngPotensi < 0.04 && p.potensi > p.ovr + 2) {
            // 4% Peluang Flop / Burnout -> Potensi maksimalnya tiba-tiba turun
            let drop = Math.floor(Math.random() * 3) + 1; // Turun 1-3 poin
            p.potensi -= drop;

            // Munculin berita biar manajer tahu ada yang nggak beres
            if (Math.random() > 0.4) {
                tambahBerita(
                    `📉 Kabar Buruk: Tim pelatih melihat penurunan motivasi pada <span>${p.nama}</span>. Potensi maksimalnya diprediksi menurun.`
                );
            }
        } else if (rngPotensi > 0.96 && p.potensi < 95) {
            // 4% Peluang Breakthrough -> Potensi maksimalnya nembus limit (naik)
            let up = Math.floor(Math.random() * 3) + 1; // Naik 1-3 poin
            p.potensi += up;

            if (Math.random() > 0.4) {
                tambahBerita(
                    `🔥 Breakthrough: <span>${p.nama}</span> menunjukkan bakat luar biasa di sesi latihan. Batas potensinya meningkat pesat.`
                );
            }
        }
        // ----------------------------------------

        let chanceTurun = 0;
        if (umur >= 30) chanceTurun = 0.25;
        else if (umur >= 27) chanceTurun = 0.1;

        // ... (Biarkan sisa kode di bawahnya tetap sama seperti aslinya)
        if (Math.random() < chanceTurun) {
            let statAcak = Math.floor(Math.random() * 4);
            if (statAcak === 0 && p.mekanik > 30) p.mekanik--;
            else if (statAcak === 1 && p.makro > 30) p.makro--;
            else if (statAcak === 2 && p.mental > 30) p.mental--;
            else if (statAcak === 3 && p.spesialis > 30) p.spesialis--;

            p.ovr = hitungOVRDatabase(p);
            p.trendText = "📉 Menurun";
            p.trendColor = "#E5484D";
        } else {
            let gap = p.potensi - p.ovr;
            if (gap > 0) {
                let peluangNaik =
                    sifat === "Pekerja Keras"
                        ? 0.85
                        : sifat === "Malas"
                          ? 0.2
                          : 0.5;
                if (Math.random() <= peluangNaik) {
                    let poinDidapat = Math.floor(Math.random() * 2) + 1;
                    for (let i = 0; i < poinDidapat; i++) {
                        let statAcak = Math.floor(Math.random() * 4);
                        if (statAcak === 0 && p.mekanik < 99) p.mekanik++;
                        else if (statAcak === 1 && p.makro < 99) p.makro++;
                        else if (statAcak === 2 && p.mental < 99) p.mental++;
                        else if (statAcak === 3 && p.spesialis < 99)
                            p.spesialis++;
                    }
                    p.ovr = hitungOVRDatabase(p);
                    let selisihOvr = p.ovr - oldOvr;
                    if (selisihOvr > 0)
                        p.trendText = `📈 Naik (+${selisihOvr})`;
                    else p.trendText = "↗️ Berkembang";
                    p.trendColor = "#00B37E";
                } else {
                    p.trendText = "➖ Stagnan";
                    p.trendColor = "#888";
                }
            } else {
                p.trendText = "⭐ Puncak Potensi";
                p.trendColor = "#5B3DF5";
            }
        }

        // --- SIMPAN KE RIWAYAT GRAFIK ---
        if (!p.historyOvr) p.historyOvr = [oldOvr];
        p.historyOvr.push(p.ovr);
        // Maksimal 15 titik aja biar grafiknya nggak keramean
        if (p.historyOvr.length > 15) p.historyOvr.shift();
        // <--- UPDATE HARGA PASAR SAAT OVR BERUBAH --->
        p.harga = hitungHargaPasar(p);
        p.gaji = Math.floor(p.harga * 0.15); // Gaji otomatis disesuaikan 15% dari harga pasar
    });
}

// ==========================================
// FAIRNESS FIX: PERKEMBANGAN ROSTER TIM AI
// ==========================================
// Versi simpel dari prosesPerkembanganPemain, tapi buat roster AI.
// Tim AI gak punya stat mekanik/makro/mental/spesialis/potensi seperti
// rosterKita, jadi pertumbuhan/penurunan OVR-nya dihitung langsung
// berdasarkan umur pemain, biar tim AI juga "hidup" & berkembang
// seiring waktu, sama seperti tim player.
function prosesPerkembanganRosterAI() {
    // FIX FASE 15: sebelumnya cuma 4 database MPL, jadi tim AI di
    // MDL/MAL/LEN tidak pernah dapat perkembangan roster (OVR mereka
    // statis selamanya). Sekarang mencakup semua liga.
    let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimMDL_Independen_ID !== "undefined") semuaRegion.push(daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") semuaRegion.push(daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") semuaRegion.push(daftarTimMAL_Challenger_MY);
    if (typeof daftarTimLEN !== "undefined") semuaRegion.push(daftarTimLEN);

    // [MSC x EWC 2026 - FASE 1] 9 region baru single-tier -- tanpa ini,
    // pemain di region baru gak akan pernah menua/berkembang OVR-nya.
    if (typeof daftarTimKH !== "undefined") semuaRegion.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegion.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegion.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegion.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegion.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegion.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegion.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegion.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegion.push(daftarTimWEU);
    // Catatan: tim Afiliasi (MDL_Afiliasi_ID/PH, MAL_Affiliated_MY) SENGAJA
    // tidak diproses di sini -- roster mereka dikelola lewat sistem Akademi
    // (Fase 16), bukan perkembangan natural ala tim independen/MPL.

    semuaRegion.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return; // Skip tim kita sendiri
            if (!tim.roster || tim.roster.length === 0) return;

            tim.roster.forEach(p => {
                let umur = p.umur || 22;
                let oldOvr = p.ovr;
                let chanceTurun = 0;

                if (umur >= 30) chanceTurun = 0.25;
                else if (umur >= 27) chanceTurun = 0.1;

                if (Math.random() < chanceTurun) {
                    // Performa menurun karena faktor usia
                    if (p.ovr > 50) p.ovr -= 1;
                } else {
                    // Peluang berkembang, makin muda makin besar peluangnya
                    let peluangNaik =
                        umur <= 21
                            ? 0.4
                            : umur <= 24
                              ? 0.25
                              : umur <= 27
                                ? 0.12
                                : 0.05;

                    if (Math.random() < peluangNaik && p.ovr < 99) {
                        p.ovr += 1;
                    }
                }

                // Update harga pasar & gaji kalau OVR berubah
                if (p.ovr !== oldOvr) {
                    p.harga = hitungHargaPasar(p);
                    p.gaji = Math.floor(p.harga * 0.15);
                }

                // --- SIMPAN KE RIWAYAT GRAFIK & TREND (parity sama prosesPerkembanganPemain) ---
                // Sebelumnya historyOvr/trendText cuma di-update buat roster kita sendiri,
                // jadi pemain AI yang ditransfer ke tim kita grafiknya keliatan kosong.
                if (!p.historyOvr) p.historyOvr = [oldOvr];
                p.historyOvr.push(p.ovr);
                if (p.historyOvr.length > 15) p.historyOvr.shift();

                if (p.ovr > oldOvr) {
                    p.trendText = `📈 Naik (+${p.ovr - oldOvr})`;
                    p.trendColor = "#00B37E";
                } else if (p.ovr < oldOvr) {
                    p.trendText = "📉 Menurun";
                    p.trendColor = "#E5484D";
                } else {
                    p.trendText = "➖ Stagnan";
                    p.trendColor = "#888";
                }

                // FIX: Decay & recovery mental+stamina AI
                // Dipanggil tiap 4 match (sama frekuensi dengan prosesPerkembanganRosterAI)
                // -- init kalau belum ada --
                if (p.stamina === undefined) p.stamina = Math.min(99, Math.max(50, (p.ovr || 70)));
                if (p.mental  === undefined) p.mental  = Math.min(99, Math.max(35, (p.ovr || 70) - 5));

                // Stamina: tim yang baru banyak main lebih lelah
                // Gunakan matchW+matchL sebagai proxy aktivitas
                let totalMatch = (tim.matchW || 0) + (tim.matchL || 0);
                let isAktif = totalMatch > 0;
                if (isAktif) {
                    // Decay kecil per siklus (sudah jalan beberapa match)
                    let decayStamina = 2 + Math.floor(Math.random() * 3);
                    p.stamina = Math.max(30, p.stamina - decayStamina);
                    // Mental: menang = naik, kalah beruntun = turun
                    let streakKalah = tim.streakKalah || 0;
                    if (streakKalah >= 3) {
                        p.mental = Math.max(20, p.mental - (1 + Math.floor(Math.random() * 3)));
                    } else if ((tim.matchW || 0) > (tim.matchL || 0)) {
                        p.mental = Math.min(99, p.mental + Math.floor(Math.random() * 3));
                    }
                } else {
                    // Pramusim / belum main — stamina & mental recover
                    p.stamina = Math.min(99, p.stamina + 5 + Math.floor(Math.random() * 5));
                    p.mental  = Math.min(99, p.mental  + 3 + Math.floor(Math.random() * 3));
                }
            });

            // Sinkronkan "power" tim dengan rata-rata OVR roster terbarunya
            let totalOvr = 0;
            tim.roster.forEach(p => (totalOvr += p.ovr));
            tim.power = Math.floor(totalOvr / tim.roster.length);
        });
    });
}

// FUNGSI UPDATE RIWAYAT SAAT TRANSFER TERJADI (REAL-TIME)
function catatTransferRealTime(p, timBaru, isLoan = false) {
    // [BARU] Tandain tanggal pemain ini gabung -- dipakai buat sistem
    // eligibility MSC/M7 (lihat apakahPemainEligibleMSCM7 di
    // calendar_system_patch.js). Kloning tanggalnya (bukan referensi
    // langsung ke kalenderGame), soalnya kalenderGame terus di-mutate
    // tiap hari lewat setDate() -- kalau gak di-kloning, tanggal
    // bergabung pemain bakal ikut "maju" terus tiap hari kalender
    // berjalan, bukan kebeku di tanggal transfer aslinya.
    if (typeof kalenderGame !== "undefined" && kalenderGame) {
        p.tanggalBergabung = new Date(kalenderGame.getTime());
    }

    let tahunSkrg = kalenderGame.getFullYear();
    if (!p.riwayatKarir) p.riwayatKarir = [];

    let teksTim = isLoan ? "Loan to " + timBaru : timBaru;
    let lastIdx = p.riwayatKarir.length - 1;

    if (lastIdx >= 0) {
        if (p.riwayatKarir[lastIdx].tim !== teksTim) {
            p.riwayatKarir[lastIdx].tahunAkhir = tahunSkrg;
            p.riwayatKarir.push({
                tahunAwal: tahunSkrg,
                tahunAkhir: tahunSkrg,
                tim: teksTim
            });
        }
    } else {
        p.riwayatKarir.push({
            tahunAwal: tahunSkrg,
            tahunAkhir: tahunSkrg,
            tim: teksTim
        });
    }

    // --- OPTIMASI LEVEL 1: LIMIT RIWAYAT KARIR ---
    if (p.riwayatKarir.length > 8) {
        p.riwayatKarir.shift(); // Hapus karir paling awal (di index 0)
    }
    // ---------------------------------------------
}

// ==========================================
// OTAK AI EVALUASI PROPOSAL PELATIH
// ==========================================
// ==========================================
// OTAK AI EVALUASI PROPOSAL PELATIH (UPDATE REPUTASI)
// ==========================================
// ==========================================
// OTAK AI EVALUASI PROPOSAL PELATIH (FORMULA 35-25-20-10-10)
// ==========================================
function ajukanProposalPelatih(pelatih, proposal) {
    // 1. TEMBOK GENGSI (Tetap dipertahankan)
    // Pelatih elit (Bintang 3) ogah melatih tim gurem kecuali disogok gaji nyaris 2x lipat
    if (pelatih.buffPower >= 3 && reputasiTim < 70) {
        if (proposal.gaji < pelatih.ekspektasiGaji * 1.8) {
            return { 
                status: "TOLAK", 
                pesan: "Reputasi tim Anda terlalu rendah untuk pelatih sekelas saya. Kecuali Anda berani membayar kompensasi jauh di atas standar (180%), saya tidak tertarik." 
            };
        }
    }

    // Ambil rata-rata OVR Roster tim kita saat ini
    let basePower = 65;
    if (typeof rosterKita !== 'undefined' && rosterKita.length > 0) {
        let tot = 0; rosterKita.forEach(p => tot += p.ovr);
        basePower = Math.floor(tot / rosterKita.length);
    }

    // =======================================================
    // 1. FAKTOR GAJI & BONUS (Bobot Maksimal: 35% + Bonus 5%)
    // =======================================================
    let rasioGaji = proposal.gaji / pelatih.ekspektasiGaji;
    // Maksimal poin dari gaji reguler adalah 0.35 (35%). Dikasih batas (Math.min) biar gak nge-cheat ngasih duit over limit.
    let skorGaji = Math.min(rasioGaji * 0.35, 0.40); 
    
    // Tambahan dari Bonus (Tergantung reputasi)
    let nilaiBonus = proposal.bonus ? (proposal.bonus / pelatih.ekspektasiGaji) : 0;
    if (reputasiTim >= 90) skorGaji += nilaiBonus * 0.15; // Tim S-Tier bonusnya lebih dihargai pelatih
    else skorGaji += nilaiBonus * 0.05;

    // =======================================================
    // 2. FAKTOR KEKUATAN ROSTER (Bobot Maksimal: 25%)
    // =======================================================
    // Pelatih Bintang 3 ekspektasinya ngelatih tim Power 85. Pelatih Bintang 1 ekspektasinya Power 75.
    let ekspektasiPower = 70 + ((pelatih.buffPower || 1) * 5); 
    let rasioPower = basePower / ekspektasiPower;
    // Semakin kuat rosternya, pelatih makin tertarik (Maksimal dapet 0.25)
    let skorRoster = Math.min(rasioPower * 0.25, 0.25);

    // =======================================================
    // 3. FAKTOR KEREALISTISAN TARGET (Bobot Maksimal: 20%)
    // =======================================================
    let skorTarget = 0;
    let t = proposal.target || "";
    
    // Evaluasi kecocokan Target vs Kekuatan Tim
    if (t.includes("Juara")) {
        // Kalau nargetin Juara tapi power masih 70, pelatih bakal ketawa (Skor 0)
        skorTarget = basePower >= 85 ? 0.20 : (basePower >= 80 ? 0.10 : 0.0);
    } else if (t.includes("Grand Final")) {
        skorTarget = basePower >= 82 ? 0.20 : (basePower >= 78 ? 0.12 : 0.05);
    } else if (t.includes("Top 4")) {
        skorTarget = basePower >= 78 ? 0.20 : (basePower >= 75 ? 0.15 : 0.08);
    } else if (t.includes("Lolos Playoff")) {
        skorTarget = basePower >= 70 ? 0.20 : 0.15;
    } else {
        // Hindari Juru Kunci (Target paling aman, pelatih seneng karena pressure rendah)
        skorTarget = 0.20; 
    }

    // =======================================================
    // 4. FAKTOR REPUTASI TIM (Bobot Maksimal: 10%)
    // =======================================================
    // Kalau reputasi lu 100, dapet full 0.10. Kalau 50 cuma dapet 0.05.
    let skorReputasi = Math.min((reputasiTim / 100) * 0.10, 0.10);

    // =======================================================
    // 5. FAKTOR DURASI KONTRAK (Bobot Maksimal: 10%)
    // =======================================================
    let skorDurasi = 0;
    if (proposal.durasi === 1) skorDurasi = 0.02; // Pelatih kurang suka kontrak cuma 1 tahun (Gak aman)
    else if (proposal.durasi === 2) skorDurasi = 0.05;
    else if (proposal.durasi === 3) skorDurasi = 0.08;
    else skorDurasi = 0.10; // Kontrak jangka panjang sangat disukai

    // =======================================================
    // KALKULASI TOTAL SKOR (Maksimal ~1.00)
    // =======================================================
    let skorTotal = skorGaji + skorRoster + skorTarget + skorReputasi + skorDurasi;

    // Evaluasi Hasil Akhir
    if (skorTotal >= 0.85) {
        return { 
            status: "DEAL", 
            pesan: "Target yang masuk akal, proyek roster yang jelas, dan tawaran yang menarik! Saya siap bergabung." 
        };
    } else if (skorTotal >= 0.65) { 
        // Kurang dikit, pelatih akan Counter/Nego balik bagian Gajinya
        let baseCounter = pelatih.ekspektasiGaji;
        if (pelatih.buffPower >= 3 && reputasiTim < 70) baseCounter = pelatih.ekspektasiGaji * 1.8;

        let counterGaji = Math.floor(baseCounter * (pelatih.kepribadian === "Ambisius" ? 1.15 : 1.05));
        
        return {
            status: "COUNTER",
            pesan: "Visi tim dan targetnya masuk akal, tapi untuk angka bayarannya mari kita bicarakan ulang.",
            counterGaji: counterGaji,
            counterDurasi: proposal.durasi
        };
    } else { 
        // Tawaran ditolak mentah-mentah (Misal: Gajinya kecil ATAU targetnya nggak ngotak)
        let alasanTolak = "Tawaran Anda tidak sepadan.";
        if (skorTarget === 0) alasanTolak = "Target yang Anda berikan tidak realistis dengan komposisi roster saat ini. Saya tidak mau mempertaruhkan karir saya.";

        return { 
            status: "TOLAK", 
            pesan: `Maaf, saya harus menolak. ${alasanTolak}` 
        };
    }
}

// --- SISTEM EVALUASI NEGOSIASI CERDAS (UPDATE REPUTASI PEMAIN) ---
function prosesAntrianTransfer(hariLewat = 1) {
    if (antrianTransfer.length === 0) return;
    let pesanHasil = "";
    let sisaAntrian = [];

    // --- OPTIMASI: Deklarasi Array & Tim Kita CUKUP 1X DI LUAR LOOP ---
    let semuaTimGlobal = [
        ...daftarTim,
        ...daftarTimPH,
        ...daftarTimMY,
        ...daftarTimSG
    ];
    let timKita = semuaTimGlobal.find(t => t.nama === timPlayer);
    
    antrianTransfer.forEach(nego => {
        if (nego.status === "MENUNGGU_USER") {
            sisaAntrian.push(nego);
            return;
        }

        nego.waktuTunggu -= hariLewat;

        if (nego.waktuTunggu <= 0) {
            // ==========================================
            // CEGATAN KHUSUS UNTUK NEGOSIASI STAFF
            // ==========================================
            if (nego.tipe === "REKRUT_STAFF") {
                let pelatih = nego.pemain;
                let proposal = nego.proposal;

                let responPelatih = ajukanProposalPelatih(pelatih, proposal);

                if (responPelatih.status === "DEAL") {
                    pesanHasil += window.eksekusiDealStaff(nego, false);
                } else if (responPelatih.status === "COUNTER") {
                    nego.status = "MENUNGGU_USER";
                    nego.counterGaji = responPelatih.counterGaji;
                    nego.counterDurasi = responPelatih.counterDurasi;
                    nego.id = "counter_staff_" + Date.now();

                    sisaAntrian.push(nego); 

                    pesanHasil += `
                <div style="text-align:left; background:#F7F9FC; padding:12px; border-left:3px solid #E8720C; margin-bottom:8px; border-radius:4px;">
                    ⚠️ Agen <b>${pelatih.nama}</b> merespon proposal lu!<br>
                    <i style="color:#5C6472;">"${responPelatih.pesan}"</i><br><br>
                    Mereka mengajukan <b>COUNTER OFFER</b>:<br>
                    Gaji: <b style="color:#C9971F;">Rp ${(responPelatih.counterGaji / 1000000).toFixed(1)} Jt</b><br>
                    Durasi: <b style="color:#C9971F;">${responPelatih.counterDurasi} Musim</b><br>
                    Target: <b style="color:#12151C;">${proposal.target}</b><br>
                    
                    <div id="${nego.id}" style="display:flex; gap:10px; margin-top:10px;">
                        <button class="modal-btn" style="background:#E5484D; color:#fff; flex:1; font-size:10px; padding:8px;" onclick="responCounterStaff('${nego.id}', false)">BATALKAN</button>
                        <button class="modal-btn" style="background:#00B37E; color:#fff; flex:1; font-size:10px; padding:8px;" onclick="responCounterStaff('${nego.id}', true)">SEPAKAT!</button>
                    </div>
                </div>`;
                } else {
                    kasTim += nego.biayaMuka;
                    catatKas("MASUK", nego.biayaMuka, `Refund Nego Staff Gagal: ${pelatih.nama}`);
                    pesanHasil += `<div style="text-align:left; background:#F7F9FC; padding:10px; border-left:3px solid #E5484D; margin-bottom:8px;">❌ <b>${pelatih.nama}</b> MENOLAK proposal. <br><i style="color:#5C6472;">"${responPelatih.pesan}"</i></div>`;
                }
                return; 
            }
            // ==========================================

            let p = nego.pemain;
            if (p.kesempatanNego === undefined || isNaN(p.kesempatanNego))
                p.kesempatanNego = 3;

            // [PATCH] Status Bintang/GOAT dipersempit biar langka -- murni dari
            // OVR > 95 (skala ekspektasi "Juara Dunia" cuma 95), gak lagi
            // otomatis kesebut bintang cuma gara-gara tren OVR lagi naik.
            let isBintang = p.ovr > 95;
            
            // ==========================================
            // LOGIKA REPUTASI 1: TEMBOK GENGSI PEMAIN BINTANG
            // [LOAN+BUYOPTION PATCH] Dikecualikan buat PINJAM_LAIN -- gaji udah
            // gak dinego (selalu 100%), jadi gak ada lagi lever buat "nyogok"
            // pemain bintang lewat gaji pas loan.
            // ==========================================
            if (isBintang && reputasiTim < 70 && nego.tipe !== "PINJAM_LAIN") {
                // Pemain bintang nolak tim gurem kecuali digaji 180% (1.8x lipat)
                if (nego.tawarGaji < nego.demandGaji * 1.8) {
                    // [NEW] Buyout-dari-trial: gagal nego = biaya buyout HANGUS
                    // (resiko nyata), bukan di-refund kayak transfer biasa.
                    if (nego.dariTrialBuyout) {
                        p.kesempatanNego -= 1;
                        p.sedangDinego = false;
                        pesanHasil += `<div style="text-align:left; background:rgba(229,72,77,0.08); padding:10px; border-left:3px solid #E5484D; margin-bottom:8px; color:#5C6472;">
                        ❌ <b>${p.nama}</b> MENOLAK mentah-mentah proposal lu, dan biaya Buyout <b>HANGUS</b> (gak ada refund)! <br>
                        <i style="color:#E8720C; font-size:11px;">"Reputasi tim lu saat ini (${reputasiTim}) terlalu kecil. Gue balik ke tim lama aja."</i></div>`;
                        return;
                    }
                    kasTim += nego.biayaMuka;
                    catatKas("MASUK", nego.biayaMuka, `Refund Nego Ditolak (Gengsi): ${p.nama}`);
                    p.kesempatanNego -= 1;
                    p.sedangDinego = false;
                    
                    pesanHasil += `<div style="text-align:left; background:rgba(229,72,77,0.08); padding:10px; border-left:3px solid #E5484D; margin-bottom:8px; color:#5C6472;">
                    ❌ <b>${p.nama}</b> MENOLAK mentah-mentah proposal lu! <br>
                    <i style="color:#E8720C; font-size:11px;">"Reputasi tim lu saat ini (${reputasiTim}) terlalu kecil. Pemain meminta bayaran minimal 180% dari harga normal sebagai jaminan resiko karir!"</i></div>`;
                    return; // Lewati sisa eksekusi dan lanjut ke antrian pemain lain
                }
            }

            let batasDeal = isBintang ? 1.05 : 0.95;
            let batasCounter = isBintang ? 0.85 : 0.7;

            let skorTawaran = 0;
            let rasioGaji = nego.tawarGaji / nego.demandGaji;
            let rasioDurasi = nego.tawarDurasi / nego.demandDurasi;

            // EVALUASI CERDAS 2 PIHAK (Tim AI vs Agen Pemain)
            if (nego.tipe === "BELI_LAIN" || nego.tipe === "PINJAM_LAIN") {
                // [UPDATE] Klausul rilis pemain inti dinaikin ke 3x.
                let klausulRilis = Math.floor(nego.demandTransfer * (nego.pemainIniInti ? 3 : 1.8));
                let isBuyout = nego.tipe === "BELI_LAIN" && nego.tawarTransfer >= klausulRilis;
                let rasioTransfer = nego.tawarTransfer / nego.demandTransfer;

                if (nego.tipe === "PINJAM_LAIN") {
                    // [LOAN+BUYOPTION PATCH] Gaji gak dinego (selalu 100% ditanggung
                    // peminjam), jadi skor cuma dari fee pinjam + (kalau ada) opsi beli.
                    if (nego.sertakanOpsiBeli) {
                        let rasioOpsiBeli = nego.tawarOpsiBeli / nego.demandOpsiBeli;
                        skorTawaran = rasioTransfer * 0.5 + rasioOpsiBeli * 0.5;
                    } else {
                        skorTawaran = rasioTransfer;
                    }
                } else if (isBuyout) {
                    // KLUB GAK BISA NOLAK! Skor cuma nentuin dari agen (rasio gaji)
                    skorTawaran = 0.65 + rasioGaji * 0.4;
                    if (skorTawaran >= batasDeal) nego.isBuyoutTriggered = true; 
                } else {
                    // Normal Nego (Klub 60%, Agen 40%)
                    skorTawaran = rasioTransfer * 0.6 + rasioGaji * 0.4;
                }
            } else {
                let rasioPower = (timKita && timKita.power ? timKita.power : 65) / (p.ovr ? p.ovr : 65);
                skorTawaran = rasioGaji * 0.6 + rasioDurasi * 0.1 + rasioPower * 0.2 + bankRiwayatJuara.length * 0.05;
            }

            // ==========================================
            // LOGIKA REPUTASI 2: MAGNET TIM BESAR (BOOST SKOR)
            // ==========================================
            if (reputasiTim >= 90) {
                skorTawaran += 0.15; // Tier S: Dapet boost skor 15% (Pemain auto-lumer dapet tawaran)
            } else if (reputasiTim >= 70) {
                skorTawaran += 0.05; // Tier A: Dapet boost skor 5%
            }

            // PENENTUAN HASIL AKHIR
            if (skorTawaran >= batasDeal) {
                pesanHasil += eksekusiDealTransfer(nego, false);
            } else if (skorTawaran >= batasCounter && p.kesempatanNego > 1) {
                let markUpTim = isBintang ? 1.15 : 1.05;
                let counterTransfer =
                    nego.tipe === "BELI_LAIN" || nego.tipe === "PINJAM_LAIN"
                        ? Math.floor(nego.demandTransfer * markUpTim)
                        : 0;
                let counterGaji = Math.floor(
                    nego.demandGaji * (isBintang ? 1.15 : 1.05)
                );
                let counterDurasi = isBintang
                    ? Math.max(1, nego.tawarDurasi - 1)
                    : nego.tawarDurasi;
                if (nego.tipe === "BELI_LAIN")
                    counterDurasi = Math.floor(Math.random() * 2) + 2;

                nego.status = "MENUNGGU_USER";
                nego.counterTransfer = counterTransfer;
                nego.counterGaji = counterGaji;
                nego.counterDurasi = counterDurasi;
                nego.id = "counter_" + Date.now();

                sisaAntrian.push(nego);
                p.kesempatanNego -= 1;

                let agenTeks =
                    nego.tipe === "BELI_LAIN" || nego.tipe === "PINJAM_LAIN"
                        ? `Manajemen <b>${nego.namaTimLain}</b> & Agen <b>${p.nama}</b>`
                        : `Agen <b>${p.nama}</b>`;

                let textTransferHtml =
                    counterTransfer > 0
                        ? `Transfer/Loan Fee: <b style="color:#C9971F;">Rp ${(counterTransfer / 1000000).toFixed(1)} Jt</b><br>`
                        : "";

                pesanHasil += `
                <div style="text-align:left; background:#F7F9FC; padding:12px; border-left:3px solid #E8720C; margin-bottom:8px; border-radius:4px;">
                    ⚠️ ${agenTeks} merasa tawaran lu masih kurang!<br>
                    Mereka mengajukan <b>COUNTER OFFER (Nego Balik)</b>:<br>
                    ${textTransferHtml}
                    Gaji: <b style="color:#C9971F;">Rp ${(counterGaji / 1000000).toFixed(1)} Jt</b><br>
                    Durasi: <b style="color:#C9971F;">${counterDurasi} Musim</b><br>
                    <span style="font-size:10px; color:#888;">(Sisa toleransi: ${p.kesempatanNego}x)</span><br>
                    
                    <div id="${nego.id}" style="display:flex; gap:10px; margin-top:10px;">
                        <button class="modal-btn" style="background:#E5484D; color:#fff; flex:1; font-size:10px; padding:8px;" onclick="responCounter('${nego.id}', false)">BATALKAN</button>
                        <button class="modal-btn" style="background:#00B37E; color:#fff; flex:1; font-size:10px; padding:8px;" onclick="responCounter('${nego.id}', true)">DEAL!</button>
                    </div>
                </div>`;
            } else {
                // [NEW] Buyout-dari-trial: gagal nego = biaya buyout HANGUS.
                if (nego.dariTrialBuyout) {
                    p.kesempatanNego -= 1;
                    p.sedangDinego = false;
                    pesanHasil += `<div style="text-align:left; background:#F7F9FC; padding:10px; border-left:3px solid #E5484D; margin-bottom:8px;">❌ <b>${p.nama}</b> MENOLAK proposal (gaji kurang sesuai performa trial-nya). Biaya Buyout <b>HANGUS</b>, dia balik ke ${nego.namaTimLain || "tim asalnya"}.</div>`;
                } else {
                    kasTim += nego.biayaMuka;
                    catatKas(
                        "MASUK",
                        nego.biayaMuka,
                        `Refund Nego Gagal: ${p.nama}`
                    );
                    p.kesempatanNego -= 1;
                    p.sedangDinego = false;

                    if (p.kesempatanNego > 0) {
                        pesanHasil += `<div style="text-align:left; background:#F7F9FC; padding:10px; border-left:3px solid #E5484D; margin-bottom:8px;">❌ <b>${p.nama}</b> MENOLAK proposal. Tawaran terlalu rendah! (Sisa Toleransi: ${p.kesempatanNego}x)</div>`;
                    } else {
                        pesanHasil += `<div style="text-align:left; background:#F7F9FC; padding:10px; border-left:3px solid #E5484D; margin-bottom:8px;">🚫 <b>${p.nama}</b> MARAH dan mem-blacklist tim lu karena tawaran sampah!</div>`;
                    }
                }
            }
        } else {
            sisaAntrian.push(nego);
        }
    });

    antrianTransfer = sisaAntrian;
    if (pesanHasil !== "")
        tambahEmail(
            "Info Meja Negosiasi",
            "Manajemen & Agen",
            `<div style="font-size:12px; margin-bottom:15px; color:#5C6472; border-bottom: 1px dashed var(--border-md); padding-bottom: 10px;">Update negosiasi tim:</div>${pesanHasil}`
        );
}

function eksekusiDealTransfer(nego, pakaiCounter = false) {
    let p = nego.pemain;
    p.kesempatanNego = 3;
    p.sedangDinego = false;
    p.sudahTransfer = true;
    let dealTransfer = pakaiCounter ? nego.counterTransfer : nego.tawarTransfer;
    let dealGaji = pakaiCounter ? nego.counterGaji : nego.tawarGaji;
    let dealDurasi = pakaiCounter ? nego.counterDurasi : nego.tawarDurasi;
    let pesanHasil = "";

    // Uang Transfer masuk ke kas tim AI penjual
    // FIX FASE 15: cari di semua 11 database, bukan cuma 4 MPL, supaya
    // transfer dengan tim AI dari MDL/MAL/LEN tidak gagal diam-diam
    let timLain = (typeof cariTimAsliDiDatabase === "function")
        ? cariTimAsliDiDatabase(nego.namaTimLain)
        : null;
    if (!timLain) {
        let semuaTim = [
            ...daftarTim,
            ...daftarTimPH,
            ...daftarTimMY,
            ...daftarTimSG
        ];
        timLain = semuaTim.find(t => t.nama === nego.namaTimLain);
    }
    if (timLain && dealTransfer > 0) timLain.kas += dealTransfer;

    if (nego.tipe === "BELI") {
        p.gaji = dealGaji;
        p.sisaKontrak = dealDurasi;
        rosterKita.push(p);
        catatTransferRealTime(p, timPlayer);
        let idxBursa = pemainTransfer.findIndex(x => x.nama === p.nama);
        if (idxBursa !== -1) pemainTransfer.splice(idxBursa, 1);
        pesanHasil = `<div class="notif-sukses">✅ <b>${p.nama}</b> RESMI bergabung dengan gaji Rp ${(dealGaji / 1000000).toFixed(1)} Jt!</div>`;
        tambahBerita(`🤝 Resmi: <span>${p.nama}</span> resmi bergabung dengan tim Anda.`);
    } else if (nego.tipe === "BELI_LAIN") {
        p.gaji = dealGaji;
        p.sisaKontrak = dealDurasi;
        if (timLain) {
            let idx = timLain.roster.findIndex(x => x.nama === p.nama);
            if (idx !== -1) timLain.roster.splice(idx, 1);
            let idxBursa = pemainTransfer.findIndex(pt => pt.role === p.role);
            if (idxBursa !== -1) {
                let rek = pemainTransfer.splice(idxBursa, 1)[0];
                rek.sisaKontrak = 2;
                timLain.roster.push(rek);
                catatTransferRealTime(rek, timLain.nama, false);
            }
            let totOvr = 0;
            timLain.roster.forEach(x => (totOvr += x.ovr));
            timLain.power = Math.floor(totOvr / timLain.roster.length);
        }
        p.sudahTransfer = true;
        rosterKita.push(p);
        catatTransferRealTime(p, timPlayer);

        // 👇 TAMBAHAN CEK BUYOUT
        if (nego.isBuyoutTriggered) {
            pesanHasil = `<div class="notif-sukses" style="background:rgba(229,72,77,0.08); border-color:#E5484D; color:#5B3DF5;">🚨 KLAUSUL RILIS DITEBUS! <b>${p.nama}</b> resmi direbut dari <b>${nego.namaTimLain}</b>!</div>`;
            tambahBerita(
                `🚨 Pembajakan: <span>${timPlayer}</span> nekat menebus Klausul Rilis <span>${p.nama}</span> seharga Rp ${(dealTransfer / 1000000).toFixed(1)} Jt dari <span>${nego.namaTimLain}</span>.`
            );
        } else {
            pesanHasil = `<div class="notif-sukses">✅ Manajemen <b>${nego.namaTimLain}</b> SEPAKAT melepas <b>${p.nama}</b>!</div>`;
            tambahBerita(
                `🤝 Mega Transfer: <span>${p.nama}</span> resmi ditebus dari <span>${nego.namaTimLain}</span> seharga Rp ${(dealTransfer / 1000000).toFixed(1)} Jt.`
            );
        }
    } else if (nego.tipe === "PINJAM_LAIN") {
        p.isLoan = true;
        p.timAsli = nego.namaTimLain;
        p.durasiPinjam = dealDurasi;
        // [LOAN+BUYOPTION PATCH] Harga opsi beli dikunci di titik ini, gak
        // ikut naik/turun lagi walau harga pasar pemain berubah selama dipinjam.
        if (nego.sertakanOpsiBeli && nego.tawarOpsiBeli > 0) {
            p.opsiBeliAktif = true;
            p.opsiBeliHarga = nego.tawarOpsiBeli;
        }
        if (timLain) {
            let idx = timLain.roster.findIndex(x => x.nama === p.nama);
            if (idx !== -1) timLain.roster.splice(idx, 1);
            let idxBursa = pemainTransfer.findIndex(pt => pt.role === p.role);
            if (idxBursa !== -1) {
                let rek = pemainTransfer.splice(idxBursa, 1)[0];
                rek.sisaKontrak = 2;
                timLain.roster.push(rek);
                catatTransferRealTime(rek, timLain.nama, false);
            }
            let totOvr = 0;
            timLain.roster.forEach(x => (totOvr += x.ovr));
            timLain.power = Math.floor(totOvr / timLain.roster.length);
        }
        rosterKita.push(p);
        catatTransferRealTime(p, timPlayer, true);
        pesanHasil = `<div class="notif-sukses">✅ <b>${p.nama}</b> resmi DIPINJAM (Fee: Rp ${(dealTransfer / 1000000).toFixed(1)} Jt)!</div>`;
        tambahBerita(
            `🧳 Loan Deal: <span>${p.nama}</span> mendarat dari <span>${nego.namaTimLain}</span>.`
        );
    } else {
        // PERPANJANG
        p.gaji = dealGaji;
        p.sisaKontrak += dealDurasi;
        pesanHasil = `<div class="notif-sukses">✅ Kontrak <b>${p.nama}</b> DIPERPANJANG!</div>`;
    }

    // === FASE 15 FIX ===
    // Power tim PLAYER SENDIRI sebelumnya TIDAK PERNAH di-recalculate
    // di sini -- cuma timLain yang dihitung ulang. Padahal prinsip
    // "power cuma berubah saat transfer" justru mengharuskan transfer
    // milik player sendiri ikut memicu recalculate. Diperbaiki di sini,
    // mencakup BELI/BELI_LAIN/PINJAM_LAIN (PERPANJANG tidak mengubah
    // komposisi roster, jadi power tidak perlu dihitung ulang).
    if (nego.tipe !== "PERPANJANG" && typeof hitungPowerTim === "function") {
        let timPlayerObj = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;
        if (timPlayerObj) {
            timPlayerObj.roster = rosterKita; // pastikan referensi roster terbaru tersinkron
            timPlayerObj.power = hitungPowerTim(timPlayerObj);
        }
    }

    return pesanHasil;
}

// --- RESPON BUTTON DARI DALAM EMAIL COUNTER OFFER ---
window.responCounter = function (id, isDeal) {
    let idx = antrianTransfer.findIndex(n => n.id === id);
    if (idx === -1) {
        getEl(id).innerHTML =
            `<div style="color:#E5484D; font-size:11px;">⚠️ Kadaluarsa.</div>`;
        return;
    }

    let nego = antrianTransfer[idx];
    let p = nego.pemain;

    if (isDeal) {
        // Cek kalau counter transfer fee (uang muka baru) lebih besar dari deposit awal
        let selisihTransfer = nego.counterTransfer - nego.biayaMuka;
        let selisihGajiDeposit =
            nego.tipe === "BELI" || nego.tipe === "PERPANJANG"
                ? nego.counterGaji * 0.5 - nego.biayaMuka
                : 0;
        let totalTambah =
            Math.max(0, selisihTransfer) + Math.max(0, selisihGajiDeposit);

        if (kasTim < totalTambah && totalTambah > 0) {
            alert(
                `Kas kurang! Lu butuh tambahan Rp ${(totalTambah / 1000000).toFixed(1)} Jt buat nutupin Counter Offer ini.`
            );
            return;
        }

        if (totalTambah > 0) {
            kasTim -= totalTambah;
            catatKas(
                "KELUAR",
                totalTambah,
                `Pelunasan Nego (Counter): ${p.nama}`
            );
        }

        eksekusiDealTransfer(nego, true);
        getEl(id).innerHTML =
            `<div style="color:#00B37E; font-weight:bold; font-size:12px; padding:10px; background:#F7F9FC; border:1px dashed #00B37E;">✅ SEPAKAT! Pemain resmi diamankan. Cek Roster lu!</div>`;
    } else {
        // [NEW] Buyout-dari-trial: batal counter = biaya buyout HANGUS.
        if (nego.dariTrialBuyout) {
            p.sedangDinego = false;
            getEl(id).innerHTML =
                `<div style="color:#E5484D; font-weight:bold; font-size:12px; padding:10px; background:#F7F9FC; border:1px dashed #E5484D;">❌ DIBATALKAN. Biaya Buyout HANGUS (gak ada refund).</div>`;
        } else {
            kasTim += nego.biayaMuka;
            catatKas("MASUK", nego.biayaMuka, `Refund Batal Nego: ${p.nama}`);
            p.sedangDinego = false;
            getEl(id).innerHTML =
                `<div style="color:#E5484D; font-weight:bold; font-size:12px; padding:10px; background:#F7F9FC; border:1px dashed #E5484D;">❌ DIBATALKAN MANAJER.</div>`;
        }
    }
    let emTarget = inboxEmail.find(em => em.isi.includes(id));
    if (emTarget) {
        emTarget.isi = getEl("bacaEmailIsi").innerHTML;
    }

    antrianTransfer.splice(idx, 1);
    updateDashboard();
};

// --- OPTIMASI PENYIMPANAN & RENDER TRANSAKSI (ANTI LAG) ---
function catatKas(jenis, nominal, deskripsi) {
    let tgl = dapetTanggalPendek(kalenderGame);
    let weekTxt =
        statusGame === "PRAMUSIM" ? "Off-Season" : `S${musimKe}-W${mingguKe}`;
    let waktuFix = `${weekTxt} | ${tgl}`;

    // 1. Simpan ke data array
    riwayatKas.unshift({ jenis, nominal, deskripsi, waktu: waktuFix });

    // --- OPTIMASI LEVEL 1: LIMIT RIWAYAT KAS ---
    // Cuma simpan 100 transaksi terbaru biar file save ringan
    if (riwayatKas.length > 100) {
        riwayatKas.pop();
    }
    // -------------------------------------------

    // 2. LANGSUNG UPDATE ANGKA TOTAL KAS
    if (getEl("teksTotalKas")) {
        getEl("teksTotalKas").innerText =
            `Rp ${kasTim.toLocaleString("id-ID")}`;
    }
    if (getEl("dashKas")) {
        getEl("dashKas").innerText = `Rp ${kasTim.toLocaleString("id-ID")}`;
    }

    // 3. TARGETED UPDATE: Sisipkan HANYA 1 baris baru ke paling atas UI list
    let containerList = getEl("listRiwayatKeuangan");
    if (containerList) {
        if (riwayatKas.length === 1) {
            containerList.innerHTML = "";
        }

        let warna = jenis === "MASUK" ? "#00B37E" : "#E5484D";
        let simbol = jenis === "MASUK" ? "+" : "-";

        let barisBaruHtml = `
        <div class="card-kas">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span class="kas-desc">${deskripsi}</span>
                <span class="kas-nom" style="color:${warna};">${simbol} Rp ${(nominal / 1000000).toFixed(1)} Jt</span>
            </div>
            <div class="kas-tgl">📅 ${waktuFix}</div>
        </div>`;

        containerList.insertAdjacentHTML("afterbegin", barisBaruHtml);

        // Hapus elemen HTML paling bawah kalau udah lebih dari 100 baris (mencegah lag saat di-scroll)
        if (containerList.children.length > 100) {
            containerList.removeChild(containerList.lastElementChild);
        }
    }
}

window.rekrutStaff = function (index) {
    let s = bursaStaff[index];
    let roleKey =
        s.role === "Pelatih"
            ? "pelatih"
            : s.role === "Asisten Pelatih"
              ? "asisten"
              : "analis";

    // CEK LIMIT GH
    let limitStaff = databaseGH[levelGH - 1].limitStaff;
    if (roleKey === "asisten" && limitStaff < 2) {
        bukaModal(
            "SLOT TERKUNCI 🔒",
            "Upgrade GH ke <b>Level 2 (Rumah Mewah)</b> dulu buat nampung Asisten Pelatih!",
            "#E8720C"
        );
        return;
    }
    if (roleKey === "analis" && limitStaff < 3) {
        bukaModal(
            "SLOT TERKUNCI 🔒",
            "Upgrade GH ke <b>Level 3 (Premium)</b> dulu buat nampung Analis!",
            "#E8720C"
        );
        return;
    }

    if (staffKita[roleKey] !== null) {
        alert(`Lu udah punya ${s.role}! Pecat dulu yang lama kalau mau ganti.`);
        return;
    }
    if (kasTim < s.harga) {
        alert("Saldo kas nggak cukup buat bayar biaya rekrutmen awal!");
        return;
    }

    kasTim -= s.harga;
    s.sisaKontrak = 2;
    staffKita[roleKey] = s;
    bursaStaff.splice(index, 1);
    catatKas("KELUAR", s.harga, `Rekrut ${s.role}: ${s.nama}`);
    updateDashboard();
    alert(
        `${s.nama} resmi bergabung sebagai ${s.role}! Power tim lu meningkat.`
    );
};

window.pecatStaff = function (roleKey) {
    let s = staffKita[roleKey];
    if (confirm(`Yakin mau pecat ${s.nama}? Dia bakal balik ke bursa staff.`)) {
        if (!s.gaji) s.gaji = (s.buffPower || 1) * 3000000 + 5000000; // Standar gaji kalau kosong
        if (!s.harga) s.harga = s.gaji * 1.2; // Harga pasar = 120% dari gaji
        if (!s.kepribadian) {
            let sifatStaff = ["Ambisius", "Santai", "Muda", "Veteran"];
            s.kepribadian =
                sifatStaff[Math.floor(Math.random() * sifatStaff.length)];
        }
        if (!s.ekspektasiGaji) s.ekspektasiGaji = s.gaji;
        if (!s.negara) {
            s.negara = (typeof benderaAkademiUntukRegion === "function")
                ? benderaAkademiUntukRegion(["ID","PH","MY","SG","TR","IN","KH","MM","MENA","EECA","EA","AM","WEU"][Math.floor(Math.random() * 13)])
                : "🇮🇩 Indonesia";
        }
        bursaStaff.push(s);
        staffKita[roleKey] = null;
        updateDashboard();
    }
};

// ============================================================
// HELPER SCOUTING — Potensi tampil dipengaruhi dataAnalysis analis
// Tanpa analis    → potensi tetap "?"
// dataAnalysis 1–39  → error ±15
// dataAnalysis 40–59 → error ±10
// dataAnalysis 60–79 → error ±5
// dataAnalysis 80–89 → error ±2, sifat terbuka
// dataAnalysis 90–99 → akurat 100%, sifat terbuka
// Hasil disimpan ke p.potensiTampil & p.sifatTampil (fix, tidak berubah setelah intai)
// ============================================================
function hitungPotensiTampil(p) {
    let da = 0;
    if (typeof staffKita !== "undefined" && staffKita.analis && staffKita.analis.atribut) {
        da = staffKita.analis.atribut.dataAnalysis || 0;
    }

    // Kalau sudah pernah diintai sebelumnya, pakai hasil yang tersimpan
    if (p.potensiTampil !== undefined) return { potensiTampil: p.potensiTampil, sifatTampil: p.sifatTampil };

    // Tanpa analis — potensi tersembunyi
    if (da === 0 || !staffKita.analis) {
        p.potensiTampil = "?";
        p.sifatTampil   = "?";
        return { potensiTampil: "?", sifatTampil: "?" };
    }

    // Hitung error margin berdasarkan dataAnalysis
    let errorMargin;
    if      (da >= 90) errorMargin = 0;
    else if (da >= 80) errorMargin = 2;
    else if (da >= 60) errorMargin = 5;
    else if (da >= 40) errorMargin = 10;
    else               errorMargin = 15;

    // Generate error acak dalam rentang, fix tersimpan
    let potensiAsli = p.potensi || p.ovr || 60;
    let error = errorMargin === 0 ? 0 : Math.floor(Math.random() * (errorMargin * 2 + 1)) - errorMargin;
    let potensiHasil = Math.min(99, Math.max(40, potensiAsli + error));

    // Sifat hanya terbuka kalau dataAnalysis >= 80
    let sifatHasil = da >= 80 ? (p.sifat || "Normal") : "?";

    // Simpan permanen ke objek pemain
    p.potensiTampil = potensiHasil;
    p.sifatTampil   = sifatHasil;

    return { potensiTampil: potensiHasil, sifatTampil: sifatHasil };
}

window.intaiPemainTimLain = function (namaPemain, namaTim) {
    // Wajib punya analis untuk intai potensi pemain
    if (!staffKita.analis) {
        bukaModal("ANALIS DIBUTUHKAN 🔍", "Tim kamu belum punya Analis. Rekrut Analis terlebih dahulu untuk dapat mengintai potensi pemain.", "#C9971F");
        return;
    }
    if (kasTim >= 5000000) {
        kasTim -= 5000000;
        // [FIX] Sama kayak bug prosesBeliPemainLain/prosesPinjamPemainLain
        // -- ganti pencarian manual 4-region jadi cariTimAsliDiDatabase()
        // yang nyertain semua 13 region.
        let tim = cariTimAsliDiDatabase(namaTim);
        if (!tim) {
            bukaModal("Tim Tidak Ditemukan", `Data tim ${namaTim} gak ketemu di database.`, "#E5484D");
            return;
        }
        let p = tim.roster.find(x => x.nama === namaPemain);

        p.scouted = true;
        catatKas(
            "KELUAR",
            5000000,
            `Sewa Talent Scout: ${p.nama} (${namaTim})`
        );
        updateDashboard();

        // Hitung potensi tampil berdasarkan dataAnalysis analis
        let { potensiTampil, sifatTampil } = hitungPotensiTampil(p);

        // Buka sensor atribut di tempat
        getEl("profilPotensi").innerText = potensiTampil;
        getEl("profilOvr").innerText = p.ovr;
        getEl("profilMekanik").innerText = p.mekanik;
        getEl("profilMakro").innerText = p.makro;
        getEl("profilMental").innerText = p.mental;
        getEl("profilSpesialis").innerText = p.spesialis;
        if (typeof syncProfilAttrBars === "function") syncProfilAttrBars();

        // Tampilkan info akurasi analis kalau ada
        let da = (staffKita.analis && staffKita.analis.atribut) ? (staffKita.analis.atribut.dataAnalysis || 0) : 0;
        let infoScouting = da === 0
            ? `⚠️ Tanpa analis — potensi tidak dapat dianalisis.`
            : da >= 90 ? `🎯 Laporan analis akurat 100%.`
            : da >= 80 ? `✅ Laporan analis sangat akurat (±2). Sifat: <b>${sifatTampil}</b>.`
            : da >= 60 ? `📊 Laporan analis cukup akurat (±5).`
            : da >= 40 ? `📉 Laporan analis kurang akurat (±10).`
            : `⚠️ Laporan analis tidak akurat (±15).`;
        if (typeof tambahBerita === "function") {
            tambahBerita(`🔍 Scout: <b>${p.nama}</b> diintai — Potensi terlapor: <b>${potensiTampil}</b>. ${infoScouting}`);
        }

        // Matiin tombol Intai
        let btnJual = getEl("btnProfilJual");
        btnJual.style.background = "#333";
        btnJual.style.color = "#888";
        btnJual.innerText = "SUDAH DIINTAI";
        btnJual.disabled = true;
        btnJual.onclick = null;
    } else {
        bukaModal(
            "DANA KURANG",
            "Kas tim tidak cukup untuk menyewa pencari bakat.",
            "#E5484D"
        );
    }
};

window.jadikanStarter = function (index) {
    let pBaru = rosterKita[index];
    let rolePemain = pBaru.role;

    // 1. Cari starter lama di role yang sama dan copot statusnya
    let starterLama = rosterKita.find(
        x => x.role === rolePemain && x.isStarter === true
    );
    if (starterLama) starterLama.isStarter = false;

    // 2. Pasang mahkota starter ke pemain baru
    pBaru.isStarter = true;

    tutupProfil();
    updateDashboard();
};

window.ajukanTawaran = function () {
    // Tarik input mentah dari teks
    let tawarTransferInput = parseFloat(getEl("inputNegoTransfer").value) || 0;
    let tawarGajiInput = parseFloat(getEl("inputNegoGaji").value) || 0;
    let tawarDurasi = parseInt(getEl("inputNegoDurasi").value) || 0;

    // SMART CHECK: Deteksi format pendek (misal 7.5) vs format panjang (7500000)
    let tawarTransfer = 0;
    if (!getEl("grupNegoTransfer").classList.contains("sembunyi")) {
        tawarTransfer =
            tawarTransferInput > 0 && tawarTransferInput < 10000
                ? tawarTransferInput * 1000000
                : tawarTransferInput;
    }

    let tawarGaji =
        tawarGajiInput > 0 && tawarGajiInput < 10000
            ? tawarGajiInput * 1000000
            : tawarGajiInput;

    // [LOAN+BUYOPTION PATCH] Loan gak nego gaji lagi -- selalu 100% ditanggung
    // peminjam, jadi tawarGaji & demandGaji dikunci sama-sama = gaji asli pemain.
    if (dataNego.tipe === "PINJAM_LAIN") {
        tawarGaji = dataNego.pemain.gaji;
        dataNego.demandGaji = dataNego.pemain.gaji;
    }

    if (!tawarGaji || !tawarDurasi) {
        alert("Bos, masukin nominal gaji dan durasinya dulu!");
        return;
    }

    let p = dataNego.pemain;
    let biayaMuka = 0;

    // [LOAN+BUYOPTION PATCH] Tangkap opsi beli (kalau dicentang & tipe loan)
    let sertakanOpsiBeli = false;
    let tawarOpsiBeli = 0;
    if (dataNego.tipe === "PINJAM_LAIN") {
        let cekOpsi = getEl("cekNegoOpsiBeli");
        sertakanOpsiBeli = !!(cekOpsi && cekOpsi.checked);
        if (sertakanOpsiBeli) {
            let opsiInput = parseFloat(getEl("inputNegoOpsiBeli").value) || 0;
            tawarOpsiBeli = opsiInput > 0 && opsiInput < 10000 ? opsiInput * 1000000 : opsiInput;
            if (tawarOpsiBeli <= 0) {
                bukaModal("Data Belum Lengkap", "Opsi beli telah dicentang namun harga belum diisi.", "#E5484D");
                return;
            }
        }
    }

    // Uang muka (Deposit) = Nilai Transfer. Kalau gratisan, tahan separuh gajinya
    if (dataNego.tipe === "BELI_LAIN" || dataNego.tipe === "PINJAM_LAIN") {
        biayaMuka = tawarTransfer;
        if (biayaMuka <= 0) {
            alert(
                "Lu mau bayar tim AI pakai daun? Kasih biaya transfer/loan yang bener!"
            );
            return;
        }
    } else {
        biayaMuka = tawarGaji * 0.5;
    }

    if (kasTim >= biayaMuka) {
        kasTim -= biayaMuka;
        catatKas("KELUAR", biayaMuka, `Deposit Nego: ${p.nama}`);

        antrianTransfer.push({
            tipe: dataNego.tipe,
            pemain: p,
            tawarTransfer: tawarTransfer,
            demandTransfer: dataNego.demandTransfer,
            tawarGaji: tawarGaji,
            tawarDurasi: tawarDurasi,
            demandGaji: dataNego.demandGaji,
            demandDurasi: dataNego.demandDurasi,
            biayaMuka: biayaMuka,
            waktuTunggu: 2,
            namaTimLain: dataNego.namaTimLain,
            // [LOAN+BUYOPTION PATCH]
            sertakanOpsiBeli: sertakanOpsiBeli,
            tawarOpsiBeli: tawarOpsiBeli,
            demandOpsiBeli: dataNego.demandOpsiBeli || 0,
            // [NEW] Flag buyout-dari-trial -- kalau nego ini gagal, biaya
            // buyout HANGUS (bukan di-refund), beda dari transfer normal.
            dariTrialBuyout: dataNego.dariTrialBuyout || false,
            // [NEW] Flag pemain inti -- dipake buat nentuin klausul rilis
            // 3x (bukan 1.8x) di logika keputusan final.
            pemainIniInti: dataNego.pemainIniInti || false
        });

        if (dataNego.tipe === "BELI" || dataNego.tipe === "BELI_LAIN") {
            p.sedangDinego = true;
        }

        tutupNego();
        tutupProfil();
        updateDashboard();

        bukaModal(
            "PROPOSAL DIKIRIM! 📩",
            `Tawaran lu masuk ke meja manajemen/agen <b>${p.nama}</b>.<br><br>Dana deposit <b>Rp ${(biayaMuka / 1000000).toFixed(1)} Jt</b> ditahan sementara.`,
            "#0891B2"
        );
    } else {
        alert(
            `Dana kas kurang! Butuh minimal Rp ${(biayaMuka / 1000000).toFixed(1)} Jt buat deposit tawaran ini.`
        );
    }
};

window.submitProposalPelatih = function () {
    let target = getEl("inputTargetPelatih").value;

    // Tarik input mentah dari teks
    let gajiInput = parseFloat(getEl("inputGajiPelatih").value) || 0;
    let durasi = parseInt(getEl("inputDurasiPelatih").value) || 1;
    let bonusInput = parseFloat(getEl("inputBonusPelatih").value) || 0;

    // SMART CHECK: Deteksi otomatis format ketikan player
    let gaji = gajiInput < 10000 ? gajiInput * 1000000 : gajiInput;
    let bonus =
        bonusInput > 0 && bonusInput < 10000
            ? bonusInput * 1000000
            : bonusInput;

    if (!gaji) {
        alert("Masukkan nominal gaji yang valid!");
        return;
    }

    // indexPelatihNego adalah variabel global yang nyimpen index pelatih yang lagi dinego
    let pelatih = bursaStaff[indexPelatihNego];
    let proposal = { target, gaji, durasi, bonus };

    // Uang Muka (Deposit) = 50% dari tawaran gaji
    let biayaMuka = gaji * 0.5;

    if (kasTim < biayaMuka) {
        alert(
            `Dana kas kurang! Butuh minimal Rp ${(biayaMuka / 1000000).toFixed(1)} Jt buat deposit tawaran ini.`
        );
        return;
    }

    kasTim -= biayaMuka;
    catatKas("KELUAR", biayaMuka, `Deposit Nego Staff: ${pelatih.nama}`);

    // MASUKKAN KE ANTRIAN TRANSFER (Nunggu 2 Hari)
    antrianTransfer.push({
        tipe: "REKRUT_STAFF",
        pemain: pelatih, // Kita pake key 'pemain' biar gampang dibaca sama sistem antrian
        proposal: proposal,
        biayaMuka: biayaMuka,
        waktuTunggu: 2,
        indexStaff: indexPelatihNego
    });

    // Tutup UI dan Refresh
    tutupModalProposalPelatih();
    tutupProfilStaff();
    updateDashboard();

    // Munculin Notif Sukses
    bukaModal(
        "PROPOSAL DIKIRIM! 📩",
        `Tawaran lu masuk ke meja agen <b>${pelatih.nama}</b>.<br><br>Dana deposit <b>Rp ${(biayaMuka / 1000000).toFixed(1)} Jt</b> ditahan sementara. Cek <b>KOTAK MASUK (EMAIL)</b> dalam 2 hari untuk melihat keputusannya!`,
        "#0891B2"
    );
};

window.jualPemain = function (index) {
    let p = rosterKita[index];
    let roleSama = rosterKita.filter(r => r.role === p.role).length;
    if (roleSama <= 1) {
        alert(
            `Lu gak bisa jual ${p.nama}! Tim butuh minimal 1 pemain untuk role ${p.role}.`
        );
        return;
    }
    let hargaJual = Math.floor(p.gaji * 1.5) + 10000000;
    pendingJualIndex = index;
    getEl("konfirmDesc").innerHTML =
        `Apakah lu yakin ingin menjual <b>${p.nama}</b>?<br><br>Dana yang akan cair: <b style="color:#C9971F;">Rp ${(hargaJual / 1000000).toFixed(1)} Jt</b><br><br><span style="font-size:11px; color:#5C6472;">Pemain ini akan langsung pindah ke Bursa Transfer.</span>`;
    getEl("modalKonfirmasi").classList.remove("sembunyi");
};

window.eksekusiJualPemain = function () {
    if (pendingJualIndex === -1) return;
    let index = pendingJualIndex;
    let p = rosterKita[index];
    let hargaJual = Math.floor(p.gaji * 1.5) + 10000000;
    kasTim += hargaJual;
    p.sisaKontrak = 2;
    p.harga = hargaJual + 5000000;
    pemainTransfer.push(p);
    rosterKita.splice(index, 1);
    catatKas("MASUK", hargaJual, `Penjualan Pemain: ${p.nama}`);
    tutupKonfirmasi();
    updateDashboard();
    setTimeout(() => {
        bukaModal(
            "PEMAIN DIJUAL 💸",
            `Lu berhasil menjual <b>${p.nama}</b>. Dana cair sebesar <b>Rp ${(hargaJual / 1000000).toFixed(1)} Jt</b>.`,
            "#00B37E"
        );
    }, 200);
};

// ==========================================
// SISTEM GENERATOR SPONSOR 2.0 (TIER & REPUTASI)
// ==========================================
window.generatePenawaranSponsor = function() {
    penawaranSponsor = [];

    // 1. Hitung Power Roster Tim Lu Saat Ini
    let powerTimKita = 0;
    if (rosterKita && rosterKita.length > 0) {
        let totalOvr = 0;
        rosterKita.forEach(p => totalOvr += p.ovr);
        powerTimKita = Math.floor(totalOvr / rosterKita.length);
    }

    // 2. Mesin Filter Tembok Gengsi (Cuma sponsor yang cocok Reputasi & Power yang lolos)
    let sponsorLayak = daftarSponsor.filter(s => 
        reputasiTim >= s.minimalReputasi && powerTimKita >= s.minimalPower
    );

    // 3. Acak sponsor yang lolos filter
    let shuffled = sponsorLayak.sort(() => 0.5 - Math.random());

    // [FIX] Batasi maksimal 1 tawaran DARK per generate -- sejak ada 3 varian
    // sponsor DARK (semua minimalReputasi 0), tanpa batas ini mereka bisa
    // mendominasi slot 3 penawaran dan bikin sponsor legit jarang muncul.
    let sudahAdaDark = false;
    shuffled = shuffled.filter(s => {
        if (s.tier !== "DARK") return true;
        if (sudahAdaDark) return false;
        sudahAdaDark = true;
        return true;
    });

    // Ambil maksimal 3 penawaran aja biar eksklusif
    let maxOffer = Math.min(3, shuffled.length);

    for (let i = 0; i < maxOffer; i++) {
        let sp = JSON.parse(JSON.stringify(shuffled[i])); // Copy data murni
        
        // Random durasi kontrak 1 sampai 2 musim aja
        sp.durasi = Math.floor(Math.random() * 2) + 1; 
        
        // Hitung total bayaran
        sp.bayar = sp.bayar * sp.durasi; 
        
        penawaranSponsor.push(sp);
    }
};

window.upgradeGH = function () {
    let nextGh = databaseGH[levelGH];
    if (!nextGh) return;

    if (kasTim >= nextGh.biayaUpgrade) {
        kasTim -= nextGh.biayaUpgrade;
        levelGH++;
        catatKas(
            "KELUAR",
            nextGh.biayaUpgrade,
            `Renovasi GH ke Level ${levelGH}`
        );
        bukaModal(
            "UPGRADE BERHASIL! 🏗️",
            `Fasilitas Gaming House lu udah naik ke <b>${nextGh.nama}</b>.<br><br>Sekarang lu bisa nampung <b>${nextGh.limitRoster} Pemain</b> dan <b>${nextGh.limitStaff} Staff</b>.`,
            "#00B37E"
        );
        renderFasilitas();
        updateDashboard();
    } else {
        bukaModal(
            "DANA KURANG",
            `Lu butuh kas minimal <b>Rp ${(nextGh.biayaUpgrade / 1000000).toFixed(1)} Jt</b> buat renovasi GH!`,
            "#E5484D"
        );
    }
};

// ==========================================
// EKSEKUSI KONTRAK & SISTEM 3 SLOT SPONSOR
// ==========================================
// ==========================================
// EVALUASI KPI SPONSOR (AKHIR MUSIM)
// ==========================================
// Sebelumnya field `kpi` di tiap sponsor cuma dipajang doang di UI,
// gak pernah dicek/dieksekusi. Sekarang dievaluasi 1x di akhir musim
// (dipanggil dari branch OFFSEASON, SEBELUM pData/pDataPH/dst di-reset
// buat musim baru) -- KPI tercapai = bonus cair, KPI gagal = kontrak
// sponsor diputus.
//
// Tier KPI diurutkan dari rendah ke tinggi (LOLOS_PLAYOFF < TOP_4 <
// GRAND_FINAL < JUARA_MPL) -- pencapaian player diukur sebagai LEVEL,
// jadi sponsor minta TOP_4 tapi player JUARA_MPL juga otomatis lolos.
//
// CATATAN PENTING: pencapaian ini didapat dari bracket pData/pDataPH/
// pDataMY/pDataSG + 9 region MPL baru (pDataKH/pDataMM/dst, lihat fix
// di tentukanPencapaianPlayoffPlayer()). Kalau tim player BUKAN tim MPL
// sama sekali (mis. MDL/MAL/LEN), nama player gak akan pernah ketemu di
// bracket manapun, jadi KPI apapun selain "NONE" otomatis dianggap
// GAGAL. Ini wajar karena syarat minimalPower/minimalReputasi sponsor
// tier S/A biasanya emang udah nyaring tim non-MPL duluan.
const KPI_BONUS_MULTIPLIER = 0.5; // bonus = 50% dari `bayar` musiman sponsor itu

// ==========================================
// SISTEM INVESTIGASI & DENDA SPONSOR ILEGAL
// ==========================================
// Tabel denda bertingkat (escalating). Index 0 = level 1 (pelanggaran pertama),
// dst. Setelah nyampe index terakhir (level 3/maksimal), pelanggaran
// berikutnya tetap pakai level itu (gak naik lagi, gak pernah reset ke level 1).
const TABEL_DENDA_ILEGAL = [
    { persen: 0.50, durasi: 2 }, // Level 1
    { persen: 0.75, durasi: 3 }, // Level 2
    { persen: 1.00, durasi: 4 }  // Level 3 (Maksimal)
];
// Peluang investigasi per musim (disembunyikan dari player, sesuai aturan).
const PELUANG_INVESTIGASI_PLAYER = 0.30;
const PELUANG_INVESTIGASI_AI = 0.30;

window._investigasiPlayer = window._investigasiPlayer || { level: 0, cicilan: [] };

// Tagih semua cicilan denda yang masih nunggak (dipanggil tiap akhir musim,
// baik ada pelanggaran baru atau bukan -- cicilan lama tetap jalan terus).
function tagihCicilanDendaIlegal(state, target, labelPenerima) {
    if (!state.cicilan || state.cicilan.length === 0) return;
    state.cicilan.forEach(c => {
        if (c.sisaMusim <= 0) return;
        if (target === window) {
            kasTim = Math.max(0, kasTim - c.nominalPerMusim);
        } else {
            target.kas = Math.max(0, (target.kas || 0) - c.nominalPerMusim);
        }
        if (typeof catatKas === "function" && target === window) {
            catatKas("KELUAR", c.nominalPerMusim, `Cicilan Denda Investigasi: ${c.sumber}`);
        }
        c.sisaMusim--;
    });
    state.cicilan = state.cicilan.filter(c => c.sisaMusim > 0);
}

// Eksekusi 1x pelanggaran: naikin level, hitung denda, masukin cicilan baru,
// bayar cicilan pertama LANGSUNG di musim ini juga.
function eksekusiPelanggaranIlegal(state, nilaiKontrakTotal, namaSponsor) {
    state.level = Math.min(state.level + 1, TABEL_DENDA_ILEGAL.length);
    let tabel = TABEL_DENDA_ILEGAL[state.level - 1];
    let totalDenda = Math.floor(nilaiKontrakTotal * tabel.persen);
    let perMusim = Math.floor(totalDenda / tabel.durasi);
    state.cicilan.push({
        sisaMusim: tabel.durasi,
        nominalPerMusim: perMusim,
        sumber: namaSponsor
    });
    return { totalDenda, perMusim, durasi: tabel.durasi, level: state.level };
}

// Investigasi buat PLAYER -- dipanggil tiap akhir musim (bareng evaluasiKPISponsor).
function investigasiSponsorIlegal() {
    if (!window.sponsorTim) return;

    // 1. Tagih dulu semua cicilan denda pelanggaran sebelumnya (kalau ada)
    tagihCicilanDendaIlegal(window._investigasiPlayer, window, "Player");

    // 2. Cek sponsor DARK yang masih aktif (selalu di slot utama)
    let sp = window.sponsorTim.utama;
    if (!sp || sp.tier !== "DARK") return;

    // 3. Roll peluang investigasi (mekanismenya rahasia dari player)
    if (Math.random() >= PELUANG_INVESTIGASI_PLAYER) return; // lolos, aman

    // 4. KETANGKAP -- eksekusi sanksi
    let hasil = eksekusiPelanggaranIlegal(window._investigasiPlayer, sp.bayar, sp.nama);
    reputasiTim = Math.max(0, reputasiTim - 10);
    window.sponsorTim.utama = null; // kontrak diputus paksa

    // Bayar cicilan pertama LANGSUNG (musim ini juga kena)
    tagihCicilanDendaIlegal(window._investigasiPlayer, window, "Player");

    let labelLevel = ["Pertama", "Kedua", "Ketiga (Maksimal)"][hasil.level - 1] || `Level ${hasil.level}`;
    tambahEmail(
        "🚨 SURAT PANGGILAN: Investigasi Sponsor Ilegal",
        "Departemen Integritas Liga MPL",
        `Kepada Manajer <b>${timPlayer}</b>,<br><br>
        Berdasarkan hasil investigasi resmi, tim Anda terbukti menerima dana dari sponsor ilegal <b>${sp.nama}</b>.<br><br>
        Ini merupakan pelanggaran ke-<b>${hasil.level}</b> (${labelLevel}) yang terdeteksi dari tim Anda.<br><br>
        <b>Sanksi yang dijatuhkan:</b><br>
        • Denda total: <span style="color:#E5484D;">Rp ${(hasil.totalDenda / 1000000).toFixed(1)} Jt</span> (dicicil ${hasil.durasi} musim, ~Rp ${(hasil.perMusim / 1000000).toFixed(1)} Jt/musim)<br>
        • Reputasi tim turun tambahan -10<br>
        • Kontrak sponsor <b>${sp.nama}</b> diputus paksa efektif sekarang<br><br>
        Keputusan ini bersifat final dan tidak dapat diganggu gugat.<br><br>
        <i>Hormat kami,<br>Departemen Integritas Liga MPL</i>`
    );
}


function tentukanPencapaianPlayoffPlayer() {
    // [FIX] Sebelumnya cuma ngecek 4 region lama (pData/PH/MY/SG) --
    // 9 region MPL baru (KH/MM/MENA/TR/EECA/EA/AM/IN/WEU) gak pernah
    // di-cek sama sekali. Akibatnya kalau tim player ada di salah satu
    // dari 9 region itu, fungsi ini SELALU balikin null apapun hasil
    // playoff-nya -- termasuk kalau JUARA sekalipun -- jadi semua
    // sponsor yang punya target KPI (TOP_4/GRAND_FINAL/JUARA_MPL) pasti
    // dianggap GAGAL & kontraknya diputus tiap akhir musim, walau tim
    // player sebenarnya berprestasi. Sekarang 9 region baru itu ikut
    // dicek juga lewat window["pData"+kode] (struktur bracket-nya
    // mirroring persis punya PH/MY/SG).
    let semuaPData = [
        (typeof pData !== "undefined") ? pData : null,
        window.pDataPH || null,
        window.pDataMY || null,
        window.pDataSG || null
    ];
    (window.REGION_SINGLE_TIER_BARU || []).forEach(kode => {
        semuaPData.push(window["pData" + kode] || null);
    });
    semuaPData = semuaPData.filter(pd => pd && pd.m8);

    for (let pd of semuaPData) {
        if (!pd.m8.menang || !pd.m8.home || !pd.m8.away) continue; // grand final region ini belum kelar
        if (pd.m8.menang.nama === timPlayer) return "JUARA_MPL";
        if (pd.m8.home.nama === timPlayer || pd.m8.away.nama === timPlayer) return "GRAND_FINAL";
        if ((pd.m5 && pd.m5.kalah && pd.m5.kalah.nama === timPlayer) ||
            (pd.m7 && pd.m7.kalah && pd.m7.kalah.nama === timPlayer)) return "TOP_4";
        if ((pd.m1 && pd.m1.kalah && pd.m1.kalah.nama === timPlayer) ||
            (pd.m2 && pd.m2.kalah && pd.m2.kalah.nama === timPlayer)) return "LOLOS_PLAYOFF";
    }
    return null; // gak ketemu di bracket manapun -> gak lolos playoff musim ini
}

function evaluasiKPISponsor() {
    if (!window.sponsorTim) return;

    let urutanTier = ["LOLOS_PLAYOFF", "TOP_4", "GRAND_FINAL", "JUARA_MPL"];
    let pencapaian = tentukanPencapaianPlayoffPlayer();
    let levelPencapaian = pencapaian ? urutanTier.indexOf(pencapaian) : -1;

    let labelSlot = { utama: "Sponsor Utama", minor1: "Sponsor Minor 1", minor2: "Sponsor Minor 2" };

    ["utama", "minor1", "minor2"].forEach(slot => {
        let sp = window.sponsorTim[slot];
        if (!sp || !sp.kpi || sp.kpi === "NONE") return; // gak ada target, aman otomatis

        let levelTarget = urutanTier.indexOf(sp.kpi);
        if (levelTarget === -1) return; // KPI gak dikenali, skip aman (jaga2)

        let tercapai = levelPencapaian >= levelTarget;

        if (tercapai) {
            let bonus = Math.floor((sp.bayar || 0) * KPI_BONUS_MULTIPLIER);
            kasTim += bonus;
            if (typeof catatKas === "function") catatKas("MASUK", bonus, `Bonus KPI Tercapai: ${sp.nama}`);
        } else {
            window.sponsorTim[slot] = null;
        }
    });
}

window.ambilSponsor = function (index) {
    let s = penawaranSponsor[index];
    if (!s) return;

    // 1. Tentukan ini masuk Slot Utama atau Minor
    let isMain = (s.tier === "S" || s.tier === "A" || s.tier === "DARK");
    
    // 2. Cek Ketersediaan Slot
    if (isMain) {
        if (window.sponsorTim.utama !== null) {
            bukaModal("SLOT PENUH 🔒", "Slot Sponsor Utama (Dada) sudah terisi! Tunggu kontrak saat ini habis.", "#E5484D");
            return;
        }
    } else {
        if (window.sponsorTim.minor1 !== null && window.sponsorTim.minor2 !== null) {
            bukaModal("SLOT PENUH 🔒", "Kedua Slot Sponsor Minor (Lengan) sudah penuh! Tunggu salah satu habis.", "#E5484D");
            return;
        }
    }

    // 3. Eksekusi Kontrak (Duit Masuk)
    s.sisaDurasi = s.durasi;
    kasTim += s.bayar;

    // Masukkan ke slot yang tepat
    let namaSlot = "";
    if (isMain) {
        window.sponsorTim.utama = s;
        namaSlot = "UTAMA";
    } else if (window.sponsorTim.minor1 === null) {
        window.sponsorTim.minor1 = s;
        namaSlot = "MINOR 1";
    } else {
        window.sponsorTim.minor2 = s;
        namaSlot = "MINOR 2";
    }

    // 4. HUKUMAN "DARK MONEY" (Sponsor Ilegal)
    let teksPenalti = "";
    if (s.tier === "DARK") {
        let penaltiRep = 15;
        reputasiTim -= penaltiRep;
        if (reputasiTim < 0) reputasiTim = 0; // Gak bisa minus
        teksPenalti = `⚠️ REPUTASI TURUN -${penaltiRep}! Komunitas E-sports mengecam keputusan Anda menerima dana dari sponsor kontroversial.`;
    } else {
        tambahBerita(`🤝 Kontrak Baru: <span>${timPlayer}</span> resmi menggandeng ${s.nama} sebagai Sponsor ${namaSlot}.`);
    }

    // 5. Catat ke Keuangan & Munculin Notif
    catatKas("MASUK", s.bayar, `Kontrak ${s.durasi} Musim: ${s.nama} (${namaSlot})`);
    if (typeof window.bukaModalKontrakSponsor === "function") {
        window.bukaModalKontrakSponsor(s.nama, namaSlot, s.durasi, s.bayar, teksPenalti || null);
    } else {
        let penaltiWrap = teksPenalti ? `<br><br><span style="color:#E5484D; font-weight:bold;">${teksPenalti}</span>` : "";
        bukaModal(
            "KONTRAK RESMI DITANDATANGANI! 🤝",
            `<b>${s.nama}</b> sepakat menjadi Sponsor ${namaSlot} dengan durasi <b>${s.durasi} Musim</b>.<br><br>Dana cair: <b style="color:#00B37E;">Rp ${(s.bayar / 1000000).toFixed(1)} Jt</b>${penaltiWrap}`,
            isMain ? "#C9971F" : "#0891B2"
        );
    }

    // Hapus tawaran ini dari list, tapi sisa penawaran lain tetep ada (biar bisa ambil minor sekalian)
    penawaranSponsor.splice(index, 1);
    
    // Refresh UI Sponsor (Nanti kita perbarui visualnya)
    updateDashboard();
};

window.intaiPemain = function (i) {
    // Wajib punya analis untuk intai potensi pemain
    if (!staffKita.analis) {
        bukaModal("ANALIS DIBUTUHKAN 🔍", "Tim kamu belum punya Analis. Rekrut Analis terlebih dahulu untuk dapat mengintai potensi pemain.", "#C9971F");
        return;
    }
    if (kasTim >= 5000000) {
        kasTim -= 5000000;
        let p = pemainTransfer[i];
        p.scouted = true;
        catatKas("KELUAR", 5000000, `Sewa Talent Scout: ${p.nama}`);
        updateDashboard();

        // Hitung potensi tampil berdasarkan dataAnalysis analis
        let { potensiTampil, sifatTampil } = hitungPotensiTampil(p);

        // Langsung buka sensor atributnya di tempat!
        getEl("profilPotensi").innerText = potensiTampil;
        getEl("profilOvr").innerText = p.ovr;
        getEl("profilMekanik").innerText = p.mekanik;
        getEl("profilMakro").innerText = p.makro;
        getEl("profilMental").innerText = p.mental;
        getEl("profilSpesialis").innerText = p.spesialis;
        if (typeof syncProfilAttrBars === "function") syncProfilAttrBars();

        // Tampilkan info akurasi analis
        let da = (staffKita.analis && staffKita.analis.atribut) ? (staffKita.analis.atribut.dataAnalysis || 0) : 0;
        let infoScouting = da === 0
            ? `⚠️ Tanpa analis — potensi tidak dapat dianalisis.`
            : da >= 90 ? `🎯 Laporan analis akurat 100%.`
            : da >= 80 ? `✅ Laporan analis sangat akurat (±2). Sifat: <b>${sifatTampil}</b>.`
            : da >= 60 ? `📊 Laporan analis cukup akurat (±5).`
            : da >= 40 ? `📉 Laporan analis kurang akurat (±10).`
            : `⚠️ Laporan analis tidak akurat (±15).`;
        if (typeof tambahBerita === "function") {
            tambahBerita(`🔍 Scout: <b>${p.nama}</b> diintai — Potensi terlapor: <b>${potensiTampil}</b>. ${infoScouting}`);
        }

        // Ubah tombolnya langsung jadi abu-abu (disable)
        let btnJual = getEl("btnProfilJual");
        btnJual.style.background = "#333";
        btnJual.style.color = "#888";
        btnJual.innerText = "SUDAH DIINTAI";
        btnJual.disabled = true;
        btnJual.onclick = null;
    } else {
        bukaModal(
            "DANA KURANG",
            "Kas tim tidak cukup untuk menyewa pencari bakat.",
            "#E5484D"
        );
    }
};

function buatJadwalMusim() {
    // 1. Tentukan region utama lu
    let regionTujuan = daftarTim;
    if (daftarTimPH.some(t => t.nama === timPlayer)) regionTujuan = daftarTimPH;
    else if (daftarTimMY.some(t => t.nama === timPlayer))
        regionTujuan = daftarTimMY;
    else if (daftarTimSG.some(t => t.nama === timPlayer))
        regionTujuan = daftarTimSG;
    // [MSC x EWC 2026 - FASE 2] 9 region baru single-tier -- player bisa
    // pilih salah satu dari region ini sebagai tim awal (Q10).
    else if (typeof daftarTimKH !== "undefined" && daftarTimKH.some(t => t.nama === timPlayer)) regionTujuan = daftarTimKH;
    else if (typeof daftarTimMM !== "undefined" && daftarTimMM.some(t => t.nama === timPlayer)) regionTujuan = daftarTimMM;
    else if (typeof daftarTimMENA !== "undefined" && daftarTimMENA.some(t => t.nama === timPlayer)) regionTujuan = daftarTimMENA;
    else if (typeof daftarTimTR !== "undefined" && daftarTimTR.some(t => t.nama === timPlayer)) regionTujuan = daftarTimTR;
    else if (typeof daftarTimEECA !== "undefined" && daftarTimEECA.some(t => t.nama === timPlayer)) regionTujuan = daftarTimEECA;
    else if (typeof daftarTimEA !== "undefined" && daftarTimEA.some(t => t.nama === timPlayer)) regionTujuan = daftarTimEA;
    else if (typeof daftarTimAM !== "undefined" && daftarTimAM.some(t => t.nama === timPlayer)) regionTujuan = daftarTimAM;
    else if (typeof daftarTimIN !== "undefined" && daftarTimIN.some(t => t.nama === timPlayer)) regionTujuan = daftarTimIN;
    else if (typeof daftarTimWEU !== "undefined" && daftarTimWEU.some(t => t.nama === timPlayer)) regionTujuan = daftarTimWEU;

    // 2. Fungsi Generator Jadwal Universal
    function bikinJadwal(arrayTim) {
        let timList = [...arrayTim].sort(() => Math.random() - 0.5);
        if (timList.length % 2 !== 0) timList.push({ nama: "BYE" });
        let matches = [];
        for (let putaran = 0; putaran < 2; putaran++) {
            for (let r = 0; r < timList.length - 1; r++) {
                for (let i = 0; i < timList.length / 2; i++) {
                    let h = timList[i];
                    let a = timList[timList.length - 1 - i];
                    if (h.nama !== "BYE" && a.nama !== "BYE") {
                        matches.push({
                            home: putaran === 1 ? a : h,
                            away: putaran === 1 ? h : a,
                            sudahMain: false,
                            skorHome: 0,
                            skorAway: 0,
                            poin: 0
                        });
                    }
                }
                let last = timList.pop();
                timList.splice(1, 0, last);
            }
        }
        return matches;
    }

    // 3. Set Jadwal Utama (Region Lu)
    let mainMatches = bikinJadwal(regionTujuan);
    jadwalMatch = [];
    jadwalTimPlayer = [];
    bankJadwalMaster = [];
    // FIX: jadwal MPL/LEN harus dimulai dari tanggal RESMI MPL/LEN mulai (27 Mar S1 /
    // 25 Sep S2), bukan dari kalenderGame saat ini (yang masih di 9 Feb — tanggal MDL
    // mulai). Sebelumnya simDate = kalenderGame sehingga match MPL dijadwalkan mulai
    // dari 9 Feb, 6 minggu lebih cepat dari seharusnya.
    let simDate;
    if (typeof ambilTabelTanggalMusimSaatIni === "function") {
        let tblSim = ambilTabelTanggalMusimSaatIni();
        simDate = tblSim ? new Date(tblSim.mplLenMulai.getTime()) : new Date(kalenderGame.getTime());
    } else {
        simDate = new Date(kalenderGame.getTime());
    }

    // 3a. Tentukan minggu untuk tiap match (maks 9 minggu)
    let perMingguIdeal = mainMatches.length / 9;
    mainMatches.forEach((match, i) => {
        let weekLokal = Math.floor(i / perMingguIdeal) + 1;
        match.week = weekLokal > 9 ? 9 : weekLokal;
    });

    // 3b. Sebar match tiap minggu ke 3 hari (Jumat/Sabtu/Minggu),
    // diusahakan 1 tim gak main 2x di hari yang sama dalam minggu yang sama.
    // Biar realistis kayak MPL: tiap tim main maksimal 2x/minggu di hari berbeda.
    for (let w = 1; w <= 9; w++) {
        let matchMinggu = mainMatches.filter(m => m.week === w);
        if (matchMinggu.length === 0) continue;

        let slotHari = [[], [], []]; // 0 = Jumat, 1 = Sabtu, 2 = Minggu
        let timPerHari = [new Set(), new Set(), new Set()];

        matchMinggu.forEach(match => {
            let kandidat = [0, 1, 2].filter(
                d =>
                    !timPerHari[d].has(match.home.nama) &&
                    !timPerHari[d].has(match.away.nama)
            );
            if (kandidat.length === 0) kandidat = [0, 1, 2];
            // Pilih hari yang masih paling longgar (biar tersebar rata)
            kandidat.sort((a, b) => slotHari[a].length - slotHari[b].length);
            let pilih = kandidat[0];

            slotHari[pilih].push(match);
            timPerHari[pilih].add(match.home.nama);
            timPerHari[pilih].add(match.away.nama);
        });

        slotHari.forEach((daftarMatchHari, hariIdx) => {
            if (daftarMatchHari.length === 0) return;
            let addDays = (w - 1) * 7 + hariIdx; // Jumat:+0, Sabtu:+1, Minggu:+2 dari awal minggu
            let dateLog = new Date(simDate);
            dateLog.setDate(dateLog.getDate() + addDays);
            let tanggalStr = dateLog.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
            daftarMatchHari.forEach(match => {
                match.tanggal = tanggalStr;
                match.tanggalRaw = dateLog.getTime();
            });
        });
    }

    // 3c. Masukkan ke jadwalMatch, jadwalTimPlayer, dan bankJadwalMaster
    mainMatches.forEach(match => {
        bankJadwalMaster.push(match);
        jadwalMatch.push(match);
        if (match.home.nama === timPlayer || match.away.nama === timPlayer)
            jadwalTimPlayer.push(match);
    });
    // Urutkan bankJadwalMaster secara kronologis (buat tampilan jadwal per tim),
    // tanpa mengubah urutan jadwalMatch/jadwalTimPlayer yang dipakai simulasi.
    bankJadwalMaster.sort((a, b) => a.tanggalRaw - b.tanggalRaw);
    // FIX: sort berdasarkan tanggalRaw DESCENDING supaya pop() mengambil
    // match paling awal (tanggal terkecil) duluan. reverse() saja tidak cukup
    // karena urutan bikinJadwal() bukan kronologis — tergantung rotasi round robin.
    jadwalMatch.sort((a, b) => (b.tanggalRaw || 0) - (a.tanggalRaw || 0));
    jadwalTimPlayer.sort((a, b) => (b.tanggalRaw || 0) - (a.tanggalRaw || 0));

    // 4. Set Jadwal AI (Hanya buat region yang BUKAN region lu)
    window.jadwalMatchID =
        regionTujuan === daftarTim ? [] : bikinJadwal(daftarTim).reverse();
    window.jadwalMatchPH =
        regionTujuan === daftarTimPH ? [] : bikinJadwal(daftarTimPH).reverse();
    window.jadwalMatchMY =
        regionTujuan === daftarTimMY ? [] : bikinJadwal(daftarTimMY).reverse();
    window.jadwalMatchSG =
        regionTujuan === daftarTimSG ? [] : bikinJadwal(daftarTimSG).reverse();

    // [MSC x EWC 2026 - FASE 2] Jadwal AI 9 region baru (format sama:
    // round-robin genap, gak ada tanggal spesifik -- konsumsi 1
    // match/hari lewat simulasikanAI(), sama kayak PH/MY/SG)
    if (typeof daftarTimKH !== "undefined")
        window.jadwalMatchKH = regionTujuan === daftarTimKH ? [] : bikinJadwal(daftarTimKH).reverse();
    if (typeof daftarTimMM !== "undefined")
        window.jadwalMatchMM = regionTujuan === daftarTimMM ? [] : bikinJadwal(daftarTimMM).reverse();
    if (typeof daftarTimMENA !== "undefined")
        window.jadwalMatchMENA = regionTujuan === daftarTimMENA ? [] : bikinJadwal(daftarTimMENA).reverse();
    if (typeof daftarTimTR !== "undefined")
        window.jadwalMatchTR = regionTujuan === daftarTimTR ? [] : bikinJadwal(daftarTimTR).reverse();
    if (typeof daftarTimEECA !== "undefined")
        window.jadwalMatchEECA = regionTujuan === daftarTimEECA ? [] : bikinJadwal(daftarTimEECA).reverse();
    if (typeof daftarTimEA !== "undefined")
        window.jadwalMatchEA = regionTujuan === daftarTimEA ? [] : bikinJadwal(daftarTimEA).reverse();
    if (typeof daftarTimAM !== "undefined")
        window.jadwalMatchAM = regionTujuan === daftarTimAM ? [] : bikinJadwal(daftarTimAM).reverse();
    if (typeof daftarTimIN !== "undefined")
        window.jadwalMatchIN = regionTujuan === daftarTimIN ? [] : bikinJadwal(daftarTimIN).reverse();
    if (typeof daftarTimWEU !== "undefined")
        window.jadwalMatchWEU = regionTujuan === daftarTimWEU ? [] : bikinJadwal(daftarTimWEU).reverse();
}

// ==========================================
// FUNGSI HITUNG KEKUATAN MATCH (SISTEM 75-20-5)
// ==========================================
// ==========================================
// FASE 15 — CHEMISTRY SEBAGAI MODIFIER TERPISAH (BUKAN PART DARI POWER DASAR)
// ==========================================
// Sebelumnya, skor chemistry tim player dihitung di ui.js (updateDashboard)
// dan ikut di-assign ke timKita.power, sehingga "power" tim ter-update
// SETIAP RENDER DASHBOARD (32+ titik panggilan), bukan cuma saat transfer.
// Ini melanggar prinsip "power dasar cuma berubah saat transfer" yang
// sudah disepakati. Fungsi ini meng-extract logika chemistry MURNI
// sebagai modifier performa SAAT MATCH, terpisah dari power dasar.
// power dasar (tim.power) sekarang HANYA representasi rata-rata OVR
// roster (+ via hitungPowerTim), sedangkan chemistry/staff/RNG dihitung
// real-time di hitungPerformaMatch() tiap simulasi pertandingan --
// tidak pernah ditulis permanen ke tim.power.
function hitungChemistryScore(roster) {
    let chemScore = 50; // base awal
    let mainPlayersObj = (roster || []).filter(p => p.isStarter);
    if (mainPlayersObj.length < 5) {
        mainPlayersObj = [...(roster || [])].sort((a, b) => (b.ovr||0)-(a.ovr||0)).slice(0, 5);
    }

    if (mainPlayersObj.length === 5) {
        let countPekerjaKeras = 0, countMalas = 0, countries = {};
        mainPlayersObj.forEach(p => {
            let s = p.sifat ? p.sifat : "Normal";
            if (s === "Pekerja Keras") countPekerjaKeras++;
            if (s === "Malas") countMalas++;
            let negara = p.negara ? p.negara : "🇮🇩 Indonesia";
            countries[negara] = (countries[negara] || 0) + 1;
        });

        if (countPekerjaKeras >= 3) chemScore += 25;
        if (countMalas > 0) chemScore -= countMalas * 15;
        if (countPekerjaKeras > 0 && countMalas > 0) chemScore -= 15;

        let toxicPlayers = mainPlayersObj.filter(p => p.moral !== undefined && p.moral < 30).length;
        if (toxicPlayers > 0) chemScore -= toxicPlayers * 15;

        let maxSameCountry = Math.max(...Object.values(countries));
        if (maxSameCountry === 5) chemScore += 20;
        else if (maxSameCountry >= 3) chemScore += 10;
    } else {
        chemScore = 0;
    }

    return Math.max(0, Math.min(100, chemScore));
}

// Modifier performa dari chemistry, dipakai SAAT MATCH SAJA (bukan
// disimpan permanen ke tim.power). Range sama dgn logika lama: +-10%
// dari base power, supaya efeknya tetap terasa sama seperti sebelumnya,
// cuma sekarang sumbernya real-time per-match, bukan nempel di power dasar.
function hitungModifierChemistryMatch(basePower, roster) {
    let chemScore = hitungChemistryScore(roster);
    if (chemScore >= 80) return Math.floor(basePower * 0.1);
    if (chemScore < 40) return -Math.floor(basePower * 0.1);
    return 0;
}

// ================================================================
// [BUGFIX] MORAL PASCA-MATCH — SEKARANG BERLAKU UNTUK SEMUA TIM
// Sebelumnya logika ini cuma ditulis inline khusus rosterKita di
// dalam blok "melibatkanPlayer" pada loop simulasi harian, jadi tim
// AI (termasuk lawan langsung player) tidak PERNAH punya .moral yang
// hidup -- sifat "Malas"/"Pekerja Keras" mereka jadi tidak pernah
// kena efek toxic-moral di hitungChemistryScore(). Fungsi generik ini
// dipakai di SEMUA titik resolusi match (player, AI vs AI di region
// sendiri, AI vs AI region lain, & playoff/turnamen) lewat
// hitungPerformaMatch() / simulasikanSeries() / dramatis-nya.
// Starter ditentukan sama seperti hitungPerformaMatch(): pakai flag
// isStarter utk tim kita, dan top-5 OVR utk tim AI (krn roster AI
// gak selalu punya isStarter persisten).
// ================================================================
function terapkanMoralPascaMatch(tim) {
    if (!tim || tim.nama === undefined) return false;
    let isTimKita = typeof timPlayer !== "undefined" && tim.nama === timPlayer;
    let roster = isTimKita ? rosterKita : (tim.roster || []);
    if (!roster || roster.length === 0) return false;

    let namaStarter;
    if (isTimKita) {
        let starter = roster.filter(p => p.isStarter);
        if (starter.length < 5) {
            starter = [...roster].sort((a, b) => (b.ovr||0) - (a.ovr||0)).slice(0, 5);
        }
        namaStarter = starter.map(p => p.nama);
    } else {
        namaStarter = [...roster]
            .sort((a, b) => (b.ovr||0) - (a.ovr||0))
            .slice(0, 5)
            .map(p => p.nama);
    }

    let moralDrop = false;
    roster.forEach(p => {
        if (p.moral === undefined) p.moral = 100;
        if (namaStarter.includes(p.nama)) {
            p.moral = Math.min(100, p.moral + 15);
        } else {
            p.moral = Math.max(0, p.moral - 20);
            if (p.moral < 30) moralDrop = true;
        }
    });

    // Berita rumor cuma utk tim kita (biar gak spam berita tiap AI main)
    if (isTimKita && moralDrop && Math.random() < 0.3) {
        tambahBerita(
            `⚠️ Rumor Tim: Beberapa pemain cadangan mulai frustrasi dan merusak suasana ruang ganti karena kurangnya menit bermain.`
        );
    }
    return moralDrop;
}

// ==========================================
// FASE 15 FIX — FUNGSI hitungPowerTim() YANG HILANG
// ==========================================
// Bug ditemukan: fungsi ini sudah direferensikan sejak Fase 9
// (acquisition_merger_patch.js) lewat `typeof hitungPowerTim === "function"`,
// tapi TIDAK PERNAH didefinisikan di manapun di codebase -- selalu
// fallback diam-diam ke power lama tanpa pernah benar2 recalculate.
// Formula: rata-rata OVR roster (power dasar, TANPA staff/chemistry/RNG
// -- itu semua modifier match-time terpisah, lihat hitungPerformaMatch()).
function hitungPowerTim(tim) {
    if (!tim || !tim.roster || tim.roster.length === 0) return tim ? (tim.power || 0) : 0;
    let totalOvr = tim.roster.reduce((sum, p) => sum + (p.ovr || 0), 0);
    return Math.floor(totalOvr / tim.roster.length);
}
window.hitungPowerTim = hitungPowerTim;

function hitungPerformaMatch(timObj) {
    let isTimKita =
        typeof timPlayer !== "undefined" && timObj.nama === timPlayer;

    // --- 1. FAKTOR PEMAIN (PORSI 75%) ---
    let totalOvrPemain = 0;
    let roster = isTimKita ? rosterKita : timObj.roster || [];
    let starters = [];

    if (isTimKita) {
        starters = roster.filter(p => p.isStarter);
        if (starters.length < 5)
            starters = [...roster].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    } else {
        starters = [...roster].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    }

    // [BARU] Filter eligibility MSC/M7 -- pemain yang gabung SETELAH
    // roster lock turnamen internasional gak boleh diturunin sampai
    // musim MPL berikutnya mulai (lihat penjelasan lengkap di
    // calendar_system_patch.js -> apakahPemainEligibleMSCM7). Starter
    // yang ineligible diganti pemain eligible di role yang sama dari
    // sisa roster kalau ada; kalau gak ada pengganti, tetap dimainkan
    // apa adanya (skenario langka -- tim yang lolos MSC/M7 kecil
    // kemungkinan jual core roster mereka sendiri).
    if (window._konteksMatchAktif &&
        (window._konteksMatchAktif.indexOf("msc_") === 0 || window._konteksMatchAktif.indexOf("m7_") === 0) &&
        typeof window.apakahPemainEligibleMSCM7 === "function") {
        starters = starters.map(p => {
            if (window.apakahPemainEligibleMSCM7(p, timObj)) return p;
            let pengganti = roster
                .filter(x => x.role === p.role && !starters.includes(x) && window.apakahPemainEligibleMSCM7(x, timObj))
                .sort((a, b) => (b.ovr || 0) - (a.ovr || 0))[0];
            return pengganti || p; // gak ada pengganti eligible -> tetap pakai yang ada
        });
    }

    // --- TRACKING JAM MAIN (buat jarangDimainkanBonus / retirement chance) ---
    // hitungPerformaMatch() adalah satu-satunya titik yang dilewati SEMUA
    // match di semua liga (MPL/MDL/LEN/MAL/MSC/M-Series), jadi ini titik
    // paling akurat buat nyatet "pemain ini beneran main game ke berapa".
    timObj.totalPertandinganMusimIni = (timObj.totalPertandinganMusimIni || 0) + 1;
    starters.forEach(p => {
        if (p && p.nama) p.mainMusimIni = (p.mainMusimIni || 0) + 1;
    });

    starters.forEach(p => (totalOvrPemain += p.ovr || 0));
    let rataPemain =
        starters.length > 0 ? totalOvrPemain / 5 : timObj.power || 65;

    let powerPemain = rataPemain * 0.75;

    // --- 2. FAKTOR STAFF (PORSI 20%) ---
    let totalOvrStaff = 0;
    let staffObj = isTimKita ? staffKita : timObj.staff || {};

    if (staffObj.pelatih)
        totalOvrStaff += (staffObj.pelatih.buffPower || 2) * 10;
    if (staffObj.asisten)
        totalOvrStaff += (staffObj.asisten.buffPower || 1) * 10;
    if (staffObj.analis) totalOvrStaff += (staffObj.analis.buffPower || 1) * 10;

    let rataStaff = totalOvrStaff / 3;
    let powerStaff = rataStaff * 0.2;

    // --- 3. FAKTOR KEBERUNTUNGAN (PORSI 5%) ---
    // RNG murni dari 0 sampai 5 buat ngasih elemen kejutan/blunder!
    let rng = Math.random() * 5;

    let base = powerPemain + powerStaff + rng;

    // ✅ [FIX 2] MODIFIER MENTAL & STAMINA — Aktif untuk tim player
    // Modifier dihitung dari rata-rata mental & stamina 5 starter tim player.
    // Range modifier: sekitar -5 sampai +2 poin performa.
    if (isTimKita && typeof window.getFanbaseModifier === "function") {
        let modifier = window.getFanbaseModifier();
        base += modifier;
    }

    // === FASE 15: Modifier chemistry SAAT MATCH (bukan part dari power
    // dasar yang disimpan).
    // [BUGFIX] Sebelumnya cuma berlaku utk tim player (if isTimKita),
    // jadi roster AI dengan sifat "Malas"/"Pekerja Keras" gak pernah
    // kena efek chemistry walau datanya sudah ada di database. Sekarang
    // berlaku utk SEMUA tim -- pakai guard roster.length>=5 (bukan
    // isTimKita) supaya tim yang rosternya belum lengkap (<5 pemain)
    // gak kena penalti chemistry yang gak adil/gak representatif.
    if (roster && roster.length >= 5) {
        base += hitungModifierChemistryMatch(base, roster);
    }

    return base;
}
// ✅ [FIX 2] Expose ke window agar bisa diakses oleh fanbase_patch.js
window.hitungPerformaMatch = hitungPerformaMatch;

// ==========================================
// SISTEM HIGHLIGHT & MVP PERTANDINGAN
// ==========================================
// Ambil 5 starter (atau top-5 OVR) dari sebuah tim, buat dipakai
// nentuin "hero" di highlight & MVP.
window.ambilStarter5 = function (timObj) {
    let isKita =
        typeof timPlayer !== "undefined" && timObj.nama === timPlayer;
    let roster = isKita ? rosterKita : timObj.roster || [];
    let starters = [];

    if (isKita) {
        starters = roster.filter(p => p.isStarter);
        if (starters.length < 5)
            starters = [...roster].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    } else {
        starters = [...roster].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    }
    return starters;
};

const TEMPLATE_HIGHLIGHT = {
    ketat: [
        "⚔️ Game super sengit! {hero} ({role}) bikin clutch decisive teamfight di menit-menit akhir untuk {tim}!",
        "😱 DRAMA sampai akhir! Comeback tipis dari {tim}, {hero} jadi penentu lewat solo kill krusial!",
        "🔥 Nail-biter! Kedua tim baku hantam ketat, tapi {hero} unggul di momen paling krusial buat {tim}."
    ],
    normal: [
        "💪 {hero} ({role}) tampil dominan dan mengarahkan {tim} meraih kemenangan dengan solid.",
        "📈 {tim} mengontrol tempo permainan sejak early game, {hero} jadi kunci utamanya.",
        "🎯 Rotasi rapi dari {tim}, {hero} jadi pembeda di teamfight-teamfight penting."
    ],
    telak: [
        "🚀 DOMINASI TOTAL! {tim} menghancurkan lawan dengan mudah, {hero} bermain hampir tanpa cela!",
        "💀 One-sided! {hero} dan rekan setim overpower musuh sejak menit pertama untuk {tim}.",
        "🏆 Comfortable win buat {tim}, {hero} tampil sangat impresif sepanjang game."
    ]
};

// Bikin 1 highlight untuk 1 game di dalam sebuah series.
window.buatHighlightGame = function (timMenang, timKalah, selisih) {
    let starter = window.ambilStarter5(timMenang);
    let hero =
        starter.length > 0
            ? starter[Math.floor(Math.random() * starter.length)]
            : { nama: timMenang.nama, role: "Tim", ovr: timMenang.power || 65 };

    let kategori = selisih < 1 ? "ketat" : selisih < 4 ? "normal" : "telak";
    let templates = TEMPLATE_HIGHLIGHT[kategori];
    let teks = templates[Math.floor(Math.random() * templates.length)]
        .replace(/{hero}/g, hero.nama)
        .replace(/{role}/g, hero.role || "Player")
        .replace(/{tim}/g, timMenang.nama);

    return { teks, hero, tim: timMenang.nama, kategori };
};

// ==========================================
// GENERATOR STATISTIK AFTER-MATCH
// ==========================================
function generateStatistikMatch(timMenang, timKalah, gameLog) {
    // Helper: ambil 5 starter dari tim
    function getStarters(tim) {
        let isKita = tim.nama === timPlayer;
        let roster = isKita ? rosterKita : (tim.roster || []);
        // Pemain yang sedang trial di tim AI tidak tersedia untuk lineup
        let rosterAvailable = isKita ? roster.filter(p => !p.sedangTrialAI) : roster;
        let starters = isKita
            ? rosterAvailable.filter(p => p.isStarter)
            : [...rosterAvailable].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
        if (starters.length < 5) starters = [...rosterAvailable].sort((a, b) => b.ovr - a.ovr).slice(0, 5);

        // FIX BUG: tim MDL/LEN bisa punya roster kosong (generateRosterAIAwal
        // cuma ngisi 4 region MPL). Kalau kosong, generate 5 dummy starter
        // berbasis tim.power supaya statistik tetap bisa dihitung tanpa crash.
        if (starters.length === 0) {
            let baseOvr = tim.power || 65;
            let dummyRoles = ["Goldlaner","Jungler","Midlaner","EXP Laner","Roamer"];
            starters = dummyRoles.map((role, i) => ({
                nama: `${tim.nama} ${role}`,
                role,
                ovr: baseOvr + Math.floor(Math.random() * 6) - 3,
                isStarter: true
            }));
        }
        return starters;
    }

    let starterMenang = getStarters(timMenang);
    let starterKalah  = getStarters(timKalah);

    let ovrMenang = starterMenang.reduce((s, p) => s + (p.ovr || 70), 0) / Math.max(starterMenang.length, 1);
    let ovrKalah  = starterKalah.reduce((s, p) => s + (p.ovr || 70), 0)  / Math.max(starterKalah.length, 1);

    // Randomness ±15%
    let rngM = 0.85 + Math.random() * 0.30;
    let rngK = 0.85 + Math.random() * 0.30;

    // Damage Dealt — menang lebih tinggi
    let dmgDealtMenang = Math.round(ovrMenang * 1600 * rngM + Math.random() * 20000);
    let dmgDealtKalah  = Math.round(ovrKalah  * 950  * rngK + Math.random() * 12000);

    // Damage Taken — kalah lebih tinggi
    let dmgTakenMenang = Math.round(ovrKalah  * 1400 * rngK + Math.random() * 15000);
    let dmgTakenKalah  = Math.round(ovrMenang * 2200 * rngM + Math.random() * 25000);

    // Damage to Turret
    let dmgTurretMenang = Math.round(ovrMenang * 300 * rngM + Math.random() * 8000);
    let dmgTurretKalah  = Math.round(ovrKalah  * 60  * rngK + Math.random() * 3000);

    // Turtle / Lord / Turret (W/L objektif)
    let turtleMenang = Math.floor(Math.random() * 3) + 1;
    let lordMenang   = Math.floor(Math.random() * 2);
    let turretMenang = Math.floor(Math.random() * 4) + 6;
    let turtleKalah  = Math.max(0, turtleMenang - Math.floor(Math.random() * 2) - 1);
    let lordKalah    = Math.max(0, lordMenang - Math.floor(Math.random() * 1));
    let turretKalah  = Math.floor(Math.random() * 3);

    // Game Duration
    let durasiMenit = Math.floor(Math.random() * 14) + 10;
    let durasiDetik = Math.floor(Math.random() * 60);
    let gameDuration = `${durasiMenit}:${durasiDetik.toString().padStart(2, "0")}`;

    // ======== AWARD PER PEMAIN ========
    // Gold Per Minute → Goldlaner menang
    let goldlanerMenang = starterMenang.find(p => p.role === "Goldlaner") || starterMenang[0];
    let richGuy = goldlanerMenang;
    let goldPerMinute = Math.round((goldlanerMenang.ovr || 70) * 10 + Math.random() * 200 + 700);

    // The Carry → Pemain dengan damage tertinggi di tim menang
    let dmgPerPemainMenang = starterMenang.map(p => ({
        pemain: p,
        dmg: Math.round((p.ovr || 70) * 450 * (0.8 + Math.random() * 0.4))
    }));
    dmgPerPemainMenang.sort((a, b) => b.dmg - a.dmg);
    let theCarry = dmgPerPemainMenang[0].pemain;
    let theCarryDmg = dmgPerPemainMenang[0].dmg;

    // Sand Bag → Pemain dengan damage taken tertinggi dari tim KALAH
    let dmgTakenPerKalah = starterKalah.map(p => ({
        pemain: p,
        dmgTaken: Math.round((p.ovr || 65) * 1300 * (0.8 + Math.random() * 0.4))
    }));
    dmgTakenPerKalah.sort((a, b) => b.dmgTaken - a.dmgTaken);
    let sandBag = dmgTakenPerKalah[0].pemain;
    let sandBagDmg = dmgTakenPerKalah[0].dmgTaken;

    // Best Wingman → Roamer/Support dari tim menang (assist tertinggi)
    let roamerMenang = starterMenang.find(p => p.role === "Roamer") || starterMenang[starterMenang.length - 1];
    let bestWingman = roamerMenang;
    let totalAssists = Math.floor(Math.random() * 10) + 5;

    return {
        statsMenang: {
            dmgDealt:   dmgDealtMenang,
            dmgTaken:   dmgTakenMenang,
            dmgTurret:  dmgTurretMenang,
            turtle:     turtleMenang,
            lord:       lordMenang,
            turret:     turretMenang
        },
        statsKalah: {
            dmgDealt:   dmgDealtKalah,
            dmgTaken:   dmgTakenKalah,
            dmgTurret:  dmgTurretKalah,
            turtle:     turtleKalah,
            lord:       lordKalah,
            turret:     turretKalah
        },
        gameDuration,
        awards: {
            richGuy:     { pemain: richGuy,    goldPerMinute },
            theCarry:    { pemain: theCarry,   dmgDealt: theCarryDmg },
            sandBag:     { pemain: sandBag,    dmgTaken: sandBagDmg },
            bestWingman: { pemain: bestWingman, totalAssists }
        }
    };
}

function simulasikanSeries(timA, timB, formatBO) {
    let butuhWin = Math.ceil(formatBO / 2);
    let sA = 0,
        sB = 0;
    for (let i = 0; i < formatBO; i++) {
        if (sA === butuhWin || sB === butuhWin) break;
        let pA = hitungPerformaMatch(timA);
        let pB = hitungPerformaMatch(timB);
        let aMenangGame = window.tentukanPemenangGame
            ? window.tentukanPemenangGame(pA, pB, sA, sB, formatBO)
            : pA > pB;
        if (aMenangGame) sA++;
        else sB++;
    }
    // [BUGFIX] Moral jalan jg utk series playoff/turnamen (semua liga)
    terapkanMoralPascaMatch(timA);
    terapkanMoralPascaMatch(timB);
    return {
        home: timA,
        away: timB,
        skorHome: sA,
        skorAway: sB,
        sudahMain: true,
        format: "BO" + formatBO,
        menang: sA > sB ? timA : timB,
        kalah: sA > sB ? timB : timA
    };
}

window.updateStatistikVisual = function() {
    // Pastikan variabel chemistry ada
    if (typeof window.chemistryTim === 'undefined') window.chemistryTim = 50;

    // --- 1. AMBIL DATA MENTAH ---
    let baseOvr = 0;
    if (typeof rosterKita !== 'undefined' && rosterKita.length > 0) {
        let totalOvr = 0;
        rosterKita.forEach(p => totalOvr += p.ovr);
        baseOvr = Math.floor(totalOvr / rosterKita.length);
    }

    let buffStaff = 0;
    if (typeof staffKita !== 'undefined') {
        if (staffKita.pelatih) buffStaff += staffKita.pelatih.buffPower || 0;
        if (staffKita.asisten) buffStaff += staffKita.asisten.buffPower || 0;
        if (staffKita.analis) buffStaff += staffKita.analis.buffPower || 0;
    }

    // [FIX] window.chemistryTim itu variabel MATI -- cuma di-inisialisasi
    // 50 di sini terus dibaca lagi, TIDAK PERNAH di-update di manapun di
    // seluruh kodebase. Makanya "Team Chemistry" di layar Roster Tim
    // permanen nampilin "50% (0 Power)" walau udah main sampai M-Series.
    // Chemistry yang BENERAN dipakai buat pengaruhi hasil match itu
    // hitungChemistryScore(roster) (FASE 15, dihitung real-time dari
    // komposisi roster tiap simulasi) -- sekarang angka yang ditampilin
    // di dashboard disamain sama itu, biar gak nampilin statistik palsu.
    let chemValue = (typeof hitungChemistryScore === "function" && typeof rosterKita !== "undefined")
        ? hitungChemistryScore(rosterKita)
        : window.chemistryTim;
    let bonusChem = 0;
    let chemDesc = "";
    let chemColor = "#E8720C";

    // Hitung Efek Chemistry
    if (chemValue >= 90) { 
        bonusChem = 4; chemDesc = "🔥 Sempurna! Telepati antar pemain aktif."; chemColor = "#0891B2"; 
    } else if (chemValue >= 70) { 
        bonusChem = 2; chemDesc = "✨ Solid. Sinergi pemain berjalan sangat baik."; chemColor = "#00B37E"; 
    } else if (chemValue >= 40) { 
        bonusChem = 0; chemDesc = "🔄 Tim masih mencari ritme bermain..."; chemColor = "#E8720C"; 
    } else { 
        bonusChem = -2; chemDesc = "⚠️ Kacau! Miskomunikasi sering terjadi."; chemColor = "#E5484D"; 
    }

    let totalPower = baseOvr + buffStaff + bonusChem;
    let repValue = typeof reputasiTim !== 'undefined' ? reputasiTim : 50;

    let gEl = (id) => document.getElementById(id); // Helper cepet

    // --- 2. GERAKIN BAR & TEKS ---
    
    // Power Roster (Max skala 100)
    if (gEl("txtPowerRoster")) gEl("txtPowerRoster").innerText = baseOvr;
    if (gEl("barPowerRoster")) gEl("barPowerRoster").style.width = Math.min(baseOvr, 100) + "%";

    // Buff Staff (Max skala anggaplah 10 itu udah dewa)
    if (gEl("txtBuffStaff")) gEl("txtBuffStaff").innerText = "+" + buffStaff;
    if (gEl("barBuffStaff")) gEl("barBuffStaff").style.width = Math.min((buffStaff / 10) * 100, 100) + "%";

    // Chemistry
    if (gEl("txtChemistry")) {
        let tanda = bonusChem > 0 ? "+" : "";
        gEl("txtChemistry").innerText = `${chemValue}% (${tanda}${bonusChem} Power)`;
        gEl("txtChemistry").style.color = chemColor;
    }
    if (gEl("barChemistry")) {
        gEl("barChemistry").style.width = chemValue + "%";
        gEl("barChemistry").style.background = chemColor;
    }
    if (gEl("descChemistry")) gEl("descChemistry").innerText = chemDesc;

    // Total Power Keseluruhan (Max skala 115 biar keren)
    if (gEl("txtTotalPower")) gEl("txtTotalPower").innerText = totalPower;
    if (gEl("barTotalPower")) gEl("barTotalPower").style.width = Math.min((totalPower / 115) * 100, 100) + "%";

    // Reputasi Tim
    if (gEl("txtReputasi")) gEl("txtReputasi").innerText = repValue + " Poin";
    if (gEl("barReputasi")) {
        gEl("barReputasi").style.width = repValue + "%";
        
        // Ganti warna otomatis sesuai gengsi
        let repColor = "#E5484D"; // Tier C
        if (repValue >= 90) repColor = "#5B3DF5"; // Tier S
        else if (repValue >= 70) repColor = "#0891B2"; // Tier A
        else if (repValue >= 40) repColor = "#12151C"; // Tier B
        
        gEl("barReputasi").style.background = repColor;
        if(gEl("txtReputasi")) gEl("txtReputasi").style.color = repColor;
        gEl("barReputasi").parentElement.parentElement.style.borderLeftColor = repColor;
    }
};

window.prosesReputasi = function (timNama, pencapaian) {
    let isPlayer = timNama === timPlayer;
    let repSkrg = isPlayer ? reputasiTim : 50;

    // Cari tim AI kalau bukan tim kita
    let timAI = null;
    if (!isPlayer) {
        let regionAll = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
        for (let reg of regionAll) {
            let t = reg.find(x => x.nama === timNama);
            if (t) {
                timAI = t;
                repSkrg = t.reputasi || 50;
                break;
            }
        }
    }

    let poin = 0;

    // LOGIKA DIMINISHING RETURNS (Tembok Gengsi)
    if (repSkrg < 80) {
        // Tier Menengah ke Bawah (Gampang naik)
        if (pencapaian === "JUARA_MSERIES") poin = 5;
        else if (pencapaian === "JUARA_MSC") poin = 4;
        else if (pencapaian === "JUARA_MPL") poin = 3;
        else if (pencapaian === "GAGAL_PLAYOFF") poin = -2;
    } else if (repSkrg < 90) {
        // Tier A / Raksasa (Mulai seret)
        if (pencapaian === "JUARA_MSERIES") poin = 2;
        else if (pencapaian === "JUARA_MSC") poin = 2;
        else if (pencapaian === "JUARA_MPL") poin = 1;
        else if (pencapaian === "GAGAL_PLAYOFF") poin = -3;
    } else {
        // Tier S / Dewa (Mentok & rawan anjlok)
        if (pencapaian === "JUARA_MSERIES") poin = 1;
        else if (pencapaian === "JUARA_MSC") poin = 1;
        else if (pencapaian === "JUARA_MPL") poin = 1;
        else if (pencapaian === "GAGAL_PLAYOFF") poin = -4;
    }

    // Eksekusi penambahan/pengurangan
    repSkrg += poin;

    // Pastikan angka nggak nembus batas 0 - 100
    if (repSkrg > 100) repSkrg = 100;
    if (repSkrg < 0) repSkrg = 0;

    // Simpan kembali datanya
    if (isPlayer) reputasiTim = repSkrg;
    if (timAI) timAI.reputasi = repSkrg;

    return poin;
};

function initPlayoffMulai() {
    // 1. Inisialisasi MPL ID
    let t = [...daftarTim].sort(
        (a, b) =>
            b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
    );
    pData.m1 = { home: t[2], away: t[5], sudahMain: false };
    pData.m2 = { home: t[3], away: t[4], sudahMain: false };
    pData.m3 = {
        home: t[0],
        away: { nama: "TBD", logo: "" },
        sudahMain: false
    };
    pData.m4 = {
        home: t[1],
        away: { nama: "TBD", logo: "" },
        sudahMain: false
    };

    // 2. Inisialisasi MPL PH
    let tPH = [...daftarTimPH].sort(
        (a, b) =>
            b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
    );
    window.pDataPH = {};
    window.pDataPH.m1 = { home: tPH[2], away: tPH[5] };
    window.pDataPH.m2 = { home: tPH[3], away: tPH[4] };
    window.pDataPH.m3 = { home: tPH[0], away: { nama: "TBD" } };
    window.pDataPH.m4 = { home: tPH[1], away: { nama: "TBD" } };

    // 3. Inisialisasi MPL MY
    let tMY = [...daftarTimMY].sort(
        (a, b) =>
            b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
    );
    window.pDataMY = {};
    window.pDataMY.m1 = { home: tMY[2], away: tMY[5] };
    window.pDataMY.m2 = { home: tMY[3], away: tMY[4] };
    window.pDataMY.m3 = { home: tMY[0], away: { nama: "TBD" } };
    window.pDataMY.m4 = { home: tMY[1], away: { nama: "TBD" } };

    // 4. Inisialisasi MPL SG
    let tSG = [...daftarTimSG].sort(
        (a, b) =>
            b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
    );
    window.pDataSG = {};
    window.pDataSG.m1 = { home: tSG[2], away: tSG[5] };
    window.pDataSG.m2 = { home: tSG[3], away: tSG[4] };
    window.pDataSG.m3 = { home: tSG[0], away: { nama: "TBD" } };
    window.pDataSG.m4 = { home: tSG[1], away: { nama: "TBD" } };

    // [MSC x EWC 2026] Inisialisasi playoff 9 region baru -- murni tambahan,
    // gak ngubah seeding ID/PH/MY/SG di atas sama sekali.
    if (typeof initPlayoffRegionBaru === "function") initPlayoffRegionBaru();

    playoffFase = 1;
}

// --- SISTEM TIM AI NAWAR PEMAIN KITA ---
function prosesTawaranDariAI() {
    if (!apakahTransferTerbuka()) return;
    // Roster player terkunci -> AI tidak bisa menawar pemain player sama sekali
    if (typeof timPlayerSedangRosterLock === "function" && timPlayerSedangRosterLock().terkunci) return;

    let semuaTimAIGlobal = [
        ...daftarTim,
        ...daftarTimPH,
        ...daftarTimMY,
        ...daftarTimSG
    ].filter(t => t.nama !== timPlayer);

    // --- OPTIMASI: Hitung stok role SEKALI AJA sebelum nge-loop ---
    let stokRole = {
        Roamer: 0,
        Jungler: 0,
        Midlaner: 0,
        Goldlaner: 0,
        "EXP Laner": 0
    };
    rosterKita.forEach(p => {
        if (stokRole[p.role] !== undefined) stokRole[p.role]++;
    });

    // Loop semua pemain di roster kita buat di-scan sama AI
    rosterKita.forEach(pTarget => {
        // HAPUS let countRole yang lama, langsung panggil dari stokRole!
        if (
            stokRole[pTarget.role] <= 1 ||
            pTarget.isStarter ||
            pTarget.isLoan ||
            pTarget.sedangDinego ||
            pTarget.sudahTransfer
        )
            return;

        let peluangDitawar = cekPeluangDitawarAI(pTarget);

        if (Math.random() < peluangDitawar) {
            let jenisTawaran = "BELI";
            if (pTarget.statusTransfer === "PINJAM") jenisTawaran = "PINJAM";
            else if (pTarget.statusTransfer === "TRANSFER")
                jenisTawaran = "BELI";
            else jenisTawaran = Math.random() > 0.5 ? "BELI" : "PINJAM";

            // Gunakan array yang udah dibikin di luar loop tadi
            let timBerminat = semuaTimAIGlobal.filter(tim => {
                let andalanAI = tim.roster
                    ? tim.roster
                          .filter(x => x.role === pTarget.role)
                          .sort((a, b) => b.ovr - a.ovr)[0]
                    : null;
                let ovrAndalan = andalanAI ? andalanAI.ovr : 0;

                if (jenisTawaran === "BELI" && pTarget.ovr < ovrAndalan - 7)
                    return false;
                if (jenisTawaran === "PINJAM" && pTarget.ovr < ovrAndalan - 13)
                    return false;

                let hargaPemain =
                    pTarget.harga ||
                    pTarget.hargaPasar ||
                    pTarget.value ||
                    50000000;
                if (typeof hargaPemain === "string")
                    hargaPemain = parseInt(hargaPemain.replace(/[^0-9]/g, ""));
                if (jenisTawaran === "BELI" && tim.kas < hargaPemain * 1.1)
                    return false;

                return true;
            });

            if (timBerminat.length === 0) return;

            let timPembeli =
                timBerminat[Math.floor(Math.random() * timBerminat.length)];

            let hargaPemain =
                pTarget.harga ||
                pTarget.hargaPasar ||
                pTarget.value ||
                50000000;
            if (typeof hargaPemain === "string")
                hargaPemain = parseInt(hargaPemain.replace(/[^0-9]/g, ""));
            let multiplier =
                jenisTawaran === "BELI"
                    ? 1.05 + Math.random() * 0.3
                    : 0.15 + Math.random() * 0.1;
            let hargaTawaran = Math.floor(hargaPemain * multiplier);

            let offerId =
                "tawaran_" + Date.now() + Math.floor(Math.random() * 100);
            let teksTawaran =
                jenisTawaran === "BELI"
                    ? "tawaran transfer resmi (BUYOUT)"
                    : "tawaran PINJAMAN selama 1 Musim";

            let isiEmail = `
                <div style="font-size:12px; color:#5C6472; line-height:1.6; margin-bottom:15px;">
                    Manajemen <b>${timPembeli.nama}</b> sangat tertarik dengan potensi <b>${pTarget.nama}</b>. 
                    Kami mengajukan ${teksTawaran} sebesar:
                </div>
                <div style="background:#F1F3F8; padding:15px; border-radius:6px; text-align:center; border:1px solid var(--border-md); margin-bottom:15px;">
                    <div style="font-size:11px; color:#888;">NILAI PROPOSAL ${jenisTawaran}:</div>
                    <div style="font-size:20px; color:#C9971F; font-weight:bold; font-family:'Oswald', sans-serif;">
                        Rp ${(hargaTawaran / 1000000).toFixed(1)} Jt
                    </div>
                </div>
                <div id="${offerId}" style="display: flex; gap: 10px;">
                    <button class="modal-btn" style="background:#E5484D; color:#fff; flex:1; font-size:11px; padding:8px;" onclick="tolakTawaranAI('${offerId}', '${pTarget.nama}')">TOLAK</button>
                    <button class="modal-btn" style="background:#00B37E; color:#fff; flex:1; font-size:11px; padding:8px;" onclick="terimaTawaranAI('${pTarget.nama}', '${timPembeli.nama}', ${hargaTawaran}, '${offerId}', '${jenisTawaran}')">DEAL! ${jenisTawaran}</button>
                </div>
            `;

            tambahEmail(
                `Proposal ${jenisTawaran}: ${pTarget.nama}`,
                `Manajemen ${timPembeli.nama}`,
                isiEmail
            );
            pTarget.sedangDinego = true;
        }
    });
}

window.terimaTawaranAI = function (
    namaPemain,
    namaTimPembeli,
    nominal,
    offerId,
    jenisTawaran = "BELI"
) {
    let idxPemain = rosterKita.findIndex(p => p.nama === namaPemain);
    if (idxPemain === -1) {
        getEl(offerId).innerHTML =
            `<div style="color:#E5484D; font-size:12px; text-align:center;">⚠️ Pemain ini sudah tidak ada.</div>`;
        return;
    }

    let p = rosterKita[idxPemain];
    let countRole = rosterKita.filter(x => x.role === p.role).length;
    if (countRole <= 1) {
        alert(`Gagal! Tim butuh minimal 1 pemain di role ${p.role}.`);
        return;
    }

    p.sudahTransfer = true;

    kasTim += nominal;
    catatKas(
        "MASUK",
        nominal,
        `${jenisTawaran === "PINJAM" ? "Fee Pinjaman ke" : "Transfer ke"} ${namaTimPembeli}: ${p.nama}`
    );
    rosterKita.splice(idxPemain, 1);
    catatTransferRealTime(p, namaTimPembeli, jenisTawaran === "PINJAM");

    let semuaTimAI = [
        ...daftarTim,
        ...daftarTimPH,
        ...daftarTimMY,
        ...daftarTimSG
    ];
    let timBeli = semuaTimAI.find(t => t.nama === namaTimPembeli);

    if (timBeli && timBeli.roster) {
        if (jenisTawaran === "PINJAM") {
            p.isLoan = true;
            p.timAsli = timPlayer;
            p.durasiPinjam = 1;
        } else {
            p.sisaKontrak = 3;
        }
        // [BARU] Jalur ini gak lewat catatTransferRealTime(), jadi
        // tanggalBergabung ditandain manual di sini (lihat penjelasan
        // lengkap di catatTransferRealTime soal kenapa harus di-kloning).
        if (typeof kalenderGame !== "undefined" && kalenderGame) {
            p.tanggalBergabung = new Date(kalenderGame.getTime());
        }
        timBeli.roster.push(p);
        let totalOvrAI = 0;
        timBeli.roster.forEach(x => (totalOvrAI += x.ovr));
        timBeli.power = Math.floor(totalOvrAI / timBeli.roster.length);
    } else {
        if (jenisTawaran !== "PINJAM") {
            p.sisaKontrak = 2;
            pemainTransfer.push(p);
        }
    }

    getEl(offerId).innerHTML =
        `<div style="background:#F7F9FC; border-left:4px solid #00B37E; padding:10px; color:#00B37E; text-align:center; font-weight:bold; font-size:12px; width:100%;">✅ ${jenisTawaran === "PINJAM" ? "PEMAIN BERHASIL DIPINJAMKAN" : "TRANSFER SELESAI"}!</div>`;
    let emTarget = inboxEmail.find(em => em.isi.includes(offerId));
    if (emTarget) {
        emTarget.isi = getEl("bacaEmailIsi").innerHTML;
    }

    updateDashboard();

    if (jenisTawaran === "PINJAM")
        tambahBerita(
            `🧳 Pinjaman Keluar: <span>${p.nama}</span> dipinjamkan ke <span>${namaTimPembeli}</span> selama 1 Musim.`
        );
    else
        tambahBerita(
            `💸 Transfer Keluar: <span>${p.nama}</span> resmi dibeli oleh <span>${namaTimPembeli}</span> seharga Rp ${(nominal / 1000000).toFixed(1)} Jt.`
        );
};

window.tolakTawaranAI = function (offerId, namaPemain) {
    getEl(offerId).innerHTML =
        `<div style="background:#F7F9FC; border-left:4px solid #E5484D; padding:10px; color:#E5484D; text-align:center; font-weight:bold; font-size:12px; width:100%;">❌ PROPOSAL DITOLAK KARENA TIDAK SESUAI.</div>`;
    let emTarget = inboxEmail.find(em => em.isi.includes(offerId));
    if (emTarget) {
        emTarget.isi = getEl("bacaEmailIsi").innerHTML;
    }
    // Bebasin gembok biar bisa ditawar lagi nanti
    if (namaPemain) {
        let p = rosterKita.find(x => x.nama === namaPemain);
        if (p) p.sedangDinego = false;
    }
};

// ==========================================
// SISTEM TAWARAN TRIAL DARI AI KE PEMAIN PLAYER
// AI bisa kirim tawaran trial ke pemain roster player saat transfer window buka.
// Flow: Tawaran email → player terima/tolak → pemain pergi trial (tidak available)
// → hasil scrim dihitung → AI deal (kirim tawaran BELI/PINJAM) atau tidak deal
// → pemain kembali ke roster normal.
// ==========================================

// Cooldown global: max 1 tawaran trial per 5 hari supaya tidak spam
if (typeof window._hariSejakTrialAITerakhir === "undefined") window._hariSejakTrialAITerakhir = 0;
if (typeof window._trialAIPending === "undefined") window._trialAIPending = []; // [{pemainNama, namaTimAI, hariSisaTrial}]

function prosesTawaranTrialDariAI() {
    if (!apakahTransferTerbuka()) return;
    if (typeof timPlayerSedangRosterLock === "function" && timPlayerSedangRosterLock().terkunci) return;

    // Proses trial yang sedang berjalan (hitung mundur & resolve hasil)
    prosesPendingTrialAI();

    // Cooldown: kirim tawaran baru max setiap 5 hari
    window._hariSejakTrialAITerakhir++;
    if (window._hariSejakTrialAITerakhir < 5) return;

    // Pilih pemain target: semua roster, tidak sedang dinego/trial/loan
    let kandidat = rosterKita.filter(p =>
        !p.sedangDinego &&
        !p.sedangTrialAI &&
        !p.isLoan &&
        !p.sudahTransfer
    );
    if (kandidat.length === 0) return;

    // Probabilitas kirim tawaran per hari kecil (15%) supaya tidak terlalu sering
    if (Math.random() > 0.15) return;

    // Pilih pemain random berbobot OVR (pemain lebih bagus lebih menarik)
    let totalBobot = kandidat.reduce((s, p) => s + (p.ovr || 60), 0);
    let rand = Math.random() * totalBobot;
    let kumulatif = 0;
    let pTarget = kandidat[0];
    for (let p of kandidat) {
        kumulatif += (p.ovr || 60);
        if (rand <= kumulatif) { pTarget = p; break; }
    }

    // Pilih tim AI yang "cocok" untuk role target
    let semuaTimAI = [
        ...daftarTim,
        ...(typeof daftarTimPH !== "undefined" ? daftarTimPH : []),
        ...(typeof daftarTimMY !== "undefined" ? daftarTimMY : []),
        ...(typeof daftarTimSG !== "undefined" ? daftarTimSG : [])
    ].filter(t => t.nama !== timPlayer);

    let timCocok = semuaTimAI.filter(t => {
        if (!t.roster) return false;
        let andalanRole = t.roster.filter(x => x.role === pTarget.role).sort((a,b) => b.ovr - a.ovr)[0];
        let ovrAndalan = andalanRole ? andalanRole.ovr : 0;
        // AI tertarik trial pemain yang OVR-nya tidak jauh di bawah andalan mereka
        return (pTarget.ovr || 60) >= ovrAndalan - 10;
    });
    if (timCocok.length === 0) return;

    let timAI = timCocok[Math.floor(Math.random() * timCocok.length)];
    let trialId = "trial_ai_" + Date.now() + Math.floor(Math.random() * 100);

    pTarget.sedangDinego = true; // kunci sementara supaya tidak double-tawaran
    window._hariSejakTrialAITerakhir = 0;

    let isiEmail = `
        <div style="font-size:12px; color:#5C6472; line-height:1.6; margin-bottom:15px;">
            Manajemen <b>${timAI.nama}</b> tertarik dengan performa <b>${pTarget.nama}</b> (${pTarget.role}, OVR ${pTarget.ovr || "?"}).
            Kami mengundang beliau untuk menjalani <b>masa trial selama 3 scrim</b> bersama tim kami.<br><br>
            Selama masa trial, <b>${pTarget.nama}</b> tidak akan tersedia untuk lineup kamu.
            Jika hasil trial memuaskan, kami akan mengajukan tawaran resmi.
        </div>
        <div style="background:#F1F3F8; padding:12px; border-radius:6px; border:1px solid var(--border-md); margin-bottom:15px; font-size:11px; color:#5C6472;">
            🏟️ Tim pengundang: <b style="color:#5B3DF5;">${timAI.nama}</b><br>
            👤 Pemain: <b>${pTarget.nama}</b> — ${pTarget.role}<br>
            ⏳ Durasi trial: <b>3 Scrim</b> (~3 hari)
        </div>
        <div id="${trialId}" style="display:flex; gap:10px;">
            <button class="modal-btn" style="background:#E5484D;color:#fff;flex:1;font-size:11px;padding:8px;"
                onclick="window.tolakTawaranTrialAI('${trialId}', '${pTarget.nama}')">TOLAK</button>
            <button class="modal-btn" style="background:#2563EB;color:#fff;flex:1;font-size:11px;padding:8px;"
                onclick="window.terimaTawaranTrialAI('${trialId}', '${pTarget.nama}', '${timAI.nama}')">IZINKAN TRIAL</button>
        </div>
    `;

    tambahEmail(
        `Undangan Trial: ${pTarget.nama} → ${timAI.nama}`,
        `Manajemen ${timAI.nama}`,
        isiEmail
    );
}

function prosesPendingTrialAI() {
    if (!window._trialAIPending || window._trialAIPending.length === 0) return;

    window._trialAIPending = window._trialAIPending.filter(entry => {
        entry.hariSisaTrial--;

        if (entry.hariSisaTrial > 0) return true; // masih berjalan

        // Trial selesai — hitung hasil
        let pTarget = rosterKita.find(p => p.nama === entry.pemainNama);

        // Bebasin flag tidak available
        if (pTarget) {
            delete pTarget.sedangTrialAI;
            delete pTarget.sedangDinego;
        }

        // Hitung performa scrim (pakai formula mirip trial_system_patch)
        let timAIObj = (typeof cariTimAsliDiDatabase === "function")
            ? cariTimAsliDiDatabase(entry.namaTimAI)
            : null;
        let powerAI = timAIObj ? (timAIObj.power || 60) : 60;
        let powerKita = (typeof hitungPowerTim === "function" && typeof cariTimAsliDiDatabase === "function")
            ? (cariTimAsliDiDatabase(timPlayer)?.power || 60) : 60;
        let ovrPemain = pTarget ? (pTarget.ovr || 60) : (entry.ovrSnapshot || 60);

        let hasilScrim = [];
        for (let i = 0; i < 3; i++) {
            let selisih = powerAI - powerKita;
            let modifier = selisih * 0.3;
            let variance = (Math.random() * 20) - 10;
            let performa = Math.max(0, Math.min(100, Math.round(ovrPemain + variance - modifier)));
            hasilScrim.push(performa);
        }
        let rataRata = Math.round(hasilScrim.reduce((s,v) => s+v, 0) / hasilScrim.length);

        // AI deal jika rata-rata performa >= 55 (threshold realistis)
        let aiDeal = rataRata >= 55;

        let htmlHasil = `
            <div style="font-size:12px; color:#5C6472; line-height:1.6; margin-bottom:12px;">
                Masa trial <b>${entry.pemainNama}</b> di <b>${entry.namaTimAI}</b> telah selesai.
            </div>
            <div style="background:#F1F3F8; padding:12px; border-radius:6px; border:1px solid var(--border-md); margin-bottom:12px; font-size:11px;">
                ${hasilScrim.map((p,i) => `
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span>Scrim ${i+1}</span>
                        <b style="color:${p>=70?'#00B37E':p>=50?'#5B3DF5':'#E5484D'}">${p}</b>
                    </div>`).join("")}
                <div style="border-top:1px dashed var(--border-md);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;">
                    <span>Rata-rata</span>
                    <b style="color:#5B3DF5;">${rataRata}</b>
                </div>
            </div>
            <div style="font-size:12px; color:${aiDeal?'#00B37E':'#5C6472'}; margin-bottom:10px;">
                ${aiDeal
                    ? `✅ <b>${entry.namaTimAI}</b> terkesan dengan performa ${entry.pemainNama} dan akan mengajukan tawaran resmi.`
                    : `❌ <b>${entry.namaTimAI}</b> memutuskan tidak melanjutkan ke tawaran resmi. ${entry.pemainNama} kembali ke timmu.`}
            </div>
        `;

        tambahEmail(
            `Hasil Trial: ${entry.pemainNama} di ${entry.namaTimAI}`,
            `Manajemen ${entry.namaTimAI}`,
            htmlHasil
        );

        tambahBerita(aiDeal? `📋 Hasil Trial: <span>${entry.pemainNama}</span> tampil impresif (avg ${rataRata}) saat trial di <span>${entry.namaTimAI}</span>. Tawaran resmi segera datang.`: `📋 Hasil Trial: <span>${entry.pemainNama}</span> (avg ${rataRata}) tidak dilanjutkan oleh ${entry.namaTimAI}. Pemain kembali ke roster.`
        );

        // Jika deal, AI kirim tawaran BELI/PINJAM resmi via sistem existing
        if (aiDeal && pTarget) {
            let jenisTawaran = Math.random() > 0.4 ? "BELI" : "PINJAM";
            let hargaPemain = pTarget.harga || pTarget.hargaPasar || pTarget.value || 50000000;
            if (typeof hargaPemain === "string") hargaPemain = parseInt(hargaPemain.replace(/[^0-9]/g, ""));
            let multiplier = jenisTawaran === "BELI" ? 1.1 + Math.random() * 0.3 : 0.15 + Math.random() * 0.1;
            let hargaTawaran = Math.floor(hargaPemain * multiplier);
            let offerId = "tawaran_" + Date.now() + Math.floor(Math.random() * 100);

            let isiTawaran = `
                <div style="font-size:12px; color:#5C6472; line-height:1.6; margin-bottom:15px;">
                    Setelah masa trial yang memuaskan, manajemen <b>${entry.namaTimAI}</b> resmi mengajukan
                    ${jenisTawaran === "BELI" ? "tawaran transfer (BUYOUT)" : "tawaran PINJAMAN"} untuk <b>${entry.pemainNama}</b>:
                </div>
                <div style="background:#F1F3F8; padding:15px; border-radius:6px; text-align:center; border:1px solid var(--border-md); margin-bottom:15px;">
                    <div style="font-size:11px; color:#888;">NILAI PROPOSAL ${jenisTawaran}:</div>
                    <div style="font-size:20px; color:#C9971F; font-weight:bold; font-family:'Oswald',sans-serif;">
                        Rp ${(hargaTawaran / 1000000).toFixed(1)} Jt
                    </div>
                </div>
                <div id="${offerId}" style="display:flex; gap:10px;">
                    <button class="modal-btn" style="background:#E5484D;color:#fff;flex:1;font-size:11px;padding:8px;"
                        onclick="tolakTawaranAI('${offerId}','${entry.pemainNama}')">TOLAK</button>
                    <button class="modal-btn" style="background:#00B37E;color:#fff;flex:1;font-size:11px;padding:8px;"
                        onclick="terimaTawaranAI('${entry.pemainNama}','${entry.namaTimAI}',${hargaTawaran},'${offerId}','${jenisTawaran}')">DEAL! ${jenisTawaran}</button>
                </div>
            `;
            pTarget.sedangDinego = true;
            tambahEmail(
                `Tawaran Resmi Pasca-Trial: ${entry.pemainNama}`,
                `Manajemen ${entry.namaTimAI}`,
                isiTawaran
            );
        }

        return false; // hapus dari pending list
    });
}

window.terimaTawaranTrialAI = function (trialId, pemainNama, namaTimAI) {
    let pTarget = rosterKita.find(p => p.nama === pemainNama);
    if (!pTarget) return;

    // Flag pemain tidak available selama trial
    pTarget.sedangTrialAI = true;
    pTarget.sedangDinego = true; // tetap terkunci dari tawaran lain

    // Daftarkan ke pending list (3 hari)
    window._trialAIPending.push({
        pemainNama,
        namaTimAI,
        hariSisaTrial: 3,
        ovrSnapshot: pTarget.ovr || 60
    });

    // Update tampilan tombol di email
    let el = getEl(trialId);
    if (el) el.innerHTML = `<div style="background:#F7F9FC;border-left:4px solid #2563EB;padding:10px;color:#2563EB;text-align:center;font-weight:bold;font-size:12px;width:100%;">✅ TRIAL DIIZINKAN — ${pemainNama} tidak tersedia selama 3 hari.</div>`;
    let emTarget = inboxEmail.find(em => em.isi && em.isi.includes(trialId));
    if (emTarget && getEl("bacaEmailIsi")) emTarget.isi = getEl("bacaEmailIsi").innerHTML;

    tambahBerita(`✈️ Trial AI: <span>${pemainNama}</span> berangkat trial ke <span>${namaTimAI}</span> selama 3 hari. Tidak tersedia untuk lineup.`);
    if (typeof updateDashboard === "function") updateDashboard();
};

window.tolakTawaranTrialAI = function (trialId, pemainNama) {
    let pTarget = rosterKita.find(p => p.nama === pemainNama);
    if (pTarget) pTarget.sedangDinego = false;

    let el = getEl(trialId);
    if (el) el.innerHTML = `<div style="background:#F7F9FC;border-left:4px solid #E5484D;padding:10px;color:#E5484D;text-align:center;font-weight:bold;font-size:12px;width:100%;">❌ UNDANGAN TRIAL DITOLAK.</div>`;
    let emTarget = inboxEmail.find(em => em.isi && em.isi.includes(trialId));
    if (emTarget && getEl("bacaEmailIsi")) emTarget.isi = getEl("bacaEmailIsi").innerHTML;
};

window.klikTombolUtama = function () {
    window.tombolUtamaSudahDiklik = true;

    // [MERCH V3] Counter mingguan INDEPENDEN dari statusGame -- jalan tiap
    // hari diklik apapun fase-nya (REGULER/MID_SEASON/PLAYOFF/JEDA_TRANSFER/
    // OFFSEASON/dst). Sebelumnya proses mingguan merchandise cuma nempel di
    // cabang REGULER doang, jadi berhenti total di luar itu -- makanya gak
    // ada penjualan sama sekali pas OFFSEASON.
    if (typeof fanbase !== "undefined" && fanbase) {
        fanbase.merchHariCounter = (fanbase.merchHariCounter || 0) + 1;
        if (fanbase.merchHariCounter >= 7) {
            fanbase.merchHariCounter = 0;
            if (typeof prosesPenjualanMerchandiseMingguanV3 === "function") {
                prosesPenjualanMerchandiseMingguanV3();
            }
        }
    }

    // --- 1. SETTING PENGURANGAN HARI BUAT TRANSFER ---
    // 1 klik = 1 hari kalender di semua fase
    let hariLewat = 1;

    prosesAntrianTransfer(hariLewat);
    prosesRadarBeritaGlobal();
    prosesTawaranDariAI();
    prosesTawaranTrialDariAI();
    prosesTransferAntarAI();

    let btn = getEl("btnMainkan");
    if (statusGame === "PRAMUSIM") {
        // === OVERHAUL KALENDER: PRAMUSIM sekarang berbasis TANGGAL PASTI
        // (1 Jan - 8 Feb), bukan counter generik hariPramusim. Berakhir
        // tepat saat kalenderGame mencapai tanggal mdlMulai (9 Feb).
        let tabelTanggal = (typeof ambilTabelTanggalMusimSaatIni === "function")
            ? ambilTabelTanggalMusimSaatIni() : null;
        let belumWaktunyaMdlMulai = tabelTanggal
            ? !tanggalSetelahAtauSama(kalenderGame, tabelTanggal.mdlMulai)
            : (hariPramusim > 0); // fallback aman kalau calendar_system_patch.js belum termuat

        if (belumWaktunyaMdlMulai) {
            kalenderGame.setDate(kalenderGame.getDate() + 1); // Maju 1 hari di kalender

            // === AUTO-STOP: cek apakah hari baru ini adalah Roster Lock MDL (2 Feb S1 / 3 Ags S2)
            let cekLockMDLPramusim = (typeof cekStatusRosterLock === "function") ? cekStatusRosterLock("MDL") : null;
            let hariIniAwalLockMDL = cekLockMDLPramusim && cekLockMDLPramusim.terkunci
                && cekLockMDLPramusim.tanggalLockMulai
                && tanggalSama(kalenderGame, cekLockMDLPramusim.tanggalLockMulai);

            if (hariIniAwalLockMDL) {
                // Roster Lock MDL aktif — cukup berita, tidak perlu popup modal
                if (typeof tambahBerita === "function") {
                    tambahBerita(`🔒 Roster Lock MDL aktif. Transfer tim MDL ditutup sampai musim reguler berakhir.`);
                }
                if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
                if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
                if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();
                updateDashboard();
            }

            let sisaHari = tabelTanggal ? selisihHari(kalenderGame, tabelTanggal.mdlMulai) : hariPramusim;
            if (sisaHari <= 0) {
                btn.innerText = "Hari Berikutnya";
            } else {
                btn.innerText = "Hari Berikutnya";
            }

            // FIX: 1 hari kalender tetap lewat di sini -- liga lain harus
            // tetap jalan di belakang layar biar sisa jadwal musim
            // sebelumnya (kalau belum tuntas) bisa kekejar.
            if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
            if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
            if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();
            updateDashboard();
            return; // Berhenti di sini biar gak langsung masuk Reguler Season
        }

        // KALAU SUDAH SAMPAI TANGGAL MDL MULAI, BARU VALIDASI ROSTER
        let requiredRoles = [
            "Roamer",
            "Jungler",
            "Midlaner",
            "Goldlaner",
            "EXP Laner"
        ];
        let missingRoles = [];
        requiredRoles.forEach(role => {
            if (!rosterKita.some(p => p.role === role)) missingRoles.push(role);
        });
        if (missingRoles.length > 0) {
            bukaModal(
                "ROSTER TIDAK LENGKAP! 🚫",
                `Tim lu saat ini tidak punya pemain untuk role: <br><b style="color:#E5484D; font-size:16px;">${missingRoles.join(", ")}</b><br><br>Silahkan rekrut pemain baru di Bursa Transfer!`,
                "#E5484D"
            );
            return;
        }

        // PRAMUSIM SELESAI, MASUK REGULER (TRANSFER DITUTUP)
        transferBuka = false;
        statusGame = "REGULER";

        // === OVERHAUL: kalender TIDAK lagi "dipaksa maju cari hari Jumat"
        // -- tanggal mplLenMulai (27 Mar) dari tabel kalender sudah pasti
        // jatuh di hari Jumat (sudah diverifikasi), jadi kalenderGame
        // dibiarkan sesuai progres natural skip hari yang sudah berjalan
        // dari PRAMUSIM (9 Feb -> dst). buatJadwalMusim() sendiri yang
        // akan jalan dari kalenderGame saat ini sampai jadwal MPL siap.

        buatJadwalMusim();
        // === FASE 11: inisialisasi jadwal MDL ID & LEN bersamaan ===
        // FIX: cuma re-init kalau musim MDL/LEN SEBELUMNYA udah beneran
        // selesai (atau belum pernah diinisialisasi sama sekali). Kalau
        // masih jalan (jadwal masih ada sisa karena 1 siklus MPL gak
        // cukup buat ngabisin 30x/16x-nya), JANGAN di-reset -- biar
        // lanjut "nyambung" ke siklus MPL berikutnya sampai bener-bener
        // tuntas dan playoff degradasi bisa ke-trigger secara natural.
        if (typeof inisialisasiMusimMDLdanLEN === "function" &&
            (typeof window.jadwalMDL_ID === "undefined" || window._musimMDLLENSelesai)) {
            inisialisasiMusimMDLdanLEN();
        }
        // === FASE 12: inisialisasi jadwal MDL PH ===
        if (typeof inisialisasiMusimMDLPH === "function" &&
            (typeof window.jadwalMDL_PH === "undefined" || window._musimMDLPHSelesai)) {
            inisialisasiMusimMDLPH();
        }
        // === FASE 13: inisialisasi jadwal MAL MY ===
        if (typeof inisialisasiMusimMALMY === "function" &&
            (typeof window.jadwalMAL_Affiliated === "undefined" || window._musimMALMYSelesai)) {
            inisialisasiMusimMALMY();
        }
        indeksHari = 0;
        btn.innerText = "Hari Berikutnya";
        updateDashboard();
    } else if (statusGame === "REGULER") {
        // === OVERHAUL KALENDER: trigger akhir reguler season sekarang
        // berbasis TANGGAL PASTI (regulerSelesai, 24 Mei S1 / 22 Nov S2),
        // BUKAN hitungan "mingguKe > 9" generik. Sebelumnya, 9 minggu
        // penuh dari 27 Mar jatuh di 28 Mei (mismatch 4 hari dari target
        // 24 Mei yang sudah disepakati) -- sekarang dijamin presisi.
        let tabelTglRegulerSelesai = (typeof ambilTabelTanggalMusimSaatIni === "function")
            ? ambilTabelTanggalMusimSaatIni() : null;
        let waktunyaRegulerSelesai = tabelTglRegulerSelesai
            ? tanggalSetelahAtauSama(kalenderGame, tabelTglRegulerSelesai.regulerSelesai)
            : (mingguKe > 9); // fallback aman kalau calendar_system_patch.js belum termuat

        // [FIX POPUP HASIL MATCH TERAKHIR HILANG] Kalau masih ada match yang
        // jatahnya HARI INI (termasuk match player), JANGAN langsung masuk
        // cleanup/season-end. Sebelumnya waktunyaRegulerSelesai dicek duluan
        // sebelum loop pemutar match harian sempat jalan, jadi match terakhir
        // (mis. W9 Min 24 Mei) ke-flush diam2 lewat "sisa jadwalMatch" tanpa
        // pernah nulis window._lastMatchResult -> popup hasil match gak pernah
        // kebuka, langsung lompat ke modal "REGULER SEASON SELESAI".
        // Solusinya: biarkan match hari ini main dulu lewat jalur normal
        // (yang bakal buka popup hasil match), season baru ditutup di klik
        // berikutnya saat memang sudah gak ada match tersisa untuk hari ini.
        let _adaMatchHariIniSblmCleanup = jadwalMatch.length > 0 &&
            (!jadwalMatch[jadwalMatch.length - 1].tanggalRaw ||
              kalenderGame.getTime() >= jadwalMatch[jadwalMatch.length - 1].tanggalRaw);

        if (waktunyaRegulerSelesai && !_adaMatchHariIniSblmCleanup) {
            // --- JAGA-JAGA: SAPU BERSIH SISA JADWAL AI SEBELUM MASUK PLAYOFF ---
            function flushAI(matchAI) {
                let skA = 0,
                    skB = 0;
                for (let k = 0; k < 3; k++) {
                    if (skA === 2 || skB === 2) break;
                    let pHomeFlush = hitungPerformaMatch(matchAI.home);
                    let pAwayFlush = hitungPerformaMatch(matchAI.away);
                    if (pHomeFlush > pAwayFlush) skA++;
                    else skB++;
                }
                matchAI.home.gameW += skA;
                matchAI.home.gameL += skB;
                matchAI.away.gameW += skB;
                matchAI.away.gameL += skA;
                if (skA > skB) {
                    matchAI.home.matchW++;
                    matchAI.away.matchL++;
                    matchAI.home.poin++;
                    matchAI.home.streakKalah = 0;
                    matchAI.home.alarmStreak3Ditampilkan = false;
                    matchAI.away.streakKalah = (matchAI.away.streakKalah || 0) + 1;
                } else {
                    matchAI.away.matchW++;
                    matchAI.home.matchL++;
                    matchAI.away.poin++;
                    matchAI.away.streakKalah = 0;
                    matchAI.away.alarmStreak3Ditampilkan = false;
                    matchAI.home.streakKalah = (matchAI.home.streakKalah || 0) + 1;
                }
                // [FIX] Simpan hasil ke object match biar gak nyangkut di "VS" selamanya
                matchAI.skorHome = skA;
                matchAI.skorAway = skB;
                matchAI.sudahMain = true;
                // [BUGFIX] Moral juga jalan utk AI vs AI di region lain
                terapkanMoralPascaMatch(matchAI.home);
                terapkanMoralPascaMatch(matchAI.away);
            }
            while (window.jadwalMatchID && window.jadwalMatchID.length > 0)
                flushAI(window.jadwalMatchID.pop());
            while (window.jadwalMatchPH && window.jadwalMatchPH.length > 0)
                flushAI(window.jadwalMatchPH.pop());
            while (window.jadwalMatchMY && window.jadwalMatchMY.length > 0)
                flushAI(window.jadwalMatchMY.pop());
            while (window.jadwalMatchSG && window.jadwalMatchSG.length > 0)
                flushAI(window.jadwalMatchSG.pop());

            // [MSC x EWC 2026 - FASE 2] Flush sisa jadwal 9 region baru
            while (window.jadwalMatchKH && window.jadwalMatchKH.length > 0)
                flushAI(window.jadwalMatchKH.pop());
            while (window.jadwalMatchMM && window.jadwalMatchMM.length > 0)
                flushAI(window.jadwalMatchMM.pop());
            while (window.jadwalMatchMENA && window.jadwalMatchMENA.length > 0)
                flushAI(window.jadwalMatchMENA.pop());
            while (window.jadwalMatchTR && window.jadwalMatchTR.length > 0)
                flushAI(window.jadwalMatchTR.pop());
            while (window.jadwalMatchEECA && window.jadwalMatchEECA.length > 0)
                flushAI(window.jadwalMatchEECA.pop());
            while (window.jadwalMatchEA && window.jadwalMatchEA.length > 0)
                flushAI(window.jadwalMatchEA.pop());
            while (window.jadwalMatchAM && window.jadwalMatchAM.length > 0)
                flushAI(window.jadwalMatchAM.pop());
            while (window.jadwalMatchIN && window.jadwalMatchIN.length > 0)
                flushAI(window.jadwalMatchIN.pop());
            while (window.jadwalMatchWEU && window.jadwalMatchWEU.length > 0)
                flushAI(window.jadwalMatchWEU.pop());
            // -------------------------------------------------------------------
            let klasemenAkhir = [...daftarTim].sort(
                (a, b) =>
                    b.poin - a.poin ||
                    b.netGame - a.netGame ||
                    b.matchW - a.matchW
            );
            let timGagal = klasemenAkhir.slice(6);
            timGagal.forEach(t => {
                window.prosesReputasi(t.nama, "GAGAL_PLAYOFF");
                if (t.power >= 82 && t.nama !== timPlayer) {
                    tambahBerita(
                        `😱 Kejutan Besar: Tim raksasa <span>${t.nama}</span> resmi Gagal lolos ke Playoffs MPL ID S${musimKe}.`
                    );
                }
            });

            // === OVERHAUL KALENDER: jeda pra-playoff dihitung dari
            // FIX: flush sisa jadwalMatch player yang belum dimainkan
            // Ini terjadi saat waktunyaRegulerSelesai = true (kalenderGame >= 24 Mei)
            // SEBELUM while(true) sempat memprosesnya (wtr dicek lebih dulu).
            // Match W9 Min (tanggalRaw = 24 Mei) tidak pernah ke-pop karena
            // langsung masuk flushAI → match hilang tanpa dimainkan.
            while (jadwalMatch.length > 0) {
                let _sisa = jadwalMatch.pop();
                // Simulasikan hasilnya (tidak ada highlight, cukup update stats)
                if (_sisa && !_sisa.sudahMain) {
                    let _pA = (typeof hitungPerformaMatch === "function")
                        ? hitungPerformaMatch(_sisa.home, null) : (_sisa.home.power || 80);
                    let _pB = (typeof hitungPerformaMatch === "function")
                        ? hitungPerformaMatch(_sisa.away, null) : (_sisa.away.power || 80);
                    let _peluang = _pA / (_pA + _pB);
                    let _sA = 0, _sB = 0;
                    while (_sA < 2 && _sB < 2) {
                        if (Math.random() < _peluang) _sA++; else _sB++;
                    }
                    if (_sA > _sB) {
                        _sisa.home.matchW = (_sisa.home.matchW || 0) + 1;
                        _sisa.away.matchL = (_sisa.away.matchL || 0) + 1;
                        _sisa.home.poin = (_sisa.home.poin || 0) + 1;
                    } else {
                        _sisa.away.matchW = (_sisa.away.matchW || 0) + 1;
                        _sisa.home.matchL = (_sisa.home.matchL || 0) + 1;
                        _sisa.away.poin = (_sisa.away.poin || 0) + 1;
                    }
                    _sisa.home.gameW = (_sisa.home.gameW || 0) + _sA;
                    _sisa.home.gameL = (_sisa.home.gameL || 0) + _sB;
                    _sisa.away.gameW = (_sisa.away.gameW || 0) + _sB;
                    _sisa.away.gameL = (_sisa.away.gameL || 0) + _sA;
                    _sisa.home.netGame = (_sisa.home.gameW || 0) - (_sisa.home.gameL || 0);
                    _sisa.away.netGame = (_sisa.away.gameW || 0) - (_sisa.away.gameL || 0);
                    // [FIX] Simpan hasil ke object match biar gak nyangkut di "0-0" bawaan
                    _sisa.skorHome = _sA;
                    _sisa.skorAway = _sB;
                    // Pop jadwalTimPlayer juga kalau match ini melibatkan player
                    if (jadwalTimPlayer.length > 0 &&
                        (_sisa.home.nama === timPlayer || _sisa.away.nama === timPlayer)) {
                        jadwalTimPlayer.pop();
                        // Update stats player juga
                        if (_sA > _sB) {
                            if (_sisa.home.nama === timPlayer) { poin++; matchW++; }
                            else { matchL++; }
                        } else {
                            if (_sisa.away.nama === timPlayer) { poin++; matchW++; }
                            else { matchL++; }
                        }
                    }
                    _sisa.sudahMain = true;
                }
            }

            // SELISIH TANGGAL PASTI ke playoffMulai (10 Jun S1 / 9 Des S2),
            // bukan hardcode 14 hari. Hasilnya tetap ~14 hari kalau
            // reguler season berakhir tepat di tanggal yg disepakati
            // (24 Mei), tapi otomatis menyesuaikan kalau ada pergeseran.
            statusGame = "JEDA_PLAYOFF";
            let tabelTglJedaPlayoff = (typeof ambilTabelTanggalMusimSaatIni === "function")
                ? ambilTabelTanggalMusimSaatIni() : null;
            hariJeda = tabelTglJedaPlayoff
                ? Math.max(1, selisihHari(kalenderGame, tabelTglJedaPlayoff.playoffMulai))
                : 14; // fallback aman

            // [FIX] Sebelumnya teks ini hardcode "Playoff MPL" & "6 tim
            // terbaik dikunci" buat SEMUA liga, padahal MDL/MAL/LEN gak
            // ikut bracket Playoff MPL -- mereka punya Playoff Degradasi/
            // Promosi sendiri (2 tim, bukan 6). Sesuaikan per ligaPlayer.
            let _ligaJedaPO = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
            let _labelPOJudul = _ligaJedaPO === "LEN" ? "Playoff Promosi LEN"
                : (_ligaJedaPO === "MDL" || _ligaJedaPO === "MAL") ? "Playoff Degradasi MDL"
                : "PLAYOFF MPL";
            let _subPOModal = _ligaJedaPO === "LEN"
                ? "2 tim terbaik LEN telah dikunci untuk memperebutkan slot promosi ke MDL."
                : (_ligaJedaPO === "MDL" || _ligaJedaPO === "MAL")
                    ? "2 tim terbawah MDL telah dikunci untuk mempertahankan slot dari tantangan LEN."
                    : "6 tim terbaik telah dikunci.";

            tambahBerita(`📅 Reguler Season S${musimKe} selesai. <b>${_labelPOJudul}</b> akan dimulai dalam <b>${hariJeda} hari</b>. Gunakan waktu ini untuk persiapan akhir.`);
            bukaModal(
                "REGULER SEASON SELESAI! 🏁",
                `Pertarungan reguler berakhir! ${_subPOModal}<br><br><b>${_labelPOJudul} dimulai dalam ${hariJeda} hari.</b><br>Gunakan jeda ini untuk memperkuat mental dan strategi tim!`,
                "#E8720C"
            );
            btn.innerText = "Hari Berikutnya";
            updateDashboard();
            return;
        }

        // FIX URUTAN: saat kalenderGame pertama kali mencapai mplLenMulai
        // (27 Mar S1 / 25 Sep S2), indeksHari di-reset ke 0 (Jumat) dan
        // mingguKe ke 1. Ini perlu karena REGULER dimulai dari 9 Feb
        // (MDL mulai) dengan indeksHari=0, tapi 9 Feb → 27 Mar = 46 hari,
        // dan 46 % 7 = 4 → indeksHari = 4 (libur) saat 27 Mar tiba.
        // Tanpa reset, W1 Jumat MPL tidak pernah main.
        if (!window._mplSeasonReset) {
            let _tblReset = (typeof ambilTabelTanggalMusimSaatIni === "function")
                ? ambilTabelTanggalMusimSaatIni() : null;
            let _sudahMplMulai = _tblReset
                ? tanggalSetelahAtauSama(kalenderGame, _tblReset.mplLenMulai) : false;
            if (_sudahMplMulai) {
                indeksHari = 0;
                mingguKe = 1;
                window._mplSeasonReset = true;
            }
        }

        // FIX: pola partai per hari dalam 1 minggu (Jumat-Kamis, 7 hari).
        // indeksHari 0=Jumat(2 partai), 1=Sabtu(3), 2=Minggu(3),
        // 3/4/5/6=Senin-Kamis (0 partai, hari libur -- tetap 1 klik = 1 hari).
        // FIX: jangan hardcode 2/3/3 per hari — pop SEMUA match yang tanggalRaw-nya
        // jatuh di hari ini (kalenderGame). Sebelumnya hardcode 2 Jumat / 3 Sabtu / 3 Minggu,
        // padahal bikinJadwal() bisa menaruh 4 match di Jumat (kalau constraint longgar),
        // sehingga 2 match tertinggal di array dan tidak pernah dimainkan → 6 match hilang.
        let jumlahMatch = 0; // tidak dipakai lagi untuk limit, tapi keep untuk kompatibilitas
        if (indeksHari === 0) jumlahMatch = 2;
        else if (indeksHari === 1) jumlahMatch = 3;
        else if (indeksHari === 2) jumlahMatch = 3;
        // Pop semua match yang tanggalRaw == hari ini (atau sudah lewat)
        while (true) {
            // --- 1. SIMULASI MAIN MATCH (REGION LU) ---
            let matchSiapHariIni = jadwalMatch.length > 0 &&
                (!jadwalMatch[jadwalMatch.length - 1].tanggalRaw ||
                  kalenderGame.getTime() >= jadwalMatch[jadwalMatch.length - 1].tanggalRaw);
            if (matchSiapHariIni) {
                // <--- Pake if ini, JANGAN dipakein break;
                let match = jadwalMatch.pop();
                if (
                    match.home.nama === timPlayer ||
                    match.away.nama === timPlayer
                )
                    jadwalTimPlayer.pop();

                let sA = 0,
                    sB = 0;
                let gameLogHighlight = [];
                let melibatkanPlayer =
                    match.home.nama === timPlayer ||
                    match.away.nama === timPlayer;
                for (let k = 0; k < 3; k++) {
                    if (sA === 2 || sB === 2) break;
                    let pHome = hitungPerformaMatch(match.home);
                    let pAway = hitungPerformaMatch(match.away);
                    if (match.home.nama === timPlayer) pHome += 1.5; // Bonus main di kandang
                    if (melibatkanPlayer) {
                        let timMenangGame = pHome > pAway ? match.home : match.away;
                        let timKalahGame = pHome > pAway ? match.away : match.home;
                        gameLogHighlight.push(
                            window.buatHighlightGame(
                                timMenangGame,
                                timKalahGame,
                                Math.abs(pHome - pAway)
                            )
                        );
                    }
                    if (pHome > pAway) sA++;
                    else sB++;
                }
                match.home.gameW += sA;
                match.home.gameL += sB;
                if (sA > sB) match.home.matchW++;
                else match.home.matchL++;
                match.away.gameW += sB;
                match.away.gameL += sA;
                if (sB > sA) match.away.matchW++;
                else match.away.matchL++;
                match.sudahMain = true;
                match.skorHome = sA;
                match.skorAway = sB;
                if (sA > sB) {
                    match.home.poin += 1;
                } else {
                    match.away.poin += 1;
                }

                if (melibatkanPlayer) {
                    let timMenangSeries = sA > sB ? match.home : match.away;
                    let heroesMenang = gameLogHighlight
                        .filter(g => g.tim === timMenangSeries.nama)
                        .map(g => g.hero);
                    let mvp =
                        heroesMenang.length > 0
                            ? heroesMenang.reduce((a, b) =>
                                  (b.ovr || 0) > (a.ovr || 0) ? b : a
                              )
                            : { nama: timMenangSeries.nama, role: "Tim" };

                    let timMenangStatReg = sA > sB ? match.home : match.away;
                    let timKalahStatReg  = sA > sB ? match.away : match.home;
                    let isHomePlayerReg = match.home.nama === timPlayer;

                    // Generate per-game stats (one set of stats per game played)
                    let totalGames = sA + sB;
                    let perGameStats = [];
                    for (let g = 0; g < totalGames; g++) {
                        let gl = gameLogHighlight[g];
                        let isHomeMenangGame = gl && gl.tim === match.home.nama;
                        let timMenangGame = isHomeMenangGame ? match.home : match.away;
                        let timKalahGame  = isHomeMenangGame ? match.away : match.home;
                        let statGame = generateStatistikMatch(timMenangGame, timKalahGame, [gl]);
                        perGameStats.push({
                            statsHome: isHomePlayerReg ? statGame.statsMenang : statGame.statsKalah,
                            statsAway: isHomePlayerReg ? statGame.statsKalah  : statGame.statsMenang,
                            gameDuration: statGame.gameDuration,
                            menangNama: timMenangGame.nama
                        });
                    }

                    // Overall stats for awards
                    let statDataReg = generateStatistikMatch(timMenangStatReg, timKalahStatReg, gameLogHighlight);

                    window._lastMatchResult = {
                        home: match.home,
                        away: match.away,
                        skorHome: sA,
                        skorAway: sB,
                        gameLog: gameLogHighlight,
                        mvp,
                        mvpTim: timMenangSeries.nama,
                        statsHome:    isHomePlayerReg ? statDataReg.statsMenang : statDataReg.statsKalah,
                        statsAway:    isHomePlayerReg ? statDataReg.statsKalah  : statDataReg.statsMenang,
                        gameDuration: statDataReg.gameDuration,
                        awards:       statDataReg.awards,
                        timMenang:    timMenangStatReg,
                        timKalah:     timKalahStatReg,
                        perGameStats: perGameStats
                    };
                }

                // [BUGFIX] Moral sekarang diupdate utk KEDUA tim di SETIAP match
                // (sebelumnya cuma rosterKita & cuma kalau melibatkanPlayer).
                terapkanMoralPascaMatch(match.home);
                terapkanMoralPascaMatch(match.away);

                if (
                    match.home.nama === timPlayer ||
                    match.away.nama === timPlayer
                ) {
                    counterMatchKita++;

                    // [WIRING FIX] fanbase.jumlah/moral/streak/statusKritik
                    // sebelumnya gak pernah keupdate dari hasil match reguler
                    // karena prosesFanbasePascaMatch() gak pernah dipanggil
                    // di manapun (dead code). Sekarang disambungin di sini,
                    // satu-satunya titik resolusi match player. Fungsi ini
                    // sendiri yang ngurus streakKalahKita, jadi sync manual
                    // yang lama (FIX 5) udah gak perlu lagi.
                    if (typeof fanbase !== "undefined" && typeof prosesFanbasePascaMatch === "function") {
                        let isPlayerHome = match.home.nama === timPlayer;
                        let playerMenang = isPlayerHome ? (sA > sB) : (sB > sA);
                        let skorKita   = isPlayerHome ? sA : sB;
                        let skorLawan  = isPlayerHome ? sB : sA;
                        prosesFanbasePascaMatch({ menang: playerMenang, skorKita, skorLawan });
                    }
                }

                if (!match.home.streak) match.home.streak = 0;
                if (!match.away.streak) match.away.streak = 0;
                if (sA > sB) {
                    match.home.streak =
                        match.home.streak > 0 ? match.home.streak + 1 : 1;
                    match.away.streak =
                        match.away.streak < 0 ? match.away.streak - 1 : -1;
                } else {
                    match.away.streak =
                        match.away.streak > 0 ? match.away.streak + 1 : 1;
                    match.home.streak =
                        match.home.streak < 0 ? match.home.streak - 1 : -1;
                }

                if (match.home.streak === -4 && match.home.nama !== timPlayer)
                    tambahBerita(
                        `🚨 Krisis: Manajemen <span>${match.home.nama}</span> dikabarkan akan mengevaluasi pelatih usai Lose Streak 4x beruntun.`
                    );
                if (match.away.streak === -4 && match.away.nama !== timPlayer)
                    tambahBerita(
                        `🚨 Krisis: Manajemen <span>${match.away.nama}</span> dikabarkan akan mengevaluasi pelatih usai Lose Streak 4x beruntun.`
                    );
            } else {
                break; // tidak ada match lagi untuk hari ini (date-gate)
            }
        } // end while match hari ini

        // --- 2. SIMULASI PERTANDINGAN AI BACKGROUND ---
            function simulasikanAI(matchAI) {
                let skA = 0,
                    skB = 0;
                for (let k = 0; k < 3; k++) {
                    if (skA === 2 || skB === 2) break;
                    let pHomeAI = hitungPerformaMatch(matchAI.home);
                    let pAwayAI = hitungPerformaMatch(matchAI.away);
                    if (pHomeAI > pAwayAI) skA++;
                    else skB++;
                }
                matchAI.home.gameW += skA;
                matchAI.home.gameL += skB;
                matchAI.away.gameW += skB;
                matchAI.away.gameL += skA;
                if (skA > skB) {
                    matchAI.home.matchW++;
                    matchAI.away.matchL++;
                    matchAI.home.poin++;
                    matchAI.home.streakKalah = 0;
                    matchAI.home.alarmStreak3Ditampilkan = false;
                    matchAI.away.streakKalah = (matchAI.away.streakKalah || 0) + 1;
                } else {
                    matchAI.away.matchW++;
                    matchAI.home.matchL++;
                    matchAI.away.poin++;
                    matchAI.away.streakKalah = 0;
                    matchAI.away.alarmStreak3Ditampilkan = false;
                    matchAI.home.streakKalah = (matchAI.home.streakKalah || 0) + 1;
                }
                // [FIX] Simpan hasil ke object match biar tampil skornya di JADWAL & HASIL
                // (sebelumnya cuma update stats tim, gak pernah nulis skorHome/skorAway/
                // sudahMain ke match object -> makanya nyangkut di "VS" selamanya)
                matchAI.skorHome = skA;
                matchAI.skorAway = skB;
                matchAI.sudahMain = true;
                // [BUGFIX] Moral juga jalan utk AI vs AI di region lain
                terapkanMoralPascaMatch(matchAI.home);
                terapkanMoralPascaMatch(matchAI.away);
            }

            if (window.jadwalMatchID && window.jadwalMatchID.length > 0)
                simulasikanAI(window.jadwalMatchID.pop());
            if (window.jadwalMatchPH && window.jadwalMatchPH.length > 0)
                simulasikanAI(window.jadwalMatchPH.pop());
            if (window.jadwalMatchMY && window.jadwalMatchMY.length > 0)
                simulasikanAI(window.jadwalMatchMY.pop());
            if (window.jadwalMatchSG && window.jadwalMatchSG.length > 0)
                simulasikanAI(window.jadwalMatchSG.pop());

            // [MSC x EWC 2026 - FASE 2] Konsumsi harian 9 region baru
            if (window.jadwalMatchKH && window.jadwalMatchKH.length > 0)
                simulasikanAI(window.jadwalMatchKH.pop());
            if (window.jadwalMatchMM && window.jadwalMatchMM.length > 0)
                simulasikanAI(window.jadwalMatchMM.pop());
            if (window.jadwalMatchMENA && window.jadwalMatchMENA.length > 0)
                simulasikanAI(window.jadwalMatchMENA.pop());
            if (window.jadwalMatchTR && window.jadwalMatchTR.length > 0)
                simulasikanAI(window.jadwalMatchTR.pop());
            if (window.jadwalMatchEECA && window.jadwalMatchEECA.length > 0)
                simulasikanAI(window.jadwalMatchEECA.pop());
            if (window.jadwalMatchEA && window.jadwalMatchEA.length > 0)
                simulasikanAI(window.jadwalMatchEA.pop());
            if (window.jadwalMatchAM && window.jadwalMatchAM.length > 0)
                simulasikanAI(window.jadwalMatchAM.pop());
            if (window.jadwalMatchIN && window.jadwalMatchIN.length > 0)
                simulasikanAI(window.jadwalMatchIN.pop());
            if (window.jadwalMatchWEU && window.jadwalMatchWEU.length > 0)
                simulasikanAI(window.jadwalMatchWEU.pop());

        // --- 2. KALENDER: SEKARANG BENER-BENER MAJU 1 HARI PER KLIK ---
        // Siklus indeksHari 0-6 = Jumat..Kamis (1 minggu penuh, 7 hari = 7
        // klik). Indeks 3-6 (Senin-Kamis) gak ada partai MPL, tapi tetep
        // 1 klik = 1 hari, persis kayak dunia nyata -- gak ada lagi
        // lompatan +5 hari sekaligus.
        let indeksHariSebelumProses = indeksHari;
        kalenderGame.setDate(kalenderGame.getDate() + 1);

        // FIX: MID_SEASON hanya boleh trigger setelah mplLenMulai (27 Mar).
        // Tanpa guard ini, indeksHari=2 && mingguKe=4 terpenuhi di 4 Mar
        // (23 hari setelah 9 Feb), saat MPL belum mulai sama sekali.
        let _tblMid = (typeof ambilTabelTanggalMusimSaatIni === "function")
            ? ambilTabelTanggalMusimSaatIni() : null;
        let _sudahMplAktif = window._mplSeasonReset === true; // true hanya setelah 27 Mar
        if (indeksHariSebelumProses === 2 && mingguKe === 4 && _sudahMplAktif) {
            // MINGGU 4 BERAKHIR (abis matchday Minggu) -> langsung MID_SEASON,
            // bukan lanjut ke hari libur Senin dulu.
            statusGame = "MID_SEASON";
            midSeasonHari = 4; // 4 hari (20-23 Apr)
            indeksHari = 0;
            mingguKe = 5;
            // [FIX] Penambahan pemain/staff baru sekarang di tiap bursa
            // transfer DIBUKA (bukan cuma 1x/tahun pas OFFSEASON), biar
            // suplai gak keburu kering buat ratusan tim yang jalan.
            if (typeof generatePemainDanStaffBaru === "function") generatePemainDanStaffBaru(10, 5);
        } else {
            indeksHari++;
            if (indeksHari > 6) {
                indeksHari = 0;
                mingguKe++;
                // [FIX] prosesFanbasePerMinggu() (pendapatan merchandise
                // mingguan + recovery stamina/mental pemain) sudah lengkap
                // diimplementasi tapi TIDAK PERNAH dipanggil di manapun --
                // makanya "Pendapatan Total" merchandise permanen Rp 0
                // apapun yang terjadi. Sekarang jalan tiap minggu berganti.
                if (typeof prosesFanbasePerMinggu === "function") prosesFanbasePerMinggu();
            }
        }

        // ── NARASI BERITA MILESTONE MINGGUAN ──────────────────────────────
        // Berita kontekstual muncul di hari pertama (Jumat, indeksHari=0)
        // setiap minggu berdasarkan kalender baru (W1=27 Mar, W9=22 Mei dst).
        // Hanya muncul kalau MPL sudah aktif (window._mplSeasonReset = true).
        if (window._mplSeasonReset && indeksHari === 0 && typeof tambahBerita === "function") {
            let _tblNar = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
            let _mplStr = _tblNar ? (function(d) {
                const b = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
                return `${d.getDate()} ${b[d.getMonth()]}`;
            })(_tblNar.mplLenMulai) : "mulai musim";
            let _selesaiStr = _tblNar ? (function(d) {
                const b = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
                return `${d.getDate()} ${b[d.getMonth()]}`;
            })(_tblNar.regulerSelesai) : "24 Mei";
            let _playoffStr = _tblNar ? (function(d) {
                const b = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
                return `${d.getDate()} ${b[d.getMonth()]}`;
            })(_tblNar.playoffMulai) : "10 Jun";

            if (mingguKe === 1) {
                tambahBerita(`🚀 <b>MPL S${musimKe} Resmi DIMULAI!</b> 9 tim terbaik Indonesia unjuk gigi mulai ${_mplStr}. Siapa yang akan mengangkat trofi?`);
            } else if (mingguKe === 2) {
                tambahBerita(`📊 Memasuki <b>Minggu ke-2</b> MPL S${musimKe}. Klasemen awal mulai terbentuk — siapa yang tampil konsisten?`);
            } else if (mingguKe === 3) {
                tambahBerita(`⚔️ <b>Minggu ke-3</b> MPL S${musimKe}: derbi dan laga bergengsi siap tersaji akhir pekan ini.`);
            } else if (mingguKe === 4) {
                tambahBerita(`🔥 <b>Minggu ke-4</b> MPL S${musimKe} — minggu terakhir sebelum jeda mid-season. Krusial untuk posisi klasemen.`);
            } else if (mingguKe === 5) {
                tambahBerita(`💪 <b>MPL S${musimKe} paruh kedua dimulai!</b> Roster lock aktif — strategi sudah terkunci, saatnya eksekusi.`);
            } else if (mingguKe === 6) {
                tambahBerita(`📈 <b>Minggu ke-6</b> MPL S${musimKe}: peta kekuatan mulai jelas. Siapa yang masih punya peluang Playoff?`);
            } else if (mingguKe === 7) {
                tambahBerita(`🎯 <b>Minggu ke-7</b> MPL S${musimKe}: pertarungan tiket Playoff makin ketat. Setiap poin sangat berharga.`);
            } else if (mingguKe === 8) {
                tambahBerita(`⚡ <b>Minggu ke-8</b> MPL S${musimKe}: 2 minggu terakhir regular season. Persaingan Top 6 memanas.`);
            } else if (mingguKe === 9) {
                tambahBerita(`🏁 <b>MINGGU TERAKHIR</b> MPL S${musimKe}. Regular season berakhir ${_selesaiStr} — Playoff dimulai ${_playoffStr}. Pertarungan hidup-mati.`);
            }
        }

        // Tick liga lain (MDL ID, LEN, MDL PH, MAL MY) -- PERSIS 1x per
        // klik, karena tiap klik = 1 hari kalender, titik.
        if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
        if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
        if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();

        if (statusGame === "REGULER") {
            btn.innerText = "Hari Berikutnya";
        }
        updateDashboard();
        // PATCH MENTAL & STAMINA: decay saat match, recovery saat jeda
        if (typeof window.prosesStaminaMental === "function") {
            window.prosesStaminaMental(jumlahMatch > 0);
        }
        prosesAdaptasiLosingStreakAI();
        if (window._lastMatchResult) {
            window.bukaHasilMatch(window._lastMatchResult);
            window._lastMatchResult = null;
        }
        if (counterMatchKita >= 4) {
            prosesPerkembanganPemain();
            prosesPerkembanganRosterAI();
            counterMatchKita = 0;
        }
    }
    // --- 3. STATE BARU KHUSUS SKIP 1 HARI (MID-SEASON) ---
    else if (statusGame === "MID_SEASON") {
        // === MID-SEASON: 4 hari transfer window (20-23 Apr / 19-22 Okt S2) ===
        // Hari 1-3: kalenderGame +1, midSeasonHari--, transfer masih buka
        // Hari 4 (midSeasonHari===1 sebelum --): ini hari terakhir transfer.
        //   → +1 kalenderGame normal (jadi 23 Apr)
        //   → midSeasonHari jadi 0
        //   → TIDAK langsung set REGULER di sini — biarkan blok bawah handle
        // Saat midSeasonHari===0: JANGAN +1 kalenderGame lagi.
        //   → set statusGame = REGULER
        //   → kalenderGame TETAP di 23 Apr
        //   → klik PERTAMA di REGULER: match check (idx=0, Jumat)
        //     SEBELUM +1 → cek tanggalRaw W5 Jumat (24 Apr) vs kal (23 Apr) → FAIL
        //   WAIT — ini masih masalah. Fix: ubah urutan di REGULER:
        //     kalenderGame +1 DULU baru cek match.
        //   Dengan urutan baru: klik pertama REGULER → +1 → kal=24 Apr →
        //     cek match W5 Jumat (24 Apr) → PASS ✅
        //
        // PENTING: perubahan urutan (kalenderGame +1 dulu) juga diterapkan
        // di blok REGULER di atas. Lihat komentar "FIX URUTAN" di sana.

        if (midSeasonHari === 0) {
            // Hari ini adalah Jumat pertama Week 5 — kalenderGame sudah = 24 Apr
            // (karena klik terakhir MID sudah +1 ke 24 Apr, lalu midSeasonHari→0)
            // Langsung masuk REGULER tanpa +1 lagi.
            statusGame = "REGULER";
            // Roster Lock mid-season aktif mulai hari ini
            if (typeof window._rosterLockMidMPL === "undefined" || !window._rosterLockMidMPL) {
                window._rosterLockMidMPL = true;
                if (typeof tambahBerita === "function") {
                    tambahBerita(`🔒 Roster Lock MPL/LEN aktif. Transfer ditutup sampai akhir reguler season.`);
                }
                (function() {
                    let _tblLockMid = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
                    let _hariSelesai = _tblLockMid ? new Date(_tblLockMid.regulerSelesai) : null;
                    const _bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
                    let _tglSelesaiStr = _hariSelesai ? `${_hariSelesai.getDate()} ${_bln[_hariSelesai.getMonth()]}` : "akhir musim";
                    bukaModal(
                        "ROSTER LOCK AKTIF 🔒",
                        `Jeda transfer mid-season berakhir!<br><br>Roster Lock MPL/LEN resmi dimulai hari ini.<br>Semua transfer tim MPL, LEN, dan MAL <b>ditutup total</b> sampai musim reguler berakhir (<b>${_tglSelesaiStr}</b>).<br><br>Selamat berjuang di paruh kedua musim!`,
                        "#E8720C"
                    );
                })();
            }
            btn.innerText = "Hari Berikutnya";
            if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
            if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
            if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();
            updateDashboard();
            return;
        }

        // Hari 1-4 MID: maju kalender, kurangi counter
        kalenderGame.setDate(kalenderGame.getDate() + 1);
        midSeasonHari--;

        if (midSeasonHari === 0) {
            // Ini adalah klik terakhir MID — kalenderGame sudah = 24 Apr (Jumat W5)
            // Langsung lock roster dan masuk REGULER di klik BERIKUTNYA
            btn.innerText = "Hari Berikutnya";
        } else {
            btn.innerText = "Hari Berikutnya";
        }
        // Liga background tetap jalan selama transfer window
        if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
        if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
        if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();
        updateDashboard();
    } else if (statusGame === "JEDA_PLAYOFF") {
        // === JEDA 14 HARI PRA-PLAYOFF ===
        hariJeda--;
        kalenderGame.setDate(kalenderGame.getDate() + 1);

        if (hariJeda <= 0) {
            // Jeda selesai, masuk Playoff sekarang
            statusGame = "PLAYOFF";
            initPlayoffMulai();
            btn.innerText = "Hari Berikutnya";
            tambahBerita(`🏟️ Jeda pra-playoff selesai. <b>PLAYOFF MPL S${musimKe}</b> resmi dimulai.`);
        } else {
            btn.innerText = "Hari Berikutnya";
            if (hariJeda === 7) {
                tambahBerita(`⏳ 1 minggu menuju Playoff MPL S${musimKe}. Tim melakukan boot camp intensif.`);
            } else if (hariJeda === 3) {
                tambahBerita(`🔥 3 hari lagi. Finalisasi strategi dan draft pool sebelum Playoff dimulai.`);
            }
        }
        // FIX: liga lain tetap jalan selama jeda pra-playoff ini.
        if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
        if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
        if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();
        updateDashboard();
        return;
    } else if (statusGame === "PLAYOFF") {
        // === OVERHAUL KALENDER: kemajuan tanggal per fase playoff,
        // dipetakan PERSIS ke jadwal yang disepakati (Rabu-Minggu).
        // Tanggal TIDAK mempengaruhi logika pertandingan (yang sudah
        // ada & teruji) -- cuma menjamin kalenderGame maju sesuai hari
        // yang benar, dan jadi jangkar utk Playoff Degradasi & MAL MY.
        let tabelPlayoffHari = (typeof bangunJadwalPlayoffPerHari === "function" && typeof ambilTabelTanggalMusimSaatIni === "function")
            ? bangunJadwalPlayoffPerHari(ambilTabelTanggalMusimSaatIni().playoffMulai) : null;

        if (playoffFase === 1) {
            // --- PLAY-IN (Lower Bracket Qualifier) -- Rabu, hari ke-1 ---
            if (tabelPlayoffHari) kalenderGame = new Date(tabelPlayoffHari[1].tanggal);
            tambahBerita(`🏟️ Playoff S${musimKe} Dimulai. 6 Tim terakhir berjuang memperebutkan tiket Upper Bracket.`);
            pData.m1 = simulasiPlayoffMatch(pData.m1.home, pData.m1.away, 5, "playoff_playin");
            pData.m2 = simulasiPlayoffMatch(pData.m2.home, pData.m2.away, 5, "playoff_playin");
            pData.m3.away = pData.m2.menang;
            pData.m4.away = pData.m1.menang;
            // Berita hasil play-in
            tambahBerita(`📊 Play-In ID: <span>${pData.m1.menang.nama}</span> dan <span>${pData.m2.menang.nama}</span> berhasil lolos ke Upper Bracket.`);
            if (window.pDataPH) {
                window.pDataPH.m1 = simulasiPlayoffMatch(window.pDataPH.m1.home, window.pDataPH.m1.away, 5, "playoff_playin");
                window.pDataPH.m2 = simulasiPlayoffMatch(window.pDataPH.m2.home, window.pDataPH.m2.away, 5, "playoff_playin");
                window.pDataPH.m3.away = window.pDataPH.m2.menang;
                window.pDataPH.m4.away = window.pDataPH.m1.menang;
            }
            if (window.pDataMY) {
                window.pDataMY.m1 = simulasiPlayoffMatch(window.pDataMY.m1.home, window.pDataMY.m1.away, 5, "playoff_playin");
                window.pDataMY.m2 = simulasiPlayoffMatch(window.pDataMY.m2.home, window.pDataMY.m2.away, 5, "playoff_playin");
                window.pDataMY.m3.away = window.pDataMY.m2.menang;
                window.pDataMY.m4.away = window.pDataMY.m1.menang;
            }
            if (window.pDataSG) {
                window.pDataSG.m1 = simulasiPlayoffMatch(window.pDataSG.m1.home, window.pDataSG.m1.away, 5, "playoff_playin");
                window.pDataSG.m2 = simulasiPlayoffMatch(window.pDataSG.m2.home, window.pDataSG.m2.away, 5, "playoff_playin");
                window.pDataSG.m3.away = window.pDataSG.m2.menang;
                window.pDataSG.m4.away = window.pDataSG.m1.menang;
            }
            // [MSC x EWC 2026] Play-In 9 region baru
            if (typeof jalankanFasePlayoffSemuaRegionBaru === "function") jalankanFasePlayoffSemuaRegionBaru(1);

            // === BARENGAN HARI YANG SAMA: PLAYOFF DEGRADASI MDL-LEN ===
            // [FIX] Eksekusi & reveal LANGSUNG di hari-H (playoffMulai),
            // gak ditunda lagi ke klik berikutnya -- biar highlight hasil
            // langsung muncul di klik yang sama pas kalenderGame nyampe
            // hari-H, tanpa perlu klik dua kali.
            if (typeof jalankanPlayoffDegradasiPenuh === "function" && window._siapPlayoffDegradasiMDLLEN) {
                window._siapPlayoffDegradasiMDLLEN = false;

                jalankanPlayoffDegradasiPenuh();
                window._bracketPlayoffDegradasiMDLLENTerakhir = window._bracketPlayoffDegradasiMDLLEN;

                if (typeof inisialisasiMusimMDLdanLEN === "function") inisialisasiMusimMDLdanLEN();

                // Highlight/reveal hasil -- relevan buat tim player kalau dia
                // salah satu peserta (promosi/gagal), generik kalau enggak.
                let _bracketReveal = window._bracketPlayoffDegradasiMDLLENTerakhir || [];
                let _matchPlayerReveal = _bracketReveal.find(m =>
                    (m.home && m.home.nama === timPlayer) || (m.away && m.away.nama === timPlayer));

                if (_matchPlayerReveal) {
                    let _menangPemainReveal = _matchPlayerReveal.menang === timPlayer;
                    let _lawanReveal = (_matchPlayerReveal.home.nama === timPlayer) ? _matchPlayerReveal.away.nama : _matchPlayerReveal.home.nama;
                    let _skorRevealTeks = `${_matchPlayerReveal.skorHome ?? 0} - ${_matchPlayerReveal.skorAway ?? 0}`;
                    if (_menangPemainReveal) {
                        tambahBerita(`🏆 Promosi Berhasil. <b>${timPlayer}</b> mengalahkan ${_lawanReveal} (${_skorRevealTeks}) di Playoff Promosi/Degradasi dan naik ke MDL musim depan.`);
                    } else {
                        tambahBerita(`❌ Gagal Promosi. <b>${timPlayer}</b> kalah dari ${_lawanReveal} (${_skorRevealTeks}) di Playoff Promosi/Degradasi.`);
                    }
                } else if (typeof ligaPlayer !== "undefined" && (ligaPlayer === "LEN" || ligaPlayer === "MDL" || ligaPlayer === "MAL")) {
                    tambahBerita(`🏆 Hasil Playoff Promosi/Degradasi Mdl-Len sudah keluar. Cek Klasemen untuk detail bracket lengkap.`);
                }
            }

            // === BARENGAN HARI YANG SAMA: MAL MY QUARTER FINAL ===
            if (typeof jalankanQuarterFinalMALMY === "function") {
                jalankanQuarterFinalMALMY();
            }

            cekDanTampilHasilDramatis();

            // [FIX] Setelah highlight Play-In + Playoff Degradasi/Promosi
            // MDL-LEN tampil, kalenderGame langsung dimajuin ke tanggal
            // hari berikutnya (11 Jun / Kamis) DI KLIK YANG SAMA. Jadi
            // alurnya: 10 Juni -> klik -> highlight tampil -> tanggal
            // langsung 11 Juni. playoffFase tetap lanjut ke 2 seperti
            // biasa buat proses UB Semi Final di klik selanjutnya.
            if (tabelPlayoffHari && tabelPlayoffHari[2]) {
                kalenderGame = new Date(tabelPlayoffHari[2].tanggal);
            } else {
                kalenderGame.setDate(kalenderGame.getDate() + 1);
            }

            playoffFase = 2;
            btn.innerText = "Hari Berikutnya";
        } else if (playoffFase === 2) {
            // --- UPPER BRACKET SEMI FINAL BO5 -- Kamis, hari ke-2 ---
            if (tabelPlayoffHari) kalenderGame = new Date(tabelPlayoffHari[2].tanggal);
            tambahBerita(`⚔️ Upper Bracket Semi Final. Empat tim unggulan siap saling bunuh.`);
            pData.m3 = simulasiPlayoffMatch(pData.m3.home, pData.m3.away, 5, "playoff_semi");
            pData.m4 = simulasiPlayoffMatch(pData.m4.home, pData.m4.away, 5, "playoff_semi");
            tambahBerita(`📊 UB Semi ID: <span>${pData.m3.menang.nama}</span> & <span>${pData.m4.menang.nama}</span> maju ke UB Final. <span>${pData.m3.kalah.nama}</span> & <span>${pData.m4.kalah.nama}</span> jatuh ke Lower Bracket.`);
            pData.m5 = { home: pData.m3.kalah, away: pData.m4.kalah, sudahMain: false };
            pData.m6 = { home: pData.m3.menang, away: pData.m4.menang, sudahMain: false };
            if (window.pDataPH) {
                window.pDataPH.m3 = simulasiPlayoffMatch(window.pDataPH.m3.home, window.pDataPH.m3.away, 5, "playoff_semi");
                window.pDataPH.m4 = simulasiPlayoffMatch(window.pDataPH.m4.home, window.pDataPH.m4.away, 5, "playoff_semi");
                window.pDataPH.m5 = { home: window.pDataPH.m3.kalah, away: window.pDataPH.m4.kalah };
                window.pDataPH.m6 = { home: window.pDataPH.m3.menang, away: window.pDataPH.m4.menang };
            }
            if (window.pDataMY) {
                window.pDataMY.m3 = simulasiPlayoffMatch(window.pDataMY.m3.home, window.pDataMY.m3.away, 5, "playoff_semi");
                window.pDataMY.m4 = simulasiPlayoffMatch(window.pDataMY.m4.home, window.pDataMY.m4.away, 5, "playoff_semi");
                window.pDataMY.m5 = { home: window.pDataMY.m3.kalah, away: window.pDataMY.m4.kalah };
                window.pDataMY.m6 = { home: window.pDataMY.m3.menang, away: window.pDataMY.m4.menang };
            }
            if (window.pDataSG) {
                window.pDataSG.m3 = simulasiPlayoffMatch(window.pDataSG.m3.home, window.pDataSG.m3.away, 5, "playoff_semi");
                window.pDataSG.m4 = simulasiPlayoffMatch(window.pDataSG.m4.home, window.pDataSG.m4.away, 5, "playoff_semi");
                window.pDataSG.m5 = { home: window.pDataSG.m3.kalah, away: window.pDataSG.m4.kalah };
                window.pDataSG.m6 = { home: window.pDataSG.m3.menang, away: window.pDataSG.m4.menang };
            }
            // [MSC x EWC 2026] UB Semi Final 9 region baru
            if (typeof jalankanFasePlayoffSemuaRegionBaru === "function") jalankanFasePlayoffSemuaRegionBaru(2);

            // === BARENGAN HARI YANG SAMA: MAL MY SEMI FINAL ===
            if (typeof jalankanSemiFinalMALMY === "function") {
                jalankanSemiFinalMALMY();
            }

            cekDanTampilHasilDramatis();
            playoffFase = 3;
            btn.innerText = "Hari Berikutnya";
        } else if (playoffFase === 3) {
            // --- UB FINAL + LB SEMI FINAL BO5 -- Jumat, hari ke-3 ---
            if (tabelPlayoffHari) kalenderGame = new Date(tabelPlayoffHari[3].tanggal);
            tambahBerita(`🔥 UB Final dan Lower Bracket Semi dimainkan secara bersamaan. Drama ganda menanti.`);
            pData.m5 = simulasiPlayoffMatch(pData.m5.home, pData.m5.away, 5, "playoff_semi");
            pData.m6 = simulasiPlayoffMatch(pData.m6.home, pData.m6.away, 5, "playoff_ub");
            tambahBerita(`📊 UB Final ID: <span>${pData.m6.menang.nama}</span> melaju ke Grand Final dari Upper Bracket.`);
            tambahBerita(`📊 LB Semi ID: <span>${pData.m5.menang.nama}</span> masih hidup. <span>${pData.m5.kalah.nama}</span> resmi tereliminasi.`);
            if (pData.m5.kalah.nama === timPlayer) tambahBerita(`💔 Perjalanan <span>${timPlayer}</span> di Playoff S${musimKe} berakhir di Lower Bracket Semi Final.`);
            if (pData.m6.kalah.nama === timPlayer) tambahBerita(`😤 <span>${timPlayer}</span> jatuh dari Upper Bracket tapi masih ada kesempatan dari bawah.`);
            pData.m7 = { home: pData.m5.menang, away: pData.m6.kalah, sudahMain: false };
            if (window.pDataPH) {
                window.pDataPH.m5 = simulasiPlayoffMatch(window.pDataPH.m5.home, window.pDataPH.m5.away, 5, "playoff_semi");
                window.pDataPH.m6 = simulasiPlayoffMatch(window.pDataPH.m6.home, window.pDataPH.m6.away, 5, "playoff_ub");
                window.pDataPH.m7 = { home: window.pDataPH.m5.menang, away: window.pDataPH.m6.kalah };
            }
            if (window.pDataMY) {
                window.pDataMY.m5 = simulasiPlayoffMatch(window.pDataMY.m5.home, window.pDataMY.m5.away, 5, "playoff_semi");
                window.pDataMY.m6 = simulasiPlayoffMatch(window.pDataMY.m6.home, window.pDataMY.m6.away, 5, "playoff_ub");
                window.pDataMY.m7 = { home: window.pDataMY.m5.menang, away: window.pDataMY.m6.kalah };
            }
            if (window.pDataSG) {
                window.pDataSG.m5 = simulasiPlayoffMatch(window.pDataSG.m5.home, window.pDataSG.m5.away, 5, "playoff_semi");
                window.pDataSG.m6 = simulasiPlayoffMatch(window.pDataSG.m6.home, window.pDataSG.m6.away, 5, "playoff_ub");
                window.pDataSG.m7 = { home: window.pDataSG.m5.menang, away: window.pDataSG.m6.kalah };
            }
            // [MSC x EWC 2026] UB Final + LB Semi 9 region baru
            if (typeof jalankanFasePlayoffSemuaRegionBaru === "function") jalankanFasePlayoffSemuaRegionBaru(3);
            // === BARENGAN HARI YANG SAMA: MAL MY FINAL ===
            if (typeof jalankanFinalMALMY === "function") {
                jalankanFinalMALMY();
            }

            cekDanTampilHasilDramatis();
            playoffFase = 4;
            btn.innerText = "Hari Berikutnya";
        } else if (playoffFase === 4) {
            // --- LOWER BRACKET FINAL BO5 -- Sabtu, hari ke-4 ---
            if (tabelPlayoffHari) kalenderGame = new Date(tabelPlayoffHari[4].tanggal);
            tambahBerita(`⚡ Lower Bracket Final. Satu langkah lagi menuju Grand Final — atau pulang selamanya.`);
            pData.m7 = simulasiPlayoffMatch(pData.m7.home, pData.m7.away, 5, "playoff_semi");
            tambahBerita(`📊 LB Final ID: <span>${pData.m7.menang.nama}</span> bangkit dari bawah dan melaju ke Grand Final. <span>${pData.m7.kalah.nama}</span> harus pulang.`);
            if (pData.m7.kalah.nama === timPlayer) tambahBerita(`😔 <span>${timPlayer}</span> tersingkir di Lower Bracket Final S${musimKe}. Perjuangan yang luar biasa.`);
            pData.m8 = { home: pData.m6.menang, away: pData.m7.menang, sudahMain: false };
            if (window.pDataPH) {
                window.pDataPH.m7 = simulasiPlayoffMatch(window.pDataPH.m7.home, window.pDataPH.m7.away, 5, "playoff_semi");
                window.pDataPH.m8 = { home: window.pDataPH.m6.menang, away: window.pDataPH.m7.menang };
            }
            if (window.pDataMY) {
                window.pDataMY.m7 = simulasiPlayoffMatch(window.pDataMY.m7.home, window.pDataMY.m7.away, 5, "playoff_semi");
                window.pDataMY.m8 = { home: window.pDataMY.m6.menang, away: window.pDataMY.m7.menang };
            }
            if (window.pDataSG) {
                window.pDataSG.m7 = simulasiPlayoffMatch(window.pDataSG.m7.home, window.pDataSG.m7.away, 5, "playoff_semi");
                window.pDataSG.m8 = { home: window.pDataSG.m6.menang, away: window.pDataSG.m7.menang };
            }
            // [MSC x EWC 2026] LB Final 9 region baru
            if (typeof jalankanFasePlayoffSemuaRegionBaru === "function") jalankanFasePlayoffSemuaRegionBaru(4);
            cekDanTampilHasilDramatis();
            playoffFase = 5;
            btn.innerText = "Hari Berikutnya";
        } else if (playoffFase === 5) {
            // --- GRAND FINAL BO7 — PUNCAK PLAYOFF REGIONAL -- Minggu, hari ke-5 ---
            if (tabelPlayoffHari) kalenderGame = new Date(tabelPlayoffHari[5].tanggal);
            // [FIX GUARD] pData.m8 seharusnya udah keisi dari fase 4
            // (pData.m6.menang vs pData.m7.menang). Sebelumnya diakses
            // LANGSUNG tanpa dicek (beda sama region PH/MY/SG yang udah
            // dibungkus "if (window.pDataXX)") -- kalau somehow kosong/
            // rusak di titik ini, ini bikin "Cannot read properties of
            // undefined" yang GAK KETANGKEP dan mem-freeze seluruh proses
            // "Hari Berikutnya" (layar macet/blank). Sekarang di-self-heal:
            // coba rekonstruksi ulang dari m6/m7, baru kalau itu juga gak
            // ada, Grand Final ID di-skip (bukan crash) biar musim tetap
            // bisa lanjut ke region lain & fase berikutnya.
            if (!pData.m8 || !pData.m8.home || !pData.m8.away) {
                console.error("[GUARD] pData.m8 kosong/rusak saat Grand Final ID dimulai:", pData);
                if (pData.m6 && pData.m6.menang && pData.m7 && pData.m7.menang) {
                    pData.m8 = { home: pData.m6.menang, away: pData.m7.menang, sudahMain: false };
                } else {
                    pData.m8 = null;
                    tambahBerita(`⚠️ Terjadi gangguan teknis saat menyiapkan Grand Final MPL ID S${musimKe}. Bracket dilewati otomatis musim ini.`);
                }
            }
            if (pData.m8) {
            let gfHome = pData.m8.home, gfAway = pData.m8.away;
            let isPlayerGF = (gfHome.nama === timPlayer || gfAway.nama === timPlayer);
            if (isPlayerGF) {
                tambahBerita(`🏆 Grand Final MPL ID S${musimKe}. <span>${gfHome.nama}</span> vs <span>${gfAway.nama}</span>. Momen yang ditunggu seluruh Indonesia.`);
            } else {
                tambahBerita(`🏆 Grand Final MPL ID S${musimKe}: <span>${gfHome.nama}</span> vs <span>${gfAway.nama}</span>.`);
            }
            pData.m8 = simulasiPlayoffMatch(gfHome, gfAway, 7, "playoff_gf");
            let juaraID = pData.m8.menang;
            window.prosesReputasi(juaraID.nama, "JUARA_MPL");
            if (juaraID.nama === timPlayer) {
                kasTim += 500000000;
                catatKas("MASUK", 500000000, `Prize Pool Juara 1 MPL ID S${musimKe}`);
                reputasiManajer += 50;
                tambahBerita(`🏆 Juara. <span>${timPlayer}</span> memenangkan MPL ID Season ${musimKe} dengan skor ${pData.m8.skorHome}-${pData.m8.skorAway}. Sejarah tercipta.`);
                if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara MPL Indonesia S${musimKe}`, "mpl");
            } else {
                tambahBerita(`🏆 <span>${juaraID.nama}</span> adalah Raja MPL ID S${musimKe} dengan skor ${pData.m8.skorHome > pData.m8.skorAway ? pData.m8.skorHome : pData.m8.skorAway}-${pData.m8.skorHome > pData.m8.skorAway ? pData.m8.skorAway : pData.m8.skorHome}.`);
            }
            bankRiwayatJuara.push({ season: musimKe, tahun: kalenderGame.getFullYear(), tim: juaraID, negara: "🇮🇩 ID" });
            if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir("ID", "REGULAR", pData.m8.kalah);
            } // [FIX GUARD] penutup blok "if (pData.m8)"
            if (window.pDataPH) {
                window.pDataPH.m8 = simulasiPlayoffMatch(window.pDataPH.m8.home, window.pDataPH.m8.away, 7, "playoff_gf");
                let juaraPH = window.pDataPH.m8.menang;
                window.prosesReputasi(juaraPH.nama, "JUARA_MPL");
                // [FIX] Sebelumnya cuma MPL ID yang ngecek apakah pemenangnya
                // player -- MPL PH/MY/SG gak pernah dicek sama sekali, jadi
                // kalau tim player ada di region ini dan juara, prize pool +
                // bonus reputasi manajer TIDAK PERNAH cair.
                if (juaraPH.nama === timPlayer) {
                    kasTim += 500000000;
                    if (typeof catatKas === "function") catatKas("MASUK", 500000000, `Prize Pool Juara 1 MPL PH S${musimKe}`);
                    reputasiManajer += 50;
                    tambahBerita(`🏆 Juara. <span>${timPlayer}</span> memenangkan MPL PH Season ${musimKe}. Sejarah tercipta.`);
                    if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara MPL Philippines S${musimKe}`, "mpl");
                } else {
                    tambahBerita(`🇵 Juara MPL PH S${musimKe}: <span>${juaraPH.nama}</span>.`);
                }
                bankRiwayatJuara.push({ season: musimKe, tahun: kalenderGame.getFullYear(), tim: window.pDataPH.m8.menang, negara: "🇵🇭 PH" });
                if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir("PH", "REGULAR", window.pDataPH.m8.kalah);
            }
            if (window.pDataMY) {
                window.pDataMY.m8 = simulasiPlayoffMatch(window.pDataMY.m8.home, window.pDataMY.m8.away, 7, "playoff_gf");
                let juaraMY = window.pDataMY.m8.menang;
                window.prosesReputasi(juaraMY.nama, "JUARA_MPL");
                if (juaraMY.nama === timPlayer) {
                    kasTim += 500000000;
                    if (typeof catatKas === "function") catatKas("MASUK", 500000000, `Prize Pool Juara 1 MPL MY S${musimKe}`);
                    reputasiManajer += 50;
                    tambahBerita(`🏆 Juara. <span>${timPlayer}</span> memenangkan MPL MY Season ${musimKe}. Sejarah tercipta.`);
                    if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara MPL Malaysia S${musimKe}`, "mpl");
                } else {
                    tambahBerita(`🇲 Juara MPL MY S${musimKe}: <span>${juaraMY.nama}</span>.`);
                }
                bankRiwayatJuara.push({ season: musimKe, tahun: kalenderGame.getFullYear(), tim: window.pDataMY.m8.menang, negara: "🇲🇾 MY" });
                if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir("MY", "REGULAR", window.pDataMY.m8.kalah);
            }
            if (window.pDataSG) {
                window.pDataSG.m8 = simulasiPlayoffMatch(window.pDataSG.m8.home, window.pDataSG.m8.away, 7, "playoff_gf");
                let juaraSG = window.pDataSG.m8.menang;
                window.prosesReputasi(juaraSG.nama, "JUARA_MPL");
                if (juaraSG.nama === timPlayer) {
                    kasTim += 500000000;
                    if (typeof catatKas === "function") catatKas("MASUK", 500000000, `Prize Pool Juara 1 MPL SG S${musimKe}`);
                    reputasiManajer += 50;
                    tambahBerita(`🏆 Juara. <span>${timPlayer}</span> memenangkan MPL SG Season ${musimKe}. Sejarah tercipta.`);
                    if (typeof window.bukaModalJuaraDunia === "function") window.bukaModalJuaraDunia(timPlayer, `Juara MPL Singapore S${musimKe}`, "mpl");
                } else {
                    tambahBerita(`🇸 Juara MPL SG S${musimKe}: <span>${juaraSG.nama}</span>.`);
                }
                bankRiwayatJuara.push({ season: musimKe, tahun: kalenderGame.getFullYear(), tim: window.pDataSG.m8.menang, negara: "🇸🇬 SG" });
                if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir("SG", "REGULAR", window.pDataSG.m8.kalah);
            }
            // [MSC x EWC 2026] Grand Final 9 region baru
            if (typeof jalankanFasePlayoffSemuaRegionBaru === "function") jalankanFasePlayoffSemuaRegionBaru(5);
            cekDanTampilHasilDramatis();
            // [GLOBAL POWER RANKING] Semua Grand Final Regional (13 region) udah
            // kelar di titik ini -> hitung ulang & commit snapshot buat Rank Movement.
            if (typeof window.gprHitungRanking === "function") window.gprHitungRanking(true);

            // [FIX] 2 baris di bawah ini SEBELUMNYA ada di sini:
            //   let wC1 = window.pDataSG.m8.menang; // Juara 1 SG
            //   let wC2 = window.pDataSG.m8.kalah; // Juara 2 SG (Runner-up)
            // Udah dihapus total -- dicek pake grep, wC1/wC2 gak dipake
            // di MANA PUN di seluruh file (dead code, sisa dari sistem
            // lama). Tapi proses ngisi nilainya (window.pDataSG.m8.menang)
            // tetap dieksekusi tiap kali fungsi ini jalan, dan kalau
            // window.pDataSG kosong -> TypeError "Cannot read properties
            // of undefined (reading 'm8')" yang macetin seluruh proses
            // "Hari Berikutnya". Dead code yang gak dipake tapi bisa
            // crash -- dihapus aja, nol resiko karena emang gak ngaruh
            // ke behavior apapun.

            if (musimKe % 2 !== 0) {
                // MUSIM GANJIL -> MSC x EWC 2026 (sistem baru, ganti total)
                bukaModal(
                    "REGIONAL SELESAI! 🌍",
                    "Semua liga regional telah berakhir. Roster Lock MSC dalam beberapa hari, lalu Wild Card dimulai 1 Juli!",
                    "#0891B2"
                );

                // [MSC x EWC 2026] Kualifikasi 25 tim (15 direct + 10 wildcard)
                // dari SEMUA 13 region -- gantiin q1-q4 lama yang cuma dari 4 region.
                window.mscEwcState = {
                    kualifikasi: (typeof tentukanKualifikasiMSC === "function") ? tentukanKualifikasiMSC() : null
                };
                // [GLOBAL POWER RANKING] Cek status Juara/Runner-up Bertahan MSC:
                // 1 hari setelah semua Playoff Regional selesai = di titik ini.
                if (typeof window.gprCekStatusBertahanMSC === "function") {
                    let daftarLolosMSC = window.mscEwcState.kualifikasi
                        ? [
                            ...window.mscEwcState.kualifikasi.mainStage.map(x => x.tim.nama),
                            ...window.mscEwcState.kualifikasi.wildCard.map(x => x.tim.nama)
                        ]
                        : [];
                    window.gprCekStatusBertahanMSC(daftarLolosMSC);
                }

                statusGame = "JEDA_MSC_EWC";
                let tabelTglMSC = (typeof ambilTabelTanggalMusimSaatIni === "function")
                    ? ambilTabelTanggalMusimSaatIni() : null;
                hariJeda = tabelTglMSC
                    ? Math.max(1, selisihHari(kalenderGame, tabelTglMSC.wildCardMulai))
                    : 14; // fallback aman
                btn.innerText = "Hari Berikutnya";
            } else {
                // MUSIM GENAP -> M7 WORLD CHAMPIONSHIP (sistem baru, ganti total)
                // [FIX] edisiMSeries dinaikin DULU sebelum dipakai di modal/berita
                // di bawah, biar turnamen M-Series pertama player itu "M1", bukan
                // hardcode "M7".
                edisiMSeries++;
                bukaModal(
                    "REGIONAL SELESAI! 🏆",
                    `Semua liga regional telah berakhir. Roster Lock M${edisiMSeries} dalam beberapa hari, lalu Wild Card dimulai 3 Januari!`,
                    "#C9971F"
                );

                // [M7 WORLD CHAMPIONSHIP] Kualifikasi 22 tim (14 Main Event
                // langsung + 8 Wild Card) dari SEMUA 13 region -- gantiin
                // q1-q4 lama yang cuma dari 4 region.
                window.m7State = {
                    kualifikasi: (typeof tentukanKualifikasiM7 === "function") ? tentukanKualifikasiM7() : null
                };
                // [GLOBAL POWER RANKING] Cek status Juara/Runner-up Bertahan
                // M-Series: 1 hari setelah semua Playoff Regional selesai.
                if (typeof window.gprCekStatusBertahanMSeries === "function") {
                    let daftarLolosMSeriesGPR = window.m7State.kualifikasi
                        ? [
                            ...window.m7State.kualifikasi.mainEvent.map(x => x.tim.nama),
                            ...window.m7State.kualifikasi.wildCard.map(x => x.tim.nama)
                        ]
                        : [];
                    window.gprCekStatusBertahanMSeries(daftarLolosMSeriesGPR);
                }

                statusGame = "JEDA_M7";
                let tabelTglM7 = (typeof ambilTabelTanggalMusimSaatIni === "function")
                    ? ambilTabelTanggalMusimSaatIni() : null;
                hariJeda = tabelTglM7
                    ? Math.max(1, selisihHari(kalenderGame, tabelTglM7.wildCardMulai))
                    : 14; // fallback aman
                btn.innerText = "Hari Berikutnya";

                // RADAR ABSEN M7 -- cek dari daftar kualifikasi (Main Event + Wild Card) yang sesungguhnya
                let semuaLolosM7 = window.m7State.kualifikasi
                    ? [...window.m7State.kualifikasi.mainEvent.map(x => x.tim.nama), ...window.m7State.kualifikasi.wildCard.map(x => x.tim.nama)]
                    : [];
                if (!semuaLolosM7.includes("RRQ"))
                    tambahBerita(
                        `📉 Sejarah Buruk: Sang Raja <span>RRQ</span> dipastikan Absen dari panggung M${edisiMSeries} World Championship tahun ini.`
                    );
                if (!semuaLolosM7.includes("ONIC"))
                    tambahBerita(
                        `📉 Kejutan: Sang Landak <span>ONIC</span> gagal mengamankan tiket menuju M${edisiMSeries} World Championship.`
                    );
            }
        }

        updateDashboard();
    } else if (statusGame === "JEDA_MSC_EWC") {
        // [MSC x EWC 2026] Masa tunggu SEBELUM Wild Card dimulai (1 Jul).
        // Terpisah total dari JEDA_MSC lama -- state ini punya nama sendiri
        // biar gak numpuk sama logic MSC/M-Series lama.
        kalenderGame.setDate(kalenderGame.getDate() + 1);
        let tabelTglMSC = ambilTabelTanggalMusimSaatIni();

        if (kalenderGame >= tabelTglMSC.wildCardMulai) {
            statusGame = "MSC_EWC";
            bukaModal(
                "WILD CARD DIMULAI! 🎮",
                "Waktu persiapan habis! Wild Card MSC x EWC 2026 resmi dimulai.",
                "#0891B2"
            );
            tambahBerita(`✈️ Berangkat ke venue MSC x EWC 2026. Wild Card dimulai hari ini.`);
            jalankanTickMSCEWC();
            cekDanTampilHasilDramatis();
        } else {
            hariJeda--;
            if (hariJeda === 10) tambahBerita(`💪 Persiapan MSC x EWC 2026 berjalan — boot camp penuh.`);
            else if (hariJeda === 7) tambahBerita(`🎯 1 minggu menuju Wild Card MSC x EWC 2026.`);
            else if (hariJeda === 3) tambahBerita(`🔥 3 hari lagi Wild Card dimulai. Scrimmage terakhir hari ini.`);
            else if (hariJeda === 1) tambahBerita(`😤 Besok Wild Card Dimulai. Fokus penuh.`);
        }
        btn.innerText = "Hari Berikutnya";
        updateDashboard();
        if (typeof renderLayarMSC === "function") renderLayarMSC();
    } else if (statusGame === "MSC_EWC") {
        // [MSC x EWC 2026] Seluruh turnamen aktif (Wild Card -> Group Stage
        // -> Knockout -> Grand Final) dikendaliin murni dari tanggal kalender
        // lewat jalankanTickMSCEWC(), bukan counter fase manual.
        kalenderGame.setDate(kalenderGame.getDate() + 1);
        jalankanTickMSCEWC();
        // [FIX] SEBELUMNYA gak pernah dipanggil buat MSC/M7 -- makanya
        // match tim player yang disimulasiin gak pernah muncul modal
        // "highlight" hasilnya kayak PLAYOFF/MPL biasa.
        cekDanTampilHasilDramatis();
        btn.innerText = "Hari Berikutnya";
        updateDashboard();
        if (typeof renderLayarMSC === "function") renderLayarMSC();
    } else if (statusGame === "JEDA_M7") {
        // [M7 WORLD CHAMPIONSHIP] Masa tunggu SEBELUM Wild Card dimulai (3 Jan).
        // Terpisah total dari JEDA_MSERIES lama -- state ini punya nama sendiri
        // biar gak numpuk sama logic M-Series lama.
        kalenderGame.setDate(kalenderGame.getDate() + 1);
        let tabelTglM7 = ambilTabelTanggalMusimSaatIni();

        if (kalenderGame >= tabelTglM7.wildCardMulai) {
            statusGame = "M7";
            bukaModal(
                "WILD CARD DIMULAI! 🎮",
                `Waktu persiapan habis! Wild Card M${edisiMSeries} World Championship resmi dimulai.`,
                "#5B3DF5"
            );
            tambahBerita(`✈️ Berangkat ke venue M${edisiMSeries} World Championship. Wild Card dimulai hari ini.`);
            jalankanTickM7();
            cekDanTampilHasilDramatis();
        } else {
            hariJeda--;
            if (hariJeda === 10) tambahBerita(`💪 Persiapan M${edisiMSeries} World Championship berjalan — boot camp penuh.`);
            else if (hariJeda === 7) tambahBerita(`🎯 1 minggu menuju Wild Card M${edisiMSeries} World Championship.`);
            else if (hariJeda === 3) tambahBerita(`🔥 3 hari lagi Wild Card dimulai. Scrimmage terakhir hari ini.`);
            else if (hariJeda === 1) tambahBerita(`😤 Besok Wild Card Dimulai. Fokus penuh.`);
        }
        btn.innerText = "Hari Berikutnya";
        updateDashboard();
        if (typeof renderLayarM7 === "function") renderLayarM7();
    } else if (statusGame === "M7") {
        // [M7 WORLD CHAMPIONSHIP] Seluruh turnamen aktif (Wild Card -> Swiss
        // Stage -> Knockout -> Grand Final) dikendaliin murni dari tanggal
        // kalender lewat jalankanTickM7(), bukan counter fase manual.
        kalenderGame.setDate(kalenderGame.getDate() + 1);
        jalankanTickM7();
        // [FIX] Sama kayak MSC_EWC di atas.
        cekDanTampilHasilDramatis();
        btn.innerText = "Hari Berikutnya";
        updateDashboard();
        if (typeof renderLayarM7 === "function") renderLayarM7();
    } else if (statusGame === "JEDA_TRANSFER") {
        // === TRANSFER WINDOW 30 HARI SETELAH MSC/MSERIES ===
        hariJeda--;
        kalenderGame.setDate(kalenderGame.getDate() + 1);

        if (hariJeda <= 0) {
            // Transfer window tutup, masuk OFFSEASON processing
            transferBuka = false;
            tambahBerita(`🔒 <b>BURSA Transfer DITUTUP!</b> Transfer window 30 hari telah berakhir. Roster dikunci untuk evaluasi akhir musim.`);
            statusGame = "OFFSEASON";
            btn.innerText = "Hari Berikutnya";
        } else {
            btn.innerText = "Hari Berikutnya";
            // Narasi progresif transfer window
            if (hariJeda === 25) {
                tambahBerita(`📰 Minggu pertama transfer window. Rumor dan negosiasi mulai bermunculan di seluruh region.`);
            } else if (hariJeda === 20) {
                tambahBerita(`💼 Transfer window memasuki minggu kedua. Beberapa deal besar dilaporkan hampir final.`);
            } else if (hariJeda === 14) {
                tambahBerita(`⏳ 2 minggu tersisa di transfer window. Segera selesaikan negosiasi sebelum terlambat.`);
            } else if (hariJeda === 7) {
                tambahBerita(`🚨 7 hari tersisa. Bursa transfer makin panas — deal terakhir biasanya paling mengejutkan.`);
            } else if (hariJeda === 3) {
                tambahBerita(`⚠️ Deadline Transfer Semakin Dekat. Hanya ${hariJeda} hari tersisa. Putuskan sekarang.`);
            } else if (hariJeda === 1) {
                tambahBerita(`🔔 Hari Terakhir Transfer. Besok bursa ditutup — ini kesempatan terakhir untuk bergerak.`);
            }
        }
        // FIX: liga lain tetap jalan selama transfer window 30 hari ini.
        if (typeof tickSimulasiMDLdanLEN === "function") tickSimulasiMDLdanLEN();
        if (typeof tickSimulasiMDLPH === "function") tickSimulasiMDLPH();
        if (typeof tickSimulasiMALMY === "function") tickSimulasiMALMY();
        updateDashboard();
    } else if (statusGame === "OFFSEASON") {
        // Evaluasi KPI sponsor HARUS di sini -- paling awal masuk OFFSEASON,
        // soalnya pData/pDataPH/pDataMY/pDataSG masih utuh (belum di-reset
        // buat musim baru, itu kejadian di ujung branch ini nanti).
        if (typeof evaluasiKPISponsor === "function") evaluasiKPISponsor();
        if (typeof investigasiSponsorIlegal === "function") investigasiSponsorIlegal();

        // [MERCH V3] Hook prestasi merchandise -- akhir musim MPL (region player)
        if (typeof window.catatPrestasiMerchandiseV3 === "function" &&
            typeof tentukanPencapaianPlayoffPlayer === "function") {
            let _pencapaianMPL = tentukanPencapaianPlayoffPlayer();
            if (_pencapaianMPL === "JUARA_MPL") window.catatPrestasiMerchandiseV3("MPL", "juara");
            else if (_pencapaianMPL === "GRAND_FINAL") window.catatPrestasiMerchandiseV3("MPL", "runnerUp");

            // [WIRING FIX] Bonus fanbase dari pencapaian playoff/MPL sebelumnya
            // gak pernah ke-trigger karena prosesFanbaseEventBesar() dead code.
            // Reuse _pencapaianMPL yang udah dihitung di atas, gak perlu hitung ulang.
            if (typeof window.hookFanbaseEventBesar === "function") {
                if (_pencapaianMPL === "JUARA_MPL") window.hookFanbaseEventBesar("JUARA_MPL");
                else if (_pencapaianMPL === "GRAND_FINAL") window.hookFanbaseEventBesar("GRAND_FINAL");
                else if (_pencapaianMPL === "LOLOS_PLAYOFF") window.hookFanbaseEventBesar("LOLOS_PLAYOFF");
            }
        }

        let totalGaji = 0;
        let pemainKeluar = [];
        let pemainPensiun = [];
        let rosterBaru = [];

        // ==========================================
        // SISTEM SCOUTING TAWARAN MANAJER (JOB OFFERS)
        // ==========================================
        // Peluang 40% dapet tawaran tiap musim kalau reputasi lu udah di atas 50
        if (reputasiManajer >= 50 && Math.random() < 0.4) {
            let semuaTimAIGlobal = [
                ...daftarTim,
                ...daftarTimPH,
                ...daftarTimMY,
                ...daftarTimSG
            ].filter(t => t.nama !== timPlayer);

            // Acak satu tim buat nawar lu (Biasanya tim-tim sultan dari PH/MY/SG juga ikutan nawar)
            let timBerminat = semuaTimAIGlobal.sort(
                () => 0.5 - Math.random()
            )[0];

            let offerId = "ceo_" + Date.now();
            let emailIsi = `
                <div style="font-size:13px; color:#5C6472; line-height:1.6; margin-bottom:15px;">
                    Yth. <b>${namaManajer}</b>,<br><br>
                    Manajemen <b>${timBerminat.nama}</b> sangat terkesan dengan rekam jejak juara Anda bersama ${timPlayer}. 
                    Kami sedang membangun proyek besar (Rebuild) dan ingin menawarkan posisi CEO/Head Manager kepada Anda untuk musim depan.<br><br>
                    Jika setuju, Anda akan mengambil alih kendali penuh dengan anggaran kas awal: <b style="color:#C9971F;">Rp ${(timBerminat.kas / 1000000).toFixed(1)} Jt</b>.
                </div>
                <div id="${offerId}" style="display: flex; gap: 10px;">
                    <button class="modal-btn" style="background:#E5484D; color:#fff; flex:1; padding:8px; font-size:11px;" onclick="tolakTawaranCEO('${offerId}')">TOLAK</button>
                    <button class="modal-btn" style="background:#00B37E; color:#fff; flex:1; padding:8px; font-size:11px;" onclick="terimaTawaranCEO('${timBerminat.nama}', '${offerId}')">TERIMA KONTRAK</button>
                </div>
            `;
            tambahEmail(
                `PROPOSAL CEO: Proyek Rebuild ${timBerminat.nama}`,
                `Dewan Direksi ${timBerminat.nama}`,
                emailIsi
            );
        }
        // ==========================================

        // --- 1. PENCATAT OTOMATIS RIWAYAT KARIR PEMAIN ---
        let tahunSkrg = kalenderGame.getFullYear();

        // Bikin fungsi pembantu biar rapi dan deteksi status Loan
        function catatKarir(p, namaTim, timAsli) {
            if (!p.riwayatKarir) p.riwayatKarir = [];

            // Deteksi kalau statusnya pinjaman (Loan)
            let teksTim =
                p.isLoan && timAsli !== namaTim
                    ? "Loan to " + namaTim
                    : namaTim;

            let lastIdx = p.riwayatKarir.length - 1;

            // Kalau tim yang sekarang SAMA dengan riwayat terakhir, update aja tahun akhirnya
            if (lastIdx >= 0 && p.riwayatKarir[lastIdx].tim === teksTim) {
                p.riwayatKarir[lastIdx].tahunAkhir = tahunSkrg;
            } else {
                // Kalau beda tim (baru transfer/pinjam), bikin rekam jejak baru
                p.riwayatKarir.push({
                    tahunAwal: tahunSkrg,
                    tahunAkhir: tahunSkrg,
                    tim: teksTim
                });
            }
            if (p.riwayatKarir.length > 8) p.riwayatKarir.shift();
        }

        // Rekam jejak pemain di tim kita
        rosterKita.forEach(p => catatKarir(p, timPlayer, p.timAsli));

        // Rekam jejak pemain di semua tim AI
        let semuaRegionBiarTercatat = [
            daftarTim,
            daftarTimPH,
            daftarTimMY,
            daftarTimSG
        ];
        semuaRegionBiarTercatat.forEach(region => {
            region.forEach(tim => {
                if (tim.nama === timPlayer) return;
                if (tim.roster) {
                    tim.roster.forEach(p => catatKarir(p, tim.nama, p.timAsli));
                }
            });
        });
        // --------------------------------------------------

        // CEK APAKAH INI AKHIR TAHUN? (Kalau habis Season Genap / M-Series, berarti ganti tahun)
        let tahunBerganti = musimKe % 2 === 0;

        // 1. UPDATE ROSTER TIM KITA
        rosterKita.forEach(p => {
            // CEK KALAU DIA PEMAIN PINJAMAN DARI TIM AI
            if (p.isLoan && p.timAsli !== timPlayer) {
                p.durasiPinjam -= 1;
                if (p.durasiPinjam <= 0) {
                    let semuaTimAI = [
                        ...daftarTim,
                        ...daftarTimPH,
                        ...daftarTimMY,
                        ...daftarTimSG
                    ];
                    let timAsal = semuaTimAI.find(t => t.nama === p.timAsli);
                    if (timAsal) {
                        delete p.isLoan;
                        delete p.durasiPinjam;
                        delete p.timAsli;
                        p.sisaKontrak = 2; // Dapet kontrak baru pas balik
                        timAsal.roster.push(p);
                        catatTransferRealTime(p, timAsal.nama, false); // <--- Tambahin ini bro!
                    }
                    pemainKeluar.push(`${p.nama} (Kembali ke ${p.timAsli})`);
                    return; // Skip, jangan masukin ke rosterBaru
                }
            }

            p.kesempatanNego = 3;
            totalGaji += p.gaji;
            p.sisaKontrak -= 1;
            if (tahunBerganti) p.umur += 1;

            if (p.umur >= 34) {
                pemainPensiun.push(p.nama);
            } else if (p.sisaKontrak <= 0) {
                pemainKeluar.push(p.nama);
                p.sisaKontrak = 2;
                p.harga = Math.floor(p.gaji * 1.5) + 20000000;
                pemainTransfer.push(p);
            } else {
                rosterBaru.push(p);
            }
        });

        rosterKita = rosterBaru;
        kasTim -= totalGaji;
        // BIAYA SEWA GH TIAP MUSIM
        let biayaSewaGH = databaseGH[levelGH - 1].sewa;
        kasTim -= biayaSewaGH;
        catatKas(
            "KELUAR",
            biayaSewaGH,
            `Perawatan GH Level ${levelGH} S${musimKe}`
        );

        // 2. UPDATE BURSA TRANSFER & STAFF (Bersih-bersih pensiunan)
        bersihkanBursaTransfer(tahunBerganti);

        // === FASE 16: depresiasi harga/gaji/mental Free Agent +
        // pensiun paksa 2 musim nganggur + auto-akademi utk umur <22
        if (typeof prosesDepresiasiFreeAgent === "function") {
            window._hasilDepresiasiFATerakhir = prosesDepresiasiFreeAgent();
        }

        let totalGajiStaff = 0;
        let staffPensiun = []; // Nampung nama staff yang pensiun
        let roleKeys = ["pelatih", "asisten", "analis"];

        roleKeys.forEach(role => {
            let s = staffKita[role];
            if (s) {
                if (!s.umur) s.umur = 35; // Fix: Pasang umur permanen kalau kosong
                if (tahunBerganti) s.umur += 1;

                // Cek Pensiun Staff (Misal batas pensiun umur 50 tahun)
                if (s.umur >= 50) {
                    staffPensiun.push(`${s.nama} (${s.role})`);
                    staffKita[role] = null; // Keluar dari tim karena pensiun
                } else {
                    totalGajiStaff += s.gaji;
                }
            }
        });

        // Update umur & pensiunkan staff di Bursa Transfer biar sirkulasinya logis
        if (tahunBerganti) {
            let bursaStaffBaru = [];
            bursaStaff.forEach(s => {
                if (!s.umur) s.umur = 35; // Fix: Pasang umur permanen
                s.umur += 1;
                if (s.umur < 50) bursaStaffBaru.push(s); // Yang belum pensiun tetep di bursa
            });
            bursaStaff = bursaStaffBaru;
        }

        // === FASE 8: bayar cicilan hutang bank player (kalau ada pinjaman aktif) ===
        // Diprioritaskan SEBELUM pengeluaran rutin lain dipotong.
        if (typeof bayarCicilanHutangPlayer === "function") {
            window._hasilCicilanHutangTerakhir = bayarCicilanHutangPlayer();
        }

        kasTim -= totalGajiStaff;
        if (totalGajiStaff > 0)
            catatKas(
                "KELUAR",
                totalGajiStaff,
                `Tagihan Gaji Staff S${musimKe}`
            );
        if (totalGaji > 0)
            catatKas("KELUAR", totalGaji, `Tagihan Gaji Pemain S${musimKe}`);
        // [FIX] Dulu di sini: generatePemainDanStaffBaru(7, 7) — cuma sekali
        // setahun pas OFFSEASON, ketinggalan jauh dari kebutuhan ratusan tim.
        // Sekarang penambahan pemain/staff baru dipindah ke tiap titik bursa
        // transfer DIBUKA (MID_SEASON, PRAMUSIM, JEDA_TRANSFER pasca-MSC/M7),
        // masing-masing 10 pemain + 10 staff.

        // === SISTEM EKOSISTEM AI v2.0 ===
        // Jalankan SEBELUM loop AI yang lama, agar kas sudah ter-update
        prosesEkosistemAI(
            typeof pData !== "undefined" ? pData : null,
            typeof window.pDataPH !== "undefined" ? window.pDataPH : null,
            typeof window.pDataMY !== "undefined" ? window.pDataMY : null,
            typeof window.pDataSG !== "undefined" ? window.pDataSG : null
        );

        // [LEVEL 4] Perpanjang kontrak pemain bintang AI sebelum kontraknya habis
        prosesManajemenKontrakAI();

        // === SISTEM AKADEMI ===
        if (typeof window.prosesAkademiPlayer === "function") window.prosesAkademiPlayer();
        if (typeof window.prosesAkademiAI === "function") window.prosesAkademiAI();

        // === PROSES SURAT KETERTARIKAN STAFF ===
        prosesSuratKetertarikanOffseason();

        // === KONTRAK STAFF AI HABIS → MASUK BURSA ===
        let semuaRegionStaff = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
        semuaRegionStaff.forEach(region => {
            region.forEach(tim => {
                if (!tim.staff || tim.nama === timPlayer) return;
                // Pastikan slot analis ada di semua tim AI
                if (tim.staff.analis === undefined) tim.staff.analis = null;

                ["pelatih", "asisten", "analis"].forEach(rk => {
                    let s = tim.staff[rk];
                    if (!s) return;
                    if (s.sisaKontrak !== undefined) s.sisaKontrak--;
                    if (s.sisaKontrak <= 0) {
                        let roleLabel = rk === "pelatih" ? "Pelatih"
                                      : rk === "asisten" ? "Asisten Pelatih"
                                      : "Analis";
                        let sudahDiBursa = bursaStaff.some(b => b.nama === s.nama);
                        if (!sudahDiBursa) {
                            bursaStaff.push({
                                nama: s.nama,
                                role: s.role || roleLabel,
                                buffPower: s.buffPower || 1,
                                gaji: s.gaji || 8000000,
                                harga: s.harga || 15000000,
                                umur: s.umur || 35,
                                sisaKontrak: 0,
                                negara: s.negara || "🌐 Global",
                                kepribadian: s.kepribadian || "Normal",
                                ekspektasiGaji: s.gaji || 8000000
                            });
                            tambahBerita(`📋 Bebas Kontrak: <b>${s.nama}</b> resmi bebas dari ${tim.nama} dan kini tersedia di bursa staff.`);
                        }
                        tim.staff[rk] = null;
                    }
                });
            });
        });

        // === REKRUTMEN STAFF AI (OTOMATIS) ===
        // Mapping: key objek staff → role label di bursaStaff
        const roleStaffMap = {
            pelatih: "Pelatih",
            asisten: "Asisten Pelatih",
            analis:  "Analis"
        };
        // Biaya minimum yang harus disisakan AI setelah bayar staff
        const kasReserveStaff = 200000000;

        semuaRegionStaff.forEach(region => {
            region.forEach(tim => {
                if (!tim.staff || tim.nama === timPlayer) return;

                Object.entries(roleStaffMap).forEach(([rk, roleLabel]) => {
                    // Skip kalau slot sudah terisi
                    if (tim.staff[rk]) return;

                    // Cari kandidat dari bursa yang sesuai role
                    let kandidat = bursaStaff.filter(s => {
                        let roleCocok = s.role === roleLabel ||
                            (roleLabel === "Asisten Pelatih" && (s.role === "Asisten" || s.role === "Asisten Pelatih"));
                        let biayaTerjangkau = (tim.kas || 0) - (s.gaji || 8000000) >= kasReserveStaff;
                        return roleCocok && biayaTerjangkau;
                    });

                    if (kandidat.length === 0) return;

                    // Tim bereputasi tinggi pilih yang buffPower tertinggi
                    // Tim kecil ambil yang termurah biar masih terjangkau
                    kandidat.sort((a, b) => {
                        if ((tim.reputasi || 50) >= 75) {
                            return (b.buffPower || 0) - (a.buffPower || 0); // Prioritas kualitas
                        } else {
                            return (a.gaji || 0) - (b.gaji || 0); // Prioritas harga murah
                        }
                    });

                    let pilihan = kandidat[0];

                    // Rekrut — potong kas AI, pasang di slot
                    tim.kas = (tim.kas || 0) - (pilihan.gaji || 8000000);
                    tim.staff[rk] = {
                        nama: pilihan.nama,
                        role: pilihan.role,
                        buffPower: pilihan.buffPower || 1,
                        gaji: pilihan.gaji || 8000000,
                        harga: pilihan.harga || 10000000,
                        umur: pilihan.umur || 35,
                        sisaKontrak: 2, // Kontrak 2 musim standar
                        negara: pilihan.negara || "🌐 Global",
                        kepribadian: pilihan.kepribadian || "Normal"
                    };

                    // Hapus dari bursa
                    let idx = bursaStaff.findIndex(s => s.nama === pilihan.nama);
                    if (idx !== -1) bursaStaff.splice(idx, 1);

                    // Berita kalau rekrutannya cukup notable (buffPower tinggi)
                    if ((pilihan.buffPower || 0) >= 3) {
                        tambahBerita(`🎙️ Rekrutan Staff: <span>${tim.nama}</span> resmi menunjuk <b>${pilihan.nama}</b> sebagai ${roleLabel} baru mereka.`);
                    }
                });
            });
        });

        // === SISTEM TRANSFER OTOMATIS TIM AI ===
        let semuaRegionAI = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    if (typeof daftarTimKH !== "undefined") semuaRegionAI.push(daftarTimKH);
    if (typeof daftarTimMM !== "undefined") semuaRegionAI.push(daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") semuaRegionAI.push(daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") semuaRegionAI.push(daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") semuaRegionAI.push(daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") semuaRegionAI.push(daftarTimEA);
    if (typeof daftarTimAM !== "undefined") semuaRegionAI.push(daftarTimAM);
    if (typeof daftarTimIN !== "undefined") semuaRegionAI.push(daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") semuaRegionAI.push(daftarTimWEU);

        semuaRegionAI.forEach(region => {
            region.forEach(tim => {
                if (tim.nama === timPlayer) return; // Skip tim kita sendiri

                let roleKosong = [];
                let rosterBaruAI = [];
                let pemainGueYangBalik = [];

                if (tim.roster) {
                    tim.roster.forEach(p => {
                        if (p.isLoan && p.timAsli === timPlayer) {
                            p.durasiPinjam -= 1;
                            if (p.durasiPinjam <= 0) {
                                delete p.isLoan;
                                delete p.durasiPinjam;
                                delete p.timAsli;
                                pemainGueYangBalik.push(p);
                                roleKosong.push(p.role);
                                return;
                            }
                        }

                        // [PATCH] Loan ANTAR-AI (bukan dari tim player) -- balikin
                        // ke tim asalnya sendiri, bukan ke rosterKita.
                        if (p.isLoan && p.timAsli && p.timAsli !== timPlayer) {
                            p.durasiPinjam -= 1;
                            if (p.durasiPinjam <= 0) {
                                let timAsliObj = (typeof cariTimAsliDiDatabase === "function")
                                    ? cariTimAsliDiDatabase(p.timAsli)
                                    : null;
                                delete p.isLoan;
                                delete p.durasiPinjam;
                                let namaTimAsliLama = p.timAsli;
                                delete p.timAsli;
                                if (timAsliObj && timAsliObj.roster) {
                                    timAsliObj.roster.push(p);
                                    catatTransferRealTime(p, namaTimAsliLama, false);
                                }
                                roleKosong.push(p.role);
                                return;
                            }
                        }

                        p.sisaKontrak -= 1;
                        if (tahunBerganti && p.umur) p.umur += 1;

                        // AI Bayar Gaji Pemainnya Tiap Akhir Musim
                        tim.kas -= p.gaji || 3000000;

                        if (p.umur >= 34) {
                            roleKosong.push(p.role);
                        } else if (p.sisaKontrak <= 0) {
                            p.sisaKontrak = 2;
                            pemainTransfer.push(p);
                            roleKosong.push(p.role);
                        } else {
                            rosterBaruAI.push(p);
                        }
                    });
                    tim.roster = rosterBaruAI;
                }

                if (pemainGueYangBalik.length > 0) {
                    rosterKita.push(...pemainGueYangBalik);
                    pemainGueYangBalik.forEach(px => {
                        pemainKeluar.push(
                            `<span style="color:#0891B2;">${px.nama} (Pulang dari Pinjaman)</span>`
                        );
                        catatTransferRealTime(px, timPlayer, false); // <--- Nyatet riwayat dia balik jadi pemain reguler
                    });
                }

                roleKosong.forEach(roleButuh => {
                    let kandidatTerbaik = window.pilihPelapisTerbaik ? window.pilihPelapisTerbaik(roleButuh) : null;

                    if (kandidatTerbaik) {
                        let rekrutan = pemainTransfer.splice(
                            kandidatTerbaik.idx,
                            1
                        )[0];
                        rekrutan.sisaKontrak =
                            Math.floor(Math.random() * 2) + 2;
                        tim.roster.push(rekrutan);

                        // <--- UPDATE RIWAYAT PENGGANTINYA
                        catatTransferRealTime(rekrutan, tim.nama, false);

                        if (rekrutan.ovr >= 78 && Math.random() > 0.5) {
                            tambahBerita(
                                `🔥 Bursa Transfer: <span>${tim.nama}</span> berhasil mendaratkan bintang besar <span>${rekrutan.nama}</span>.`
                            );
                        }
                    } else {
                        // Kalau bursa kosong, orbitkan pemain akademi
                        let pAkademi = {
                            nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : ("Akademi " + tim.nama.split(" ")[0]),
                            role: roleButuh,
                            ovr: tim.power - 4,
                            umur: 18,
                            sisaKontrak: 3,
                            gaji: 5000000,
                            harga: 12000000,
                            negara: benderaAkademiUntukRegion(tim.region),
                            sifat: "Normal"
                        };
                        tim.roster.push(pAkademi);

                        // <--- UPDATE RIWAYAT AKADEMI PENGGANTI
                        catatTransferRealTime(pAkademi, tim.nama, false);
                    }
                });

                // (BAGIAN BAWAH DARI BLOK TIM AI DI DALAM OFFSEASON)
                // FIX FASE 15: pakai tim.roster.length, bukan hardcoded /5,
                // supaya tetap akurat kalau suatu saat roster AI bisa >5
                // pemain (misal sistem trial/cadangan Fase 17).
                if (tim.roster && tim.roster.length > 0) {
                    let totalOvrAI = 0;
                    tim.roster.forEach(p => (totalOvrAI += p.ovr));
                    tim.power = Math.floor(totalOvrAI / tim.roster.length);
                }

                // ==================================================
                // --- KODE BARU: SISTEM TRANSFER STAFF/PELATIH AI ---
                // ==================================================
                if (!tim.staff)
                    tim.staff = { pelatih: null, asisten: null, analis: null };

                // 1. Bayar Gaji & Penuaan/Pensiun Staff AI
                let roleStaffAI = ["pelatih", "asisten", "analis"];
                roleStaffAI.forEach(role => {
                    let s = tim.staff[role];
                    if (s) {
                        if (!s.umur) s.umur = 35; // Umur default
                        if (tahunBerganti) s.umur += 1;

                        if (s.umur >= 50) {
                            tim.staff[role] = null; // Pensiun kalau udah 50 tahun
                        } else {
                            tim.kas -= s.gaji || 5000000; // Bayar gaji staff
                        }
                    }
                });

                // Bayar biaya sewa GH berdasarkan level GH tim AI
                const sewaGH_AI_Tabel = { 1: 25000000, 2: 75000000, 3: 150000000 };
                let lvlGhAI = tim.levelGH || 1;
                tim.kas -= (sewaGH_AI_Tabel[lvlGhAI] || 25000000);

                // 2. Logika AI Membajak Pelatih dari Bursa
                // AI akan nyari pelatih kalau:
                // - Kursi pelatih kosong (karena pensiun/dipecat)
                // - ATAU tim lagi kaya raya (kas > 50 Miliar) tapi pelatihnya ampas (buff < 3) -> Niat Upgrade
                let butuhPelatih = false;
                if (!tim.staff.pelatih) {
                    butuhPelatih = true;
                } else if (
                    tim.kas > 50000000 &&
                    tim.staff.pelatih.buffPower < 3 &&
                    Math.random() > 0.6
                ) {
                    butuhPelatih = true;
                }

                if (butuhPelatih) {
                    // Filter pelatih di bursa yang bisa dibeli AI (AI disisain uang kas biar gak bangkrut)
                    let kandidatPelatih = bursaStaff.filter(
                        s => s.role === "Pelatih" && tim.kas >= s.harga * 1.5
                    );

                    if (kandidatPelatih.length > 0) {
                        // AI nyari yang paling jago (Buff tertinggi duluan)
                        kandidatPelatih.sort(
                            (a, b) =>
                                b.buffPower - a.buffPower || b.harga - a.harga
                        );
                        let incaran = kandidatPelatih[0];

                        // Kalau niatnya upgrade, pastiin incaran wajib lebih bagus dari pelatih saat ini
                        let lanjutBeli = true;
                        if (
                            tim.staff.pelatih &&
                            incaran.buffPower <= tim.staff.pelatih.buffPower
                        ) {
                            lanjutBeli = false;
                        }

                        if (lanjutBeli) {
                            // Eksekusi Pembayaran AI
                            tim.kas -= incaran.harga;

                            // Kalau AI udah punya pelatih sebelumnya, tendang balik ke bursa (Dipecat)
                            if (tim.staff.pelatih) {
                                let pelatihLama = tim.staff.pelatih;
                                // FIX: pelatih hasil generate awal tim AI (script.js) atau
                                // investor baru (patches_financial.js) cuma dikasih `gaji`,
                                // gak ada `harga`/`ekspektasiGaji`/`kepribadian`. Kalau field ini
                                // kosong pas dilempar balik ke bursa, kartunya nampilin "Rp NaN Jt".
                                if (!pelatihLama.harga) pelatihLama.harga = (pelatihLama.gaji || 8000000) * 1.2;
                                if (!pelatihLama.gaji) pelatihLama.gaji = Math.floor(pelatihLama.harga / 1.2);
                                if (!pelatihLama.ekspektasiGaji) pelatihLama.ekspektasiGaji = pelatihLama.gaji;
                                if (!pelatihLama.kepribadian) {
                                    let sifatStaff = ["Ambisius", "Santai", "Muda", "Veteran"];
                                    pelatihLama.kepribadian = sifatStaff[Math.floor(Math.random() * sifatStaff.length)];
                                }
                                if (!pelatihLama.negara) pelatihLama.negara = "🌐 Global";
                                bursaStaff.push(pelatihLama);
                            }

                            // Masukkan pelatih baru ke tim AI
                            tim.staff.pelatih = incaran;

                            // Hapus target incaran dari bursa staff global
                            let idxBursa = bursaStaff.findIndex(
                                x => x.nama === incaran.nama
                            );
                            if (idxBursa !== -1) bursaStaff.splice(idxBursa, 1);

                            // Munculin Berita kalau transfernya heboh (Pelatih Tier A/S)
                            if (incaran.buffPower >= 3) {
                                tambahBerita(
                                    `🚨 Mega Transfer Pelatih: Demi gelar juara, <span>${tim.nama}</span> resmi membajak <b>Coach ${incaran.nama}</b> untuk musim depan.`
                                );
                            }
                        }
                    }
                }
                // ==================================================

                // --- SAFETY NET (Subsidi Silang) ---
                // Biar AI ampas gak beneran mati dan ngerusak bursa transfer
                if (tim.kas < 300000000) {
                    tim.kas = 300000000; // Kas minimal AI ditahan di 300 Juta
                }
            });
        });
        // === END SISTEM TRANSFER AI ===

        // --- UPDATE DURASI SPONSOR (3 SLOT) ---
        let sponsorCabutList = [];
        let st = window.sponsorTim;
        
        const cekSlot = (slotObj, namaSlot) => {
            if (slotObj) {
                slotObj.sisaDurasi -= 1;
                if (slotObj.sisaDurasi <= 0) {
                    sponsorCabutList.push(`${slotObj.nama} (${namaSlot})`);
                    return null; // Balikin null buat ngosongin slot karena kontrak abis
                }
            }
            return slotObj; // Balikin utuh kalau durasi masih ada
        };

        st.utama = cekSlot(st.utama, "Utama");
        st.minor1 = cekSlot(st.minor1, "Minor 1");
        st.minor2 = cekSlot(st.minor2, "Minor 2");

        let infoSponsorCabut = sponsorCabutList.length > 0 ? sponsorCabutList.join(", ") : "";


        // 3. BIKIN LAPORAN AKHIR MUSIM
        let pesanAkhirMusim = `Tagihan Gaji Pemain: <b>-Rp ${(totalGaji / 1000000).toFixed(1)} Jt</b><br>`;
        pesanAkhirMusim += `Perawatan Fasilitas GH: <b>-Rp ${(biayaSewaGH / 1000000).toFixed(1)} Jt</b><br>`;
        if (pemainKeluar.length > 0)
            pesanAkhirMusim += `<br><span style="color:#E8720C; font-weight:bold;">⚠️ PEMAIN OUT (KONTRAK HABIS):</span><br>${pemainKeluar.join(", ")}`;
        if (pemainPensiun.length > 0)
            pesanAkhirMusim += `<br><span style="color:#E5484D; font-weight:bold;">🪦 PEMAIN PENSIUN (USIA 34):</span><br>${pemainPensiun.join(", ")}`;
        if (staffPensiun.length > 0)
            pesanAkhirMusim += `<br><span style="color:#E5484D; font-weight:bold;">🪦 STAFF PENSIUN (USIA 50):</span><br>${staffPensiun.join(", ")}`;

        if (infoSponsorCabut !== "")
            pesanAkhirMusim += `<br><span style="color:#0891B2; font-weight:bold;">KONTRAK SPONSOR HABIS:</span><br>${infoSponsorCabut} resmi mengakhiri kerja sama. Cari sponsor baru di menu Keuangan!`;

        if (
            pemainKeluar.length === 0 &&
            pemainPensiun.length === 0 &&
            staffPensiun.length === 0 &&
            infoSponsorCabut === ""
        )
            pesanAkhirMusim += `<br><span style="color:#00B37E;">✅ Semua pemain, staff, & sponsor aman.</span>`;

        setTimeout(() => {
            bukaModal("LAPORAN AKHIR MUSIM 📊", pesanAkhirMusim, "#5B3DF5");
        }, 500);

        bankBerita = [
            {
                tanggal: "Off-Season",
                teks: "Proses akhir musim selesai. Transfer window sudah ditutup — roster dikunci untuk evaluasi & persiapan musim baru."
            }
        ];
        renderBerita();
        // <--- RESET TRANSFER & UPDATE HARGA MASSAL --->
        // Gabungin semua pemain di game (Roster kita, Bursa Transfer, Roster Tim AI)
        let semuaPemainUpdate = [...rosterKita, ...pemainTransfer];
        let regionAll = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
        regionAll.forEach(reg =>
            reg.forEach(t => {
                if (t.roster) semuaPemainUpdate.push(...t.roster);
            })
        );

        semuaPemainUpdate.forEach(p => {
            // 👇 1. Reset stempel transfer (Dieksekusi SETIAP ganti musim)
            delete p.sudahTransfer;

            // 👇 2. Update harga karena umur (Hanya dieksekusi saat ganti tahun/tahunBerganti)
            if (tahunBerganti && p.ovr && p.umur) {
                p.harga = hitungHargaPasar(p);
                p.gaji = Math.floor(p.harga * 0.15);
            }
        });

        // --- EVALUASI JARANG DIMAINKAN (buat retirement chance / faktor Umur harga) ---
        // Jalan TIAP akhir musim (bukan cuma tahunBerganti), sesuai definisi "per musim"
        // yang disepakati. Pakai timObj.totalPertandinganMusimIni & p.mainMusimIni yang
        // dinaikin otomatis di hitungPerformaMatch() -- satu-satunya titik universal
        // yang dilewati SEMUA match di semua liga.
        // Cakupan tim disamain sama cariTimAsliDiDatabase() (semua liga, bukan cuma
        // 4 region MPL) supaya pemain MDL/LEN/MAL/region baru juga ke-evaluasi & ke-reset.
        let semuaDbEval = [
            daftarTim, daftarTimPH, daftarTimMY, daftarTimSG,
            daftarTimMDL_Afiliasi_ID, daftarTimMDL_Independen_ID,
            daftarTimMDL_Afiliasi_PH, daftarTimMDL_Independen_PH,
            daftarTimMAL_Affiliated_MY, daftarTimMAL_Challenger_MY,
            daftarTimLEN
        ];
        [
            "daftarTimKH", "daftarTimMM", "daftarTimMENA", "daftarTimTR",
            "daftarTimEECA", "daftarTimEA", "daftarTimAM", "daftarTimIN", "daftarTimWEU"
        ].forEach(namaDb => {
            if (typeof window[namaDb] !== "undefined") semuaDbEval.push(window[namaDb]);
        });
        let semuaTimEval = [].concat(...semuaDbEval);

        // Tim player sendiri: rosternya disinkron ke rosterKita, bukan tim.roster asli
        // di database -- override roster-nya sebelum dievaluasi (kalau memang ketemu).
        let timPlayerObjEval = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;
        if (timPlayerObjEval) timPlayerObjEval.roster = rosterKita;

        semuaTimEval.forEach(t => {
            if (!t || !Array.isArray(t.roster)) return;
            let totalMatchMusimIni = t.totalPertandinganMusimIni || 0;

            t.roster.forEach(p => {
                if ((p.umur || 0) >= 26 && totalMatchMusimIni > 0) {
                    let mainKe = p.mainMusimIni || 0;
                    let jarangMusimIni = (mainKe / totalMatchMusimIni) < 0.5;

                    p._siklusMusimHitung = (p._siklusMusimHitung || 0) + 1;
                    if (jarangMusimIni) p._siklusJarangCount = (p._siklusJarangCount || 0) + 1;

                    p.jarangDimainkanBonus = (p._siklusJarangCount || 0) * 5;

                    // Reset siklus tiap 2 musim (sesuai kesepakatan)
                    if (p._siklusMusimHitung >= 2) {
                        p._siklusMusimHitung = 0;
                        p._siklusJarangCount = 0;
                    }

                    // Refresh harga karena chance pensiun bisa berubah walau bukan tahunBerganti
                    if (p.ovr) {
                        p.harga = hitungHargaPasar(p);
                        p.gaji = Math.floor(p.harga * 0.15);
                    }
                }
                // Reset counter match buat musim berikutnya
                p.mainMusimIni = 0;
            });
            t.totalPertandinganMusimIni = 0;
        });

        musimKe++;
        mingguKe = 1;
        // [MERCH V3] Reset jatah batch Reguler tiap season baru
        if (typeof window.resetJatahBatchRegulerV3 === "function") window.resetJatahBatchRegulerV3();
        sponsorDiambil = false;
        transferBuka = true;
        window._rosterLockMidMPL = false; // reset mid-season roster lock flag tiap musim baru
        window._mplSeasonReset = false;    // reset indeksHari anchor flag tiap musim baru

        // === FASE 9: tracking musim player di liga tier-2 (MDL/MAL) ===
        // Dipakai untuk syarat "minimal 1 musim di tier-2" sebelum bisa
        // mengajukan akuisisi slot MPL. Reset ke 0 kalau player sudah
        // pindah liga (misal baru naik ke MPL via akuisisi/merger).
        if (window._ligaPlayerMusimLalu !== ligaPlayer) {
            window.musimDiLigaSaatIniPlayer = 0;
        } else if (ligaPlayer === "MDL" || ligaPlayer === "MAL") {
            window.musimDiLigaSaatIniPlayer = (window.musimDiLigaSaatIniPlayer || 0) + 1;
        }
        window._ligaPlayerMusimLalu = ligaPlayer;

        // === OVERHAUL KALENDER: transisi musim berdasarkan tabel tanggal
        // pasti, bukan lompat ke tanggal perkiraan + cari Jumat terdekat.
        // _tahunMusimSaatIni di-track supaya ambilTabelTanggalMusimSaatIni()
        // selalu menghasilkan tabel yang tepat untuk musim yang sedang berjalan.
        if (typeof window._tahunMusimSaatIni === "undefined") window._tahunMusimSaatIni = 2026;

        if (musimKe % 2 !== 0) {
            // Musim ganjil (S1) baru dimulai -> ini adalah awal tahun baru
            // (M-Series dari musim genap sebelumnya sudah selesai di Jan)
            // Tahun kalender maju +1 dari tahun musim genap sebelumnya.
            // Contoh: S2 2026 selesai (M-Series Jan 2027) -> S1 2027.
            window._tahunMusimSaatIni = kalenderGame.getFullYear();
            // kalenderGame saat ini harusnya di sekitar akhir Jan / Feb
            // (habis M-Series 23 Jan), jadi tahunnya sudah benar (2027, dst)
        } else {
            // Musim genap (S2) baru dimulai -> tahun kalender sama dengan S1
            // yang barusan selesai (MSC selesai 1 Ags, S2 mulai 10 Ags -- 1 tahun)
            // Tidak perlu ubah _tahunMusimSaatIni (masih tahun yang sama)
        }

        // kalenderGame sekarang di-set ke PRAMUSIM musim baru
        // Kalau S1 baru: pramusim = 1 Jan tahun _tahunMusimSaatIni
        // Kalau S2 baru: kalender sudah ada di sekitar 1 Ags (habis MSC),
        //   biarkan natural (PRAMUSIM S2 tidak ada, langsung MDL mulai 10 Ags
        //   -- sistem akan skip PRAMUSIM S2 otomatis karena tanggalnya sudah
        //   lewat pramusimMulai, langsung trigger mdlMulai)

        let tabelBaru = (typeof ambilTabelTanggalMusimSaatIni === "function")
            ? ambilTabelTanggalMusimSaatIni() : null;

        if (tabelBaru && musimKe % 2 !== 0) {
            // S1 baru: reset ke 1 Jan
            kalenderGame = new Date(tabelBaru.pramusimMulai);
        }
        // S2 baru: kalenderGame dibiarkan di posisi saat ini (habis MSC sekitar 1-2 Ags)
        // karena sudah dekat dengan MDL S2 mulai (10 Ags)

        // --- FIX: RESET KLASEMEN SEMUA REGION ---
        let semuaRegionReset = [
            daftarTim,
            daftarTimPH,
            daftarTimMY,
            daftarTimSG
        ];
        semuaRegionReset.forEach(region => {
            region.forEach(tim => {
                tim.matchW = 0;
                tim.matchL = 0;
                tim.gameW = 0;
                tim.gameL = 0;
                tim.poin = 0;
                tim.netGame = 0;
                tim.streak = 0; // Reset win/lose streak juga
            });
        });

        statusGame = "PRAMUSIM";
        hariPramusim = 0; // tidak lagi dipakai sbg counter -- PRAMUSIM sekarang berbasis tanggal pasti
        // [FIX] Sama kayak MID_SEASON/JEDA_TRANSFER -- tiap bursa dibuka isi
        // pasar dengan 10 pemain + 10 staff baru, gantiin sistem lama yang
        // cuma sekali setahun pas OFFSEASON.
        if (typeof generatePemainDanStaffBaru === "function") generatePemainDanStaffBaru(10, 5);
        let sisaHariPramusimAwal = (typeof selisihHari === "function" && tabelBaru)
            ? Math.max(0, selisihHari(kalenderGame, tabelBaru.mdlMulai)) : 14;
        btn.innerText = "Hari Berikutnya";
        pData = {};
        window.pData = pData; // [FIX] sync ulang biar window.pData gak basi setelah reassignment
        mscData = {};
        mSeriesData = {};
        window.m7State = null;
        window.wildCardM7Data = null;
        window.swissM7Data = null;
        window.knockoutM7Data = null;
        window.pDataPH = null;
        window.pDataMY = null;
        window.pDataSG = null;
        playoffFase = 0;
        mscFase = 0;
        mSeriesFase = 0;

        bankJadwalMaster = [];
        jadwalMatch = [];
        jadwalTimPlayer = [];

        updateDashboard();
        window.renderSponsorUI();
    } // Penutup block OFFSEASON
}; // Penutup mutlak dari fungsi klikTombolUtama

// Variabel global baru buat Karir CEO
let namaManajer = "CEO";
let reputasiManajer = 0; // Poin reputasi buat mancing tawaran tim lain nanti

// 1. Fungsi Buka Modal Pilih Tim (GLOBAL)
// ==========================================
// FASE 4 — ALUR 2 LANGKAH: PILIH LIGA -> PILIH TIM
// ==========================================

// LANGKAH 1: Tampilkan pilihan liga (LEN / MDL-MAL / MPL)
window.bukaPilihTim = function () {
    let containerLiga = getEl("listLigaPilihan");
    let htmlBuilder = "";

    DAFTAR_LIGA_PILIHAN.forEach(liga => {
        htmlBuilder += `
            <div class="pt-card pt-card-liga" onclick="pilihLigaUntukMulai('${liga.kode}')">
                <div class="pt-card-left">
                    <div>
                        <div class="pt-nama">${liga.nama}</div>
                        <div class="pt-power">${liga.deskripsi}</div>
                    </div>
                </div>
                <button class="pt-btn" onclick="event.stopPropagation();pilihLigaUntukMulai('${liga.kode}')">Pilih Liga</button>
            </div>
        `;
    });

    if (containerLiga) containerLiga.innerHTML = htmlBuilder;

    // Pastikan tampilan reset ke langkah 1
    if (getEl("listLigaPilihan")) getEl("listLigaPilihan").classList.remove("sembunyi");
    if (getEl("listTimPilihan")) getEl("listTimPilihan").classList.add("sembunyi");
    if (getEl("btnKembaliPilihLiga")) getEl("btnKembaliPilihLiga").classList.add("sembunyi");
    if (getEl("pilihTimSectionLabel")) getEl("pilihTimSectionLabel").innerText = "Pilih Liga";

    getEl("modalPilihTim").classList.remove("sembunyi");
};

// LANGKAH 2: Setelah liga dipilih, tampilkan daftar tim di liga tersebut (per region)
window.pilihLigaUntukMulai = function (kodeLiga) {
    ligaTerpilihSementara = kodeLiga; // simpan sementara, dipakai pas tim akhirnya dipilih
    let containerTim = getEl("listTimPilihan");
    let timLiga = ambilTimUntukLiga(kodeLiga);

    // Kelompokkan per region biar rapi
    let perRegion = {};
    timLiga.forEach(t => {
        if (!perRegion[t._region]) perRegion[t._region] = [];
        perRegion[t._region].push(t);
    });

    let namaRegionLengkap = {
        ID: "Indonesia", PH: "Filipina", MY: "Malaysia", SG: "Singapura",
        KH: "Kamboja", MM: "Myanmar", MENA: "Timur Tengah & Afrika",
        TR: "Turkiye", EECA: "Eropa Timur & Asia Tengah", EA: "Asia Timur",
        AM: "Amerika", IN: "India", WEU: "Eropa Barat"
    };
    let htmlBuilder = "";

    Object.keys(perRegion).forEach(regionKode => {
        let bendera = perRegion[regionKode][0]._bendera;
        htmlBuilder += `<div class="pt-region">${bendera} ${namaRegionLengkap[regionKode] || regionKode}</div>`;

        perRegion[regionKode].forEach(tim => {
            let labelSlot = tim.tipeSlot === "Afiliasi"
                ? `<span class="pt-tag-afiliasi">Afiliasi ${tim.indukMPL}</span>`
                : tim.tipeSlot === "Challenger"
                    ? `<span class="pt-tag-independen">Challenger</span>`
                    : tim.tipeSlot === "Independen"
                        ? `<span class="pt-tag-independen">Independen</span>`
                        : "";
            htmlBuilder += `
                <div class="pt-card" onclick="pilihTimDanMulai('${tim.nama}')">
                    <div class="pt-card-left">
                        <span class="pt-flag">${tim._bendera}</span>
                        <div>
                            <div class="pt-nama">${tim.nama} ${labelSlot}</div>
                            <div class="pt-power">Power ${tim.power}</div>
                        </div>
                    </div>
                    <button class="pt-btn" onclick="event.stopPropagation();pilihTimDanMulai('${tim.nama}')">Pilih</button>
                </div>
            `;
        });
    });

    containerTim.innerHTML = htmlBuilder;

    // Tampilkan langkah 2, sembunyikan langkah 1
    if (getEl("listLigaPilihan")) getEl("listLigaPilihan").classList.add("sembunyi");
    containerTim.classList.remove("sembunyi");
    if (getEl("btnKembaliPilihLiga")) getEl("btnKembaliPilihLiga").classList.remove("sembunyi");
    if (getEl("pilihTimSectionLabel")) {
        let namaLiga = DAFTAR_LIGA_PILIHAN.find(l => l.kode === kodeLiga)?.nama || kodeLiga;
        getEl("pilihTimSectionLabel").innerText = "Pilih Klub — " + namaLiga;
    }
};

// Tombol "Kembali" dari daftar tim ke daftar liga
window.kembaliKePilihLiga = function () {
    window.bukaPilihTim();
};

// ==========================================
// FASE 8 — UI WRAPPER: MODAL HUTANG BANK
// ==========================================

window.bukaModalHutangBank = function () {
    let cek = bolehAjukanHutang();
    let kontenBawah = getEl("hutangBankKonten");

    if (!cek.boleh) {
        kontenBawah.innerHTML = `
            <div class="hb-info-box hb-info-tolak">
                ${cek.alasan}
            </div>
        `;
        getEl("hutangBankFormWrap").classList.add("sembunyi");
        getEl("hutangBankBtnTutupSaja").classList.remove("sembunyi");
    } else {
        let limit = hitungLimitPinjaman();
        kontenBawah.innerHTML = `
            <div class="hb-info-box">
                Status keuangan: <b>${cek.status}</b><br>
                Limit pinjaman kamu saat ini: <b>Rp ${limit.toLocaleString("id-ID")}</b>
            </div>
        `;
        getEl("hutangBankFormWrap").classList.remove("sembunyi");
        getEl("hutangBankBtnTutupSaja").classList.add("sembunyi");
        getEl("inputNominalPinjaman").value = "";
        getEl("inputNominalPinjaman").max = limit;
        getEl("hutangBankPreview").innerHTML = "";
        window._tenorTerpilihSementara = 6;
        document.querySelectorAll(".hb-tenor-btn").forEach(b => b.classList.remove("aktif"));
        let btn6 = document.querySelector('.hb-tenor-btn[data-tenor="6"]');
        if (btn6) btn6.classList.add("aktif");
    }

    getEl("modalHutangBank").classList.remove("sembunyi");
};

window.tutupModalHutangBank = function () {
    getEl("modalHutangBank").classList.add("sembunyi");
};

window.pilihTenorPinjaman = function (tenorBulan) {
    window._tenorTerpilihSementara = tenorBulan;
    document.querySelectorAll(".hb-tenor-btn").forEach(b => b.classList.remove("aktif"));
    let btnAktif = document.querySelector(`.hb-tenor-btn[data-tenor="${tenorBulan}"]`);
    if (btnAktif) btnAktif.classList.add("aktif");
    window.updatePreviewPinjaman();
};

window.updatePreviewPinjaman = function () {
    let nominal = parseInt(getEl("inputNominalPinjaman").value) || 0;
    let tenor = window._tenorTerpilihSementara || 6;
    let preview = getEl("hutangBankPreview");

    if (nominal <= 0) {
        preview.innerHTML = "";
        return;
    }

    let sim = simulasikanPinjaman(nominal, tenor);
    if (!sim) {
        preview.innerHTML = "";
        return;
    }

    preview.innerHTML = `
        <div class="hb-preview-row"><span>Bunga per musim</span><b>${(sim.bungaPerMusim * 100).toFixed(0)}%</b></div>
        <div class="hb-preview-row"><span>Total bunga</span><b>Rp ${sim.totalBunga.toLocaleString("id-ID")}</b></div>
        <div class="hb-preview-row"><span>Total bayar</span><b>Rp ${sim.totalBayar.toLocaleString("id-ID")}</b></div>
        <div class="hb-preview-row hb-preview-highlight"><span>Cicilan / musim</span><b>Rp ${sim.cicilanPerMusim.toLocaleString("id-ID")}</b></div>
        <div class="hb-preview-row"><span>Jumlah musim</span><b>${sim.jumlahMusim} musim</b></div>
    `;
};

window.konfirmasiAjukanPinjaman = function () {
    let nominal = parseInt(getEl("inputNominalPinjaman").value) || 0;
    let tenor = window._tenorTerpilihSementara || 6;

    let hasil = ajukanPinjamanBank(nominal, tenor);
    if (!hasil.sukses) {
        alert(hasil.pesan);
        return;
    }

    window.tutupModalHutangBank();
    if (typeof updateDashboard === "function") updateDashboard();
    if (getEl("dashKas")) getEl("dashKas").innerText = `Rp ${kasTim.toLocaleString("id-ID")}`;

    bukaModal(
        "Pinjaman Disetujui 🏦",
        `Bank menyetujui pinjaman <b>Rp ${nominal.toLocaleString("id-ID")}</b> dengan tenor ${TABEL_TENOR_HUTANG[tenor].label}.<br><br>Cicilan: <b>Rp ${hasil.data.cicilanPerMusim.toLocaleString("id-ID")}/musim</b> selama ${hasil.data.musimTersisa} musim. Pastikan kas cukup tiap akhir musim, atau bunga akan membengkak!`,
        "#00B37E"
    );
};

// ==========================================
// FASE 9 — UI: LAYAR AKUISISI & MERGER MPL
// ==========================================

const LABEL_STATUS_KEUANGAN_AM = {
    SEHAT: { teks: "SEHAT", warna: "#00B37E" },
    PERINGATAN: { teks: "PERINGATAN", warna: "#5B3DF5" },
    KRISIS: { teks: "KRISIS", warna: "#E5484D" },
    KOLAPS: { teks: "KOLAPS", warna: "#888" },
    KOSONG_FRANCHISE: { teks: "SLOT KOSONG", warna: "#888" }
};

window.renderLayarAkuisisiMerger = function () {
    let elig = (typeof statusEligibilitasJalurMPL === "function") ? statusEligibilitasJalurMPL() : null;
    let kotakElig = getEl("amStatusEligibilitas");
    let kontenList = getEl("amDaftarTarget");

    if (!elig) {
        kotakElig.innerHTML = `<div class="am-elig-row am-elig-tolak">Sistem akuisisi/merger belum siap dimuat.</div>`;
        kontenList.innerHTML = "";
        return;
    }

    kotakElig.innerHTML = `
        <div class="am-elig-row ${elig.layakAkuisisi ? "am-elig-ok" : "am-elig-tolak"}">
            🏦 Akuisisi Slot: ${elig.layakAkuisisi ? "Memenuhi syarat" : (elig.alasanAkuisisi || elig.alasanUmum || "Belum memenuhi syarat")}
        </div>
        <div class="am-elig-row ${elig.layakMerger ? "am-elig-ok" : "am-elig-tolak"}">
            🤝 Merger Sukarela: ${elig.layakMerger ? "Memenuhi syarat" : (elig.alasanMerger || elig.alasanUmum || "Belum memenuhi syarat")}
        </div>
    `;

    if (!elig.layakAkuisisi && !elig.layakMerger && !elig.layakKlaimSlotKosong) {
        kontenList.innerHTML = `<div class="am-empty-msg">Penuhi syarat di atas dulu untuk bisa melihat daftar target tim MPL.</div>`;
        return;
    }

    let daftarTarget = (typeof ambilTargetMPLFranchise === "function") ? ambilTargetMPLFranchise() : [];
    if (daftarTarget.length === 0) {
        kontenList.innerHTML = `<div class="am-empty-msg">Tidak ada tim MPL yang bisa ditampilkan saat ini.</div>`;
        return;
    }

    let html = "";
    daftarTarget.forEach(tim => {
        let statusInfo = LABEL_STATUS_KEUANGAN_AM[tim.statusKeuangan] || LABEL_STATUS_KEUANGAN_AM.SEHAT;
        let bisaDiakuisisi = (tim.statusKeuangan === "PERINGATAN" || tim.statusKeuangan === "KRISIS");
        let isKosong = tim.statusKeuangan === "KOSONG_FRANCHISE";
        let harga = (typeof hitungHargaSlot === "function") ? hitungHargaSlot(tim) : 0;

        let bagianBawah;
        if (isKosong) {
            // [FIX] Slot kolaps -- sebelumnya nampilin pesan "masih SEHAT,
            // tidak terbuka" yang salah & gak ada aksi apapun. Sekarang
            // dikasih jalur klaim dedicated (biaya kecil, bukan akuisisi).
            bagianBawah = `
                <div class="am-card-bottom">
                    <div class="am-card-harga">Biaya Klaim: <b>Rp ${BIAYA_KLAIM_SLOT_KOSONG.toLocaleString("id-ID")}</b></div>
                    <div class="am-card-actions">
                        ${elig.layakKlaimSlotKosong ? `<button class="am-btn am-btn-akuisisi" onclick="bukaKonfirmasiKlaimSlot('${tim.nama}')">Klaim Slot</button>` : `<span style="font-size:11px;color:#888;">${elig.alasanKlaimSlotKosong || "Belum memenuhi syarat"}</span>`}
                    </div>
                </div>`;
        } else if (bisaDiakuisisi) {
            bagianBawah = `
                <div class="am-card-bottom">
                    <div class="am-card-harga">Harga Slot: <b>Rp ${harga.toLocaleString("id-ID")}</b></div>
                    <div class="am-card-actions">
                        ${elig.layakAkuisisi ? `<button class="am-btn am-btn-akuisisi" onclick="bukaKonfirmasiAkuisisi('${tim.nama}')">Akuisisi</button>` : ""}
                        ${elig.layakMerger ? `<button class="am-btn am-btn-merger" onclick="bukaKonfirmasiMerger('${tim.nama}')">Merger</button>` : ""}
                    </div>
                </div>`;
        } else {
            bagianBawah = `<div class="am-card-bottom am-card-bottom-disabled">Tim ini masih SEHAT secara finansial, tidak terbuka untuk tawaran apapun.</div>`;
        }

        html += `
            <div class="am-card">
                <div class="am-card-top">
                    <span class="am-card-flag">${tim._bendera}</span>
                    <div class="am-card-info">
                        <div class="am-card-nama">${tim.nama}</div>
                        <div class="am-card-power">Power ${tim.power}</div>
                    </div>
                    <span class="am-status-badge" style="color:${statusInfo.warna};border-color:${statusInfo.warna};">${statusInfo.teks}</span>
                </div>
                ${bagianBawah}
            </div>
        `;
    });

    kontenList.innerHTML = html;
};

window.bukaKonfirmasiAkuisisi = function (namaTimTarget) {
    let timTarget = cariTimAsliDiDatabase(namaTimTarget);
    if (!timTarget) return;
    let harga = hitungHargaSlot(timTarget);

    getEl("amModalTitle").innerText = "Konfirmasi Akuisisi Slot";
    getEl("amModalTitle").style.color = "#00B37E";
    getEl("amModalKonten").innerHTML = `
        Kamu akan mengakuisisi slot MPL milik <b>${timTarget.nama}</b> seharga <b>Rp ${harga.toLocaleString("id-ID")}</b>.<br><br>
        Kas kamu saat ini: <b>Rp ${kasTim.toLocaleString("id-ID")}</b><br>
        Sisa kas setelah akuisisi: <b>Rp ${Math.max(0, kasTim - harga).toLocaleString("id-ID")}</b><br><br>
        <label style="display:block;margin-bottom:6px;color:var(--text-1);font-weight:bold;">Nama Tim Setelah Akuisisi:</label>
        <input type="text" id="amInputNamaBaru" value="${timTarget.nama}" maxlength="30"
            style="width:100%;box-sizing:border-box;padding:8px;border-radius:6px;background:#F1F3F8;border:1px solid #444;color:#12151C;margin-bottom:10px;">
        <div style="font-size:11px;color:#888;margin-bottom:10px;">Kosongkan / biarkan default untuk tetap pakai nama "${timTarget.nama}".</div>
        Tim kamu akan resmi bermain di MPL ${timTarget._region} musim depan. Lanjutkan?
    `;
    getEl("amBtnKonfirmasi").onclick = function () { window.eksekusiKonfirmasiAkuisisi(namaTimTarget); };
    getEl("modalKonfirmasiAM").classList.remove("sembunyi");
};

window.eksekusiKonfirmasiAkuisisi = function (namaTimTarget) {
    let inputNama = getEl("amInputNamaBaru");
    let namaKustom = inputNama ? inputNama.value : "";
    let hasil = eksekusiAkuisisiSlot(namaTimTarget, namaKustom);
    window.tutupModalKonfirmasiAM();

    if (!hasil.sukses) {
        bukaModal("Akuisisi Gagal", hasil.pesan, "#E5484D");
        return;
    }

    if (typeof updateDashboard === "function") updateDashboard();
    bukaModal(
        "Akuisisi Berhasil! 🏆",
        `Selamat! Tim kamu kini resmi bermain sebagai <b>${hasil.namaTimBaru}</b> di MPL!<br><br>Harga yang dibayarkan: Rp ${hasil.hargaDibayar.toLocaleString("id-ID")}.`,
        "#00B37E"
    );
};

window.bukaKonfirmasiMerger = function (namaTimTarget) {
    let timTarget = cariTimAsliDiDatabase(namaTimTarget);
    if (!timTarget) return;

    getEl("amModalTitle").innerText = "Konfirmasi Proposal Merger";
    getEl("amModalTitle").style.color = "#2563EB";
    getEl("amModalKonten").innerHTML = `
        Kamu akan mengajukan proposal merger ke <b>${timTarget.nama}</b>.<br><br>
        ${timTarget.statusKeuangan === "KRISIS"
            ? "Tim ini sedang KRISIS, kemungkinan diterima cukup tinggi."
            : "Tim ini masih PERINGATAN, kemungkinan diterima sedang -- proposal bisa saja ditolak."}
        <br><br>
        ⚠️ Risiko: reputasi tim kamu akan turun 10 poin di awal jika merger berhasil (akan kembali normal seiring prestasi).<br><br>
        Lanjutkan pengajuan?
    `;
    getEl("amBtnKonfirmasi").onclick = function () { window.eksekusiKonfirmasiMerger(namaTimTarget); };
    getEl("modalKonfirmasiAM").classList.remove("sembunyi");
};

window.eksekusiKonfirmasiMerger = function (namaTimTarget) {
    let hasil = eksekusiMergerSukarela(namaTimTarget);
    window.tutupModalKonfirmasiAM();

    if (!hasil.sukses) {
        bukaModal(hasil.ditolakSementara ? "Proposal Ditolak" : "Merger Gagal", hasil.pesan, "#E5484D");
        return;
    }

    if (typeof updateDashboard === "function") updateDashboard();
    bukaModal(
        "Merger Berhasil! 🤝",
        `Selamat! Tim kamu resmi merger dan kini tampil di MPL sebagai <b>${hasil.namaTimBaru}</b>!<br><br>Reputasi tim saat ini: ${hasil.reputasiBaru}.`,
        "#2563EB"
    );
};

// FASE 13 — Render Klasemen MAL MY (2 Conference Terpisah)
window.renderKlasemenMALMY = function () {
    if (typeof daftarTimMAL_Affiliated_MY === "undefined") return;

    function buatBadanKlasemen(daftarTim, containerEl, highlightTop4, highlightBottom1) {
        let sorted = [...daftarTim].sort((a,b)=>(b.poin||0)-(a.poin||0)||(b.netGame||0)-(a.netGame||0));
        let html = "";
        sorted.forEach((tim, i) => {
            let isTimKita = tim.nama === timPlayer;
            let isTop4 = highlightTop4 && i < 4;
            let isBottom = highlightBottom1 && i === sorted.length - 1;
            let borderColor = isTimKita ? "#5B3DF5" : isTop4 ? "#2563EB" : isBottom ? "#E5484D" : "transparent";
            let bg = i % 2 === 0 ? "#F7F9FC" : "#F1F3F8";
            let namaCss = isTimKita ? "color:#5B3DF5;font-weight:bold;" : "";
            let netSign = (tim.netGame||0) > 0 ? "+" : "";
            html += `<tr style="background:${bg};border-left:3px solid ${borderColor}">
                <td style="font-size:13px;font-weight:bold;">${i+1}</td>
                <td style="text-align:left;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <img src="${tim.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(tim.nama)}&background=333&color=fff'">
                        <span style="${namaCss}font-size:13px;">${tim.nama}</span>
                        ${isTop4 ? '<span style="font-size:9px;color:#2563EB;font-weight:700;border:1px solid #2563EB;border-radius:3px;padding:1px 4px;">PLAYOFF</span>' : ''}
                        ${isBottom ? '<span class="mdl-tag-degradasi">!</span>' : ''}
                    </div>
                </td>
                <td style="color:#E5484D;font-weight:bold;">${tim.poin||0}</td>
                <td>${tim.matchW||0} - ${tim.matchL||0}</td>
                <td style="color:#E5484D;font-weight:bold;">${netSign}${tim.netGame||0}</td>
                <td>${tim.gameW||0} - ${tim.gameL||0}</td>
            </tr>`;
        });
        if (containerEl) containerEl.innerHTML = html;
    }

    buatBadanKlasemen(daftarTimMAL_Affiliated_MY, getEl("badanKlasemenAffiliatedMY"), true, false);
    buatBadanKlasemen(daftarTimMAL_Challenger_MY, getEl("badanKlasemenChallengerMY"), true, true);

    let teksMusim = getEl("teksMusimMALMY");
    if (teksMusim) teksMusim.innerText = musimKe || 1;
};

window.tutupModalKonfirmasiAM = function () {
    getEl("modalKonfirmasiAM").classList.add("sembunyi");
};

window.bukaKonfirmasiKlaimSlot = function (namaTimTarget) {
    let timTarget = cariTimAsliDiDatabase(namaTimTarget);
    if (!timTarget) return;

    getEl("amModalTitle").innerText = "Konfirmasi Klaim Slot Kosong";
    getEl("amModalTitle").style.color = "#00B37E";
    getEl("amModalKonten").innerHTML = `
        Kamu akan mengklaim slot MPL kosong bekas <b>${timTarget.nama}</b> seharga <b>Rp ${BIAYA_KLAIM_SLOT_KOSONG.toLocaleString("id-ID")}</b> (biaya administrasi).<br><br>
        Kas kamu saat ini: <b>Rp ${kasTim.toLocaleString("id-ID")}</b><br>
        Sisa kas setelah klaim: <b>Rp ${Math.max(0, kasTim - BIAYA_KLAIM_SLOT_KOSONG).toLocaleString("id-ID")}</b><br><br>
        Slot ini kosong total -- roster & staff kamu akan langsung dipindah ke sini. Tim kamu akan resmi bermain di MPL ${timTarget._region || timTarget.region} musim depan. Lanjutkan?
    `;
    getEl("amBtnKonfirmasi").onclick = function () { window.eksekusiKonfirmasiKlaimSlot(namaTimTarget); };
    getEl("modalKonfirmasiAM").classList.remove("sembunyi");
};

window.eksekusiKonfirmasiKlaimSlot = function (namaTimTarget) {
    let hasil = eksekusiKlaimSlotKosong(namaTimTarget);
    window.tutupModalKonfirmasiAM();

    if (!hasil.sukses) {
        bukaModal("Klaim Gagal", hasil.pesan, "#E5484D");
        return;
    }

    if (typeof updateDashboard === "function") updateDashboard();
    bukaModal(
        "Slot Berhasil Diklaim! 🏳️",
        `Selamat! Tim kamu kini resmi bermain sebagai <b>${hasil.namaTimBaru}</b> di MPL!<br><br>Biaya yang dibayarkan: Rp ${hasil.biayaDibayar.toLocaleString("id-ID")}.`,
        "#00B37E"
    );
};

// ==========================================
// FASE 14 — UI: BENTUK AFILIASI BARU
// ==========================================

window.renderLayarKlaimAfiliasi = function () {
    let kotakElig = getEl("klaimStatusEligibilitas");
    let kontenList = getEl("klaimDaftarSlot");

    let timPlayerObj = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;

    if (!timPlayerObj || timPlayerObj.liga !== "MPL" || timPlayerObj.region === "SG") {
        kotakElig.innerHTML = `<div class="am-elig-row am-elig-tolak">Fitur ini hanya untuk tim MPL franchise (ID/PH/MY). Tim kamu saat ini belum/tidak memenuhi kriteria ini.</div>`;
        kontenList.innerHTML = "";
        return;
    }

    let cekElig = (typeof timMPLBolehKlaimAfiliasi === "function") ? timMPLBolehKlaimAfiliasi(timPlayerObj) : { boleh: false, alasan: "Sistem belum siap." };

    kotakElig.innerHTML = `
        <div class="am-elig-row ${cekElig.boleh ? "am-elig-ok" : "am-elig-tolak"}">
            🤝 Bentuk Afiliasi Baru: ${cekElig.boleh ? "Memenuhi syarat!" : cekElig.alasan}
        </div>
        <div class="am-elig-row" style="font-size:11px;color:var(--text-4);">
            Musim di MPL: ${timPlayerObj.musimDiMPL || 0} | Kas: Rp ${(timPlayerObj.kas||0).toLocaleString("id-ID")} | Reputasi: ${timPlayerObj.reputasi||0}
        </div>
    `;

    if (!cekElig.boleh) {
        kontenList.innerHTML = `<div class="am-empty-msg">Penuhi syarat di atas dulu untuk bisa melihat daftar tim tier-2 yang tersedia diklaim.</div>`;
        return;
    }

    let slotTersedia = (typeof cariSlotTier2TersediaUntukKlaim === "function")
        ? cariSlotTier2TersediaUntukKlaim(timPlayerObj.region) : [];

    if (slotTersedia.length === 0) {
        kontenList.innerHTML = `<div class="am-empty-msg">Tidak ada tim tier-2 yang tersedia untuk diklaim sebagai afiliasi di region ${timPlayerObj.region} saat ini.</div>`;
        return;
    }

    let html = "";
    slotTersedia.forEach(tim => {
        html += `
            <div class="am-card">
                <div class="am-card-top">
                    <div class="am-card-info">
                        <div class="am-card-nama">${tim.nama}</div>
                        <div class="am-card-power">Power ${tim.power} | ${tim.tipeSlot}</div>
                    </div>
                </div>
                <div class="am-card-bottom">
                    <div class="am-card-harga">Reputasi: <b>${tim.reputasi||0}</b></div>
                    <div class="am-card-actions">
                        <button class="am-btn am-btn-merger" onclick="bukaKonfirmasiKlaimAfiliasi('${tim.nama}')">Klaim sbg Afiliasi</button>
                    </div>
                </div>
            </div>
        `;
    });

    kontenList.innerHTML = html;
};

window.bukaKonfirmasiKlaimAfiliasi = function (namaTimTier2) {
    getEl("klaimModalKonten").innerHTML = `
        Kamu akan menjadikan <b>${namaTimTier2}</b> sebagai tim afiliasi resmi.<br><br>
        Setelah diklaim:<br>
        - Tim tersebut akan dikelola sebagai bagian dari organisasimu (tanpa CEO sendiri)<br>
        - Kas mereka akan dialokasikan dari kas timmu sesuai keahlian CEO<br>
        - Mereka akan kebal dari degradasi selama jadi afiliasimu<br><br>
        Lanjutkan?
    `;
    getEl("klaimBtnKonfirmasi").onclick = function () { window.eksekusiKonfirmasiKlaimAfiliasi(namaTimTier2); };
    getEl("modalKonfirmasiKlaim").classList.remove("sembunyi");
};

window.eksekusiKonfirmasiKlaimAfiliasi = function (namaTimTier2) {
    let hasil = eksekusiKlaimSlotAfiliasi(timPlayer, namaTimTier2);
    window.tutupModalKonfirmasiKlaim();

    if (!hasil.sukses) {
        bukaModal("Klaim Gagal", hasil.pesan, "#E5484D");
        return;
    }

    if (typeof updateDashboard === "function") updateDashboard();
    bukaModal(
        "Afiliasi Terbentuk! 🤝",
        `Selamat! <b>${hasil.timAfiliasiBaru}</b> sekarang resmi menjadi tim afiliasi <b>${hasil.timMPL}</b>!`,
        "#00B37E"
    );
    window.renderLayarKlaimAfiliasi();
};

window.tutupModalKonfirmasiKlaim = function () {
    getEl("modalKonfirmasiKlaim").classList.add("sembunyi");
};

// ==========================================
// FASE 17 — UI: TRIAL PLAYER
// ==========================================

const LABEL_TREND_TRIAL = {
    MENINGKAT_PESAT: { teks: "📈 Meningkat Pesat", warna: "#00B37E" },
    MENINGKAT: { teks: "📈 Meningkat", warna: "#00B37E" },
    STABIL: { teks: "➡️ Stabil", warna: "#5C6472" },
    MENURUN: { teks: "📉 Menurun", warna: "#E8720C" },
    MENURUN_PESAT: { teks: "📉 Menurun Pesat", warna: "#E5484D" }
};

window.mulaiTrialDariUI = function (pemainNama, tipeSumber, indexAsli, namaTimLain, hargaBuyout) {
    // [DEBUG] Dibungkus try/catch -- laporan bug "tombol TRIAL gak ada
    // reaksi sama sekali" biasanya berarti ada exception yang kelempar
    // sebelum sempat nyampe ke bukaModal(). Tanpa try/catch, error itu cuma
    // nongol diam-diam di console browser (gak kelihatan di HP). Sekarang
    // errornya ditangkap & ditampilin ke user + di-log ke console biar bisa
    // didiagnosis dari pesan errornya.
    try {
        let hasil = mulaiTrial(pemainNama, tipeSumber, namaTimLain);
        if (!hasil.sukses) {
            bukaModal("Tidak Bisa Trial", hasil.pesan, "#E5484D");
            return;
        }

        // Reveal stats di modal profil jika masih terbuka
        let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
        if (trialObj) {
            let p = trialObj.pemain;
            let elOvr = getEl("profilOvr");
            let elPotensi = getEl("profilPotensi");
            let elMekanik = getEl("profilMekanik");
            let elMakro = getEl("profilMakro");
            let elMental = getEl("profilMental");
            let elSpesialis = getEl("profilSpesialis");
            if (elOvr) elOvr.innerText = p.ovr;
            if (elPotensi) elPotensi.innerText = p.potensi;
            if (elMekanik) elMekanik.innerText = p.mekanik;
            if (elMakro) elMakro.innerText = p.makro;
            if (elMental) elMental.innerText = p.mental;
            if (elSpesialis) elSpesialis.innerText = p.spesialis;
            if (typeof syncProfilAttrBars === "function") syncProfilAttrBars();
        }

        if (typeof updateDashboard === "function") updateDashboard();
        let keteranganAsal = tipeSumber === "TIMLAIN"
            ? `dari <b>${namaTimLain}</b>. Catatan: jika hasil trial memuaskan dan kamu putuskan kontrak, proses Buyout tetap diperlukan.`
            : `(Free Agent/Akademi).`;
        bukaModal(
            "Trial Dimulai! 🔍",
            `<b>${pemainNama}</b> sekarang dalam masa trial ${keteranganAsal}<br><br>Buka menu <b>Trial</b> di Bursa Transfer untuk menjalankan scrim dan melihat hasilnya. Atribut pemain sudah terungkap!`,
            "#2563EB"
        );
    } catch (err) {
        console.error("[mulaiTrialDariUI] Error:", err);
        bukaModal("Error Trial", `Ada error teknis pas mulai trial: <br><br><code>${err.message}</code><br><br>Screenshot pesan ini dan laporkan ke developer.`, "#E5484D");
    }
};

window.eksekusiJalankanScrimTrial = function () {
    let hasil = jalankanScrimTrial();
    if (!hasil.sukses) {
        bukaModal("Tidak Bisa Dijalankan", hasil.pesan, "#E5484D");
        return;
    }
    window.renderLayarTrialPlayer();
    bukaModal(
        "Scrim Selesai! ⚡",
        `Hasil trial untuk ${hasil.jumlahKandidat} kandidat sudah keluar. Cek laporan masing-masing kandidat di bawah.`,
        "#5B3DF5"
    );
};

window.renderLayarTrialPlayer = function () {
    initTrialState();
    getEl("trialSlotTerpakai").innerText = window.trialAktif.length;
    getEl("trialSlotMax").innerText = MAKS_SLOT_TRIAL;

    let kontenList = getEl("trialDaftarKandidat");
    if (window.trialAktif.length === 0) {
        kontenList.innerHTML = `<div class="am-empty-msg">Belum ada pemain yang sedang trial. Klik tombol "TRIAL" di Bursa Transfer untuk memulai.</div>`;
        return;
    }

    let html = "";
    window.trialAktif.forEach(trialObj => {
        let ringkasan = ambilRingkasanTrial(trialObj.pemain.nama);
        let trendInfo = LABEL_TREND_TRIAL[ringkasan.trend] || LABEL_TREND_TRIAL.STABIL;
        let statusLabel = trialObj.statusTrial === "SELESAI"
            ? `<span style="color:#5B3DF5;font-weight:700;font-size:10px;">SIAP DIPUTUSKAN</span>`
            : `<span style="color:#5C6472;font-size:10px;">Berjalan (${trialObj.hasilScrim.length}/${JUMLAH_SCRIM_PER_TRIAL} scrim)</span>`;

        html += `
            <div class="am-card trial-card">
                <div class="am-card-top">
                    <div class="am-card-info">
                        <div class="am-card-nama">${trialObj.pemain.nama} <span class="mdl-tag-independen">${trialObj.role}</span></div>
                        <div class="am-card-power">OVR ${trialObj.pemain.ovr || "?"} | Sumber: ${trialObj.sumber === "FREE_AGENT" ? "Free Agent" : trialObj.sumber === "TIMLAIN" ? `Tim Lain (${trialObj.namaTimAsal || "?"})` : trialObj.sumber === "OPEN_RECRUITMENT" ? "Open Recruitment" : "Akademi"}</div>
                    </div>
                </div>
                <div class="trial-card-mid">
                    ${trialObj.hasilScrim.length > 0
                        ? `Rata-rata: <b style="color:#C9971F;">${ringkasan.rataRata}</b> | Tren: <b style="color:${trendInfo.warna};">${trendInfo.teks}</b>`
                        : `<span style="color:#888;font-size:11px;">Belum ada scrim dijalankan.</span>`}
                </div>
                <div class="am-card-bottom">
                    <div>${statusLabel}</div>
                    <div class="am-card-actions">
                        <button class="am-btn am-btn-merger" onclick="bukaLaporanTrial('${trialObj.pemain.nama}')">Lihat Laporan</button>
                    </div>
                </div>
            </div>
        `;
    });

    kontenList.innerHTML = html;
};

window.bukaLaporanTrial = function (pemainNama) {
    let ringkasan = ambilRingkasanTrial(pemainNama);
    if (!ringkasan) return;

    let trendInfo = LABEL_TREND_TRIAL[ringkasan.trend] || LABEL_TREND_TRIAL.STABIL;

    let htmlScrim = ringkasan.hasilScrim.map(h => `
        <div class="trial-scrim-row">
            <span>Scrim ${h.pertandingan} vs ${h.lawan} (Power ${h.powerLawan})</span>
            <b style="color:${h.performa >= 70 ? '#00B37E' : h.performa >= 50 ? '#5B3DF5' : '#E5484D'}">${h.performa}</b>
        </div>
        <div class="trial-scrim-catatan">${h.catatan}</div>
    `).join("");

    getEl("trialModalKonten").innerHTML = `
        <div class="trial-modal-header">
            <b>${ringkasan.pemain.nama}</b> (${ringkasan.pemain.role}, OVR ${ringkasan.pemain.ovr})
        </div>
        ${htmlScrim || `<div class="am-empty-msg">Belum ada scrim dijalankan untuk kandidat ini.</div>`}
        ${ringkasan.hasilScrim.length > 0 ? `
        <div class="trial-summary-box">
            Rata-rata: <b style="color:#C9971F;">${ringkasan.rataRata}</b><br>
            Tren: <b style="color:${trendInfo.warna};">${trendInfo.teks}</b><br>
            <span style="font-size:11px;color:#5C6472;">${ringkasan.insight}</span>
        </div>` : ""}
    `;

    let aksiHtml = "";
    if (ringkasan.statusTrial === "SELESAI") {
        aksiHtml = `
            <button class="modal-btn btn-green" onclick="window.eksekusiKontrakTrial('${pemainNama}')">KONTRAK PERMANEN</button>
            <button class="modal-btn" style="background:#2563EB;color:#fff;" onclick="window.eksekusiPerpanjangTrial('${pemainNama}')">PERPANJANG TRIAL</button>
            <button class="modal-btn btn-modal-cancel" onclick="window.eksekusiLepasTrial('${pemainNama}')">LEPAS PEMAIN</button>
        `;
    } else {
        aksiHtml = `<button class="modal-btn btn-modal-cancel" onclick="window.eksekusiLepasTrial('${pemainNama}')">BATALKAN TRIAL</button>`;
    }
    getEl("trialModalAksi").innerHTML = aksiHtml;

    getEl("modalLaporanTrial").classList.remove("sembunyi");
};

window.tutupModalLaporanTrial = function () {
    getEl("modalLaporanTrial").classList.add("sembunyi");
};

window.eksekusiKontrakTrial = function (pemainNama) {
    let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
    if (!trialObj) {
        window.tutupModalLaporanTrial();
        bukaModal("Kontrak Gagal", "Pemain ini tidak sedang dalam trial.", "#E5484D");
        return;
    }

    // Kandidat yang masih terikat tim lain: tetap wajib BUYOUT dulu
    // (mekanisme harga & transfer existing), baru resmi jadi milik kita.
    if (trialObj.sumber === "TIMLAIN") {
        let hasil = kontrakPermanenTrial(pemainNama);
        window.tutupModalLaporanTrial();

        if (hasil.perluBuyout) {
            window._pendingBuyoutTrial = {
                pemain: hasil.pemain,
                namaTimAsal: hasil.namaTimAsal,
                hargaBuyout: hasil.hargaBuyout,
                pemainNama: pemainNama
            };
            bukaModal(
                "Buyout Diperlukan 💰",
                `${hasil.pesan}<br><br>` +
                `<b>Harga Buyout: Rp ${(hasil.hargaBuyout / 1000000).toFixed(1)} Jt</b><br><br>` +
                `<button class="modal-btn" style="background:#E8720C;color:#fff;width:100%;margin-bottom:8px;" onclick="window.eksekusiBuyoutDariTrial()">LAKUKAN BUYOUT</button>` +
                `<button class="modal-btn btn-modal-cancel" style="width:100%;" onclick="tutupModal()">BATAL</button>`,
                "#E8720C"
            );
            return;
        }

        if (!hasil.sukses) {
            bukaModal("Kontrak Gagal", hasil.pesan, "#E5484D");
            return;
        }

        if (typeof updateDashboard === "function") updateDashboard();
        window.renderLayarTrialPlayer();
        bukaModal("Kontrak Resmi! 🎉", `<b>${hasil.pemain.nama}</b> resmi bergabung dengan ${timPlayer}!`, "#00B37E");
        return;
    }

    // Kandidat FREE_AGENT / AKADEMI: masuk tahap NEGOSIASI KONTRAK dulu.
    window.tutupModalLaporanTrial();
    window.bukaModalNegoTrial(pemainNama);
};

// ==========================================
// MODAL NEGOSIASI KONTRAK TRIAL
// (dijalankan setelah trial SELESAI dan klik KONTRAK PERMANEN, untuk
// kandidat yang bukan berasal dari tim lain / TIMLAIN)
// ==========================================
window.bukaModalNegoTrial = function (pemainNama) {
    let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
    if (!trialObj) return;
    let p = trialObj.pemain;
    let rondeKe   = (trialObj.rondeNego || 0) + 1;
    let maksRonde = 3;
    let gajiDefault = p.gaji || 5000000;

    let html = `
        <div style="text-align:left;">
            <p><b>${p.nama}</b> (${p.role}, OVR ${p.ovr}) siap dikontrak.
            Ajukan tawaran gaji &amp; durasi untuk mulai negosiasi.</p>
            <p style="font-size:11px;color:#5C6472;">Ronde negosiasi: ${rondeKe} / ${maksRonde}</p>
            <label style="display:block;margin-top:10px;font-size:12px;color:#5C6472;">Tawaran Gaji (per musim)</label>
            <input type="number" id="inputTawarGajiTrial" value="${gajiDefault}" step="500000"
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #444;background:#F1F3F8;color:#12151C;margin-top:4px;box-sizing:border-box;">
            <label style="display:block;margin-top:10px;font-size:12px;color:#5C6472;">Durasi Kontrak (musim)</label>
            <select id="inputDurasiTrial"
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #444;background:#F1F3F8;color:#12151C;margin-top:4px;box-sizing:border-box;">
                <option value="1">1 Musim</option>
                <option value="2" selected>2 Musim</option>
                <option value="3">3 Musim</option>
                <option value="4">4 Musim</option>
            </select>
            <div style="display:flex;gap:8px;margin-top:14px;">
                <button class="modal-btn btn-modal-cancel" style="flex:1;" onclick="window.batalNegoTrial('${p.nama}')">BATAL</button>
                <button class="modal-btn btn-green" style="flex:1;" onclick="window.ajukanTawaranTrial('${p.nama}')">AJUKAN TAWARAN</button>
            </div>
        </div>
    `;
    bukaModal(`Negosiasi Kontrak — ${p.nama}`, html, "#2563EB");
};

window.ajukanTawaranTrial = function (pemainNama) {
    let inputGaji   = document.getElementById("inputTawarGajiTrial");
    let inputDurasi = document.getElementById("inputDurasiTrial");
    let tawaranGaji   = inputGaji ? parseInt(inputGaji.value, 10) : 5000000;
    let tawaranDurasi = inputDurasi ? parseInt(inputDurasi.value, 10) : 2;

    if (!tawaranGaji || tawaranGaji <= 0 || isNaN(tawaranGaji)) {
        bukaModal("Input Tidak Valid", "Masukkan angka gaji yang valid.", "#E5484D");
        return;
    }

    let hasil = evaluasiNegoTrial(pemainNama, tawaranGaji, tawaranDurasi);

    if (hasil.status === "DEAL") {
        let finalHasil = kontrakPermanenTrial(pemainNama, tawaranGaji, tawaranDurasi);
        if (!finalHasil.sukses) {
            bukaModal("Kontrak Gagal", finalHasil.pesan, "#E5484D");
            return;
        }
        if (typeof updateDashboard === "function") updateDashboard();
        window.renderLayarTrialPlayer();
        bukaModal(
            "Kontrak Resmi! 🎉",
            `${hasil.pesan}<br><br><b>${finalHasil.pemain.nama}</b> resmi bergabung dengan ${timPlayer}!<br>` +
            `Gaji: Rp ${(tawaranGaji / 1000000).toFixed(1)} Jt · ${tawaranDurasi} Musim`,
            "#00B37E"
        );
        return;
    }

    if (hasil.status === "COUNTER") {
        window._pendingCounterTrial = { pemainNama, counterGaji: hasil.counterGaji, counterDurasi: hasil.counterDurasi };
        let html = `
            <div style="text-align:left;">
                <p><i style="color:#5C6472;">"${hasil.pesan}"</i></p>
                <p>Counter offer dari kandidat (ronde ${hasil.rondeKe}/${hasil.maksRonde}):</p>
                <p>Gaji: <b style="color:#C9971F;">Rp ${(hasil.counterGaji / 1000000).toFixed(1)} Jt</b><br>
                Durasi: <b style="color:#C9971F;">${hasil.counterDurasi} Musim</b></p>
                <div style="display:flex;gap:8px;margin-top:14px;">
                    <button class="modal-btn" style="flex:1;background:#5C6472;color:#12151C;" onclick="window.bukaModalNegoTrial('${pemainNama}')">TAWAR ULANG</button>
                    <button class="modal-btn btn-green" style="flex:1;" onclick="window.terimaCounterTrial('${pemainNama}')">TERIMA COUNTER</button>
                </div>
                <button class="modal-btn btn-modal-cancel" style="width:100%;margin-top:8px;" onclick="window.batalNegoTrial('${pemainNama}')">BATALKAN NEGOSIASI</button>
            </div>
        `;
        bukaModal("Counter Offer 🔄", html, "#E8720C");
        return;
    }

    // TOLAK
    lepasTrial(pemainNama);
    window.renderLayarTrialPlayer();
    bukaModal("Negosiasi Gagal ❌", hasil.pesan, "#E5484D");
};

window.terimaCounterTrial = function (pemainNama) {
    let data = window._pendingCounterTrial;
    if (!data || data.pemainNama !== pemainNama) return;

    let finalHasil = kontrakPermanenTrial(pemainNama, data.counterGaji, data.counterDurasi);
    window._pendingCounterTrial = null;

    if (!finalHasil.sukses) {
        bukaModal("Kontrak Gagal", finalHasil.pesan, "#E5484D");
        return;
    }
    if (typeof updateDashboard === "function") updateDashboard();
    window.renderLayarTrialPlayer();
    bukaModal(
        "Kontrak Resmi! 🎉",
        `<b>${finalHasil.pemain.nama}</b> resmi bergabung dengan ${timPlayer}!<br>` +
        `Gaji: Rp ${(data.counterGaji / 1000000).toFixed(1)} Jt · ${data.counterDurasi} Musim`,
        "#00B37E"
    );
};

window.batalNegoTrial = function (pemainNama) {
    lepasTrial(pemainNama);
    window._pendingCounterTrial = null;
    window.renderLayarTrialPlayer();
    tutupModal();
};

window.eksekusiBuyoutDariTrial = function () {
    let data = window._pendingBuyoutTrial;
    if (!data) return;
    tutupModal();
    // [NEW] Kirim flag "dariTrial=true" biar demand gaji-nya pake formula
    // ekspektasi trial (tren + sifat), bukan gaji lama flat.
    prosesBeliPemainLain(data.pemain.nama, data.namaTimAsal, data.hargaBuyout, true);
    lepasTrial(data.pemainNama);
    window._pendingBuyoutTrial = null;
    if (typeof updateDashboard === "function") updateDashboard();
    window.renderLayarTrialPlayer();
};

window.eksekusiPerpanjangTrial = function (pemainNama) {
    perpanjangTrial(pemainNama);
    window.tutupModalLaporanTrial();
    window.renderLayarTrialPlayer();
    bukaModal("Trial Diperpanjang ⏳", `Masa trial <b>${pemainNama}</b> dilanjutkan. Jalankan scrim lagi untuk data lebih lengkap.`, "#2563EB");
};

window.eksekusiLepasTrial = function (pemainNama) {
    lepasTrial(pemainNama);
    window.tutupModalLaporanTrial();
    window.renderLayarTrialPlayer();
    if (typeof updateDashboard === "function") updateDashboard();
};

// ==========================================
// FASE 18 — UI: OPEN RECRUITMENT
// ==========================================

window.bukaModalOpenRecruitment = function () {
    let cek = (typeof bolehBukaOpenRecruitment === "function") ? bolehBukaOpenRecruitment() : { boleh: false, alasan: "Sistem belum siap." };

    if (!cek.boleh) {
        getEl("openRecKonten").innerHTML = `<div class="am-elig-row am-elig-tolak">${cek.alasan}</div>`;
        getEl("openRecAksi").innerHTML = "";
    } else {
        getEl("openRecKonten").innerHTML = `
            <p style="font-size:13px;color:var(--text-1);line-height:1.6;">
                Buka pendaftaran terbuka untuk menjaring pemain amatir baru. <b>Gratis</b>, tapi hasilnya acak —
                bisa dapat pemain biasa, bisa juga nemu <b style="color:#7C3AED;">hidden gem</b> dengan potensi tinggi!
            </p>
            <p style="font-size:11px;color:var(--text-4);">Sisa kesempatan musim ini: <b>${cek.sisaKesempatan}</b>/${typeof MAKS_OPEN_RECRUITMENT_PER_MUSIM !== "undefined" ? MAKS_OPEN_RECRUITMENT_PER_MUSIM : 2}</p>
        `;
        getEl("openRecAksi").innerHTML = `<button class="modal-btn btn-green btn-block" onclick="window.eksekusiBukaOpenRecruitment()">BUKA PENDAFTARAN</button>`;
    }

    getEl("modalOpenRecruitment").classList.remove("sembunyi");
};

window.eksekusiBukaOpenRecruitment = function () {
    let hasil = bukaOpenRecruitment();
    if (!hasil.sukses) {
        getEl("openRecKonten").innerHTML = `<div class="am-elig-row am-elig-tolak">${hasil.pesan}</div>`;
        getEl("openRecAksi").innerHTML = "";
        return;
    }

    let htmlKandidat = hasil.kandidat.map(k => `
        <div class="trial-scrim-row" style="align-items:center;">
            <span>${k.nama} (${k.role}) - OVR ${k.ovr}</span>
            <b style="color:${k.potensi >= k.ovr + 35 ? '#7C3AED' : '#5C6472'};">Potensi ${k.potensi}</b>
        </div>
    `).join("");

    getEl("openRecKonten").innerHTML = `
        <p style="font-size:12px;color:var(--text-1);margin-bottom:8px;">${hasil.kandidat.length} pemain amatir baru mendaftar!</p>
        ${htmlKandidat}
        <p style="font-size:11px;color:var(--text-4);margin-top:10px;">Mereka sudah masuk Bursa Transfer — cek dan trial mereka di sana.</p>
    `;
    getEl("openRecAksi").innerHTML = "";

    if (typeof updateDashboard === "function") updateDashboard();
};

window.tutupModalOpenRecruitment = function () {
    getEl("modalOpenRecruitment").classList.add("sembunyi");
};

// ==========================================
// FASE 11 — RENDER KLASEMEN MDL ID & LEN
// ==========================================

window.renderKlasemenMDLID = function () {
    if (typeof daftarTimMDL_ID === "undefined") return;
    let container = getEl("badanKlasemenMDLID");
    if (!container) return;

    let sorted = typeof ambilKlasemenMDL_ID === "function"
        ? ambilKlasemenMDL_ID()
        : [...daftarTimMDL_ID].sort((a, b) => (b.poin||0) - (a.poin||0) || (b.netGame||0) - (a.netGame||0));

    let bottom2Nama = [];
    if (typeof ambilBottom2Independen === "function") {
        bottom2Nama = ambilBottom2Independen().map(t => t.nama);
    }

    let html = "";
    sorted.forEach((tim, i) => {
        let isTimKita = tim.nama === timPlayer;
        let isAfiliasi = tim.tipeSlot === "Afiliasi";
        let isDegradasi = bottom2Nama.includes(tim.nama);
        let labelSlot = isAfiliasi
            ? `<span class="mdl-tag-afiliasi">A</span>`
            : isDegradasi
                ? `<span class="mdl-tag-degradasi">!</span>`
                : `<span class="mdl-tag-independen">I</span>`;

        let borderColor = isTimKita ? "#5B3DF5" : isAfiliasi ? "rgba(59,130,246,0.4)" : isDegradasi ? "#E5484D" : "transparent";
        let bg = i % 2 === 0 ? "#F7F9FC" : "#F1F3F8";
        let namaCss = isTimKita ? "color:#5B3DF5;font-weight:bold;" : "";
        let netSign = (tim.netGame || 0) > 0 ? "+" : "";

        html += `<tr style="background:${bg};border-left:3px solid ${borderColor}">
            <td style="font-size:13px;font-weight:bold;">${i+1}</td>
            <td style="text-align:left;cursor:pointer;" onclick="bukaInfoTim('${tim.nama}')">
                <div style="display:flex;align-items:center;gap:6px;">
                    <img src="${tim.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${tim.nama}&background=333&color=fff'">
                    <span style="${namaCss}font-size:13px;">${tim.nama}</span>
                    ${labelSlot}
                </div>
            </td>
            <td style="color:#E5484D;font-weight:bold;">${tim.poin||0}</td>
            <td>${tim.matchW||0} - ${tim.matchL||0}</td>
            <td style="color:#E5484D;font-weight:bold;">${netSign}${tim.netGame||0}</td>
            <td>${tim.gameW||0} - ${tim.gameL||0}</td>
        </tr>`;
    });

    container.innerHTML = html;
    let teksMusim = getEl("teksMusimMDLID");
    if (teksMusim) teksMusim.innerText = musimKe || 1;

    // FIX: render bracket Playoff Degradasi MDL vs LEN (sebelumnya cuma
    // placeholder teks statis, tidak pernah benar2 menampilkan hasil)
    window.renderBracketDegradasiMDLLEN();
};

// FIX (ditemukan saat diskusi dgn user): bracket Playoff Degradasi
// MDL vs LEN sebelumnya tidak pernah dirender secara visual -- cuma
// placeholder teks statis di index.html. Sekarang pakai renderBoxBracket()
// yang sama dengan bracket MPL, supaya konsisten & benar2 menampilkan
// hasil pertandingan (Bottom 1/2 MDL vs Juara 2/1 LEN).
window.renderBracketDegradasiMDLLEN = function () {
    // FIX (round 2): bracket ini dipakai di 2 screen berbeda (Klasemen MDL ID
    // & Klasemen LEN), tapi sebelumnya cuma ada 1 container di HTML (di
    // screen MDL ID doang) -- makanya nggak pernah nongol pas buka screen LEN.
    // Sekarang render ke SEMUA container yg ada (skip yg nggak ditemukan).
    let containerIds = ["playoffDegradasiMDLLEN", "playoffDegradasiMDLLEN_viewLEN"];
    let containers = containerIds.map(id => getEl(id)).filter(c => c);
    if (containers.length === 0) return;

    let bracketData = window._bracketPlayoffDegradasiMDLLENTerakhir;
    if (!bracketData || bracketData.length === 0) {
        // [FIX] Sebelumnya cuma placeholder statis sampai match beneran
        // dieksekusi (10 Jun, bareng Play-In MPL). Sekarang begitu masuk
        // H-1 (1 hari sebelum playoffMulai) & klasemen final MDL/LEN
        // udah kekunci, tampilin PREVIEW pasangan tim (belum ada skor).
        let tabelPreview = (typeof ambilTabelTanggalMusimSaatIni === "function")
            ? ambilTabelTanggalMusimSaatIni() : null;
        let sudahMasukH1 = false;
        if (tabelPreview && tabelPreview.playoffMulai && typeof kalenderGame !== "undefined") {
            let h1 = new Date(tabelPreview.playoffMulai);
            h1.setDate(h1.getDate() - 1);
            sudahMasukH1 = kalenderGame >= h1;
        }

        let previewData = (sudahMasukH1 && typeof ambilPreviewPlayoffDegradasiMDLLEN === "function")
            ? ambilPreviewPlayoffDegradasiMDLLEN() : [];

        if (previewData.length > 0) {
            let labelPertandinganPreview = ["Bottom 1 MDL vs Juara 2 LEN", "Bottom 2 MDL vs Juara 1 LEN"];
            let htmlPreview = `<div class="bracket-container">`;
            previewData.forEach((m, i) => {
                let matchObjPreview = { home: m.home, away: m.away, sudahMain: false, skorHome: 0, skorAway: 0 };
                htmlPreview += `
                    <div class="bracket-round">
                        <div class="round-title">${labelPertandinganPreview[i] || `Pertandingan ${i + 1}`} (BO5)</div>
                        ${typeof renderBoxBracket === "function" ? renderBoxBracket(matchObjPreview, i + 1) : ""}
                        <div style="text-align:center;font-size:11px;color:#E8720C;margin-top:4px;">⏳ Belum dimainkan</div>
                    </div>
                `;
            });
            htmlPreview += `</div>`;
            containers.forEach(c => c.innerHTML = htmlPreview);
            return;
        }

        let htmlKosong = `
            <p style="color:var(--text-4);font-size:12px;text-align:center;padding:16px;">
                Playoff Degradasi belum pernah berjalan musim ini. Hasilnya akan muncul otomatis setelah regular season MDL ID & LEN selesai.
            </p>
        `;
        containers.forEach(c => c.innerHTML = htmlKosong);
        return;
    }

    let labelPertandingan = ["Bottom 1 MDL vs Juara 2 LEN", "Bottom 2 MDL vs Juara 1 LEN"];

    let html = `<div class="bracket-container">`;
    bracketData.forEach((m, i) => {
        let matchObjUtkBracket = {
            home: m.home,
            away: m.away,
            sudahMain: m.sudahMain,
            skorHome: m.skorHome,
            skorAway: m.skorAway
        };
        html += `
            <div class="bracket-round">
                <div class="round-title">${labelPertandingan[i] || `Pertandingan ${i + 1}`} (BO5)</div>
                ${typeof renderBoxBracket === "function" ? renderBoxBracket(matchObjUtkBracket, i + 1) : ""}
                <div style="text-align:center;font-size:11px;color:${m.menang === m.home.nama ? '#00B37E' : '#2563EB'};margin-top:4px;">
                    ${m.menang === m.home.nama
                        ? `🛡️ ${m.home.nama} bertahan di MDL`
                        : `📈 ${m.away.nama} promosi ke MDL`}
                </div>
            </div>
        `;
    });
    html += `</div>`;

    containers.forEach(c => c.innerHTML = html);
};

window.renderKlasemenLEN = function () {
    if (typeof daftarTimLEN === "undefined") return;
    let container = getEl("badanKlasemenLEN");
    if (!container) return;

    let sorted = [...daftarTimLEN].sort((a, b) =>
        (b.poin||0) - (a.poin||0) || (b.netGame||0) - (a.netGame||0));

    let html = "";
    sorted.forEach((tim, i) => {
        let isTimKita = tim.nama === timPlayer;
        let isTop2 = i < 2;
        let borderColor = isTimKita ? "#5B3DF5" : isTop2 ? "#cd7f32" : "transparent";
        let bg = i % 2 === 0 ? "#F7F9FC" : "#F1F3F8";
        let namaCss = isTimKita ? "color:#5B3DF5;font-weight:bold;" : "";
        let netSign = (tim.netGame || 0) > 0 ? "+" : "";

        html += `<tr style="background:${bg};border-left:3px solid ${borderColor}">
            <td style="font-size:13px;font-weight:bold;">${i+1}</td>
            <td style="text-align:left;cursor:pointer;" onclick="bukaInfoTim('${tim.nama}')">
                <div style="display:flex;align-items:center;gap:6px;">
                    <img src="${tim.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${tim.nama}&background=333&color=fff'">
                    <span style="${namaCss}font-size:13px;">${tim.nama}</span>
                    ${isTop2 ? '<span style="font-size:9px;color:#cd7f32;font-weight:700;border:1px solid #cd7f32;border-radius:3px;padding:1px 4px;">PLAYOFF</span>' : ''}
                </div>
            </td>
            <td style="color:#E5484D;font-weight:bold;">${tim.poin||0}</td>
            <td>${tim.matchW||0} - ${tim.matchL||0}</td>
            <td style="color:#E5484D;font-weight:bold;">${netSign}${tim.netGame||0}</td>
            <td>${tim.gameW||0} - ${tim.gameL||0}</td>
        </tr>`;
    });

    container.innerHTML = html;
    let teksMusim = getEl("teksMusimLEN");
    if (teksMusim) teksMusim.innerText = musimKe || 1;

    // FIX: sebelumnya bracket Playoff Degradasi cuma dirender pas buka
    // screen Klasemen MDL ID, nggak pas buka screen Klasemen LEN.
    window.renderBracketDegradasiMDLLEN();
};

// FASE 12 — Render Klasemen MDL PH
window.renderKlasemenMDLPH = function () {
    if (typeof daftarTimMDL_PH === "undefined") return;
    let container = getEl("badanKlasemenMDLPH");
    if (!container) return;

    let sorted = (typeof ambilKlasemenMDL_PH === "function")
        ? ambilKlasemenMDL_PH()
        : [...daftarTimMDL_PH].sort((a,b) => (b.poin||0)-(a.poin||0)||(b.netGame||0)-(a.netGame||0));

    let bottom2Nama = (typeof ambilBottom2IndependenPH === "function")
        ? ambilBottom2IndependenPH().map(t => t.nama) : [];

    let html = "";
    sorted.forEach((tim, i) => {
        let isTimKita = tim.nama === timPlayer;
        let isAfiliasi = tim.tipeSlot === "Afiliasi";
        let isDegradasi = bottom2Nama.includes(tim.nama);
        let labelSlot = isAfiliasi
            ? `<span class="mdl-tag-afiliasi">A</span>`
            : isDegradasi
                ? `<span class="mdl-tag-degradasi">!</span>`
                : `<span class="mdl-tag-independen">I</span>`;

        let borderColor = isTimKita ? "#5B3DF5" : isAfiliasi ? "rgba(59,130,246,0.4)" : isDegradasi ? "#E5484D" : "transparent";
        let bg = i % 2 === 0 ? "#F7F9FC" : "#F1F3F8";
        let namaCss = isTimKita ? "color:#5B3DF5;font-weight:bold;" : "";
        let netSign = (tim.netGame||0) > 0 ? "+" : "";

        html += `<tr style="background:${bg};border-left:3px solid ${borderColor}">
            <td style="font-size:13px;font-weight:bold;">${i+1}</td>
            <td style="text-align:left;cursor:pointer;" onclick="bukaInfoTim('${tim.nama}')">
                <div style="display:flex;align-items:center;gap:6px;">
                    <img src="${tim.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${tim.nama}&background=333&color=fff'">
                    <span style="${namaCss}font-size:13px;">${tim.nama}</span>
                    ${labelSlot}
                </div>
            </td>
            <td style="color:#E5484D;font-weight:bold;">${tim.poin||0}</td>
            <td>${tim.matchW||0} - ${tim.matchL||0}</td>
            <td style="color:#E5484D;font-weight:bold;">${netSign}${tim.netGame||0}</td>
            <td>${tim.gameW||0} - ${tim.gameL||0}</td>
        </tr>`;
    });

    container.innerHTML = html;
    let teksMusim = getEl("teksMusimMDLPH");
    if (teksMusim) teksMusim.innerText = musimKe || 1;
};

window.tutupPilihTim = function () {
    getEl("modalPilihTim").classList.add("sembunyi");
};

window.bukaTentangGame = function () {
    bukaModal(
        "TENTANG GAME",
        "<b>Moba Manager</b><br><br>Game simulasi e-sports karya anak bangsa.<br>Dikembangkan oleh: <b>Muhammad Fauzi Ridwan</b>.<br><br>Jadilah CEO, bangun dinasti juara, dan buktikan taktikmu di panggung global!",
        "#2563EB"
    );
};

// 2. Fungsi EKSEKUSI saat lu klik "PILIH TIM"
window.pilihTimDanMulai = function (namaTimTerpilih) {
    let namaCEO = getEl("inputNamaCEO").value.trim();
    if (namaCEO === "") {
        alert("Isi nama CEO!");
        return;
    }

    // Set Data Karir
    namaManajer = namaCEO;
    timPlayer = namaTimTerpilih;

    // FASE 4: cari tim di SEMUA database (MPL/MDL/MAL/LEN), tidak cuma MPL
    let timKitaDb = cariTimAsliDiDatabase(timPlayer);
    let dReal = dataReal[timPlayer];
    reputasiTim = timKitaDb && timKitaDb.reputasi ? timKitaDb.reputasi
                : (dReal && dReal.reputasi ? dReal.reputasi : 40);
    let roles = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];

    // FASE 4: tetapkan liga & region player berdasarkan liga terpilih sebelumnya
    ligaPlayer = ligaTerpilihSementara || (timKitaDb ? timKitaDb.liga : "MPL");
    regionPlayer = timKitaDb ? (timKitaDb.region || "ID") : "ID";

    // FASE 4: set kas awal RANDOM sesuai range liga yang dipilih (bukan ikut kas tim AI)
    kasTim = kasAwalRandomPerLiga(ligaPlayer);
    levelGH = (timKitaDb && timKitaDb.levelGH) ? timKitaDb.levelGH : 1;

    // FASE 4: handling khusus TIM AFILIASI — player mengambil alih slot afiliasi,
    // dapat "alokasi kas" dari induk MPL (bukan kas:0 seperti versi AI),
    // dan CEO yang sebelumnya null kini diisi oleh player sendiri.
    let timIndukAfiliasi = null;
    if (timKitaDb && timKitaDb.tipeSlot === "Afiliasi" && timKitaDb.indukMPL) {
        timIndukAfiliasi = cariTimAsliDiDatabase(timKitaDb.indukMPL);
        if (timIndukAfiliasi) {
            // Alokasi kas dari induk berdasarkan keahlian CEO induk (sesuai rumus yang disepakati)
            let keahlianInduk = timIndukAfiliasi.ceo ? timIndukAfiliasi.ceo.keahlianFinansial : 50;
            let persenAlokasi = keahlianInduk >= 85 ? 0.30
                               : keahlianInduk >= 60 ? 0.20
                               : keahlianInduk >= 35 ? 0.10
                               : 0.05;
            let kasAlokasiInduk = Math.floor((timIndukAfiliasi.kas || 0) * persenAlokasi);
            // Kas player = alokasi dari induk + kas awal random liga (sebagai modal tambahan player)
            kasTim = kasAlokasiInduk + kasTim;
        }
        // Slot CEO afiliasi otomatis "diisi" oleh player (sebelumnya null untuk AI)
        timKitaDb.ceo = { nama: namaCEO, umur: null, keahlianFinansial: null, _isPlayer: true };
        timKitaDb.statusKeuangan = "SEHAT";
    } else if (timKitaDb && timKitaDb.ceo && timKitaDb.ceo._isPlayer !== true) {
        // Tim non-afiliasi yang sebelumnya dikelola CEO AI -> sekarang diambil alih player
        timKitaDb.ceo = { nama: namaCEO, umur: null, keahlianFinansial: null, _isPlayer: true };
    }

    rosterKita = [];

    // --- FIX: GENERATE OTOMATIS JIKA DATA REAL TIDAK ADA ---
    if (dReal) {
        // Pakai data real
        for (let i = 0; i < 5; i++) {
            let pemainBaru = {
                nama: dReal.roster[i],
                role: roles[i],
                ovr: (timKitaDb.power || 75) + Math.floor(Math.random() * 5),
                umur: Math.floor(Math.random() * 8) + 18,
                sisaKontrak: 3,
                negara: ambilBenderaPemainReal(dReal.roster[i], TIM_REGION_MAP[timPlayer]),
                sifat: "Normal",
                isStarter: true
            };
            // [FIX] SEBELUMNYA harga/gaji starter tim player FLAT (harga: 50 Jt,
            // gaji: 10 Jt) buat SEMUA pemain apapun OVR-nya. Sekarang pake
            // hitungHargaPasar() yang sama dipakai di seluruh game ini.
            pemainBaru.harga = hitungHargaPasar(pemainBaru);
            pemainBaru.gaji = Math.floor(pemainBaru.harga * 0.15);
            rosterKita.push(pemainBaru);
        }
        staffKita.pelatih = {
            nama: dReal.pelatih,
            role: "Pelatih",
            umur: 35,
            gaji: 15000000,
            harga: 18000000,
            buffPower: 3,
            sisaKontrak: 2,
            kepribadian: "Veteran",
            ekspektasiGaji: 15000000
        };
        if (dReal.asisten)
            staffKita.asisten = {
                nama: dReal.asisten,
                role: "Asisten Pelatih",
                umur: 30,
                gaji: 10000000,
                harga: 12000000,
                buffPower: 1,
                sisaKontrak: 2,
                kepribadian: "Santai",
                ekspektasiGaji: 10000000
            };
    } else {
        // GENERATE OTOMATIS (Ini yang bikin tim PH/MY/SG lu nggak kosong lagi!)
        let fallbackNames = [
            "Zey",
            "Ken",
            "Ry",
            "San",
            "Boy",
            "Lex",
            "Fin",
            "Tzy",
            "Lin",
            "Ben"
        ];
        for (let i = 0; i < 5; i++) {
            let pemainBaru = {
                nama:
                    fallbackNames[i] +
                    " " +
                    (Math.floor(Math.random() * 89) + 10),
                role: roles[i],
                ovr: (timKitaDb.power || 70) + Math.floor(Math.random() * 5),
                umur: 20,
                sisaKontrak: 2,
                negara: (typeof benderaAkademiUntukRegion === "function")
                            ? benderaAkademiUntukRegion(regionPlayer)
                            : "🌐",
                sifat: "Normal",
                isStarter: true
            };
            // [FIX] Sama kayak cabang dReal di atas -- sebelumnya flat
            // (harga: 40 Jt, gaji: 8 Jt), sekarang pake hitungHargaPasar().
            pemainBaru.harga = hitungHargaPasar(pemainBaru);
            pemainBaru.gaji = Math.floor(pemainBaru.harga * 0.15);
            rosterKita.push(pemainBaru);
        }
        staffKita.pelatih = {
            nama: "Coach " + timPlayer.split(" ")[0],
            role: "Pelatih",
            umur: 35,
            gaji: 10000000,
            harga: 12000000,
            buffPower: 2,
            sisaKontrak: 2,
            kepribadian: "Ambisius",
            ekspektasiGaji: 10000000
        };
    }

    // Update UI
    if (getEl("namaTimHeader")) getEl("namaTimHeader").innerText = timPlayer;
    getEl("layarMainMenu").style.display = "none";
    getEl("modalPilihTim").style.display = "none";

    // 3. EMAIL SAMBUTAN KEREN
    inboxEmail = [];
    emailBelumDibaca = 0;
    bankBerita = [
        {
            tanggal: "Pra-Musim",
            teks: `BREAKING: <span>${namaManajer}</span> resmi ditunjuk sebagai CEO baru <span>${timPlayer}</span>!`
        }
    ];

    tambahEmail(
        "Selamat Datang, CEO!",
        "Dewan Direksi " + timPlayer,
        `Yang Terhormat Bapak/Ibu <b>${namaManajer}</b>,<br><br>Dewan Direksi sangat bangga meresmikan Anda sebagai CEO <b>${timPlayer}</b>. Skuad utama telah kami siapkan, namun Anda bebas melakukan perombakan di Bursa Transfer.<br><br>Target kami musim ini sangat jelas: <b>Dominasi panggung kompetitif!</b> Semoga sukses.`
    );

    // Mastiin history tercatat
    initRiwayatAwal();

    // [FIX] Isi pasar transfer 10 pemain + 5 staff baru begitu game dimulai
    // (dulu batch pertama baru muncul pas window transfer pertama kebuka
    // di tengah musim -- pemain harus nunggu lama padahal baru mulai).
    if (typeof generatePemainDanStaffBaru === "function") generatePemainDanStaffBaru(10, 5);

    // ✅ [FIX 1] Inisialisasi fanbase setelah tim dipilih
    // Delay agar rosterKita & timPlayer sudah ter-set sempurna
    setTimeout(() => {
        if (typeof window.hookInisialFanbase === "function") {
            let semuaTim = [...daftarTim, ...daftarTimPH, ...daftarTimMY, ...daftarTimSG];
            let timData = semuaTim.find(t => t.nama === timPlayer) || { reputasi: reputasiTim };
            window.hookInisialFanbase(timData);
        }
    }, 200);

    // Sikat! Langsung update tampilan dashboard
    updateDashboard();
};

// ==========================================
// SISTEM SAVE & LOAD GAME (LOCAL STORAGE)
// ==========================================

// ==========================================
// [NEW v1.6] MIGRASI localStorage -> IndexedDB
// Root cause quota error sebelumnya: localStorage cuma nyediain ~5-10MB,
// dan seiring karir makin panjang (13 region persisten, roster lengkap,
// dll) data save-nya bisa nembus batas itu. IndexedDB kuotanya jauh lebih
// gede (biasanya ratusan MB+) dan emang didesain buat data segini.
// ==========================================
const IDB_SAVE_DB = "mlbbManagerDB";
const IDB_SAVE_STORE = "saves";
const IDB_SAVE_KEY = "mlbbManagerSave";

function bukaDbSave() {
    return new Promise((resolve, reject) => {
        let req = indexedDB.open(IDB_SAVE_DB, 1);
        req.onupgradeneeded = function (e) {
            let db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_SAVE_STORE)) {
                db.createObjectStore(IDB_SAVE_STORE);
            }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function (e) { reject(e.target.error); };
    });
}

async function idbSetSave(value) {
    let db = await bukaDbSave();
    return new Promise((resolve, reject) => {
        let tx = db.transaction(IDB_SAVE_STORE, "readwrite");
        tx.objectStore(IDB_SAVE_STORE).put(value, IDB_SAVE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbGetSave() {
    let db = await bukaDbSave();
    return new Promise((resolve, reject) => {
        let tx = db.transaction(IDB_SAVE_STORE, "readonly");
        let req = tx.objectStore(IDB_SAVE_STORE).get(IDB_SAVE_KEY);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// Sekali jalan tiap kali mau baca save: kalau IndexedDB masih kosong TAPI
// ada save lama di localStorage (dari sebelum migrasi v1.6), pindahin
// otomatis -- biar tester/player yang udah punya progress lama gak
// kehilangan apapun pas update ke versi ini.
async function migrasiSaveDariLocalStorage() {
    try {
        let sudahAdaDiIdb = await idbGetSave();
        if (sudahAdaDiIdb) return; // IndexedDB udah punya data, gak perlu migrasi
        let saveLama = localStorage.getItem(IDB_SAVE_KEY);
        if (saveLama) {
            await idbSetSave(saveLama);
            console.log("[MIGRASI v1.6] Save lama dari localStorage berhasil dipindah ke IndexedDB.");
        }
    } catch (err) {
        console.error("[MIGRASI v1.6] Gagal migrasi save lama:", err);
        // Gagal migrasi TIDAK boleh nge-block loadGame lanjut -- biarin
        // fallback normal (localStorage) yang nanganin di loadGame sendiri.
    }
}

window.simpanGame = async function () {
    // Kumpulin SEMUA variabel penting ke dalam satu "Brankas" (Object)
    let brankasData = {
        waktu: {
            musimKe,
            mingguKe,
            indeksHari,
            hariPramusim,
            kalenderGame: kalenderGame.getTime(),
            statusGame,
            waktuJeda,
            hariJeda,
            midSeasonHari,
            edisiMSeries
        },
        manajer: { namaManajer, timPlayer, reputasiManajer, ligaPlayer, regionPlayer },
        hutangBank: window.hutangBankPlayer || { aktif: false },
        musimDiLigaSaatIniPlayer: window.musimDiLigaSaatIniPlayer || 0,
        trialAktif: window.trialAktif || [],
        trialAIPending: window._trialAIPending || [],
        hariSejakTrialAITerakhir: window._hariSejakTrialAITerakhir || 0,
        openRecruitmentTerpakai: window.openRecruitmentTerpakai || 0,
        bracketPlayoffDegradasiMDLLEN: window._bracketPlayoffDegradasiMDLLENTerakhir || null,
        tahunMusimSaatIni: window._tahunMusimSaatIni || 2026,
        musimOpenRecruitmentTerakhir: window._musimOpenRecruitmentTerakhir || 0,
                keuangan: { kasTim, levelGH, sponsorDiambil, sponsorTim: window.sponsorTim, riwayatKas },
        transfer: { transferBuka, antrianTransfer },
        // [FIX QUOTA] bankRiwayatJuara nyimpen SETIAP juara SETIAP region
        // SETIAP musim, TANPA BATAS, selama karir berjalan -- dan field
        // `tim`/`runnerUp`-nya ternyata isinya OBJEK TIM PENUH (roster,
        // kontrak, dll), padahal SEMUA pemakaian di seluruh proyek cuma
        // butuh `.nama` sama `.logo` doang (dicek manual satu-satu di
        // ui.js & global_power_ranking.js). Ini kontributor utama ukuran
        // save yang lama-lama nembus kuota localStorage. Dipangkas jadi
        // versi ringkas CUMA pas mau di-save -- variabel aslinya di
        // memori (bankRiwayatJuara) TETAP full, gak diubah sama sekali,
        // jadi nol resiko ke gameplay yang lagi jalan.
        turnamen: {
            counterMatchKita,
            bankRiwayatJuara: bankRiwayatJuara.map(entry => ({
                ...entry,
                tim: entry.tim ? { nama: entry.tim.nama, logo: entry.tim.logo } : entry.tim,
                runnerUp: entry.runnerUp ? { nama: entry.runnerUp.nama, logo: entry.runnerUp.logo } : entry.runnerUp
            })),
            playoffFase,
            mscFase,
            mSeriesFase
        },
        // [FIX] SEBELUMNYA state turnamen MSC x EWC 2026 / M7 World
        // Championship (yang gantiin sistem MSC/M-Series lama) SAMA
        // SEKALI gak ke-save -- termasuk data Grand Final tiap region
        // (pDataPH/MY/SG/9 region baru). Akibatnya: kalau save/load
        // dilakuin di TENGAH periode Wild Card/Group Stage/Knockout
        // MSC atau M7, semua progress & data kualifikasi itu ILANG
        // total begitu di-load ulang -- bikin turnamen "gak jalan"
        // (kualifikasi 0 tim) walau sebenernya udah pernah lengkap.
        // Sekarang semuanya ikut disimpan.
        turnamenMscEwcM7: {
            mscEwcState: window.mscEwcState || null,
            m7State: window.m7State || null,
            wildCardData: window.wildCardData || null,
            groupStageData: window.groupStageData || null,
            knockoutData: window.knockoutData || null,
            wildCardM7Data: window.wildCardM7Data || null,
            swissM7Data: window.swissM7Data || null,
            knockoutM7Data: window.knockoutM7Data || null,
            // Data Grand Final tiap region (dipake buat hitung kualifikasi
            // MSC/M7). "ID" pake nama bare `pData` yang udah disimpan di
            // atas (jadwal.pData), jadi gak diulang di sini.
            pDataPH: window.pDataPH || null,
            pDataMY: window.pDataMY || null,
            pDataSG: window.pDataSG || null,
            pDataRegionBaru: (function () {
                let hasil = {};
                (window.REGION_SINGLE_TIER_BARU || []).forEach(kode => {
                    hasil[kode] = window["pData" + kode] || null;
                });
                return hasil;
            })()
        },
        globalPowerRanking: {
            rankingSebelumnya: window.gprRankingSebelumnya || {},
            deductions: window.gprDeductions || [],
            reigningMSC: window.gprReigningMSC || null,
            reigningMSeries: window.gprReigningMSeries || null
        },
        email: { inboxEmail, emailBelumDibaca, bankBerita },
        timKita: { rosterKita, staffKita },
        bursa: { pemainTransfer, bursaStaff, daftarSuratStaff },
        // Simpan data tim AI biar nggak kereset
        databaseTim: {
            daftarTim, daftarTimPH, daftarTimMY, daftarTimSG,
            daftarTimMDL_Afiliasi_ID, daftarTimMDL_Independen_ID,
            daftarTimMDL_Afiliasi_PH, daftarTimMDL_Independen_PH,
            daftarTimMAL_Affiliated_MY, daftarTimMAL_Challenger_MY,
            daftarTimLEN,
            // [FIX] 9 region baru (MSC x EWC 2026 - FASE 4) SEBELUMNYA gak
            // ke-save sama sekali -- tim-tim ini balik ke data awal
            // database.js tiap kali game di-load ulang, ngilangin semua
            // perubahan (transfer, statistik, dll) yang kejadian di sesi
            // sebelumnya. Sekarang ikut disimpan, konsisten sama region lain.
            daftarTimKH, daftarTimMM, daftarTimMENA, daftarTimTR,
            daftarTimEECA, daftarTimEA, daftarTimAM, daftarTimIN, daftarTimWEU
        },
        // Simpan jadwal biar turnamen nggak error pas diload
        jadwal: {
            jadwalMatch,
            jadwalTimPlayer,
            bankJadwalMaster,
            pData,
            mscData,
            mSeriesData
        },
        // ✅ [FIX 4] Simpan data fanbase (termasuk merchandise) agar tidak hilang saat load
        fanbaseData: (typeof fanbase !== "undefined") ? JSON.parse(JSON.stringify(fanbase)) : null,
        akademiData: JSON.parse(JSON.stringify(akademiKita))
    };

    // [UPDATE v1.6] Migrasi dari localStorage ke IndexedDB -- kuota jauh
    // lebih gede, jadi QuotaExceededError seharusnya hampir gak pernah
    // kejadian lagi kecuali penyimpanan device beneran penuh total.
    try {
        await idbSetSave(JSON.stringify(brankasData));
    } catch (err) {
        if (err && (err.name === "QuotaExceededError" || (err.message && err.message.includes("Quota")))) {
            bukaModal(
                "⚠️ Gagal Simpan: Penyimpanan Penuh",
                "Penyimpanan device kamu penuh total. Coba hapus beberapa aplikasi/file lain buat kasih ruang, terus coba save lagi.",
                "#E5484D"
            );
            return;
        }
        throw err; // error lain (bukan quota) tetap dilempar ke Error Catcher biar ketauan
    }

    bukaModal(
        "GAME TERSIMPAN 💾",
        "Progress karir lu berhasil disimpan dengan aman! Lu bisa nutup browser sekarang.",
        "#00B37E"
    );
};

window.loadGame = async function () {
    // [UPDATE v1.6] Migrasi otomatis dari localStorage (kalau ada save
    // lama dari sebelum v1.6) ke IndexedDB, baru baca dari IndexedDB.
    await migrasiSaveDariLocalStorage();
    let saveDataStr = await idbGetSave();
    if (!saveDataStr) {
        alert("Belum ada data save-an bro! Klik 'Mulai Karir Baru' dulu.");
        return;
    }

    // Kalau ada, bongkar brankasnya
    let data = JSON.parse(saveDataStr);

    // BALIKIN SEMUA VARIABEL KE POSISI TERAKHIR
    musimKe = data.waktu.musimKe;
    mingguKe = data.waktu.mingguKe;
    indeksHari = data.waktu.indeksHari;
    hariPramusim = data.waktu.hariPramusim;
    kalenderGame = new Date(data.waktu.kalenderGame); // Tanggal harus diconvert balik
    statusGame = data.waktu.statusGame;
    waktuJeda = data.waktu.waktuJeda || 0;
    hariJeda = data.waktu.hariJeda || 0;
    midSeasonHari = data.waktu.midSeasonHari || 0;
    // [FIX] Save lama (sebelum fitur ini ada) gak punya field ini -- kalau
    // save-nya udah lewat minimal 1 M-Series (statusGame M7/JEDA_M7 atau
    // udah ada riwayat juara GLOBAL), anggap edisi 1 biar gak keliru
    // nampilin M0; kalau belum pernah sama sekali, mulai dari 0 (normal).
    edisiMSeries = data.waktu.edisiMSeries || 0;

    namaManajer = data.manajer.namaManajer;
    timPlayer = data.manajer.timPlayer;
    reputasiManajer = data.manajer.reputasiManajer || 0;
    ligaPlayer = data.manajer.ligaPlayer || "MPL"; // fallback utk save lama sebelum Fase 4
    regionPlayer = data.manajer.regionPlayer || "ID";
    window.hutangBankPlayer = data.hutangBank || { aktif: false }; // fallback utk save lama sebelum Fase 8
    window.musimDiLigaSaatIniPlayer = data.musimDiLigaSaatIniPlayer || 0; // fallback utk save lama sebelum Fase 9
    window.trialAktif = data.trialAktif || []; // fallback utk save lama sebelum Fase 17
    window._trialAIPending = data.trialAIPending || []; // fallback utk save lama
    window._hariSejakTrialAITerakhir = data.hariSejakTrialAITerakhir || 0;
    window.openRecruitmentTerpakai = data.openRecruitmentTerpakai || 0; // fallback utk save lama sebelum Fase 18
    window._bracketPlayoffDegradasiMDLLENTerakhir = data.bracketPlayoffDegradasiMDLLEN || null;
    window._tahunMusimSaatIni = data.tahunMusimSaatIni || 2026;
    window._musimOpenRecruitmentTerakhir = data.musimOpenRecruitmentTerakhir || 0;

    kasTim = data.keuangan.kasTim;
    levelGH = data.keuangan.levelGH;
    sponsorDiambil = data.keuangan.sponsorDiambil;
        window.sponsorTim = data.keuangan.sponsorTim || { utama: null, minor1: null, minor2: null };
    riwayatKas = data.keuangan.riwayatKas;

    transferBuka = data.transfer.transferBuka;
    antrianTransfer = data.transfer.antrianTransfer;

    counterMatchKita = data.turnamen.counterMatchKita;
    bankRiwayatJuara = data.turnamen.bankRiwayatJuara;
    playoffFase = data.turnamen.playoffFase;
    mscFase = data.turnamen.mscFase;
    mSeriesFase = data.turnamen.mSeriesFase;

    // [FIX] Restore state turnamen MSC x EWC 2026 / M7 World Championship
    // (fallback ke null/{} kalau save-nya dibuat SEBELUM fix ini ada --
    // save lama tetap kebuka normal, cuma turnamen MSC/M7-nya kalau lagi
    // di tengah jalan pas save lama itu dibuat, tetap perlu di-refresh
    // manual lewat self-heal yang udah ada di jalankanTickMSCEWC/M7).
    let dataTurnamenBaru = data.turnamenMscEwcM7 || {};
    window.mscEwcState = dataTurnamenBaru.mscEwcState || null;
    window.m7State = dataTurnamenBaru.m7State || null;
    window.wildCardData = dataTurnamenBaru.wildCardData || null;
    window.groupStageData = dataTurnamenBaru.groupStageData || null;
    window.knockoutData = dataTurnamenBaru.knockoutData || null;
    window.wildCardM7Data = dataTurnamenBaru.wildCardM7Data || null;
    window.swissM7Data = dataTurnamenBaru.swissM7Data || null;
    // [FIX] Set gak bisa selamat lewat JSON save/load (isinya HILANG TOTAL,
    // beda kasus sama Date) -- riwayat[nama] abis di-load jadi objek biasa
    // yang bakal crash ".add()/.has() is not a function" kalau dipake
    // langsung. Dibersihin di sini juga (selain guard defensif yang udah
    // ada di titik pemakaiannya di m7_engine.js), biar state-nya bersih
    // dari awal begitu game selesai di-load.
    if (window.swissM7Data && window.swissM7Data.riwayat) {
        Object.keys(window.swissM7Data.riwayat).forEach(nama => {
            if (!(window.swissM7Data.riwayat[nama] instanceof Set)) {
                window.swissM7Data.riwayat[nama] = new Set();
            }
        });
    }
    window.knockoutM7Data = dataTurnamenBaru.knockoutM7Data || null;
    window.pDataPH = dataTurnamenBaru.pDataPH || {};
    window.pDataMY = dataTurnamenBaru.pDataMY || {};
    window.pDataSG = dataTurnamenBaru.pDataSG || {};
    (window.REGION_SINGLE_TIER_BARU || []).forEach(kode => {
        let pDataRegionBaru = dataTurnamenBaru.pDataRegionBaru || {};
        window["pData" + kode] = pDataRegionBaru[kode] || {};
    });

    // [GLOBAL POWER RANKING] fallback ke default kosong utk save lama
    // (sebelum fitur ini ada).
    let gprSave = data.globalPowerRanking || {};
    window.gprRankingSebelumnya = gprSave.rankingSebelumnya || {};
    window.gprDeductions = gprSave.deductions || [];
    window.gprReigningMSC = gprSave.reigningMSC || null;
    window.gprReigningMSeries = gprSave.reigningMSeries || null;
    if (typeof window.gprHitungRanking === "function") window.gprHitungRanking(false);


    inboxEmail = data.email.inboxEmail;
    emailBelumDibaca = data.email.emailBelumDibaca;
    bankBerita = data.email.bankBerita;

    rosterKita = data.timKita.rosterKita;
    staffKita = data.timKita.staffKita;

    pemainTransfer = data.bursa.pemainTransfer;
    bursaStaff = data.bursa.bursaStaff;
    daftarSuratStaff = data.bursa.daftarSuratStaff || [];

    // Safety net: potensiTampil sudah tersimpan di dalam objek pemain (pemainTransfer & daftarTim roster)
    // Tidak perlu reset — nilai fix tersimpan langsung ikut ter-restore bersama data pemain.

    daftarTim = data.databaseTim.daftarTim;
    daftarTimPH = data.databaseTim.daftarTimPH;
    daftarTimMY = data.databaseTim.daftarTimMY;
    daftarTimSG = data.databaseTim.daftarTimSG;
    // FASE 4: restore database tier-2/tier-3 juga (fallback aman utk save lama)
    if (data.databaseTim.daftarTimMDL_Afiliasi_ID) daftarTimMDL_Afiliasi_ID = data.databaseTim.daftarTimMDL_Afiliasi_ID;
    if (data.databaseTim.daftarTimMDL_Independen_ID) daftarTimMDL_Independen_ID = data.databaseTim.daftarTimMDL_Independen_ID;
    if (data.databaseTim.daftarTimMDL_Afiliasi_PH) daftarTimMDL_Afiliasi_PH = data.databaseTim.daftarTimMDL_Afiliasi_PH;
    if (data.databaseTim.daftarTimMDL_Independen_PH) daftarTimMDL_Independen_PH = data.databaseTim.daftarTimMDL_Independen_PH;
    if (data.databaseTim.daftarTimMAL_Affiliated_MY) daftarTimMAL_Affiliated_MY = data.databaseTim.daftarTimMAL_Affiliated_MY;
    if (data.databaseTim.daftarTimMAL_Challenger_MY) daftarTimMAL_Challenger_MY = data.databaseTim.daftarTimMAL_Challenger_MY;
    if (data.databaseTim.daftarTimLEN) daftarTimLEN = data.databaseTim.daftarTimLEN;
    // [FIX] Restore 9 region baru (fallback aman ke array kosong utk save
    // lama yang dibuat sebelum fix ini ada -- biar gak korup, tim-tim
    // region itu bakal balik pake default database.js kalau save-nya emang
    // belum pernah nyimpen data ini).
    if (data.databaseTim.daftarTimKH) daftarTimKH = data.databaseTim.daftarTimKH;
    if (data.databaseTim.daftarTimMM) daftarTimMM = data.databaseTim.daftarTimMM;
    if (data.databaseTim.daftarTimMENA) daftarTimMENA = data.databaseTim.daftarTimMENA;
    if (data.databaseTim.daftarTimTR) daftarTimTR = data.databaseTim.daftarTimTR;
    if (data.databaseTim.daftarTimEECA) daftarTimEECA = data.databaseTim.daftarTimEECA;
    if (data.databaseTim.daftarTimEA) daftarTimEA = data.databaseTim.daftarTimEA;
    if (data.databaseTim.daftarTimAM) daftarTimAM = data.databaseTim.daftarTimAM;
    if (data.databaseTim.daftarTimIN) daftarTimIN = data.databaseTim.daftarTimIN;
    if (data.databaseTim.daftarTimWEU) daftarTimWEU = data.databaseTim.daftarTimWEU;
    // Sinkronkan ulang array gabungan MDL ID/PH setelah restore
    if (typeof daftarTimMDL_Afiliasi_ID !== "undefined" && typeof daftarTimMDL_Independen_ID !== "undefined") {
        daftarTimMDL_ID = [...daftarTimMDL_Afiliasi_ID, ...daftarTimMDL_Independen_ID];
    }
    if (typeof daftarTimMDL_Afiliasi_PH !== "undefined" && typeof daftarTimMDL_Independen_PH !== "undefined") {
        daftarTimMDL_PH = [...daftarTimMDL_Afiliasi_PH, ...daftarTimMDL_Independen_PH];
    }

    jadwalMatch = data.jadwal.jadwalMatch;
    jadwalTimPlayer = data.jadwal.jadwalTimPlayer;
    bankJadwalMaster = data.jadwal.bankJadwalMaster;
    pData = data.jadwal.pData;
    window.pData = pData; // [FIX] sync ulang biar window.pData gak basi setelah load save
    mscData = data.jadwal.mscData;
    mSeriesData = data.jadwal.mSeriesData;

    // ✅ [FIX 4] Restore data fanbase (termasuk merchandise)
    if (data.fanbaseData && typeof window.loadFanbase === "function") {
        window.loadFanbase(data.fanbaseData);
    } else if (typeof window.hookInisialFanbase === "function") {
        // Tidak ada data fanbase lama — inisialisasi baru dari data tim
        let semuaTim = [...daftarTim, ...daftarTimPH, ...daftarTimMY, ...daftarTimSG];
        let timData = semuaTim.find(t => t.nama === timPlayer) || { reputasi: 50 };
        setTimeout(() => window.hookInisialFanbase(timData), 300);
    }

    // Restore data akademi
    if (data.akademiData) {
        akademiKita = data.akademiData;
    } else {
        akademiKita = { aktif: levelGH >= 2, prospek: [], levelAkademi: levelGH >= 3 ? 2 : 1, totalLulusan: 0 };
    }

    // Hapus Layar Main Menu
    getEl("layarMainMenu").style.display = "none";
    if (getEl("namaTimHeader")) getEl("namaTimHeader").innerText = timPlayer;

    // Sync label tombol utama sesuai statusGame yang di-restore
    (function syncTombolSetelahLoad() {
        let btn = getEl("tombolUtama");
        if (!btn) return;
        if (statusGame === "JEDA_PLAYOFF") {
            btn.innerText = "Hari Berikutnya";
        } else if (statusGame === "JEDA_MSC") {
            btn.innerText = "Hari Berikutnya";
        } else if (statusGame === "JEDA_MSERIES") {
            btn.innerText = "Hari Berikutnya";
        } else if (statusGame === "JEDA_M7" || statusGame === "M7") {
            btn.innerText = "Hari Berikutnya";
        } else if (statusGame === "JEDA_TRANSFER") {
            btn.innerText = "Hari Berikutnya";
        } else if (statusGame === "OFFSEASON") {
            btn.innerText = "Hari Berikutnya";
        } else if (statusGame === "PRAMUSIM") {
            btn.innerText = "Hari Berikutnya";
        }
    })();

    // [FIX] Revive tanggalBergabung -- field ini disimpan sbg objek Date,
    // tapi JSON.stringify (dipake pas save) ngubah Date jadi teks ISO, dan
    // JSON.parse (dipake pas load) GAK otomatis balikin jadi Date lagi.
    // Akibatnya field ini jadi string biasa setelah load, dan kode yang
    // manggil .getTime() di atasnya (misal apakahPemainEligibleMSCM7 di
    // calendar_system_patch.js) crash "getTime is not a function". Sapu
    // bersih SEMUA region + tim milik player di sini, sekali jalan.
    (function reviveTanggalBergabungSemuaTim() {
        let semuaDaftarTim = [
            rosterKita ? [{ roster: rosterKita }] : [],
            daftarTim, daftarTimPH, daftarTimMY, daftarTimSG,
            typeof daftarTimMDL_Afiliasi_ID !== "undefined" ? daftarTimMDL_Afiliasi_ID : [],
            typeof daftarTimMDL_Independen_ID !== "undefined" ? daftarTimMDL_Independen_ID : [],
            typeof daftarTimMDL_Afiliasi_PH !== "undefined" ? daftarTimMDL_Afiliasi_PH : [],
            typeof daftarTimMDL_Independen_PH !== "undefined" ? daftarTimMDL_Independen_PH : [],
            typeof daftarTimMAL_Affiliated_MY !== "undefined" ? daftarTimMAL_Affiliated_MY : [],
            typeof daftarTimMAL_Challenger_MY !== "undefined" ? daftarTimMAL_Challenger_MY : [],
            typeof daftarTimLEN !== "undefined" ? daftarTimLEN : [],
            typeof daftarTimKH !== "undefined" ? daftarTimKH : [],
            typeof daftarTimMM !== "undefined" ? daftarTimMM : [],
            typeof daftarTimMENA !== "undefined" ? daftarTimMENA : [],
            typeof daftarTimTR !== "undefined" ? daftarTimTR : [],
            typeof daftarTimEECA !== "undefined" ? daftarTimEECA : [],
            typeof daftarTimEA !== "undefined" ? daftarTimEA : [],
            typeof daftarTimAM !== "undefined" ? daftarTimAM : [],
            typeof daftarTimIN !== "undefined" ? daftarTimIN : [],
            typeof daftarTimWEU !== "undefined" ? daftarTimWEU : []
        ];
        semuaDaftarTim.forEach(daftarTimArr => {
            (daftarTimArr || []).forEach(tim => {
                if (!tim || !Array.isArray(tim.roster)) return;
                tim.roster.forEach(p => {
                    if (p && p.tanggalBergabung && typeof p.tanggalBergabung === "string") {
                        p.tanggalBergabung = new Date(p.tanggalBergabung);
                    }
                });
            });
        });
    })();

    // Render ulang semua tampilan biar ngikutin data save-an
    updateDashboard();
    renderBerita();
    renderEmail();

    bukaModal(
        "LOAD BERHASIL 🚀",
        `Selamat datang kembali di markas, CEO <b>${namaManajer}</b>!`,
        "#2563EB"
    );
};

// ==========================================
// FITUR EXPORT / IMPORT DATABASE (MODDING)
// ==========================================

window.bukaDatabase = function () {
    getEl("modalDatabase").classList.remove("sembunyi");
};

window.tutupDatabase = function () {
    getEl("modalDatabase").classList.add("sembunyi");
};

// FUNGSI DOWNLOAD FILE JSON
window.exportGame = async function () {
    let saveData = await idbGetSave();
    if (!saveData) {
        alert(
            "Belum ada save data di HP/Browser lu! Bikin karir dan klik Save di dalam game dulu bro."
        );
        return;
    }

    // Format nama filenya: MLBB_Save_[NamaTim]_[Tahun].json
    let tahunSkrg =
        typeof kalenderGame !== "undefined"
            ? kalenderGame.getFullYear()
            : "2026";
    let timAman =
        typeof timPlayer !== "undefined"
            ? timPlayer.replace(/\s+/g, "_")
            : "Custom";
    let namaFile = `MLBB_Save_${timAman}_${tahunSkrg}.json`;

    // [UPDATE v1.7] Mekanisme download standar browser (<a download> +
    // .click()) TERBUKTI gak jalan di WebView APK hasil bungkusan (file
    // gak nyampe ke folder Download sama sekali -- dilaporin tester).
    // Sekarang dicoba 3 lapis, dari yang paling native buat APK sampe yang
    // paling bulletproof:
    //   1. Web Share API (buka share sheet Android asli -- user pilih mau
    //      simpen ke Files/Drive/kirim ke WA/dll). Paling cocok buat APK.
    //   2. <a download> lama -- tetep dicoba, jalan normal di browser biasa.
    //   3. Modal manual copy-paste -- bulletproof, gak gantung ke API
    //      apapun, tinggal select-all + copy.
    let blob = new Blob([saveData], { type: "application/json" });

    // Lapis 1: Web Share API
    try {
        let file = new File([blob], namaFile, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: "Save Game Moba Manager",
                text: "Export save data dari Moba Manager."
            });
            return; // berhasil, selesai
        }
    } catch (err) {
        // User cancel share sheet BUKAN error beneran -- diemin aja, gak usah lanjut ke fallback
        if (err && err.name === "AbortError") return;
        console.error("[EXPORT] Web Share API gagal, coba fallback:", err);
    }

    // [FIX v1.8] SEBELUMNYA lapis ini `return` abis a.click() -- dikira
    // "berhasil" karena gak nge-throw error. Tapi TERBUKTI di beberapa
    // WebView APK, a.click() ini gagal SUNYI (gak nge-throw APAPUN, tapi
    // file-nya beneran gak kesimpen ke mana pun) -- bikin pesan "Berhasil
    // di-download!" jadi nyesatin. Sekarang Lapis 2 dianggap "gak bisa
    // dipercaya" -- tetep dicoba (buat browser biasa yang emang jalan
    // normal), tapi TIDAK `return` lagi, jadi Lapis 3 (manual copy, yang
    // dijamin selalu kelihatan & kerja) SELALU ditampilin juga sesudahnya.
    let lapis2Dicoba = false;
    try {
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = namaFile;
        a.click();
        URL.revokeObjectURL(url);
        lapis2Dicoba = true;
    } catch (err) {
        console.error("[EXPORT] Download link gagal:", err);
    }

    // Lapis 3: modal manual copy-paste (bulletproof, gak gantung API
    // apapun) -- SELALU ditampilin sebagai jaminan, apapun hasil Lapis 2.
    if (lapis2Dicoba) {
        alert("Kalau muncul notifikasi download di device kamu, cek folder Download. Kalau enggak, langsung aja pake opsi copy manual di bawah ini.");
    }
    window.tampilkanModalExportManual(saveData, namaFile);
};

// [NEW v1.7] Fallback lapis-3 export -- modal manual copy-paste.
window.tampilkanModalExportManual = function (saveData, namaFile) {
    getEl("exportManualNamaFile").innerText = namaFile;
    getEl("exportManualTextarea").value = saveData;
    getEl("modalExportManual").classList.remove("sembunyi");
};

window.salinExportManual = function () {
    let textarea = getEl("exportManualTextarea");
    // Coba Clipboard API modern dulu, fallback ke cara lama (select+execCommand)
    // kalau navigator.clipboard gak kedukung/gak diizinin di WebView ini.
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value)
            .then(() => alert("Berhasil disalin! Tempel ke aplikasi Notes/file teks buat disimpan."))
            .catch(() => {
                textarea.select();
                document.execCommand("copy");
                alert("Berhasil disalin! Tempel ke aplikasi Notes/file teks buat disimpan.");
            });
    } else {
        textarea.select();
        document.execCommand("copy");
        alert("Berhasil disalin! Tempel ke aplikasi Notes/file teks buat disimpan.");
    }
};

// [NEW v1.8] Pasangan modal Export manual -- Import via paste teks.
window.tampilkanModalImportManual = function () {
    getEl("importManualTextarea").value = "";
    getEl("modalImportManual").classList.remove("sembunyi");
};

window.prosesImportManual = async function () {
    let isi = getEl("importManualTextarea").value.trim();
    if (!isi) {
        alert("Belum ada teks yang ditempel!");
        return;
    }
    getEl("modalImportManual").classList.add("sembunyi");
    await prosesIsiImport(isi);
};

// FUNGSI BUKA EXPLORER HP/PC BUAT UPLOAD
window.triggerImport = function () {
    getEl("importFile").click();
};

// FUNGSI MEMBACA FILE JSON YANG DIUPLOAD
// [NEW v1.8] Logic inti import (validasi + simpan ke IndexedDB + load) --
// dipake bareng oleh Import via File (prosesImport) dan Import via Paste
// Teks (prosesImportManual), biar gak duplikat kode.
async function prosesIsiImport(isi) {
    try {
        JSON.parse(isi); // Tes ngebongkar dulu, kalau error bakal lari ke catch

        // Kalau aman, timpa brankas di IndexedDB dengan file ini -- di-AWAIT
        // dulu biar beneran kesimpen sebelum loadGame() manggil baca-nya
        // (kalau enggak, ada resiko race condition: loadGame kebaca data
        // LAMA karena tulisannya belum kelar).
        await idbSetSave(isi);

        tutupDatabase();
        // Langsung load permainannya!
        await loadGame();

        bukaModal(
            "IMPORT SUKSES! 🚀",
            "Database kustom / Save-an berhasil dipasang! Selamat bermain.",
            "#00B37E"
        );
        return true;
    } catch (err) {
        alert(
            "❌ Gagal Import! Teks/File JSON rusak, salah ketik pas ngedit, atau bukan format save-an game ini."
        );
        return false;
    }
}

window.prosesImport = function (event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = async function (e) {
        await prosesIsiImport(e.target.result);
        // Reset inputnya biar bisa upload file yang sama lagi kalau butuh
        getEl("importFile").value = "";
    };
    reader.readAsText(file);
};

const originalBukaSubLayar = window.bukaSubLayar;
window.bukaSubLayar = function (idLayar) {
    document
        .querySelectorAll(".sub-layar")
        .forEach(el => el.classList.add("sembunyi"));
    getEl("layarDashboard").classList.add("sembunyi");
    getEl(idLayar).classList.remove("sembunyi");

    window.scrollTo(0, 0);

    if (idLayar === "layarRoster") gantiTabManajemen("Tim");
    if (idLayar === "layarRiwayat") renderRiwayatJuara();
    if (idLayar === "layarGlobalPowerRanking" && typeof renderGlobalPowerRanking === "function") renderGlobalPowerRanking();
    if (idLayar === "layarMSC") renderLayarMSC();
    if (idLayar === "layarMSeries" && typeof renderLayarM7 === "function") renderLayarM7();
    if (idLayar === "layarFasilitas") renderFasilitas();
    if (idLayar === "layarEmail") renderEmail();
    if (idLayar === "layarAkuisisiMerger") renderLayarAkuisisiMerger();
    if (idLayar === "layarKlaimAfiliasi") renderLayarKlaimAfiliasi();
    if (idLayar === "layarTrialPlayer") renderLayarTrialPlayer();
    if (idLayar === "layarKlasemenMDLID") renderKlasemenMDLID();
    if (idLayar === "layarKlasemenLEN") renderKlasemenLEN();
    if (idLayar === "layarKlasemenMDLPH") renderKlasemenMDLPH();
    if (idLayar === "layarKlasemenMALMY") renderKlasemenMALMY();
};

function initRiwayatAwal() {
    let tahunSkrg = kalenderGame.getFullYear(); // Ngambil tahun start game (2026)

    // 1. Catat tim awal untuk roster (Tim Kita)
    if (typeof rosterKita !== "undefined") {
        rosterKita.forEach(p => {
            if (!p.riwayatKarir) p.riwayatKarir = [];
            // Kalau kosong, langsung masukin tim saat ini
            if (p.riwayatKarir.length === 0) {
                p.riwayatKarir.push({
                    tahunAwal: tahunSkrg,
                    tahunAkhir: tahunSkrg,
                    tim: timPlayer
                });
            }
        });
    }

    // 2. Catat tim awal untuk semua roster AI (Tim Lawan)
    let semuaRegionAwal = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    semuaRegionAwal.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return;
            if (tim.roster) {
                tim.roster.forEach(p => {
                    if (!p.riwayatKarir) p.riwayatKarir = [];
                    if (p.riwayatKarir.length === 0) {
                        p.riwayatKarir.push({
                            tahunAwal: tahunSkrg,
                            tahunAkhir: tahunSkrg,
                            tim: tim.nama
                        });
                    }
                });
            }
        });
    });
}

window.tolakTawaranCEO = function (offerId) {
    getEl(offerId).innerHTML =
        `<div style="background:#F7F9FC; border-left:4px solid #E5484D; padding:10px; color:#E5484D; text-align:center; font-weight:bold; font-size:12px;">❌ TAWARAN DITOLAK MANAJER.</div>`;
    let emTarget = inboxEmail.find(em => em.isi.includes(offerId));
    if (emTarget) emTarget.isi = getEl("bacaEmailIsi").innerHTML;
};

window.terimaTawaranCEO = function (namaTimBaru, offerId) {
    if (
        !confirm(
            `⚠️ PERINGATAN: Yakin pindah ke ${namaTimBaru}? Lu bakal ninggalin roster dan uang kas ${timPlayer} secara permanen!`
        )
    )
        return;

    let semuaTimAI = [
        ...daftarTim,
        ...daftarTimPH,
        ...daftarTimMY,
        ...daftarTimSG
    ];
    let timAsalKita = semuaTimAI.find(t => t.nama === timPlayer);
    let timTujuan = semuaTimAI.find(t => t.nama === namaTimBaru);

    // 1. Serahkan sisa roster dan duit kita ke tim lama (jadi AI lagi)
    if (timAsalKita) {
        timAsalKita.roster = [...rosterKita];
        timAsalKita.kas = kasTim;
        let totOvr = 0;
        timAsalKita.roster.forEach(x => (totOvr += x.ovr));
        timAsalKita.power = Math.floor(totOvr / timAsalKita.roster.length);
    }

    // 2. Ambil alih Tahta Tim Baru
    timPlayer = namaTimBaru;
    reputasiTim = timTujuan.reputasi || 50;
    // Warisi roster dan duitnya
    rosterKita = [...timTujuan.roster];
    kasTim = timTujuan.kas;

    staffKita = {
        pelatih:
            timTujuan.staff && timTujuan.staff.pelatih
                ? timTujuan.staff.pelatih
                : null,
        asisten:
            timTujuan.staff && timTujuan.staff.asisten
                ? timTujuan.staff.asisten
                : null,
        analis: null
    };

    // Reset fasilitias ke default (biar menantang)
    levelGH = 1;
    window.sponsorTim = { utama: null, minor1: null, minor2: null };
    penawaranSponsor = [];
    sponsorDiambil = false;
    riwayatKas = [];
    catatKas("MASUK", kasTim, `Anggaran Awal Manajemen ${namaTimBaru}`);

    // Update UI Teks
    getEl(offerId).innerHTML =
        `<div style="background:#F7F9FC; border-left:4px solid #00B37E; padding:10px; color:#00B37E; text-align:center; font-weight:bold; font-size:12px;">✅ KONTRAK DITANDATANGANI! Selamat datang di markas baru!</div>`;
    let emTarget = inboxEmail.find(em => em.isi.includes(offerId));
    if (emTarget) emTarget.isi = getEl("bacaEmailIsi").innerHTML;

    if (getEl("namaTimHeader")) getEl("namaTimHeader").innerText = timPlayer;

    // Bikin Berita Gempar Global!
    tambahBerita(
        `🚨 Breaking News: Bursa transfer terguncang. Manajer <span>${namaManajer}</span> secara mengejutkan membelot ke <span>${timPlayer}</span> musim ini.`
    );

    updateDashboard();
    tutupBacaEmail();
};

// ==========================================
// SISTEM IN-GAME EDITOR (KOSMETIK)
// ==========================================
let targetEditObj = null;
let tipeEditAktif = "";

// FUNGSI PENCARI OTOMATIS
function cariPemainGlobal(nama) {
    let p = rosterKita.find(x => x.nama === nama);
    if (p) return p;
    p = pemainTransfer.find(x => x.nama === nama);
    if (p) return p;
    let regionAll = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    for (let reg of regionAll) {
        for (let t of reg) {
            if (t.roster) {
                p = t.roster.find(x => x.nama === nama);
                if (p) return p;
            }
        }
    }
    return null;
}

function cariStaffGlobal(nama) {
    for (let key in staffKita) {
        if (staffKita[key] && staffKita[key].nama === nama)
            return staffKita[key];
    }
    let s = bursaStaff.find(x => x.nama === nama);
    if (s) return s;
    let regionAll = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    for (let reg of regionAll) {
        for (let t of reg) {
            if (t.staff) {
                if (t.staff.pelatih && t.staff.pelatih.nama === nama)
                    return t.staff.pelatih;
                if (t.staff.asisten && t.staff.asisten.nama === nama)
                    return t.staff.asisten;
            }
        }
    }
    return null;
}

function cariTimGlobal(nama) {
    let regionAll = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    for (let reg of regionAll) {
        let t = reg.find(x => x.nama === nama);
        if (t) return t;
    }
    return null;
}

// BUKA MODAL EDITOR BACA DATA SAAT INI
window.bukaEditor = function (tipe) {
    tipeEditAktif = tipe;
    getEl("grupEditLogo").classList.add("sembunyi");

    if (tipe === "pemain") {
        let nama = getEl("profilNama").innerText;
        targetEditObj = cariPemainGlobal(nama);
        getEl("judulEditor").innerText = "EDIT NAMA PEMAIN";
    } else if (tipe === "staff") {
        let nama = getEl("profilStaffNama").innerText;
        targetEditObj = cariStaffGlobal(nama);
        getEl("judulEditor").innerText = "EDIT NAMA STAFF";
    } else if (tipe === "tim_detail") {
        targetEditObj = cariTimGlobal(timPlayer);
        getEl("grupEditLogo").classList.remove("sembunyi");
        getEl("judulEditor").innerText = "EDIT TIM UTAMA & LOGO";
    }

    if (!targetEditObj) {
        alert("Data target tidak ditemukan di database!");
        return;
    }

    // Isi kotak input dengan nama lama
    getEl("inputEditNama").value = targetEditObj.nama;
    if (tipe.includes("tim"))
        getEl("inputEditLogo").value = targetEditObj.logo || "";

    getEl("modalEditor").classList.remove("sembunyi");
};

// SIMPAN HASIL EDITAN
window.simpanEditan = function () {
    let namaBaru = getEl("inputEditNama").value.trim();
    if (namaBaru === "") {
        alert("Nama tidak boleh kosong bro!");
        return;
    }

    // Kalau yang diedit tim lu sendiri, update variabel utama
    if (tipeEditAktif.includes("tim") && targetEditObj.nama === timPlayer) {
        timPlayer = namaBaru;
        if (getEl("namaTimHeader"))
            getEl("namaTimHeader").innerText = timPlayer;
    }

    // UPDATE DATABASE
    targetEditObj.nama = namaBaru;
    if (tipeEditAktif.includes("tim")) {
        targetEditObj.logo = getEl("inputEditLogo").value.trim();
    }

    getEl("modalEditor").classList.add("sembunyi");

    // UPDATE LAYAR UI YANG LAGI TERBUKA SUPAYA LANGSUNG BERUBAH (SEAMLESS)
    if (tipeEditAktif === "pemain") {
        getEl("profilNama").innerText = namaBaru;
        if (getEl("profilAvatar")) {
            getEl("profilAvatar").innerText = String(namaBaru || "?").trim().slice(0, 2).toUpperCase();
        }
    }
    else if (tipeEditAktif === "staff")
        getEl("profilStaffNama").innerText = namaBaru;
    else if (tipeEditAktif === "tim_detail") {
        getEl("detailTimHeaderNama").innerText = namaBaru;
        if (targetEditObj.logo) getEl("detailTimLogo").src = targetEditObj.logo;
    }

    updateDashboard(); // Refesh dashboard dibelakang layar
    bukaModal(
        "BERHASIL DISIMPAN! ✏️",
        `Data telah diperbarui di database. Jangan lupa klik Save Game agar permanen.`,
        "#00B37E"
    );
};

// ==========================================
// FUNGSI SATU TOMBOL: SAVE & KELUAR
// ==========================================
window.keluarDanSave = function () {
    window.tampilkanKonfirmasiUmum(
        "🚪 Simpan & Keluar",
        "Simpan progress dan balik ke Menu Utama?",
        "YA, SIMPAN",
        async function () {
            // [UPDATE v1.6] SEBELUMNYA reload dipicu via setTimeout 1 detik
            // TEBAKAN doang, gak beneran nunggu proses save-nya kelar --
            // resiko reload duluan sebelum data kesimpen kalau device-nya
            // lambat. Sekarang di-await beneran, reload cuma kejadian
            // SETELAH proses save (IndexedDB) genuinely selesai.
            await simpanGame();

            // Jeda kecil biar notif "Game Tersimpan" sempet kebaca dulu
            setTimeout(() => {
                location.reload();
            }, 800);
        }
    );
};

// FUNGSI EKSEKUSI SAAT STAFF DEAL KONTRAK
window.eksekusiDealStaff = function (nego, pakaiCounter = false) {
    let s = nego.pemain;
    let dealGaji = pakaiCounter ? nego.counterGaji : nego.proposal.gaji;
    let dealDurasi = pakaiCounter ? nego.counterDurasi : nego.proposal.durasi;
    let roleKey =
        s.role === "Pelatih"
            ? "pelatih"
            : s.role === "Asisten Pelatih"
              ? "asisten"
              : "analis";

    // CEK LIMIT GH (Jaga-jaga kalau pas nunggu 2 hari slotnya diisi orang lain)
    let limitStaff = databaseGH[levelGH - 1].limitStaff;
    if (
        (roleKey === "asisten" && limitStaff < 2) ||
        (roleKey === "analis" && limitStaff < 3)
    ) {
        kasTim += nego.biayaMuka;
        catatKas(
            "MASUK",
            nego.biayaMuka,
            `Refund Batal Nego Staff (Limit GH): ${s.nama}`
        );
        return `<div style="background:rgba(229,72,77,0.08); color:#E5484D; padding:10px;">❌ Batal rekrut <b>${s.nama}</b>! Fasilitas GH lu tidak cukup. Deposit dikembalikan.</div>`;
    }

    if (staffKita[roleKey] !== null) {
        kasTim += nego.biayaMuka;
        catatKas(
            "MASUK",
            nego.biayaMuka,
            `Refund Batal Nego Staff (Slot Penuh): ${s.nama}`
        );
        return `<div style="background:rgba(229,72,77,0.08); color:#E5484D; padding:10px;">❌ Batal rekrut <b>${s.nama}</b>! Lu udah punya ${s.role}. Pecat yang lama dulu. Deposit dikembalikan.</div>`;
    }

    // Pelunasan (Harga Rekrutmen/Release Clause - Uang Deposit awal)
    let sisaPelunasan = s.harga - nego.biayaMuka;
    if (sisaPelunasan > 0) {
        if (kasTim < sisaPelunasan) {
            kasTim += nego.biayaMuka;
            catatKas(
                "MASUK",
                nego.biayaMuka,
                `Refund Nego Staff (Kas Kurang): ${s.nama}`
            );
            return `<div style="background:rgba(229,72,77,0.08); color:#E5484D; padding:10px;">❌ Batal rekrut <b>${s.nama}</b>! Kas lu kurang buat bayar Release Clause agen. Deposit dikembalikan.</div>`;
        }
        kasTim -= sisaPelunasan;
        catatKas("KELUAR", sisaPelunasan, `Pelunasan Rekrut Staff: ${s.nama}`);
    } else if (sisaPelunasan < 0) {
        let kembali = Math.abs(sisaPelunasan);
        kasTim += kembali;
        catatKas("MASUK", kembali, `Kelebihan Deposit Staff: ${s.nama}`);
    }

    s.gaji = dealGaji;
    s.sisaKontrak = dealDurasi;

    // Masukkin ke tim & hapus dari bursa
    staffKita[roleKey] = s;
    let idxBursa = bursaStaff.findIndex(x => x.nama === s.nama);
    if (idxBursa !== -1) bursaStaff.splice(idxBursa, 1);

    tambahBerita(
        `🤝 Resmi: Coach <span>${s.nama}</span> bergabung dengan tim anda.`
    );
    return `<div style="background:rgba(0,179,126,0.10); color:#00B37E; padding:10px;">✅ <b>${s.nama}</b> RESMI bergabung sebagai ${s.role}!</div>`;
};

// FUNGSI RESPON TOMBOL DI DALAM EMAIL COUNTER OFFER STAFF
window.responCounterStaff = function (id, isDeal) {
    let idx = antrianTransfer.findIndex(n => n.id === id);
    if (idx === -1) {
        getEl(id).innerHTML =
            `<div style="color:#E5484D; font-size:11px;">⚠️ Kadaluarsa.</div>`;
        return;
    }

    let nego = antrianTransfer[idx];
    let s = nego.pemain;

    if (isDeal) {
        let pesan = window.eksekusiDealStaff(nego, true);
        if (pesan.includes("❌")) {
            getEl(id).innerHTML = pesan;
        } else {
            getEl(id).innerHTML =
                `<div style="color:#00B37E; font-weight:bold; font-size:12px; padding:10px; background:#F7F9FC; border:1px dashed #00B37E;">✅ SEPAKAT! Pelatih resmi direkrut. Cek Manajemen Tim!</div>`;
        }
    } else {
        kasTim += nego.biayaMuka;
        catatKas("MASUK", nego.biayaMuka, `Refund Batal Nego Staff: ${s.nama}`);
        getEl(id).innerHTML =
            `<div style="color:#E5484D; font-weight:bold; font-size:12px; padding:10px; background:#F7F9FC; border:1px dashed #E5484D;">❌ DIBATALKAN MANAJER. Deposit kembali.</div>`;
    }

    let emTarget = inboxEmail.find(em => em.isi.includes(id));
    if (emTarget) emTarget.isi = getEl("bacaEmailIsi").innerHTML;

    antrianTransfer.splice(idx, 1);
    updateDashboard();
};

// ==========================================
// RENDER UI 3 SLOT SPONSOR & PENAWARAN
// ==========================================
window.renderSponsorUI = function() {
    let listSponsorEl = document.getElementById("listSponsor");
    let wadahAktif = document.getElementById("teksSponsorAktif");
    if (!listSponsorEl || !wadahAktif) return;

    // --- 1. RENDER SPONSOR AKTIF (3 SLOT) ---
    wadahAktif.classList.remove("sembunyi");
    wadahAktif.style.background = "transparent";
    wadahAktif.style.border = "none";
    wadahAktif.style.padding = "0";

    let htmlAktif = "";
    let st = window.sponsorTim;
    let adaSponsor = st.utama || st.minor1 || st.minor2;

    if (adaSponsor) {
        htmlAktif += `<div class="sponsor-section-label sponsor-section-label--green">KONTRAK SPONSOR AKTIF:</div>`;

        // Fungsi kecil pembuat wujud UI 3 Slot
        const bikinKartuSlot = (sp, slotName, warna) => {
            if (!sp) return `<div class="sponsor-slot-card sponsor-slot-card--empty">[ Slot Kosong ] - ${slotName}</div>`;
            return `
            <div class="sponsor-slot-card" style="border-left-color:${warna};">
                <div class="sponsor-slot-card__top">
                    <div>
                        <div class="sponsor-slot-card__name">${sp.nama}</div>
                        <div class="sponsor-slot-card__meta">${slotName} | Sisa: <span style="color:var(--gold);">${sp.sisaDurasi} Musim</span></div>
                    </div>
                    <div class="sponsor-slot-card__kpi">${sp.kpi === "NONE" ? "Aman Tanpa KPI" : "KPI: "+sp.kpi.replace("_", " ")}</div>
                </div>
            </div>`;
        };

        htmlAktif += bikinKartuSlot(st.utama, "Sponsor Utama (Dada)", "var(--gold)");
        htmlAktif += bikinKartuSlot(st.minor1, "Sponsor Minor 1 (Lengan)", "var(--green)");
        htmlAktif += bikinKartuSlot(st.minor2, "Sponsor Minor 2 (Lengan)", "var(--green)");
    }
    wadahAktif.innerHTML = htmlAktif;

    // --- 2. RENDER DAFTAR PENAWARAN ---
    listSponsorEl.innerHTML = "";

    // Kalau ke-3 slot udah penuh, sembunyiin daftar tawaran
    if (st.utama && st.minor1 && st.minor2) {
        listSponsorEl.innerHTML = `<div class="sponsor-empty-box">Semua Slot Sponsor (3/3) telah terisi penuh.<br>Tunggu hingga kontrak usai untuk mencari sponsor baru!</div>`;
        return;
    }

    // Kalau array penawaran masih kosong, panggil mesin pembuat tawarannya
    if (penawaranSponsor.length === 0) {
        if(typeof window.generatePenawaranSponsor === 'function') window.generatePenawaranSponsor();
    }

    // Kalau setelah dipanggil tetep kosong (Karna tim lu terlalu gurem)
    if (penawaranSponsor.length === 0) {
        listSponsorEl.innerHTML = `<div class="sponsor-empty-box"><i class="fa-solid fa-chart-line" style="font-size:20px;color:var(--text-3);"></i><br>Belum ada brand yang melirik tim Anda.<br>Tingkatkan Reputasi dengan memenangkan Turnamen!</div>`;
        return;
    }

    listSponsorEl.innerHTML += `<div class="sponsor-section-label" style="margin-top:15px;">PENAWARAN KONTRAK BARU:</div>`;

    penawaranSponsor.forEach((sp, index) => {
        let isDark = sp.tier === "DARK";
        let isMain = sp.tier === "S" || sp.tier === "A" || isDark;
        let warnaBorder = isDark ? "var(--red)" : (sp.tier === "S" ? "var(--gold)" : (sp.tier === "A" ? "var(--cyan)" : "var(--green)"));
        let teksSlot = isMain ? "Utama" : "Minor";
        let adaKpi = sp.kpi !== "NONE";
        let teksKpi = adaKpi ? sp.kpi.replace("_", " ") : "Tanpa Target";

        let kartuHtml = `
            <div class="sponsor-offer-card">
                <div class="sponsor-offer-card__head">
                    <span class="sponsor-offer-card__name">${sp.nama}</span>
                    <span class="sponsor-offer-card__tier" style="background:${warnaBorder};">${sp.tier}</span>
                </div>
                <div class="sponsor-offer-card__amount-label">Dana Segar Total</div>
                <div class="sponsor-offer-card__amount">Rp ${(sp.bayar / 1000000).toFixed(1)} Jt</div>
                <div class="sponsor-offer-card__meta-row">
                    <div class="sponsor-offer-card__meta-pill">
                        <div class="sponsor-offer-card__meta-label">DURASI</div>
                        <div class="sponsor-offer-card__meta-val">${sp.durasi} Musim</div>
                    </div>
                    <div class="sponsor-offer-card__meta-pill">
                        <div class="sponsor-offer-card__meta-label">SLOT</div>
                        <div class="sponsor-offer-card__meta-val">${teksSlot}</div>
                    </div>
                    <div class="sponsor-offer-card__meta-pill">
                        <div class="sponsor-offer-card__meta-label">KPI</div>
                        <div class="sponsor-offer-card__meta-val ${adaKpi ? 'sponsor-offer-card__meta-val--warn' : 'sponsor-offer-card__meta-val--ok'}">${teksKpi}</div>
                    </div>
                </div>
                <button class="modal-btn sponsor-offer-card__btn" onclick="ambilSponsor(${index})">
                    Tanda Tangani Kontrak
                </button>
            </div>
        `;
        listSponsorEl.innerHTML += kartuHtml;
    });
};

initRiwayatAwal();
updateDashboard();
// ==========================================
// SIMULASI SERI DRAMATIS v2.0
// Playoff, MSC & M-Series — Per-Game Narasi
// ==========================================

// Template highlight khusus turnamen besar (lebih dramatis)
const TEMPLATE_HIGHLIGHT_TURNAMEN = {
    ketat: [
        "💥 GAME PENUH DRAMA! {hero} ({role}) menjadi pahlawan {tim} lewat teamfight maut di Turtle pit!",
        "😰 Jantung berdegup kencang! {tim} hampir kolaps tapi {hero} tampil bak dewa di momen paling kritis!",
        "🔥 Pertarungan HIDUP MATI! Kedua tim saling balas damage, {hero} menutupnya dengan decisive play untuk {tim}!",
        "⚔️ CLUTCH PLAY! {hero} ({role}) solo win fight saat tim dalam kondisi disadvantage — {tim} mencuri kemenangan!"
    ],
    normal: [
        "💪 {tim} menguasai map dari early game. {hero} ({role}) sempurna memimpin rotasi dan memberi kemenangan!",
        "📈 Momentum {tim} tidak terbendung! {hero} mendominasi mid game dan menutup laga dengan megah.",
        "🎯 Drafting genius dari {tim}! {hero} ({role}) jadi pisau bedah yang membantai lawan dengan presisi.",
        "🏹 Clean sweep lane! {hero} menghancurkan sisi map sendirian sementara {tim} mengambil objective penting."
    ],
    telak: [
        "💀 PEMBANTAIAN! {tim} bermain setingkat lebih tinggi dari lawan. {hero} ({role}) hampir untouchable!",
        "🚀 STOMPING SESSION! {hero} bikin musuh frustrasi sejak menit pertama — {tim} main di level berbeda hari ini!",
        "👑 TIDAK ADA PERLAWANAN! {tim} mengeksekusi strategi dengan sempurna, {hero} menjadi mesin destruction!"
    ]
};

// Template narasi khusus per fase turnamen
const NARASI_TURNAMEN = {
    playoff: {
        pembuka: [
            "🏟️ Sorak sorai ribuan penonton memenuhi arena! Ini bukan lagi sekadar pertandingan biasa...",
            "⚡ Lampu sorot menyala, jantung para pemain berdegup kencang. PLAYOFF dimulai!",
            "🎮 Tidak ada ruang untuk kesalahan. Satu kekalahan bisa jadi tiket pulang selamanya!"
        ],
        semifinal: [
            "🌟 4 Tim tersisa. Setiap momen bisa menjadi kenangan abadi atau mimpi buruk!",
            "⚔️ Hanya yang terkuat yang bisa melangkah ke Grand Final. Ini saatnya!",
            "💎 Tiket Grand Final ada di depan mata. Siapa yang paling siap mental hari ini?"
        ],
        grandfinal: [
            "🏆 INI DIA! Puncak dari semua perjuangan sepanjang musim. GRAND FINAL!",
            "👑 Dua tim terbaik. Satu trofi. Satu nama yang akan dikenang sepanjang masa!",
            "🔥 Tidak ada yang bisa memprediksikan ini — inilah momen yang ditunggu seluruh komunitas!"
        ],
        menang_player: [
            "🎉 LUAR BIASA! Tim lu tampil SEMPURNA di momen yang paling penting!",
            "🔥 TIDAK PERCAYA! Lu telah membuktikan bahwa kerja keras selama musim ini tidak sia-sia!",
            "🏆 Ini baru legenda! Tim lu merobohkan semua ekspektasi dan bangkit saat paling dibutuhkan!"
        ],
        kalah_player: [
            "💔 Musim yang luar biasa berakhir dengan pahit. Tapi tidak ada yang bisa merebut semangat ini...",
            "😔 Kalah itu menyakitkan. Tapi setiap legenda pernah merasakan kekalahan ini sebelum bangkit.",
            "🙏 Angkat kepala. Tim lu sudah berjuang habis-habisan. Season depan, kita balas dendam!"
        ]
    },
    msc: {
        pembuka: [
            "🌍 PANGGUNG INTERNASIONAL TERBUKA! Tim-tim terbaik Asia Tenggara siap bertempur!",
            "✈️ Kali ini taruhannya bukan hanya trophy — ini soal nama baik seluruh region!",
            "🌐 MSC: Di sinilah perbedaan antara pemain bagus dan LEGENDA dibuktikan!"
        ],
        semifinal: [
            "🌟 Tinggal 4 tim dari seluruh SEA! Pertempuran antar nation dimulai!",
            "⚔️ Regional pride dipertaruhkan! Siapa yang akan mewakili negaranya di final?",
            "🔥 Di titik ini, semua pemain sudah melewati batas fisik dan mental biasa!"
        ],
        grandfinal: [
            "🏆 GRAND FINAL MSC! Dua tim terbaik se-Asia Tenggara beradu di atas panggung dunia!",
            "🌐 Ini bukan hanya kemenangan untuk satu tim — ini kemenangan untuk seluruh region!",
            "👑 Satu tim akan pulang sebagai raja Asia Tenggara. Siapa yang layak menyandang mahkota itu?"
        ],
        menang_player: [
            "🥇 JUARA ASIA TENGGARA! Tim lu telah menaklukkan seluruh region dalam satu turnamen!",
            "🌟 SEJARAH TERCIPTA! Kalian datang, bertarung, dan menaklukkan semua. LUAR BIASA!",
            "🔥 Dari lokal ke internasional — tim lu membuktikan kalian layak disebut yang TERBAIK!"
        ],
        kalah_player: [
            "💔 Perjuangan internasional berakhir di sini. Tapi sudah cukup untuk bikin seluruh Indonesia bangga!",
            "😔 MSC mengakhiri perjalanan kalian kali ini. Tapi dunia sudah melihat kehebatan tim ini.",
            "🙏 Tidak ada malu pulang dari sini. Kalian sudah membawa nama region dengan gagah!"
        ]
    },
    mseries: {
        pembuka: [
            "🌏 STAGE TERBESAR MLBB DI PLANET INI! M WORLD CHAMPIONSHIP RESMI DIMULAI!",
            "🎆 Tim dari seluruh dunia hadir. Tidak ada yang akan ingat siapa yang datang — hanya siapa yang MENANG!",
            "👁️ Mata seluruh dunia tertuju ke sini. Ini adalah hari yang akan dibicarakan bertahun-tahun!"
        ],
        semifinal: [
            "🌟 SEMIFINAL DUNIA! Empat tim terbaik di muka bumi berdiri di sini!",
            "⚔️ Setiap game bisa menjadi highlight yang diputar ulang jutaan kali. Berikan yang terbaik!",
            "🔥 Tidak ada kata 'tidak siap' di level ini. Ini adalah puncak karir setiap pemain esports!"
        ],
        grandfinal: [
            "🏆🌍 GRAND FINAL M-SERIES! PERTANDINGAN TERBESAR DALAM SEJARAH MLBB DIMULAI!",
            "👑 DUA TIM. SATU TROFI. SATU NAMA YANG AKAN DIUKIR DALAM EMAS SELAMANYA!",
            "💫 Momen ini tidak akan terulang. Setiap detik, setiap keputusan akan menentukan sejarah!"
        ],
        menang_player: [
            "🌟👑 JUARA DUNIA!!! Tim lu telah menaklukkan SELURUH PLANET dan mengukir nama di bintang!",
            "🏆🎆 TIDAK BISA DIPERCAYA!!! Dari perjuangan lokal hingga mahkota dunia — KALIAN ADALAH LEGENDA!",
            "🔥🌍 SEJARAH TERCIPTA HARI INI! Tim lu adalah YANG TERBAIK DI SELURUH DUNIA!!!"
        ],
        kalah_player: [
            "💔 Dunia sudah menyaksikan kehebatan kalian. Runner-up dunia bukan sesuatu yang perlu diratapi...",
            "😔 Satu langkah dari puncak dunia. Rasa sakit ini akan menjadi bahan bakar untuk kebangkitan!",
            "🙏 Legenda tidak lahir dalam semalam. Kalian sudah membuktikan kalian termasuk yang terbaik di dunia."
        ]
    }
};

/**
 * Simulasikan satu seri dengan narasi dramatis per game.
 * Return object lengkap: hasil seri + gameLog untuk semua pertandingan.
 * Kalau melibatkan timPlayer, trigger bukaHasilMatch otomatis.
 *
 * @param {Object} timA - Tim Home
 * @param {Object} timB - Tim Away
 * @param {number} formatBO - Format Best Of (5 atau 7)
 * @param {string} konteks - "playoff_playin" | "playoff_semi" | "playoff_ub" | "playoff_gf" | "msc_qf" | "msc_sf" | "msc_gf" | "mseries_qf" | "mseries_sf" | "mseries_gf"
 * @param {boolean} isHomeBonus - Apakah ada bonus kandang (biasanya false di turnamen internasional)
 */
function simulasikanSeriesDramatis(timA, timB, formatBO, konteks = "playoff_semi", isHomeBonus = false) {
    let butuhWin = Math.ceil(formatBO / 2);
    let sA = 0, sB = 0;
    let gameLog = [];
    let melibatkanPlayer = (timA.nama === timPlayer || timB.nama === timPlayer);

    for (let i = 0; i < formatBO; i++) {
        if (sA === butuhWin || sB === butuhWin) break;

        let pA = hitungPerformaMatch(timA);
        let pB = hitungPerformaMatch(timB);
        if (isHomeBonus && timA.nama === timPlayer) pA += 1.5;

        let aMenangGame = window.tentukanPemenangGame
            ? window.tentukanPemenangGame(pA, pB, sA, sB, formatBO)
            : pA > pB;
        let menang = aMenangGame ? timA : timB;
        let kalah = aMenangGame ? timB : timA;
        let selisih = Math.abs(pA - pB);

        if (aMenangGame) sA++;
        else sB++;

        // Buat narasi per game kalau melibatkan player
        if (melibatkanPlayer) {
            let highlight = buatHighlightDramatis(menang, kalah, selisih, konteks);
            gameLog.push(highlight);
        }
    }

    let hasil = {
        home: timA,
        away: timB,
        skorHome: sA,
        skorAway: sB,
        sudahMain: true,
        format: "BO" + formatBO,
        menang: sA > sB ? timA : timB,
        kalah: sA > sB ? timB : timA,
        gameLog: gameLog
    };

    // [BUGFIX] Moral jalan jg utk series dramatis (playoff yg melibatkan player)
    terapkanMoralPascaMatch(timA);
    terapkanMoralPascaMatch(timB);

    // Kalau melibatkan player, trigger modal hasil match
    if (melibatkanPlayer) {
        let timMenang = hasil.menang;
        let timKalah = hasil.kalah;
        let heroLogs = gameLog.filter(g => g.tim === timMenang.nama);
        let mvp = heroLogs.length > 0
            ? heroLogs.reduce((a, b) => ((b.hero?.ovr || 0) > (a.hero?.ovr || 0) ? b : a)).hero
            : { nama: timMenang.nama, role: "Tim" };

        // Tentukan jenis turnamen dan fase untuk narasi pembuka/penutup
        let jenis = konteks.startsWith("msc") ? "msc" : konteks.startsWith("mseries") ? "mseries" : "playoff";
        let fase = konteks.endsWith("gf") ? "grandfinal" : konteks.endsWith("sf") || konteks.endsWith("semi") ? "semifinal" : "pembuka";

        // Tambahkan narasi pembuka di gameLog index 0 (prepend)
        let narPembuka = ambilAcak(NARASI_TURNAMEN[jenis][fase]);
        gameLog.unshift({ teks: `<span style="color:#5B3DF5; font-style:italic; font-size:12px;">${narPembuka}</span>`, hero: null, tim: "" });

        // Tambahkan narasi penutup dramatis
        let isPlayerMenang = timMenang.nama === timPlayer;
        let narPenutup = isPlayerMenang
            ? ambilAcak(NARASI_TURNAMEN[jenis].menang_player)
            : ambilAcak(NARASI_TURNAMEN[jenis].kalah_player);

        let warnaLabel = jenis === "mseries" ? "#5B3DF5" : jenis === "msc" ? "#0891B2" : "#E8720C";
        gameLog.push({
            teks: `<span style="color:${warnaLabel}; font-weight:bold; font-size:13px;">${narPenutup}</span>`,
            hero: null,
            tim: ""
        });

        // Trigger berita global
        let labelTurnamen = jenis === "mseries" ? "M-SERIES" : jenis === "msc" ? "MSC" : "Playoff";
        if (isPlayerMenang) {
            tambahBerita(`🏆 ${labelTurnamen.toUpperCase()}: <span>${timPlayer}</span> mengalahkan <span>${timKalah.nama}</span> dengan skor ${sA}-${sB} dan melangkah lebih jauh.`);
        } else {
            tambahBerita(`😔 ${labelTurnamen.toUpperCase()}: <span>${timPlayer}</span> tersisih oleh <span>${timMenang.nama}</span> dengan skor ${sB}-${sA}.`);
        }

        let statDataDram = generateStatistikMatch(timMenang, timKalah, gameLog);
        let isHomePlayerDram = timA.nama === timPlayer;

        // Generate per-game stats
        let perGameStatsDram = [];
        // gameLog has prepended intro & appended outro items (hero=null, tim="")
        // Filter actual game entries
        let actualGameLogs = gameLog.filter(g => g.tim && g.tim !== "");
        for (let g = 0; g < actualGameLogs.length; g++) {
            let gl = actualGameLogs[g];
            let isAMenangGame = gl.tim === timA.nama;
            let tMenangGame = isAMenangGame ? timA : timB;
            let tKalahGame  = isAMenangGame ? timB : timA;
            let statGame = generateStatistikMatch(tMenangGame, tKalahGame, [gl]);
            perGameStatsDram.push({
                statsHome: isHomePlayerDram ? statGame.statsMenang : statGame.statsKalah,
                statsAway: isHomePlayerDram ? statGame.statsKalah  : statGame.statsMenang,
                gameDuration: statGame.gameDuration,
                menangNama: tMenangGame.nama
            });
        }

        window._lastMatchResult = {
            home: timA,
            away: timB,
            skorHome: sA,
            skorAway: sB,
            gameLog: gameLog,
            mvp: mvp || { nama: timMenang.nama, role: "Tim" },
            mvpTim: timMenang.nama,
            statsHome:    isHomePlayerDram ? statDataDram.statsMenang : statDataDram.statsKalah,
            statsAway:    isHomePlayerDram ? statDataDram.statsKalah  : statDataDram.statsMenang,
            gameDuration: statDataDram.gameDuration,
            awards:       statDataDram.awards,
            timMenang:    timMenang,
            timKalah:     timKalah,
            perGameStats: perGameStatsDram
        };
    }

    return hasil;
}

/**
 * Helper: buat highlight per-game dengan template turnamen yang lebih dramatis
 */
function buatHighlightDramatis(timMenang, timKalah, selisih, konteks) {
    let starter = window.ambilStarter5(timMenang);
    let hero = starter.length > 0
        ? starter[Math.floor(Math.random() * starter.length)]
        : { nama: timMenang.nama, role: "Tim", ovr: timMenang.power || 65 };

    let kategori = selisih < 1 ? "ketat" : selisih < 4 ? "normal" : "telak";

    // Pakai template turnamen untuk konteks playoff/msc/mseries, fallback ke regular
    let templates = TEMPLATE_HIGHLIGHT_TURNAMEN[kategori] || TEMPLATE_HIGHLIGHT[kategori];
    let teks = ambilAcak(templates)
        .replace(/{hero}/g, hero.nama)
        .replace(/{role}/g, hero.role || "Player")
        .replace(/{tim}/g, timMenang.nama);

    return { teks, hero, tim: timMenang.nama, kategori };
}

/**
 * Helper: ambil elemen random dari array
 */
function ambilAcak(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Simulasikan seri TANPA narasi (untuk tim AI vs AI di turnamen global)
 * Tetap gunakan simulasikanSeries biasa tapi dengan konteks biar nanti bisa upgrade
 */
function simulasikanAIvsAI(timA, timB, formatBO) {
    return simulasikanSeries(timA, timB, formatBO);
}

// ==========================================
// FUNGSI PLAYOFF DRAMATIS — REPLACE PHASE
// ==========================================

/**
 * Wrapper untuk satu fase playoff yang melibatkan tim player.
 * Detect apakah tim player terlibat → pakai dramatis, kalau tidak → AI biasa.
 */
function simulasiPlayoffMatch(timA, timB, formatBO, konteks) {
    // [BARU] Sama kayak di simulasiGlobalMatch -- MSC ternyata juga
    // manggil fungsi ini di beberapa titik, jadi flag konteks harus
    // di-set di sini juga biar eligibility filter gak ke-skip.
    window._konteksMatchAktif = konteks;
    let isPlayerTerlibat = (timA.nama === timPlayer || timB.nama === timPlayer);
    if (isPlayerTerlibat) {
        return simulasikanSeriesDramatis(timA, timB, formatBO, konteks, true);
    }
    return simulasikanSeries(timA, timB, formatBO);
}

function simulasiGlobalMatch(timA, timB, formatBO, konteks) {
    // [BARU] Simpen konteks match yang lagi jalan ke flag global -- dipakai
    // hitungPerformaMatch() buat tau apakah ini match MSC/M7 (perlu filter
    // eligibility pemain) atau match liga biasa (gak perlu). Aman krn JS
    // single-threaded/sinkron -- flag ini cuma "hidup" selama pemanggilan
    // match ini berlangsung, langsung ketimpa pas match berikutnya mulai.
    window._konteksMatchAktif = konteks;
    let isPlayerTerlibat = (timA.nama === timPlayer || timB.nama === timPlayer);
    if (isPlayerTerlibat) {
        return simulasikanSeriesDramatis(timA, timB, formatBO, konteks, false);
    }
    return simulasikanSeries(timA, timB, formatBO);
}

/**
 * Jalankan semua drama playoff setelah simulasi selesai.
 * Dipanggil setiap kali ada match yang melibatkan player di playoff.
 */
function cekDanTampilHasilDramatis() {
    if (window._lastMatchResult) {
        // Delay kecil biar updateDashboard selesai dulu
        setTimeout(() => {
            window.bukaHasilMatch(window._lastMatchResult);
            window._lastMatchResult = null;
        }, 150);
    }
}

/**
 * Generate berita latar untuk match AI vs AI di turnamen global
 */
function beritaAIvsAI(hasil, labelTurnamen) {
    if (!hasil || !hasil.menang) return;
    // Cuma generate berita kalau timnya cukup terkenal (reputasi > 75)
    let repMenang = hasil.menang.reputasi || 50;
    if (repMenang >= 80 || Math.random() < 0.3) {
        tambahBerita(`🌐 ${labelTurnamen}: <span>${hasil.menang.nama}</span> mengalahkan <span>${hasil.kalah.nama}</span> ${hasil.skorHome}-${hasil.skorAway} dan melaju ke babak berikutnya.`);
    }
}


// ==========================================
// SISTEM AKADEMI — MLBB PRO CIRCUIT MANAGER
// ==========================================
// Akademi aktif mulai GH Level 2.
// Setiap musim menghasilkan 1 prospek muda
// yang bisa dipromosikan ke roster utama.
// Tim AI juga punya akademi dengan logika serupa.

let akademiKita = {
    aktif: false,        // true kalau levelGH >= 2
    prospek: [],         // array pemain didikan akademi
    levelAkademi: 1,     // 1 = Dasar, 2 = Elite (levelGH 3)
    totalLulusan: 0
};

const NAMA_PROSPEK = [
    "Rafly","Dika","Bima","Aldo","Farhan","Rendi","Gilang",
    "Yoga","Kevin","Rizky","Fauzan","Daffa","Naufal","Rafif",
    "Arya","Bagas","Wahyu","Ilham","Yusuf","Hafiz","Dzaky",
    "Raka","Bintang","Galih","Satrio","Putra","Andra","Farel"
];

const ROLE_LIST = ["Roamer","Jungler","Midlaner","Goldlaner","EXP Laner"];

function namaProspekRandom() {
    return NAMA_PROSPEK[Math.floor(Math.random() * NAMA_PROSPEK.length)];
}

function roleRandom() {
    return ROLE_LIST[Math.floor(Math.random() * ROLE_LIST.length)];
}

function generateProspek(levelAkademi) {
    let baseOvr = levelAkademi >= 2 ? 58 : 50;
    let ovrRange = levelAkademi >= 2 ? 10 : 8;
    let ovr = baseOvr + Math.floor(Math.random() * ovrRange);
    let role = roleRandom();
    return {
        nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : namaProspekRandom(),
        role,
        ovr,
        mekanik: ovr - 2 + Math.floor(Math.random() * 5),
        makro: ovr - 2 + Math.floor(Math.random() * 5),
        mental: ovr - 3 + Math.floor(Math.random() * 6),
        stamina: Math.min(99, Math.max(50, ovr - 2 + Math.floor(Math.random() * 10))),
        spesialis: ovr,
        umur: 17 + Math.floor(Math.random() * 2),
        gaji: 3000000 + Math.floor(Math.random() * 2000000),
        harga: 8000000,
        sisaKontrak: 2,
        negara: (typeof benderaAkademiUntukRegion === "function")
                    ? benderaAkademiUntukRegion(typeof regionPlayer !== "undefined" ? regionPlayer : "ID")
                    : "🇮🇩 Indonesia",
        sifat: "Ambisius",
        dariAkademi: true,
        musimMasuk: musimKe
    };
}

// Dipanggil tiap akhir musim (offseason) untuk player
window.prosesAkademiPlayer = function() {
    if (levelGH < 2) {
        akademiKita.aktif = false;
        return;
    }
    akademiKita.aktif = true;
    akademiKita.levelAkademi = levelGH >= 3 ? 2 : 1;

    // Tiap musim hasilkan 1 prospek baru (maks 3 di akademi)
    if (akademiKita.prospek.length < 3) {
        let prospekBaru = generateProspek(akademiKita.levelAkademi);
        akademiKita.prospek.push(prospekBaru);
        tambahBerita(
            `🎓 Akademi: <span>${timPlayer}</span> menghasilkan prospek baru — ` +
 `<b>${prospekBaru.nama}</b> (${prospekBaru.role}, OVR ${prospekBaru.ovr}).`
        );
        tambahEmail(
            "Laporan Akademi",
            "Direktur Akademi",
            `Prospek baru dari akademi siap dievaluasi:<br>` +
            `<b>${prospekBaru.nama}</b> — ${prospekBaru.role}<br>` +
            `OVR: <b style="color:#5B3DF5;">${prospekBaru.ovr}</b> | Umur: ${prospekBaru.umur} tahun<br><br>` +
            `Buka menu <b>Fasilitas GH → Akademi</b> untuk mempromosikannya ke tim utama.`
        );
    }

    // Prospek yang sudah 2 musim tidak dipromosikan → keluar / masuk bursa
    akademiKita.prospek = akademiKita.prospek.filter(p => {
        let usiaDiAkademi = musimKe - (p.musimMasuk || musimKe);
        if (usiaDiAkademi >= 3) {
            // Prospek terlantar keluar ke bursa transfer
            pemainTransfer.push({ ...p, dariAkademi: false, harga: 10000000 });
            tambahBerita(
                `📤 Akademi: <span>${p.nama}</span> keluar dari akademi ${timPlayer} dan kini bebas di bursa transfer.`
            );
            return false;
        }
        return true;
    });
};

// Promosikan prospek ke roster utama
window.promosiProspek = function(index) {
    let p = akademiKita.prospek[index];
    if (!p) return;

    let gh = databaseGH[levelGH - 1];
    if (rosterKita.length >= gh.limitRoster) {
        bukaModal(
            "ROSTER PENUH! 🚫",
            `Kapasitas roster GH Level ${levelGH} sudah penuh (${gh.limitRoster} orang). ` +
            `Lepas pemain dulu atau upgrade GH.`,
            "#E5484D"
        );
        return;
    }

    rosterKita.push({ ...p });
    akademiKita.prospek.splice(index, 1);
    akademiKita.totalLulusan++;

    catatKas("MASUK", 0, `Promosi akademi: ${p.nama}`);
    tambahBerita(
        `⬆️ Promosi: <span>${p.nama}</span> resmi naik dari akademi ke skuad utama <span>${timPlayer}</span>.`
    );
    bukaModal(
        "PROMOSI BERHASIL! 🎉",
        `<b>${p.nama}</b> (${p.role}, OVR ${p.ovr}) kini resmi jadi bagian dari tim utama!`,
        "#00B37E"
    );
    renderFasilitas();
};

// Lepas prospek dari akademi (buang ke bursa)
window.lepasProspek = function(index) {
    let p = akademiKita.prospek[index];
    if (!p) return;
    akademiKita.prospek.splice(index, 1);
    pemainTransfer.push({ ...p, dariAkademi: false, harga: 10000000 });
    renderFasilitas();
};

// ==========================================
// AKADEMI TIM AI — dipanggil tiap offseason
// ==========================================
window.prosesAkademiAI = function() {
    let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
    semuaRegion.forEach(region => {
        region.forEach(tim => {
            if (tim.nama === timPlayer) return;
            if ((tim.levelGH || 1) < 2) return; // Butuh GH min level 2

            if (!tim.akademi) tim.akademi = { prospek: [] };

            // AI hasilkan 1 prospek per musim, maks 3
            if (tim.akademi.prospek.length < 3) {
                let lvlAk = (tim.levelGH || 1) >= 3 ? 2 : 1;
                tim.akademi.prospek.push(generateProspek(lvlAk));
            }

            // AI promosikan prospek kalau roster kurang dari 5
            let roleKosong = ROLE_LIST.filter(r => !tim.roster || !tim.roster.some(p => p.role === r));
            if (roleKosong.length > 0 && tim.akademi.prospek.length > 0) {
                let cocok = tim.akademi.prospek.findIndex(p => roleKosong.includes(p.role));
                let idx = cocok !== -1 ? cocok : 0;
                let dipromosikan = tim.akademi.prospek.splice(idx, 1)[0];
                if (!tim.roster) tim.roster = [];
                tim.roster.push({ ...dipromosikan });
            }

            // Prospek terlantar 3 musim → masuk bursa
            tim.akademi.prospek = tim.akademi.prospek.filter(p => {
                if ((musimKe - (p.musimMasuk || musimKe)) >= 3) {
                    pemainTransfer.push({ ...p, dariAkademi: false, harga: 10000000 });
                    return false;
                }
                return true;
            });
        });
    });
};

// ==========================================
// [FIX LINT] Ganti inline event handler yang pake variabel implisit
// `event` (dianggap TS sebagai window.event yang deprecated) jadi
// addEventListener biasa dengan parameter eksplisit. Aman ditaro di
// sini karena <script src="script.js"> dimuat SETELAH elemen-elemen
// ini ada di DOM (lihat urutan <script> di bagian bawah index.html).
// ==========================================
let elImportFile = document.getElementById("importFile");
if (elImportFile) {
    elImportFile.addEventListener("change", function (e) {
        prosesImport(e);
    });
}
let elModalBeritaBox = document.getElementById("modalBeritaBox");
if (elModalBeritaBox) {
    elModalBeritaBox.addEventListener("click", function (e) {
        e.stopPropagation();
    });
}

// ==========================================
// [NEW] MODAL KONFIRMASI UMUM — pengganti window.confirm() bawaan
// browser (yang muncul jelek banget di webview Acode, style-nya gak
// bisa disentuh). Dipakein dulu buat "Save & Keluar", tapi generik
// jadi bisa dipake ulang buat konfirmasi lain nantinya.
// [PENTING] Namanya sengaja "...Umum" -- BUKAN "tampilkanKonfirmasi"/
// "tutupKonfirmasi" polos, karena nama itu udah dipake duluan sama
// modal "Peringatan Jual Pemain" (lihat ui.js & #modalKonfirmasi di
// index.html). Jangan disamain, nanti dua modal itu tabrakan.
// ==========================================
let _callbackKonfirmasiUmumAktif = null;

window.tampilkanKonfirmasiUmum = function (judul, pesan, teksTombolYa, callbackYa) {
    getEl("konfirmasiUmumJudul").innerText = judul;
    getEl("konfirmasiUmumPesan").innerText = pesan;
    getEl("konfirmasiUmumBtnYa").innerText = teksTombolYa || "YA, LANJUT";
    _callbackKonfirmasiUmumAktif = callbackYa;
    getEl("modalKonfirmasiUmum").classList.remove("sembunyi");
};

window.tutupKonfirmasiUmum = function () {
    getEl("modalKonfirmasiUmum").classList.add("sembunyi");
    _callbackKonfirmasiUmumAktif = null;
};

window.eksekusiKonfirmasiUmum = function () {
    let cb = _callbackKonfirmasiUmumAktif;
    window.tutupKonfirmasiUmum();
    if (typeof cb === "function") cb();
};

// ==========================================
// [NEW] ERROR CATCHER — nangkep exception yang bikin game stuck/blank,
// biar user bisa screenshot pesan errornya dan kirim buat dilaporin.
// Dipasang 2 lapis:
//   1. Wrapper try/catch spesifik di klikTombolUtama (tombol "Hari
//      Berikutnya") -- kasih konteks paling jelas ("kejadian pas klik
//      Hari Berikutnya") karena ini titik paling berat/rawan.
//   2. window.onerror + unhandledrejection GLOBAL -- jaring pengaman
//      buat nangkep error dari titik LAIN mana pun di seluruh game,
//      kalau-kalau bukan di klikTombolUtama akar masalahnya.
// ==========================================

window.tampilkanErrorCatcher = function (err, konteks) {
    let pesan = (err && err.stack) ? err.stack : String(err);
    getEl("errorCatcherKonteks").innerText = konteks ? `Terjadi saat: ${konteks}` : "";
    getEl("errorCatcherPesan").innerText = pesan;
    getEl("modalErrorCatcher").classList.remove("sembunyi");
};

// --- Lapis 1: wrapper khusus tombol "Hari Berikutnya" ---
window._klikTombolUtamaAsli = window.klikTombolUtama;
window.klikTombolUtama = function () {
    try {
        window._klikTombolUtamaAsli();
    } catch (err) {
        console.error("[ERROR CATCHER] klikTombolUtama:", err);
        window.tampilkanErrorCatcher(err, "klik tombol 'Hari Berikutnya'");
    }
};

// --- Lapis 2: jaring pengaman global ---
window.addEventListener("error", function (event) {
    console.error("[ERROR CATCHER GLOBAL]", event.error || event.message);
    window.tampilkanErrorCatcher(
        event.error || event.message,
        `${event.filename ? event.filename.split("/").pop() : "?"}:${event.lineno || "?"}`
    );
});
window.addEventListener("unhandledrejection", function (event) {
    console.error("[ERROR CATCHER GLOBAL] unhandled promise rejection:", event.reason);
    window.tampilkanErrorCatcher(event.reason, "Promise async (unhandledrejection)");
});
