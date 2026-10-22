// ==========================================================================
// AI_SPONSOR_ECONOMY_PATCH.JS
// Sebelumnya sistem sponsor (sponsorTim, kontrak, KPI) cuma ada buat tim
// PLAYER -- tim AI sama sekali gak punya sponsor. Patch ini bikin ekonomi
// sponsor yang sama buat SEMUA tim AI di seluruh region/liga:
//   - Tiap tim AI punya sponsorTim sendiri (Utama/Minor1/Minor2)
//   - Seleksi "cerdas": prioritas nominal tertinggi yg lolos syarat,
//     hindarin KPI yang kejauhan dari kemampuan tim, DARK cuma diambil
//     kalau lagi kepepet (kas kritis) atau reputasi udah jelek
//   - Kas masuk lump sum otomatis pas AI tanda tangan (sama kayak player)
//   - KPI dicek tiap akhir musim (pake fungsi pencapaian playoff generik,
//     bisa buat tim manapun -- bukan cuma hardcode ke timPlayer)
//   - Renewal Opsi B: kalau tim udah jauh ngelewatin syarat minimal
//     sponsornya, ada kans "lulus" (sponsor lama pergi, cari yg lebih
//     gede musim depan). DARK gak pernah ditawarin perpanjangan.
// ==========================================================================

