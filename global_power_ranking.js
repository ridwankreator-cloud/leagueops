// ==========================================================
// GLOBAL POWER RANKING - ENGINE
// File terpisah (additive, TIDAK mengubah logic gameplay lama).
// Menggunakan bankRiwayatJuara sebagai SATU-SATUNYA sumber data
// gelar (Single Source of Truth), sesuai Master Prompt.
//
// Titik-titik lain (script.js, msc_ewc_engine.js, m7_engine.js,
// mdl_len_engine.js) hanya ditambahin beberapa baris ADDITIF:
//   1. Setelah tiap bankRiwayatJuara.push() yang sudah ada,
//      entry yang baru saja di-push diperkaya dengan field
//      `kode`, `tipe`, dan `runnerUp` (dibaca dari variabel
//      "kalah"/"runnerUp" yang sudah tersedia di titik itu).
//   2. Buat MDL ID/PH, MAL MY, LEN -- yang SEBELUMNYA sama sekali
//      gak pernah dicatat ke bankRiwayatJuara -- ditambahin push
//      baru (sesuai keputusan user: region2 ini dihitung Tier 2).
//   3. Panggilan hitungGlobalPowerRanking(true) di titik2 "Grand
//      Final selesai" biar ranking + rank movement ke-update.
//   4. Panggilan cek status bertahan MSC/M-Series persis di titik
//      tentukanKualifikasiMSC()/tentukanKualifikasiM7() dipanggil
//      (yaitu tepat setelah semua Playoff Regional selesai).
// ==========================================================

// ----------------------------------------------------------
// KONFIGURASI TIER & POIN
// ----------------------------------------------------------
const GPR_TIER_REGION = {
    ID: 1, PH: 1, MY: 1,
    SG: 2, KH: 2, MM: 2, MENA: 2, TR: 2, EECA: 2, EA: 2, AM: 2, IN: 2, WEU: 2
    // [REVISI] MDL ID/PH, MAL MY, LEN DIKECUALIKAN dari Global Power
    // Ranking (dikonfirmasi user) -- liga pengembangan, bukan bagian
    // dari cakupan dokumen master prompt.
};

const GPR_POIN_REGULAR = {
    1: { juara: 3, runnerUp: 2 },
    2: { juara: 2, runnerUp: 1 }
};

const GPR_POIN_MSC = { juara: 5, runnerUp: 4 };
const GPR_POIN_MSERIES = { juara: 7, runnerUp: 6 };

const GPR_PENALTI_MSC = { juaraBertahan: -2, runnerUpBertahan: -1 };
const GPR_PENALTI_MSERIES = { juaraBertahan: -3, runnerUpBertahan: -2 };

// ----------------------------------------------------------
// HELPER: catat 1 entry gelar (dipakai buat MEMPERKAYA entry yang
// BARU AJA di-push ke bankRiwayatJuara oleh kode lama, BUKAN buat
// bikin push baru -- push aslinya tetap punya kode lama, biar gak
// menyentuh baris yang sudah teruji).
// ----------------------------------------------------------
function gprPerkayaEntryTerakhir(kode, tipe, runnerUpTim) {
    if (typeof bankRiwayatJuara === "undefined" || bankRiwayatJuara.length === 0) return;
    let entry = bankRiwayatJuara[bankRiwayatJuara.length - 1];
    entry.kode = kode;
    entry.tipe = tipe; // "REGULAR" | "MSC" | "MSERIES"
    entry.runnerUp = runnerUpTim || null;
}
window.gprPerkayaEntryTerakhir = gprPerkayaEntryTerakhir;

// Dipakai buat region yang SEBELUMNYA gak pernah push sama sekali
// (MDL ID, MDL PH, MAL MY, LEN).
function gprCatatGelarBaru(kode, tipe, juaraTim, runnerUpTim) {
    if (typeof bankRiwayatJuara === "undefined" || !juaraTim) return;
    bankRiwayatJuara.push({
        season: (typeof musimKe !== "undefined") ? musimKe : 0,
        tahun: (typeof kalenderGame !== "undefined") ? kalenderGame.getFullYear() : new Date().getFullYear(),
        tim: juaraTim,
        negara: kode,
        kode: kode,
        tipe: tipe,
        runnerUp: runnerUpTim || null
    });
}
window.gprCatatGelarBaru = gprCatatGelarBaru;

