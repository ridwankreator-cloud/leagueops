// ==========================================
// FINANCIAL_AI_PATCH.JS
// FASE 5 — Gaji Roster AI + Modifier CEO + Early Warning Runway
// ==========================================
//
// Latar belakang (hasil audit sebelum Fase 5):
// Tim AI sudah bayar gaji staff & sewa GH tiap akhir musim (di prosesTransferAI,
// script.js), TAPI gaji ROSTER PEMAIN tidak pernah dipotong dari kas tim AI.
// Akibatnya tim AI tidak pernah benar-benar "boncos" karena beban terbesarnya
// tidak dihitung. Patch ini menutup gap tersebut, sekaligus menambahkan
// modifier CEO (efisiensi pengeluaran, bonus sponsor, sensitivitas deteksi
// krisis) dan sistem status keuangan berbasis runway yang sudah disepakati
// di rangkuman desain.
//
// File ini HARUS dimuat SETELAH database.js & script.js, SEBELUM
// pemanggilan prosesEkosistemAI() pertama kali (lihat index.html).
// ==========================================

// ------------------------------------------------------------------
// [5.1] HELPER — Ambil semua tim AI relevan untuk pengecekan finansial
// (MPL ID/PH/MY/SG + MDL/MAL Independen & Challenger — AFILIASI DIKECUALIKAN
// karena tidak punya kas/CEO mandiri, kasnya nempel ke induk MPL)
// ------------------------------------------------------------------
function ambilSemuaTimFinansialAI() {
    let daftar = [];

    // MPL — semua region (termasuk SG, karena SG tetap punya CEO & status
    // keuangan sendiri meski tidak punya mekanisme franchise/merger)
    [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG].forEach(region => {
        region.forEach(t => daftar.push(t));
    });

    // MDL/MAL Independen & Challenger (punya kas & CEO mandiri)
    if (typeof daftarTimMDL_Independen_ID !== "undefined") daftar.push(...daftarTimMDL_Independen_ID);
    if (typeof daftarTimMDL_Independen_PH !== "undefined") daftar.push(...daftarTimMDL_Independen_PH);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") daftar.push(...daftarTimMAL_Challenger_MY);

    // LEN
    if (typeof daftarTimLEN !== "undefined") daftar.push(...daftarTimLEN);

    // [MSC x EWC 2026 - FASE 4] 9 region single-tier baru -- aman diproses
    // sekarang karena eksekusiKolaps() udah punya jalur resolusi sendiri
    // (auto-investor), gak akan nyangkut di KOSONG_FRANCHISE tanpa jalan keluar.
    REGION_SINGLE_TIER_BARU.forEach(kode => {
        let arr = window["daftarTim" + kode];
        if (arr) daftar.push(...arr);
    });

    return daftar.filter(t => t.nama !== timPlayer);
}

// ------------------------------------------------------------------
// [5.2] MODIFIER CEO — efisiensi pengeluaran, bonus sponsor, deteksi krisis
// Sesuai tabel yang sudah disepakati:
//   85-100 -> hemat 15% / +20% sponsor / deteksi EARLY (runway 8 bln)
//   60-84  -> normal       / normal     / deteksi NORMAL (runway 6 bln)
//   35-59  -> boros 15%   / -15% sponsor / deteksi LATE (runway 3 bln)
//   1-34   -> boros 30%   / -30% sponsor / deteksi BLIND (kas minus dulu)
// ------------------------------------------------------------------
function modifierCEO(tim) {
    // Tim afiliasi (ceo: null) pakai modifier netral — kasnya toh dikelola induk
    let keahlian = (tim.ceo && typeof tim.ceo.keahlianFinansial === "number")
        ? tim.ceo.keahlianFinansial
        : 50;

    let efisiensi, bonusSponsor, deteksiKrisis, thresholdPeringatan, thresholdKrisis;

    if (keahlian >= 85) {
        efisiensi = 0.85; bonusSponsor = 1.20; deteksiKrisis = "EARLY";
        thresholdPeringatan = 8; thresholdKrisis = 4;
    } else if (keahlian >= 60) {
        efisiensi = 1.00; bonusSponsor = 1.00; deteksiKrisis = "NORMAL";
        thresholdPeringatan = 6; thresholdKrisis = 3;
    } else if (keahlian >= 35) {
        efisiensi = 1.15; bonusSponsor = 0.85; deteksiKrisis = "LATE";
        thresholdPeringatan = 3; thresholdKrisis = 1.5;
    } else {
        efisiensi = 1.30; bonusSponsor = 0.70; deteksiKrisis = "BLIND";
        // CEO BLIND tidak punya early warning sama sekali — threshold
        // peringatan disamakan dengan threshold krisis (tidak ada masa "ancang-ancang")
        thresholdPeringatan = 0; thresholdKrisis = 0;
    }

    return { keahlian, efisiensi, bonusSponsor, deteksiKrisis, thresholdPeringatan, thresholdKrisis };
}

// ------------------------------------------------------------------
// [5.3] HITUNG BEBAN BULANAN TIM (gaji roster + gaji staff + sewa GH)
// Beban dikalikan modifier efisiensi CEO (CEO jago = beban efektif lebih kecil)
// ------------------------------------------------------------------
const SEWA_GH_TABEL = { 1: 25000000, 2: 75000000, 3: 150000000 };

function hitungBebanBulananAI(tim) {
    let gajiRoster = (tim.roster || []).reduce((total, p) => total + (p.gaji || 0), 0);

    let gajiStaff = 0;
    if (tim.staff) {
        ["pelatih", "asisten", "analis"].forEach(role => {
            if (tim.staff[role]) gajiStaff += tim.staff[role].gaji || 0;
        });
    }

    let sewaGH = SEWA_GH_TABEL[tim.levelGH || 1] || SEWA_GH_TABEL[1];

    let bebanKotor = gajiRoster + gajiStaff + sewaGH;
    let mod = modifierCEO(tim);
    let bebanEfektif = Math.floor(bebanKotor * mod.efisiensi);

    return { gajiRoster, gajiStaff, sewaGH, bebanKotor, bebanEfektif, modifierCEO: mod };
}

// ------------------------------------------------------------------
// [5.4] BAYAR GAJI ROSTER AI — gap utama yang ditambal di Fase 5
// Dipanggil tiap akhir musim, SEBELUM cek status keuangan, supaya status
// yang dihitung mencerminkan kondisi kas SETELAH gaji dibayar.
// ------------------------------------------------------------------
function bayarGajiRosterAI(tim) {
    let beban = hitungBebanBulananAI(tim);

    // CEO efisien -> beban gaji roster ikut lebih hemat (bukan cuma sewa GH/staff)
    let gajiRosterEfektif = Math.floor(beban.gajiRoster * beban.modifierCEO.efisiensi);
    tim.kas = (tim.kas || 0) - gajiRosterEfektif;

    return gajiRosterEfektif;
}

// ------------------------------------------------------------------
// [5.5] STATUS KEUANGAN BERBASIS RUNWAY + SENSITIVITAS CEO
// Catatan penting soal CEO "BLIND": mereka TIDAK dapat status PERINGATAN
// sama sekali — beralih langsung dari SEHAT ke KRISIS begitu kas tipis,
// merepresentasikan CEO yang gagal melihat tanda-tanda bahaya lebih awal.
// ------------------------------------------------------------------
function cekStatusKeuanganAI(tim) {
    let beban = hitungBebanBulananAI(tim);
    let bebanBulanan = beban.bebanEfektif > 0 ? beban.bebanEfektif : 1; // hindari div/0
    let runway = (tim.kas || 0) / bebanBulanan;
    let mod = beban.modifierCEO;

    if ((tim.kas || 0) < 0) return "KOLAPS";

    if (mod.deteksiKrisis === "BLIND") {
        // CEO BLIND: tidak ada status PERINGATAN, baru sadar pas kas sudah sangat tipis
        if (runway < 1.5 && (tim.reputasi || 50) < 40) return "KRISIS";
        return "SEHAT";
    }

    if (runway < mod.thresholdKrisis && (tim.reputasi || 50) < 40) return "KRISIS";
    if (runway < mod.thresholdPeringatan) return "PERINGATAN";
    return "SEHAT";
}

// ------------------------------------------------------------------
// [5.6] SPONSOR DENGAN MODIFIER CEO
// Membungkus prosesSponsorMusimAI (script.js) — dipanggil SETELAH fungsi
// asli, untuk menambahkan bonus/penalti dari keahlian CEO tanpa mengubah
// fungsi originalnya (supaya tidak ada konflik logic ganda).
// ------------------------------------------------------------------
function terapkanBonusSponsorCEO() {
    let daftar = ambilSemuaTimFinansialAI();
    daftar.forEach(tim => {
        if (!tim.sponsorAI) return;
        let mod = modifierCEO(tim);
        if (mod.bonusSponsor === 1.00) return; // CEO normal, tidak perlu adjustment tambahan

        // bonusSponsor sudah factor-in di income musim ini lewat selisih kecil,
        // supaya tidak dobel dengan formula reputasi/OVR yang sudah ada di
        // prosesSponsorMusimAI(). Kita terapkan sebagai penyesuaian RINGAN
        // ke kas (selisih dari bonus/penalti CEO atas pendapatan dasar sponsor).
        let pendapatanDasar = tim.sponsorAI.pendapatanPerMusim || 0;
        let selisih = Math.floor(pendapatanDasar * (mod.bonusSponsor - 1.00));
        tim.kas = (tim.kas || 0) + selisih;
    });
}

// ------------------------------------------------------------------
// [5.7] FUNGSI UTAMA — dipanggil tiap akhir musim (offseason)
// Urutan: bayar gaji roster -> bonus/penalti sponsor CEO -> update status
// keuangan tiap tim -> catat tim yang baru masuk PERINGATAN/KRISIS/KOLAPS
// supaya bisa dipakai sistem notifikasi & resolusi krisis di Fase 6.
// ------------------------------------------------------------------
function prosesFinansialAI() {
    let daftar = ambilSemuaTimFinansialAI();
    let ringkasanPerubahan = []; // { tim, statusLama, statusBaru }

    // 1. Bayar gaji roster (gap utama Fase 5)
    daftar.forEach(tim => {
        bayarGajiRosterAI(tim);
    });

    // 2. Bonus/penalti sponsor dari keahlian CEO
    terapkanBonusSponsorCEO();

    // 3. Update status keuangan tiap tim & catat perubahan status
    daftar.forEach(tim => {
        // [FIX] Slot KOSONG_FRANCHISE (tim yang udah kolaps, nunggu diklaim)
        // JANGAN dievaluasi ulang -- sebelumnya kena baca ulang kayak tim
        // normal (kas=0 kebaca "krisis biasa"), diam-diam berubah jadi
        // PERINGATAN musim berikutnya dan ngerusak penanda "kosong"-nya.
        // Statusnya cuma boleh berubah lewat eksekusiKlaimSlotKosong().
        if (tim.statusKeuangan === "KOSONG_FRANCHISE") return;

        let statusLama = tim.statusKeuangan || "SEHAT";
        let statusBaru = cekStatusKeuanganAI(tim);
        tim.statusKeuangan = statusBaru;

        if (statusLama !== statusBaru) {
            ringkasanPerubahan.push({ tim, statusLama, statusBaru });
        }
    });

    // 4. Beritahu lewat sistem berita yang sudah ada (kalau tersedia)
    if (typeof tambahBerita === "function") {
        ringkasanPerubahan.forEach(({ tim, statusLama, statusBaru }) => {
            if (statusBaru === "PERINGATAN" && statusLama === "SEHAT") {
                tambahBerita(`⚠️ Peringatan Finansial: <span>${tim.nama}</span> mulai kesulitan menutupi beban operasional musim ini.`);
            } else if (statusBaru === "KRISIS") {
                tambahBerita(`🔴 Krisis Finansial: <span>${tim.nama}</span> dilaporkan dalam kondisi keuangan kritis.`);
            } else if (statusBaru === "KOLAPS") {
                tambahBerita(`💀 Kolaps: <span>${tim.nama}</span> resmi kehabisan kas dan tidak mampu membayar kewajiban operasional.`);
            } else if (statusBaru === "SEHAT" && (statusLama === "PERINGATAN" || statusLama === "KRISIS")) {
                tambahBerita(`✅ Pemulihan: <span>${tim.nama}</span> berhasil keluar dari masa sulit dan kembali stabil secara finansial.`);
            }
        });
    }

    return ringkasanPerubahan; // dipakai Fase 6 untuk trigger resolusi krisis
}

