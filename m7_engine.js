// ==========================================================
// M7 WORLD CHAMPIONSHIP - ENGINE
// File terpisah (additive, gak nyentuh script.js/msc_ewc_engine.js
// yang udah ada) -- dipanggil dari titik yang sama tempat
// M-Series lama dipanggil di script.js (musim genap), tapi lewat
// state machine baru sendiri (statusGame "JEDA_M7" / "M7") biar
// gak numpuk sama logic mSeriesData lama (yang dibiarin utuh demi
// kompatibilitas save lama).
//
// ASUMSI YANG DIAMBIL SENDIRI (dikonfirmasi user sebelum implementasi
// utk 3 poin utama, sisanya konsisten sama konvensi MSC x EWC engine
// yang udah ada):
//  - Seeding Round 1 Swiss (16 tim): RANDOM DRAW murni (dikonfirmasi user)
//  - Drawing Wild Card ke Grup A/B (8 tim): RANDOM DRAW murni (dikonfirmasi user)
//  - Prize pool: DIPAKAI, masuk ke kas + reputasi tim (dikonfirmasi user).
//    Nominal belum ditentukan di dokumen -- dipakai skala di atas MSC
//    (MSC juara1 = Rp1.5M) karena M7 adalah World Championship akhir
//    tahun. SILAKAN DIUBAH kalau nominalnya mau disesuaikan.
//  - Roster Lock M7: dipasang 10 hari sebelum Wild Card mulai, sama
//    kayak konvensi rosterLockMSC di calendar_system_patch.js.
//  - Seeding pairing Upper Bracket Quarter Final Knockout (8 tim hasil
//    Swiss): RANDOM DRAW (dokumen gak nyebut metode seeding knockout,
//    konsisten sama preferensi random draw yang udah dikonfirmasi).
//  - Jadwal detail Lower Bracket Knockout (LBR1/LBR2/LBR3/LB Final)
//    yang gak dikasih tanggal eksplisit di dokumen: diisi mengikuti
//    gap tanggal yang tersedia (19-20 & 23 Jan) di antara tanggal
//    eksplisit yang DIKASIH dokumen (UBQF 18, UBSF 21, UBFinal 22,
//    Grand Final 25), pakai pola catch-up state machine yang sama
//    kayak jalankanTickMSCEWC() -- 1 langkah per hari, gerbang
//    dependency ketat, otomatis "nyusul" kalau ada hari kelewat.
// ==========================================================

