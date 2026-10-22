// ============================================================
// CLOSE SCORE PATCH — bikin skor per-series lebih ketat (2-1, 3-2, 4-3)
// Gabungan: (1) compress gap performa jadi win-probability
//           (2) momentum/comeback per game di dalam satu series
//           (3) upset factor -- kejutan dadakan buat underdog
// ============================================================
//
// Sebelumnya: game dalam 1 series ditentukan murni dari pA > pB.
// Karena gap OVR biasanya konsisten tiap game, tim yang lebih kuat
// nyaris selalu menang SEMUA game -> hasil sapu bersih (3-0, 4-0).
//
// Sekarang: selisih performa (pA - pB) dilewatin logistic function
// jadi peluang menang per game, lalu ditambah/dikurang berdasarkan
// posisi skor series saat ini (tim yang ketinggalan dapet dorongan
// comeback, tim yang unggul kena sedikit "cruise control").
//
// [REBALANCE MSC 2026] Ditinjau ulang berdasarkan hasil real MSC x
// EWC 2026: mayoritas series yang emang timpang gap skill-nya justru
// SAPU BERSIH 2-0 (bukan 2-1 mulu), tapi sesekali ada upset ekstrem
// dari tim underdog/minor-region ngelawan tim yang di-hype tinggi
// (kill diff lebar, bukan menang tipis). Makanya bonus comeback
// dikecilin dikit (biar 2-0 bersih tetap sering muncul pas gap-nya
// emang nyata), dan ditambah "upset factor" -- peluang kecil tiap
// game underdog dapet lonjakan performa dadakan.

function tentukanPemenangGame(pA, pB, sA, sB, formatBO) {
    let selisih = pA - pB;

    // --- 1. COMPRESS GAP -> WIN PROBABILITY ---
    // Skala 12 dipilih supaya selisih ~10 poin performa jadi ±70% win
    // chance (bukan 100% mutlak kayak sebelumnya). Makin kecil angka
    // pembagi (12), makin ketat skornya; makin besar, makin dominan
    // tim yang OVR-nya lebih tinggi.
    let probA = 1 / (1 + Math.exp(-selisih / 12));

    // --- 2. MOMENTUM / COMEBACK ---
    // gapSkor > 0 artinya A lagi tertinggal di series ini.
    // [REBALANCE] 0.08 -> 0.05 per game ketinggalan -- sebelumnya
    // ke-agresifan comeback bikin 2-0 bersih jarang muncul walau gap
    // skill dua tim emang lebar, padahal realita MSC nunjukin sapu
    // bersih itu wajar kalau gap-nya nyata.
    let gapSkor = sB - sA;
    if (gapSkor > 0) {
        probA += gapSkor * 0.05; // tiap game ketinggalan, +5% peluang comeback
    } else if (gapSkor < 0) {
        probA -= Math.abs(gapSkor) * 0.05; // tim unggul kena penalti kecil
    }

    // --- 3. UPSET FACTOR ---
    // [REBALANCE BARU] Kadang tim yang performanya lebih rendah dapet
    // lonjakan dadakan 1 game -- meniru kejutan nyata kayak TL PH
    // dilibas Aurora di MSC 2026 (bukan cuma kalah tipis, tapi bener2
    // kebalik drastis). ~6% peluang tiap game, lonjakannya cukup
    // besar (30%) biar kerasa efeknya, tapi tetap dibatasi clamp di
    // bawah biar gak jadi favorit baru yang mutlak.
    if (Math.random() < 0.06) {
        if (selisih >= 0) probA -= 0.30; // A diunggulkan, tapi kena upset
        else probA += 0.30; // A underdog, lagi dapet lonjakan kejutan
    }

    // Clamp -- jangan sampai 0% / 100% biar tetap ada kejutan
    probA = Math.min(0.92, Math.max(0.08, probA));

    return Math.random() < probA; // true = timA menang game ini
}
window.tentukanPemenangGame = tentukanPemenangGame;

console.log("Close Score Patch: sistem probabilitas, momentum, & upset factor per-game aktif.");