// ==========================================
// CATATAN INTEGRASI:
// Panggilan prosesFinansialAI() ditambahkan ke dalam prosesEkosistemAI()
// di script.js (lihat patch baris di bawah komentar "=== SISTEM EKOSISTEM AI v2.0 ===").
// Fase 6 akan memakai return value dari prosesFinansialAI() (ringkasanPerubahan)
// untuk menjalankan resolusi krisis (merger/jual slot/kolaps) secara otomatis.
// ==========================================


// ==========================================
// FASE 6 — SISTEM KRISIS, MERGER, KOLAPS OTOMATIS
// ==========================================
//
// Aturan main (sesuai rangkuman desain final):
// - Player TIDAK BISA intervensi. Semua resolusi otomatis.
// - PERINGATAN -> AI jual pemain OVR rendah + cari sponsor baru (sudah ada
//   sebagian di prosesTransferAI/script.js; di sini kita tambah jual 1
//   pemain OVR terendah sebagai respons spesifik status PERINGATAN).
// - KRISIS (tim FRANCHISE: MPL ID/PH/MY, atau tier-2 Independen/Challenger
//   yang punya "slot" konsepnya) -> cari pembeli; ada pembeli -> random
//   MERGER atau JUAL SLOT; tidak ada pembeli -> KOLAPS.
// - KRISIS (tim NON-FRANCHISE: MPL SG) -> TIDAK ada merger/jual slot
//   (karena tidak ada slot permanen yang bisa ditransaksikan). Resolusinya
//   cuma jual paksa beberapa pemain; kalau tetap krisis dalam waktu lama,
//   ujung2nya didegradasi lewat sistem klasemen biasa (bukan modul ini).
// - KOLAPS -> semua pemain jadi Free Agent (masuk pemainTransfer), staff
//   hilang, CEO pergi (resign), slot MPL kosong & bisa diakuisisi/merger
//   player (Fase 9). Untuk tier-2/LEN, "kolaps" cukup reset tim (roster
//   baru, kas baru) karena tidak ada mekanisme akuisisi slot di liga itu.
// ==========================================

// ------------------------------------------------------------------
// [6.1] DAFTAR TIM FRANCHISE — slot permanen, BISA merger/jual slot
// (MPL ID/PH/MY). MPL SG SENGAJA TIDAK dimasukkan -> non-franchise.
// ------------------------------------------------------------------
const REGION_SINGLE_TIER_BARU = ["KH", "MM", "MENA", "TR", "EECA", "EA", "AM", "IN", "WEU"];
window.REGION_SINGLE_TIER_BARU = REGION_SINGLE_TIER_BARU;

function timBisaMergerJualSlot(tim) {
    if (!tim) return false;
    // [MSC x EWC 2026 - FASE 4] 9 region baru single-tier TIDAK ikut jalur
    // franchise (KOSONG_FRANCHISE nunggu player) -- mereka gak punya tier-2
    // feeder (Q12), jadi kolaps diresolusi otomatis lewat auto-investor.
    if (REGION_SINGLE_TIER_BARU.includes(tim.region)) return false;
    // MPL franchise (ID/PH/MY) -> slot permanen, bisa merger/jual
    if (tim.liga === "MPL" && tim.region !== "SG") return true;
    return false;
}

// ------------------------------------------------------------------
// [6.2] RESPONS STATUS "PERINGATAN" — jual 1 pemain OVR terendah
// (pelengkap dari logika existing di prosesTransferAI, fokus ke
// kontribusi spesifik status keuangan, bukan kapasitas roster)
// ------------------------------------------------------------------
function responsPeringatanAI(tim) {
    if (!tim.roster || tim.roster.length <= 5) return; // jangan jual sampai di bawah 5 (starter minimal)

    let rosterUrutOVR = [...tim.roster].sort((a, b) => (a.ovr || 0) - (b.ovr || 0));
    let targetJual = rosterUrutOVR[0];
    if (!targetJual) return;

    let hargaJual = Math.floor((targetJual.harga || (targetJual.gaji || 5000000) * 1.5) * 0.8);
    tim.kas = (tim.kas || 0) + hargaJual;
    tim.roster = tim.roster.filter(p => p !== targetJual);
    targetJual.sisaKontrak = 2;
    targetJual.harga = hargaJual;
    if (typeof pemainTransfer !== "undefined") pemainTransfer.push(targetJual);
}

// ------------------------------------------------------------------
// [6.3] CARI PEMBELI SLOT — simulasikan apakah ada investor yang mau
// masuk. Probabilitas pembeli dipengaruhi seberapa parah krisisnya
// (semakin negatif kas relatif terhadap beban, semakin kecil minat beli)
// ------------------------------------------------------------------
function adaPembeliSlot(tim) {
    let beban = hitungBebanBulananAI(tim);
    let bebanBulanan = beban.bebanEfektif > 0 ? beban.bebanEfektif : 1;
    let rasioKas = (tim.kas || 0) / bebanBulanan; // makin negatif, makin parah

    // Reputasi tim juga jadi faktor -- tim dgn nama besar lebih menarik dibeli
    // meski lagi krisis, dibanding tim kecil tak dikenal
    let reputasi = tim.reputasi || 50;
    let probabilitasDasar = 0.55;
    let modifierReputasi = (reputasi - 50) * 0.004; // tiap 10 poin reputasi -> +-4%
    let modifierKeparahan = rasioKas < -3 ? -0.25 : rasioKas < -1 ? -0.10 : 0;

    let probabilitas = Math.max(0.1, Math.min(0.9, probabilitasDasar + modifierReputasi + modifierKeparahan));
    return Math.random() < probabilitas;
}

// ------------------------------------------------------------------
// [6.4] EKSEKUSI MERGER — nama/logo tim berubah, sebagian roster
// dipertahankan (OVR >= 75), sisanya jadi Free Agent. Slot MPL tetap.
// ------------------------------------------------------------------
function eksekusiMerger(tim) {
    let namaLama = tim.nama;
    let namaBaru = namaLama + " X"; // penanda merger sederhana; bisa diperkaya nanti (pool nama investor)

    let rosterDipertahankan = [];
    let rosterDilepas = [];
    (tim.roster || []).forEach(p => {
        if ((p.ovr || 0) >= 75) rosterDipertahankan.push(p);
        else rosterDilepas.push(p);
    });

    rosterDilepas.forEach(p => {
        p.sisaKontrak = 2;
        p.harga = Math.floor((p.harga || (p.gaji || 5000000) * 1.5) * 0.7);
        if (typeof pemainTransfer !== "undefined") pemainTransfer.push(p);
    });

    tim.nama = namaBaru;
    tim.roster = rosterDipertahankan;
    tim.reputasi = Math.max(0, (tim.reputasi || 50) - 10); // reputasi turun, identitas berubah mendadak
    tim.kas = Math.max(0, Math.floor((tim.kas || 0) * 0.5) + 500000000); // suntikan modal dari pihak merger
    tim.statusKeuangan = "SEHAT";

    // CEO resign, regenerasi CEO baru (Fase 7 akan menyempurnakan formula generate)
    tim.ceo = (typeof generateCEOBaruLengkap === "function") ? generateCEOBaruLengkap(tim) : generateCEOBaruSederhana(tim);

    if (typeof tambahBerita === "function") {
        tambahBerita(`🤝 Merger: <span>${namaLama}</span> resmi merger dan kini berganti nama menjadi <b>${namaBaru}</b>. ${rosterDilepas.length} pemain dilepas ke pasar transfer.`);
    }

    return { tipe: "MERGER", namaLama, namaBaru, jumlahDilepas: rosterDilepas.length };
}

// ------------------------------------------------------------------
// [6.5] EKSEKUSI JUAL SLOT — 50% paket lengkap (roster ikut), 50%
// semua roster lama dilepas jadi Free Agent. Slot MPL tetap, identitas
// tim baru (nama berubah total, bukan sekadar tambahan seperti merger).
// ------------------------------------------------------------------
const POOL_NAMA_INVESTOR_BARU = [
    "Nexus Esports", "Vortex Gaming", "Apex Phoenix", "Titan Legacy",
    "Orion Esports", "Zenith Squad", "Helios Gaming", "Quantum Rivals"
];

// ------------------------------------------------------------------
// [FASE 4 - MSC x EWC 2026] Generator nama organisasi baru khusus buat
// auto-investor 9 region single-tier -- pool TERPISAH dari nickname
// pemain (generateNicknameEsports) dan dari POOL_NAMA_INVESTOR_BARU di
// atas (biar gak numpuk kemungkinan nama sama nongol di region beda
// dalam game yang sama, karena mekanisme ini bisa kejadian jauh lebih
// sering -- 9 region vs cuma 3 region lama).
// ------------------------------------------------------------------
const ORG_BARU_PREFIX = [
    "Phoenix", "Titan", "Cosmic", "Shadow", "Nova", "Apex", "Vertex", "Omega",
    "Solar", "Iron", "Crimson", "Astral", "Frost", "Storm", "Golden"
];
const ORG_BARU_SUFFIX = [
    "Esports", "Gaming", "Legends", "Warriors", "Squad", "Alliance",
    "Force", "Dynasty", "Collective", "Rivals"
];

function namaOrganisasiSedangDipakai(nama) {
    let semuaTim = [
        ...(typeof daftarTim !== "undefined" ? daftarTim : []),
        ...(typeof daftarTimPH !== "undefined" ? daftarTimPH : []),
        ...(typeof daftarTimMY !== "undefined" ? daftarTimMY : []),
        ...(typeof daftarTimSG !== "undefined" ? daftarTimSG : [])
    ];
    REGION_SINGLE_TIER_BARU.forEach(kode => {
        let arr = window["daftarTim" + kode];
        if (arr) semuaTim.push(...arr);
    });
    return semuaTim.some(t => t.nama === nama);
}

function generateNamaOrganisasiBaru() {
    let nama, percobaan = 0;
    do {
        let prefix = ORG_BARU_PREFIX[Math.floor(Math.random() * ORG_BARU_PREFIX.length)];
        let suffix = ORG_BARU_SUFFIX[Math.floor(Math.random() * ORG_BARU_SUFFIX.length)];
        nama = prefix + " " + suffix;
        percobaan++;
    } while (namaOrganisasiSedangDipakai(nama) && percobaan < 100);
    return nama;
}