// ----------------------------------------------------------
// HELPER UMUM (dipakai ulang dari pola yang sama kayak MSC engine)
// ----------------------------------------------------------
function acakArrayM7(arr) {
    let a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ==========================================================
// FASE M7-1: KUALIFIKASI (14 Slot Main Event Langsung + 8 Wild Card)
// ==========================================================
// Dipanggil SEKALI, tepat setelah semua region selesai Grand Final
// playoff regional-nya masing-masing (di musim genap).
//
// Alokasi slot (sesuai MASTER PROMPT M7):
//   MAIN EVENT langsung (14): ID(2) PH(2) MY(2) SG(1) KH(1) MM(1)
//                              MENA(1) TR(1) EECA(1) EA(1) AM(1)
//   WILD CARD (8): WEU Champion(1) + India Champion(1) +
//                   Runner-up dari SG/KH/MM/MENA/TR/EECA (6)
//   PENTING: EA & AM cuma dapet slot Main Event Champion -- runner-up
//   mereka TIDAK dapat slot Wild Card sama sekali (beda dari 5 region
//   lain yang runner-up-nya dapet Wild Card). India di M7 juga beda
//   dari MSC: Champion India cuma ke Wild Card, BUKAN Main Event
//   langsung. Ini semua sesuai persis dokumen, bukan asumsi.
// ==========================================================
function tentukanKualifikasiM7() {
    let mainEvent = [];
    let wildCard = [];

    let dataID = window.pData || (typeof pData !== "undefined" ? pData : null);
    let regionDuaSlot = [
        { pData: dataID, kode: "ID", bendera: "🇮🇩" },
        { pData: window.pDataPH, kode: "PH", bendera: "🇵🇭" },
        { pData: window.pDataMY, kode: "MY", bendera: "🇲🇾" }
    ];
    regionDuaSlot.forEach(r => {
        // [FIX] Log diagnostik kalau region di-skip (dulu diem-diem doang)
        // -- konsisten sama fix yang sama di tentukanKualifikasiMSC().
        if (!r.pData || !r.pData.m8 || !r.pData.m8.menang) {
            console.error(`[GUARD M7] Region ${r.kode} DI-SKIP dari kualifikasi M7 -- data Grand Final belum lengkap.`, r.pData);
            return;
        }
        mainEvent.push({ tim: r.pData.m8.menang, asal: r.kode, bendera: r.bendera, jalur: "Champion" });
        mainEvent.push({ tim: r.pData.m8.kalah, asal: r.kode, bendera: r.bendera, jalur: "Runner-up" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(r.pData.m8.menang, "mpl", r.kode);
    });

    // SG: Champion -> Main Event (1 slot), Runner-up -> Wild Card
    if (window.pDataSG && window.pDataSG.m8 && window.pDataSG.m8.menang) {
        mainEvent.push({ tim: window.pDataSG.m8.menang, asal: "SG", bendera: "🇸🇬", jalur: "Champion" });
        wildCard.push({ tim: window.pDataSG.m8.kalah, asal: "SG", bendera: "🇸🇬", jalur: "Runner-up" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(window.pDataSG.m8.menang, "mpl", "SG");
    } else {
        console.error("[GUARD M7] Region SG DI-SKIP dari kualifikasi M7 -- data Grand Final belum lengkap.", window.pDataSG);
    }

    // 5 region yang runner-up-nya DAPET Wild Card: KH, MM, MENA, TR, EECA
    let regionRunnerUpDapatWC = ["KH", "MM", "MENA", "TR", "EECA"];
    regionRunnerUpDapatWC.forEach(kode => {
        let pDataR = window["pData" + kode];
        if (!pDataR || !pDataR.m8 || !pDataR.m8.menang) {
            console.error(`[GUARD M7] Region ${kode} DI-SKIP dari kualifikasi M7 -- data Grand Final belum lengkap.`, pDataR);
            return;
        }
        let meta = (typeof REGION_BARU_META !== "undefined" && REGION_BARU_META[kode]) ? REGION_BARU_META[kode] : { bendera: "🏳️" };
        mainEvent.push({ tim: pDataR.m8.menang, asal: kode, bendera: meta.bendera, jalur: "Champion" });
        wildCard.push({ tim: pDataR.m8.kalah, asal: kode, bendera: meta.bendera, jalur: "Runner-up" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(pDataR.m8.menang, "mpl", kode);
    });

    // EA & AM: Champion -> Main Event SAJA, runner-up TIDAK dapat slot apapun
    let regionChampionOnly = ["EA", "AM"];
    regionChampionOnly.forEach(kode => {
        let pDataR = window["pData" + kode];
        if (!pDataR || !pDataR.m8 || !pDataR.m8.menang) {
            console.error(`[GUARD M7] Region ${kode} DI-SKIP dari kualifikasi M7 -- data Grand Final belum lengkap.`, pDataR);
            return;
        }
        let meta = (typeof REGION_BARU_META !== "undefined" && REGION_BARU_META[kode]) ? REGION_BARU_META[kode] : { bendera: "🏳️" };
        mainEvent.push({ tim: pDataR.m8.menang, asal: kode, bendera: meta.bendera, jalur: "Champion" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(pDataR.m8.menang, "mpl", kode);
    });

    // India: HANYA Champion -> Wild Card (BEDA dari MSC, sesuai dokumen M7)
    if (window.pDataIN && window.pDataIN.m8 && window.pDataIN.m8.menang) {
        wildCard.push({ tim: window.pDataIN.m8.menang, asal: "IN", bendera: "🇮🇳", jalur: "Champion" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(window.pDataIN.m8.menang, "mpl", "IN");
    } else {
        console.error("[GUARD M7] Region IN DI-SKIP dari kualifikasi M7 -- data Grand Final belum lengkap.", window.pDataIN);
    }

    // Western Europe: HANYA Champion -> Wild Card, gak ada slot Main Event & gak ada wildcard runner-up
    if (window.pDataWEU && window.pDataWEU.m8 && window.pDataWEU.m8.menang) {
        wildCard.push({ tim: window.pDataWEU.m8.menang, asal: "WEU", bendera: "🌍", jalur: "Champion" });
        if (typeof catatTrofiPemain === "function") catatTrofiPemain(window.pDataWEU.m8.menang, "mpl", "WEU");
    } else {
        console.error("[GUARD M7] Region WEU DI-SKIP dari kualifikasi M7 -- data Grand Final belum lengkap.", window.pDataWEU);
    }

    return { mainEvent, wildCard };
}

// [NEW] Diagnostik status tiap region -- sama kayak versi MSC, dipakai
// biar status region langsung kebaca di pesan error tanpa DevTools.
function diagnostikRegionM7() {
    let baris = [];
    let cekID = window.pData || (typeof pData !== "undefined" ? pData : null);
    baris.push(`ID:${cekID && cekID.m8 && cekID.m8.menang ? "OK" : "KOSONG"}`);
    ["PH", "MY", "SG"].forEach(k => {
        let d = window["pData" + k];
        baris.push(`${k}:${d && d.m8 && d.m8.menang ? "OK" : "KOSONG"}`);
    });
    ["KH", "MM", "MENA", "TR", "EECA", "EA", "AM", "IN", "WEU"].forEach(k => {
        let d = window["pData" + k];
        baris.push(`${k}:${d && d.m8 && d.m8.menang ? "OK" : "KOSONG"}`);
    });
    return baris.join(", ");
}
window.diagnostikRegionM7 = diagnostikRegionM7;
window.tentukanKualifikasiM7 = tentukanKualifikasiM7;

// ==========================================================
// FASE M7-2: WILD CARD ENGINE
// ==========================================================
// 8 tim -> 2 grup of 4 (RANDOM DRAW) -> Single Round Robin BO3
// (3 hari, 4 match/hari) -> Qualification Match (Semifinal BO5,
// Grup A#1 vs Grup B#2 & Grup B#1 vs Grup A#2) -> 2 tim lolos ke
// Main Event.
// ==========================================================

// Round robin 4 tim (circle method) -> 3 ronde x 2 pasang = 6 match unik
function buatJadwalRoundRobin4M7(timArr) {
    let arr = [...timArr];
    let semuaRonde = [];
    for (let r = 0; r < 3; r++) {
        semuaRonde.push([[arr[0], arr[3]], [arr[1], arr[2]]]);
        let last = arr.pop();
        arr.splice(1, 0, last);
    }
    return semuaRonde;
}

// Klasemen grup Wild Card dgn tiebreak SESUAI URUTAN DOKUMEN:
// 1. Head-to-Head, 2. Game Difference, 3. Game Won, 4. Random Draw
function hitungKlasemenWCM7(timArr, hasilPertandingan) {
    let stats = {};
    timArr.forEach(t => { stats[t.nama] = { tim: t, menang: 0, kalah: 0, gameMenang: 0, gameKalah: 0, h2h: {} }; });
    hasilPertandingan.forEach(m => {
        if (!m || !m.menang) return;
        let skorMenang = (m.menang.nama === m.home.nama) ? m.skorHome : m.skorAway;
        let skorKalah = (m.menang.nama === m.home.nama) ? m.skorAway : m.skorHome;
        stats[m.menang.nama].menang++;
        stats[m.kalah.nama].kalah++;
        stats[m.menang.nama].gameMenang += skorMenang;
        stats[m.menang.nama].gameKalah += skorKalah;
        stats[m.kalah.nama].gameMenang += skorKalah;
        stats[m.kalah.nama].gameKalah += skorMenang;
        stats[m.menang.nama].h2h[m.kalah.nama] = (stats[m.menang.nama].h2h[m.kalah.nama] || 0) + 1;
    });
    let arr = Object.values(stats);
    arr.sort((a, b) => {
        if (b.menang !== a.menang) return b.menang - a.menang; // (poin sama nilainya sama kayak jumlah menang di single RR)
        let h2hDiff = (a.h2h[b.tim.nama] || 0) - (b.h2h[a.tim.nama] || 0);
        if (h2hDiff !== 0) return -h2hDiff;
        let gdA = a.gameMenang - a.gameKalah, gdB = b.gameMenang - b.gameKalah;
        if (gdB !== gdA) return gdB - gdA;
        if (b.gameMenang !== a.gameMenang) return b.gameMenang - a.gameMenang;
        return Math.random() - 0.5; // Random Draw (tiebreak terakhir)
    });
    return arr.map(s => s.tim);
}

function initWildCardM7(daftarTimWC) {
    if (!daftarTimWC || daftarTimWC.length !== 8) {
        console.error("initWildCardM7: butuh tepat 8 tim, dapet", daftarTimWC ? daftarTimWC.length : 0);
        return null;
    }
    let acak = acakArrayM7(daftarTimWC.map(x => x.tim || x));
    let groupA = acak.slice(0, 4);
    let groupB = acak.slice(4, 8);

    window.wildCardM7Data = {
        groupA, groupB,
        jadwalA: buatJadwalRoundRobin4M7(groupA),
        jadwalB: buatJadwalRoundRobin4M7(groupB),
        hasilA: [], hasilB: [],
        klasemenA: null, klasemenB: null,
        semifinal: null,
        golonganM7: null, // [pemenang SF1, pemenang SF2] -> 2 tim ke Main Event
        fase: 0 // 0=belum, 1=day1, 2=day2, 3=day3(grup kelar), 4=qualification match kelar
    };
    return window.wildCardM7Data;
}
window.initWildCardM7 = initWildCardM7;

// hariKe: 1/2/3 -> jalankan 1 ronde round-robin (index hariKe-1)
function jalankanRoundGrupWCM7(hariKe) {
    let wc = window.wildCardM7Data;
    if (!wc) return null;
    let idx = hariKe - 1;

    wc.jadwalA[idx].forEach(([home, away]) => {
        let hasil = simulasiGlobalMatch(home, away, 3, "m7_wc_grup");
        wc.hasilA.push(hasil);
    });
    wc.jadwalB[idx].forEach(([home, away]) => {
        let hasil = simulasiGlobalMatch(home, away, 3, "m7_wc_grup");
        wc.hasilB.push(hasil);
    });

    if (hariKe === 3) {
        wc.klasemenA = hitungKlasemenWCM7(wc.groupA, wc.hasilA);
        wc.klasemenB = hitungKlasemenWCM7(wc.groupB, wc.hasilB);
        wc.fase = 3;

        // [FIX] Reveal pairing Qualification Match (belum disimulasikan)
        // sebagai side-effect Day 3, biar match-nya kelihatan dulu (VS)
        // sebelum hasilnya keluar di hari berikutnya -- gak nambah tick.
        wc.semifinal = {
            sf1: { home: wc.klasemenA[0], away: wc.klasemenB[1] }, // Juara A vs RU B
            sf2: { home: wc.klasemenB[0], away: wc.klasemenA[1] }  // Juara B vs RU A
        };

        if (typeof tambahBerita === "function") {
            tambahBerita(`🎮 Wild Card Group Stage M${edisiMSeries} selesai. <span>${wc.klasemenA[0].nama}</span> (Grup A) & <span>${wc.klasemenB[0].nama}</span> (Grup B) juara grup, lanjut ke Qualification Match.`);
        }
    } else {
        wc.fase = hariKe;
    }
    return wc;
}
window.jalankanRoundGrupWCM7 = jalankanRoundGrupWCM7;

// Qualification Match (6 Januari): Juara Grup A vs Runner-up Grup B (BO5),
// Juara Grup B vs Runner-up Grup A (BO5). Pemenang kedua match lolos
// ke Main Event. Tidak ada Grand Final Wild Card.
function jalankanQualificationWCM7() {
    let wc = window.wildCardM7Data;
    if (!wc || !wc.semifinal) return null;

    // Pairing-nya udah di-reveal sebelumnya (side-effect Day 3)
    let sf1 = simulasiGlobalMatch(wc.semifinal.sf1.home, wc.semifinal.sf1.away, 5, "m7_wc_qualif");
    let sf2 = simulasiGlobalMatch(wc.semifinal.sf2.home, wc.semifinal.sf2.away, 5, "m7_wc_qualif");

    wc.semifinal = { sf1, sf2 };
    wc.golonganM7 = [sf1.menang, sf2.menang];
    wc.fase = 4;

    if (typeof tambahBerita === "function") {
        tambahBerita(`🎟️ Wild Card M${edisiMSeries} Selesai. <span>${sf1.menang.nama}</span> & <span>${sf2.menang.nama}</span> resmi lolos ke Main Event, gabung 14 tim direct qualifier.`);
    }
    return wc;
}
window.jalankanQualificationWCM7 = jalankanQualificationWCM7;

// ==========================================================
// FASE M7-3: SWISS STAGE ENGINE (16 tim)
// ==========================================================
// Round 1: random draw penuh, 8 match BO1.
// Round 2: bracket 1-0 (BO1) & bracket 0-1 (BO1), masing2 4 match.
// Round 3a (12 Jan): bracket 2-0 (BO3, 2 match) & bracket 1-1 (BO1, 4 match).
// Round 3b (13 Jan): bracket 0-2 (BO3, 2 match).
// Round 4 (15 Jan): bracket 2-1 (BO3, 3 match) & bracket 1-2 (BO3, 3 match).
// Round 5 (17 Jan): bracket 2-2 (BO3, 3 match).
// Qualified: rekor 3-0 / 3-1 / 3-2 (total 8 tim). Eliminated: rekor 0-3/1-3/2-3.
//
// Pairing dalam 1 bracket SELALU coba hindari rematch dulu (best-effort,
// nyerah cuma kalau beneran gak mungkin lagi -- sesuai instruksi dokumen
// "Hindari rematch selama masih memungkinkan").
// ==========================================================

function pasangkanHindariRematchM7(timArr, riwayat) {
    // [FIX CRASH] Bracket ganjil (secara matematis SEHARUSNYA gak pernah
    // kejadian -- tiap ronde BO1 selalu hasilin jumlah menang & kalah yang
    // sama -- tapi kejadian di lapangan, kemungkinan akar masalah di hulu
    // seperti jumlah tim kualifikasi M7 yang gak genap 16). Sebelumnya tim
    // sisa dipasangin sama `undefined` dan bikin crash "Cannot read
    // properties of undefined (reading 'nama')" yang macetin seluruh
    // proses "Hari Berikutnya". Sekarang dikasih BYE (menang otomatis
    // ronde ini) -- penanganan standar bracket ganjil di turnamen beneran.
    let arrKerja = timArr;
    if (timArr.length % 2 !== 0) {
        arrKerja = [...timArr];
        let timBye = arrKerja.pop();
        timBye.w++;
        console.error(`[GUARD M7] Bracket ganjil (${timArr.length} tim): '${timBye.ref ? timBye.ref.nama : "?"}' dapet BYE (menang otomatis) ronde ini.`);
    }

    let terbaik = null;
    for (let percobaan = 0; percobaan < 300; percobaan++) {
        let acak = acakArrayM7(arrKerja);
        let sisa = [...acak];
        let pasangan = [];
        while (sisa.length > 0) {
            let a = sisa.shift();
            // [FIX LOGIC] Sebelumnya baca `a.nama` -- padahal tim di sini
            // objek wrapper Swiss ({ ref, w, l }), nama aslinya ada di
            // `a.ref.nama`. Akibatnya `riwayat[a.nama]` SELALU undefined,
            // jadi fitur "hindari rematch" gak pernah efektif dari awal
            // (diem-diem gagal, gak crash, makanya gak ketauan).
            // [FIX] Sama kayak bug di catatHasilSwissM7 -- riwayat[nama]
            // abis load-save bisa jadi objek biasa yang TRUTHY (bukan
            // undefined), jadi fallback "||" gak pernah kepicu. Dicek
            // eksplisit pake instanceof biar .has() gak crash.
            let riwayatMain = riwayat[a.ref.nama];
            let sudahMain = (riwayatMain instanceof Set) ? riwayatMain : new Set();
            let idx = sisa.findIndex(b => !sudahMain.has(b.ref.nama));
            if (idx === -1) idx = 0; // terpaksa rematch (bracket kehabisan opsi)
            let b = sisa.splice(idx, 1)[0];
            pasangan.push([a, b]);
        }
        let adaRematch = pasangan.some(([a, b]) => {
            let r = riwayat[a.ref.nama];
            return (r instanceof Set) ? r.has(b.ref.nama) : false;
        });
        if (!adaRematch) return pasangan;
        if (!terbaik) terbaik = pasangan;
    }
    return terbaik; // best-effort kalau semua percobaan tetap ketemu rematch
}

function catatHasilSwissM7(sw, hasil) {
    let tState = nama => sw.teams.find(t => t.ref.nama === nama);
    let menang = tState(hasil.menang.nama);
    let kalah = tState(hasil.kalah.nama);
    menang.w++;
    kalah.l++;
    // [FIX] Set gak bisa selamat lewat JSON save/load -- JSON.stringify(Set)
    // hasilnya "{}" (ISINYA HILANG TOTAL, beda kasus sama Date yang cuma
    // butuh di-convert ulang). Abis load, sw.riwayat[nama] jadi OBJEK BIASA
    // yang TRUTHY (bukan undefined), jadi fallback "|| new Set()" gak
    // pernah kepicu -- objek rusak itu KEPAKE, dan .add() crash karena objek
    // biasa gak punya method itu. Sekarang dicek eksplisit pake instanceof.
    if (!(sw.riwayat[menang.ref.nama] instanceof Set)) sw.riwayat[menang.ref.nama] = new Set();
    if (!(sw.riwayat[kalah.ref.nama] instanceof Set)) sw.riwayat[kalah.ref.nama] = new Set();
    sw.riwayat[menang.ref.nama].add(kalah.ref.nama);
    sw.riwayat[kalah.ref.nama].add(menang.ref.nama);
}

function sapuStatusSwissM7(sw) {
    sw.teams.forEach(t => {
        if (t.w === 3 && !sw.qualified.includes(t)) sw.qualified.push(t);
        if (t.l === 3 && !sw.eliminated.includes(t)) sw.eliminated.push(t);
    });
}

function initSwissM7(tim16) {
    if (!tim16 || tim16.length !== 16) {
        console.error("initSwissM7: butuh tepat 16 tim, dapet", tim16 ? tim16.length : 0);
        return null;
    }
    window.swissM7Data = {
        teams: tim16.map(t => ({ ref: t, w: 0, l: 0 })),
        riwayat: {},
        rounds: {},
        qualified: [],
        eliminated: [],
        fase: 0
    };

    // [FIX] Reveal pairing Round 1 (belum disimulasikan) sebagai bagian
    // dari init, biar match-nya kelihatan dulu (VS) sebelum hasilnya
    // keluar di hari berikutnya.
    let sw = window.swissM7Data;
    let pasangan = pasangkanHindariRematchM7(sw.teams, sw.riwayat);
    sw.rounds.r1 = pasangan.map(([a, b]) => ({ home: a.ref, away: b.ref }));

    return window.swissM7Data;
}
window.initSwissM7 = initSwissM7;

// Jalankan 1 bracket (array team-state) dgn best-of tertentu, return hasil array
function jalankanBracketSwissM7(sw, bracketTeams, bestOf) {
    if (!bracketTeams || bracketTeams.length === 0) return [];
    let pasangan = pasangkanHindariRematchM7(bracketTeams, sw.riwayat);
    return pasangan.map(([a, b]) => {
        let hasil = simulasiGlobalMatch(a.ref, b.ref, bestOf, "m7_swiss");
        catatHasilSwissM7(sw, hasil);
        return hasil;
    });
}

function jalankanSwissRound1M7() {
    let sw = window.swissM7Data;
    // Pairing r1 udah di-reveal pas init -- tinggal disimulasiin.
    let hasil = sw.rounds.r1.map(p => {
        let r = simulasiGlobalMatch(p.home, p.away, 1, "m7_swiss_r1");
        catatHasilSwissM7(sw, r);
        return r;
    });
    sw.rounds.r1 = hasil;
    sw.fase = 1;

    // Reveal pairing Round 2 (belum disimulasikan)
    let b10 = sw.teams.filter(t => t.w === 1 && t.l === 0);
    let b01 = sw.teams.filter(t => t.w === 0 && t.l === 1);
    sw.rounds.r2 = {
        b10: pasangkanHindariRematchM7(b10, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref })),
        b01: pasangkanHindariRematchM7(b01, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref }))
    };

    if (typeof tambahBerita === "function") tambahBerita(`🇸 Swiss Stage M${edisiMSeries} Round 1 Selesai. Drawing acak penuh, 8 match BO1.`);
    return sw;
}
window.jalankanSwissRound1M7 = jalankanSwissRound1M7;

function jalankanSwissRound2M7() {
    let sw = window.swissM7Data;
    sw.rounds.r2.b10 = sw.rounds.r2.b10.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 1, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sw.rounds.r2.b01 = sw.rounds.r2.b01.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 1, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sw.fase = 2;

    // Reveal pairing Round 3a (belum disimulasikan)
    let b20 = sw.teams.filter(t => t.w === 2 && t.l === 0);
    let b11 = sw.teams.filter(t => t.w === 1 && t.l === 1);
    sw.rounds.r3a = {
        b20: pasangkanHindariRematchM7(b20, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref })),
        b11: pasangkanHindariRematchM7(b11, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref }))
    };

    if (typeof tambahBerita === "function") tambahBerita(`🇸 Swiss Stage M${edisiMSeries} Round 2 Selesai.`);
    return sw;
}
window.jalankanSwissRound2M7 = jalankanSwissRound2M7;

function jalankanSwissRound3aM7() {
    let sw = window.swissM7Data;
    sw.rounds.r3a.b20 = sw.rounds.r3a.b20.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 3, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sw.rounds.r3a.b11 = sw.rounds.r3a.b11.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 1, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sapuStatusSwissM7(sw);
    sw.fase = 3;

    // Reveal pairing Round 3b (belum disimulasikan)
    let b02 = sw.teams.filter(t => t.w === 0 && t.l === 2);
    sw.rounds.r3b = { b02: pasangkanHindariRematchM7(b02, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref })) };

    if (typeof tambahBerita === "function") tambahBerita(`🇸 Swiss Stage M${edisiMSeries} Round 3 (Hari 1) Selesai. Bracket 2-0 & 1-1.`);
    return sw;
}
window.jalankanSwissRound3aM7 = jalankanSwissRound3aM7;

function jalankanSwissRound3bM7() {
    let sw = window.swissM7Data;
    sw.rounds.r3b.b02 = sw.rounds.r3b.b02.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 3, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sapuStatusSwissM7(sw);
    sw.fase = 4;

    // Reveal pairing Round 4 (belum disimulasikan)
    let b21 = sw.teams.filter(t => t.w === 2 && t.l === 1);
    let b12 = sw.teams.filter(t => t.w === 1 && t.l === 2);
    sw.rounds.r4 = {
        b21: pasangkanHindariRematchM7(b21, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref })),
        b12: pasangkanHindariRematchM7(b12, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref }))
    };

    if (typeof tambahBerita === "function") tambahBerita(`🇸 Swiss Stage M${edisiMSeries} Round 3 (Hari 2) Selesai. Bracket 0-2 -- fase eliminasi pertama kelar.`);
    return sw;
}
window.jalankanSwissRound3bM7 = jalankanSwissRound3bM7;

