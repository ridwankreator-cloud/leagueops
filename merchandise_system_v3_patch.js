// ==========================================================================
// MERCHANDISE SYSTEM v3 — PATCH FILE
// Implementasi penuh dari MERCHANDISE_SYSTEM_SPEC_v3.md
// Load file ini SETELAH patches_postgame.js (menimpa prosesRevenueMerchandise
// & prosesFanbasePascaMatch versi lama, item lama di-reset).
//
// TIDAK mengubah file lama — semua fungsi lama ("hitungEstimasiMerchandise",
// "bukaTambahMerchandise", dst) dibiarkan ada di patches_postgame.js untuk
// gampang rollback, tapi tidak lagi dipanggil oleh alur game setelah patch
// ini dimuat.
// ==========================================================================

// ==========================================================================
// [0] KONSTANTA & MULTIPLIER  (Spec §3)
// ==========================================================================
const MERCH_V3 = {
    BASE_DEMAND_RATE: 0.02,

    // Bobot distribusi demand — ID item disamakan dgn key FANBASE_CONFIG.merkPerItem
    // yang sudah ada (jersey/hoodie/cap/mousepad/keychain/figurine), supaya kompatibel
    // dgn data lama. Mapping ke istilah spec: cap=topi, keychain=gantungan_kunci, figurine=figur.
    BOBOT: {
        jersey: 0.35, hoodie: 0.20, cap: 0.15,
        mousepad: 0.12, keychain: 0.10, figurine: 0.08
    },

    // Harga produksi per kualitas per item (dari dokumen spesifikasi awal)
    HARGA_PRODUKSI: {
        jersey:   { premium: 100000, standar: 75000,  biasa: 50000  },
        hoodie:   { premium: 200000, standar: 150000, biasa: 100000 },
        cap:      { premium: 75000,  standar: 50000,  biasa: 25000  },
        mousepad: { premium: 180000, standar: 120000, biasa: 70000  },
        keychain: { premium: 35000,  standar: 20000,  biasa: 5000   },
        figurine: { premium: 500000, standar: 300000, biasa: 150000 }
    },

    NAMA_ITEM: {
        jersey: "Jersey", hoodie: "Hoodie", cap: "Topi",
        mousepad: "Mousepad", keychain: "Gantungan Kunci", figurine: "Figur Pemain"
    },

    MORAL_MULT: { min: 0.85, max: 1.15 },   // linear thd moral 0-100

    KUALITAS_MULT: { premium: 1.10, standar: 1.00, biasa: 0.90 },

    HARGA_BRACKETS: [
        { maks: 20,  mult: 1.20 },
        { maks: 40,  mult: 1.10 },
        { maks: 70,  mult: 1.05 },
        { maks: 100, mult: 1.00 },
        { maks: 150, mult: 0.90 },
        { maks: 200, mult: 0.80 },
        { maks: Infinity, mult: 0.60 }
    ],

    // [FIX] Batas markup harga jual maksimal (kelipatan dari harga produksi).
    // SEBELUMNYA gak ada batas atas sama sekali -- cuma dicek "> 0" doang --
    // padahal HARGA_BRACKETS di atas cuma didesain sampe markup 200% (3x
    // produksi); di atas itu SEMUA disamain jadi 0.6x demand (gak tambah
    // "dihukum" walau markup-nya 1000%+). Kombinasi ini bikin harga jual
    // ekstrem (misal 1500x modal) masih bisa ludes terjual & ngehasilin
    // pendapatan yang gak masuk akal. 6x modal (markup 500%) dikasih
    // buffer di atas batas tabel biar tetap fleksibel buat strategi harga
    // premium, tapi gak sampe ke titik absurd.
    MAKS_MARKUP_MULT: 6,

    USIA_BRACKETS: [
        { maks: 4,  mult: 1.00 },
        { maks: 8,  mult: 0.95 },
        { maks: 12, mult: 0.90 },
        { maks: 16, mult: 0.85 },
        { maks: Infinity, mult: 0.80 }
    ],

    RANDOM: { clampMin: 0.95, clampMax: 1.05 },

    // Tabel bonus/penalti prestasi per liga (dari dokumen spesifikasi awal)
    PRESTASI_TABLE: {
        MPL:     { juara: 0.30, runnerUp: 0.15, winStreak5: 0.10, loseStreak5: -0.10 },
        MDL_MAL: { juara: 0.18, runnerUp: 0.10, winStreak5: 0.07, loseStreak5: -0.07 },
        LEN:     { juara: 0.10, runnerUp: 0.05, winStreak5: 0.02, loseStreak5: -0.02 }
    },
    PRESTASI_MULT: { floor: 0.90, cap: 1.50 },
    PRESTASI_WINDOW_MINGGU: 2,   // durasi tetap bonus juara/runner-up

    LE: {
        windowProduksiMinggu: 2,
        maxUnitPerBatch: 100,
        maxBatchPerEventPerItem: 1,
        kualitasOtomatis: "premium"
    },

    REGULER: {
        minUnitPerBatch: 10,
        maxBatchPerSeasonPerItem: 2
    },

    DISKON_OPTIONS: [0, 10, 20, 30, 40, 50]
};

// ==========================================================================
// [1] INISIALISASI STATE  (Spec §2, §12 migrasi = reset total)
// ==========================================================================
function initMerchandiseSystemV3() {
    fanbase.merchandise = [];              // sistem lama dikosongkan (reset total, LOCKED)
    fanbase.pendapatanMerchandise = 0;
    fanbase.merchBatches = [];
    fanbase.merchMingguAbsolut = 0;
    fanbase.merchJatahReguler = {};        // { itemId: jumlah batch sudah dipakai musim ini }
    fanbase.merchJatahLE = {};             // { eventId: { itemId: true/false } }
    fanbase.merchNamaAktifArr = [];        // nama batch yang lagi aktif (validasi unik global)
    fanbase.merchPrestasiEvents = [];      // [{liga, tipe, mingguMulaiAbsolut, mingguSelesaiAbsolut}]
    fanbase.merchStreakMenang = 0;         // win-streak organisasi (real-time)
    Object.keys(MERCH_V3.BOBOT).forEach(id => fanbase.merchJatahReguler[id] = 0);
}