// ----------------------------------------------------------
// UNIVERSE: semua tim yang "eksis" di 17 region domestik yang
// masuk cakupan Global Power Ranking (Tier 1 + Tier 2), diambil
// dari array database TERKINI (bukan snapshot lama), ditambah
// safety-net dari bankRiwayatJuara/deduksi biar gak ada tim
// kehilangan poin gara-gara udah gak ada di array region-nya lagi
// (misal kena degradasi).
// ----------------------------------------------------------
function gprAmbilArrayRegion(kode) {
    try {
        switch (kode) {
            case "ID": return (typeof daftarTim !== "undefined") ? daftarTim : null;
            case "PH": return (typeof daftarTimPH !== "undefined") ? daftarTimPH : null;
            case "MY": return (typeof daftarTimMY !== "undefined") ? daftarTimMY : null;
            case "SG": return (typeof daftarTimSG !== "undefined") ? daftarTimSG : null;
            case "KH": return (typeof daftarTimKH !== "undefined") ? daftarTimKH : null;
            case "MM": return (typeof daftarTimMM !== "undefined") ? daftarTimMM : null;
            case "MENA": return (typeof daftarTimMENA !== "undefined") ? daftarTimMENA : null;
            case "TR": return (typeof daftarTimTR !== "undefined") ? daftarTimTR : null;
            case "EECA": return (typeof daftarTimEECA !== "undefined") ? daftarTimEECA : null;
            case "EA": return (typeof daftarTimEA !== "undefined") ? daftarTimEA : null;
            case "AM": return (typeof daftarTimAM !== "undefined") ? daftarTimAM : null;
            case "IN": return (typeof daftarTimIN !== "undefined") ? daftarTimIN : null;
            case "WEU": return (typeof daftarTimWEU !== "undefined") ? daftarTimWEU : null;
            default: return null;
        }
    } catch (e) {
        return null;
    }
}

function gprAmbilSemuaNamaTim() {
    let set = new Set();
    Object.keys(GPR_TIER_REGION).forEach(kode => {
        let arr = gprAmbilArrayRegion(kode);
        if (Array.isArray(arr)) arr.forEach(t => { if (t && t.nama) set.add(t.nama); });
    });
    // Safety net: tim yang punya gelar/runner-up/deduksi tapi entah
    // kenapa udah gak ada di array region manapun (misal kena
    // degradasi/replace) tetap harus keliatan di ranking.
    (typeof bankRiwayatJuara !== "undefined" ? bankRiwayatJuara : []).forEach(e => {
        if (e.tim && e.tim.nama) set.add(e.tim.nama);
        if (e.runnerUp && e.runnerUp.nama) set.add(e.runnerUp.nama);
    });
    (window.gprDeductions || []).forEach(d => { if (d.tim) set.add(d.tim); });
    return Array.from(set);
}

// ----------------------------------------------------------
// DEDUKSI POIN (Juara/Runner-up Bertahan gagal lolos edisi
// berikutnya). Disimpan terpisah dari bankRiwayatJuara karena ini
// BUKAN gelar -- ini event pengurangan poin. Di-dedupe biar
// "pengurangan poin hanya diberikan SATU KALI per event".
// ----------------------------------------------------------
function gprTambahDeduksi(timNama, poin, alasan, musim) {
    if (!timNama) return;
    if (!window.gprDeductions) window.gprDeductions = [];
    let kunci = `${timNama}|${musim}|${alasan}`;
    let sudahAda = window.gprDeductions.some(d => `${d.tim}|${d.musim}|${d.alasan}` === kunci);
    if (sudahAda) return; // cegah dobel deduksi buat event yang sama
    window.gprDeductions.push({ tim: timNama, poin: poin, alasan: alasan, musim: musim });
}