function jalankanSwissRound4M7() {
    let sw = window.swissM7Data;
    sw.rounds.r4.b21 = sw.rounds.r4.b21.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 3, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sw.rounds.r4.b12 = sw.rounds.r4.b12.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 3, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sapuStatusSwissM7(sw);
    sw.fase = 5;

    // Reveal pairing Round 5 (belum disimulasikan)
    let b22 = sw.teams.filter(t => t.w === 2 && t.l === 2);
    sw.rounds.r5 = { b22: pasangkanHindariRematchM7(b22, sw.riwayat).map(([a, b]) => ({ home: a.ref, away: b.ref })) };

    if (typeof tambahBerita === "function") tambahBerita(`🇸 Swiss Stage M${edisiMSeries} Round 4 Selesai. Bracket 2-1 & 1-2.`);
    return sw;
}
window.jalankanSwissRound4M7 = jalankanSwissRound4M7;

function jalankanSwissRound5M7() {
    let sw = window.swissM7Data;
    sw.rounds.r5.b22 = sw.rounds.r5.b22.map(p => { let r = simulasiGlobalMatch(p.home, p.away, 3, "m7_swiss"); catatHasilSwissM7(sw, r); return r; });
    sapuStatusSwissM7(sw);
    sw.fase = 6;
    if (typeof tambahBerita === "function") {
        let namaLolos = sw.qualified.map(t => t.ref.nama).join(", ");
        tambahBerita(`🏆 Swiss Stage M${edisiMSeries} Selesai. 8 tim lolos ke Knockout Stage: ${namaLolos}.`);
    }
    return sw;
}
window.jalankanSwissRound5M7 = jalankanSwissRound5M7;

