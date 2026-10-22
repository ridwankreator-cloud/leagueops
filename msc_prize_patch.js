// ==========================================================================
// MSC_PRIZE_PATCH.JS
// Ganti total tabel hadiah MSC dari 5 tier (juara1/2/3/top8/wildCard) jadi
// 12 tier granular sesuai peringkat 1-25, persis tabel yang diminta user.
//
// Peringkat 1-25 di-mapping ke STRUKTUR BRACKET ASLI msc_ewc_engine.js
// (bukan asumsi baru) -- udah diverifikasi lewat baca kode:
//   1-3   : hasil Knockout (Grand Final & partai perebutan juara 3)
//   4     : kalah di partai perebutan juara 3
//   5-8   : kalah di Quarter Final Knockout
//   9-12  : kalah di partai decider lower-bracket Group Stage (rekor 1-2)
//   13-16 : kalah di ronde 1 lower-bracket Group Stage (rekor 0-2)
//   17    : runner-up Wild Card (kalah di Final M3)
//   18-19 : kalah di Wild Card Final Bracket M1/M2
//   20-21 : kalah di Wild Card Gauntlet Leg 2
//   22-23 : kalah di Wild Card Gauntlet Leg 1
//   24-25 : peringkat 5 di masing-masing grup Wild Card (tersingkir duluan)
// ==========================================================================

