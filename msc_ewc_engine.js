// ==========================================================
// MSC x EWC 2026 - ENGINE
// File terpisah biar semua kode terkait MSC x EWC gampang
// diaudit/di-maintain sendiri, tanpa nyampur ke script.js inti.
//
// PRINSIP KEHATI-HATIAN: file ini TIDAK PERNAH mengubah baris
// kode ID/PH/MY/SG yang sudah ada & teruji. Semua yang ada di
// sini murni ADDITIVE -- dipanggil dari titik yang sama tempat
// PH/MY/SG dipanggil, tapi lewat fungsi generik terpisah biar
// gampang diuji terpisah dan gak beresiko merusak sistem lama.
// ==========================================================

// Metadata tampilan tiap region baru (bendera + label liga buat berita)
const REGION_BARU_META = {
    KH:   { bendera: "🇰🇭", namaLiga: "MPL Cambodia" },
    MM:   { bendera: "🇲🇲", namaLiga: "MSL Myanmar" },
    MENA: { bendera: "🌍", namaLiga: "MPL MENA" },
    TR:   { bendera: "🇹🇷", namaLiga: "MLBB Turkiye Championship" },
    EECA: { bendera: "🌍", namaLiga: "EECA" },
    EA:   { bendera: "🌏", namaLiga: "MCT East Asia" },
    AM:   { bendera: "🌎", namaLiga: "MCT Americas" },
    IN:   { bendera: "🇮🇳", namaLiga: "MLBB India" },
    WEU:  { bendera: "🌍", namaLiga: "Western Europe" }
};

// ----------------------------------------------------------
// INISIALISASI PLAYOFF 9 REGION BARU
// Dipanggil sekali di akhir initPlayoffMulai() (script.js).
// Seeding-nya PERSIS sama kayak PH/MY/SG: top-6 dari klasemen,
// #1 & #2 bye ke UB Semi, #3-#6 main Play-In.
// ----------------------------------------------------------
function initPlayoffRegionBaru() {
    let daftarKode = window.REGION_SINGLE_TIER_BARU || [];
    daftarKode.forEach(kode => {
        let arrTim = window["daftarTim" + kode];
        if (!arrTim || arrTim.length < 6) return; // jaga-jaga data belum siap

        let t = [...arrTim].sort(
            (a, b) => b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
        );

        window["pData" + kode] = {
            m1: { home: t[2], away: t[5], sudahMain: false },
            m2: { home: t[3], away: t[4], sudahMain: false },
            m3: { home: t[0], away: { nama: "TBD", logo: "" }, sudahMain: false },
            m4: { home: t[1], away: { nama: "TBD", logo: "" }, sudahMain: false }
        };
    });
}
window.initPlayoffRegionBaru = initPlayoffRegionBaru;

// ----------------------------------------------------------
// JALANKAN 1 FASE PLAYOFF BUAT 1 REGION BARU
// Mirroring PERSIS operasi yang dilakukan blok pDataPH/MY/SG
// yang sudah ada di script.js, cuma diparameterkan lewat `kode`.
// ----------------------------------------------------------
function jalankanFasePlayoffRegionBaru(kode, fase) {
    let pData = window["pData" + kode];
    if (!pData) return null;

    if (fase === 1) {
        // Play-In (Rabu, hari ke-1)
        pData.m1 = simulasiPlayoffMatch(pData.m1.home, pData.m1.away, 5, "playoff_playin");
        pData.m2 = simulasiPlayoffMatch(pData.m2.home, pData.m2.away, 5, "playoff_playin");
        pData.m3.away = pData.m2.menang;
        pData.m4.away = pData.m1.menang;
    } else if (fase === 2) {
        // Upper Bracket Semi Final (Kamis, hari ke-2)
        pData.m3 = simulasiPlayoffMatch(pData.m3.home, pData.m3.away, 5, "playoff_semi");
        pData.m4 = simulasiPlayoffMatch(pData.m4.home, pData.m4.away, 5, "playoff_semi");
        pData.m5 = { home: pData.m3.kalah, away: pData.m4.kalah, sudahMain: false };
        pData.m6 = { home: pData.m3.menang, away: pData.m4.menang, sudahMain: false };
    } else if (fase === 3) {
        // UB Final + LB Semi Final (Jumat, hari ke-3)
        pData.m5 = simulasiPlayoffMatch(pData.m5.home, pData.m5.away, 5, "playoff_semi");
        pData.m6 = simulasiPlayoffMatch(pData.m6.home, pData.m6.away, 5, "playoff_ub");
        pData.m7 = { home: pData.m5.menang, away: pData.m6.kalah, sudahMain: false };
    } else if (fase === 4) {
        // Lower Bracket Final (Sabtu, hari ke-4)
        pData.m7 = simulasiPlayoffMatch(pData.m7.home, pData.m7.away, 5, "playoff_semi");
        pData.m8 = { home: pData.m6.menang, away: pData.m7.menang, sudahMain: false };
    } else if (fase === 5) {
        // Grand Final BO7 (Minggu, hari ke-5)
        pData.m8 = simulasiPlayoffMatch(pData.m8.home, pData.m8.away, 7, "playoff_gf");
        let juara = pData.m8.menang;
        let meta = REGION_BARU_META[kode] || { bendera: "🏳️", namaLiga: kode };

        if (typeof window.prosesReputasi === "function") {
            window.prosesReputasi(juara.nama, "JUARA_MPL");
        }
        // [FIX] Sebelumnya gak ada satupun titik yang ngecek apakah
        // pemenang grand final 9 region baru ini adalah PLAYER -- beda
        // sama MPL ID/PH/MY/SG yang punya prize pool + bonus reputasi
        // manajer. Jadi tim player yang berbasis di salah satu dari 9
        // region ini gak pernah dapet apa2 walau juara liganya sendiri.
        if (juara.nama === timPlayer) {
            if (typeof kasTim !== "undefined") kasTim += 500000000;
            if (typeof catatKas === "function") catatKas("MASUK", 500000000, `Prize Pool Juara 1 ${meta.namaLiga} S${musimKe}`);
            if (typeof reputasiManajer !== "undefined") reputasiManajer += 50;
            if (typeof tambahBerita === "function") {
                tambahBerita(`🏆 Juara. <span>${timPlayer}</span> memenangkan ${meta.namaLiga} S${musimKe}. Sejarah tercipta.`);
            }
        } else if (typeof tambahBerita === "function") {
            tambahBerita(`${meta.bendera} Juara ${meta.namaLiga} S${musimKe}: <span>${juara.nama}</span>.`);
        }
        if (typeof bankRiwayatJuara !== "undefined") {
            bankRiwayatJuara.push({
                season: musimKe,
                tahun: kalenderGame.getFullYear(),
                tim: juara,
                negara: `${meta.bendera} ${kode}`
            });
            if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir(kode, "REGULAR", pData.m8.kalah);
        }
    }

    return pData;
}
window.jalankanFasePlayoffRegionBaru = jalankanFasePlayoffRegionBaru;

// ----------------------------------------------------------
// HELPER: jalankan 1 fase buat SEMUA 9 region baru sekaligus.
// Ini yang dipanggil dari titik playoffFase di script.js --
// cukup 1 baris per fase, bukan 9 baris manual.
// ----------------------------------------------------------
function jalankanFasePlayoffSemuaRegionBaru(fase) {
    let daftarKode = window.REGION_SINGLE_TIER_BARU || [];
    daftarKode.forEach(kode => jalankanFasePlayoffRegionBaru(kode, fase));
}
window.jalankanFasePlayoffSemuaRegionBaru = jalankanFasePlayoffSemuaRegionBaru;

console.log("MSC x EWC 2026 Engine v0.1 loaded — playoff 9 region baru siap (Fase 5a-1).");