// ==========================================================
// FASE M7-4: KNOCKOUT STAGE (Double Elimination, 8 tim)
// ==========================================================
// UBQF(4,BO3) -> UBSF(2,BO5)+LBR1(2,BO5) -> UBFinal(1,BO5)+LBR2(2,BO5)
// -> LBR3/LB-Semifinal(1,BO5) -> LB Final(1,BO5) -> Grand Final(1,BO7,
// TANPA bracket reset -- pemenang GF langsung juara, gak peduli
// datang dari Upper atau Lower Bracket).
// ==========================================================
function initKnockoutM7(delapanTimSwiss) {
    if (!delapanTimSwiss || delapanTimSwiss.length !== 8) {
        console.error("initKnockoutM7: butuh tepat 8 tim, dapet", delapanTimSwiss ? delapanTimSwiss.length : 0);
        return null;
    }
    let acak = acakArrayM7(delapanTimSwiss.map(t => t.ref || t));
    window.knockoutM7Data = {
        ubqf: {
            m1: { home: acak[0], away: acak[1] }, m2: { home: acak[2], away: acak[3] },
            m3: { home: acak[4], away: acak[5] }, m4: { home: acak[6], away: acak[7] }
        },
        ubsf: null, ubfinal: null,
        lbr1: null, lbr2: null, lbr3: null, lbfinal: null,
        grandFinal: null,
        juaraM7: null, runnerUpM7: null,
        fase: 0 // 0..8, 8 = juara ditentukan
    };
    return window.knockoutM7Data;
}
window.initKnockoutM7 = initKnockoutM7;