(function () {

const KPI_BONUS_MULTIPLIER = 0.5;
const DARK_KAS_KRITIS = 300000000;      // di bawah ini dianggap "kepepet"
const DARK_REPUTASI_RENDAH = 30;        // di bawah ini dianggap "gak ada lagi yg dirugiin"
const URUTAN_TIER_KPI = ["LOLOS_PLAYOFF", "TOP_4", "GRAND_FINAL", "JUARA_MPL"];

// --------------------------------------------------------------------
// [1] Kumpulin semua tim AI di seluruh region/liga -- pola region-list
// yang sama kayak patch staff trofi, diduplikasi di sini biar file ini
// tetep berdiri sendiri (gak bergantung ke patch lain).
// --------------------------------------------------------------------
function daftarSemuaTimAI() {
    let semuaRegion = [
        (typeof daftarTim !== "undefined") ? daftarTim : [],
        (typeof daftarTimPH !== "undefined") ? daftarTimPH : [],
        (typeof daftarTimMY !== "undefined") ? daftarTimMY : [],
        (typeof daftarTimSG !== "undefined") ? daftarTimSG : [],
        (typeof daftarTimMDL_Afiliasi_ID !== "undefined") ? daftarTimMDL_Afiliasi_ID : [],
        (typeof daftarTimMDL_Independen_ID !== "undefined") ? daftarTimMDL_Independen_ID : [],
        (typeof daftarTimMDL_Afiliasi_PH !== "undefined") ? daftarTimMDL_Afiliasi_PH : [],
        (typeof daftarTimMDL_Independen_PH !== "undefined") ? daftarTimMDL_Independen_PH : [],
        (typeof daftarTimMAL_Affiliated_MY !== "undefined") ? daftarTimMAL_Affiliated_MY : [],
        (typeof daftarTimMAL_Challenger_MY !== "undefined") ? daftarTimMAL_Challenger_MY : [],
        (typeof daftarTimLEN !== "undefined") ? daftarTimLEN : []
    ];
    ["daftarTimKH", "daftarTimMM", "daftarTimMENA", "daftarTimTR", "daftarTimEECA",
     "daftarTimEA", "daftarTimAM", "daftarTimIN", "daftarTimWEU"].forEach(nm => {
        if (typeof window[nm] !== "undefined") semuaRegion.push(window[nm]);
    });

    let hasil = [];
    semuaRegion.forEach(region => {
        (region || []).forEach(tim => {
            if (tim && (typeof timPlayer === "undefined" || tim.nama !== timPlayer)) hasil.push(tim);
        });
    });
    return hasil;
}

// --------------------------------------------------------------------
// [2] Versi GENERIK dari tentukanPencapaianPlayoffPlayer() -- sama
// persis logic bracket-nya, tapi bisa dipake buat tim manapun (bukan
// cuma timPlayer). Dipake buat evaluasi KPI sponsor AI.
// --------------------------------------------------------------------
function tentukanPencapaianPlayoffTim(namaTim) {
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
        if (!pd.m8.menang || !pd.m8.home || !pd.m8.away) continue;
        if (pd.m8.menang.nama === namaTim) return "JUARA_MPL";
        if (pd.m8.home.nama === namaTim || pd.m8.away.nama === namaTim) return "GRAND_FINAL";
        if ((pd.m5 && pd.m5.kalah && pd.m5.kalah.nama === namaTim) ||
            (pd.m7 && pd.m7.kalah && pd.m7.kalah.nama === namaTim)) return "TOP_4";
        if ((pd.m1 && pd.m1.kalah && pd.m1.kalah.nama === namaTim) ||
            (pd.m2 && pd.m2.kalah && pd.m2.kalah.nama === namaTim)) return "LOLOS_PLAYOFF";
    }
    return null;
}

// --------------------------------------------------------------------
// [3] Pencatatan laporan keuangan AI -- format sama persis kayak yang
// dipake di msc_prize_patch.js, diduplikasi di sini biar file ini
// tetep berdiri sendiri.
// --------------------------------------------------------------------
function catatKasAI(tim, jenis, nominal, deskripsi) {
    if (!tim.riwayatKas) tim.riwayatKas = [];
    let tgl = (typeof dapetTanggalPendek === "function" && typeof kalenderGame !== "undefined") ? dapetTanggalPendek(kalenderGame) : "";
    let weekTxt = (typeof statusGame !== "undefined" && statusGame === "PRAMUSIM")
        ? "Off-Season"
        : `S${typeof musimKe !== "undefined" ? musimKe : "?"}-W${typeof mingguKe !== "undefined" ? mingguKe : "?"}`;
    tim.riwayatKas.unshift({ jenis, nominal, deskripsi, waktu: `${weekTxt} | ${tgl}` });
    if (tim.riwayatKas.length > 100) tim.riwayatKas.pop();
}

// --------------------------------------------------------------------
// [4] SELEKSI CERDAS -- skor sponsor berdasarkan nominal & resiko KPI.
// --------------------------------------------------------------------
function skorSponsorUntukAI(sponsor, powerTim) {
    let skor = sponsor.bayar;
    if (sponsor.kpi && sponsor.kpi !== "NONE") {
        let levelKPI = URUTAN_TIER_KPI.indexOf(sponsor.kpi);
        let levelEstimasiTim =
            powerTim >= 85 ? 3 : powerTim >= 78 ? 2 : powerTim >= 70 ? 1 : powerTim >= 60 ? 0 : -1;
        if (levelKPI > levelEstimasiTim + 1) skor *= 0.3;       // kejauhan, resiko tinggi -> didiskon berat
        else if (levelKPI > levelEstimasiTim) skor *= 0.7;       // agak riskan
        skor += (sponsor.bonusJuara || 0) * 0.3;                 // ekspektasi bonus, didiskon krn belum tentu
    }
    return skor;
}

function bolehAmbilDark(tim) {
    return (tim.kas || 0) < DARK_KAS_KRITIS || (tim.reputasi || 50) < DARK_REPUTASI_RENDAH;
}

function generateKontrakDariBase(sponsorBase) {
    let sp = JSON.parse(JSON.stringify(sponsorBase));
    sp.durasi = Math.floor(Math.random() * 2) + 1;
    sp.bayar = sp.bayar * sp.durasi;
    sp.sisaDurasi = sp.durasi;
    return sp;
}

function cobaIsiSatuSlotAI(tim) {
    let st = tim.sponsorTim;
    let powerTim = tim.power || 65;
    let reputasiTim = tim.reputasi || 50;

    let namaSudahAda = new Set([st.utama, st.minor1, st.minor2].filter(Boolean).map(s => s.nama));
    let eligible = (typeof daftarSponsor !== "undefined" ? daftarSponsor : []).filter(
        s => powerTim >= s.minimalPower && reputasiTim >= s.minimalReputasi && !namaSudahAda.has(s.nama)
    );

    let nonDark = eligible.filter(s => s.tier !== "DARK");
    let darkList = eligible.filter(s => s.tier === "DARK");
    let kandidat = nonDark.slice();
    if (bolehAmbilDark(tim)) kandidat = kandidat.concat(darkList);
    if (kandidat.length === 0) return false;

    kandidat.sort((a, b) => skorSponsorUntukAI(b, powerTim) - skorSponsorUntukAI(a, powerTim));

    // Coba dari kandidat terbaik, cari yang slotnya masih available buat tier itu
    for (let pilihan of kandidat) {
        let isMain = (pilihan.tier === "S" || pilihan.tier === "A" || pilihan.tier === "DARK");
        let slotKey = null;
        if (isMain && !st.utama) slotKey = "utama";
        else if (!isMain && !st.minor1) slotKey = "minor1";
        else if (!isMain && !st.minor2) slotKey = "minor2";
        if (!slotKey) continue;

        let sp = generateKontrakDariBase(pilihan);
        st[slotKey] = sp;
        tim.kas = (tim.kas || 0) + sp.bayar;
        catatKasAI(tim, "MASUK", sp.bayar, `Sponsor Baru: ${sp.nama}`);
        return true;
    }
    return false;
}

function isiSemuaSlotKosongAI(tim) {
    for (let i = 0; i < 3; i++) {
        let st = tim.sponsorTim;
        if (st.utama && st.minor1 && st.minor2) break;
        if (!cobaIsiSatuSlotAI(tim)) break;
    }
}

// --------------------------------------------------------------------
// [5] RENEWAL OPSI B -- kalau tim udah jauh ngelewatin syarat minimal
// sponsor, ada kans "lulus" (sponsor pergi, cari yg lebih gede musim
// depan). DARK gak pernah ditawarin perpanjangan sama sekali.
// --------------------------------------------------------------------
function evaluasiPerpanjanganAI(tim, slotKey) {
    let sp = tim.sponsorTim[slotKey];
    if (!sp) return;

    if (sp.tier === "DARK") {
        catatKasAI(tim, "INFO", 0, `Kontrak ${sp.nama} berakhir (sponsor gelap, sekali kontrak)`);
        tim.sponsorTim[slotKey] = null;
        return;
    }

    let powerTim = tim.power || 65;
    let reputasiTim = tim.reputasi || 50;
    let marginPower = powerTim - sp.minimalPower;
    let marginReputasi = reputasiTim - sp.minimalReputasi;

    let kansLulus = 0.1;
    if (marginPower > 15 || marginReputasi > 20) kansLulus = 0.6;
    else if (marginPower > 8 || marginReputasi > 10) kansLulus = 0.3;

    if (Math.random() < kansLulus) {
        catatKasAI(tim, "INFO", 0, `Kontrak ${sp.nama} berakhir (tim sudah naik kelas)`);
        tim.sponsorTim[slotKey] = null;
        return;
    }

    let base = (typeof daftarSponsor !== "undefined" ? daftarSponsor : []).find(s => s.nama === sp.nama);
    if (!base) {
        tim.sponsorTim[slotKey] = null;
        return;
    }
    let spBaru = generateKontrakDariBase(base);
    tim.sponsorTim[slotKey] = spBaru;
    tim.kas = (tim.kas || 0) + spBaru.bayar;
    catatKasAI(tim, "MASUK", spBaru.bayar, `Perpanjangan Kontrak: ${spBaru.nama}`);
}

// --------------------------------------------------------------------
// [6] PROSES 1 TIM PER MUSIM -- urutannya: KPI check dulu (bisa motong
// kontrak sebelum sempet ke pengecekan durasi), baru countdown durasi +
// renewal, baru isi slot kosong yang tersisa.
// --------------------------------------------------------------------
function prosesSponsorSatuTimPerMusim(tim) {
    if (!tim.sponsorTim) tim.sponsorTim = { utama: null, minor1: null, minor2: null };
    let st = tim.sponsorTim;

    let pencapaian = tentukanPencapaianPlayoffTim(tim.nama);
    let levelPencapaian = pencapaian ? URUTAN_TIER_KPI.indexOf(pencapaian) : -1;

    ["utama", "minor1", "minor2"].forEach(slotKey => {
        let sp = st[slotKey];
        if (!sp || !sp.kpi || sp.kpi === "NONE") return;
        let levelTarget = URUTAN_TIER_KPI.indexOf(sp.kpi);
        if (levelTarget === -1) return;
        if (levelPencapaian >= levelTarget) {
            let bonus = Math.floor((sp.bayar || 0) * KPI_BONUS_MULTIPLIER);
            tim.kas = (tim.kas || 0) + bonus;
            catatKasAI(tim, "MASUK", bonus, `Bonus KPI Tercapai: ${sp.nama}`);
        } else {
            catatKasAI(tim, "INFO", 0, `Kontrak ${sp.nama} diputus (target KPI gagal)`);
            st[slotKey] = null;
        }
    });

    ["utama", "minor1", "minor2"].forEach(slotKey => {
        let sp = st[slotKey];
        if (!sp) return;
        sp.sisaDurasi -= 1;
        if (sp.sisaDurasi <= 0) evaluasiPerpanjanganAI(tim, slotKey);
    });

    isiSemuaSlotKosongAI(tim);
}

function prosesSponsorSemuaTimAI() {
    daftarSemuaTimAI().forEach(tim => prosesSponsorSatuTimPerMusim(tim));
}

// --------------------------------------------------------------------
// [7] HOOK TRANSISI MUSIM -- deteksi musimKe naik lewat wrap
// klikTombolUtama, sama teknik yang dipake staff_trofi_patch.js, tapi
// diwrap independen di sini biar file ini gak bergantung ke patch lain.
// Beberapa patch bisa numpuk wrap di fungsi yang sama tanpa konflik.
// --------------------------------------------------------------------
if (typeof window.klikTombolUtama === "function" && !window._klikTombolUtamaAsliSebelumSponsorAIPatch) {
    window._klikTombolUtamaAsliSebelumSponsorAIPatch = window.klikTombolUtama;
    window.klikTombolUtama = function () {
        let musimSebelum = (typeof musimKe !== "undefined") ? musimKe : null;
        let hasil = window._klikTombolUtamaAsliSebelumSponsorAIPatch.apply(this, arguments);
        let musimSesudah = (typeof musimKe !== "undefined") ? musimKe : null;
        if (musimSebelum !== null && musimSesudah !== null && musimSesudah > musimSebelum) {
            prosesSponsorSemuaTimAI();
        }
        return hasil;
    };
}

// --------------------------------------------------------------------
// [8] SEEDING AWAL -- jalan sekali pas patch dimuat, biar tim AI yang
// belum punya sponsorTim langsung dikasih (kosong dulu), lalu langsung
// dicoba isi slotnya biar ekonominya kerasa hidup dari awal, bukan
// nunggu 1 musim penuh dulu.
// --------------------------------------------------------------------
function seedSponsorAwalSemuaTimAI() {
    daftarSemuaTimAI().forEach(tim => {
        if (!tim.sponsorTim) {
            tim.sponsorTim = { utama: null, minor1: null, minor2: null };
            isiSemuaSlotKosongAI(tim);
        }
    });
}
seedSponsorAwalSemuaTimAI();

console.log("AI Sponsor Economy Patch aktif -- tim AI sekarang punya sistem sponsor sendiri.");

})();