// ==========================================================
// FASE 5a-2: KUALIFIKASI MSC (15 Slot Langsung + 10 Wild Card)
// ==========================================================
// Dipanggil SEKALI, tepat setelah SEMUA region (13 total) selesai
// Grand Final playoff regional-nya masing2.
//
// Alokasi slot (sesuai dokumen MSC x EWC 2026):
//   Main Stage LANGSUNG (15): ID(2) PH(2) MY(2) SG(1) KH(1) MM(1)
//                              MENA(1) TR(1) EECA(1) EA(1) AM(1) IN(1)
//   Wild Card (10): WEU Champion(1) + Runner-up dari SG/KH/MM/MENA/
//                    TR/EECA/EA/AM/IN (9)
//   (Western Europe TIDAK dapat slot Main Stage & TIDAK ada wildcard
//    runner-up -- cuma juaranya doang yang lolos ke Wild Card)
// ==========================================================
function tentukanKualifikasiMSC() {
    let mainStage = [];
    let wildCard = [];

    // ID, PH, MY: Champion + Runner-up -> Main Stage langsung (2 slot/region)
    // [FIX] Fallback ke bare `pData` kalau window.pData kosong/basi -- jaga2
    // dari isu cross-file scoping yang pernah kejadian sebelumnya.
    let dataID = window.pData || (typeof pData !== "undefined" ? pData : null);
    let regionDuaSlot = [
        { pData: dataID, kode: "ID", bendera: "🇮🇩" },
        { pData: window.pDataPH, kode: "PH", bendera: "🇵🇭" },
        { pData: window.pDataMY, kode: "MY", bendera: "🇲🇾" }
    ];
    regionDuaSlot.forEach(r => {
        // [FIX] Sebelumnya region yang datanya belum lengkap di-skip
        // TOTAL DIAM-DIAM (return doang, gak ada jejak) -- kalau ini
        // kejadian, jumlah Wild Card jadi kurang dari 10 dan bikin
        // initWildCardMSC() gagal SUNYI di hilir (lihat catatan di sana).
        // Sekarang minimal ke-log jelas, biar ketauan region mana yang
        // bermasalah kalau kejadian lagi.
        if (!r.pData || !r.pData.m8 || !r.pData.m8.menang) {
            console.error(`[GUARD MSC] Region ${r.kode} DI-SKIP dari kualifikasi MSC -- data Grand Final belum lengkap.`, r.pData);
            return;
        }
        mainStage.push({ tim: r.pData.m8.menang, asal: r.kode, bendera: r.bendera, jalur: "Champion" });
        mainStage.push({ tim: r.pData.m8.kalah, asal: r.kode, bendera: r.bendera, jalur: "Runner-up" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(r.pData.m8.menang, "mpl", r.kode);
    });

    // SG: Champion -> Main Stage (1 slot), Runner-up -> Wild Card
    if (window.pDataSG && window.pDataSG.m8 && window.pDataSG.m8.menang) {
        mainStage.push({ tim: window.pDataSG.m8.menang, asal: "SG", bendera: "🇸🇬", jalur: "Champion" });
        wildCard.push({ tim: window.pDataSG.m8.kalah, asal: "SG", bendera: "🇸🇬", jalur: "Runner-up" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(window.pDataSG.m8.menang, "mpl", "SG");
    } else {
        console.error("[GUARD MSC] Region SG DI-SKIP dari kualifikasi MSC -- data Grand Final belum lengkap.", window.pDataSG);
    }

    // 8 region baru (semua KECUALI Western Europe): Champion -> Main Stage
    // (1 slot/region), Runner-up -> Wild Card
    let regionSatuSlot = (window.REGION_SINGLE_TIER_BARU || []).filter(k => k !== "WEU");
    regionSatuSlot.forEach(kode => {
        let pData = window["pData" + kode];
        if (!pData || !pData.m8 || !pData.m8.menang) {
            console.error(`[GUARD MSC] Region ${kode} DI-SKIP dari kualifikasi MSC -- data Grand Final belum lengkap.`, pData);
            return;
        }
        let meta = REGION_BARU_META[kode] || { bendera: "🏳️" };
        mainStage.push({ tim: pData.m8.menang, asal: kode, bendera: meta.bendera, jalur: "Champion" });
        wildCard.push({ tim: pData.m8.kalah, asal: kode, bendera: meta.bendera, jalur: "Runner-up" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(pData.m8.menang, "mpl", kode);
    });

    // Western Europe: CUMA Champion -> Wild Card (gak dapet slot Main
    // Stage, dan gak ada slot wildcard buat runner-up-nya)
    if (window.pDataWEU && window.pDataWEU.m8 && window.pDataWEU.m8.menang) {
        wildCard.push({
            tim: window.pDataWEU.m8.menang, asal: "WEU",
            bendera: REGION_BARU_META.WEU.bendera, jalur: "Champion"
        });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(window.pDataWEU.m8.menang, "mpl", "WEU");
    } else {
        console.error("[GUARD MSC] Region WEU DI-SKIP dari kualifikasi MSC -- data Grand Final belum lengkap.", window.pDataWEU);
    }

    return { mainStage, wildCard };
}
window.tentukanKualifikasiMSC = tentukanKualifikasiMSC;

// [NEW] Diagnostik status tiap region -- dipakai buat nampilin status
// PERSIS di pesan error (bukan cuma console.error) biar kebaca tanpa
// perlu DevTools/PC sama sekali, cukup dari screenshot Error Catcher.
function diagnostikRegionMSC() {
    let baris = [];
    let cekID = window.pData || (typeof pData !== "undefined" ? pData : null);
    baris.push(`ID:${cekID && cekID.m8 && cekID.m8.menang ? "OK" : "KOSONG"}`);
    ["PH", "MY", "SG"].forEach(k => {
        let d = window["pData" + k];
        baris.push(`${k}:${d && d.m8 && d.m8.menang ? "OK" : "KOSONG"}`);
    });
    (window.REGION_SINGLE_TIER_BARU || []).forEach(k => {
        let d = window["pData" + k];
        baris.push(`${k}:${d && d.m8 && d.m8.menang ? "OK" : "KOSONG"}`);
    });
    return baris.join(", ");
}
window.diagnostikRegionMSC = diagnostikRegionMSC;

// ==========================================================
// FASE 5b: WILD CARD ENGINE
// ==========================================================
// 10 tim -> 2 grup of 5 -> Round Robin BO1 (Day 1-2) -> Cross-Group
// Gauntlet (Day 3) -> Final Bracket BO3 (Day 4) -> 1 tim lolos ke
// Group Stage MSC (jadi tim ke-16, gabung 15 direct qualifier).
//
// Asumsi yang gw ambil sendiri (gak dijelasin eksplisit di dokumen):
//  - Drawing awal ke Grup A/B: random shuffle biasa (gak ada seeding
//    khusus disebutkan)
//  - Tiebreak "time to victory" gak ada stat setara di sistem ini,
//    di-substitusi pakai `power` tim sebagai proxy (tim lebih dominan
//    dianggap menang lebih cepat) -- H2H tetap prioritas utama sesuai
//    dokumen, ini cuma fallback kalau H2H gak cukup buat misahin.
// ==========================================================

function acakArray(arr) {
    let a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Generate 10 pasangan unik round-robin buat 5 tim (metode circle,
// ditambah 1 slot "bye" virtual biar genap 6).
function buatJadwalRoundRobin5(timArr) {
    let arr = [...timArr, null];
    let semuaPasangan = [];
    for (let r = 0; r < 5; r++) {
        for (let i = 0; i < 3; i++) {
            let a = arr[i], b = arr[5 - i];
            if (a && b) semuaPasangan.push([a, b]);
        }
        let last = arr.pop();
        arr.splice(1, 0, last);
    }
    return semuaPasangan; // tepat 10 pasang, tiap tim ketemu semua lawan 1x
}

// Bangun ringkasan HTML hasil pertandingan 1 hari (buat popup)
// Baris HTML 1 match (home nama | skor | away nama) -- dipakai bareng
// oleh ringkasan Wild Card & Group Stage biar formatnya konsisten.
function barisRingkasanMatch(hasil) {
    return hasil.map(m => {
        let homeMenang = m.menang && m.menang.nama === m.home.nama;
        let awayMenang = m.menang && m.menang.nama === m.away.nama;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:12px;border-bottom:1px solid #222;">
            <span style="flex:1;text-align:right;${homeMenang ? "color:#00B37E;font-weight:bold;" : "color:#5C6472;"}">${m.home.nama}</span>
            <span style="flex:0 0 40px;text-align:center;color:#12151C;font-weight:bold;">${m.skorHome}-${m.skorAway}</span>
            <span style="flex:1;text-align:left;${awayMenang ? "color:#00B37E;font-weight:bold;" : "color:#5C6472;"}">${m.away.nama}</span>
        </div>`;
    }).join("");
}

function buatRingkasanHasilHariWC(hasilA, hasilB) {
    return `<div style="text-align:left;">
        <div style="color:#0891B2;font-size:12px;font-weight:bold;margin-bottom:3px;">GRUP A</div>
        ${barisRingkasanMatch(hasilA)}
        <div style="color:#0891B2;font-size:12px;font-weight:bold;margin:10px 0 3px;">GRUP B</div>
        ${barisRingkasanMatch(hasilB)}
    </div>`;
}
window.buatRingkasanHasilHariWC = buatRingkasanHasilHariWC;

// Ringkasan hasil 1 round Group Stage -- bisa 1 grup doang (round 1/2,
// dipisah per grup per hari) atau gabungan 2 grup sekaligus (round 3,
// karena masing2 cuma nyisain 2 match jadi dipadetin 1 hari).
function buatRingkasanHasilRoundGS(labelA, hasilA, labelB, hasilB) {
    let bagianB = (hasilB && hasilB.length)
        ? `<div style="color:#0891B2;font-size:12px;font-weight:bold;margin:10px 0 3px;">${labelB}</div>
           ${barisRingkasanMatch(hasilB)}`
        : "";
    return `<div style="text-align:left;">
        <div style="color:#0891B2;font-size:12px;font-weight:bold;margin-bottom:3px;">${labelA}</div>
        ${barisRingkasanMatch(hasilA)}
        ${bagianB}
    </div>`;
}
window.buatRingkasanHasilRoundGS = buatRingkasanHasilRoundGS;

function hitungKlasemenWC(timArr, hasilPertandingan) {
    let stats = {};
    timArr.forEach(t => { stats[t.nama] = { tim: t, menang: 0, kalah: 0, h2h: {} }; });
    hasilPertandingan.forEach(m => {
        if (!m || !m.menang) return;
        stats[m.menang.nama].menang++;
        stats[m.kalah.nama].kalah++;
        stats[m.menang.nama].h2h[m.kalah.nama] = (stats[m.menang.nama].h2h[m.kalah.nama] || 0) + 1;
    });
    let arr = Object.values(stats);
    arr.sort((a, b) => {
        if (b.menang !== a.menang) return b.menang - a.menang;
        let selisihH2H = (a.h2h[b.tim.nama] || 0) - (b.h2h[a.tim.nama] || 0);
        if (selisihH2H !== 0) return -selisihH2H;
        return (b.tim.power || 0) - (a.tim.power || 0); // proxy "time to victory"
    });
    return arr.map(s => s.tim);
}

// ----------------------------------------------------------
// INISIALISASI -- drawing 10 tim jadi 2 grup + generate jadwal
// ----------------------------------------------------------
function initWildCardMSC(daftarTimWC) {
    if (!daftarTimWC || daftarTimWC.length !== 10) {
        console.error("initWildCardMSC: butuh tepat 10 tim, dapet", daftarTimWC ? daftarTimWC.length : 0);
        return null;
    }
    let acak = acakArray(daftarTimWC.map(x => x.tim || x)); // terima format {tim,...} atau tim langsung
    let groupA = acak.slice(0, 5);
    let groupB = acak.slice(5, 10);

    window.wildCardData = {
        groupA, groupB,
        jadwalA: buatJadwalRoundRobin5(groupA),
        jadwalB: buatJadwalRoundRobin5(groupB),
        hasilA: [], hasilB: [],
        klasemenA: null, klasemenB: null,
        gauntlet: null,
        finalBracket: null,
        juaraWildCard: null,
        fase: 0 // 0=belum mulai, 1=day1 selesai, 2=day2 selesai(grup kelar), 3=gauntlet selesai, 4=final selesai
    };
    return window.wildCardData;
}
window.initWildCardMSC = initWildCardMSC;

// ----------------------------------------------------------
// DAY 1-2: Jalankan sebagian jadwal round-robin (dipanggil 2x,
// day1 batch pertama 5 match/grup, day2 batch sisanya)
// ----------------------------------------------------------
function jalankanHariGrupWC(hariKe) {
    let wc = window.wildCardData;
    if (!wc) return null;
    let mulai = hariKe === 1 ? 0 : 5;
    let akhir = hariKe === 1 ? 5 : 10;

    for (let i = mulai; i < akhir; i++) {
        let [homeA, awayA] = wc.jadwalA[i];
        let hasilA = simulasiGlobalMatch(homeA, awayA, 1, "msc_wc_grup");
        wc.hasilA.push(hasilA);

        let [homeB, awayB] = wc.jadwalB[i];
        let hasilB = simulasiGlobalMatch(homeB, awayB, 1, "msc_wc_grup");
        wc.hasilB.push(hasilB);
    }

    if (hariKe === 2) {
        wc.klasemenA = hitungKlasemenWC(wc.groupA, wc.hasilA);
        wc.klasemenB = hitungKlasemenWC(wc.groupB, wc.hasilB);
        wc.fase = 2;

        // [FIX] Reveal pairing Gauntlet Leg 1 (belum disimulasikan) sebagai
        // side-effect Day 2, biar match Gauntlet kelihatan dulu (VS)
        // sebelum hasilnya keluar -- gak nambah tick ekstra.
        let [, , ketigaA, keempatA] = wc.klasemenA;
        let [, , ketigaB, keempatB] = wc.klasemenB;
        wc.gauntlet = {
            m1A: { home: keempatA, away: ketigaB },
            m1B: { home: keempatB, away: ketigaA }
        };

        if (typeof tambahBerita === "function") {
            tambahBerita(`🎮 Wild Card Group Stage selesai. <span>${wc.klasemenA[0].nama}</span> (Grup A) & <span>${wc.klasemenB[0].nama}</span> (Grup B) langsung ke Semi Final Wild Card.`);
        }
    } else {
        wc.fase = 1;
    }
    return wc;
}
window.jalankanHariGrupWC = jalankanHariGrupWC;

// ----------------------------------------------------------
// DAY 3: Cross-Group Gauntlet -- 2 tim posisi-3 tukar grup,
// tangga 4th vs 3rd(tukar) -> pemenang vs 2nd. 1 selamat/grup.
// [FIX] Dipecah jadi 2 leg (Leg1/Leg2) biar konsisten kayak Regular
// Season: pairing tiap leg di-reveal (VS) 1 tick SEBELUM disimulasiin,
// bukan langsung keluar skor di tick yang sama pairing-nya dibuat.
// ----------------------------------------------------------
function jalankanGauntletWCLeg1() {
    let wc = window.wildCardData;
    if (!wc || !wc.gauntlet) return null;

    // m1A/m1B pairing-nya udah di-reveal sebelumnya (side-effect Day 2)
    wc.gauntlet.m1A = simulasiGlobalMatch(wc.gauntlet.m1A.home, wc.gauntlet.m1A.away, 3, "msc_wc_gauntlet");
    wc.gauntlet.m1B = simulasiGlobalMatch(wc.gauntlet.m1B.home, wc.gauntlet.m1B.away, 3, "msc_wc_gauntlet");

    // Reveal Leg 2 (belum disimulasikan)
    wc.gauntlet.m2A = { home: wc.gauntlet.m1A.menang, away: wc.klasemenA[1] };
    wc.gauntlet.m2B = { home: wc.gauntlet.m1B.menang, away: wc.klasemenB[1] };
    wc.fase = 2.5;

    if (typeof tambahBerita === "function") {
        tambahBerita(`⚔️ Gauntlet Leg 1 selesai. <span>${wc.gauntlet.m1A.menang.nama}</span> & <span>${wc.gauntlet.m1B.menang.nama}</span> lanjut ke Leg 2 lawan runner-up grup.`);
    }
    return wc;
}
window.jalankanGauntletWCLeg1 = jalankanGauntletWCLeg1;

function jalankanGauntletWCLeg2() {
    let wc = window.wildCardData;
    if (!wc || !wc.gauntlet || !wc.gauntlet.m2A) return null;

    wc.gauntlet.m2A = simulasiGlobalMatch(wc.gauntlet.m2A.home, wc.gauntlet.m2A.away, 3, "msc_wc_gauntlet");
    wc.gauntlet.m2B = simulasiGlobalMatch(wc.gauntlet.m2B.home, wc.gauntlet.m2B.away, 3, "msc_wc_gauntlet");
    wc.gauntlet.survivorA = wc.gauntlet.m2A.menang; // lolos "New Group A" -> Final Bracket M1
    wc.gauntlet.survivorB = wc.gauntlet.m2B.menang; // lolos "New Group B" -> Final Bracket M2
    wc.fase = 3;

    // Reveal pairing Final Bracket M1/M2 (belum disimulasikan)
    wc.finalBracket = {
        m1: { home: wc.klasemenA[0], away: wc.gauntlet.survivorB },
        m2: { home: wc.klasemenB[0], away: wc.gauntlet.survivorA }
    };

    if (typeof tambahBerita === "function") {
        tambahBerita(`⚔️ Cross-Group Gauntlet selesai. <span>${wc.gauntlet.survivorA.nama}</span> & <span>${wc.gauntlet.survivorB.nama}</span> lolos ke Wild Card Final Bracket.`);
    }
    return wc;
}
window.jalankanGauntletWCLeg2 = jalankanGauntletWCLeg2;

// ----------------------------------------------------------
// DAY 4: Final Bracket -- 1st-A vs Survivor New Group B (M1),
// 1st-B vs Survivor New Group A (M2), Winner M1 vs Winner M2 (M3
// Final, BO3). Juara -> 1 tiket terakhir ke MSC Group Stage.
// [FIX] Dipecah jadi 2 leg, sama alasannya kayak Gauntlet di atas.
// ----------------------------------------------------------
function jalankanFinalBracketWCLeg1() {
    let wc = window.wildCardData;
    if (!wc || !wc.finalBracket) return null;

    // m1/m2 pairing udah di-reveal sebelumnya (side-effect Gauntlet Leg2)
    wc.finalBracket.m1 = simulasiGlobalMatch(wc.finalBracket.m1.home, wc.finalBracket.m1.away, 3, "msc_wc_final");
    wc.finalBracket.m2 = simulasiGlobalMatch(wc.finalBracket.m2.home, wc.finalBracket.m2.away, 3, "msc_wc_final");

    // Reveal Final (M3) -- belum disimulasikan
    wc.finalBracket.m3 = { home: wc.finalBracket.m1.menang, away: wc.finalBracket.m2.menang };
    wc.fase = 3.5;

    if (typeof tambahBerita === "function") {
        tambahBerita(`🎟️ Wild Card Final Bracket M1 & M2 selesai. <span>${wc.finalBracket.m1.menang.nama}</span> vs <span>${wc.finalBracket.m2.menang.nama}</span> di partai puncak.`);
    }
    return wc;
}
window.jalankanFinalBracketWCLeg1 = jalankanFinalBracketWCLeg1;

function jalankanFinalBracketWCLeg2() {
    let wc = window.wildCardData;
    if (!wc || !wc.finalBracket || !wc.finalBracket.m3) return null;

    wc.finalBracket.m3 = simulasiGlobalMatch(wc.finalBracket.m3.home, wc.finalBracket.m3.away, 3, "msc_wc_final");
    wc.juaraWildCard = wc.finalBracket.m3.menang;
    wc.fase = 4;

    if (typeof tambahBerita === "function") {
        tambahBerita(`🎟️ Tiket Terakhir MSC 2026: <span>${wc.juaraWildCard.nama}</span> resmi lolos ke Group Stage lewat jalur Wild Card.`);
    }
    return wc;
}
window.jalankanFinalBracketWCLeg2 = jalankanFinalBracketWCLeg2;

// ==========================================================
// FASE 5c: GROUP STAGE ENGINE (GSL Double Elimination, 8 tim x 2 grup)
// ==========================================================
// 16 tim (15 direct qualifier + 1 juara Wild Card) -> drawing ke Grup
// A/B (8-8) -> tiap grup jalanin GSL 10-match double elim -> 4 tim
// lolos/grup (2 dengan rekor 2-0, 2 dengan rekor 2-1) -> total 8 tim
// ke Knockout Stage.
//
// Topologi bracket per grup (persis sesuai gambar resmi):
//   Round 1 (UB R1):  M1,M2,M3,M4 -- seed awal
//   Round 2 (UB R2):  M5=W.M1 vs W.M2 | M6=W.M3 vs W.M4
//              (LB R1): M7=L.M1 vs L.M2 | M8=L.M3 vs L.M4
//   Round 3 (LB R2):  M9=L.M6 vs W.M7 | M10=L.M5 vs W.M8
//   Lolos Knockout: W.M5, W.M6 (rekor 2-0) + W.M9, W.M10 (rekor 2-1)
//
// Asumsi yang gw ambil sendiri (dokumen gak nyebut metode seeding):
//  - Drawing 16 tim ke Grup A/B: random shuffle (sama kayak Wild Card)
//  - Pairing M1-M4 dalam grup: random juga (gak ada info pot/seeding),
//    bukan berdasarkan region/power, biar gak nambah asumsi lain
// ==========================================================

function buatBracketAwalGS(grup8Tim) {
    return {
        m1: { home: grup8Tim[0], away: grup8Tim[1] },
        m2: { home: grup8Tim[2], away: grup8Tim[3] },
        m3: { home: grup8Tim[4], away: grup8Tim[5] },
        m4: { home: grup8Tim[6], away: grup8Tim[7] }
    };
}

// ----------------------------------------------------------
// INISIALISASI -- drawing 16 tim (gabungan direct qualifier +
// juara Wild Card) jadi Grup A/B (8-8)
// ----------------------------------------------------------
function initGroupStageMSC(daftar15DirectQualifier, timJuaraWildCard) {
    let semuaTim = [
        ...daftar15DirectQualifier.map(x => x.tim || x),
        (timJuaraWildCard.tim || timJuaraWildCard)
    ];
    if (semuaTim.length !== 16) {
        console.error("initGroupStageMSC: butuh tepat 16 tim, dapet", semuaTim.length);
        return null;
    }
    let acak = acakArray(semuaTim);
    let groupA = acak.slice(0, 8);
    let groupB = acak.slice(8, 16);

    window.groupStageData = {
        groupA, groupB,
        A: buatBracketAwalGS(groupA),
        B: buatBracketAwalGS(groupB),
        fase: 0 // 0=belum, 1=UB R1 selesai, 2=UB R2+LB R1 selesai, 3=LB R2 selesai (grup kelar)
    };
    return window.groupStageData;
}
window.initGroupStageMSC = initGroupStageMSC;

// ----------------------------------------------------------
// Jalankan 1 round GSL buat 1 grup ('A' atau 'B')
// ----------------------------------------------------------
function jalankanRoundGroupStage(kodeGrup, round) {
    let gs = window.groupStageData;
    if (!gs) return null;
    let g = gs[kodeGrup];

    if (round === 1) {
        g.m1 = simulasiGlobalMatch(g.m1.home, g.m1.away, 3, "msc_gs_ub1");
        g.m2 = simulasiGlobalMatch(g.m2.home, g.m2.away, 3, "msc_gs_ub1");
        g.m3 = simulasiGlobalMatch(g.m3.home, g.m3.away, 3, "msc_gs_ub1");
        g.m4 = simulasiGlobalMatch(g.m4.home, g.m4.away, 3, "msc_gs_ub1");
        // [FIX] Reveal pairing Round 2 (belum disimulasikan) sebagai
        // side-effect Round 1, biar match berikutnya kelihatan dulu (VS)
        // sebelum hasilnya keluar di hari berikutnya -- gak nambah tick.
        g.m5 = { home: g.m1.menang, away: g.m2.menang };
        g.m6 = { home: g.m3.menang, away: g.m4.menang };
        g.m7 = { home: g.m1.kalah, away: g.m2.kalah };
        g.m8 = { home: g.m3.kalah, away: g.m4.kalah };
    } else if (round === 2) {
        g.m5 = simulasiGlobalMatch(g.m5.home, g.m5.away, 3, "msc_gs_ub2");
        g.m6 = simulasiGlobalMatch(g.m6.home, g.m6.away, 3, "msc_gs_ub2");
        g.m7 = simulasiGlobalMatch(g.m7.home, g.m7.away, 3, "msc_gs_lb1");
        g.m8 = simulasiGlobalMatch(g.m8.home, g.m8.away, 3, "msc_gs_lb1");
        // Reveal pairing Round 3 (belum disimulasikan)
        g.m9 = { home: g.m6.kalah, away: g.m7.menang };
        g.m10 = { home: g.m5.kalah, away: g.m8.menang };
    } else if (round === 3) {
        g.m9 = simulasiGlobalMatch(g.m9.home, g.m9.away, 3, "msc_gs_lb2");
        g.m10 = simulasiGlobalMatch(g.m10.home, g.m10.away, 3, "msc_gs_lb2");
        g.qualified2_0 = [g.m5.menang, g.m6.menang];
        g.qualified2_1 = [g.m9.menang, g.m10.menang];
    }
    return g;
}
window.jalankanRoundGroupStage = jalankanRoundGroupStage;

// ----------------------------------------------------------
// Jalankan 1 round buat KEDUA grup sekaligus (dipanggil 3x total,
// round 1/2/3 -- match dalam 1 round independen jadi aman diproses
// bareng, sesuai dependency graph GSL di atas)
// ----------------------------------------------------------
function jalankanRoundSemuaGrupGS(round) {
    jalankanRoundGroupStage("A", round);
    jalankanRoundGroupStage("B", round);

    let gs = window.groupStageData;
    gs.fase = round;

    if (round === 3 && typeof tambahBerita === "function") {
        let lolos = [...gs.A.qualified2_0, ...gs.A.qualified2_1, ...gs.B.qualified2_0, ...gs.B.qualified2_1];
        tambahBerita(`🏆 Group Stage MSC 2026 selesai. 8 tim lolos ke Knockout Stage: ${lolos.map(t => t.nama).join(", ")}.`);
    }
    return gs;
}
window.jalankanRoundSemuaGrupGS = jalankanRoundSemuaGrupGS;

// ==========================================================
// FASE 5d: KNOCKOUT STAGE ENGINE
// ==========================================================
// 8 tim (4 dari tiap grup: 2 rekor 2-0, 2 rekor 2-1) -> Single
// Elimination. QF wajib pertemukan 2-0 vs 2-1 LINTAS GRUP (sesuai
// dokumen). SF & 3rd Place BO5, Grand Final BO7.
//
// Pairing QF (satu-satunya cara valid memenuhi "2-0 vs 2-1 beda grup"
// dgn masing2 2 tim per kategori per grup):
//   QF1 = A(2-0)#1 vs B(2-1)#1      QF2 = A(2-0)#2 vs B(2-1)#2
//   QF3 = B(2-0)#1 vs A(2-1)#1      QF4 = B(2-0)#2 vs A(2-1)#2
//   SF1(M5) = W.QF1 vs W.QF2         SF2(M6) = W.QF3 vs W.QF4
//   3rd Place = L.SF1 vs L.SF2 (BO5)
//   Grand Final(M7) = W.SF1 vs W.SF2 (BO7)
// ==========================================================
// ==========================================================
// KNOCKOUT DRAW RULE -- "NO RANDOM DRAW. 2-0 teams choose their
// opponent." (diadaptasi dari aturan resmi MSC x EWC 2026)
//
// Urutan milih: 4 tim yang lolos jalur "2-0" (qualified2_0, gak
// pernah kalah sepanjang Group Stage) diurutin dari POINT
// DIFFERENTIAL tertinggi -- yaitu total margin skor dari 2 series
// BO3 yang mereka menangin di bracket mereka (menang 2-0 = +2,
// menang 2-1 = +1, per series). Yang differential-nya paling tinggi
// milih duluan.
//
// [KETERBATASAN JUJUR] Aturan resmi punya 6 lapis tiebreaker kalau
// differential-nya sama: waktu menang total, kecepatan match,
// individual game tercepat/terlambat, baru random draw. Game ini
// gak nyimulasiin durasi pertandingan sama sekali, jadi tiebreaker
// #1-5 gak ada data buat direplikasi -- kalau differential PERSIS
// sama, langsung lompat ke random draw (persis tiebreaker resmi #6,
// cuma lebih cepat nyampenya).
//
// Lawan yang bisa dipilih itu SATU POOL GABUNGAN dari 4 tim "2-1" di
// KEDUA grup -- gak ada pembatasan grup sama sekali (dikonfirmasi
// sumber + saksi mata: VIT beneran punya opsi FLCN dan ONIC bareng,
// padahal beda grup). Kalau hasil akhirnya kebetulan sering sesama
// grup, itu soal preferensi picker, bukan aturan yang membatasi.
// ==========================================================

// Point differential 1 tim sepanjang jalur Group Stage mereka --
// jumlahin margin skor dari semua match yang mereka menangin/kalahin
// di grup ini (m1-m10).
function hitungDiffTimGS(g, timObj) {
    let semuaMatch = [g.m1, g.m2, g.m3, g.m4, g.m5, g.m6, g.m7, g.m8, g.m9, g.m10];
    let total = 0;
    semuaMatch.forEach(m => {
        if (!m || !m.menang) return;
        if (m.home && m.home.nama === timObj.nama) total += (m.skorHome - m.skorAway);
        else if (m.away && m.away.nama === timObj.nama) total += (m.skorAway - m.skorHome);
    });
    return total;
}
window.hitungDiffTimGS = hitungDiffTimGS;

// Siapin urutan pick + pasangan DEFAULT (AI selalu milih lawan
// ber-OVR paling rendah = matchup paling menguntungkan). Default ini
// SELALU lengkap dan valid dari awal -- jadi kalaupun tim player gak
// sempat/gak mau buka modal pilihannya, turnamen tetap jalan normal
// tanpa nyangkut (gak ada soft-lock).
function siapkanKnockoutDrawMSC() {
    let gs = window.groupStageData;
    if (!gs || !gs.A.qualified2_0 || !gs.B.qualified2_0) {
        console.error("siapkanKnockoutDrawMSC: Group Stage belum kelar.");
        return null;
    }

    let picker = [
        { tim: gs.A.qualified2_0[0], grup: "A" },
        { tim: gs.A.qualified2_0[1], grup: "A" },
        { tim: gs.B.qualified2_0[0], grup: "B" },
        { tim: gs.B.qualified2_0[1], grup: "B" }
    ].map(p => ({ ...p, diff: hitungDiffTimGS(gs[p.grup], p.tim) }));
    // Diacak dulu SEBELUM sort -- kalau ada differential yang persis
    // sama, urutan akhirnya random, bukan selalu unggul index array.
    picker = acakArray(picker).sort((a, b) => b.diff - a.diff);

    // [FIX #2] Percobaan pertama: asumsi cross-group WAJIB (A cuma bisa
    // milih dari B). Percobaan kedua: asumsi SESAMA GRUP wajib (ternyata
    // salah juga -- itu cuma kebetulan hasil, bukan aturan). Yang bener,
    // dikonfirmasi sumber langsung + saksi mata drawing (VIT beneran
    // punya opsi FLCN *dan* ONIC bareng, padahal beda grup): "the pool
    // of teams that advance with a 2-1 record" -- SATU pool gabungan
    // isi 4 tim dari KEDUA grup, bebas dipilih siapapun, gak ada
    // pembatasan grup sama sekali.
    let poolGabungan = [...gs.A.qualified2_1, ...gs.B.qualified2_1];

    let pasangan = [];
    let giliranPlayer = null;

    picker.forEach(p => {
        let opsiTersedia = [...poolGabungan];
        let lawanTerpilih = (poolGabungan.length === 1)
            ? poolGabungan[0]
            : [...poolGabungan].sort((a, b) => (a.power || a.ovr || 0) - (b.power || b.ovr || 0))[0];
        poolGabungan.splice(poolGabungan.indexOf(lawanTerpilih), 1);
        // opsiTersedia disimpen buat SEMUA pick (bukan cuma giliran player)
        // -- dipake animasi reveal biar AI juga kelihatan "mempertimbangkan"
        // dari opsi yang beneran tersedia saat gilirannya, bukan cuma player.
        pasangan.push({ picker: p.tim, pickerGrup: p.grup, pickerDiff: p.diff, lawan: lawanTerpilih, opsiTersedia });

        if (typeof timPlayer !== "undefined" && p.tim.nama === timPlayer && giliranPlayer === null && opsiTersedia.length > 1) {
            giliranPlayer = { indexPasangan: pasangan.length - 1, opsiTersedia };
        }
    });

    window.knockoutDrawState = { picker, pasangan, giliranPlayer };
    return window.knockoutDrawState;
}
window.siapkanKnockoutDrawMSC = siapkanKnockoutDrawMSC;

// Ubah pasangan dari default AI jadi pilihan player. Kalau lawan yang
// dipilih player ternyata udah "kepake" duluan sama picker LAIN yang
// gilirannya belakangan, tim itu digeser dapet lawan lama si player
// (satu2nya opsi valid yang tersisa) biar gak ada lawan dobel/ilang.
function pilihLawanKnockoutMSC(namaLawanPilihan) {
    let kds = window.knockoutDrawState;
    if (!kds || !kds.giliranPlayer) return;
    let gp = kds.giliranPlayer;
    let pasanganPlayer = kds.pasangan[gp.indexPasangan];
    let lawanBaru = gp.opsiTersedia.find(t => t.nama === namaLawanPilihan);
    if (!lawanBaru) return;
    let lawanLama = pasanganPlayer.lawan;

    if (lawanBaru.nama !== lawanLama.nama) {
        pasanganPlayer.lawan = lawanBaru;
        for (let i = gp.indexPasangan + 1; i < kds.pasangan.length; i++) {
            if (kds.pasangan[i].lawan.nama === lawanBaru.nama) {
                kds.pasangan[i].lawan = lawanLama;
                break;
            }
        }
        finalisasiKnockoutDrawMSC();
        if (typeof tambahBerita === "function") {
            tambahBerita(`Kamu milih <b>${lawanBaru.nama}</b> sebagai lawan Quarter Final!`);
        }
    }

    kds._playerSudahPilih = true;

    // [ANIMASI] Render + tempelin hasil PICK PLAYER SENDIRI dulu (ini yang
    // kemarin ke-skip -- pick player gak pernah nongol di daftar hasil),
    // baru lanjutin sisa pick berikutnya lewat jalankanAnimasiDrawKO.
    let lanjutDari = (typeof kds._animasiIndexTertunda === "number") ? kds._animasiIndexTertunda : (gp.indexPasangan + 1);
    if (typeof jalankanAnimasiDrawKO === "function" && typeof getEl === "function" && getEl("koDrawStage")) {
        let stageEl = getEl("koDrawStage");
        let hasilEl = getEl("koDrawHasil");
        _tampilkanHasilPickKO(pasanganPlayer, stageEl, hasilEl).then(() => {
            jalankanAnimasiDrawKO(lanjutDari);
        });
    } else if (typeof tutupModal === "function") {
        tutupModal();
    }
}
window.pilihLawanKnockoutMSC = pilihLawanKnockoutMSC;

// Rakit window.knockoutData final dari pasangan yang udah ke-draw.
function finalisasiKnockoutDrawMSC() {
    let kds = window.knockoutDrawState;
    if (!kds) return null;
    let [p1, p2, p3, p4] = kds.pasangan;
    window.knockoutData = {
        qf1: { home: p1.picker, away: p1.lawan },
        qf2: { home: p2.picker, away: p2.lawan },
        qf3: { home: p3.picker, away: p3.lawan },
        qf4: { home: p4.picker, away: p4.lawan },
        sf1: null, sf2: null,
        juara3: null,
        grandFinal: null,
        juaraMSC: null,
        runnerUpMSC: null,
        fase: 0 // 0=belum, 1=QF selesai, 2=SF selesai, 3=3rd+GF selesai (turnamen kelar)
    };
    return window.knockoutData;
}
window.finalisasiKnockoutDrawMSC = finalisasiKnockoutDrawMSC;

// ==========================================================
// ANIMASI SEQUENTIAL REVEAL -- "siaran langsung" drawing
// ==========================================================
// Dipanggil dari tick koMulai. Nampilin 4 pick SATU-SATU dengan jeda
// (biar berasa nonton draw asli), realtime sesuai urutan pick beneran
// (bukan instan semua). Kalau ketemu giliran player, animasi BERHENTI
// dan nunggu tap dari modal pilihan -- baru lanjut abis dipilih.
// Modal & elemen di-manipulasi via JS asli (bukan <script> di dalem
// HTML innerHTML, karena innerHTML gak nge-eksekusi <script>).

const _koWaitMs = (ms) => new Promise(r => setTimeout(r, ms));

// Helper bareng: render hasil FINAL 1 pick ke stage, tunggu sebentar,
// terus tempelin ke daftar hasil. Dipake baik buat pick AI (di dalem
// loop) MAUPUN pick player (biar pick player juga ke-render di daftar
// hasil -- sebelumnya BUG di sini, pick player gak pernah nge-append).
async function _tampilkanHasilPickKO(p, stageEl, hasilEl) {
    stageEl.innerHTML = htmlStageDrawKO(p, -1, true, false);
    await _koWaitMs(950);
    hasilEl.insertAdjacentHTML("beforeend", htmlHasilRowDrawKO(p));
    await _koWaitMs(250);
}

function _htmlLogoDrawKO(namaOpsi, logoUrl) {
    let namaEnc = encodeURIComponent(namaOpsi || "?");
    let src = logoUrl || `https://ui-avatars.com/api/?name=${namaEnc}&background=1e1e1e&color=ffd700`;
    return `<img src="${src}" onerror="this.src='https://ui-avatars.com/api/?name=${namaEnc}&background=1e1e1e&color=ffd700'" style="width:26px;height:26px;border-radius:6px;object-fit:cover;background:#F7F9FC;margin-right:9px;flex-shrink:0;">`;
}

function _htmlBadgeDrawKO(namaOpsi, ovrOpsi, status, klikabel, logoUrl) {
    let styleStatus = {
        "": "opacity:.42;transform:scale(.98);",
        considering: "opacity:1;transform:scale(1);border-color:#5B3DF5;box-shadow:0 0 0 3px rgba(255,215,0,.16);animation:koDrawPulse 1s ease-in-out infinite;",
        chosen: "opacity:1;transform:scale(1.015);border-color:#5B3DF5;background:linear-gradient(90deg,rgba(255,215,0,.14),rgba(255,215,0,.02));box-shadow:0 0 0 3px rgba(255,215,0,.22),0 4px 16px rgba(255,215,0,.14);",
        rejected: "opacity:.22;transform:scale(.96);"
    }[status || ""];
    let namaAman = (namaOpsi || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
    let onclickAttr = klikabel ? `onclick="window.pilihLawanKnockoutMSC('${namaAman}')" ` : "";
    return `<div ${onclickAttr}style="${klikabel ? "cursor:pointer;" : ""}display:flex;justify-content:space-between;align-items:center;padding:10px 13px;margin:7px 0;border:1.5px solid rgba(201,151,31,0.30);border-radius:11px;font-size:12.5px;font-weight:700;background:#F7F9FC;color:#5C6472;transition:opacity .25s ease,transform .25s ease,box-shadow .25s ease,background .25s ease,border-color .25s ease;${styleStatus}">
        <span style="display:flex;align-items:center;">${_htmlLogoDrawKO(namaOpsi, logoUrl)}${namaOpsi}</span><span style="font-size:9.5px;color:#8A6D1F;font-weight:600;letter-spacing:.5px;">OVR ${Math.round(ovrOpsi || 0)}</span>
    </div>`;
}

// considerIdx: index opsi yang lagi di-highlight "dipertimbangkan" (-1 = gak ada)
// showFinal: true kalau harus nampilin hasil FINAL pick ini (dilihat langsung dari p.lawan, bukan index statis -- biar tetep bener walau ada swap dari override player)
function htmlStageDrawKO(p, considerIdx, showFinal, interaktif) {
    let daftarOpsi = p.opsiTersedia;
    let finalIdx = -1;
    if (showFinal) {
        finalIdx = daftarOpsi.findIndex(o => o.nama === p.lawan.nama);
        if (finalIdx === -1) { daftarOpsi = [p.lawan]; finalIdx = 0; } // fallback: lawan berubah gara2 swap override
    }

    let opsiHtml = daftarOpsi.map((o, i) => {
        let status = showFinal ? (i === finalIdx ? "chosen" : "rejected") : (i === considerIdx ? "considering" : "");
        return _htmlBadgeDrawKO(o.nama, o.power || o.ovr, status, interaktif, o.logo);
    }).join("");

    let statusLine;
    if (interaktif) {
        statusLine = `<div style="text-align:center;font-size:11.5px;color:#5B3DF5;font-weight:700;margin-top:12px;">Giliran kamu -- ketuk salah satu buat milih lawan</div>`;
    } else if (showFinal) {
        statusLine = `<div style="text-align:center;font-size:12.5px;color:#5B3DF5;font-weight:800;margin-top:12px;">${p.picker.nama} memilih ${p.lawan.nama}!</div>`;
    } else if (daftarOpsi.length > 1) {
        statusLine = `<div style="text-align:center;font-size:11.5px;color:#5C6472;margin-top:12px;">${p.picker.nama} sedang mempertimbangkan<span class="koDrawDots"><span></span><span></span><span></span></span></div>`;
    } else {
        statusLine = `<div style="text-align:center;font-size:11.5px;color:#5C6472;margin-top:12px;">Cuma tersisa 1 opsi buat ${p.picker.nama}</div>`;
    }

    return `<div style="background:#F7F9FC;border:1px solid rgba(201,151,31,0.30);border-radius:16px;padding:18px 16px 16px;position:relative;overflow:hidden;box-shadow:0 0 0 1px rgba(255,215,0,.06),0 8px 22px rgba(0,0,0,.5);">
        <div style="position:absolute;inset:0;background:linear-gradient(120deg,transparent 35%,rgba(255,215,0,.04) 50%,transparent 65%);pointer-events:none;"></div>
        <div style="position:relative;text-align:center;font-size:10px;letter-spacing:2.5px;color:#5B3DF5;font-weight:700;margin-bottom:12px;">GRUP ${p.pickerGrup} &middot; ${p.picker.nama} <span style="color:#5C6472;font-weight:600;">(diff +${p.pickerDiff})</span></div>
        <div style="position:relative;">${opsiHtml}</div>
        <div style="position:relative;">${statusLine}</div>
    </div>`;
}
window.htmlStageDrawKO = htmlStageDrawKO;

function htmlHasilRowDrawKO(p) {
    return `<div class="koDrawHasilRow" style="opacity:0;transform:translateY(8px);transition:opacity .45s cubic-bezier(.2,.8,.3,1),transform .45s cubic-bezier(.2,.8,.3,1);display:flex;align-items:center;justify-content:space-between;background:#F7F9FC;border:1px solid rgba(201,151,31,0.30);border-radius:12px;padding:11px 15px;margin-top:9px;box-shadow:0 0 0 1px rgba(255,215,0,.05),0 4px 12px rgba(0,0,0,.4);">
        <span style="font-weight:800;color:#5B3DF5;flex:1;text-align:right;font-size:13px;display:flex;align-items:center;justify-content:flex-end;">${p.picker.nama}${_htmlLogoDrawKO(p.picker.nama, p.picker.logo).replace('margin-right:9px;', 'margin-left:9px;margin-right:0;')}</span>
        <span style="font-size:9px;color:#8A6D1F;padding:0 12px;letter-spacing:1px;font-weight:700;">VS</span>
        <span style="font-weight:800;color:#5C6472;flex:1;font-size:13px;display:flex;align-items:center;">${_htmlLogoDrawKO(p.lawan.nama, p.lawan.logo)}${p.lawan.nama}</span>
    </div>`;
}
window.htmlHasilRowDrawKO = htmlHasilRowDrawKO;

// Style sekali-pakai buat animasi (dot loading & pulse glow) -- <style>
// TETAP kepake walau ditempel lewat innerHTML (beda sama <script> yang
// gak jalan), jadi aman dipasang sekali pas modal dibuka.
const _koDrawStyleBlock = `<style>
@keyframes koDrawPulse { 0%,100%{box-shadow:0 0 0 3px rgba(255,215,0,.16);} 50%{box-shadow:0 0 0 6px rgba(255,215,0,.06);} }
.koDrawDots{display:inline-block;letter-spacing:2px;margin-left:2px;}
.koDrawDots span{display:inline-block;width:4px;height:4px;border-radius:50%;background:#5B3DF5;margin:0 1.5px;animation:koDrawBlink 1.1s infinite ease-in-out;}
.koDrawDots span:nth-child(2){animation-delay:.15s;}
.koDrawDots span:nth-child(3){animation-delay:.3s;}
@keyframes koDrawBlink{ 0%,80%,100%{opacity:.2;} 40%{opacity:1;} }
.koDrawHasilRow.koDrawShow{opacity:1 !important;transform:translateY(0) !important;}
</style>`;

// Helper bareng: render hasil FINAL 1 pick ke stage, tunggu sebentar,
// terus tempelin ke daftar hasil. Dipake baik buat pick AI (di dalem
// loop) MAUPUN pick player (biar pick player juga ke-render di daftar
// hasil -- sebelumnya BUG di sini, pick player gak pernah nge-append).
async function _tampilkanHasilPickKO(p, stageEl, hasilEl) {
    stageEl.innerHTML = htmlStageDrawKO(p, -1, true, false);
    await _koWaitMs(950);
    hasilEl.insertAdjacentHTML("beforeend", htmlHasilRowDrawKO(p));
    // Trigger transisi slide-in: tempel dulu di state "opacity:0", baru
    // sebentar kemudian toggle class biar CSS transition-nya jalan
    // (bukan langsung final state -- efek slide-in-nya ilang kalau
    // enggak dikasih jeda 1 frame).
    let rowBaru = hasilEl.lastElementChild;
    await _koWaitMs(30);
    if (rowBaru && rowBaru.classList) rowBaru.classList.add("koDrawShow");
    await _koWaitMs(250);
}

// Orkestrasi utama -- jalanin reveal 1-per-1 mulai dari indexMulai.
// Berhenti otomatis kalau ketemu giliran player yang BELUM dia pilih
// (nunggu tap tombol, lalu pilihLawanKnockoutMSC yang manggil lanjut).
async function jalankanAnimasiDrawKO(indexMulai) {
    let kds = window.knockoutDrawState;
    if (!kds) return;
    if (typeof getEl !== "function") return;
    let stageEl = getEl("koDrawStage");
    let hasilEl = getEl("koDrawHasil");
    if (!stageEl || !hasilEl) return;

    for (let i = (indexMulai || 0); i < kds.pasangan.length; i++) {
        let p = kds.pasangan[i];

        if (kds.giliranPlayer && kds.giliranPlayer.indexPasangan === i && !kds._playerSudahPilih) {
            stageEl.innerHTML = htmlStageDrawKO(p, -1, false, true);
            kds._animasiIndexTertunda = i + 1; // simpen posisi lanjutan
            return; // STOP -- nunggu tap dari modal, lanjut dipanggil dari pilihLawanKnockoutMSC
        }

        if (p.opsiTersedia.length > 1) {
            for (let putaran = 0; putaran < 2; putaran++) {
                for (let k = 0; k < p.opsiTersedia.length; k++) {
                    stageEl.innerHTML = htmlStageDrawKO(p, k, false, false);
                    await _koWaitMs(320);
                }
            }
        }
        await _tampilkanHasilPickKO(p, stageEl, hasilEl);
    }

    stageEl.innerHTML = `<div style="text-align:center;padding:20px 4px;background:#F7F9FC;border:1px solid rgba(201,151,31,0.30);border-radius:16px;box-shadow:0 0 0 1px rgba(255,215,0,.06),0 8px 22px rgba(0,0,0,.5);">
        <div style="color:#5B3DF5;font-weight:800;font-size:13.5px;letter-spacing:.3px;">Draw Selesai</div>
        <div style="color:#5C6472;font-size:11px;margin-top:4px;">4 matchup Quarter Final udah terkunci!</div>
    </div>`;
}
window.jalankanAnimasiDrawKO = jalankanAnimasiDrawKO;

// Entry point dipanggil dari tick koMulai -- buka modal kosong (cuma
// kerangka container + style block sekali-pakai), lalu jalanin
// animasinya dari pick pertama.
function mulaiAnimasiKnockoutDrawMSC() {
    let kds = window.knockoutDrawState;
    if (!kds) return;
    if (typeof bukaModal === "function") {
        bukaModal("Knockout Draw -- MSC 2026",
            `${_koDrawStyleBlock}<div id="koDrawStage" style="min-height:170px;"></div><div id="koDrawHasil" style="margin-top:6px;"></div>`,
            "#5B3DF5");
    }
    jalankanAnimasiDrawKO(0);
}
window.mulaiAnimasiKnockoutDrawMSC = mulaiAnimasiKnockoutDrawMSC;

function jalankanQuarterFinalMSC() {
    let kd = window.knockoutData;
    if (!kd) return null;

    kd.qf1 = simulasiGlobalMatch(kd.qf1.home, kd.qf1.away, 5, "msc_knockout_qf");
    kd.qf2 = simulasiGlobalMatch(kd.qf2.home, kd.qf2.away, 5, "msc_knockout_qf");
    kd.qf3 = simulasiGlobalMatch(kd.qf3.home, kd.qf3.away, 5, "msc_knockout_qf");
    kd.qf4 = simulasiGlobalMatch(kd.qf4.home, kd.qf4.away, 5, "msc_knockout_qf");

    kd.sf1 = { home: kd.qf1.menang, away: kd.qf2.menang };
    kd.sf2 = { home: kd.qf3.menang, away: kd.qf4.menang };
    kd.fase = 1;

    if (typeof tambahBerita === "function") {
        tambahBerita(`⚔️ Quarter Final MSC 2026 selesai. Semi Finalis: ${kd.qf1.menang.nama}, ${kd.qf2.menang.nama}, ${kd.qf3.menang.nama}, ${kd.qf4.menang.nama}.`);
    }
    return kd;
}
window.jalankanQuarterFinalMSC = jalankanQuarterFinalMSC;

function jalankanSemiFinalMSC() {
    let kd = window.knockoutData;
    if (!kd || !kd.sf1 || !kd.sf2) return null;

    kd.sf1 = simulasiGlobalMatch(kd.sf1.home, kd.sf1.away, 5, "msc_knockout_sf");
    kd.sf2 = simulasiGlobalMatch(kd.sf2.home, kd.sf2.away, 5, "msc_knockout_sf");

    kd.grandFinal = { home: kd.sf1.menang, away: kd.sf2.menang };
    // [FIX] Reveal pairing Perebutan Juara 3 (belum disimulasikan) sebagai
    // side-effect SF, sejalan sama Grand Final di atas -- sebelumnya match
    // ini gak pernah disimpan sebagai objek match utuh (cuma nyimpen nama
    // pemenangnya doang), jadi gak bisa ditampilin sebagai box bracket.
    kd.juara3Match = { home: kd.sf1.kalah, away: kd.sf2.kalah };
    kd.fase = 2;

    if (typeof tambahBerita === "function") {
        tambahBerita(`🔥 Semi Final MSC 2026 selesai. <span>${kd.sf1.menang.nama}</span> & <span>${kd.sf2.menang.nama}</span> lolos ke Grand Final.`);
    }
    return kd;
}
window.jalankanSemiFinalMSC = jalankanSemiFinalMSC;

// ==========================================================
// FASE 5e: DISTRIBUSI HADIAH & CUTOVER (STATE MACHINE)
// ==========================================================
// distribusiHadiahTurnamenAI() lama gak cocok dipakai buat struktur
// baru (wildCardData/groupStageData/knockoutData beda bentuk dari
// mscData lama), jadi dibikin versi baru khusus.
// ==========================================================
function distribusiHadiahMSCBaru() {
    const prize = { juara1: 1500000000, juara2: 600000000, juara3: 400000000, top8: 300000000, wildCard: 150000000 };
    let bayar = (tim, nominal, bonusRep) => {
        if (!tim || tim.nama === timPlayer) return;
        tim.kas = (tim.kas || 0) + nominal;
        if (bonusRep) tim.reputasi = Math.min(100, (tim.reputasi || 50) + bonusRep);
    };

    let kd = window.knockoutData;
    if (kd) {
        bayar(kd.juaraMSC, prize.juara1, 15);
        bayar(kd.runnerUpMSC, prize.juara2, 8);
        bayar(kd.juara3, prize.juara3, 5);
    }

    let gs = window.groupStageData;
    if (gs) {
        // Sisa 8 tim yang gak lolos Group Stage (dari 16, minus 8 yang ke Knockout)
        let lolosKnockout = kd ? [
            ...gs.A.qualified2_0, ...gs.A.qualified2_1, ...gs.B.qualified2_0, ...gs.B.qualified2_1
        ].map(t => t.nama) : [];
        [...gs.groupA, ...gs.groupB].forEach(t => {
            if (!lolosKnockout.includes(t.nama)) bayar(t, prize.top8, 3);
        });
    }

    let wc = window.wildCardData;
    if (wc) {
        [...wc.groupA, ...wc.groupB].forEach(t => {
            if (t.nama !== (wc.juaraWildCard && wc.juaraWildCard.nama)) bayar(t, prize.wildCard, 2);
        });
    }
}
window.distribusiHadiahMSCBaru = distribusiHadiahMSCBaru;

// ----------------------------------------------------------
// Dipanggil sekali setelah GF selesai -- hadiah, buka transfer,
// kembali ke alur normal (persis pola sistem MSC lama).
// ----------------------------------------------------------
function selesaikanMSCEwc() {
    let kd = window.knockoutData;
    let juaraMSC = kd.juaraMSC;

    if (juaraMSC.nama === timPlayer) {
        kasTim += 1500000000;
        if (typeof catatKas === "function") catatKas("MASUK", 1500000000, `Prize Pool Juara MSC S${musimKe} (GLOBAL)`);
        reputasiManajer += 100;
        // [FIX] Bonus juara dari 3 slot sponsor (field `bonusJuara`) sudah
        // ada datanya & ada kodenya dari dulu -- tapi cuma nempel di
        // blok MSC LAMA (script.js) yang udah gak pernah kepanggil lagi
        // sejak MSC dipindah ke engine ini. Jadi bonusJuara sponsor
        // TIDAK PERNAH cair sama sekali walau tim player juara MSC.
        // Sekarang dipasang di titik yang beneran jalan.
        if (window.sponsorTim) {
            let st = window.sponsorTim;
            [st.utama, st.minor1, st.minor2].forEach(sp => {
                if (sp && sp.bonusJuara) {
                    kasTim += sp.bonusJuara;
                    if (typeof catatKas === "function") catatKas("MASUK", sp.bonusJuara, `Bonus Juara Sponsor (MSC): ${sp.nama}`);
                    if (typeof bukaModal === "function") {
                        bukaModal("🏆 BONUS SPONSOR CAIR!", `<b>${sp.nama}</b> memberikan bonus juara MSC sebesar <b>Rp ${(sp.bonusJuara/1000000).toFixed(1)} Jt</b>!`, "#C9971F");
                    }
                }
            });
        }
    }
    distribusiHadiahMSCBaru();

    if (typeof bankRiwayatJuara !== "undefined") {
        bankRiwayatJuara.push({ season: musimKe, tahun: kalenderGame.getFullYear(), tim: juaraMSC, negara: "🌐 GLOBAL (MSC)" });
        if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir(null, "MSC", kd.runnerUpMSC);
        if (typeof window.gprUpdateReigningMSC === "function") {
            window.gprUpdateReigningMSC(juaraMSC.nama, kd.runnerUpMSC ? kd.runnerUpMSC.nama : null);
        }
        if (typeof window.gprHitungRanking === "function") window.gprHitungRanking(true);
    }
    if (typeof window.bukaModalJuaraDunia === "function") {
        window.bukaModalJuaraDunia(juaraMSC.nama, "Juara MSC x EWC 2026", "world-cyan");
    } else if (typeof bukaModal === "function") {
        bukaModal("🏆 JUARA DUNIA! 🏆", `<b>${juaraMSC.nama}</b> berhasil memenangkan MSC x EWC 2026!`, "#0891B2");
    }

    statusGame = "JEDA_TRANSFER";
    hariJeda = (typeof hitungHariJedaTransferPascaTurnamen === "function") ? hitungHariJedaTransferPascaTurnamen() : 30; // [FIX] calendar-driven, bukan fix 30 hari lagi
    transferBuka = true;
    // [FIX] Isi pasar 10 pemain + 10 staff baru tiap bursa dibuka.
    if (typeof generatePemainDanStaffBaru === "function") generatePemainDanStaffBaru(10, 5);
    if (typeof tambahBerita === "function") {
        tambahBerita(`🔓 <b>BURSA Transfer DIBUKA!</b> MSC S${musimKe} selesai. Transfer window resmi dibuka selama 30 hari.`);
    }
    window.mscEwcState = null; // bersihkan state, siap buat musim ganjil berikutnya
}
window.selesaikanMSCEwc = selesaikanMSCEwc;

// ----------------------------------------------------------
// ORKESTRATOR UTAMA -- dipanggil tiap hari kalender selama window
// MSC x EWC (dari Wild Card mulai s/d Grand Final). Nentuin sendiri
// harus ngapain hari ini berdasarkan tanggal kalender aktual (bukan
// counter manual), biar gak gampang drift/salah hitung.
// ----------------------------------------------------------
function jalankanTickMSCEWC() {
    let tabelTgl = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
    let st = window.mscEwcState;
    if (!tabelTgl || !st) return;

    let hari = kalenderGame;

    // [FIX] Diganti total ke logic "catch-up" -- SEBELUMNYA cuma jalan
    // kalau kalender PERSIS di hari ke-1/2/3/4 sebuah window, jadi kalau
    // ada hari yang kelewat (reload/skip/dll) tahapnya PERMANEN gak
    // pernah jalan dan bikin tahap berikutnya mulai dgn data null/crash.
    // Sekarang: jalanin 1 langkah yang BELUM selesai setiap kali dipanggil,
    // gak peduli persis di hari keberapa -- otomatis "nyusul" sendiri.
    // Setiap tahap WAJIB nunggu tahap sebelumnya bener2 selesai (gate
    // eksplisit) sebelum boleh mulai, jadi gak mungkin lompat.
    //
    // [REPACE MSC 2026] Sebelumnya Wild Card butuh 7 hari kalender buat
    // kelar (1 langkah/hari x 7 tahap) padahal event aslinya cuma 4 hari
    // (1-4 Juli): Gauntlet Leg1+Leg2 dan Final Leg1+Leg2 di realita
    // masing2 dipadetin jalan di HARI YANG SAMA, bukan dipisah 2 hari.
    // Sekarang dipadetin juga di sini -- total jadi 4 hari, persis
    // kalender asli. Group Stage sebaliknya: sebelumnya cuma 3 langkah
    // (3 hari), padahal aslinya "4 pertandingan/hari selama 5 hari,
    // rolling schedule" (1 grup/hari buat Round 1 & 2, gabungan 2 grup
    // di hari terakhir karena Round 3 cuma nyisain 2 match/grup) -- jadi
    // sekarang dipecah jadi 5 langkah biar cadence-nya ikut match asli.

    // -- WILD CARD -- (4 hari: Day1 grup, Day2 grup, Gauntlet, Final)
    if (hari >= tabelTgl.wildCardMulai) {
        if (!st.wcMulai) {
            // [FIX] SEBELUMNYA initWildCardMSC() bisa gagal SUNYI (return
            // null kalau jumlah tim kualifikasi != 10 -- lihat console.error
            // di dalamnya) tapi kode di bawah TETAP jalan terus nandain
            // "st.wcMulai = true" seolah berhasil. Akibatnya: wildCardData
            // rusak/gak lengkap, game keliatan macet permanen di "Wild
            // Card - Day 1" TANPA popup error apapun (karena gagalnya
            // console.error doang, bukan exception). Sekarang: dicek
            // hasilnya, kalau gagal, di-throw sebagai Error asli yang
            // bakal ketangkep sama Error Catcher (popup merah) -- jadi
            // minimal keliatan ada masalah, bukan diem nge-freeze.
            let hasilInit = initWildCardMSC(st.kualifikasi.wildCard);
            if (!hasilInit) {
                // [FIX] Self-heal: sebelum nyerah, coba hitung ULANG
                // kualifikasi dari data region yang ada di MEMORI SEKARANG.
                // Kalau ini kejadian di save lama (dibuat pas versi kode
                // yang masih ada bug region), kemungkinan yang KE-SAVE di
                // file save-nya doang yang rusak/kosong -- data region
                // aslinya (window.pDataXX) yang aktif SEKARANG di sesi ini
                // siapa tau udah lengkap/benar. Kalau hitung ulang ternyata
                // pas 10, langsung dipakein tanpa perlu lapor error.
                if (typeof tentukanKualifikasiMSC === "function") {
                    let kualifikasiBaru = tentukanKualifikasiMSC();
                    if (kualifikasiBaru && kualifikasiBaru.wildCard && kualifikasiBaru.wildCard.length === 10) {
                        console.error("[GUARD MSC] Kualifikasi lama rusak/kosong -- berhasil di-refresh ulang dari data region saat ini.");
                        st.kualifikasi = kualifikasiBaru;
                        hasilInit = initWildCardMSC(st.kualifikasi.wildCard);
                    }
                }
            }
            if (!hasilInit) {
                throw new Error(
                    `Wild Card MSC gagal dimulai -- jumlah tim kualifikasi cuma ${st.kualifikasi.wildCard ? st.kualifikasi.wildCard.length : 0}, butuh tepat 10.\n` +
                    `Status tiap region: ${diagnostikRegionMSC()}`
                );
            }
            jalankanHariGrupWC(1);
            st.wcMulai = true;
            st.wcDay1 = true;
            tambahBerita("🎮 Wild Card MSC 2026 Dimulai. Hasil Day 1 udah bisa dicek di menu MSC.");
            if (typeof bukaModal === "function") {
                bukaModal("🎮 Hasil Wild Card Day 1", buatRingkasanHasilHariWC(window.wildCardData.hasilA.slice(0, 5), window.wildCardData.hasilB.slice(0, 5)), "#0891B2");
            }
            return;
        }
        if (!st.wcDay2) {
            jalankanHariGrupWC(2);
            st.wcDay2 = true;
            if (typeof bukaModal === "function") {
                bukaModal("🎮 Hasil Wild Card Day 2", buatRingkasanHasilHariWC(window.wildCardData.hasilA.slice(5, 10), window.wildCardData.hasilB.slice(5, 10)), "#0891B2");
            }
            return;
        }
        if (!st.wcGauntletLeg2) {
            jalankanGauntletWCLeg1();
            jalankanGauntletWCLeg2();
            st.wcGauntletLeg1 = true;
            st.wcGauntletLeg2 = true;
            if (typeof bukaModal === "function") {
                let g = window.wildCardData.gauntlet;
                bukaModal("⚔️ Hasil Wild Card Gauntlet (Day 3)", buatRingkasanHasilHariWC([g.m1A, g.m2A], [g.m1B, g.m2B]), "#0891B2");
            }
            return;
        }
        if (!st.wcFinalLeg2) {
            jalankanFinalBracketWCLeg1();
            jalankanFinalBracketWCLeg2();
            st.wcFinalLeg1 = true;
            st.wcFinalLeg2 = true;
            if (typeof bukaModal === "function") {
                let fb = window.wildCardData.finalBracket;
                bukaModal("🎟️ Hasil Wild Card Final Bracket (Day 4)", buatRingkasanHasilRoundGS("SEMIFINAL", [fb.m1, fb.m2], "FINAL", [fb.m3]), "#0891B2");
            }
            return;
        }
    }

    // -- GROUP STAGE -- (5 hari, gak boleh mulai sebelum Wild Card BENERAN kelar)
    if (hari >= tabelTgl.groupStageMulai && st.wcFinalLeg2) {
        if (!st.gsMulai) {
            initGroupStageMSC(st.kualifikasi.mainStage, window.wildCardData.juaraWildCard);
            jalankanRoundGroupStage("A", 1);
            st.gsMulai = true;
            tambahBerita("🏆 Group Stage MSC 2026 Dimulai. Hasil Round 1 Grup A udah keluar.");
            if (typeof bukaModal === "function") {
                let g = window.groupStageData.A;
                bukaModal("🏆 Group Stage - Grup A Round 1", buatRingkasanHasilRoundGS("GRUP A", [g.m1, g.m2, g.m3, g.m4]), "#0891B2");
            }
            return;
        }
        if (!st.gsR1B) {
            jalankanRoundGroupStage("B", 1);
            st.gsR1B = true;
            if (typeof bukaModal === "function") {
                let g = window.groupStageData.B;
                bukaModal("🏆 Group Stage - Grup B Round 1", buatRingkasanHasilRoundGS("GRUP B", [g.m1, g.m2, g.m3, g.m4]), "#0891B2");
            }
            return;
        }
        if (!st.gsR2A) {
            jalankanRoundGroupStage("A", 2);
            st.gsR2A = true;
            if (typeof bukaModal === "function") {
                let g = window.groupStageData.A;
                bukaModal("🏆 Group Stage - Grup A Round 2", buatRingkasanHasilRoundGS("GRUP A", [g.m5, g.m6, g.m7, g.m8]), "#0891B2");
            }
            return;
        }
        if (!st.gsR2B) {
            jalankanRoundGroupStage("B", 2);
            st.gsR2B = true;
            if (typeof bukaModal === "function") {
                let g = window.groupStageData.B;
                bukaModal("🏆 Group Stage - Grup B Round 2", buatRingkasanHasilRoundGS("GRUP B", [g.m5, g.m6, g.m7, g.m8]), "#0891B2");
            }
            return;
        }
        if (!st.gsR3) {
            jalankanRoundGroupStage("A", 3);
            jalankanRoundGroupStage("B", 3);
            st.gsR3 = true;
            let gs = window.groupStageData;
            gs.fase = 3;
            if (typeof bukaModal === "function") {
                bukaModal("🏆 Group Stage - Round 3 (Grup A & B)", buatRingkasanHasilRoundGS("GRUP A", [gs.A.m9, gs.A.m10], "GRUP B", [gs.B.m9, gs.B.m10]), "#0891B2");
            }
            if (typeof tambahBerita === "function") {
                let lolos = [...gs.A.qualified2_0, ...gs.A.qualified2_1, ...gs.B.qualified2_0, ...gs.B.qualified2_1];
                tambahBerita(`🏆 Group Stage MSC 2026 selesai. 8 tim lolos ke Knockout Stage: ${lolos.map(t => t.nama).join(", ")}.`);
            }
            return;
        }
    }

    // -- KNOCKOUT -- (gak boleh mulai sebelum Group Stage BENERAN kelar)
    if (hari >= tabelTgl.knockoutMulai && st.gsR3) {
        if (!st.koMulai) {
            siapkanKnockoutDrawMSC();
            finalisasiKnockoutDrawMSC();
            st.koMulai = true;
            let kds = window.knockoutDrawState;
            let ringkasanDraw = kds.pasangan
                .map(p => `${p.picker.nama} (+${p.pickerDiff}) pilih ${p.lawan.nama}`)
                .join(", ");
            tambahBerita(`Knockout Stage MSC 2026 Dimulai. No random draw -- tim 2-0 milih lawan sendiri berdasarkan point differential: ${ringkasanDraw}.`);
            // [ANIMASI] Draw ditampilin sequential reveal 1-per-1 (kayak
            // siaran langsung), bukan langsung nongol hasil final semua
            // sekaligus. Data hasil (window.knockoutData) udah final dari
            // awal lewat finalisasiKnockoutDrawMSC() di atas -- animasi
            // ini murni presentasi, gak ngubah apapun soal siapa lolos.
            if (typeof mulaiAnimasiKnockoutDrawMSC === "function") {
                mulaiAnimasiKnockoutDrawMSC();
            }
            // [FIX] QF SENGAJA belum disimulasikan hari ini -- sama kayak
            // Group Stage di atas, biar pairing-nya kelihatan dulu.
            return;
        }
        if (!st.koQf) { jalankanQuarterFinalMSC(); st.koQf = true; return; }
        if (!st.koSf) { jalankanSemiFinalMSC(); st.koSf = true; return; }
        if (!st.koJuara3) {
            let kd = window.knockoutData;
            kd.juara3Match = simulasiGlobalMatch(kd.juara3Match.home, kd.juara3Match.away, 5, "msc_knockout_3rd");
            kd.juara3 = kd.juara3Match.menang;
            st.koJuara3 = true;
            if (typeof tambahBerita === "function") tambahBerita(`🥉 Juara 3 MSC 2026: <span>${kd.juara3.nama}</span>.`);
            return;
        }
    }

    // -- GRAND FINAL -- (gak boleh mulai sebelum Knockout BENERAN kelar)
    if (hari >= tabelTgl.grandFinalTanggal && st.koJuara3 && !st.gfDone) {
        let kd = window.knockoutData;
        kd.grandFinal = simulasiGlobalMatch(kd.grandFinal.home, kd.grandFinal.away, 7, "msc_knockout_gf");
        kd.juaraMSC = kd.grandFinal.menang;
        kd.runnerUpMSC = kd.grandFinal.kalah;
        if (typeof tambahBerita === "function") {
            tambahBerita(`🏆 Juara MSC 2026: <span>${kd.juaraMSC.nama}</span>. Runner-up: <b>${kd.runnerUpMSC.nama}</b>.`);
        }
        if (typeof window.prosesReputasi === "function") window.prosesReputasi(kd.juaraMSC.nama, "JUARA_MSC");
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(kd.juaraMSC, "msc");
        // [MERCH V3] Buka akses Limited Edition kalau player Juara MSC
        if (kd.juaraMSC.nama === timPlayer && typeof window.bukaLEDariEventBesarV3 === "function") {
            window.bukaLEDariEventBesarV3("MSC");
        }
        // [WIRING FIX] Bonus fanbase.jumlah/moral dari Juara MSC sebelumnya
        // gak pernah ke-trigger karena prosesFanbaseEventBesar() dead code.
        if (kd.juaraMSC.nama === timPlayer && typeof window.hookFanbaseEventBesar === "function") {
            window.hookFanbaseEventBesar("JUARA_MSC");
        }
        st.gfDone = true;
        selesaikanMSCEwc();
        return;
    }
}
window.jalankanTickMSCEWC = jalankanTickMSCEWC;