function jalankanUBQF_M7() {
    let kd = window.knockoutM7Data;
    if (!kd) return null;
    kd.ubqf.m1 = simulasiGlobalMatch(kd.ubqf.m1.home, kd.ubqf.m1.away, 3, "m7_ko_ubqf");
    kd.ubqf.m2 = simulasiGlobalMatch(kd.ubqf.m2.home, kd.ubqf.m2.away, 3, "m7_ko_ubqf");
    kd.ubqf.m3 = simulasiGlobalMatch(kd.ubqf.m3.home, kd.ubqf.m3.away, 3, "m7_ko_ubqf");
    kd.ubqf.m4 = simulasiGlobalMatch(kd.ubqf.m4.home, kd.ubqf.m4.away, 3, "m7_ko_ubqf");
    kd.ubsf = {
        m1: { home: kd.ubqf.m1.menang, away: kd.ubqf.m2.menang },
        m2: { home: kd.ubqf.m3.menang, away: kd.ubqf.m4.menang }
    };
    kd.lbr1 = {
        m1: { home: kd.ubqf.m1.kalah, away: kd.ubqf.m2.kalah },
        m2: { home: kd.ubqf.m3.kalah, away: kd.ubqf.m4.kalah }
    };
    kd.fase = 1;
    if (typeof tambahBerita === "function") tambahBerita(`⚔️ Upper Bracket Quarter Final M${edisiMSeries} Selesai.`);
    return kd;
}
window.jalankanUBQF_M7 = jalankanUBQF_M7;