// Reset jatah batch Reguler di awal season baru. PANGGIL fungsi ini di titik
// season-transition existing (biasanya tempat `musimKe++`). Belum di-hook
// otomatis karena lokasi persis transisi season di script.js perlu dicek
// manual oleh Ridwan supaya tidak salah tempat.
window.resetJatahBatchRegulerV3 = function() {
    if (!fanbase.merchJatahReguler) return;
    Object.keys(MERCH_V3.BOBOT).forEach(id => fanbase.merchJatahReguler[id] = 0);
};

// ==========================================================================
// [2] FUNGSI MULTIPLIER  (Spec §3, §9, §10, §11, §12, §13)
// ==========================================================================
function hitungMultiplierMoralV3(moral) {
    return MERCH_V3.MORAL_MULT.min + (moral / 100) * (MERCH_V3.MORAL_MULT.max - MERCH_V3.MORAL_MULT.min);
}

function lookupBracket(nilai, brackets) {
    for (const b of brackets) {
        if (nilai <= b.maks) return b.mult;
    }
    return brackets[brackets.length - 1].mult;
}

function hitungMultiplierHargaV3(batch) {
    const hargaProduksi = MERCH_V3.HARGA_PRODUKSI[batch.itemId][batch.kualitas];
    const hargaEfektif = batch.hargaDasar * (1 - batch.diskonAktif / 100);
    const markupPersen = (hargaEfektif / hargaProduksi - 1) * 100;
    return lookupBracket(markupPersen, MERCH_V3.HARGA_BRACKETS);
}

function hitungMultiplierUsiaV3(batch, mingguSaatIni) {
    const usiaMinggu = mingguSaatIni - batch.mingguProduksi;
    return lookupBracket(usiaMinggu, MERCH_V3.USIA_BRACKETS);
}