(function () {

const HADIAH_MSC_BARU = {
    juara1: 18000000000,
    juara2: 9000000000,
    juara3: 4500000000,
    peringkat4: 2700000000,
    r5_8: 1800000000,
    r9_12: 1170000000,
    r13_16: 810000000,
    r17: 630000000,
    r18_19: 567000000,
    r20_21: 522000000,
    r22_23: 486000000,
    r24_25: 450000000
};
window.HADIAH_MSC_BARU = HADIAH_MSC_BARU; // diekspos biar gampang dicek/di-tweak dari console kalau perlu

function distribusiHadiahMSCBaruV2() {
    // --- Helper pencatatan laporan keuangan -- format & cap 100 entri
    // disamain PERSIS sama catatKas() punya player (script.js), biar AI
    // sekarang juga punya riwayat transaksi yang konsisten (sebelumnya
    // AI kasnya nambah diem-diem tanpa jejak sama sekali).
    let catatKasUniversal = (tim, jenis, nominal, deskripsi) => {
        let isPlayer = tim.nama === (typeof timPlayer !== "undefined" ? timPlayer : null);
        if (isPlayer) {
            if (typeof catatKas === "function") catatKas(jenis, nominal, deskripsi);
            return;
        }
        if (!tim.riwayatKas) tim.riwayatKas = [];
        let tgl = (typeof dapetTanggalPendek === "function" && typeof kalenderGame !== "undefined") ? dapetTanggalPendek(kalenderGame) : "";
        let weekTxt = (typeof statusGame !== "undefined" && statusGame === "PRAMUSIM")
            ? "Off-Season"
            : `S${typeof musimKe !== "undefined" ? musimKe : "?"}-W${typeof mingguKe !== "undefined" ? mingguKe : "?"}`;
        tim.riwayatKas.unshift({ jenis, nominal, deskripsi, waktu: `${weekTxt} | ${tgl}` });
        if (tim.riwayatKas.length > 100) tim.riwayatKas.pop();
    };

    // Bayar SEMUA tim, TERMASUK player, buat peringkat 2-25. Player dapet
    // duitnya lewat kasTim (bukan tim.kas, krn kas player emang disimpen
    // terpisah dari objek tim-nya di database).
    let bayar = (tim, nominal, bonusRep, label) => {
        if (!tim) return;
        let isPlayer = tim.nama === (typeof timPlayer !== "undefined" ? timPlayer : null);
        if (isPlayer) {
            if (typeof kasTim !== "undefined") kasTim += nominal;
            if (bonusRep && typeof reputasiManajer !== "undefined") reputasiManajer += bonusRep;
        } else {
            tim.kas = (tim.kas || 0) + nominal;
            if (bonusRep) tim.reputasi = Math.min(100, (tim.reputasi || 50) + bonusRep);
        }
        catatKasUniversal(tim, "MASUK", nominal, `Hadiah MSC - ${label}`);
    };

    // Khusus Juara 1: SENGAJA skip player di sini -- kasusnya udah
    // ditangani terpisah lewat wrap selesaikanMSCEwc() di bawah (biar
    // gak dobel bayar sama nominal lama yang udah di-hardcode di sana).
    let bayarKecualiJuara1Player = (tim, nominal, bonusRep, label) => {
        if (!tim) return;
        let isPlayer = tim.nama === (typeof timPlayer !== "undefined" ? timPlayer : null);
        if (isPlayer) return;
        tim.kas = (tim.kas || 0) + nominal;
        if (bonusRep) tim.reputasi = Math.min(100, (tim.reputasi || 50) + bonusRep);
        catatKasUniversal(tim, "MASUK", nominal, `Hadiah MSC - ${label}`);
    };

    let kd = window.knockoutData;
    let gs = window.groupStageData;
    let wc = window.wildCardData;

    // --- KNOCKOUT: peringkat 1-8 ---
    if (kd) {
        bayarKecualiJuara1Player(kd.juaraMSC, HADIAH_MSC_BARU.juara1, 15, "Juara 1");
        bayar(kd.runnerUpMSC, HADIAH_MSC_BARU.juara2, 8, "Juara 2 (Runner-up)");
        bayar(kd.juara3, HADIAH_MSC_BARU.juara3, 5, "Juara 3");

        // Peringkat 4 -- kalah di partai perebutan juara 3
        if (kd.juara3Match && kd.juara3Match.kalah) {
            bayar(kd.juara3Match.kalah, HADIAH_MSC_BARU.peringkat4, 3, "Peringkat 4");
        }

        // Peringkat 5-8 -- kalah di Quarter Final
        [kd.qf1, kd.qf2, kd.qf3, kd.qf4].forEach(m => {
            if (m && m.kalah) bayar(m.kalah, HADIAH_MSC_BARU.r5_8, 2, "Peringkat 5-8");
        });
    }

    // --- GROUP STAGE: peringkat 9-16 (gak lolos Knockout) ---
    if (gs) {
        ["A", "B"].forEach(kode => {
            let g = gs[kode];
            if (!g) return;
            // 9-12: kalah di decider lower-bracket (rekor akhir 1-2)
            if (g.m9 && g.m9.kalah) bayar(g.m9.kalah, HADIAH_MSC_BARU.r9_12, 1, "Peringkat 9-12");
            if (g.m10 && g.m10.kalah) bayar(g.m10.kalah, HADIAH_MSC_BARU.r9_12, 1, "Peringkat 9-12");
            // 13-16: kalah di ronde 1 lower-bracket (rekor akhir 0-2)
            if (g.m7 && g.m7.kalah) bayar(g.m7.kalah, HADIAH_MSC_BARU.r13_16, 0, "Peringkat 13-16");
            if (g.m8 && g.m8.kalah) bayar(g.m8.kalah, HADIAH_MSC_BARU.r13_16, 0, "Peringkat 13-16");
        });
    }

    // --- WILD CARD: peringkat 17-25 (gak lolos ke Group Stage) ---
    if (wc) {
        if (wc.finalBracket) {
            // 17: runner-up Wild Card (kalah di Final M3)
            if (wc.finalBracket.m3 && wc.finalBracket.m3.kalah) {
                bayar(wc.finalBracket.m3.kalah, HADIAH_MSC_BARU.r17, 0, "Peringkat 17");
            }
            // 18-19: kalah di Final Bracket M1/M2
            if (wc.finalBracket.m1 && wc.finalBracket.m1.kalah) bayar(wc.finalBracket.m1.kalah, HADIAH_MSC_BARU.r18_19, 0, "Peringkat 18-19");
            if (wc.finalBracket.m2 && wc.finalBracket.m2.kalah) bayar(wc.finalBracket.m2.kalah, HADIAH_MSC_BARU.r18_19, 0, "Peringkat 18-19");
        }
        if (wc.gauntlet) {
            // 20-21: kalah di Gauntlet Leg 2
            if (wc.gauntlet.m2A && wc.gauntlet.m2A.kalah) bayar(wc.gauntlet.m2A.kalah, HADIAH_MSC_BARU.r20_21, 0, "Peringkat 20-21");
            if (wc.gauntlet.m2B && wc.gauntlet.m2B.kalah) bayar(wc.gauntlet.m2B.kalah, HADIAH_MSC_BARU.r20_21, 0, "Peringkat 20-21");
            // 22-23: kalah di Gauntlet Leg 1
            if (wc.gauntlet.m1A && wc.gauntlet.m1A.kalah) bayar(wc.gauntlet.m1A.kalah, HADIAH_MSC_BARU.r22_23, 0, "Peringkat 22-23");
            if (wc.gauntlet.m1B && wc.gauntlet.m1B.kalah) bayar(wc.gauntlet.m1B.kalah, HADIAH_MSC_BARU.r22_23, 0, "Peringkat 22-23");
        }
        // 24-25: peringkat 5 di masing-masing grup Wild Card (tersingkir paling awal, gak main lagi)
        if (wc.klasemenA && wc.klasemenA[4]) bayar(wc.klasemenA[4], HADIAH_MSC_BARU.r24_25, 0, "Peringkat 24-25");
        if (wc.klasemenB && wc.klasemenB[4]) bayar(wc.klasemenB[4], HADIAH_MSC_BARU.r24_25, 0, "Peringkat 24-25");
    }
}

// Timpa total fungsi hadiah AI asli -- fungsi ini dipanggil lewat bare
// identifier "distribusiHadiahMSCBaru()" di dalam selesaikanMSCEwc(), yang
// dideklarasikan pakai "function" (bukan "let"/"const") di scope global,
// jadi assignment ke window.distribusiHadiahMSCBaru di sini otomatis
// kepakai juga di semua pemanggilan bare identifier-nya -- gak perlu
// nyentuh msc_ewc_engine.js sama sekali.
window.distribusiHadiahMSCBaru = distribusiHadiahMSCBaruV2;

// --------------------------------------------------------------------
// Koreksi hadiah PLAYER khusus Juara 1 -- selesaikanMSCEwc() bayar
// player LANGSUNG pakai angka lama (1.5 miliar) yang di-hardcode di
// tengah fungsi asli, jadi gak bisa dikoreksi lewat override function
// di atas. Peringkat 2-25 buat player SUDAH ditangani oleh bayar() di
// atas -- ini CUMA buat kasus Juara 1 biar gak dobel bayar.
// --------------------------------------------------------------------
const NOMINAL_JUARA1_LAMA = 1500000000;

if (typeof window.selesaikanMSCEwc === "function" && !window._selesaikanMSCEwcAsliSebelumHadiahPatch) {
    window._selesaikanMSCEwcAsliSebelumHadiahPatch = window.selesaikanMSCEwc;
    window.selesaikanMSCEwc = function () {
        let kd = window.knockoutData;
        let playerJuara = kd && kd.juaraMSC && typeof timPlayer !== "undefined" && kd.juaraMSC.nama === timPlayer;

        window._selesaikanMSCEwcAsliSebelumHadiahPatch();

        if (playerJuara) {
            let selisih = HADIAH_MSC_BARU.juara1 - NOMINAL_JUARA1_LAMA;
            if (selisih !== 0 && typeof kasTim !== "undefined") {
                kasTim += selisih;
                if (typeof catatKas === "function") {
                    catatKas("MASUK", selisih, "Penyesuaian Prize Pool Juara MSC (tabel hadiah baru)");
                }
            }
        }
    };
}

})();