function jalankanLBR1_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.lbr1) return null;
    kd.lbr1.m1 = simulasiGlobalMatch(kd.lbr1.m1.home, kd.lbr1.m1.away, 5, "m7_ko_lbr1");
    kd.lbr1.m2 = simulasiGlobalMatch(kd.lbr1.m2.home, kd.lbr1.m2.away, 5, "m7_ko_lbr1");
    kd.fase = 2;
    if (typeof tambahBerita === "function") tambahBerita(`⚔️ Lower Bracket Round 1 M${edisiMSeries} Selesai.`);
    return kd;
}
window.jalankanLBR1_M7 = jalankanLBR1_M7;

function jalankanUBSF_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.ubsf) return null;
    kd.ubsf.m1 = simulasiGlobalMatch(kd.ubsf.m1.home, kd.ubsf.m1.away, 5, "m7_ko_ubsf");
    kd.ubsf.m2 = simulasiGlobalMatch(kd.ubsf.m2.home, kd.ubsf.m2.away, 5, "m7_ko_ubsf");
    kd.ubfinal = { home: kd.ubsf.m1.menang, away: kd.ubsf.m2.menang };
    // Cross pairing biar gak langsung rematch sesama pasangan UBQF asal
    kd.lbr2 = {
        m1: { home: kd.lbr1.m1.menang, away: kd.ubsf.m2.kalah },
        m2: { home: kd.lbr1.m2.menang, away: kd.ubsf.m1.kalah }
    };
    kd.fase = 3;
    if (typeof tambahBerita === "function") tambahBerita(`🔥 Upper Bracket Semi Final M${edisiMSeries} Selesai.`);
    return kd;
}
window.jalankanUBSF_M7 = jalankanUBSF_M7;

function jalankanLBR2_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.lbr2) return null;
    kd.lbr2.m1 = simulasiGlobalMatch(kd.lbr2.m1.home, kd.lbr2.m1.away, 5, "m7_ko_lbr2");
    kd.lbr2.m2 = simulasiGlobalMatch(kd.lbr2.m2.home, kd.lbr2.m2.away, 5, "m7_ko_lbr2");
    kd.fase = 4;
    if (typeof tambahBerita === "function") tambahBerita(`⚔️ Lower Bracket Round 2 M${edisiMSeries} Selesai.`);
    return kd;
}
window.jalankanLBR2_M7 = jalankanLBR2_M7;

function jalankanUBFinal_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.ubfinal) return null;
    kd.ubfinal = simulasiGlobalMatch(kd.ubfinal.home, kd.ubfinal.away, 5, "m7_ko_ubfinal");
    kd.lbr3 = { home: kd.lbr2.m1.menang, away: kd.lbr2.m2.menang };
    kd.fase = 5;
    if (typeof tambahBerita === "function") tambahBerita(`🔥 Upper Bracket Final M${edisiMSeries} Selesai. <span>${kd.ubfinal.menang.nama}</span> langsung ke Grand Final.`);
    return kd;
}
window.jalankanUBFinal_M7 = jalankanUBFinal_M7;

function jalankanLBR3_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.lbr3) return null;
    kd.lbr3 = simulasiGlobalMatch(kd.lbr3.home, kd.lbr3.away, 5, "m7_ko_lbr3");
    kd.lbfinal = { home: kd.lbr3.menang, away: kd.ubfinal.kalah };
    kd.fase = 6;
    if (typeof tambahBerita === "function") tambahBerita(`⚔️ Lower Bracket Semi Final M${edisiMSeries} Selesai.`);
    return kd;
}
window.jalankanLBR3_M7 = jalankanLBR3_M7;

function jalankanLBFinal_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.lbfinal) return null;
    kd.lbfinal = simulasiGlobalMatch(kd.lbfinal.home, kd.lbfinal.away, 5, "m7_ko_lbfinal");
    kd.grandFinal = { home: kd.ubfinal.menang, away: kd.lbfinal.menang };
    kd.fase = 7;
    if (typeof tambahBerita === "function") tambahBerita(`🥉 Lower Bracket Final M${edisiMSeries} Selesai. <span>${kd.lbfinal.menang.nama}</span> lolos ke Grand Final.`);
    return kd;
}
window.jalankanLBFinal_M7 = jalankanLBFinal_M7;

function jalankanGrandFinal_M7() {
    let kd = window.knockoutM7Data;
    if (!kd || !kd.grandFinal) return null;
    kd.grandFinal = simulasiGlobalMatch(kd.grandFinal.home, kd.grandFinal.away, 7, "m7_ko_gf");
    kd.juaraM7 = kd.grandFinal.menang;
    kd.runnerUpM7 = kd.grandFinal.kalah;
    kd.fase = 8;
    if (typeof tambahBerita === "function") {
        tambahBerita(`🏆 Juara M${edisiMSeries} World Championship: <span>${kd.juaraM7.nama}</span>. Runner-up: <b>${kd.runnerUpM7.nama}</b>.`);
    }
    if (typeof window.prosesReputasi === "function") window.prosesReputasi(kd.juaraM7.nama, "JUARA_MSERIES");
    if (typeof catatTrofiPemain === "function") catatTrofiPemain(kd.juaraM7, "mSeries");
    return kd;
}
window.jalankanGrandFinal_M7 = jalankanGrandFinal_M7;