// ------------------------------------------------------------------
// [FASE 4 - MSC x EWC 2026] AUTO-INVESTOR -- resolusi kolaps khusus 9
// region single-tier baru (Q12/Opsi 1). Beda dari eksekusiJualSlot()
// (yang ada peluang gagal & butuh giliran musim tunggu), ini LANGSUNG
// terjadi otomatis tanpa dice roll -- karena gak ada tier-2 feeder yang
// bisa "npunguti" slot ini, ekosistem butuh slot terisi lagi seketika
// biar liga tetap genap 8 tim.
// ------------------------------------------------------------------
function eksekusiAutoInvestorRegionBaru(tim) {
    let namaLama = tim.nama;
    let namaBaru = generateNamaOrganisasiBaru();

    tim.nama = namaBaru;
    tim.logo = namaBaru.replace(/ /g, "_") + ".png";
    tim.reputasi = 40 + Math.floor(Math.random() * 20); // 40-60, org baru blm punya nama besar
    tim.kas = 1200000000 + Math.floor(Math.random() * 1600000000); // sama range kas awal Fase 1 (1,2M-2,8M)
    tim.power = 65 + Math.floor(Math.random() * 15); // 65-80, sedikit di bawah rata-rata awal biar realistis "org baru"
    tim.statusKeuangan = "SEHAT";
    tim.ceo = (typeof generateCEOBaruLengkap === "function") ? generateCEOBaruLengkap(tim) : generateCEOBaruSederhana(tim);

    // Roster & staff baru -- pakai generator yang sama kayak Fase 1
    // (generateNicknameEsports), bukan hardcode manual.
    let roles = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
    tim.roster = [];
    for (let i = 0; i < 7; i++) {
        let role = roles[i % 5];
        let baseOvr = tim.power + Math.floor(Math.random() * 6) - 3;
        tim.roster.push({
            nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : "Player" + i,
            role: role,
            ovr: Math.max(50, baseOvr),
            umur: Math.floor(Math.random() * 8) + 18,
            sisaKontrak: 2 + Math.floor(Math.random() * 2),
            gaji: 8000000 + Math.floor(Math.random() * 6000000),
            harga: 40000000 + Math.floor(Math.random() * 40000000),
            negara: (typeof benderaAkademiUntukRegion === "function")
                        ? benderaAkademiUntukRegion(tim.region)
                        : "🌐",
            sifat: "Normal",
            isStarter: i < 5
        });
    }
    let gajiPelatihBaru = 8000000 + Math.floor(Math.random() * 4000000);
    tim.staff = {
        pelatih: {
            nama: (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : "Coach Baru",
            role: "Pelatih",
            sisaKontrak: 2,
            buffPower: 1 + Math.floor(Math.random() * 2),
            gaji: gajiPelatihBaru,
            harga: Math.floor(gajiPelatihBaru * 1.2),
            umur: 28 + Math.floor(Math.random() * 15)
        },
        asisten: null,
        analis: null
    };

    if (typeof tambahBerita === "function") {
        tambahBerita(`🆕 Investor Baru: Slot kosong bekas <span>${namaLama}</span> resmi diambil alih investor baru dan berganti nama menjadi <b>${namaBaru}</b>. Roster & staff baru langsung diumumkan.`);
    }

    return { tipe: "AUTO_INVESTOR", namaLama, namaBaru };
}

function eksekusiJualSlot(tim) {
    let namaLama = tim.nama;
    let namaBaru = POOL_NAMA_INVESTOR_BARU[Math.floor(Math.random() * POOL_NAMA_INVESTOR_BARU.length)];

    let paketLengkap = Math.random() < 0.5;
    let jumlahDilepas = 0;

    if (!paketLengkap) {
        (tim.roster || []).forEach(p => {
            p.sisaKontrak = 2;
            p.harga = Math.floor((p.harga || (p.gaji || 5000000) * 1.5) * 0.65);
            if (typeof pemainTransfer !== "undefined") pemainTransfer.push(p);
        });
        jumlahDilepas = (tim.roster || []).length;
        tim.roster = [];
    }
    // Kalau paketLengkap -> roster TETAP ikut tim (tidak diubah)

    tim.nama = namaBaru;
    tim.reputasi = Math.max(30, Math.floor((tim.reputasi || 50) * 0.6)); // identitas baru, reputasi reset sebagian
    tim.kas = 2500000000 + Math.floor(Math.random() * 1500000000); // modal investor baru (sesuai range kas awal MPL)
    tim.statusKeuangan = "SEHAT";
    tim.ceo = (typeof generateCEOBaruLengkap === "function") ? generateCEOBaruLengkap(tim) : generateCEOBaruSederhana(tim);

    if (typeof tambahBerita === "function") {
        let detail = paketLengkap
            ? "Roster lama dipertahankan sebagai bagian dari kesepakatan."
            : `Seluruh ${jumlahDilepas} pemain lama dilepas ke pasar transfer.`;
        tambahBerita(`💰 Slot Terjual: <span>${namaLama}</span> resmi dijual ke investor baru dan berganti nama menjadi <b>${namaBaru}</b>. ${detail}`);
    }

    return { tipe: "JUAL_SLOT", namaLama, namaBaru, paketLengkap, jumlahDilepas };
}

// ------------------------------------------------------------------
// [6.6] EKSEKUSI KOLAPS — semua pemain Free Agent, staff hilang, CEO
// pergi, slot MPL "kosong" (ditandai status KOSONG_FRANCHISE; menunggu
// akuisisi/merger PLAYER di Fase 9 — bukan AI lain, sesuai desain bahwa
// hanya player yang bisa mengajukan akuisisi/merger).
// Untuk tim tier-2/LEN (tidak punya slot franchise): kolaps berarti
// reset total (roster & kas baru) supaya liga tidak kehilangan peserta.
// ------------------------------------------------------------------
function eksekusiKolaps(tim) {
    let namaTim = tim.nama;
    let jumlahPemain = (tim.roster || []).length;

    (tim.roster || []).forEach(p => {
        p.sisaKontrak = 0;
        p.harga = Math.floor((p.harga || (p.gaji || 5000000) * 1.2) * 0.5);
        // Pemain muda (<22) idealnya ditangkap sistem Akademi (Fase 16); untuk
        // sementara semua masuk pool Free Agent biasa.
        if (typeof pemainTransfer !== "undefined") pemainTransfer.push(p);
    });

    tim.roster = [];
    tim.staff = { pelatih: null, asisten: null, analis: null };
    tim.ceo = null; // CEO pergi bersama tim

    // [MSC x EWC 2026 - FASE 4] 9 region single-tier baru -> auto-investor
    // LANGSUNG (Q12/Opsi 1), gak lewat status KOSONG_FRANCHISE sama sekali,
    // karena gak ada player/tier-2 yang bisa "isi ulang" slot ini.
    if (typeof REGION_SINGLE_TIER_BARU !== "undefined" && REGION_SINGLE_TIER_BARU.includes(tim.region)) {
        return eksekusiAutoInvestorRegionBaru(tim);
    }

    if (timBisaMergerJualSlot(tim)) {
        // Slot franchise MPL: KOSONG, menunggu player akuisisi/merger (Fase 9)
        tim.statusKeuangan = "KOSONG_FRANCHISE";
        tim.kas = 0;
        if (typeof tambahBerita === "function") {
            tambahBerita(`💀 Kolaps Total: <span>${namaTim}</span> resmi bangkrut. Slot franchise mereka kini Kosong dan menunggu investor baru. ${jumlahPemain} pemain dilepas ke pasar transfer.`);
        }
    } else {
        // Tier-2/LEN/SG: tidak ada slot yang ditransaksikan -> reset total
        let kasBaru = tim.liga === "LEN" ? (150000000 + Math.floor(Math.random() * 100000000))
                     : tim.liga === "MDL" || tim.liga === "MAL" ? (600000000 + Math.floor(Math.random() * 400000000))
                     : (1000000000 + Math.floor(Math.random() * 800000000)); // fallback (misal MPL SG)
        tim.kas = kasBaru;
        tim.reputasi = Math.max(10, Math.floor((tim.reputasi || 30) * 0.5));
        tim.statusKeuangan = "SEHAT";
        tim.ceo = (typeof generateCEOBaruLengkap === "function") ? generateCEOBaruLengkap(tim) : generateCEOBaruSederhana(tim);
        if (typeof tambahBerita === "function") {
            tambahBerita(`💀 Kolaps: <span>${namaTim}</span> bangkrut dan dibangun ulang dari awal dengan manajemen baru. ${jumlahPemain} pemain dilepas ke pasar transfer.`);
        }
    }

    return { tipe: "KOLAPS", nama: namaTim, jumlahDilepas: jumlahPemain };
}

// ------------------------------------------------------------------
// [6.7] GENERATE CEO BARU (versi sederhana, dipakai sementara di Fase 6;
// Fase 7 akan menggantinya dengan formula lengkap korelasi umur-keahlian
// + probabilitas-per-liga yang sudah disepakati di rangkuman desain)
// ------------------------------------------------------------------
function generateCEOBaruSederhana(tim) {
    let namaPool = ["Andre Wijaya", "Kevin Santoso", "Budi Hartono", "Reza Gunawan", "Hendra Saputra", "Daniel Tanoto"];
    let liga = tim.liga || "MPL";
    let reputasi = tim.reputasi || 50;

    let targetMean = liga === "MPL" ? 75 + (reputasi - 50) * 0.3
                    : liga === "MDL" || liga === "MAL" ? 55 + (reputasi - 50) * 0.2
                    : 35 + (reputasi - 50) * 0.15;
    let keahlian = Math.max(1, Math.min(100, Math.round(targetMean + (Math.random() * 20 - 10))));
    let umur = keahlian >= 70 ? 38 + Math.floor(Math.random() * 10) : 26 + Math.floor(Math.random() * 10);

    return {
        nama: namaPool[Math.floor(Math.random() * namaPool.length)],
        umur,
        keahlianFinansial: keahlian
    };
}

// ------------------------------------------------------------------
// [6.8] RESOLUSI KRISIS UTAMA — dipanggil dengan hasil dari
// prosesFinansialAI() (Fase 5). Memutuskan aksi berdasarkan status
// terbaru tiap tim yang berubah musim ini.
// ------------------------------------------------------------------
function prosesResolusiKrisisAI(ringkasanPerubahan) {
    if (!ringkasanPerubahan || ringkasanPerubahan.length === 0) return [];

    let logResolusi = [];

    ringkasanPerubahan.forEach(({ tim, statusBaru }) => {
        if (statusBaru === "PERINGATAN") {
            responsPeringatanAI(tim);
        } else if (statusBaru === "KRISIS") {
            if (timBisaMergerJualSlot(tim)) {
                // Tim franchise (MPL ID/PH/MY): cari pembeli -> merger/jual slot, atau kolaps
                if (adaPembeliSlot(tim)) {
                    let hasil = Math.random() < 0.5 ? eksekusiMerger(tim) : eksekusiJualSlot(tim);
                    logResolusi.push(hasil);
                } else {
                    let hasil = eksekusiKolaps(tim);
                    logResolusi.push(hasil);
                }
            } else {
                // Tier-2 Independen/Challenger, LEN, atau MPL SG (non-franchise):
                // tidak ada merger/jual slot -- cuma jual paksa pemain sbg mitigasi.
                // Kalau tetap parah, biarkan trigger KOLAPS (reset total) di musim berikutnya
                // lewat status KRISIS yang persisten (dicek lagi prosesFinansialAI musim depan).
                responsPeringatanAI(tim); // pakai logika jual-1-pemain yang sama sbg mitigasi darurat
            }
        } else if (statusBaru === "KOLAPS") {
            let hasil = eksekusiKolaps(tim);
            logResolusi.push(hasil);
        }
    });

    return logResolusi;
}

// ==========================================
// CATATAN INTEGRASI FASE 6:
// prosesResolusiKrisisAI() dipanggil di script.js tepat setelah
// window._ringkasanFinansialAITerakhir diisi oleh prosesFinansialAI(),
// di dalam prosesEkosistemAI() (lihat patch di script.js).
// ==========================================


// ==========================================
// FASE 7 — SISTEM PENSIUN & RESIGN CEO + REGENERASI PENUH
// ==========================================
//
// Formula korelasi umur-keahlian & probabilitas-per-liga di sini adalah
// versi LENGKAP yang menggantikan generateCEOBaruSederhana() (Fase 6,
// yang sekarang jadi fallback darurat saja). Aturan yang diimplementasikan:
//
// 1. PENSIUN ALAMI -> umur CEO mencapai 65 (seragam semua liga).
// 2. RESIGN (tekanan moral/reputasi) -> salah satu dari:
//    - Tim KRISIS 2 musim berturut-turut
//    - Tim terdegradasi 2x berturut-turut
//    - Reputasi tim jatuh di bawah 30
// 3. IKUT TENGGELAM -> tim KOLAPS (sudah ditangani Fase 6, CEO diset null
//    lalu di sini kita isi ulang kalau tim tier-2/LEN di-reset, ATAU
//    dibiarkan null kalau slot franchise MPL kosong menunggu player).
//
// Korelasi umur saat CEO baru di-generate (semakin tinggi keahlian,
// semakin tua, mensimulasikan butuh pengalaman):
//   85-100 -> umur generate 42-51 (sisa kerja 14-23 thn sampai pensiun 65)
//   70-84  -> umur generate 37-46 (sisa kerja 19-28 thn)
//   50-69  -> umur generate 30-39 (sisa kerja 26-35 thn)
//   30-49  -> umur generate 24-33 (sisa kerja 32-41 thn)
//   1-29   -> umur generate 21-27 (sisa kerja 38-44 thn)
//
// Probabilitas keahlian per liga (gaussian, target mean bergeser sesuai
// reputasi tim -- tim reputasi tinggi lebih mudah dapat CEO bagus):
//   MPL            -> mean dasar 75, stdDev 10 (sering 65-100, jarang <50)
//   MDL/MAL        -> mean dasar 55, stdDev 13 (sering 40-80, jarang >85)
//   LEN            -> mean dasar 35, stdDev 16 (sering 20-65, jarang >70)
// ==========================================

const UMUR_PENSIUN_CEO = 65;
const POOL_NAMA_DEPAN_CEO = ["Kevin","Budi","Erick","Hendra","Rudi","Surya","Andre","Fajar","Reza","Dimas","Agus","Wahyu","Bayu","Yoga","Putra","Michael","David","Jonathan","Marcus","Steven","Anton","Hadi","Joko","Iwan","Tommy","Robert","Daniel","William","Edwin","Vincent","Hendro","Hartanto","Indra","Yusuf","Teddy","Galih","Doni","Andika","Farhan","Rian"];
const POOL_NAMA_BELAKANG_CEO = ["Susanto","Wijaya","Tanoto","Hartono","Gunawan","Setiawan","Pratama","Saputra","Halim","Kusuma","Lim","Hidayat","Wibowo","Santoso","Nugroho","Tjandra","Salim","Wirawan","Sutanto","Permadi","Wong","Tan","Kurniawan","Sasmita","Pranata"];

function generateNamaCEOBaru() {
    let depan = POOL_NAMA_DEPAN_CEO[Math.floor(Math.random() * POOL_NAMA_DEPAN_CEO.length)];
    let belakang = POOL_NAMA_BELAKANG_CEO[Math.floor(Math.random() * POOL_NAMA_BELAKANG_CEO.length)];
    return depan + " " + belakang;
}

// Box-Muller transform untuk distribusi normal (gaussian)
function gaussianRandom(mean, stdDev) {
    let u1 = Math.random() || 1e-9; // hindari log(0)
    let u2 = Math.random();
    let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}

function generateKeahlianCEOBaru(liga, reputasi) {
    let r = reputasi || 50;
    let targetMean, stdDev;

    if (liga === "MPL") {
        targetMean = 75 + (r - 50) * 0.3;
        stdDev = 10;
    } else if (liga === "MDL" || liga === "MAL") {
        targetMean = 55 + (r - 50) * 0.2;
        stdDev = 13;
    } else { // LEN
        targetMean = 35 + (r - 50) * 0.15;
        stdDev = 16;
    }

    let val = Math.round(gaussianRandom(targetMean, stdDev));
    return Math.max(1, Math.min(100, val));
}

function generateUmurCEOBaru(keahlian) {
    let baseUmur;
    if (keahlian >= 85) baseUmur = 45;
    else if (keahlian >= 70) baseUmur = 40;
    else if (keahlian >= 50) baseUmur = 33;
    else if (keahlian >= 30) baseUmur = 27;
    else baseUmur = 24;

    let variasi = Math.floor(Math.random() * 7) - 3; // -3 s/d +3
    return Math.max(22, baseUmur + variasi);
}

// ------------------------------------------------------------------
// [7.1] GENERATE CEO BARU — versi LENGKAP (menggantikan versi sederhana
// Fase 6 untuk semua pemanggilan baru; generateCEOBaruSederhana tetap
// dibiarkan ada sebagai fallback kalau dipanggil dari kode lama)
// ------------------------------------------------------------------
function generateCEOBaruLengkap(tim) {
    let liga = tim.liga || "MPL";
    let reputasi = tim.reputasi || 50;
    let keahlian = generateKeahlianCEOBaru(liga, reputasi);
    let umur = generateUmurCEOBaru(keahlian);

    return {
        nama: generateNamaCEOBaru(),
        umur: umur,
        keahlianFinansial: keahlian
    };
}

// ------------------------------------------------------------------
// [7.2] CEK PENSIUN ALAMI — umur CEO mencapai/lewat 65
// ------------------------------------------------------------------
function ceoPensiunAlami(tim) {
    return tim.ceo && typeof tim.ceo.umur === "number" && tim.ceo.umur >= UMUR_PENSIUN_CEO;
}

// ------------------------------------------------------------------
// [7.3] CEK RESIGN — tekanan moral/reputasi
// Membutuhkan tracking riwayat krisis & degradasi berturut-turut, yang
// disimpan langsung di objek tim (riwayatKrisisBerturut, riwayatDegradasiBerturut).
// Tracking ini di-update di [7.5] tiap akhir musim.
// ------------------------------------------------------------------
function ceoHarusResign(tim) {
    if (!tim.ceo) return false;

    let krisisBerturut = tim.riwayatKrisisBerturut || 0;
    let degradasiBerturut = tim.riwayatDegradasiBerturut || 0;
    let reputasi = tim.reputasi || 50;

    if (krisisBerturut >= 2) return true;
    if (degradasiBerturut >= 2) return true;
    if (reputasi < 30) return true;

    return false;
}

// ------------------------------------------------------------------
// [7.4] EKSEKUSI PERGANTIAN CEO (pensiun atau resign) — keduanya
// menghasilkan efek yang sama (CEO baru), bedanya cuma narasi berita
// ------------------------------------------------------------------
function gantiCEO(tim, alasan) {
    let ceoLama = tim.ceo ? tim.ceo.nama : "(tidak diketahui)";
    let ceoBaru = generateCEOBaruLengkap(tim);
    tim.ceo = ceoBaru;

    // Reset tracking setelah pergantian CEO -- CEO baru dapat "kesempatan bersih"
    tim.riwayatKrisisBerturut = 0;
    tim.riwayatDegradasiBerturut = 0;

    if (typeof tambahBerita === "function") {
        if (alasan === "PENSIUN") {
            tambahBerita(`👋 Pensiun: CEO <span>${tim.nama}</span>, <b>${ceoLama}</b>, resmi pensiun setelah mengabdi sekian musim. CEO baru <b>${ceoBaru.nama}</b> (keahlian finansial ${ceoBaru.keahlianFinansial}) ditunjuk untuk melanjutkan kepemimpinan.`);
        } else {
            tambahBerita(`🚪 Resign: CEO <span>${tim.nama}</span>, <b>${ceoLama}</b>, mengundurkan diri akibat tekanan performa & reputasi. <b>${ceoBaru.nama}</b> (keahlian finansial ${ceoBaru.keahlianFinansial}) ditunjuk sebagai pengganti.`);
        }
    }

    return { tipe: "GANTI_CEO", alasan, tim: tim.nama, ceoLama, ceoBaru: ceoBaru.nama, keahlianBaru: ceoBaru.keahlianFinansial };
}

// ------------------------------------------------------------------
// [7.5] UPDATE TRACKING RIWAYAT (krisis & degradasi berturut-turut)
// Dipanggil tiap akhir musim SEBELUM cek pensiun/resign, supaya data
// yang dipakai untuk keputusan resign selalu yang terbaru.
// degradasiTerjadi: flag opsional dari sistem liga (Fase 11+) -- kalau
// modul liga/degradasi belum ada, parameter ini default false (aman).
// ------------------------------------------------------------------
function updateRiwayatCEO(tim, degradasiTerjadi) {
    // Riwayat krisis berturut-turut
    if (tim.statusKeuangan === "KRISIS" || tim.statusKeuangan === "KOLAPS") {
        tim.riwayatKrisisBerturut = (tim.riwayatKrisisBerturut || 0) + 1;
    } else {
        tim.riwayatKrisisBerturut = 0;
    }

    // Riwayat degradasi berturut-turut (cuma di-increment kalau modul liga
    // memberi sinyal degradasi; default false kalau belum terintegrasi)
    if (degradasiTerjadi) {
        tim.riwayatDegradasiBerturut = (tim.riwayatDegradasiBerturut || 0) + 1;
    } else if (degradasiTerjadi === false) {
        tim.riwayatDegradasiBerturut = 0;
    }
    // kalau degradasiTerjadi === undefined (modul liga belum ada), JANGAN
    // reset paksa -- biarkan nilai lama dipertahankan sampai modul siap
}

// ------------------------------------------------------------------
// [7.6] FUNGSI UTAMA — proses pensiun/resign untuk SEMUA tim AI yang
// punya CEO (tim afiliasi dikecualikan otomatis karena ceo: null).
// Dipanggil tiap akhir musim, SETELAH prosesResolusiKrisisAI (Fase 6),
// supaya status keuangan musim ini sudah final sebelum dicek utk resign.
// ------------------------------------------------------------------
function prosesPensiunResignCEO(daftarTimDegradasi) {
    let daftar = ambilSemuaTimFinansialAI();
    let logPergantian = [];

    daftar.forEach(tim => {
        if (!tim.ceo) return; // tim tanpa CEO (baru kolaps & slot kosong, dll) -> skip

        // Tambah umur CEO 1 tahun (dipanggil tiap akhir musim genap/tahunBerganti
        // idealnya, tapi supaya sederhana & konsisten kita tambah tiap kali
        // fungsi ini dipanggil -- penyesuaian ke siklus tahunBerganti bisa
        // dilakukan di titik pemanggilan jika diperlukan presisi lebih)
        if (typeof tim.ceo.umur === "number") tim.ceo.umur += 1;

        let degradasiTerjadi = daftarTimDegradasi && daftarTimDegradasi.includes(tim.nama);
        updateRiwayatCEO(tim, degradasiTerjadi !== undefined ? degradasiTerjadi : undefined);

        if (ceoPensiunAlami(tim)) {
            logPergantian.push(gantiCEO(tim, "PENSIUN"));
        } else if (ceoHarusResign(tim)) {
            logPergantian.push(gantiCEO(tim, "RESIGN"));
        }
    });

    return logPergantian;
}

// ==========================================
// CATATAN INTEGRASI FASE 7:
// prosesPensiunResignCEO() dipanggil di script.js setelah
// prosesResolusiKrisisAI() (Fase 6), masih di dalam prosesEkosistemAI().
// Parameter daftarTimDegradasi (array nama tim yang terdegradasi musim ini)
// bersifat OPSIONAL -- modul liga/degradasi penuh baru dibangun di Fase 11+,
// jadi untuk saat ini dipanggil tanpa argumen (riwayat degradasi tidak
// di-reset/increment sampai modul tersebut siap, sesuai catatan di [7.5]).
// ==========================================


// ==========================================
// FASE 8 — SISTEM HUTANG BANK (KHUSUS PLAYER)
// ==========================================
//
// Aturan main (sesuai rangkuman desain final):
// - HANYA player yang bisa berhutang. AI tidak punya akses ke sistem ini
//   (AI yang krisis diselesaikan lewat merger/jual slot/kolaps di Fase 6).
// - Syarat: hanya bisa diajukan saat status keuangan PLAYER sendiri
//   PERINGATAN atau KRISIS (tidak bisa pinjam sembarangan saat sehat).
// - Limit = (reputasi x 15 juta) + (kas tim x 0.5), minimum 100 juta.
// - Tenor: 6 bulan (bunga 8%/musim), 12 bulan (12%/musim), 24 bulan (18%/musim).
//   1 musim = 6 bulan, jadi tenor dalam "jumlah musim" = tenorBulan / 6.
// - Telat bayar: tahap 1 bunga +15%, tahap 2 +25% lagi (peringatan
//   terakhir), tahap 3 SITA ASET (bank jual paksa pemain OVR tertinggi,
//   reputasi -20, kalau roster tidak cukup -> trigger KOLAPS).
// ==========================================

const TABEL_TENOR_HUTANG = {
    6:  { bungaPerMusim: 0.08, label: "6 Bulan (1 musim)"  },
    12: { bungaPerMusim: 0.12, label: "12 Bulan (2 musim)" },
    24: { bungaPerMusim: 0.18, label: "24 Bulan (4 musim)" }
};

// ------------------------------------------------------------------
// [8.1] CEK APAKAH PLAYER BOLEH MENGAJUKAN PINJAMAN SAAT INI
// Status keuangan player dihitung pakai fungsi yang sama dengan AI
// (cekStatusKeuanganAI bisa dipakai untuk objek tim manapun, termasuk
// tim milik player, selama field-nya konsisten: kas, roster, staff,
// levelGH, reputasi, ceo).
// ------------------------------------------------------------------
function bolehAjukanHutang() {
    if (window.hutangBankPlayer && window.hutangBankPlayer.aktif) {
        return { boleh: false, alasan: "Kamu masih punya pinjaman aktif yang belum lunas." };
    }

    let timPlayerObj = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;
    let statusSaatIni = timPlayerObj ? cekStatusKeuanganAI({
        ...timPlayerObj,
        kas: kasTim,
        roster: rosterKita,
        staff: staffKita,
        levelGH: levelGH,
        reputasi: reputasiTim,
        ceo: { keahlianFinansial: 100 } // player tidak punya CEO AI -- pakai modifier netral/terbaik (tidak ada boros/hemat dari sisi ini)
    }) : "SEHAT";

    if (statusSaatIni !== "PERINGATAN" && statusSaatIni !== "KRISIS") {
        return { boleh: false, alasan: "Pinjaman hanya bisa diajukan saat tim dalam status Peringatan atau Krisis. Kondisi keuanganmu saat ini masih SEHAT." };
    }

    return { boleh: true, status: statusSaatIni };
}

// ------------------------------------------------------------------
// [8.2] HITUNG LIMIT PINJAMAN
// ------------------------------------------------------------------
function hitungLimitPinjaman() {
    let dariReputasi = (reputasiTim || 50) * 15000000;
    let dariKas = Math.max(0, kasTim) * 0.5;
    let limit = dariReputasi + dariKas;
    let minimumLimit = 100000000;
    return Math.max(minimumLimit, Math.floor(limit));
}

// ------------------------------------------------------------------
// [8.3] HITUNG SIMULASI CICILAN untuk preview di UI sebelum player
// benar-benar mengajukan pinjaman
// ------------------------------------------------------------------
function simulasikanPinjaman(pokokPinjaman, tenorBulan) {
    let tenorInfo = TABEL_TENOR_HUTANG[tenorBulan];
    if (!tenorInfo) return null;

    let jumlahMusim = tenorBulan / 6;
    let totalBunga = Math.floor(pokokPinjaman * tenorInfo.bungaPerMusim * jumlahMusim);
    let totalBayar = pokokPinjaman + totalBunga;
    let cicilanPerMusim = Math.floor(totalBayar / jumlahMusim);

    return {
        pokokPinjaman, tenorBulan, jumlahMusim,
        bungaPerMusim: tenorInfo.bungaPerMusim,
        totalBunga, totalBayar, cicilanPerMusim
    };
}

// ------------------------------------------------------------------
// [8.4] AJUKAN PINJAMAN — dipanggil dari UI setelah player konfirmasi
// nominal & tenor. Mengisi window.hutangBankPlayer dengan struktur data
// sesuai rangkuman desain.
// ------------------------------------------------------------------
function ajukanPinjamanBank(nominalDiminta, tenorBulan) {
    let cekBoleh = bolehAjukanHutang();
    if (!cekBoleh.boleh) {
        return { sukses: false, pesan: cekBoleh.alasan };
    }

    let limit = hitungLimitPinjaman();
    if (nominalDiminta > limit) {
        return { sukses: false, pesan: `Nominal melebihi limit pinjaman kamu (Rp ${limit.toLocaleString("id-ID")}).` };
    }
    if (nominalDiminta <= 0) {
        return { sukses: false, pesan: "Nominal pinjaman tidak valid." };
    }

    let simulasi = simulasikanPinjaman(nominalDiminta, tenorBulan);
    if (!simulasi) {
        return { sukses: false, pesan: "Tenor tidak valid." };
    }

    window.hutangBankPlayer = {
        aktif: true,
        pokokPinjaman: simulasi.pokokPinjaman,
        tenor: simulasi.tenorBulan,
        bungaPerMusim: simulasi.bungaPerMusim,
        cicilanPerMusim: simulasi.cicilanPerMusim,
        sisaTagihan: simulasi.totalBayar,
        musimTersisa: simulasi.jumlahMusim,
        musimTelat: 0,
        statusBayar: "LANCAR"
    };

    kasTim += nominalDiminta;
    if (typeof catatKas === "function") {
        catatKas("MASUK", nominalDiminta, `Pinjaman Bank (tenor ${simulasi.tenorBulan} bulan)`);
    }

    return { sukses: true, data: window.hutangBankPlayer };
}

// ------------------------------------------------------------------
// [8.5] BAYAR CICILAN — dipanggil tiap akhir musim (offseason), SEBELUM
// pengeluaran lain dipotong, supaya prioritas pelunasan hutang jelas.
// Kalau kas tidak cukup untuk cicilan penuh, otomatis dianggap TELAT.
// ------------------------------------------------------------------
function bayarCicilanHutangPlayer() {
    let h = window.hutangBankPlayer;
    if (!h || !h.aktif) return null;

    let berhasilBayar = kasTim >= h.cicilanPerMusim;

    if (berhasilBayar) {
        kasTim -= h.cicilanPerMusim;
        h.sisaTagihan -= h.cicilanPerMusim;
        h.musimTersisa -= 1;
        h.musimTelat = 0;
        h.statusBayar = "LANCAR";

        if (typeof catatKas === "function") {
            catatKas("KELUAR", h.cicilanPerMusim, "Cicilan Pinjaman Bank");
        }

        if (h.musimTersisa <= 0 || h.sisaTagihan <= 0) {
            // Lunas
            window.hutangBankPlayer = { aktif: false };
            return { tipe: "LUNAS" };
        }

        return { tipe: "BAYAR_LANCAR", sisaTagihan: h.sisaTagihan, musimTersisa: h.musimTersisa };
    } else {
        // TELAT BAYAR -- naikkan musimTelat dan terapkan penalti bertingkat
        h.musimTelat += 1;

        if (h.musimTelat === 1) {
            h.sisaTagihan = Math.floor(h.sisaTagihan * 1.15);
            h.statusBayar = "PENALTI_BUNGA";
            return { tipe: "TELAT_1", sisaTagihan: h.sisaTagihan };
        } else if (h.musimTelat === 2) {
            h.sisaTagihan = Math.floor(h.sisaTagihan * 1.25);
            h.statusBayar = "PERINGATAN_TERAKHIR";
            return { tipe: "TELAT_2", sisaTagihan: h.sisaTagihan };
        } else {
            // musimTelat >= 3 -> SITA ASET
            h.statusBayar = "SITA_ASET";
            let hasilSita = eksekusiSitaAsetPlayer(h.sisaTagihan);
            return { tipe: "SITA_ASET", ...hasilSita };
        }
    }
}

// ------------------------------------------------------------------
// [8.6] EKSEKUSI SITA ASET — bank jual paksa pemain OVR tertinggi
// player sampai sisa tagihan tertutup (atau roster habis).
// ------------------------------------------------------------------
function eksekusiSitaAsetPlayer(sisaTagihan) {
    let rosterUrut = [...(rosterKita || [])].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    let totalTerkumpul = 0;
    let pemainTersita = [];

    for (let pemain of rosterUrut) {
        if (totalTerkumpul >= sisaTagihan) break;
        let nilaiJual = pemain.harga || ((pemain.gaji || 5000000) * 1.5);
        totalTerkumpul += nilaiJual;
        pemainTersita.push(pemain);
    }

    pemainTersita.forEach(p => {
        rosterKita = rosterKita.filter(x => x !== p);
        p.sisaKontrak = 2;
        p.harga = Math.floor((p.harga || (p.gaji || 5000000) * 1.5) * 0.7); // dijual buru-buru, harga turun
        if (typeof pemainTransfer !== "undefined") pemainTransfer.push(p);
    });

    reputasiTim = Math.max(0, (reputasiTim || 50) - 20);

    let sisaSetelahSita = Math.max(0, sisaTagihan - totalTerkumpul);
    let kolapsTrigger = sisaSetelahSita > 0 && rosterKita.length === 0;

    if (typeof tambahBerita === "function") {
        if (kolapsTrigger) {
            tambahBerita(`⚠️ Kritis: Roster Anda habis akibat sita aset dan hutang masih belum lunas sepenuhnya. Tim Anda dalam kondisi sangat genting.`);
        }
    }

    // Hutang ditutup paksa setelah sita aset (baik lunas penuh atau tidak,
    // bank tidak mengejar lebih lanjut -- konsekuensinya sudah diterima)
    window.hutangBankPlayer = { aktif: false };

    return {
        pemainTersita: pemainTersita.map(p => p.nama),
        totalTerkumpul,
        sisaSetelahSita,
        kolapsTrigger
    };
}

// ==========================================
// CATATAN INTEGRASI FASE 8:
// - bayarCicilanHutangPlayer() dipanggil di script.js tiap akhir musim,
//   di titik yang sama dengan pemotongan kasTim untuk gaji/staff player
//   (lihat patch di bagian OFFSEASON, sebelum prosesEkosistemAI agar
//   prioritas pelunasan hutang didahulukan dari pengeluaran rutin lain).
// - ajukanPinjamanBank(), hitungLimitPinjaman(), simulasikanPinjaman(),
//   dan bolehAjukanHutang() dipanggil dari UI modal baru (index.html +
//   style.css) lewat fungsi pembungkus di script.js (Fase 8 UI section).
// ==========================================


// ==========================================
// ACQUISITION_MERGER_PATCH.JS
// FASE 9 — Jalur Akuisisi Slot & Merger Sukarela Player ke MPL
// ==========================================
//
// Latar belakang: sesuai rangkuman desain, player yang sudah membangun
// tim di liga tier-2 (MDL/MAL Independen atau Challenger) bisa naik ke
// MPL lewat 2 jalur AKTIF, tanpa harus menunggu tim AI kolaps duluan:
//
// JALUR 1 — AKUISISI SLOT:
//   Syarat: tim player sudah di liga tier-2 minimal 1 musim, kas player
//   >= harga slot, reputasi player >= 70. Target HARUS status
//   PERINGATAN atau KRISIS (tim SEHAT selalu menolak tawaran apapun).
//   Harga slot = reputasi tim target x kas tim target x modifier.
//
// JALUR 2 — MERGER SUKARELA:
//   Syarat: reputasi player >= 65, power player >= 68. Lebih mudah
//   diterima kalau target sedang KRISIS. Risiko: reputasi player -10
//   di awal (recover seiring prestasi).
//
// Catatan penting: HANYA berlaku untuk tim MPL FRANCHISE (ID/PH/MY).
// MPL SG dikecualikan (non-franchise, tidak ada slot yang bisa
// diakuisisi/merger -- sesuai keputusan Fase 6).
//
// File ini dimuat SETELAH database.js, financial_ai_patch.js, dan
// SEBELUM script.js (karena beberapa fungsi UI di script.js akan
// memanggil fungsi-fungsi di file ini).
// ==========================================

// ------------------------------------------------------------------
// [9.1] CEK APAKAH TIM PLAYER LAYAK MENGAJUKAN AKUISISI/MERGER SAMA SEKALI
// (syarat dasar yang berlaku utk KEDUA jalur sebelum cek per-target)
// ------------------------------------------------------------------
function statusEligibilitasJalurMPL() {
    let timPlayerObj = cariTimAsliDiDatabase(timPlayer);
    if (!timPlayerObj) {
        return { layakAkuisisi: false, layakMerger: false, alasanUmum: "Data tim tidak ditemukan." };
    }

    // Sudah di MPL? -> tidak relevan, fitur ini cuma utk naik DARI tier-2 KE MPL
    if (timPlayerObj.liga === "MPL") {
        return { layakAkuisisi: false, layakMerger: false, alasanUmum: "Tim kamu sudah berada di MPL." };
    }

    // Harus dari liga tier-2 (MDL/MAL). LEN belum bisa langsung lompat ke MPL.
    if (timPlayerObj.liga !== "MDL" && timPlayerObj.liga !== "MAL") {
        return { layakAkuisisi: false, layakMerger: false, alasanUmum: "Hanya tim di liga MDL/MAL yang bisa mengajukan akuisisi atau merger ke MPL." };
    }

    // Musim minimal 1 di liga tier-2 -- pakai musimDiLigaSaatIni yang
    // di-tracking di [9.6]. Default 0 kalau belum pernah di-set (musim pertama).
    let musimDiTier2 = window.musimDiLigaSaatIniPlayer || 0;
    let cukupMusim = musimDiTier2 >= 1;

    let layakAkuisisi = cukupMusim && kasTim > 0 && (reputasiTim || 0) >= 70;
    let layakMerger = (reputasiTim || 0) >= 65 && (timPlayerObj.power || 0) >= 68;
    // [FIX] Klaim slot kosong -- syarat jauh lebih ringan drpd akuisisi/merger
    // normal, karena slotnya kosong total (gak ada org/roster yg perlu
    // "diyakinkan"). Cuma butuh syarat dasar (tier-2, minimal 1 musim, bukan
    // afiliasi) + biaya administrasi kecil, bukan reputasi/power tinggi.
    let layakKlaimSlotKosong = cukupMusim;

    // Tim AFILIASI tidak bisa akuisisi/merger mandiri sama sekali --
    // slot mereka milik organisasi induk MPL, bukan keputusan player sendiri.
    if (timPlayerObj.tipeSlot === "Afiliasi") {
        layakAkuisisi = false;
        layakMerger = false;
        layakKlaimSlotKosong = false;
    }

    let alasanAkuisisi = timPlayerObj.tipeSlot === "Afiliasi" ? "Tim afiliasi tidak bisa mengajukan akuisisi mandiri -- slot ini milik organisasi induk MPL."
                        : !cukupMusim ? "Minimal harus 1 musim dulu di liga tier-2 sebelum bisa akuisisi slot MPL."
                        : (reputasiTim || 0) < 70 ? `Reputasi tim minimal 70 untuk akuisisi (reputasi kamu: ${reputasiTim || 0}).`
                        : null;

    let alasanMerger = timPlayerObj.tipeSlot === "Afiliasi" ? "Tim afiliasi tidak bisa mengajukan merger mandiri -- slot ini milik organisasi induk MPL."
                      : (reputasiTim || 0) < 65 ? `Reputasi tim minimal 65 untuk merger (reputasi kamu: ${reputasiTim || 0}).`
                      : (timPlayerObj.power || 0) < 68 ? `Power tim minimal 68 untuk merger (power kamu: ${timPlayerObj.power || 0}).`
                      : null;

    let alasanKlaimSlotKosong = timPlayerObj.tipeSlot === "Afiliasi" ? "Tim afiliasi tidak bisa mengklaim slot kosong secara mandiri -- slot ini milik organisasi induk MPL."
                               : !cukupMusim ? "Minimal harus 1 musim dulu di liga tier-2 sebelum bisa klaim slot kosong MPL."
                               : null;

    return {
        layakAkuisisi, layakMerger, layakKlaimSlotKosong,
        alasanAkuisisi, alasanMerger, alasanKlaimSlotKosong,
        timPlayerObj, musimDiTier2
    };
}

// ------------------------------------------------------------------
// [9.2] AMBIL DAFTAR TIM MPL FRANCHISE YANG BISA JADI TARGET
// (ID/PH/MY saja, SG dikecualikan; sertakan status keuangan terkini)
// ------------------------------------------------------------------
function ambilTargetMPLFranchise() {
    let semuaTimMPL = [
        ...daftarTim.map(t => ({ ...t, _region: "ID", _bendera: "🇮🇩" })),
        ...daftarTimPH.map(t => ({ ...t, _region: "PH", _bendera: "🇵🇭" })),
        ...daftarTimMY.map(t => ({ ...t, _region: "MY", _bendera: "🇲🇾" }))
    ];
    // Hanya tim yang bukan milik player sendiri & bukan slot kosong franchise
    // (slot KOSONG_FRANCHISE ditangani terpisah di [9.5] sebagai kasus khusus)
    return semuaTimMPL.filter(t => t.nama !== timPlayer);
}

// ------------------------------------------------------------------
// [9.3] HITUNG HARGA SLOT — formula: reputasi x kas x modifier
// Modifier dasar dipakai supaya angka tidak meledak terlalu ekstrem;
// kalibrasi: tim reputasi 60 & kas 2 Miliar -> sekitar 0.8-1.2 Miliar
//            tim reputasi 75 & kas 4.5 Miliar -> sekitar 3-5 Miliar
// ------------------------------------------------------------------
function hitungHargaSlot(timTarget) {
    let reputasi = timTarget.reputasi || 50;
    let kas = Math.max(0, timTarget.kas || 0);
    // FIX: modifier sebelumnya (0.000000012) salah kalibrasi -- hasil jadi
    // ribuan rupiah, bukan miliaran. Nilai 0.01 sudah divalidasi pas dengan
    // 2 contoh acuan di rangkuman desain:
    //   NAVI (rep 60, kas 2M)   -> ~1.2 Miliar (target 0.8-1.2 Miliar) ✓
    //   EVOS (rep 75, kas 4.5M) -> ~3.375 Miliar (target 3-5 Miliar) ✓
    const MODIFIER_HARGA_SLOT = 0.01;

    let hargaDasar = reputasi * kas * MODIFIER_HARGA_SLOT;
    // Floor minimum supaya tim dgn kas sangat kecil tetap punya harga wajar
    let floorMinimum = 500000000;
    return Math.max(floorMinimum, Math.floor(hargaDasar));
}

// ------------------------------------------------------------------
// [9.4] CEK APAKAH TIM TARGET BISA DIAJUKAN TAWARAN AKUISISI
// Target HARUS status PERINGATAN/KRISIS -- tim SEHAT selalu menolak.
// ------------------------------------------------------------------
function timBolehDiakuisisi(timTarget) {
    if (!timTarget) return { boleh: false, alasan: "Tim tidak ditemukan." };
    if (timTarget.region === "SG") return { boleh: false, alasan: "MPL Singapura non-franchise, tidak ada slot yang bisa diakuisisi." };
    if (timTarget.statusKeuangan === "KOSONG_FRANCHISE") return { boleh: false, alasan: "Slot ini kosong total -- gunakan jalur klaim slot kosong, bukan akuisisi." };

    if (timTarget.statusKeuangan !== "PERINGATAN" && timTarget.statusKeuangan !== "KRISIS") {
        return { boleh: false, alasan: `${timTarget.nama} masih dalam kondisi keuangan SEHAT dan menolak semua tawaran akuisisi.` };
    }

    return { boleh: true };
}

// ------------------------------------------------------------------
// [9.5] CEK APAKAH TIM TARGET BISA DIAJUKAN PROPOSAL MERGER
// Merger bisa diajukan ke tim status PERINGATAN/KRISIS (lebih mudah
// diterima kalau KRISIS -- lihat probabilitas penerimaan di [9.7]/[9.8]).
// ------------------------------------------------------------------
function timBolehDiMerger(timTarget) {
    if (!timTarget) return { boleh: false, alasan: "Tim tidak ditemukan." };
    if (timTarget.region === "SG") return { boleh: false, alasan: "MPL Singapura non-franchise, tidak ada slot yang bisa di-merger." };
    if (timTarget.statusKeuangan === "KOSONG_FRANCHISE") return { boleh: false, alasan: "Slot ini kosong total -- gunakan jalur klaim slot kosong, bukan merger." };

    if (timTarget.statusKeuangan !== "PERINGATAN" && timTarget.statusKeuangan !== "KRISIS") {
        return { boleh: false, alasan: `${timTarget.nama} masih dalam kondisi keuangan SEHAT dan tidak terbuka untuk proposal merger.` };
    }

    return { boleh: true };
}

// ------------------------------------------------------------------
// [9.5b] KLAIM SLOT KOSONG (KOSONG_FRANCHISE) -- jalur BARU, dedicated
// buat slot MPL yang kolaps total. Biaya administrasi flat, jauh lebih
// murah drpd akuisisi normal (floor 500 Juta), karena gak ada roster/
// kas/reputasi yang dibawa dari tim lama -- slotnya beneran kosong.
// ------------------------------------------------------------------
const BIAYA_KLAIM_SLOT_KOSONG = 300000000; // Rp 300 Juta, biaya administrasi
// [FIX] Nempelin ke window -- dipakai juga di script.js (UI render), jaga-jaga
// kalau ada masalah cross-file scope kayak yang pernah kejadian di transfer.js.
window.BIAYA_KLAIM_SLOT_KOSONG = BIAYA_KLAIM_SLOT_KOSONG;

function timBolehDiklaimSlotKosong(timTarget) {
    if (!timTarget) return { boleh: false, alasan: "Tim tidak ditemukan." };
    if (timTarget.region === "SG") return { boleh: false, alasan: "MPL Singapura non-franchise, tidak ada slot yang bisa diklaim." };
    if (timTarget.statusKeuangan !== "KOSONG_FRANCHISE") return { boleh: false, alasan: "Slot ini bukan slot kosong -- gunakan jalur akuisisi atau merger biasa." };
    return { boleh: true };
}

function eksekusiKlaimSlotKosong(timTargetNama) {
    let elig = statusEligibilitasJalurMPL();
    if (!elig.layakKlaimSlotKosong) {
        return { sukses: false, pesan: elig.alasanKlaimSlotKosong || "Tim kamu belum memenuhi syarat klaim slot kosong." };
    }

    let timTarget = cariTimAsliDiDatabase(timTargetNama);
    let cekBoleh = timBolehDiklaimSlotKosong(timTarget);
    if (!cekBoleh.boleh) {
        return { sukses: false, pesan: cekBoleh.alasan };
    }

    if (kasTim < BIAYA_KLAIM_SLOT_KOSONG) {
        return { sukses: false, pesan: `Kas kamu (Rp ${kasTim.toLocaleString("id-ID")}) tidak cukup untuk biaya administrasi klaim (Rp ${BIAYA_KLAIM_SLOT_KOSONG.toLocaleString("id-ID")}).` };
    }

    let infoSlotLama = cariInfoSlotTier2Player();
    let kasSetelahBayar = kasTim - BIAYA_KLAIM_SLOT_KOSONG;
    let namaTimSebelumPindah = timPlayer;

    let berhasilPindah = pindahkanPlayerKeMPL(timTarget, kasSetelahBayar, timTarget.nama);
    if (!berhasilPindah) {
        return { sukses: false, pesan: "Terjadi kesalahan saat memproses klaim slot." };
    }

    let hasilIsiUlang = null;
    if (infoSlotLama) {
        hasilIsiUlang = isiUlangSlotTier2Ditinggalkan(infoSlotLama);
    }

    if (typeof tambahBerita === "function") {
        tambahBerita(`🏳️ Slot Diklaim: <span>${namaTimSebelumPindah}</span> resmi mengklaim slot MPL kosong bekas <b>${timTarget.nama}</b> seharga Rp ${BIAYA_KLAIM_SLOT_KOSONG.toLocaleString("id-ID")}.`);
    }
    if (typeof catatKas === "function") {
        catatKas("KELUAR", BIAYA_KLAIM_SLOT_KOSONG, `Klaim Slot Kosong MPL: ${timTarget.nama}`);
    }

    return { sukses: true, biayaDibayar: BIAYA_KLAIM_SLOT_KOSONG, namaTimBaru: timPlayer, hasilIsiUlang };
}

// ==========================================
// BAGIAN 2 — EKSEKUSI AKUISISI/MERGER & NASIB SLOT TIER-2 YANG DITINGGALKAN
// ==========================================

// ------------------------------------------------------------------
// [9.6] CARI OBJEK TIM TIER-2 PLAYER DI DATABASE & DATABASE-NYA LANGSUNG
// (dibutuhkan utk tahu apakah player Independen/Challenger ATAU Afiliasi,
// karena nasib slotnya beda -- lihat [9.9])
// ------------------------------------------------------------------
function cariInfoSlotTier2Player() {
    let kandidatDb = [
        { arr: typeof daftarTimMDL_Independen_ID !== "undefined" ? daftarTimMDL_Independen_ID : [], nama: "daftarTimMDL_Independen_ID", liga: "MDL", region: "ID" },
        { arr: typeof daftarTimMDL_Independen_PH !== "undefined" ? daftarTimMDL_Independen_PH : [], nama: "daftarTimMDL_Independen_PH", liga: "MDL", region: "PH" },
        { arr: typeof daftarTimMAL_Challenger_MY !== "undefined" ? daftarTimMAL_Challenger_MY : [], nama: "daftarTimMAL_Challenger_MY", liga: "MAL", region: "MY" },
        { arr: typeof daftarTimMDL_Afiliasi_ID !== "undefined" ? daftarTimMDL_Afiliasi_ID : [], nama: "daftarTimMDL_Afiliasi_ID", liga: "MDL", region: "ID" },
        { arr: typeof daftarTimMDL_Afiliasi_PH !== "undefined" ? daftarTimMDL_Afiliasi_PH : [], nama: "daftarTimMDL_Afiliasi_PH", liga: "MDL", region: "PH" },
        { arr: typeof daftarTimMAL_Affiliated_MY !== "undefined" ? daftarTimMAL_Affiliated_MY : [], nama: "daftarTimMAL_Affiliated_MY", liga: "MAL", region: "MY" }
    ];

    for (let db of kandidatDb) {
        let idx = db.arr.findIndex(t => t.nama === timPlayer);
        if (idx !== -1) {
            return { db: db.arr, dbNama: db.nama, idx, tim: db.arr[idx], liga: db.liga, region: db.region };
        }
    }
    return null;
}

// ------------------------------------------------------------------
// [9.7] NASIB SLOT TIER-2 YANG DITINGGALKAN PLAYER
// Sesuai keputusan desain:
// - Player Independen/Challenger -> slot kosong, idealnya masuk Playoff
//   Degradasi/Open Qualifier (Fase 11-13). Karena modul liga penuh belum
//   ada, untuk SEMENTARA slot diisi otomatis oleh tim LEN terbaik yang
//   belum punya slot tier-2 (representasi sederhana dari "naik kelas"),
//   sampai engine liga penuh menggantikan logika ini.
// - Player Afiliasi -> TIDAK BISA merger/akuisisi mandiri sama sekali
//   (dicegah dari sisi UI/validasi di [9.10], bukan di sini).
// ------------------------------------------------------------------
function isiUlangSlotTier2Ditinggalkan(infoSlot) {
    if (!infoSlot) return null;

    // Cari tim LEN dgn power tertinggi yang akan "naik" mengisi slot ini
    // (representasi sementara pra-Fase 11; nama tim TIDAK diubah, cuma
    // dipindah ke database tier-2 yang sesuai)
    if (typeof daftarTimLEN === "undefined" || daftarTimLEN.length === 0) {
        return { berhasil: false, alasan: "Tidak ada tim LEN yang tersedia untuk mengisi slot." };
    }

    let timLENTerbaik = [...daftarTimLEN].sort((a, b) => (b.power || 0) - (a.power || 0))[0];

    // Pindahkan tim LEN terbaik ke slot tier-2 yang ditinggalkan
    let timNaik = { ...timLENTerbaik, liga: infoSlot.liga, region: infoSlot.region, tipeSlot: "Independen" };
    daftarTimLEN = daftarTimLEN.filter(t => t.nama !== timLENTerbaik.nama);
    infoSlot.db[infoSlot.idx] = timNaik;

    if (typeof tambahBerita === "function") {
        tambahBerita(`📈 Promosi: <span>${timNaik.nama}</span> naik dari LEN mengisi slot ${infoSlot.liga} yang ditinggalkan setelah promosi ke MPL.`);
    }

    return { berhasil: true, timNaik: timNaik.nama };
}

// ------------------------------------------------------------------
// [9.8] PINDAHKAN PLAYER KE SLOT MPL TARGET (dipakai oleh akuisisi & merger)
// Mengubah timPlayer, ligaPlayer, regionPlayer, dan menyalin roster/kas
// player ke slot baru sesuai aturan masing-masing jalur.
// ------------------------------------------------------------------
function pindahkanPlayerKeMPL(timTargetAsli, kasBaruPlayer, namaTimBaru) {
    let timBaruObj = cariTimAsliDiDatabase(timTargetAsli.nama);
    if (!timBaruObj) return false;

    // Salin roster & staff player ke slot MPL baru
    timBaruObj.roster = rosterKita;
    timBaruObj.staff = staffKita;
    timBaruObj.nama = namaTimBaru || timBaruObj.nama;
    timBaruObj.kas = kasBaruPlayer;
    timBaruObj.reputasi = reputasiTim;
    timBaruObj.ceo = { nama: namaManajer, umur: null, keahlianFinansial: null, _isPlayer: true };
    timBaruObj.statusKeuangan = "SEHAT";
    timBaruObj.power = (typeof hitungPowerTim === "function") ? hitungPowerTim(timBaruObj) : timBaruObj.power;

    // Update state global player
    timPlayer = timBaruObj.nama;
    ligaPlayer = "MPL";
    regionPlayer = timBaruObj.region || timBaruObj._region;
    kasTim = kasBaruPlayer;

    return true;
}

// ------------------------------------------------------------------
// [9.9] EKSEKUSI AKUISISI SLOT
// Player bayar harga slot, dapat slot MPL (identitas bisa dipertahankan
// atau diganti -- default dipertahankan nama tim target untuk simplisitas,
// player tetap bisa rename lewat fitur ganti nama tim yg sudah ada kalau ada).
// ------------------------------------------------------------------
function eksekusiAkuisisiSlot(timTargetNama, namaKustom) {
    let elig = statusEligibilitasJalurMPL();
    if (!elig.layakAkuisisi) {
        return { sukses: false, pesan: elig.alasanAkuisisi || "Tim kamu belum memenuhi syarat akuisisi." };
    }

    let timTarget = cariTimAsliDiDatabase(timTargetNama);
    let cekBoleh = timBolehDiakuisisi(timTarget);
    if (!cekBoleh.boleh) {
        return { sukses: false, pesan: cekBoleh.alasan };
    }

    let harga = hitungHargaSlot(timTarget);
    if (kasTim < harga) {
        return { sukses: false, pesan: `Kas kamu (Rp ${kasTim.toLocaleString("id-ID")}) tidak cukup untuk harga slot ini (Rp ${harga.toLocaleString("id-ID")}).` };
    }

    // Tim AI evaluasi -- karena target sudah PERINGATAN/KRISIS, tawaran
    // yang memenuhi harga MINIMAL pasti diterima (mereka butuh dana).
    let infoSlotLama = cariInfoSlotTier2Player();
    let kasSetelahBayar = kasTim - harga;
    let namaTimSebelumPindah = timPlayer;

    // [FIX] Nama bisa dipilih player -- default nama target kalau kosong/
    // gak diisi (mempertahankan perilaku lama sebagai fallback aman).
    let namaFinal = (namaKustom && namaKustom.trim().length > 0) ? namaKustom.trim() : timTarget.nama;

    // [FIX] Simpan nama ASLI target sebelum pindahkanPlayerKeMPL me-mutate
    // timTarget.nama jadi namaFinal -- kalau gak disimpan duluan, pesan
    // berita di bawah bakal salah nunjuk (nama baru dikira nama lama).
    let namaTargetAsli = timTarget.nama;

    let berhasilPindah = pindahkanPlayerKeMPL(timTarget, kasSetelahBayar, namaFinal);
    if (!berhasilPindah) {
        return { sukses: false, pesan: "Terjadi kesalahan saat memproses akuisisi." };
    }

    // Isi ulang slot tier-2 yang ditinggalkan (kalau player sebelumnya Independen/Challenger)
    let hasilIsiUlang = null;
    if (infoSlotLama) {
        hasilIsiUlang = isiUlangSlotTier2Ditinggalkan(infoSlotLama);
    }

    if (typeof tambahBerita === "function") {
        let teksIdentitas = (namaFinal !== namaTargetAsli)
            ? `resmi mengakuisisi slot MPL milik <b>${namaTargetAsli}</b> dan berganti identitas jadi <b>${namaFinal}</b>`
            : `resmi mengakuisisi slot MPL milik <b>${namaTargetAsli}</b>`;
        tambahBerita(`🏦 Akuisisi Berhasil: <span>${namaTimSebelumPindah}</span> ${teksIdentitas} seharga Rp ${harga.toLocaleString("id-ID")}.`);
    }
    if (typeof catatKas === "function") {
        catatKas("KELUAR", harga, `Akuisisi Slot MPL: ${namaTargetAsli}`);
    }

    return { sukses: true, hargaDibayar: harga, namaTimBaru: timPlayer, hasilIsiUlang };
}

// ------------------------------------------------------------------
// [9.10] EKSEKUSI MERGER SUKARELA
// Player ajukan proposal merger -- evaluasi probabilistik (lebih mudah
// diterima kalau target KRISIS dibanding cuma PERINGATAN), reputasi
// player turun -10 di awal sebagai risiko (sesuai desain).
// ------------------------------------------------------------------
function eksekusiMergerSukarela(timTargetNama) {
    let elig = statusEligibilitasJalurMPL();
    if (!elig.layakMerger) {
        return { sukses: false, pesan: elig.alasanMerger || "Tim kamu belum memenuhi syarat merger." };
    }

    let timTarget = cariTimAsliDiDatabase(timTargetNama);
    let cekBoleh = timBolehDiMerger(timTarget);
    if (!cekBoleh.boleh) {
        return { sukses: false, pesan: cekBoleh.alasan };
    }

    // Cegah tim AFILIASI mengajukan merger (slot bukan milik mereka sendiri)
    let infoSlotLama = cariInfoSlotTier2Player();
    if (infoSlotLama && (infoSlotLama.dbNama.includes("Afiliasi") || infoSlotLama.dbNama.includes("Affiliated"))) {
        return { sukses: false, pesan: "Tim afiliasi tidak bisa mengajukan merger mandiri -- slot ini milik organisasi induk MPL." };
    }

    // Probabilitas penerimaan proposal: lebih tinggi kalau target KRISIS
    let probabilitasTerima = timTarget.statusKeuangan === "KRISIS" ? 0.75 : 0.40;
    let diterima = Math.random() < probabilitasTerima;

    if (!diterima) {
        return { sukses: false, pesan: `${timTarget.nama} mempertimbangkan proposalmu, tapi akhirnya menolak untuk saat ini. Coba lagi musim depan.`, ditolakSementara: true };
    }

    // Merger: kas gabungan, player pilih nama (default: gabungan nama)
    let kasGabungan = Math.floor((timTarget.kas || 0) * 0.6) + kasTim;
    let namaGabungan = timPlayer + " x " + timTarget.nama;
    let namaTimSebelumPindah = timPlayer;

    let berhasilPindah = pindahkanPlayerKeMPL(timTarget, kasGabungan, namaGabungan);
    if (!berhasilPindah) {
        return { sukses: false, pesan: "Terjadi kesalahan saat memproses merger." };
    }

    // Risiko reputasi -10 di awal (sesuai desain)
    reputasiTim = Math.max(0, reputasiTim - 10);
    let timBaruObj = cariTimAsliDiDatabase(timPlayer);
    if (timBaruObj) timBaruObj.reputasi = reputasiTim;

    let hasilIsiUlang = null;
    if (infoSlotLama) {
        hasilIsiUlang = isiUlangSlotTier2Ditinggalkan(infoSlotLama);
    }

    if (typeof tambahBerita === "function") {
        tambahBerita(`🤝 Merger Disetujui: <span>${namaTimSebelumPindah}</span> resmi merger dengan <b>${timTarget.nama}</b> dan kini tampil di MPL sebagai <b>${namaGabungan}</b>.`);
    }
    if (typeof catatKas === "function") {
        let suntikanModal = kasGabungan - kasTim; // kontribusi kas dari pihak merger (60% kas target)
        if (suntikanModal > 0) catatKas("MASUK", suntikanModal, `Suntikan Modal Merger: ${timTarget.nama}`);
    }

    return { sukses: true, namaTimBaru: timPlayer, reputasiBaru: reputasiTim, hasilIsiUlang };
}

// ==========================================
// FASE 10 — NOTIFIKASI BERITA & EMAIL PELUANG AKUISISI
// ==========================================
//
// Berbeda dengan berita generik Fase 5/6 (yang berlaku utk SEMUA tim AI
// termasuk LEN/MDL), notifikasi di sini SPESIFIK soal peluang akuisisi
// MPL untuk player, dan HANYA dikirim kalau:
// 1. Player memenuhi minimal salah satu syarat dasar (sudah pernah di
//    liga tier-2, supaya tidak spam ke player yang masih di LEN/baru mulai)
// 2. Tim MPL target benar-benar berstatus PERINGATAN/KRISIS musim ini
// 3. Belum pernah dikirim utk kombinasi (tim, status) yang sama
//    sebelumnya -- dilacak lewat window._notifAkuisisiTerkirim
//
// Sesuai rangkuman desain:
//   📰 Berita -> muncul kalau tim MPL masuk status PERINGATAN
//   📧 Email  -> muncul kalau tim MPL masuk status KRISIS (lebih personal,
//                mengundang player utk bertindak)
// ==========================================

// ------------------------------------------------------------------
// [10.1] CEK APAKAH NOTIFIKASI SUDAH PERNAH DIKIRIM UTK KOMBINASI INI
// (supaya tidak spam tiap musim kalau status tim tidak berubah)
// ------------------------------------------------------------------
function sudahPernahNotifAkuisisi(namaTim, status) {
    if (!window._notifAkuisisiTerkirim) window._notifAkuisisiTerkirim = {};
    let key = namaTim + "::" + status;
    return !!window._notifAkuisisiTerkirim[key];
}

function tandaiNotifAkuisisiTerkirim(namaTim, status) {
    if (!window._notifAkuisisiTerkirim) window._notifAkuisisiTerkirim = {};
    window._notifAkuisisiTerkirim[namaTim + "::" + status] = true;
}

// ------------------------------------------------------------------
// [10.2] CEK APAKAH PLAYER "LAYAK" MENERIMA NOTIFIKASI INI SAMA SEKALI
// (player yang masih di LEN/baru mulai musim pertama tidak perlu diganggu
// dengan peluang yang belum relevan buat mereka)
// ------------------------------------------------------------------
function playerLayakNotifAkuisisi() {
    let timPlayerObj = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;
    if (!timPlayerObj) return false;
    if (timPlayerObj.liga === "MPL") return false; // sudah di MPL, tidak relevan lagi
    if (timPlayerObj.liga !== "MDL" && timPlayerObj.liga !== "MAL") return false; // masih LEN
    if (timPlayerObj.tipeSlot === "Afiliasi") return false; // afiliasi tidak bisa akuisisi/merger sama sekali
    return true;
}

// ------------------------------------------------------------------
// [10.3] FUNGSI UTAMA — dipanggil tiap akhir musim, SETELAH status
// keuangan semua tim MPL diupdate (Fase 5) dan resolusi krisis (Fase 6)
// sudah selesai, supaya status yang dicek adalah status final musim ini.
// ------------------------------------------------------------------
function prosesNotifikasiPeluangAkuisisi() {
    if (!playerLayakNotifAkuisisi()) return;

    let targetMPL = (typeof ambilTargetMPLFranchise === "function") ? ambilTargetMPLFranchise() : [];

    targetMPL.forEach(tim => {
        let timAsli = cariTimAsliDiDatabase(tim.nama); // pastikan baca status TERKINI, bukan snapshot
        if (!timAsli) return;
        let status = timAsli.statusKeuangan;

        if (status === "PERINGATAN" && !sudahPernahNotifAkuisisi(tim.nama, "PERINGATAN")) {
            if (typeof tambahBerita === "function") {
                tambahBerita(`📰 Sumber internal: <span>${tim.nama}</span> dilaporkan mulai kesulitan finansial musim ini. Bisa jadi peluang menarik kalau situasinya memburuk...`);
            }
            tandaiNotifAkuisisiTerkirim(tim.nama, "PERINGATAN");
        }

        if (status === "KRISIS" && !sudahPernahNotifAkuisisi(tim.nama, "KRISIS")) {
            if (typeof tambahEmail === "function") {
                tambahEmail(
                    `Peluang dari ${tim.nama}`,
                    "Agen Transfer",
                    `Halo ${namaManajer || "Manajer"},<br><br>Kami dengar <b>${tim.nama}</b> sedang mengalami kesulitan finansial yang serius musim ini. Sumber kami menyebutkan mereka mungkin membuka diri untuk negosiasi akuisisi slot atau bahkan merger.<br><br>Kalau kamu tertarik, cek detail dan ajukan penawaran langsung dari sini:<br><br><button class="email-action-btn" onclick="bukaSubLayar('layarAkuisisiMerger')">Lihat Peluang Akuisisi &amp; Merger</button><br><br>Salam,<br>Agen Transfer`
                );
            }
            tandaiNotifAkuisisiTerkirim(tim.nama, "KRISIS");
        }

        // Reset tanda kalau tim sudah pulih ke SEHAT -- supaya kalau nanti
        // krisis lagi di musim depan, notifikasi bisa dikirim ulang
        if (status === "SEHAT") {
            if (window._notifAkuisisiTerkirim) {
                delete window._notifAkuisisiTerkirim[tim.nama + "::PERINGATAN"];
                delete window._notifAkuisisiTerkirim[tim.nama + "::KRISIS"];
            }
        }
    });
}

// ==========================================
// CATATAN INTEGRASI FASE 10:
// prosesNotifikasiPeluangAkuisisi() dipanggil di script.js di dalam
// prosesEkosistemAI(), SETELAH prosesPensiunResignCEO() (Fase 7), supaya
// status keuangan & hasil resolusi krisis musim ini sudah final.
// ==========================================