function _gaussianRandom() {
    // Box-Muller transform, mean 0 stdDev 1
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function hitungMultiplierRandomV3() {
    const stdDev = 0.025; // kecil, supaya mayoritas hasil deket 1.00 sebelum di-clamp
    const raw = 1.00 + _gaussianRandom() * stdDev;
    return Math.min(MERCH_V3.RANDOM.clampMax, Math.max(MERCH_V3.RANDOM.clampMin, raw));
}

function hitungMultiplierPrestasiV3(mingguSaatIni) {
    let total = 0;

    // Juara/Runner-up — durasi tetap, prune yang sudah expired
    fanbase.merchPrestasiEvents = (fanbase.merchPrestasiEvents || [])
        .filter(e => mingguSaatIni <= e.mingguSelesaiAbsolut);

    fanbase.merchPrestasiEvents.forEach(e => {
        const tabel = MERCH_V3.PRESTASI_TABLE[e.liga];
        if (tabel && typeof tabel[e.tipe] === "number") total += tabel[e.tipe];
    });

    // Win/Lose Streak — real-time, pakai tabel MPL sebagai basis organisasi
    // (lihat catatan integrasi di bagian [5] soal keterbatasan deteksi liga per-match)
    if ((fanbase.merchStreakMenang || 0) >= 5) total += MERCH_V3.PRESTASI_TABLE.MPL.winStreak5;
    if ((fanbase.streakKalahKita || 0) >= 5)   total += MERCH_V3.PRESTASI_TABLE.MPL.loseStreak5;

    const hasil = 1.00 + total;
    return Math.min(MERCH_V3.PRESTASI_MULT.cap, Math.max(MERCH_V3.PRESTASI_MULT.floor, hasil));
}

// ==========================================================================
// [3] FIFO + LE PRIORITY  (Spec §8)
// ==========================================================================
function getBatchAktifFIFO_LEPriority(itemId) {
    return fanbase.merchBatches
        .filter(b => b.itemId === itemId && b.status === "aktif")
        .sort((a, b) => {
            // 1. LE dulu, baru Reguler
            if (a.kategori !== b.kategori) return a.kategori === "limited_edition" ? -1 : 1;
            // 2. Minggu produksi (lebih tua dulu)
            if (a.mingguProduksi !== b.mingguProduksi) return a.mingguProduksi - b.mingguProduksi;
            // 3. Tie-breaker: insertion order (ID)
            return a.id.localeCompare(b.id);
        });
}

// ==========================================================================
// [4] PROSES PENJUALAN MINGGUAN  (Spec §5-§8, §17-§20 — inti sistem)
// ==========================================================================
function prosesPenjualanMerchandiseMingguanV3() {
    if (!fanbase.merchBatches) initMerchandiseSystemV3();

    fanbase.merchMingguAbsolut++;
    const mingguSaatIni = fanbase.merchMingguAbsolut;

    // Langkah 0: aktivasi batch & diskon yang "menunggu" dari minggu lalu (§8, §16)
    fanbase.merchBatches.forEach(b => {
        if (b.status === "menunggu") b.status = "aktif";
        if (b.status === "aktif" && b.diskonPending !== null) {
            b.diskonAktif = b.diskonPending;
            b.diskonPending = null;
        }
    });

    // Langkah 1-2: Pool Demand -> distribusi bobot ke item (§4-§6)
    const baseDemand = fanbase.jumlah * 1000 * MERCH_V3.BASE_DEMAND_RATE;
    const multMoral = hitungMultiplierMoralV3(fanbase.moral);
    const multPrestasi = hitungMultiplierPrestasiV3(mingguSaatIni);
    const poolDemand = baseDemand * multMoral * multPrestasi;

    let itemDemand = {};
    Object.keys(MERCH_V3.BOBOT).forEach(id => {
        itemDemand[id] = poolDemand * MERCH_V3.BOBOT[id];
    });

    // Langkah 3: Random per item, SATU KALI (§12)
    Object.keys(itemDemand).forEach(id => {
        itemDemand[id] *= hitungMultiplierRandomV3();
    });

    // Langkah 4-5: Alokasi FIFO (Net Leftover Chaining) + Overflow Iteratif (§7, §8)
    let hasilPenjualan = {};   // batchId -> unit terjual
    let itemPunyaSisaStok = new Set(Object.keys(itemDemand));
    let stabil = false;

    while (!stabil) {
        let overflowTotal = 0;

        Array.from(itemPunyaSisaStok).forEach(itemId => {
            const batchAktif = getBatchAktifFIFO_LEPriority(itemId);
            let sisaDemandItem = itemDemand[itemId] || 0;

            for (const b of batchAktif) {
                if (sisaDemandItem <= 0) break;

                const rawShare = sisaDemandItem;   // Net Leftover Chaining
                const multK = MERCH_V3.KUALITAS_MULT[b.kualitas];
                const multH = hitungMultiplierHargaV3(b);
                const multU = hitungMultiplierUsiaV3(b, mingguSaatIni);

                const adjustedDemand = rawShare * multK * multH * multU;
                const unitTerjual = Math.min(Math.floor(adjustedDemand), b.stokTersisa);

                hasilPenjualan[b.id] = (hasilPenjualan[b.id] || 0) + unitTerjual;
                b.stokTersisa -= unitTerjual;
                if (b.stokTersisa === 0) b.status = "habis";

                sisaDemandItem -= unitTerjual;
            }

            // Overflow lintas-item HANYA kalau seluruh batch item ini literally
            // habis stok (§7) — bukan sekadar sisa demand > 0 krn multiplier rendah.
            const semuaBatchHabis = batchAktif.length > 0 &&
                                     batchAktif.every(b => b.stokTersisa === 0);

            if (sisaDemandItem > 0 && semuaBatchHabis) {
                overflowTotal += sisaDemandItem;
                itemPunyaSisaStok.delete(itemId);
            }
            // else: sisa demand (kalau ada) = lost sale, item tetap di
            // itemPunyaSisaStok tapi tidak diapa-apakan lagi iterasi ini.
        });

        if (overflowTotal <= 0 || itemPunyaSisaStok.size === 0) {
            stabil = true;
        } else {
            const totalBobotSisa = Array.from(itemPunyaSisaStok)
                .reduce((sum, id) => sum + MERCH_V3.BOBOT[id], 0);
            // '=' (replace), BUKAN '+=' — demand lama item ini sudah SELESAI
            // diproses di iterasi sebelumnya. Lihat catatan di spec §20.
            itemPunyaSisaStok.forEach(id => {
                itemDemand[id] = overflowTotal * (MERCH_V3.BOBOT[id] / totalBobotSisa);
            });
        }
    }

    // Langkah 6: Hitung pendapatan (§18 — floor sudah terjadi per-batch di atas)
    let pendapatanMingguIni = 0;
    fanbase.merchBatches.forEach(b => {
        const unit = hasilPenjualan[b.id] || 0;
        if (unit > 0) {
            const hargaEfektif = b.hargaDasar * (1 - b.diskonAktif / 100);
            pendapatanMingguIni += unit * hargaEfektif;
        }
    });
    pendapatanMingguIni = Math.floor(pendapatanMingguIni);

    if (pendapatanMingguIni > 0) {
        kasTim += pendapatanMingguIni;
        fanbase.pendapatanMerchandise += pendapatanMingguIni;
        catatKas("MASUK", pendapatanMingguIni, "Pendapatan Merchandise Mingguan");
    }

    // Bersihkan nama batch yang baru habis dari daftar nama aktif (§15)
    fanbase.merchBatches.forEach(b => {
        if (b.status === "habis" && fanbase.merchNamaAktifArr.includes(b.nama)) {
            fanbase.merchNamaAktifArr = fanbase.merchNamaAktifArr.filter(n => n !== b.nama);
        }
    });

    if (typeof renderFanbaseUI === "function") renderFanbaseUI();
    if (typeof renderLayarFanbase === "function") renderLayarFanbase();

    return { pendapatanMingguIni, hasilPenjualan };
}

// Menggantikan fungsi lama — SENGAJA dibuat no-op. Sistem v3 sekarang
// dipicu independen dari statusGame (lihat hook baru di klikTombolUtama,
// script.js), bukan lagi dari prosesFanbasePerMinggu() yang cuma jalan
// pas statusGame === "REGULER". Fungsi ini dibiarkan ada (bukan dihapus)
// supaya prosesFanbasePerMinggu() di patches_postgame.js yang masih
// manggil prosesRevenueMerchandise() gak error -- tapi isinya sengaja
// dikosongkan biar gak DOBEL memproses penjualan minggu yang sama.
function prosesRevenueMerchandise() {
    // no-op -- lihat komentar di atas
}

// ==========================================================================
// [5] TRACKING PRESTASI  (Spec §13)
//
// CATATAN INTEGRASI PENTING:
// Codebase belum punya sistem win-streak generik (cuma streakKalahKita utk
// losing streak). Di bawah ini gw wrap prosesFanbasePascaMatch supaya win
// streak ikut ke-track tanpa ubah file asli. Tapi untuk bonus JUARA/RUNNER-UP
// per liga (MPL/MDL/LEN), titik pemicu-nya tersebar di msc_ewc_engine.js,
// mdl_len_engine.js, dan script.js (window.prosesReputasi(...) dipanggil
// dari banyak tempat). Gw TIDAK auto-wire ke situ karena bisa salah kaitan
// event kalau ditebak. Panggil manual di titik-titik itu:
//
//   catatPrestasiMerchandiseV3('MPL', 'juara')      // saat tim Juara MPL
//   catatPrestasiMerchandiseV3('MPL', 'runnerUp')   // saat Runner-up MPL
//   catatPrestasiMerchandiseV3('MDL_MAL', 'juara')  // saat akademi Juara MDL/MAL
//   catatPrestasiMerchandiseV3('LEN', 'runnerUp')   // dst.
// ==========================================================================
window.catatPrestasiMerchandiseV3 = function(liga, tipe) {
    if (!fanbase.merchBatches) initMerchandiseSystemV3();
    if (!MERCH_V3.PRESTASI_TABLE[liga]) {
        console.warn("[MerchV3] Liga tidak dikenal:", liga);
        return;
    }
    const mulai = fanbase.merchMingguAbsolut;
    const selesai = mulai + MERCH_V3.PRESTASI_WINDOW_MINGGU;
    fanbase.merchPrestasiEvents.push({ liga, tipe, mingguMulaiAbsolut: mulai, mingguSelesaiAbsolut: selesai });

    // LE hanya kebuka dari Juara MPL (§14) -- Juara MDL/MAL/LEN TIDAK
    // membuka akses LE, cuma nyumbang bonus multiplier prestasi (§13).
    if (tipe === "juara" && liga === "MPL") {
        bukaAksesLimitedEditionV3("MPL_" + mulai);
    }
};

// Dipanggil khusus utk Juara MSC / Juara M-Series (§14) -- event ini
// TIDAK ada di tabel bonus prestasi merch (§13 cuma MPL/MDL_MAL/LEN),
// jadi cuma buka akses LE, tanpa nambah multiplierPrestasi.
window.bukaLEDariEventBesarV3 = function(namaEvent) {
    if (!fanbase.merchBatches) initMerchandiseSystemV3();
    bukaAksesLimitedEditionV3(namaEvent + "_" + fanbase.merchMingguAbsolut);
};

// Wrap fungsi lama supaya win-streak organisasi ikut ke-track (real-time,
// mirror dari streakKalahKita yang sudah ada).
if (typeof prosesFanbasePascaMatch === "function") {
    const _prosesFanbasePascaMatch_asli_v3 = prosesFanbasePascaMatch;
    prosesFanbasePascaMatch = function(hasilMatch) {
        _prosesFanbasePascaMatch_asli_v3(hasilMatch);
        if (!fanbase.merchBatches) initMerchandiseSystemV3();
        if (hasilMatch.menang) fanbase.merchStreakMenang = (fanbase.merchStreakMenang || 0) + 1;
        else fanbase.merchStreakMenang = 0;
    };
    // Beberapa bagian kode lama manggil lewat window.hookFanbasePascaMatch
    // (di-assign saat load patches_postgame.js) alih-alih manggil
    // prosesFanbasePascaMatch langsung -- pastikan referensi itu ikut
    // menunjuk ke versi yang sudah di-wrap ini, bukan versi lama.
    window.hookFanbasePascaMatch = prosesFanbasePascaMatch;
}

// ==========================================================================
// [6] LIMITED EDITION  (Spec §14)
// ==========================================================================
function bukaAksesLimitedEditionV3(eventId) {
    if (!fanbase.merchJatahLE[eventId]) {
        fanbase.merchJatahLE[eventId] = {};
        Object.keys(MERCH_V3.BOBOT).forEach(id => fanbase.merchJatahLE[eventId][id] = false);
        fanbase.merchJatahLE[eventId]._mingguBuka = fanbase.merchMingguAbsolut;
    }
}

function _windowLEMasihTerbuka(eventId) {
    const jatah = fanbase.merchJatahLE[eventId];
    if (!jatah) return false;
    return (fanbase.merchMingguAbsolut - jatah._mingguBuka) <= MERCH_V3.LE.windowProduksiMinggu;
}

// ==========================================================================
// [7] VALIDASI NAMA  (Spec §15)
// ==========================================================================
function _namaBatchTersedia(nama) {
    if (!nama || nama.length === 0 || nama.length > 20) return false;
    return !fanbase.merchNamaAktifArr.includes(nama);
}

// ==========================================================================
// [8] PRODUKSI — REGULER  (Spec §15)
// ==========================================================================
window.produksiMerchandiseRegulerV3 = function(itemId, kualitas, jumlah, hargaJual, nama) {
    if (!fanbase.merchBatches) initMerchandiseSystemV3();

    if (!MERCH_V3.BOBOT[itemId]) {
        bukaModal("Item Tidak Dikenal", "Jenis merchandise tidak valid.", "#E5484D");
        return false;
    }
    if (jumlah < MERCH_V3.REGULER.minUnitPerBatch) {
        bukaModal("Jumlah Terlalu Sedikit",
            `Minimum produksi adalah <b>${MERCH_V3.REGULER.minUnitPerBatch} pcs</b> per batch.`, "#E5484D");
        return false;
    }
    const jatahDipakai = fanbase.merchJatahReguler[itemId] || 0;
    if (jatahDipakai >= MERCH_V3.REGULER.maxBatchPerSeasonPerItem) {
        bukaModal("Jatah Batch Habis",
            `${MERCH_V3.NAMA_ITEM[itemId]} sudah mencapai batas ${MERCH_V3.REGULER.maxBatchPerSeasonPerItem} batch Reguler musim ini.`, "#E5484D");
        return false;
    }
    if (!_namaBatchTersedia(nama)) {
        bukaModal("Nama Tidak Valid",
            "Nama produk harus unik (belum dipakai batch aktif lain) dan maksimal 20 karakter.", "#E5484D");
        return false;
    }
    if (!["premium", "standar", "biasa"].includes(kualitas)) {
        bukaModal("Kualitas Tidak Valid", "Pilih Premium, Standar, atau Biasa.", "#E5484D");
        return false;
    }
    if (!hargaJual || hargaJual <= 0) {
        bukaModal("Harga Tidak Valid", "Harga jual harus lebih besar dari Rp 0.", "#E5484D");
        return false;
    }

    const hargaProduksiSatuan = MERCH_V3.HARGA_PRODUKSI[itemId][kualitas];
    // [FIX] Batas markup harga jual -- lihat catatan di MERCH_V3.MAKS_MARKUP_MULT.
    const hargaMaksBoleh = hargaProduksiSatuan * MERCH_V3.MAKS_MARKUP_MULT;
    if (hargaJual > hargaMaksBoleh) {
        bukaModal("Harga Terlalu Tinggi",
            `Harga jual ${MERCH_V3.NAMA_ITEM[itemId]} maksimal <b>Rp ${hargaMaksBoleh.toLocaleString("id-ID")}</b> (${MERCH_V3.MAKS_MARKUP_MULT}x harga produksi Rp ${hargaProduksiSatuan.toLocaleString("id-ID")}). Harga di atas itu gak realistis dan bisa merusak ekonomi fanbase.`,
            "#E5484D");
        return false;
    }
    const totalModal = hargaProduksiSatuan * jumlah;

    if (kasTim < totalModal) {
        bukaModal("Kas Tidak Cukup 💸",
            `Butuh modal <b>Rp ${totalModal.toLocaleString("id-ID")}</b> untuk produksi ${jumlah} pcs.<br>
             Kas tim saat ini: Rp ${kasTim.toLocaleString("id-ID")}`, "#E5484D");
        return false;
    }

    kasTim -= totalModal;
    catatKas("KELUAR", totalModal, `Modal Produksi: ${nama} (${MERCH_V3.NAMA_ITEM[itemId]})`);

    const batch = {
        id: "batch_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        itemId, nama, kategori: "reguler", kualitas,
        hargaDasar: hargaJual, diskonAktif: 0, diskonPending: null,
        stokAwal: jumlah, stokTersisa: jumlah,
        mingguProduksi: fanbase.merchMingguAbsolut,
        eventSumberLE: null, status: "menunggu"
    };
    fanbase.merchBatches.push(batch);
    fanbase.merchJatahReguler[itemId] = jatahDipakai + 1;
    fanbase.merchNamaAktifArr.push(nama);

    tutupModal();
    if (typeof tambahEmail === "function") {
        tambahEmail(`🎁 Batch "${nama}" Diproduksi`, `Tim Merchandise ${timPlayer}`,
            `<b>${nama}</b> (${MERCH_V3.NAMA_ITEM[itemId]}, ${jumlah} pcs, kualitas ${kualitas}) siap dijual mulai minggu depan.`);
    }
    if (typeof renderLayarFanbase === "function") renderLayarFanbase();
    return true;
};

// ==========================================================================
// [9] PRODUKSI — LIMITED EDITION  (Spec §14)
// ==========================================================================
window.produksiMerchandiseLEV3 = function(itemId, jumlah, hargaJual, nama, eventId) {
    if (!fanbase.merchBatches) initMerchandiseSystemV3();

    if (!_windowLEMasihTerbuka(eventId)) {
        bukaModal("Window Tertutup", "Window produksi Limited Edition untuk gelar ini sudah lewat 2 minggu.", "#E5484D");
        return false;
    }
    if (fanbase.merchJatahLE[eventId][itemId]) {
        bukaModal("Sudah Diproduksi", `Batch LE ${MERCH_V3.NAMA_ITEM[itemId]} untuk event ini sudah pernah dibuat.`, "#E5484D");
        return false;
    }
    if (jumlah > MERCH_V3.LE.maxUnitPerBatch || jumlah < MERCH_V3.REGULER.minUnitPerBatch) {
        bukaModal("Jumlah Tidak Valid", `Batch Limited Edition maksimal ${MERCH_V3.LE.maxUnitPerBatch} pcs.`, "#E5484D");
        return false;
    }
    if (!_namaBatchTersedia(nama)) {
        bukaModal("Nama Tidak Valid", "Nama produk harus unik dan maksimal 20 karakter.", "#E5484D");
        return false;
    }
    if (!hargaJual || hargaJual <= 0) {
        bukaModal("Harga Tidak Valid", "Harga jual harus lebih besar dari Rp 0.", "#E5484D");
        return false;
    }

    const kualitas = MERCH_V3.LE.kualitasOtomatis;
    // [FIX] Batas markup harga jual -- lihat catatan di MERCH_V3.MAKS_MARKUP_MULT.
    const hargaProduksiSatuanLE = MERCH_V3.HARGA_PRODUKSI[itemId][kualitas];
    const hargaMaksBolehLE = hargaProduksiSatuanLE * MERCH_V3.MAKS_MARKUP_MULT;
    if (hargaJual > hargaMaksBolehLE) {
        bukaModal("Harga Terlalu Tinggi",
            `Harga jual ${MERCH_V3.NAMA_ITEM[itemId]} maksimal <b>Rp ${hargaMaksBolehLE.toLocaleString("id-ID")}</b> (${MERCH_V3.MAKS_MARKUP_MULT}x harga produksi Rp ${hargaProduksiSatuanLE.toLocaleString("id-ID")}). Harga di atas itu gak realistis dan bisa merusak ekonomi fanbase.`,
            "#E5484D");
        return false;
    }
    const totalModal = MERCH_V3.HARGA_PRODUKSI[itemId][kualitas] * jumlah;
    if (kasTim < totalModal) {
        bukaModal("Kas Tidak Cukup 💸", `Butuh Rp ${totalModal.toLocaleString("id-ID")} untuk batch LE ini.`, "#E5484D");
        return false;
    }

    kasTim -= totalModal;
    catatKas("KELUAR", totalModal, `Modal Produksi LE: ${nama}`);

    const batch = {
        id: "batch_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        itemId, nama, kategori: "limited_edition", kualitas,
        hargaDasar: hargaJual, diskonAktif: 0, diskonPending: null,
        stokAwal: jumlah, stokTersisa: jumlah,
        mingguProduksi: fanbase.merchMingguAbsolut,
        eventSumberLE: eventId, status: "menunggu"
    };
    fanbase.merchBatches.push(batch);
    fanbase.merchJatahLE[eventId][itemId] = true;
    fanbase.merchNamaAktifArr.push(nama);

    tutupModal();
    if (typeof tambahEmail === "function") {
        tambahEmail(`🏆 Limited Edition "${nama}" Diproduksi`, `Tim Merchandise ${timPlayer}`,
            `Batch spesial <b>${nama}</b> (${MERCH_V3.NAMA_ITEM[itemId]} Limited Edition, ${jumlah} pcs) siap dijual mulai minggu depan!`);
    }
    if (typeof renderLayarFanbase === "function") renderLayarFanbase();
    return true;
};

// ==========================================================================
// [10] DISKON  (Spec §16)
// ==========================================================================
window.ubahDiskonBatchV3 = function(batchId, diskonPersen) {
    if (!MERCH_V3.DISKON_OPTIONS.includes(diskonPersen)) {
        bukaModal("Diskon Tidak Valid", "Pilih dari: " + MERCH_V3.DISKON_OPTIONS.join("%, ") + "%.", "#E5484D");
        return false;
    }
    const batch = fanbase.merchBatches.find(b => b.id === batchId);
    if (!batch || batch.status === "habis") {
        bukaModal("Batch Tidak Ditemukan", "Batch ini sudah tidak aktif.", "#E5484D");
        return false;
    }
    batch.diskonPending = diskonPersen;   // baru berlaku minggu depan (§16)
    if (typeof renderLayarFanbase === "function") renderLayarFanbase();
    return true;
};

// ==========================================================================
// [11] INIT HOOK
// Dipanggil dari inisialFanbase() (patches_postgame.js) via wrap di bawah,
// supaya save baru otomatis punya state v3 yang bersih (§12: reset total).
// ==========================================================================
if (typeof inisialFanbase === "function") {
    const _inisialFanbase_asli_v3 = inisialFanbase;
    inisialFanbase = function(timData) {
        _inisialFanbase_asli_v3(timData);
        initMerchandiseSystemV3();
    };
    // Sama seperti prosesFanbasePascaMatch -- pastikan window.hookInisialFanbase
    // ikut menunjuk ke versi yang sudah di-wrap.
    window.hookInisialFanbase = inisialFanbase;
}

// Wrap bukaModal() global -- SETIAP kali modal manapun di game dibuka
// (bukan cuma punya merchandise), tombol OKE bawaan direset ke perilaku
// default (nutup modal). Ini yang bikin "bajak tombol OKE" di popup info
// merchandise (§13 UI) aman -- override-nya otomatis kehapus begitu modal
// lain/baru dibuka, gak nempel selamanya.
if (typeof bukaModal === "function") {
    const _bukaModal_asli_v3 = bukaModal;
    bukaModal = function(judul, pesan, warnaGaris) {
        _bukaModal_asli_v3(judul, pesan, warnaGaris);
        let btnOkeDefault = document.querySelector("#customModal > .modal-box > button.modal-btn");
        if (btnOkeDefault) btnOkeDefault.setAttribute("onclick", "tutupModal()");
    };
    window.hookBukaModal = bukaModal;
}

// ==========================================================================
// [12] UI — LAYAR FANBASE (menimpa render lama, pakai batch v3)
// Reuse container HTML yang sudah ada di index.html: #listMerchandiseDiJual,
// #statTotalMerchRevenue, dll (lihat layarFanbase di index.html).
// ==========================================================================
function _daftarEventLETerbuka() {
    if (!fanbase.merchJatahLE) return [];
    return Object.keys(fanbase.merchJatahLE).filter(eventId => _windowLEMasihTerbuka(eventId));
}

function _formatRp(n) {
    return "Rp " + Math.floor(n).toLocaleString("id-ID");
}

const STATUS_BADGE_V3 = {
    menunggu: { teks: "Menunggu", icon: "fa-hourglass-half", cls: "menunggu" },
    aktif:    { teks: "Aktif",    icon: "fa-circle-check",   cls: "aktif" },
    habis:    { teks: "Habis",    icon: "fa-box-archive",    cls: "habis" }
};

function renderLayarFanbase() {
    let container = document.getElementById("listMerchandiseDiJual");
    if (container) {
        if (!fanbase.merchBatches) initMerchandiseSystemV3();

        if (fanbase.merchBatches.length === 0) {
            container.innerHTML = `<div style="text-align:center;color:#666;margin-top:20px;">Belum ada batch merchandise. Tambahkan lewat tombol + di bawah.</div>`;
        } else {
            let urut = [...fanbase.merchBatches].sort((a, b) => {
                if (a.status !== b.status) return a.status === "habis" ? 1 : -1;
                return b.mingguProduksi - a.mingguProduksi;
            });

            container.innerHTML = urut.map(b => {
                let namaItem = MERCH_V3.NAMA_ITEM[b.itemId];
                let badge = STATUS_BADGE_V3[b.status];
                let usia = fanbase.merchMingguAbsolut - b.mingguProduksi;
                let hargaEfektif = b.hargaDasar * (1 - b.diskonAktif / 100);
                let tagLE = b.kategori === "limited_edition" ? ` <span style="color:#5B3DF5;">★LE</span>` : "";
                let tombolDiskon = (b.status !== "habis")
                    ? `<button class="modal-btn" style="font-size:10px;padding:4px 8px;margin-top:6px;background: var(--surface-4);color:#12151C;"
                         onclick="window.bukaUbahDiskonV3('${b.id}')">Ubah Diskon</button>`
                    : "";
                let infoDiskon = b.diskonAktif > 0 ? ` (diskon ${b.diskonAktif}%)` : "";
                let infoPending = b.diskonPending !== null ? `<div style="font-size:10px;color:#E8720C;">Diskon ${b.diskonPending}% akan berlaku minggu depan</div>` : "";

                return `
                <div style="background:#F1F3F8;border:1px solid #E9ECF2;border-radius:8px;padding:12px;margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <div style="font-weight:bold;color:#12151C;">${b.nama}${tagLE}</div>
                            <div style="font-size:10px;color:#888;">${namaItem} · ${b.kualitas} · usia ${usia}mgg</div>
                            <div style="font-size:11px;color:#00B37E;margin-top:2px;">${_formatRp(hargaEfektif)}${infoDiskon} · stok ${b.stokTersisa}/${b.stokAwal}</div>
                            ${infoPending}
                        </div>
                        <div class="status-badge status-badge--${badge.cls}"><i class="fa-solid ${badge.icon}"></i> ${badge.teks}</div>
                    </div>
                    ${tombolDiskon}
                </div>`;
            }).join("");
        }
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
        elS.innerText   = s.teks;
        elS.style.color = s.warna;
        if (dotS) dotS.style.background = s.warna;
        if (boxS) {
            boxS.style.background   = s.bg;
            boxS.style.borderColor  = s.border;
        }
    }

    let elMerch = document.getElementById("txtMerchandiseAktif");
    if (elMerch && fanbase.merchBatches) {
        elMerch.innerText = fanbase.merchBatches.filter(b => b.status !== "habis").length + " batch aktif";
    }

    let elRev = document.getElementById("txtRevenueMerchandise");
    if (elRev) elRev.innerText = "Rp " + fanbase.pendapatanMerchandise.toLocaleString("id-ID");

    if (typeof renderMentalStaminaUI === "function") renderMentalStaminaUI();
}

// ==========================================================================
// [13] UI — MODAL TAMBAH BATCH (Reguler / Limited Edition)
// ==========================================================================
window.bukaTambahMerchandise = function(prefill) {
    if (!fanbase.merchBatches) initMerchandiseSystemV3();
    prefill = prefill || {};

    let eventLETerbuka = _daftarEventLETerbuka();

    let opsiItem = Object.keys(MERCH_V3.BOBOT).map(id => {
        let selected = (prefill.itemId === id) ? "selected" : "";
        return `<option value="${id}" ${selected}>${MERCH_V3.NAMA_ITEM[id]}</option>`;
    }).join("");

    let infoLE = eventLETerbuka.length > 0
        ? `<div style="background:rgba(91,61,245,0.08);border:1px solid #5B3DF5;border-radius:6px;padding:8px;margin-bottom:10px;font-size:11px;color:#5B3DF5;">
             🏆 Window Limited Edition lagi TERBUKA (${eventLETerbuka.join(", ")})! Centang opsi LE di bawah kalau mau pakai jatah ini.
           </div>`
        : "";

    let checkboxLE = eventLETerbuka.length > 0
        ? `<label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:#5B3DF5;">
             <input type="checkbox" id="inputMerchLE" ${prefill.le ? "checked" : ""}> Produksi sebagai Limited Edition (${eventLETerbuka[0]})
           </label>`
        : "";

    let optKualitas = ["biasa", "standar", "premium"].map(k => {
        let label = k.charAt(0).toUpperCase() + k.slice(1);
        let selected = (prefill.kualitas ? prefill.kualitas === k : k === "standar") ? "selected" : "";
        return `<option value="${k}" ${selected}>${label}</option>`;
    }).join("");

    let html = `
        <button onclick="window._bukaInfoMerchV3()"
            style="position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:50%;
                   background: var(--accent-dim);border:none;color:var(--accent);font-size:12px;
                   cursor:pointer;line-height:1;z-index:2;display:flex;align-items:center;justify-content:center;">
            <i class="fa-solid fa-circle-question"></i>
        </button>

        <div style="text-align:left;">
            ${infoLE}
            <label style="display:block;font-size:12px;color:#5C6472;">Jenis Item</label>
            <select id="inputMerchItem" class="custom-select">
                ${opsiItem}
            </select>

            <label style="display:block;margin-top:10px;font-size:12px;color:#5C6472;">Kualitas</label>
            <select id="inputMerchKualitas" class="custom-select">
                ${optKualitas}
            </select>

            <label style="display:block;margin-top:10px;font-size:12px;color:#5C6472;">Jumlah Produksi (pcs)</label>
            <input type="number" id="inputMerchJumlah" value="${prefill.jumlah || 100}" min="10" step="10"
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #444;background:#F1F3F8;color:#12151C;margin-top:4px;box-sizing:border-box;">

            <label style="display:block;margin-top:10px;font-size:12px;color:#5C6472;">Harga Jual (Rp)</label>
            <input type="number" id="inputMerchHarga" value="${prefill.harga || 150000}" min="1" step="5000"
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #444;background:#F1F3F8;color:#12151C;margin-top:4px;box-sizing:border-box;">

            <label style="display:block;margin-top:10px;font-size:12px;color:#5C6472;">Nama Produk (maks 20 karakter)</label>
            <input type="text" id="inputMerchNama" maxlength="20" placeholder="Contoh: Alpha2026" value="${prefill.nama || ""}"
                style="width:100%;padding:8px;border-radius:6px;border:1px solid #444;background:#F1F3F8;color:#12151C;margin-top:4px;box-sizing:border-box;">

            ${checkboxLE}

            <div style="display:flex;gap:8px;margin-top:14px;">
                <button class="modal-btn btn-modal-cancel" style="flex:1;" onclick="tutupModal()">BATAL</button>
                <button class="modal-btn btn-green" style="flex:1;" onclick="window.konfirmasiProduksiMerchV3()">PRODUKSI</button>
            </div>
        </div>`;

    bukaModal("Produksi Batch Merchandise Baru", html, "#E8720C");
    let titleEl = document.getElementById("modalTitle");
    if (titleEl) {
        titleEl.classList.add("modal-title-patch");
        titleEl.innerHTML = `<i class="fa-solid fa-bag-shopping"></i><span class="modal-title-text-patch">Produksi Batch Merchandise Baru</span>`;
    }
    if (typeof window.initCustomSelects === "function") window.initCustomSelects();
};

// Popup INFO terpisah -- ganti total isi modal (bukan panel yang nempel di
// form), lengkap dengan tombol "Kembali" yang balikin form produksi dengan
// isian yang tadi udah diketik (gak hilang).
window._bukaInfoMerchV3 = function() {
    // simpan isian form saat ini sebelum pindah ke popup info
    let prefill = {};
    let elItem = document.getElementById("inputMerchItem");
    let elKualitas = document.getElementById("inputMerchKualitas");
    let elJumlah = document.getElementById("inputMerchJumlah");
    let elHarga = document.getElementById("inputMerchHarga");
    let elNama = document.getElementById("inputMerchNama");
    let elLE = document.getElementById("inputMerchLE");
    if (elItem) prefill.itemId = elItem.value;
    if (elKualitas) prefill.kualitas = elKualitas.value;
    if (elJumlah) prefill.jumlah = elJumlah.value;
    if (elHarga) prefill.harga = elHarga.value;
    if (elNama) prefill.nama = elNama.value;
    if (elLE) prefill.le = elLE.checked;

    let isiInfo = `
        <div style="text-align:left;font-size:11px;color:#5C6472;line-height:1.45;">
            <div style="color:#C9971F;font-weight:bold;margin-bottom:6px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-coins"></i> Biaya Produksi per Kualitas</div>
            <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:8px 6px;margin-bottom:12px;overflow-x:auto;">
                <table style="width:100%;min-width:260px;border-collapse:collapse;font-size:10.5px;">
                    <tr style="color:#5B3DF5;border-bottom:1px solid var(--border-md);">
                        <td style="padding:5px 6px;text-align:left;">Item</td>
                        <td style="padding:5px 6px;text-align:right;">Biasa</td>
                        <td style="padding:5px 6px;text-align:right;">Standar</td>
                        <td style="padding:5px 6px;text-align:right;">Premium</td>
                    </tr>
                    ${Object.keys(MERCH_V3.BOBOT).map((id, i) => {
                        let h = MERCH_V3.HARGA_PRODUKSI[id];
                        let bg = i % 2 === 0 ? "background:var(--surface-1);" : "";
                        return `<tr style="${bg}">
                            <td style="padding:5px 6px;">${MERCH_V3.NAMA_ITEM[id]}</td>
                            <td style="padding:5px 6px;text-align:right;">${(h.biasa/1000)}rb</td>
                            <td style="padding:5px 6px;text-align:right;">${(h.standar/1000)}rb</td>
                            <td style="padding:5px 6px;text-align:right;">${(h.premium/1000)}rb</td>
                        </tr>`;
                    }).join("")}
                </table>
            </div>

            <div style="color:#5B3DF5;font-weight:bold;margin-bottom:4px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-arrow-trend-up"></i> Yang Mempengaruhi Penjualan</div>
            <div style="margin-bottom:8px;">
                <div>• <b>Fanbase & Moral</b> besar/tinggi → makin banyak calon pembeli</div>
                <div>• <b>Prestasi tim</b> (juara/runner-up/menang beruntun) → naik sementara</div>
                <div>• <b>Kualitas</b> lebih tinggi → sedikit lebih diminati</div>
                <div>• <b>Harga</b> kemahalan dibanding modal → minat beli anjlok</div>
                <div>• <b>Usia batch</b> makin lama → makin kurang diminati</div>
            </div>

            <div style="color:#5B3DF5;font-weight:bold;margin-bottom:4px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-clipboard-list"></i> Aturan Produksi</div>
            <div style="margin-bottom:8px;">
                <div>• Min 10 pcs/batch, maks 2 batch Reguler/jenis/musim</div>
                <div>• Nama produk unik selama batch aktif dijual</div>
            </div>

            <div style="color:#5B3DF5;font-weight:bold;margin-bottom:4px;display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-trophy"></i> Limited Edition &nbsp;·&nbsp; <i class="fa-solid fa-tags"></i> Diskon</div>
            <div style="margin-bottom:4px;">
                <div>• LE kebuka 2mgg setelah Juara MPL/MSC/M-Series, otomatis Premium, maks 100 pcs</div>
                <div>• Diskon bebas diubah, berlaku mulai minggu depan</div>
            </div>
        </div>`;

    bukaModal("Info Merchandise", isiInfo, "#5B3DF5");
    let titleElInfo = document.getElementById("modalTitle");
    if (titleElInfo) {
        titleElInfo.classList.add("modal-title-patch");
        titleElInfo.innerHTML = `<i class="fa-solid fa-book-open"></i><span class="modal-title-text-patch">Info Merchandise</span>`;
    }

    // Bajak tombol OKE bawaan modal (yang default cuma nutup modal) supaya
    // khusus di popup info ini dia balik ke form produksi. Ini AMAN buat
    // modal lain di game karena bukaModal() sudah di-wrap (lihat bawah)
    // untuk selalu reset tombol OKE ke perilaku default tiap kali ada
    // modal BARU yang dibuka, jadi override ini gak "bocor" kemana-mana.
    let btnOke = document.querySelector("#customModal > .modal-box > button.modal-btn");
    if (btnOke) {
        btnOke.setAttribute("onclick",
            `window.bukaTambahMerchandise(${JSON.stringify(prefill).replace(/'/g, "&#39;")})`);
    }
};

window.konfirmasiProduksiMerchV3 = function() {
    let itemId    = document.getElementById("inputMerchItem").value;
    let kualitas  = document.getElementById("inputMerchKualitas").value;
    let jumlah    = parseInt(document.getElementById("inputMerchJumlah").value, 10) || 0;
    let hargaJual = parseInt(document.getElementById("inputMerchHarga").value, 10) || 0;
    let nama      = document.getElementById("inputMerchNama").value.trim();
    let checkboxLE = document.getElementById("inputMerchLE");
    let pakaiLE = checkboxLE && checkboxLE.checked;

    if (!nama) {
        bukaModal("Nama Kosong", "Nama produk wajib diisi.", "#E5484D");
        return;
    }

    if (pakaiLE) {
        let eventLETerbuka = _daftarEventLETerbuka();
        if (eventLETerbuka.length === 0) {
            bukaModal("Window LE Tertutup", "Window Limited Edition sudah tidak terbuka.", "#E5484D");
            return;
        }
        window.produksiMerchandiseLEV3(itemId, jumlah, hargaJual, nama, eventLETerbuka[0]);
    } else {
        window.produksiMerchandiseRegulerV3(itemId, kualitas, jumlah, hargaJual, nama);
    }
};

// ==========================================================================
// [14] UI — MODAL UBAH DISKON
// ==========================================================================
window.bukaUbahDiskonV3 = function(batchId) {
    let batch = fanbase.merchBatches.find(b => b.id === batchId);
    if (!batch) return;

    let opsi = MERCH_V3.DISKON_OPTIONS.map(d =>
        `<option value="${d}" ${d === batch.diskonAktif ? "selected" : ""}>${d === 0 ? "Tanpa Diskon" : d + "%"}</option>`
    ).join("");

    let html = `
        <div style="text-align:left;">
            <p style="font-size:12px;color:#5C6472;">Batch: <b>${batch.nama}</b></p>
            <p style="font-size:11px;color:#888;">Diskon baru berlaku mulai minggu depan.</p>
            <select id="inputDiskonBaru" class="custom-select">
                ${opsi}
            </select>
            <div style="display:flex;gap:8px;margin-top:14px;">
                <button class="modal-btn btn-modal-cancel" style="flex:1;" onclick="tutupModal()">BATAL</button>
                <button class="modal-btn btn-green" style="flex:1;" onclick="window.konfirmasiUbahDiskonV3('${batch.id}')">SIMPAN</button>
            </div>
        </div>`;

    bukaModal("💸 Ubah Diskon", html, "#2563EB");
    if (typeof window.initCustomSelects === "function") window.initCustomSelects();
};

window.konfirmasiUbahDiskonV3 = function(batchId) {
    let diskon = parseInt(document.getElementById("inputDiskonBaru").value, 10);
    if (window.ubahDiskonBatchV3(batchId, diskon)) {
        tutupModal();
    }
};
