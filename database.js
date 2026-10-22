// ==========================================
// DATABASE.JS — DATA TIM & ROSTER
// Versi: 3.0 (Fase 1 — Liga & CEO System)
// ==========================================

let rosterKita = [];

// FUNGSI BUAT NGITUNG OVR OTOMATIS
function hitungOVRDatabase(p) {
    return Math.floor((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
}

// ==========================================
// --- TAMBAHAN NOMOR 2 MULAI DARI SINI ---
// ==========================================
const DATABASE_TARGET = {
    "Lolos Playoff":   { bobot: 1, diff: "Mudah", expOVR: 60 },
    "Top 6":           { bobot: 2, diff: "Normal", expOVR: 70 },
    "Top 4 MPL":       { bobot: 3, diff: "Normal", expOVR: 80 },
    "Final MPL":       { bobot: 4, diff: "Sulit", expOVR: 85 },
    "Juara MPL":       { bobot: 5, diff: "Sangat Sulit", expOVR: 90 },
    "Juara Dunia":     { bobot: 6, diff: "Ekstrem", expOVR: 95 }
};

// Fungsi untuk menghitung OVR Rata-rata Roster Tim Kita
function getOvrRosterKita() {
    if (!rosterKita || rosterKita.length === 0) return 60;
    let totalOvr = 0;
    rosterKita.forEach(p => totalOvr += p.ovr);
    return Math.floor(totalOvr / rosterKita.length);
}
// --- BATAS TAMBAHAN ---
// ==========================================

let staffKita = { pelatih: null, asisten: null, analis: null };

// ==========================================
// FASE 1 — KONSTANTA SISTEM LIGA & CEO
// ==========================================
// Catatan:
// - tipeSlot: "Franchise" untuk region ID/PH/MY (slot permanen, bisa diakuisisi/merger)
//             null untuk region SG (non-franchise, grassroots, promosi/degradasi murni)
// - indukMPL: diisi otomatis kalau tim ini adalah tim afiliasi tier-2 (Fase 2/3)
// - ceo: SEMUA tim punya CEO (termasuk SG), karena semua organisasi pasti ada yang
//        mengurus keuangan. Yang membedakan SG bukan soal CEO, tapi mekanisme
//        resolusi krisisnya (SG tidak punya slot franchise yang bisa di-merger/dijual,
//        jadi krisis di SG cuma berujung ke degradasi biasa, bukan merger/jual slot).
// - statusKeuangan: "SEHAT" | "PERINGATAN" | "KRISIS" | "KOLAPS" (dihitung ulang
//        oleh financial_ai_patch.js di Fase 5)
// ==========================================

// DATABASE TIM MPL ID (Power & Reputasi diupdate sesuai hasil real Season 17 2026)
let daftarTim = [
    {
        nama: "BTR",
        logo: "BTR.png",
        power: 87,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 3800000000,
        levelGH: 2,
        reputasi: 90,
        sponsorAI: { nama: "Tokopedia", tier: "A", pendapatanPerMusim: 70000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Fajar Pratama", umur: 44, keahlianFinansial: 100 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "ONIC",
        logo: "ONICID.png",
        power: 87,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 6000000000,
        levelGH: 3,
        reputasi: 88,
        sponsorAI: { nama: "Secretlab", tier: "S", pendapatanPerMusim: 160000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Kevin Halim", umur: 37, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "GEEK",
        logo: "GEEK.png",
        power: 84,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 3200000000,
        levelGH: 2,
        reputasi: 80,
        sponsorAI: { nama: "Tokopedia", tier: "A", pendapatanPerMusim: 65000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Iwan Pratama", umur: 45, keahlianFinansial: 85 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "TLID",
        logo: "TLID.png",
        power: 84,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 5000000000,
        levelGH: 3,
        reputasi: 82,
        sponsorAI: { nama: "Red Bull", tier: "A", pendapatanPerMusim: 100000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Teddy Saputra", umur: 40, keahlianFinansial: 75 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "DEWA",
        logo: "DEWA.png",
        power: 84,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 3500000000,
        levelGH: 2,
        reputasi: 70,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 40000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Dimas Nugroho", umur: 47, keahlianFinansial: 87 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "EVOS",
        logo: "EVOS.png",
        power: 83,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 4500000000,
        levelGH: 2,
        reputasi: 75,
        sponsorAI: { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 120000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Fauzi Ridwan", umur: 41, keahlianFinansial: 74 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "AE",
        logo: "AE.png",
        power: 82,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2500000000,
        levelGH: 2,
        reputasi: 68,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 35000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hendra Kurniawan", umur: 45, keahlianFinansial: 89 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "NAVI",
        logo: "NAVI.png",
        power: 81,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2000000000,
        levelGH: 1,
        reputasi: 58,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 12000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Dimas Wijaya", umur: 40, keahlianFinansial: 71 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "RRQ",
        logo: "RRQ.png",
        power: 81,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 5500000000,
        levelGH: 3,
        reputasi: 68,
        sponsorAI: { nama: "Red Bull", tier: "A", pendapatanPerMusim: 90000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "ID",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Jonathan Setiawan", umur: 39, keahlianFinansial: 80 },
        statusKeuangan: "SEHAT"
    }
];

// DATABASE TIM MPL PHILIPPINES (Power & Reputasi sesuai hasil real Season 17 2026)
let daftarTimPH = [
    {
        nama: "TLPH",
        logo: "TLPH.png",
        power: 89,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 6500000000,
        levelGH: 3,
        reputasi: 92,
        sponsorAI: { nama: "Secretlab", tier: "S", pendapatanPerMusim: 180000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Robert Tanoto", umur: 40, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Falcons",
        logo: "FLCN.png",
        power: 87,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 4800000000,
        levelGH: 3,
        reputasi: 85,
        sponsorAI: { nama: "Red Bull", tier: "A", pendapatanPerMusim: 90000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Erick Tan", umur: 39, keahlianFinansial: 79 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "ONIC PH",
        logo: "ONICPH.png",
        power: 88,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 4300000000,
        levelGH: 2,
        reputasi: 84,
        sponsorAI: { nama: "Red Bull", tier: "A", pendapatanPerMusim: 85000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Joko Hartono", umur: 48, keahlianFinansial: 93 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Aurora Gaming",
        logo: "RRA.png",
        power: 83,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 3600000000,
        levelGH: 2,
        reputasi: 80,
        sponsorAI: { nama: "Tokopedia", tier: "A", pendapatanPerMusim: 70000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hartanto Pranata", umur: 34, keahlianFinansial: 65 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "AP BREN",
        logo: "BREN.png",
        power: 83,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 5200000000,
        levelGH: 3,
        reputasi: 78,
        sponsorAI: { nama: "Samsung Galaxy", tier: "S", pendapatanPerMusim: 150000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Edwin Susanto", umur: 38, keahlianFinansial: 80 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Twisted Minds PH",
        logo: "TWIS.png",
        power: 83,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 68,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 28000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Robert Wong", umur: 38, keahlianFinansial: 80 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Smart Omega",
        logo: "OMG.png",
        power: 82,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2400000000,
        levelGH: 2,
        reputasi: 65,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 38000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Iwan Tjandra", umur: 48, keahlianFinansial: 89 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "TNC Pro Team",
        logo: "TNC.png",
        power: 81,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 55,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 12000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "PH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Steven Salim", umur: 43, keahlianFinansial: 96 },
        statusKeuangan: "SEHAT"
    }
];

// DATABASE TIM MPL MALAYSIA (Power & Reputasi sesuai hasil real Season 17 2026)
let daftarTimMY = [
    {
        nama: "Selangor Red Giants",
        logo: "SRG.png",
        power: 86,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 5000000000,
        levelGH: 3,
        reputasi: 85,
        sponsorAI: { nama: "Secretlab", tier: "S", pendapatanPerMusim: 140000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hendro Halim", umur: 44, keahlianFinansial: 96 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Vamos",
        logo: "VMS.png",
        power: 83,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 3800000000,
        levelGH: 2,
        reputasi: 78,
        sponsorAI: { nama: "Red Bull", tier: "A", pendapatanPerMusim: 85000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Fajar Hartono", umur: 40, keahlianFinansial: 80 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Invictus Gaming",
        logo: "IG.png",
        power: 81,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1900000000,
        levelGH: 1,
        reputasi: 66,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 28000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Bayu Tan", umur: 41, keahlianFinansial: 81 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Bigetron MY",
        logo: "BTRMY.png",
        power: 80,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1700000000,
        levelGH: 1,
        reputasi: 63,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 14000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hendra Permadi", umur: 45, keahlianFinansial: 91 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "RRQ Tora",
        logo: "RRQT.png",
        power: 79,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 60,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Marcus Tjandra", umur: 44, keahlianFinansial: 88 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Rey",
        logo: "REY.png",
        power: 78,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 58,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 12000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Bayu Salim", umur: 38, keahlianFinansial: 78 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "AC Esport",
        logo: "AC.png",
        power: 77,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 2,
        reputasi: 55,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 35000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Jonathan Setiawan", umur: 34, keahlianFinansial: 65 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Flash",
        logo: "FLH.png",
        power: 77,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 2,
        reputasi: 52,
        sponsorAI: { nama: "Tokopedia", tier: "A", pendapatanPerMusim: 65000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "MY",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Robert Tanoto", umur: 46, keahlianFinansial: 91 },
        statusKeuangan: "SEHAT"
    }
];

// DATABASE TIM MPL SINGAPORE (Non-franchise/grassroots — tipeSlot: null)
let daftarTimSG = [
    {
        nama: "RSG Singapore",
        logo: "RSG.png",
        power: 79,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 62,
        sponsorAI: { nama: "Kopi Kenangan", tier: "B", pendapatanPerMusim: 25000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "SG",
        tipeSlot: null,
        indukMPL: null,
        ceo: { nama: "Anton Setiawan", umur: 32, keahlianFinansial: 65 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Kingdom Esports",
        logo: "KING.png",
        power: 78,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 58,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 15000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "SG",
        tipeSlot: null,
        indukMPL: null,
        ceo: { nama: "Fajar Sutanto", umur: 42, keahlianFinansial: 90 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "EVIL",
        logo: "EVIL.png",
        power: 77,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 900000000,
        levelGH: 1,
        reputasi: 55,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 12000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "SG",
        tipeSlot: null,
        indukMPL: null,
        ceo: { nama: "Indra Salim", umur: 32, keahlianFinansial: 64 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Flash SG",
        logo: "FLH2.png",
        power: 75,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 800000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 10000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "SG",
        tipeSlot: null,
        indukMPL: null,
        ceo: { nama: "Rudi Nugroho", umur: 37, keahlianFinansial: 81 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Absolute Zero",
        logo: "AZ.png",
        power: 74,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 700000000,
        levelGH: 1,
        reputasi: 50,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 9000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "SG",
        tipeSlot: null,
        indukMPL: null,
        ceo: { nama: "Dimas Kusuma", umur: 46, keahlianFinansial: 95 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Ignite Gaming",
        logo: "IGN.png",
        power: 73,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 600000000,
        levelGH: 1,
        reputasi: 48,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 8000000 },
        // --- FASE 1: Data Liga & CEO ---
        liga: "MPL",
        region: "SG",
        tipeSlot: null,
        indukMPL: null,
        ceo: { nama: "Surya Hidayat", umur: 47, keahlianFinansial: 87 },
        statusKeuangan: "SEHAT"
    }
];


// ==========================================
// FASE 2 — DATABASE TIM MDL ID & LEN
// ==========================================
// MDL ID: 16 tim (8 Afiliasi MPL + 8 Independen) — Hybrid System
// Afiliasi kebal degradasi (tidak punya CEO sendiri, kas dikelola induk MPL)
// Independen bisa degradasi (punya CEO sendiri, kas mandiri)
// Klasemen MDL ID digabung jadi SATU (tidak dipisah) — deteksi degradasi
// dilakukan dengan filter tipeSlot === "Independen" saat hitung klasemen akhir musim
// ==========================================

// Tim Afiliasi MDL ID (8 tim, mengikuti franchise MPL ID)
let daftarTimMDL_Afiliasi_ID = [
    {
        nama: "RRQ Sena",
        logo: "RRQ Sena.png",
        power: 62,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 58,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "RRQ",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "ONIC Prime",
        logo: "ONIC Prime.png",
        power: 64,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 60,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "ONIC",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "EVOS Icon",
        logo: "EVOS Icon.png",
        power: 60,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 55,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "EVOS",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Alter Ego X",
        logo: "Alter Ego X.png",
        power: 58,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 52,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "AE",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Bigetron Academy",
        logo: "Bigetron Academy.png",
        power: 57,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 50,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "BTR",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Dewa United Heka",
        logo: "Dewa United Heka.png",
        power: 56,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 48,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "DEWA",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Geek Fam JR",
        logo: "Geek Fam JR.png",
        power: 55,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 46,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "GEEK",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Team Liquid Academy ID",
        logo: "Team Liquid Academy ID.png",
        power: 59,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 53,
        sponsorAI: null, // Afiliasi tidak punya sponsor sendiri, didanai induk
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Afiliasi",
        indukMPL: "TLID",
        ceo: null, // Tidak punya CEO sendiri — dikelola CEO induk MPL
        statusKeuangan: "DIKELOLA_INDUK"
    }
];

// Tim Independen MDL ID (8 tim, bisa degradasi via Playoff Degradasi BO5 vs LEN)
let daftarTimMDL_Independen_ID = [
    {
        nama: "Cosmic Frogs",
        logo: "Cosmic Frogs.png",
        power: 54,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 850000000,
        levelGH: 1,
        reputasi: 42,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3780000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Vincent Saputra", umur: 32, keahlianFinansial: 53 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Gryffin",
        logo: "Team Gryffin.png",
        power: 51,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 780000000,
        levelGH: 1,
        reputasi: 40,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3570000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Farhan Salim", umur: 29, keahlianFinansial: 48 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "NAVI Junior",
        logo: "NAVI Junior.png",
        power: 50,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 750000000,
        levelGH: 1,
        reputasi: 38,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3500000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Anton Pranata", umur: 35, keahlianFinansial: 51 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Kagendra",
        logo: "Kagendra.png",
        power: 48,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 700000000,
        levelGH: 1,
        reputasi: 36,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3360000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Robert Permadi", umur: 24, keahlianFinansial: 40 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Shadow Esports",
        logo: "Shadow Esports.png",
        power: 46,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 650000000,
        levelGH: 1,
        reputasi: 34,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3220000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Andre Kurniawan", umur: 33, keahlianFinansial: 56 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Ixon TRB",
        logo: "Ixon TRB.png",
        power: 44,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 620000000,
        levelGH: 1,
        reputasi: 32,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3080000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Budi Yulianto", umur: 34, keahlianFinansial: 63 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "PABZ Esports",
        logo: "PABZ Esports.png",
        power: 41,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 600000000,
        levelGH: 1,
        reputasi: 29,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2870000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Putra Kusuma", umur: 29, keahlianFinansial: 34 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "SMA Zion Mks",
        logo: "SMA Zion Mks.png",
        power: 38,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 600000000,
        levelGH: 1,
        reputasi: 26,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2660000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "MDL",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Dimas Sutanto", umur: 36, keahlianFinansial: 61 },
        statusKeuangan: "SEHAT"
    }
];

// Gabungan MDL ID (dipakai untuk simulasi/klasemen liga — satu klasemen gabungan)
let daftarTimMDL_ID = [...daftarTimMDL_Afiliasi_ID, ...daftarTimMDL_Independen_ID];

// ==========================================
// LEN — Liga Esports Nasional (9 tim, power 1-35)
// Tidak ada liga di bawahnya. Juara 1 & 2 LEN masuk Playoff Degradasi
// BO5 melawan bottom 2 tim Independen MDL ID di akhir musim
// ==========================================
let daftarTimLEN = [
    {
        nama: "Garuda Muda Esports",
        logo: "Garuda Muda Esports.png",
        power: 33,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 240000000,
        levelGH: 1,
        reputasi: 30,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 1650000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Rudi Kurniawan", umur: 29, keahlianFinansial: 34 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Nusantara United",
        logo: "Nusantara United.png",
        power: 30,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 220000000,
        levelGH: 1,
        reputasi: 27,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 1500000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Budi Wibowo", umur: 24, keahlianFinansial: 19 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Borneo Wildfire",
        logo: "Borneo Wildfire.png",
        power: 27,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 200000000,
        levelGH: 1,
        reputasi: 24,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 1350000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Agus Pratama", umur: 24, keahlianFinansial: 48 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Lokal Pride Gaming",
        logo: "Lokal Pride Gaming.png",
        power: 24,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 190000000,
        levelGH: 1,
        reputasi: 21,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 1200000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Yusuf Kusuma", umur: 36, keahlianFinansial: 62 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Sriwijaya Tigers",
        logo: "Sriwijaya Tigers.png",
        power: 21,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 180000000,
        levelGH: 1,
        reputasi: 18,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 1050000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "William Firmansyah", umur: 24, keahlianFinansial: 20 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Jakarta Rebels",
        logo: "Jakarta Rebels.png",
        power: 18,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 170000000,
        levelGH: 1,
        reputasi: 16,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 900000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Wahyu Permadi", umur: 22, keahlianFinansial: 1 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Bandung Vanguard",
        logo: "Bandung Vanguard.png",
        power: 15,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 160000000,
        levelGH: 1,
        reputasi: 14,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 750000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Agus Kurniawan", umur: 23, keahlianFinansial: 28 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Surabaya Phoenix",
        logo: "Surabaya Phoenix.png",
        power: 11,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 150000000,
        levelGH: 1,
        reputasi: 12,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 550000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "David Tanoto", umur: 35, keahlianFinansial: 51 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Akar Rumput Esports",
        logo: "Akar Rumput Esports.png",
        power: 8,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 150000000,
        levelGH: 1,
        reputasi: 10,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 400000 },
        // --- FASE 2: Data Liga & CEO ---
        liga: "LEN",
        region: "ID",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Jonathan Firmansyah", umur: 23, keahlianFinansial: 1 },
        statusKeuangan: "SEHAT"
    }
];


// ==========================================
// FASE 3 — DATABASE TIM MDL PHILIPPINES & MAL MALAYSIA
// ==========================================

// --- MDL PHILIPPINES (12 tim: 6 Afiliasi + 6 Independen) ---
// Struktur SAMA dengan MDL ID — satu klasemen gabungan.
// Catatan real: slot afiliasi BISA di-forfeit oleh tim MPL (contoh: AP.Bren),
// lalu direbut ulang lewat Open Qualifier musim berikutnya (Fase 12).

let daftarTimMDL_Afiliasi_PH = [
    {
        nama: "Team Liquid Academy PH",
        logo: ".png",
        power: 60,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 56,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Afiliasi",
        indukMPL: "TLPH",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Team Falcons Academy",
        logo: ".png",
        power: 58,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 53,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Afiliasi",
        indukMPL: "Team Falcons",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "ONIC Uprising",
        logo: ".png",
        power: 57,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 51,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Afiliasi",
        indukMPL: "ONIC PH",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Aurora Hunters Jr",
        logo: ".png",
        power: 55,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 48,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Afiliasi",
        indukMPL: "Aurora Gaming",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Dewa United PH Academy",
        logo: "w.png",
        power: 53,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 45,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Afiliasi",
        indukMPL: "AP BREN",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Twisted Minds RWE",
        logo: "w.png",
        power: 56,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 49,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Afiliasi",
        indukMPL: "Twisted Minds PH",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    }
];

let daftarTimMDL_Independen_PH = [
    {
        nama: "CU x Godz Quantum Minds",
        logo: ".png",
        power: 50,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 780000000,
        levelGH: 1,
        reputasi: 38,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3500000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Rian Susanto", umur: 40, keahlianFinansial: 74 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Raii x ROCK",
        logo: ".png",
        power: 48,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 740000000,
        levelGH: 1,
        reputasi: 36,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3360000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Andika Wirawan", umur: 30, keahlianFinansial: 59 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Martial Mayhem TM",
        logo: ".png",
        power: 46,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 700000000,
        levelGH: 1,
        reputasi: 34,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3220000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Marcus Rahman", umur: 33, keahlianFinansial: 54 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Exnihilo Esports",
        logo: ".png",
        power: 43,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 660000000,
        levelGH: 1,
        reputasi: 31,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3010000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Jonathan Saputra", umur: 27, keahlianFinansial: 33 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "TEAM FUEGO",
        logo: ".png",
        power: 40,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 620000000,
        levelGH: 1,
        reputasi: 28,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2800000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Hafiz Kusuma", umur: 25, keahlianFinansial: 45 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Lakan Esports",
        logo: ".png",
        power: 37,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 600000000,
        levelGH: 1,
        reputasi: 26,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2590000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MDL",
        region: "PH",
        tipeSlot: "Independen",
        indukMPL: null,
        ceo: { nama: "Hartanto Nugroho", umur: 30, keahlianFinansial: 47 },
        statusKeuangan: "SEHAT"
    }
];

let daftarTimMDL_PH = [...daftarTimMDL_Afiliasi_PH, ...daftarTimMDL_Independen_PH];

// --- MAL MALAYSIA (15 tim: 7 Affiliated Conference + 8 Challenger Conference) ---
// Struktur BERBEDA dari MDL ID/PH — 2 conference TERPISAH, tidak satu klasemen gabungan.
// Juara Challenger Conference -> LANGSUNG PROMOSI ke MPL MY (tanpa playoff lawan MPL).
// Runner-up Challenger -> 1 kesempatan tantang tim MPL MY posisi terbawah.
// Tidak ada liga tier-3/LEN-equivalent di Malaysia — Challenger = liga paling bawah.

let daftarTimMAL_Affiliated_MY = [
    {
        nama: "SRG Predator",
        logo: ".png",
        power: 60,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 55,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "Selangor Red Giants",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Vamos NXT",
        logo: ".png",
        power: 57,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 50,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "Team Vamos",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "IG Youth",
        logo: ".png",
        power: 54,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 46,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "Invictus Gaming",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Bigetron MY Academy",
        logo: ".png",
        power: 53,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 44,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "Bigetron MY",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "RRQ Tora Akademi",
        logo: ".png",
        power: 52,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 42,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "RRQ Tora",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Rey Esports Jr",
        logo: ".png",
        power: 50,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 40,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "Team Rey",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    },
    {
        nama: "Flash Talent",
        logo: ".png",
        power: 49,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 0, // Kas dikelola oleh CEO induk MPL, bukan kas mandiri
        levelGH: 1,
        reputasi: 38,
        sponsorAI: null,
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Afiliasi",
        indukMPL: "Team Flash",
        ceo: null,
        statusKeuangan: "DIKELOLA_INDUK"
    }
];

let daftarTimMAL_Challenger_MY = [
    {
        nama: "Penang Academy",
        logo: ".png",
        power: 48,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 780000000,
        levelGH: 1,
        reputasi: 36,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3360000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "William Yusof", umur: 36, keahlianFinansial: 62 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Monster Vicious",
        logo: ".png",
        power: 46,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 740000000,
        levelGH: 1,
        reputasi: 34,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3220000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "Steven Wirawan", umur: 26, keahlianFinansial: 36 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Sabah Wildcats",
        logo: ".png",
        power: 44,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 710000000,
        levelGH: 1,
        reputasi: 32,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 3080000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "Hartanto Kusuma", umur: 32, keahlianFinansial: 53 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Sarawak Tigers",
        logo: "w.png",
        power: 42,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 680000000,
        levelGH: 1,
        reputasi: 30,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2940000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "William Saputra", umur: 22, keahlianFinansial: 29 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Johor Falcons",
        logo: ".png",
        power: 40,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 650000000,
        levelGH: 1,
        reputasi: 28,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2800000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "Marcus Nugroho", umur: 32, keahlianFinansial: 52 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Ipoh Phantoms",
        logo: ".png",
        power: 38,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 620000000,
        levelGH: 1,
        reputasi: 26,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2660000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "Tommy Santoso", umur: 35, keahlianFinansial: 50 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Perak Raiders",
        logo: ".png",
        power: 36,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 600000000,
        levelGH: 1,
        reputasi: 24,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2520000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "Anton Pratama", umur: 30, keahlianFinansial: 38 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Kedah Knights",
        logo: ".png",
        power: 34,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 600000000,
        levelGH: 1,
        reputasi: 22,
        sponsorAI: { nama: "Konter Pulsa Barokah", tier: "C", pendapatanPerMusim: 2380000 },
        // --- FASE 3: Data Liga & CEO ---
        liga: "MAL",
        region: "MY",
        tipeSlot: "Challenger",
        indukMPL: null,
        ceo: { nama: "Hafiz Wijaya", umur: 27, keahlianFinansial: 37 },
        statusKeuangan: "SEHAT"
    }
];

// Catatan: TIDAK digabung jadi satu array seperti MDL ID/PH, karena
// Affiliated & Challenger Conference bertanding TERPISAH di Regular Season
// (baru ketemu di fase Playoff/akhir musim). Engine simulasi MAL MY (Fase 13)
// akan menangani 2 conference ini secara independen.

// ==========================================
// DATABASE SPONSOR 2.0 (TIER, REPUTASI, & KPI)
// ==========================================
let daftarSponsor = [
    // DARK MONEY (High Risk, High Reward) - Godaan Iman
    {
        nama: "Situs Judi E-sports (Ilegal)",
        bayar: 500000000,         // 500 Juta (Langsung kaya)
        bonusJuara: 0,
        minimalPower: 0,
        minimalReputasi: 0,       // Tim ampas diterima
        tier: "DARK",
        kpi: "NONE"
    },
    {
        nama: "Bandar Taruhan Online XYZ",
        bayar: 750000000,         // 750 Juta
        bonusJuara: 0,
        minimalPower: 0,
        minimalReputasi: 0,
        tier: "DARK",
        kpi: "NONE"
    },
    {
        nama: "Konsorsium Dana Gelap Asing",
        bayar: 1200000000,        // 1,2 Miliar (paling gede, paling beresiko)
        bonusJuara: 0,
        minimalPower: 0,
        minimalReputasi: 0,
        tier: "DARK",
        kpi: "NONE"
    },
    // TIER S (Sultan - Wajib Reputasi Tinggi)
    {
        nama: "Banyu Tengah Jok",
        bayar: 200000000,         // 200 Juta
        bonusJuara: 100000000,
        minimalPower: 80,
        minimalReputasi: 90,
        tier: "S",
        kpi: "JUARA_MPL"
    },
    {
        nama: "Secretlab",
        bayar: 180000000,         // 180 Juta
        bonusJuara: 90000000,
        minimalPower: 80,
        minimalReputasi: 85,
        tier: "S",
        kpi: "GRAND_FINAL"
    },
    // TIER A (Menengah Atas - Target Standar)
    {
        nama: "Red Bull",
        bayar: 100000000,         // 100 Juta
        bonusJuara: 50000000,
        minimalPower: 70,
        minimalReputasi: 65,
        tier: "A",
        kpi: "TOP_4"
    },
    {
        nama: "Tokopedia",
        bayar: 80000000,          // 80 Juta
        bonusJuara: 40000000,
        minimalPower: 65,
        minimalReputasi: 50,
        tier: "A",
        kpi: "LOLOS_PLAYOFF"
    },
    // TIER B (Menengah Bawah - Aman)
    {
        nama: "Kopi Kenangan",
        bayar: 40000000,          // 40 Juta
        bonusJuara: 15000000,
        minimalPower: 55,
        minimalReputasi: 35,
        tier: "B",
        kpi: "NONE"               // Gak ada target, santai
    },
    // TIER C (Tim Gurem / Perintis)
    {
        nama: "Konter Pulsa Barokah",
        bayar: 15000000,          // 15 Juta
        bonusJuara: 5000000,
        minimalPower: 0,
        minimalReputasi: 0,
        tier: "C",
        kpi: "NONE"
    }
];

// ==========================================
// MSC x EWC 2026 -- REGION BARU (FASE 1)
// 9 liga single-tier baru, disimulasikan mingguan format MPL PH
// (round-robin genap 8 tim, gak ada degradasi/tier-2).
// Roster & staff diisi programatik lewat generateRosterAIAwal()
// yang udah diperluas -- lihat script.js.
// ==========================================

let daftarTimKH = [
    {
        nama: "PRO Esports",
        logo: "PRO_Esports.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 68,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Petrov", umur: 39, keahlianFinansial: 78 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "CFU Gaming",
        logo: "CFU_Gaming.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 47,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Nikolai Santoso", umur: 35, keahlianFinansial: 57 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "See You Soon",
        logo: "See_You_Soon.png",
        power: 74,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 61,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Ahmad Volkov", umur: 41, keahlianFinansial: 77 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Burn x Flash",
        logo: "Burn_x_Flash.png",
        power: 74,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Samuel Alvi", umur: 35, keahlianFinansial: 79 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Galaxy Legends",
        logo: "Galaxy_Legends.png",
        power: 73,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 55,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Erik Petrov", umur: 45, keahlianFinansial: 58 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Max",
        logo: "Team_Max.png",
        power: 70,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 48,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Lucas Cruz", umur: 43, keahlianFinansial: 80 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Logic Esports",
        logo: "Logic_Esports.png",
        power: 72,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 62,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Mateus Rahman", umur: 52, keahlianFinansial: 64 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Angkor",
        logo: "Team_Angkor.png",
        power: 75,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 63,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "KH",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Carlos Santoso", umur: 42, keahlianFinansial: 79 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimKH = daftarTimKH;

let daftarTimMM = [
    {
        nama: "Yangon Galacticos",
        logo: "Yangon_Galacticos.png",
        power: 74,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Mateus Alvi", umur: 49, keahlianFinansial: 75 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Falcon Esports",
        logo: "Falcon_Esports.png",
        power: 75,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 56,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Giovanni Alvi", umur: 55, keahlianFinansial: 57 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Burmese Ghouls",
        logo: "Burmese_Ghouls.png",
        power: 77,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 62,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Farhan Khalid", umur: 47, keahlianFinansial: 63 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Mythic Seal",
        logo: "Mythic_Seal.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 66,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Budi Petrov", umur: 36, keahlianFinansial: 80 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team 7",
        logo: "Team_7.png",
        power: 73,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 53,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Giovanni Cruz", umur: 45, keahlianFinansial: 61 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Phoenix Esports",
        logo: "Phoenix_Esports.png",
        power: 73,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 65,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Erik Alvi", umur: 39, keahlianFinansial: 62 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "KOS Esports",
        logo: "KOS_Esports.png",
        power: 75,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 53,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Nikolai Cruz", umur: 47, keahlianFinansial: 66 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Venom MM",
        logo: "Venom_MM.png",
        power: 72,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 61,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "MM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Carlos Santoso", umur: 38, keahlianFinansial: 59 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimMM = daftarTimMM;

let daftarTimMENA = [
    {
        nama: "Geekay Esports",
        logo: "Geekay_Esports.png",
        power: 73,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 64,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Mateus Rossi", umur: 54, keahlianFinansial: 69 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Falcons",
        logo: "Team_Falcons.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 62,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Diego Volkov", umur: 43, keahlianFinansial: 79 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Twisted Minds",
        logo: "Twisted_Minds.png",
        power: 72,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 54,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Farhan Khalid", umur: 35, keahlianFinansial: 85 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "AXE Esports",
        logo: "AXE_Esports.png",
        power: 70,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 69,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Qasim Rahman", umur: 55, keahlianFinansial: 64 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Triple Esports",
        logo: "Triple_Esports.png",
        power: 69,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 51,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Lucas Silva", umur: 52, keahlianFinansial: 85 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "R8 Esports",
        logo: "R8_Esports.png",
        power: 68,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 64,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Pavel Santoso", umur: 38, keahlianFinansial: 84 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Vision Esports",
        logo: "Vision_Esports.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Cruz", umur: 37, keahlianFinansial: 57 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "The Ultimates",
        logo: "The_Ultimates.png",
        power: 67,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 69,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "MENA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Erik Silva", umur: 50, keahlianFinansial: 85 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimMENA = daftarTimMENA;

let daftarTimTR = [
    {
        nama: "Aurora Turkiye",
        logo: "Aurora_Turkiye.png",
        power: 88,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 73,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Tariq Rossi", umur: 41, keahlianFinansial: 84 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Papara SuperMassive",
        logo: "Papara_SuperMassive.png",
        power: 74,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 67,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Mateus Hidayat", umur: 49, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "FUT Esports",
        logo: "FUT_Esports.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 48,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Rahman", umur: 45, keahlianFinansial: 55 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Fire Flux Esports",
        logo: "Fire_Flux_Esports.png",
        power: 73,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Santoso", umur: 37, keahlianFinansial: 77 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "BoostGate Esports",
        logo: "BoostGate_Esports.png",
        power: 69,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 47,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Kenji Rahman", umur: 51, keahlianFinansial: 62 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "S2G Esports",
        logo: "S2G_Esports.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 51,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Erik Cruz", umur: 53, keahlianFinansial: 70 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "FastPay Wildcats",
        logo: "FastPay_Wildcats.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 70,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Giovanni Rahman", umur: 38, keahlianFinansial: 76 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Digital Athletics",
        logo: "Digital_Athletics.png",
        power: 71,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 58,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "TR",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Omar Santoso", umur: 55, keahlianFinansial: 75 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimTR = daftarTimTR;

let daftarTimEECA = [
    {
        nama: "Team Spirit",
        logo: "Team_Spirit.png",
        power: 61,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 57,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Diego Petrov", umur: 41, keahlianFinansial: 61 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Virtus.pro",
        logo: "Virtuspro.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 49,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Farhan Alvi", umur: 49, keahlianFinansial: 62 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Deus Vult",
        logo: "Deus_Vult.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 70,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Diego Santoso", umur: 55, keahlianFinansial: 72 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "HYDRA",
        logo: "HYDRA.png",
        power: 68,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 69,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Farhan Rossi", umur: 50, keahlianFinansial: 70 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "FORZE",
        logo: "FORZE.png",
        power: 64,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 46,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Mateus Santoso", umur: 47, keahlianFinansial: 63 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Insilio",
        logo: "Insilio.png",
        power: 62,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 58,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Pavel Silva", umur: 41, keahlianFinansial: 64 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Major Pride",
        logo: "Major_Pride.png",
        power: 74,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 63,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Budi Hidayat", umur: 36, keahlianFinansial: 56 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "OneMove",
        logo: "OneMove.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 61,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "EECA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Farhan Santoso", umur: 51, keahlianFinansial: 57 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimEECA = daftarTimEECA;

let daftarTimEA = [
    {
        nama: "Guangzhou Gaming",
        logo: "Guangzhou_Gaming.png",
        power: 63,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 64,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Rossi", umur: 38, keahlianFinansial: 85 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "YBINGAME",
        logo: "YBINGAME.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 63,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Budi Cruz", umur: 37, keahlianFinansial: 68 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "DFYG",
        logo: "DFYG.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 61,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Ivan Petrov", umur: 45, keahlianFinansial: 62 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "ZETA DIVISION",
        logo: "ZETA_DIVISION.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 49,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Omar Hidayat", umur: 37, keahlianFinansial: 55 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Niightmare Esports",
        logo: "Niightmare_Esports.png",
        power: 62,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 63,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Carlos Volkov", umur: 41, keahlianFinansial: 71 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Zone",
        logo: "Team_Zone.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 56,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Hidayat", umur: 44, keahlianFinansial: 60 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Crazy Raccoon",
        logo: "Crazy_Raccoon.png",
        power: 63,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 67,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Tariq Volkov", umur: 35, keahlianFinansial: 76 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "T1 MLBB",
        logo: "T1_MLBB.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 66,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "EA",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Erik Alvi", umur: 38, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimEA = daftarTimEA;

let daftarTimAM = [
    {
        nama: "Entity7",
        logo: "Entity7.png",
        power: 61,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 49,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Jamal Cruz", umur: 41, keahlianFinansial: 77 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Alpha7 Esports",
        logo: "Alpha7_Esports.png",
        power: 68,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 66,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Qasim Khalid", umur: 43, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Leviatan",
        logo: "Leviatan.png",
        power: 69,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 65,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Ivan Santoso", umur: 35, keahlianFinansial: 65 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "9z Globant",
        logo: "9z_Globant.png",
        power: 62,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 50,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Rizky Rossi", umur: 52, keahlianFinansial: 55 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Influence Rage",
        logo: "Influence_Rage.png",
        power: 61,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 67,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Rizky Santoso", umur: 46, keahlianFinansial: 73 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Black Sentence",
        logo: "Black_Sentence.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 58,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Budi Alvi", umur: 46, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "RRQ Akira",
        logo: "RRQ_Akira.png",
        power: 62,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 51,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Diego Hidayat", umur: 52, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Maycam Evolve",
        logo: "Maycam_Evolve.png",
        power: 63,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 68,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "AM",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Silva", umur: 40, keahlianFinansial: 83 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimAM = daftarTimAM;

let daftarTimIN = [
    {
        nama: "True Rippers",
        logo: "True_Rippers.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 50,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Nikolai Petrov", umur: 43, keahlianFinansial: 60 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "GodLike Esports",
        logo: "GodLike_Esports.png",
        power: 64,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 46,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Hassan Petrov", umur: 49, keahlianFinansial: 66 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "S8UL Esports",
        logo: "S8UL_Esports.png",
        power: 63,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Giovanni Rossi", umur: 45, keahlianFinansial: 63 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Orangutan",
        logo: "Orangutan.png",
        power: 63,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 56,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Mateus Volkov", umur: 45, keahlianFinansial: 85 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Marcos Gaming",
        logo: "Marcos_Gaming.png",
        power: 68,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 53,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Samuel Alvi", umur: 36, keahlianFinansial: 58 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Revenant XSpark",
        logo: "Revenant_XSpark.png",
        power: 67,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2200000000,
        levelGH: 1,
        reputasi: 56,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Nikolai Cruz", umur: 51, keahlianFinansial: 58 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Tamilas",
        logo: "Team_Tamilas.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 51,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Budi Rossi", umur: 35, keahlianFinansial: 71 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Chemin Esports",
        logo: "Chemin_Esports.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 56,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "IN",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Carlos Hidayat", umur: 54, keahlianFinansial: 65 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimIN = daftarTimIN;

let daftarTimWEU = [
    {
        nama: "Team Codenets",
        logo: "Team_Codenets.png",
        power: 61,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 61,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Nikolai Hidayat", umur: 47, keahlianFinansial: 77 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Sunset Ravens",
        logo: "Sunset_Ravens.png",
        power: 63,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 49,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Nikolai Rossi", umur: 40, keahlianFinansial: 74 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Victory Song Gamers",
        logo: "Victory_Song_Gamers.png",
        power: 64,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 57,
        sponsorAI: { nama: "Global Tech Partner", tier: "A", pendapatanPerMusim: 60000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Ahmad Alvi", umur: 44, keahlianFinansial: 61 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "King of Gamers Club",
        logo: "King_of_Gamers_Club.png",
        power: 61,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 64,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Omar Khalid", umur: 49, keahlianFinansial: 76 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Bionic Esports",
        logo: "Bionic_Esports.png",
        power: 64,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 2800000000,
        levelGH: 1,
        reputasi: 60,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Carlos Alvi", umur: 51, keahlianFinansial: 76 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "BloodThirstyKings",
        logo: "BloodThirstyKings.png",
        power: 62,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1800000000,
        levelGH: 1,
        reputasi: 47,
        sponsorAI: { nama: "Regional Energy Drink", tier: "B", pendapatanPerMusim: 35000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Jamal Petrov", umur: 41, keahlianFinansial: 59 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "Team Occupy",
        logo: "Team_Occupy.png",
        power: 65,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1200000000,
        levelGH: 1,
        reputasi: 52,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Tariq Rahman", umur: 49, keahlianFinansial: 68 },
        statusKeuangan: "SEHAT"
    },
    {
        nama: "GenZ Esports",
        logo: "GenZ_Esports.png",
        power: 66,
        matchW: 0, matchL: 0, gameW: 0, gameL: 0, poin: 0, netGame: 0,
        kas: 1500000000,
        levelGH: 1,
        reputasi: 67,
        sponsorAI: { nama: "Local Telco", tier: "C", pendapatanPerMusim: 18000000 },
        liga: "MPL",
        region: "WEU",
        tipeSlot: "Franchise",
        indukMPL: null,
        ceo: { nama: "Pavel Rossi", umur: 42, keahlianFinansial: 59 },
        statusKeuangan: "SEHAT"
    },
];
window.daftarTimWEU = daftarTimWEU;