// Dipanggil tepat di titik tentukanKualifikasiMSC() dipanggil (1 hari
// setelah semua Playoff Regional selesai, musim ganjil).
function gprCekStatusBertahanMSC(daftarNamaLolosMSC) {
    if (!window.gprReigningMSC) return; // belum ada edisi MSC sebelumnya
    let musim = (typeof musimKe !== "undefined") ? musimKe : 0;
    let { champion, runnerUp } = window.gprReigningMSC;
    let lolos = daftarNamaLolosMSC || [];
    if (champion && !lolos.includes(champion)) {
        gprTambahDeduksi(champion, GPR_PENALTI_MSC.juaraBertahan, "Juara Bertahan MSC gagal lolos edisi berikutnya", musim);
    }
    if (runnerUp && !lolos.includes(runnerUp)) {
        gprTambahDeduksi(runnerUp, GPR_PENALTI_MSC.runnerUpBertahan, "Runner-up Bertahan MSC gagal lolos edisi berikutnya", musim);
    }
    if (typeof window.gprHitungRanking === "function") window.gprHitungRanking(true);
}
window.gprCekStatusBertahanMSC = gprCekStatusBertahanMSC;

// Dipanggil tepat di titik tentukanKualifikasiM7() dipanggil (1 hari
// setelah semua Playoff Regional selesai, musim genap).
function gprCekStatusBertahanMSeries(daftarNamaLolosMSeries) {
    if (!window.gprReigningMSeries) return; // belum ada edisi M-Series sebelumnya
    let musim = (typeof musimKe !== "undefined") ? musimKe : 0;
    let { champion, runnerUp } = window.gprReigningMSeries;
    let lolos = daftarNamaLolosMSeries || [];
    if (champion && !lolos.includes(champion)) {
        gprTambahDeduksi(champion, GPR_PENALTI_MSERIES.juaraBertahan, "Juara Bertahan M-Series gagal lolos edisi berikutnya", musim);
    }
    if (runnerUp && !lolos.includes(runnerUp)) {
        gprTambahDeduksi(runnerUp, GPR_PENALTI_MSERIES.runnerUpBertahan, "Runner-up Bertahan M-Series gagal lolos edisi berikutnya", musim);
    }
    if (typeof window.gprHitungRanking === "function") window.gprHitungRanking(true);
}
window.gprCekStatusBertahanMSeries = gprCekStatusBertahanMSeries;

// Update "juara/runner-up bertahan" tiap kali 1 edisi MSC/M-Series
// kelar -- dipanggil tepat setelah bankRiwayatJuara.push() di
// selesaikanMSCEwc() / selesaikanM7().
function gprUpdateReigningMSC(juaraNama, runnerUpNama) {
    window.gprReigningMSC = { champion: juaraNama || null, runnerUp: runnerUpNama || null };
}
window.gprUpdateReigningMSC = gprUpdateReigningMSC;

function gprUpdateReigningMSeries(juaraNama, runnerUpNama) {
    window.gprReigningMSeries = { champion: juaraNama || null, runnerUp: runnerUpNama || null };
}
window.gprUpdateReigningMSeries = gprUpdateReigningMSeries;