// ==========================================================
// FASE M7-5: DISTRIBUSI HADIAH (PRIZE POOL)
// ==========================================================
// Nominal ASUMSI (dokumen gak nyebut angka pasti) -- di atas skala
// MSC karena M7 World Championship = turnamen akhir tahun paling
// bergengsi. Bisa gampang diubah di objek `prize` di bawah.
// ==========================================================
function distribusiHadiahM7() {
    const prize = {
        juara1: 2500000000, juara2: 1200000000,
        tempat3: 700000000, tempat4: 500000000,
        tempat5_6: 350000000, tempat7_8: 250000000,
        swissEliminated: 150000000, wildCardEliminated: 75000000
    };
    const rep = {
        juara1: 20, juara2: 12, tempat3: 8, tempat4: 6,
        tempat5_6: 4, tempat7_8: 3, swissEliminated: 2, wildCardEliminated: 1
    };
    let bayar = (tim, nominal, bonusRep) => {
        if (!tim || tim.nama === timPlayer) return;
        tim.kas = (tim.kas || 0) + nominal;
        if (bonusRep) tim.reputasi = Math.min(100, (tim.reputasi || 50) + bonusRep);
    };

    let kd = window.knockoutM7Data;
    if (kd) {
        bayar(kd.juaraM7, prize.juara1, rep.juara1);
        bayar(kd.runnerUpM7, prize.juara2, rep.juara2);
        bayar(kd.lbfinal ? kd.lbfinal.kalah : null, prize.tempat3, rep.tempat3);
        bayar(kd.lbr3 ? kd.lbr3.kalah : null, prize.tempat4, rep.tempat4);
        if (kd.lbr2) {
            bayar(kd.lbr2.m1.kalah, prize.tempat5_6, rep.tempat5_6);
            bayar(kd.lbr2.m2.kalah, prize.tempat5_6, rep.tempat5_6);
        }
        if (kd.lbr1) {
            bayar(kd.lbr1.m1.kalah, prize.tempat7_8, rep.tempat7_8);
            bayar(kd.lbr1.m2.kalah, prize.tempat7_8, rep.tempat7_8);
        }
    }

    let sw = window.swissM7Data;
    if (sw) {
        sw.eliminated.forEach(t => bayar(t.ref, prize.swissEliminated, rep.swissEliminated));
    }

    let wc = window.wildCardM7Data;
    if (wc && wc.golonganM7) {
        let namaLolos = wc.golonganM7.map(t => t.nama);
        [...wc.groupA, ...wc.groupB].forEach(t => {
            if (!namaLolos.includes(t.nama)) bayar(t, prize.wildCardEliminated, rep.wildCardEliminated);
        });
    }
}
window.distribusiHadiahM7 = distribusiHadiahM7;

// ----------------------------------------------------------
// Dipanggil sekali setelah Grand Final selesai -- hadiah, buka
// transfer, kembali ke alur normal (persis pola MSC x EWC).
// ----------------------------------------------------------
function selesaikanM7() {
    let kd = window.knockoutM7Data;
    let juaraM7 = kd.juaraM7;

    if (juaraM7.nama === timPlayer) {
        kasTim += 2500000000;
        if (typeof catatKas === "function") catatKas("MASUK", 2500000000, `Prize Pool Juara M${edisiMSeries} World Championship S${musimKe} (GLOBAL)`);
        reputasiManajer += 100;
        // [WIRING FIX] Bonus fanbase.jumlah/moral dari Juara M-Series
        // sebelumnya gak pernah ke-trigger karena prosesFanbaseEventBesar()
        // dead code.
        if (typeof window.hookFanbaseEventBesar === "function") {
            window.hookFanbaseEventBesar("JUARA_MSERIES");
        }
        // [FIX] Sama kayak di selesaikanMSCEwc() -- bonus juara sponsor
        // (field `bonusJuara`, di-DOBEL khusus buat World Championship,
        // sesuai kode lama) gak pernah cair sama sekali karena kodenya
        // cuma nempel di blok M-Series LAMA yang udah gak jalan lagi.
        if (window.sponsorTim) {
            let st = window.sponsorTim;
            [st.utama, st.minor1, st.minor2].forEach(sp => {
                if (sp && sp.bonusJuara) {
                    let bonusDouble = sp.bonusJuara * 2;
                    kasTim += bonusDouble;
                    if (typeof catatKas === "function") catatKas("MASUK", bonusDouble, `Bonus Spesial M${edisiMSeries} Sponsor: ${sp.nama}`);
                    if (typeof bukaModal === "function") {
                        bukaModal("🏆 JACKPOT SPONSOR CAIR!", `<b>${sp.nama}</b> memberikan bonus spesial M${edisiMSeries} sebesar <b>Rp ${(bonusDouble/1000000).toFixed(1)} Jt</b>!`, "#C9971F");
                    }
                }
            });
        }
    }
    distribusiHadiahM7();

    if (typeof bankRiwayatJuara !== "undefined") {
        bankRiwayatJuara.push({ season: musimKe, tahun: kalenderGame.getFullYear(), tim: juaraM7, negara: `🌐 GLOBAL (M${edisiMSeries})` });
        if (typeof gprPerkayaEntryTerakhir === "function") gprPerkayaEntryTerakhir(null, "MSERIES", kd.runnerUpM7);
        if (typeof window.gprUpdateReigningMSeries === "function") {
            window.gprUpdateReigningMSeries(juaraM7.nama, kd.runnerUpM7 ? kd.runnerUpM7.nama : null);
        }
        if (typeof window.gprHitungRanking === "function") window.gprHitungRanking(true);
    }
    if (typeof window.bukaModalJuaraDunia === "function") {
        window.bukaModalJuaraDunia(juaraM7.nama, `Juara M${edisiMSeries} World Championship`, "world-gold");
    } else if (typeof bukaModal === "function") {
        bukaModal("🏆 JUARA DUNIA! 🏆", `<b>${juaraM7.nama}</b> berhasil memenangkan M${edisiMSeries} World Championship!`, "#C9971F");
    }

    statusGame = "JEDA_TRANSFER";
    hariJeda = (typeof hitungHariJedaTransferPascaTurnamen === "function") ? hitungHariJedaTransferPascaTurnamen() : 30; // [FIX] calendar-driven, bukan fix 30 hari lagi
    transferBuka = true;
    // [FIX] Isi pasar 10 pemain + 10 staff baru tiap bursa dibuka.
    if (typeof generatePemainDanStaffBaru === "function") generatePemainDanStaffBaru(10, 5);
    if (typeof tambahBerita === "function") {
        tambahBerita(`🔓 <b>BURSA Transfer DIBUKA!</b> M${edisiMSeries} World Championship S${musimKe} selesai. Transfer window resmi dibuka selama 30 hari.`);
    }
    window.m7State = null; // bersihin state, siap buat musim genap berikutnya
}
window.selesaikanM7 = selesaikanM7;