// ----------------------------------------------------------
// FALLBACK PARSER buat entry bankRiwayatJuara LAMA (dari save
// sebelum fitur ini ada) yang belum punya field kode/tipe/runnerUp.
// Cuma dipakai kalau field barunya gak ketemu -- entry BARU (yang
// udah lewat gprPerkayaEntryTerakhir/gprCatatGelarBaru) gak kena ini.
// ----------------------------------------------------------
function gprInferTipeDanKode(entry) {
    if (entry.tipe && (entry.kode || entry.tipe !== "REGULAR")) {
        return { tipe: entry.tipe, kode: entry.kode || null };
    }
    let negara = entry.negara || "";
    if (negara.indexOf("MSC") !== -1) return { tipe: "MSC", kode: null };
    if (/WORLD CHAMPIONSHIP/i.test(negara) || /GLOBAL \(M\d/i.test(negara)) return { tipe: "MSERIES", kode: null };
    // Format lama: "🇮🇩 ID" / "🇰🇭 KH" dst -- token terakhir = kode region
    let potongan = negara.trim().split(/\s+/);
    let kode = potongan.length > 0 ? potongan[potongan.length - 1] : null;
    return { tipe: "REGULAR", kode: kode };
}

// ----------------------------------------------------------
// INTI: HITUNG ULANG GLOBAL POWER RANKING
// commitSnapshot=true -> simpan ranking hasil hitungan ini sebagai
// "ranking sebelumnya" buat pembanding Rank Movement di update
// berikutnya. Dipanggil TRUE hanya di titik2 resmi (Grand Final
// Regional/MDL/LEN/MAL/MSC/M-Series). Dipanggil FALSE kalau cuma
// mau nampilin ulang layar (gak boleh ganggu snapshot).
// ----------------------------------------------------------
function gprHitungRanking(commitSnapshot) {
    let semuaTim = gprAmbilSemuaNamaTim();
    let data = {};
    semuaTim.forEach(nama => {
        data[nama] = { nama, poin: 0, gelarLiga: 0, gelarMSC: 0, gelarMSeries: 0 };
    });

    let pastikanAda = (nama) => {
        if (!nama) return null;
        if (!data[nama]) data[nama] = { nama, poin: 0, gelarLiga: 0, gelarMSC: 0, gelarMSeries: 0 };
        return data[nama];
    };

    (typeof bankRiwayatJuara !== "undefined" ? bankRiwayatJuara : []).forEach(entry => {
        if (!entry || !entry.tim || !entry.tim.nama) return;
        let { tipe, kode } = gprInferTipeDanKode(entry);
        let juara = pastikanAda(entry.tim.nama);
        let runnerUp = entry.runnerUp && entry.runnerUp.nama ? pastikanAda(entry.runnerUp.nama) : null;

        if (tipe === "MSC") {
            juara.poin += GPR_POIN_MSC.juara;
            juara.gelarMSC += 1;
            if (runnerUp) runnerUp.poin += GPR_POIN_MSC.runnerUp;
        } else if (tipe === "MSERIES") {
            juara.poin += GPR_POIN_MSERIES.juara;
            juara.gelarMSeries += 1;
            if (runnerUp) runnerUp.poin += GPR_POIN_MSERIES.runnerUp;
        } else {
            let tier = GPR_TIER_REGION[kode] || 2; // fallback aman: Tier 2
            let poinTier = GPR_POIN_REGULAR[tier];
            juara.poin += poinTier.juara;
            juara.gelarLiga += 1;
            if (runnerUp) runnerUp.poin += poinTier.runnerUp;
        }
    });

    (window.gprDeductions || []).forEach(d => {
        let t = pastikanAda(d.tim);
        if (t) t.poin += d.poin;
    });

    let ranking = Object.values(data);
    ranking.sort((a, b) => {
        if (b.poin !== a.poin) return b.poin - a.poin;
        if (b.gelarMSeries !== a.gelarMSeries) return b.gelarMSeries - a.gelarMSeries;
        if (b.gelarMSC !== a.gelarMSC) return b.gelarMSC - a.gelarMSC;
        if (b.gelarLiga !== a.gelarLiga) return b.gelarLiga - a.gelarLiga;
        return a.nama.localeCompare(b.nama);
    });

    let prevMap = window.gprRankingSebelumnya || {};
    ranking.forEach((r, i) => {
        r.rank = i + 1;
        let prevRank = prevMap[r.nama];
        if (prevRank === undefined) {
            r.movement = { tipe: "NEW" };
        } else {
            let delta = prevRank - r.rank;
            if (delta === 0) r.movement = { tipe: "SAME" };
            else if (delta > 0) r.movement = { tipe: "UP", jumlah: delta };
            else r.movement = { tipe: "DOWN", jumlah: -delta };
        }
    });

    window.gprRankingTerkini = ranking;

    if (commitSnapshot) {
        let newMap = {};
        ranking.forEach(r => { newMap[r.nama] = r.rank; });
        window.gprRankingSebelumnya = newMap;
    }

    return ranking;
}
window.gprHitungRanking = gprHitungRanking;

console.log("Global Power Ranking Engine v1.0 loaded.");