// ----------------------------------------------------------
// ORKESTRATOR UTAMA -- dipanggil tiap hari kalender selama window
// M7 (Wild Card s/d Grand Final). Sama persis polanya kayak
// jalankanTickMSCEWC(): catch-up, 1 langkah per hari, gerbang
// dependency ketat antar tahap, otomatis nyusul kalau ada hari
// kelewat (reload/skip/dll).
// ----------------------------------------------------------
function jalankanTickM7() {
    let tabelTgl = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
    let st = window.m7State;
    if (!tabelTgl || !st) return;
    let hari = kalenderGame;

    // -- WILD CARD --
    if (hari >= tabelTgl.wildCardMulai) {
        if (!st.wcMulai) {
            // [FIX] Sama kayak celah yang ketemu di sistem MSC (musim
            // ganjil): initWildCardM7() bisa gagal SUNYI (return null
            // kalau jumlah tim kualifikasi != 8) tapi sebelumnya kode di
            // bawah TETAP nandain "st.wcMulai = true" seolah berhasil,
            // bikin game macet permanen di Wild Card TANPA popup error.
            // Sekarang di-throw kalau gagal, biar ketangkep Error Catcher.
            let hasilInit = initWildCardM7(st.kualifikasi.wildCard);
            if (!hasilInit) {
                // [FIX] Self-heal sama kayak versi MSC -- coba hitung ulang
                // kualifikasi dari data region di memori sekarang dulu
                // sebelum nyerah, buat jaga-jaga save lama yang kualifikasi
                // tersimpannya rusak/kosong dari sebelum fix ini ada.
                if (typeof tentukanKualifikasiM7 === "function") {
                    let kualifikasiBaru = tentukanKualifikasiM7();
                    if (kualifikasiBaru && kualifikasiBaru.wildCard && kualifikasiBaru.wildCard.length === 8) {
                        console.error("[GUARD M7] Kualifikasi lama rusak/kosong -- berhasil di-refresh ulang dari data region saat ini.");
                        st.kualifikasi = kualifikasiBaru;
                        hasilInit = initWildCardM7(st.kualifikasi.wildCard);
                    }
                }
            }
            if (!hasilInit) {
                throw new Error(
                    `Wild Card M${edisiMSeries} World Championship gagal dimulai -- jumlah tim kualifikasi cuma ${st.kualifikasi.wildCard ? st.kualifikasi.wildCard.length : 0}, butuh tepat 8.\n` +
                    `Status tiap region: ${diagnostikRegionM7()}`
                );
            }
            st.wcMulai = true;
            tambahBerita(`🎮 Wild Card M${edisiMSeries} World Championship Dimulai. 8 tim, 2 grup, single round robin BO3.`);
            return;
        }
        if (!st.wcDay1) { jalankanRoundGrupWCM7(1); st.wcDay1 = true; return; }
        if (!st.wcDay2) { jalankanRoundGrupWCM7(2); st.wcDay2 = true; return; }
        if (!st.wcDay3) { jalankanRoundGrupWCM7(3); st.wcDay3 = true; return; }
        if (!st.wcQualif) { jalankanQualificationWCM7(); st.wcQualif = true; return; }
    }

    // -- SWISS STAGE -- (gak boleh mulai sebelum Wild Card beneran kelar)
    if (hari >= tabelTgl.swissR1 && st.wcQualif) {
        if (!st.swMulai) {
            let gabung16 = [
                ...st.kualifikasi.mainEvent.map(x => x.tim),
                ...window.wildCardM7Data.golonganM7
            ];
            initSwissM7(gabung16);
            st.swMulai = true;
            tambahBerita(`🇸 Swiss Stage M${edisiMSeries} World Championship Dimulai. 16 tim berebut 8 slot Knockout.`);
            // [FIX] Round 1 SENGAJA belum disimulasikan hari ini -- baru
            // dijalankan hari berikutnya, biar pairing-nya kelihatan dulu.
            return;
        }
        if (!st.swR1) { jalankanSwissRound1M7(); st.swR1 = true; return; }
    }
    if (hari >= tabelTgl.swissR2 && st.swR1 && !st.swR2) { jalankanSwissRound2M7(); st.swR2 = true; return; }
    if (hari >= tabelTgl.swissR3a && st.swR2 && !st.swR3a) { jalankanSwissRound3aM7(); st.swR3a = true; return; }
    if (hari >= tabelTgl.swissR3b && st.swR3a && !st.swR3b) { jalankanSwissRound3bM7(); st.swR3b = true; return; }
    if (hari >= tabelTgl.swissR4 && st.swR3b && !st.swR4) { jalankanSwissRound4M7(); st.swR4 = true; return; }
    if (hari >= tabelTgl.swissR5 && st.swR4 && !st.swR5) { jalankanSwissRound5M7(); st.swR5 = true; return; }

    // -- KNOCKOUT STAGE -- (gak boleh mulai sebelum Swiss beneran kelar)
    if (hari >= tabelTgl.knockoutUBQF && st.swR5) {
        if (!st.koMulai) {
            initKnockoutM7(window.swissM7Data.qualified);
            st.koMulai = true;
            tambahBerita(`⚔️ Knockout Stage M${edisiMSeries} Dimulai. Double Elimination, 8 tim.`);
            // [FIX] UBQF SENGAJA belum disimulasikan hari ini -- sama
            // kayak Swiss di atas, biar pairing-nya kelihatan dulu.
            return;
        }
        if (!st.koUbqf) { jalankanUBQF_M7(); st.koUbqf = true; return; }
        if (!st.koLbr1) { jalankanLBR1_M7(); st.koLbr1 = true; return; }
    }
    if (hari >= tabelTgl.knockoutUBSF && st.koLbr1) {
        // [FIX] SEBELUMNYA gak ada `return` di sini -- LBR2 (yang
        // pairing-nya baru aja di-reveal sebagai side-effect UBSF) malah
        // ikut disimulasikan di tick yang SAMA, jadi skornya langsung
        // keluar bareng UBSF tanpa sempet nongol preview VS-nya dulu.
        if (!st.koUbsf) { jalankanUBSF_M7(); st.koUbsf = true; return; }
        if (!st.koLbr2) { jalankanLBR2_M7(); st.koLbr2 = true; return; }
    }
    if (hari >= tabelTgl.knockoutUBFinal && st.koLbr2) {
        if (!st.koUbfinal) { jalankanUBFinal_M7(); st.koUbfinal = true; return; }
        if (!st.koLbr3) { jalankanLBR3_M7(); st.koLbr3 = true; return; }
    }
    if (st.koLbr3 && !st.koLbfinal) { jalankanLBFinal_M7(); st.koLbfinal = true; return; }

    // -- GRAND FINAL --
    if (hari >= tabelTgl.grandFinalTanggal && st.koLbfinal && !st.gfDone) {
        jalankanGrandFinal_M7();
        st.gfDone = true;
        selesaikanM7();
        return;
    }
}
window.jalankanTickM7 = jalankanTickM7;

console.log("M7 World Championship Engine v1.0 loaded.");
