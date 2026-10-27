// FUNGSI SELECTOR DOM
// ==========================================
// UTILITIES
// ==========================================
window.getEl = id => document.getElementById(id);

// Debounce utility to avoid redundant re-renders
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Safe DOM setter — skips update if value hasn't changed
function setTextIfChanged(id, text) {
    const el = document.getElementById(id);
    if (el && el.innerText !== String(text)) el.innerText = String(text);
}
function setHtmlIfChanged(id, html) {
    const el = document.getElementById(id);
    if (el && el.innerHTML !== String(html)) el.innerHTML = String(html);
}

// [PROFIL REDESIGN] Sync mini progress bar width alongside the existing
// text value display. Purely additive — does not change any value logic.
// [PROFIL REDESIGN] Sync mini progress bar width alongside the existing
// text value display. Purely additive — does not change any value logic.
function syncProfilAttrBars() {
    const map = [
        ["profilMekanik", "barProfilMekanik"],
        ["profilMakro", "barProfilMakro"],
        ["profilMental", "barProfilMental"],
        ["profilSpesialis", "barProfilSpesialis"],
    ];
    map.forEach(([valId, barId]) => {
        const valEl = getEl(valId);
        const barEl = getEl(barId);
        if (!valEl || !barEl) return;
        const raw = valEl.innerText;
        const num = parseFloat(raw);
        barEl.style.width = isNaN(num) ? "0%" : Math.max(0, Math.min(100, num)) + "%";
    });
}

// [BURSA TRANSFER] Render ulang baris tabel berdasarkan filter aktif
// (Nama / Role / Umur / Negara). Dataset sumbernya window._bursaTransferData
// yang dibangun sekali tiap updateDashboard(), jadi filter cuma re-render
// tbody-nya aja -- gak perlu rebuild seluruh tabel tiap keystroke.
function renderBursaTransferRows() {
    let tbody = getEl("bursaTableBody");
    if (!tbody) return;
    let data = window._bursaTransferData || [];

    let searchNama = (getEl("bursaFilterNama")?.value || "").toLowerCase().trim();
    let filterRole = getEl("bursaFilterRole")?.value || "";
    let filterUmur = getEl("bursaFilterUmur")?.value || "";
    let filterNegara = getEl("bursaFilterNegara")?.value || "";

    let filtered = data.filter(item => {
        if (searchNama && !item.nama.toLowerCase().includes(searchNama)) return false;
        if (filterRole && item.role !== filterRole) return false;
        if (filterNegara && item.negara !== filterNegara) return false;
        if (filterUmur) {
            let u = item.umur;
            if (filterUmur === "muda" && !(u <= 20)) return false;
            if (filterUmur === "prima" && !(u >= 21 && u <= 25)) return false;
            if (filterUmur === "matang" && !(u >= 26 && u <= 30)) return false;
            if (filterUmur === "senior" && !(u >= 31)) return false;
        }
        return true;
    });

    let hint = getEl("bursaFilterEmptyHint");
    if (filtered.length === 0) {
        tbody.innerHTML = "";
        if (hint) hint.classList.remove("sembunyi");
        return;
    }
    if (hint) hint.classList.add("sembunyi");

    tbody.innerHTML = filtered.map(item => {
        let bendera = (item.negara || "🌐 Global").split(" ")[0];
        let onclickAksi = item.tipe === "STAFF"
            ? `bukaProfilStaff('BURSA', ${item.idx})`
            : `bukaProfilPemain('TRANSFER', ${item.idx})`;
        let roleStyle = item.tipe === "STAFF" ? ' style="color:var(--cyan);"' : "";
        return `
        <tr onclick="${onclickAksi}">
            <td class="bursa-table__nama">${item.nama}</td>
            <td class="bursa-table__role"${roleStyle}>${item.role}</td>
            <td class="bursa-table__center bursa-table__umur">${item.umur}</td>
            <td class="bursa-table__num bursa-table__nilai">Rp ${(item.harga / 1000000).toFixed(1)} Jt</td>
            <td class="bursa-table__center">${bendera}</td>
        </tr>`;
    }).join("");
}
window.renderBursaTransferRows = renderBursaTransferRows;

// [BURSA TRANSFER] Isi ulang opsi dropdown Role & Negara berdasarkan data
// yang beneran ada di bursa saat ini (bukan daftar statis) -- jadi gak
// pernah nampilin opsi filter yang hasilnya bakal selalu kosong.
function populateBursaFilterOptions() {
    let roleSel = getEl("bursaFilterRole");
    let negaraSel = getEl("bursaFilterNegara");
    if (!roleSel || !negaraSel) return;

    let currentRole = roleSel.value;
    let currentNegara = negaraSel.value;
    let data = window._bursaTransferData || [];

    let roles = [...new Set(data.map(x => x.role))].sort();
    let negaras = [...new Set(data.map(x => x.negara || "🌐 Global"))].sort();

    roleSel.innerHTML = `<option value="">Semua Role</option>` +
        roles.map(r => `<option value="${r}">${r}</option>`).join("");
    negaraSel.innerHTML = `<option value="">Semua Negara</option>` +
        negaras.map(n => `<option value="${n}">${n}</option>`).join("");

    if (roles.includes(currentRole)) roleSel.value = currentRole;
    if (negaras.includes(currentNegara)) negaraSel.value = currentNegara;
}
window.populateBursaFilterOptions = populateBursaFilterOptions;

//Kelompok UI Dasar & Modal (Pop-up)
function updateBadgeEmail() {
    let badge = getEl("badgeEmail");
    if (emailBelumDibaca > 0) {
        badge.innerText = emailBelumDibaca;
        badge.classList.remove("sembunyi");
    } else {
        badge.classList.add("sembunyi");
    }
}

function renderEmail() {
    let container = getEl("listEmail");
    if (!container) return;

    // Bersihkan kontainer sebelum diisi ulang
    container.innerHTML = "";

    if (inboxEmail.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">Kotak masuk kosong.</div>`;
        return;
    }

    // 1. Siapkan meja kerja gaib (DocumentFragment)
    let fragment = document.createDocumentFragment();

    inboxEmail.forEach((em, index) => {
        // 2. Bikin elemen bungkus luar (div) untuk tiap email
        let div = document.createElement("div");
        div.className = `email-item ${em.dibaca ? "" : "belum-dibaca"}`;

        // 3. Pasang fungsi klik langsung ke elemennya (tanpa string onclick)
        div.onclick = function () {
            bacaEmail(index);
        };

        // 4. Rakit isi dalamnya
        div.innerHTML = `
            <div style="font-weight:bold;">${em.subjek}</div>
            <div style="font-size:11px; color:#5C6472;">Dari: ${em.pengirim} | ${em.tanggal}</div>
        `;

        // 5. Simpan rakitan ke atas meja kerja (fragment)
        fragment.appendChild(div);
    });

    // 6. Tembak semua isi meja kerja ke layar sekaligus (1x kerja browser)
    container.appendChild(fragment);
}

window.bacaEmail = function (index) {
    let em = inboxEmail[index];
    if (!em.dibaca) {
        em.dibaca = true;
        emailBelumDibaca--;
        updateBadgeEmail();
        renderEmail(); // Render ulang biar garis kuning (belum dibaca) hilang
    }

    getEl("bacaEmailPengirim").innerText = em.pengirim;
    getEl("bacaEmailTanggal").innerText = em.tanggal;
    getEl("bacaEmailSubjek").innerText = em.subjek;
    getEl("bacaEmailIsi").innerHTML = em.isi;

    getEl("modalBacaEmail").classList.remove("sembunyi");
};

window.tutupBacaEmail = function () {
    getEl("modalBacaEmail").classList.add("sembunyi");
};

function renderBerita() {
    let box = getEl("boxBerita");
    if (!box) return;

    // Render cuma 1 baris terbaru di dashboard
    if (bankBerita.length > 0) {
        let b = bankBerita[0];
        box.innerHTML = `<b>${b.tanggal}</b>: ${b.teks}`;
    } else {
        box.innerHTML = `<span style="color:#666; font-style:italic;">Belum ada berita.</span>`;
    }
}

// Panel "PERLU PERHATIAN" di dashboard — nyaring bankBerita yang sifatnya
// butuh keputusan/tindakan manajer (warning, burnout, lockdown, prospek baru),
// dipisah dari ticker KABAR TERKINI yang nampung semua jenis berita (termasuk yang sekedar info).
// Hitung daftar hal yang BENERAN perlu perhatian manajer SEKARANG,
// berbasis kondisi tim player saat ini (bukan filter berita lama lagi --
// itu rawan ke-spam kayak kasus bug streak kemarin). Tiap kategori
// dihitung ULANG live dari state asli, jadi selalu akurat & otomatis
// hilang sendiri kalau kondisinya udah gak relevan.
function hitungNotifikasiPenting(regionKita, indextimPlayer) {
    let hasil = [];

    // === 1. KONTRAK PEMAIN / STAFF / SPONSOR SISA 1 MUSIM ===
    let kontrakHampirHabis = [];
    if (typeof rosterKita !== "undefined") {
        rosterKita.forEach(p => {
            if (p.sisaKontrak === 1) {
                kontrakHampirHabis.push(`📝 KONTRAK PEMAIN: <b>${p.nama}</b> (${p.role}) sisa <b>1 musim</b> — perpanjang sebelum offseason!`);
            }
        });
    }
    if (typeof staffKita !== "undefined") {
        let labelRoleStaff = { pelatih: "Pelatih", asisten: "Asisten Pelatih", analis: "Analis" };
        ["pelatih", "asisten", "analis"].forEach(rk => {
            let s = staffKita[rk];
            if (s && s.sisaKontrak === 1) {
                kontrakHampirHabis.push(`📝 KONTRAK STAFF: <b>${s.nama}</b> (${labelRoleStaff[rk]}) sisa <b>1 musim</b> — siapkan perpanjangan!`);
            }
        });
    }
    if (typeof window.sponsorTim !== "undefined" && window.sponsorTim) {
        let labelSlotSponsor = { utama: "Sponsor Utama", minor1: "Sponsor Minor 1", minor2: "Sponsor Minor 2" };
        ["utama", "minor1", "minor2"].forEach(slot => {
            let sp = window.sponsorTim[slot];
            if (sp && sp.sisaDurasi === 1) {
                kontrakHampirHabis.push(`💰 KONTRAK SPONSOR: <b>${sp.nama}</b> (${labelSlotSponsor[slot]}) sisa <b>1 musim</b> — siapkan negosiasi ulang!`);
            }
        });
    }
    // Batasi maks 4 item kontrak biar panel gak kepanjangan
    hasil = hasil.concat(kontrakHampirHabis.slice(0, 4));
    if (kontrakHampirHabis.length > 4) {
        hasil.push(`📝 +${kontrakHampirHabis.length - 4} kontrak lain juga sisa 1 musim — cek Tim/Organisasi.`);
    }

    // === 2. ROSTER LOCK 7 HARI LAGI ===
    if (typeof cekStatusRosterLock === "function" && typeof ligaPlayer !== "undefined"
        && typeof kalenderGame !== "undefined" && typeof selisihHari === "function") {
        let ligaUntukCek = (ligaPlayer === "MDL") ? "MDL" : "MPL";
        let cekLock = cekStatusRosterLock(ligaUntukCek);
        if (cekLock && !cekLock.terkunci && cekLock.tanggalLockMulai) {
            let sisaHariLock = selisihHari(kalenderGame, cekLock.tanggalLockMulai);
            if (sisaHariLock > 0 && sisaHariLock <= 7) {
                hasil.push(`🔒 ROSTER LOCK: <b>${sisaHariLock} hari lagi</b> menuju Roster Lock ${ligaUntukCek} — pastikan transfer & perpanjangan kontrak sudah selesai!`);
            }
        }
    }

    // === 3 & 4. ANCAMAN GAGAL PLAYOFF (khusus MPL) / ANCAMAN DEGRADASI (khusus MDL Independen) ===
    if (typeof statusGame !== "undefined" && statusGame === "REGULER"
        && regionKita && indextimPlayer !== undefined && indextimPlayer !== -1) {

        let idxKita = indextimPlayer;
        {
            let sisaMatchKita = (typeof jadwalTimPlayer !== "undefined") ? jadwalTimPlayer.length : 0;
            let poinMaksKita = (regionKita[idxKita].poin || 0) + sisaMatchKita;
            let posisiKita = idxKita + 1;

            let regionAdalahMPL =
                (typeof daftarTim !== "undefined" && regionKita === daftarTim) ||
                (typeof daftarTimPH !== "undefined" && regionKita === daftarTimPH) ||
                (typeof daftarTimMY !== "undefined" && regionKita === daftarTimMY) ||
                (typeof daftarTimSG !== "undefined" && regionKita === daftarTimSG);

            // Ancaman gagal playoff: target Top 6, dicek cuma kalau posisi kita di luar Top 6
            // dan poin maksimal (poin sekarang + menang semua sisa match) masih kalah/seri
            // sama poin tim yang SEKARANG di posisi 6 (konservatif: tim itu pun masih akan nambah poin).
            if (regionAdalahMPL && regionKita.length > 6 && posisiKita > 6) {
                let timBatas6 = regionKita[5];
                if (timBatas6 && poinMaksKita <= timBatas6.poin) {
                    hasil.push(`⚠️ TERANCAM GAGAL PLAYOFF: Posisi <b>#${posisiKita}</b>, maksimal poin yang bisa dikejar dari sisa ${sisaMatchKita} match cuma <b>${poinMaksKita}</b> — nyaris mustahil nembus Top 6!`);
                }
            }

            // Ancaman degradasi: khusus tim Independen MDL (Afiliasi gak ikut degradasi)
            let timKitaIndependen =
                (typeof daftarTimMDL_Independen_ID !== "undefined" && daftarTimMDL_Independen_ID.some(t => t.nama === timPlayer)) ||
                (typeof daftarTimMDL_Independen_PH !== "undefined" && daftarTimMDL_Independen_PH.some(t => t.nama === timPlayer));

            if (timKitaIndependen) {
                // Formula sama persis kayak garis merah di tabel klasemen mini (ui.js)
                let batasMerah;
                if (typeof daftarTimLEN !== "undefined" && regionKita === daftarTimLEN) {
                    batasMerah = regionKita.length;
                } else if (regionKita === daftarTimSG) {
                    batasMerah = 3;
                } else if (typeof daftarTimMDL_ID !== "undefined" && (regionKita === daftarTimMDL_ID || regionKita === daftarTimMDL_PH)) {
                    batasMerah = regionKita.length - 2;
                } else {
                    batasMerah = 6; // MPL ID/PH/MY: posisi 7-9 zona merah
                }

                if (posisiKita > batasMerah) {
                    let timBatasAman = regionKita[batasMerah - 1];
                    if (timBatasAman && poinMaksKita <= timBatasAman.poin) {
                        hasil.push(`🚨 TERANCAM DEGRADASI: Posisi <b>#${posisiKita}</b> di zona merah, maksimal poin dari sisa ${sisaMatchKita} match cuma <b>${poinMaksKita}</b> — nyaris mustahil bertahan di MDL!`);
                    }
                }
            }
        }
    }

    return hasil;
}

function renderNotifikasiDashboard(regionKita, indextimPlayer) {
    let box = getEl("boxNotifikasi");
    if (!box) return;

    let daftarPenting = (typeof hitungNotifikasiPenting === "function")
        ? hitungNotifikasiPenting(regionKita, indextimPlayer) : [];

    if (daftarPenting.length === 0) {
        box.innerHTML = `<div class="notif-empty">Belum ada hal mendesak. Aman 👍</div>`;
        return;
    }

    box.innerHTML = daftarPenting
        .map(teks => `<div class="notif-item"><span class="notif-item__teks">${teks}</span></div>`)
        .join("");
}

window.bukaBeritaLengkap = function () {
    let container = getEl("listBeritaFull");
    if (!container) return;

    // Bersihkan kontainer sebelum diisi ulang
    container.innerHTML = "";

    // Cek kalau belum ada berita sama sekali
    if (bankBerita.length === 0) {
        container.innerHTML =
            "<div style='text-align:center; color:#666; margin-top:20px;'>Arsip berita kosong.</div>";
    } else {
        // 1. Siapkan meja kerja (DocumentFragment)
        let fragment = document.createDocumentFragment();

        bankBerita.forEach(b => {
            // 2. Bikin elemen bungkus luar (div) untuk tiap berita
            let div = document.createElement("div");
            div.className = "news-item";
            // Pindahin inline style ke objek style cssText biar rapi
            div.style.cssText =
                "margin-bottom: 12px; border-bottom: 1px dashed var(--border-md); padding-bottom: 8px;";

            // 3. Rakit isi dalam beritanya
            div.innerHTML = `
                <div class="news-date" style="color:#888; font-size:10px; margin-bottom: 4px; font-weight: bold;">📅 ${b.tanggal}</div>
                <div class="news-text" style="color:#5C6472; font-size:12px; line-height: 1.4;">${b.teks}</div>
            `;

            // 4. Taruh di meja kerja
            fragment.appendChild(div);
        });

        // 5. Tembak semua berita ke layar sekaligus
        container.appendChild(fragment);
    }

    // Tampilkan modal pop-up berita dan kunci scroll layar belakang
    getEl("modalBeritaLengkap").classList.remove("sembunyi");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
};

window.tutupBerita = function () {
    getEl("modalBeritaLengkap").classList.add("sembunyi");
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "";
};

function bukaModal(judul, pesan, warnaGaris = "#5B3DF5") {
    getEl("modalTitle").innerText = judul;
    getEl("modalTitle").style.color = warnaGaris;
    document
        .querySelector(".modal-box")
        .style.setProperty("--garis", warnaGaris);
    getEl("modalDesc").innerHTML = pesan;
    getEl("customModal").classList.remove("sembunyi");
}
function tutupModal() {
    getEl("customModal").classList.add("sembunyi");
}

// Toggle 4 tab di layar Roster Tim: Statistik / Fanbase / Mental / Roster.
// Semua panel tetap di-render seperti biasa (data JS gak nunggu tab diklik),
// cuma visibility-nya yang di-switch lewat class .aktif -- jadi gak ada
// risiko konten kosong pas pindah tab.
window.gantiTabRoster = function (nama) {
    document.querySelectorAll(".roster-tab").forEach(el => {
        el.classList.toggle("aktif", el.dataset.tab === nama);
    });
    document.querySelectorAll(".roster-panel").forEach(el => {
        el.classList.toggle("aktif", el.id === "rosterPanel-" + nama);
    });
};

// ==========================================================
// MODAL JUARA DUNIA / LIGA — popup perayaan premium
// Dipisah total dari bukaModal() generik (gaya visualnya beda
// jauh: panggung gelap + confetti + glow, bukan kartu putih
// biasa) supaya gak ganggu modal-modal lain yang numpang ke
// #customModal / .modal-box.
//
// tier yang didukung:
//   "world-gold"  -> M7 World Championship (trophy emas, ambient emas)
//   "world-cyan"  -> MSC x EWC             (trophy emas, ambient cyan)
//   "mpl"         -> Juara MPL regional    (trophy emas, ambient violet)
//   "len"         -> Juara LEN             (medal perunggu, ambient hijau)
//   "dev"         -> Juara MDL / MAL MY    (medal perak, ambient biru)
// ==========================================================
const CHAMP_TIER_CONFIG = {
    "world-gold": { stageClass: "",               eyebrow: "World Champion",       icon: "fa-trophy", iconClass: "" },
    "world-cyan": { stageClass: "champ-stage--cyan",   eyebrow: "World Champion",       icon: "fa-trophy", iconClass: "" },
    "mpl":        { stageClass: "champ-stage--violet", eyebrow: "Regional Champion",    icon: "fa-trophy", iconClass: "" },
    "len":        { stageClass: "champ-stage--green",  eyebrow: "Liga Esports Nasional", icon: "fa-medal",  iconClass: "champ-glow__circle--bronze" },
    "dev":        { stageClass: "champ-stage--blue",   eyebrow: "Development League",    icon: "fa-medal",  iconClass: "champ-glow__circle--silver" }
};

function bukaModalJuaraDunia(namaTim, subtitleText, tier, judulBesar) {
    let cfg = CHAMP_TIER_CONFIG[tier] || CHAMP_TIER_CONFIG["world-gold"];
    let stage = getEl("champStage");
    if (!stage) return;

    stage.className = "champ-stage" + (cfg.stageClass ? " " + cfg.stageClass : "");
    // buang confetti lama (kalau modal ini dibuka lagi di sesi yang sama)
    stage.querySelectorAll(".champ-confetti").forEach(el => el.remove());

    getEl("champEyebrow").textContent = cfg.eyebrow;
    let iconEl = getEl("champIcon");
    iconEl.className = `fa-solid ${cfg.icon}`;
    getEl("champGlowCircle").className = "champ-glow__circle" + (cfg.iconClass ? " " + cfg.iconClass : "");
    stage.querySelector(".champ-title").textContent = judulBesar || "JUARA DUNIA!";
    getEl("champTeam").textContent = namaTim;
    getEl("champSub").textContent = subtitleText;

    // confetti random (warna & posisi beda tiap kali dibuka)
    const warnaConfetti = ["#F5D67A", "#C9971F", "#7DE0F0", "#0891B2", "#ffffff"];
    for (let i = 0; i < 18; i++) {
        let c = document.createElement("div");
        c.className = "champ-confetti";
        c.style.left = (Math.random() * 100) + "%";
        c.style.background = warnaConfetti[Math.floor(Math.random() * warnaConfetti.length)];
        c.style.animationDuration = (2.5 + Math.random() * 2) + "s";
        c.style.animationDelay = (Math.random() * 2) + "s";
        c.style.transform = `rotate(${Math.random() * 360}deg)`;
        stage.appendChild(c);
    }

    getEl("modalJuara").classList.remove("sembunyi");
}
window.bukaModalJuaraDunia = bukaModalJuaraDunia;

function tutupModalJuara() {
    getEl("modalJuara").classList.add("sembunyi");
}
window.tutupModalJuara = tutupModalJuara;

// ==========================================================
// MODAL KONTRAK SPONSOR DITANDATANGANI — light celebratory
// (Opsi C: glow ijo lembut + confetti tipis, gak seheboh
// modal Juara Dunia karena event ini bisa berkali-kali per
// musim, beda sama juara yang cuma sekali-dua kali)
// ==========================================================
function bukaModalKontrakSponsor(namaSponsor, namaSlot, durasiMusim, danaCairRp, teksPenaltiHtml) {
    let stage = getEl("sponsorSignedStage");
    if (!stage) return;

    stage.querySelectorAll(".sponsor-signed-confetti").forEach(el => el.remove());

    getEl("sponsorSignedDesc").innerHTML = `<b>${namaSponsor}</b> sepakat menjadi Sponsor ${namaSlot} dengan durasi <b>${durasiMusim} Musim</b>.`;
    getEl("sponsorSignedDana").textContent = `Rp ${(danaCairRp / 1000000).toFixed(1)} Jt`;

    let warnEl = getEl("sponsorSignedWarning");
    if (teksPenaltiHtml) {
        warnEl.innerHTML = teksPenaltiHtml;
        warnEl.classList.remove("sembunyi");
    } else {
        warnEl.innerHTML = "";
        warnEl.classList.add("sembunyi");
    }

    const warnaConfetti = ["#00B37E", "#7CE9C6", "#5B3DF5", "#C9971F"];
    for (let i = 0; i < 10; i++) {
        let c = document.createElement("div");
        c.className = "sponsor-signed-confetti";
        c.style.left = (Math.random() * 100) + "%";
        c.style.background = warnaConfetti[Math.floor(Math.random() * warnaConfetti.length)];
        c.style.animationDuration = (2 + Math.random() * 1.5) + "s";
        c.style.animationDelay = (Math.random() * 1.5) + "s";
        stage.appendChild(c);
    }

    getEl("modalKontrakSponsor").classList.remove("sembunyi");
}
window.bukaModalKontrakSponsor = bukaModalKontrakSponsor;

function tutupModalKontrakSponsor() {
    getEl("modalKontrakSponsor").classList.add("sembunyi");
}
window.tutupModalKontrakSponsor = tutupModalKontrakSponsor;

//Kelompok UI Profil & Nego
// [UPDATE] Grafik OVR gaya baru: kurva smooth + area gradient Arcane Violet,
// grid tipis abu-abu senada tema League Ops Desk, titik terakhir ditonjolkan.
function gambarGrafikOvr(canvasId, dataPoints) {
    let canvas = getEl(canvasId);
    if (!canvas) return;
    let ctx = canvas.getContext("2d");

    // Render tajam di layar HiDPI (retina) tanpa ngubah ukuran CSS-nya.
    // [FIX] Fungsi ini kadang kepanggil SEBELUM modal-nya di-unhide (canvas
    // masih display:none -> clientWidth/Height = 0), jadi fallback ke atribut
    // width/height bawaan <canvas> biar grafik gak collapse jadi 0x0.
    let dpr = window.devicePixelRatio || 1;
    let wCss = canvas.clientWidth || parseInt(canvas.getAttribute("width"), 10) || 280;
    let hCss = canvas.clientHeight || parseInt(canvas.getAttribute("height"), 10) || 110;
    canvas.width = wCss * dpr;
    canvas.height = hCss * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let w = wCss, h = hCss;
    let padX = 10, padTop = 14, padBottom = 12;
    ctx.clearRect(0, 0, w, h);

    // 1. Grid horizontal tipis (senada palet netral, bukan hijau tua)
    ctx.strokeStyle = "rgba(18,21,28,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        let y = padTop + (i * (h - padTop - padBottom)) / 3;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(w - padX, y);
        ctx.stroke();
    }

    if (!dataPoints || dataPoints.length === 0) return;

    let min = Math.min(...dataPoints) - 2;
    let max = Math.max(...dataPoints) + 2;
    if (min === max) { min -= 3; max += 3; }
    let range = max - min;

    let plotW = w - padX * 2;
    let plotH = h - padTop - padBottom;
    let stepX = plotW / Math.max(1, dataPoints.length - 1);
    let pts = dataPoints.map((val, i) => ({
        x: padX + i * stepX,
        y: padTop + plotH - ((val - min) / range) * plotH
    }));

    // Helper: garis kurva smooth pakai quadratic bezier lewat titik tengah antar node
    function jalurSmooth(ctxPath) {
        ctxPath.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < pts.length - 1; i++) {
            let midX = (pts[i].x + pts[i + 1].x) / 2;
            let midY = (pts[i].y + pts[i + 1].y) / 2;
            ctxPath.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        let last = pts[pts.length - 1];
        ctxPath.lineTo(last.x, last.y);
    }

    // 2. Area gradient di bawah kurva
    if (pts.length > 1) {
        let grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
        grad.addColorStop(0, "rgba(91,61,245,0.22)");
        grad.addColorStop(1, "rgba(91,61,245,0.0)");
        ctx.beginPath();
        jalurSmooth(ctx);
        ctx.lineTo(pts[pts.length - 1].x, h - padBottom);
        ctx.lineTo(pts[0].x, h - padBottom);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // 3. Garis kurva utama, warna aksen Arcane Violet
    ctx.beginPath();
    jalurSmooth(ctx);
    ctx.strokeStyle = "#5B3DF5";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // 4. Titik-titik: node biasa halus, titik terakhir ditonjolkan (ring aksen)
    pts.forEach((pt, i) => {
        let isLast = i === pts.length - 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isLast ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? "#5B3DF5" : "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = isLast ? 0 : 1.5;
        ctx.strokeStyle = "#5B3DF5";
        if (!isLast) ctx.stroke();
        if (isLast) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(91,61,245,0.25)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

window.bukaProfilPemain = function (tipe, val, namaTimLain) {
    let p;
    let indexAsli = -1;
    if (tipe === "ROSTER") {
        p = rosterKita.find(x => x.nama === val);
        indexAsli = rosterKita.findIndex(x => x.nama === val);
    } else if (tipe === "TRANSFER") {
        p = pemainTransfer[val];
        indexAsli = val;
    } else if (tipe === "TIMLAIN") {
        // Cari pemain dari database tim lain
        // FIX FASE 15: cek semua 11 database, bukan cuma 4 MPL
        let timLainObj = (typeof cariTimAsliDiDatabase === "function")
            ? cariTimAsliDiDatabase(namaTimLain)
            : null;
        if (!timLainObj) {
            let semuaTim = [
                ...daftarTim,
                ...daftarTimPH,
                ...daftarTimMY,
                ...daftarTimSG
            ];
            timLainObj = semuaTim.find(t => t.nama === namaTimLain);
        }
        p = timLainObj.roster.find(x => x.nama === val);
    }

    let isScouted = tipe === "ROSTER" ? true : p.scouted === true;

    // --- SISTEM AUTO-GENERATE ATRIBUT YANG KOSONG ---
    if (p.potensi === undefined || p.mekanik === undefined) {
        let base = p.ovr ? p.ovr : 65;
        p.mekanik = base + (Math.floor(Math.random() * 7) - 3);
        p.makro = base + (Math.floor(Math.random() * 7) - 3);
        p.mental = base + (Math.floor(Math.random() * 7) - 3);
        p.spesialis = base + (Math.floor(Math.random() * 7) - 3);
        p.potensi = base + (Math.floor(Math.random() * 10) + 3);

        if (p.mekanik > 99) p.mekanik = 99;
        if (p.makro > 99) p.makro = 99;
        if (p.mental > 99) p.mental = 99;
        if (p.spesialis > 99) p.spesialis = 99;
        if (p.potensi > 99) p.potensi = 99;

        // [FIX] p.potensi baru ke-generate DI SINI (lazy, pas kartu pemain
        // pertama kali dibuka) -- padahal p.harga udah kehitung duluan pas
        // roster di-generate (potensi masih undefined saat itu, jadi faktor
        // potensi selalu dianggap 1 / gak ada premi wonderkid). Sekarang
        // harga & gaji di-refresh ulang begitu potensi asli udah ketahuan.
        if (typeof hitungHargaPasar === "function" && p.ovr) {
            p.harga = hitungHargaPasar(p);
            p.gaji = Math.floor(p.harga * 0.15);
        }
    }

    getEl("profilNama").innerText = p.nama;
    if (getEl("profilAvatar")) {
        getEl("profilAvatar").innerText = String(p.nama || "?").trim().slice(0, 2).toUpperCase();
    }
    getEl("profilRole").innerText = p.role;
    getEl("profilUmur").innerText = `${p.umur} Thn`;

    getEl("profilPotensi").innerText = isScouted ? p.potensi : "?";
    getEl("profilOvr").innerText = isScouted ? p.ovr : "?";
    getEl("profilMekanik").innerText = isScouted ? p.mekanik : "?";
    getEl("profilMakro").innerText = isScouted ? p.makro : "?";
    getEl("profilMental").innerText = isScouted ? p.mental : "?";
    getEl("profilSpesialis").innerText = isScouted ? p.spesialis : "?";
    syncProfilAttrBars();

    const daftarBendera = [
        "🇮🇩 Indonesia",
        "🇵🇭 Filipina",
        "🇲🇾 Malaysia",
        "🇸🇬 Singapura",
        "🇰🇭 Kamboja",
        "🇲🇲 Myanmar",
        "🇹🇷 Turkiye",
        "🇺🇸 USA",
        "🇷🇺 Rusia",
        "🇧🇷 Brazil",
        "🇰🇷 Korea Selatan",
        "🇯🇵 Jepang"
    ];
    if (!p.negara || p.negara === "undefined" || p.negara.includes("Global")) {
        p.negara =
            daftarBendera[Math.floor(Math.random() * daftarBendera.length)];
    }
    getEl("profilNegara").innerText = p.negara;

    // [DIHAPUS] Tampilan mood/moral di modal profil pemain sengaja
    // gak ditampilin lagi (permintaan user) -- indikator moral tetap
    // ada & jalan di kartu roster (lihat emojiMoral di renderRosterList),
    // dan tetap dipakai buat perhitungan chemistry di script.js.
    if (tipe === "ROSTER" && p.moral === undefined) p.moral = 100;
    getEl("profilMoral").classList.add("sembunyi");

    let elSifat = getEl("profilSifat");
    let sifatPemain = p.sifat ? p.sifat : "Normal";
    if (sifatPemain === "Pekerja Keras") {
        elSifat.className = "badge-sifat sifat-pekeras";
        elSifat.innerText = "🔥 PEKERJA KERAS";
    } else if (sifatPemain === "Malas") {
        elSifat.className = "badge-sifat sifat-malas";
        elSifat.innerText = "💤 MALAS";
    } else {
        elSifat.className = "badge-sifat sifat-normal";
        elSifat.innerText = "⚖️ NORMAL";
    }

    if (tipe === "ROSTER") {
        getEl("boxTrendPerforma").classList.remove("sembunyi");
        if (p.trendText) {
            getEl("profilTrendStatus").innerText = p.trendText;
            getEl("profilTrendStatus").style.color = p.trendColor;
        } else {
            getEl("profilTrendStatus").innerText = "➖ Belum Ada Evaluasi";
            getEl("profilTrendStatus").style.color = "#888";
        }
        if (!p.historyOvr) p.historyOvr = [p.ovr];
        gambarGrafikOvr("canvasTrendPerforma", p.historyOvr);
    } else {
        getEl("boxTrendPerforma").classList.add("sembunyi");
    }

    // --- RENDER RIWAYAT KARIR (OPTIMIZED WITH DOCUMENTFRAGMENT) ---
    let containerKarir = getEl("profilKarir");
    containerKarir.innerHTML = ""; // Bersihkan kontainer dari sisa render sebelumnya

    if (p.riwayatKarir && p.riwayatKarir.length > 0) {
        // 1. Siapkan meja kerja gaib (DocumentFragment)
        let fragmentKarir = document.createDocumentFragment();

        p.riwayatKarir.forEach((k, index) => {
            let isLast = index === p.riwayatKarir.length - 1;
            let textTahun = "";

            // Jika tahun gabung dan selesai sama (contoh: cuma main 1 musim)
            if (k.tahunAwal === k.tahunAkhir) {
                textTahun = isLast
                    ? `${k.tahunAwal}-Sekarang`
                    : `${k.tahunAwal}`;
            } else {
                // Jika bertahun-tahun di tim yang sama
                textTahun = isLast
                    ? `${k.tahunAwal}-Sekarang`
                    : `${k.tahunAwal}-${k.tahunAkhir}`;
            }

            // 2. Buat elemen bungkus row karir
            let itemKarir = document.createElement("div");
            itemKarir.style.cssText =
                "display: flex; gap: 15px; border-bottom: 1px dashed var(--border-md); padding: 6px 0; font-size: 11px;";

            // 3. Masukkan isian konten teksnya
            itemKarir.innerHTML = `
                <span style="color:#5B3DF5; width: 95px; font-weight: bold;">${textTahun}</span>
                <span style="color:#5C6472;">${k.tim}</span>
            `;

            // 4. Simpan ke fragment
            fragmentKarir.appendChild(itemKarir);
        });

        // 5. Tembak sekaligus ke DOM (Hanya 1x reflow)
        containerKarir.appendChild(fragmentKarir);
    } else {
        containerKarir.innerHTML = `<div style="color:#666; font-style:italic; padding: 5px 0; font-size: 11px;">Belum ada riwayat karir pro.</div>`;
    }

    // --- RENDER DAFTAR TROFI ---
    let containerTrofi = getEl("profilTrofi");
    containerTrofi.innerHTML = "";

    let daftarBarisTrofi = [];
    if (p.trofi) {
        if (p.trofi.mSeries > 0) daftarBarisTrofi.push({ label: "M-Series", jumlah: p.trofi.mSeries });
        if (p.trofi.msc > 0) daftarBarisTrofi.push({ label: "MSC", jumlah: p.trofi.msc });
        if (p.trofi.mpl) {
            // [FIX] Sebelumnya 9 region Tier 2 (KH/MM/MENA/TR/EECA/EA/AM/IN/WEU)
            // digabung jadi 1 baris ambigu "MPL Region Lain". Sekarang tiap
            // region yang punya trofi ditampilin sendiri-sendiri dengan nama
            // liganya. Key "other" cuma buat data lama (save dari sebelum fix
            // ini) yang udah kadung nyimpen gabungan tanpa tau asal regionnya.
            let GPR_LABEL_MPL = {
                ID: "MPL Indonesia", PH: "MPL Filipina", MY: "MPL Malaysia", SG: "MPL Singapura",
                KH: "MPL Kamboja", MM: "MPL Myanmar", MENA: "MPL MENA", TR: "MPL Turkiye",
                EECA: "MPL EECA", EA: "MPL East Asia", AM: "MPL Americas", IN: "MPL India",
                WEU: "MPL Western Europe"
            };
            Object.keys(GPR_LABEL_MPL).forEach(kode => {
                if (p.trofi.mpl[kode] > 0) daftarBarisTrofi.push({ label: GPR_LABEL_MPL[kode], jumlah: p.trofi.mpl[kode] });
            });
            if (p.trofi.mpl.other > 0) daftarBarisTrofi.push({ label: "MPL Region Lain", jumlah: p.trofi.mpl.other });
        }
        if (p.trofi.mdl > 0) daftarBarisTrofi.push({ label: "MDL", jumlah: p.trofi.mdl });
        if (p.trofi.len > 0) daftarBarisTrofi.push({ label: "LEN", jumlah: p.trofi.len });
    }

    if (daftarBarisTrofi.length > 0) {
        let fragmentTrofi = document.createDocumentFragment();
        daftarBarisTrofi.forEach(t => {
            let itemTrofi = document.createElement("div");
            itemTrofi.style.cssText =
                "display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-md); padding: 6px 0; font-size: 11px;";
            itemTrofi.innerHTML = `
                <span style="color:#5C6472;">${t.label}</span>
                <span style="color:#C9971F; font-weight:bold;">${t.jumlah}x</span>
            `;
            fragmentTrofi.appendChild(itemTrofi);
        });
        containerTrofi.appendChild(fragmentTrofi);
    } else {
        containerTrofi.innerHTML = `<div style="color:#666; font-style:italic; padding: 5px 0; font-size: 11px;">Belum pernah juara turnamen.</div>`;
    }
    // -----------------------------

    // Perbaikan format harga/gaji
    let hargaPemainFix = p.harga || p.hargaPasar || p.value || 50000000;
    if (typeof hargaPemainFix === "string")
        hargaPemainFix = parseInt(hargaPemainFix.replace(/[^0-9]/g, ""));

    getEl("profilNilaiTransfer").innerText =
        `Rp ${(hargaPemainFix / 1000000).toFixed(1)} Jt`;

    if (tipe === "TIMLAIN") {
        let gajiPemainTimLain = p.gaji || Math.floor(hargaPemainFix * 0.15);
        getEl("profilGaji").innerText =
            `Rp ${(gajiPemainTimLain / 1000000).toFixed(1)} Jt`;
        let sisaKontrakTimLain = p.sisaKontrak || p.sisaKontrakTim || p.kontrakSisa;
        getEl("profilKontrak").innerHTML =
            (typeof sisaKontrakTimLain === "number")
                ? `<span style="color:#5B3DF5;">${sisaKontrakTimLain} Musim</span>`
                : `<span style="color:#C9971F;">Terikat Kontrak</span>`;
    } else {
        getEl("profilGaji").innerText =
            `Rp ${(p.gaji / 1000000).toFixed(1)} Jt`;
        let statusKontrak =
            p.sisaKontrak <= 1
                ? `<span style="color:#E5484D;">Habis!</span>`
                : `${p.sisaKontrak} Musim`;
        getEl("profilKontrak").innerHTML =
            tipe === "ROSTER"
                ? statusKontrak
                : `<span style="color:#0891B2;">Bebas Transfer</span>`;
    }

    let btnNego = getEl("btnProfilNego");
    let btnJual = getEl("btnProfilJual");
    let btnPinjam = getEl("btnProfilPinjam"); // <-- Variabel baru
    let btnInti = getEl("btnProfilJadikanInti");

    if (tipe === "ROSTER") {
        btnInti.classList.remove("sembunyi");
        if (p.isStarter) {
            btnInti.style.background = "";
            btnInti.style.color = "";
            btnInti.classList.add("profil-btn-inti--status");
            btnInti.innerText = "⭐ SUDAH JADI STARTER";
            btnInti.disabled = true;
            btnInti.onclick = null;
        } else {
            btnInti.style.background = "";
            btnInti.style.color = "";
            btnInti.classList.remove("profil-btn-inti--status");
            btnInti.innerText = "JADIKAN STARTER UTAMA";
            btnInti.disabled = false;
            btnInti.onclick = function () {
                jadikanStarter(indexAsli);
            };
        }
        btnNego.innerText = "PERPANJANG";
        btnNego.onclick = function () {
            tutupProfil();
            bukaMejaNego("PERPANJANG", indexAsli);
        };

        // [LOAN+BUYOPTION PATCH] Tombol tebus opsi beli, cuma buat pemain
        // pinjaman yang punya klausul opsi beli aktif.
        let btnTebusOpsi = getEl("btnProfilTebusOpsi");
        if (btnTebusOpsi) {
            if (p.opsiBeliAktif) {
                btnTebusOpsi.classList.remove("sembunyi");
                btnTebusOpsi.innerText = `TEBUS OPSI BELI (Rp ${(p.opsiBeliHarga / 1000000).toFixed(1)} Jt)`;
                btnTebusOpsi.onclick = function () {
                    tutupProfil();
                    window.tebusOpsiBeli(p.nama);
                };
            } else {
                btnTebusOpsi.classList.add("sembunyi");
            }
        }

        btnPinjam.classList.remove("sembunyi"); // Munculin pas liat tim sendiri

        let countRole = rosterKita.filter(x => x.role === p.role).length;
        if (countRole > 1) {
            // Logika Tombol Daftar Transfer (Bisa Batalin)
            btnJual.classList.remove("profil-btn--disabled", "profil-btn--batal");
            if (p.statusTransfer === "TRANSFER") btnJual.classList.add("profil-btn--batal");
            btnJual.style.background = "";
            btnJual.style.color = "";
            btnJual.innerText =
                p.statusTransfer === "TRANSFER"
                    ? "BATAL TRANSFER"
                    : "DAFTAR TRANSFER";
            btnJual.disabled = false;
            btnJual.onclick = function () {
                p.statusTransfer =
                    p.statusTransfer === "TRANSFER" ? null : "TRANSFER";
                alert(
                    p.statusTransfer === "TRANSFER"
                        ? `${p.nama} masuk Daftar Transfer!`
                        : `${p.nama} ditarik dari bursa.`
                );
                tutupProfil();
                updateDashboard();
            };

            // Logika Tombol Daftar Pinjam
            btnPinjam.classList.remove("profil-btn--disabled", "profil-btn--batal");
            if (p.statusTransfer === "PINJAM") btnPinjam.classList.add("profil-btn--batal");
            btnPinjam.style.background = "";
            btnPinjam.style.color = "";
            btnPinjam.innerText =
                p.statusTransfer === "PINJAM"
                    ? "BATAL PINJAM"
                    : "DAFTAR PINJAM";
            btnPinjam.disabled = false;
            btnPinjam.onclick = function () {
                p.statusTransfer =
                    p.statusTransfer === "PINJAM" ? null : "PINJAM";
                alert(
                    p.statusTransfer === "PINJAM"
                        ? `${p.nama} masuk Daftar Pinjam!`
                        : `${p.nama} ditarik dari bursa pinjam.`
                );
                tutupProfil();
                updateDashboard();
            };
        } else {
            btnJual.classList.remove("profil-btn--batal");
            btnJual.classList.add("profil-btn--disabled");
            btnJual.style.background = "";
            btnJual.style.color = "";
            btnJual.innerText = "LIMIT ROLE";
            btnJual.disabled = true;
            btnJual.onclick = null;
            btnPinjam.classList.remove("profil-btn--batal");
            btnPinjam.classList.add("profil-btn--disabled");
            btnPinjam.style.background = "";
            btnPinjam.style.color = "";
            btnPinjam.innerText = "LIMIT ROLE";
            btnPinjam.disabled = true;
            btnPinjam.onclick = null;
        }
    } else if (tipe === "TRANSFER") {
        btnInti.classList.add("sembunyi");
        btnPinjam.classList.add("sembunyi");
        // 👇 UBAH TEKS TOMBOL JADI FREE AGENT
        btnNego.innerText = "REKRUT (FREE AGENT)";
        btnNego.onclick = function () {
            tutupProfil();
            bukaMejaNego("BELI", indexAsli);
        };
        // 👇 TOMBOL TRIAL (menggantikan INTAI)
        let sudahDiTrialTransfer = window.trialAktif && window.trialAktif.some(t => t.pemain.nama === p.nama);
        btnJual.classList.remove("profil-btn--disabled", "profil-btn--batal");
        if (sudahDiTrialTransfer) {
            btnJual.style.background = "var(--accent-dim)";
            btnJual.style.color = "var(--accent)";
            btnJual.innerText = "SEDANG TRIAL";
            btnJual.disabled = true;
            btnJual.onclick = null;
        } else {
            btnJual.style.background = "#2563EB";
            btnJual.style.color = "#fff";
            btnJual.innerText = "TRIAL";
            btnJual.disabled = false;
            btnJual.onclick = function () {
                tutupProfil();
                window.mulaiTrialDariUI(p.nama, "TRANSFER", indexAsli);
            };
        }
    } else if (tipe === "TIMLAIN") {
        btnInti.classList.add("sembunyi");
        btnNego.innerText = "BELI (BUYOUT)";

        btnNego.onclick = function () {
            tutupProfil();
            prosesBeliPemainLain(p.nama, namaTimLain, hargaPemainFix);
        };

        // [LOAN+BUYOPTION PATCH] Tombol PINJAM cuma muncul kalau tim lawan
        // satu tier sama tim player (MPL-MPL / MDL-MAL-MDL-MAL), dan gak
        // pernah muncul kalau tim player ada di LEN (gak punya sistem pinjam).
        let bolehPinjam = (typeof window.cekTierLoanCocok === "function")
            ? window.cekTierLoanCocok(namaTimLain)
            : false;
        if (bolehPinjam) {
            btnPinjam.classList.remove("sembunyi", "profil-btn--disabled", "profil-btn--batal");
            btnPinjam.style.background = "#E8720C";
            btnPinjam.style.color = "#fff";
            btnPinjam.innerText = "PINJAM";
            btnPinjam.disabled = false;
            btnPinjam.onclick = function () {
                tutupProfil();
                window.prosesPinjamPemainLain(p.nama, namaTimLain, hargaPemainFix);
            };
        } else {
            btnPinjam.classList.add("sembunyi");
        }

        // 👇 TOMBOL TRIAL untuk pemain tim lain (menggantikan INTAI & PINJAM)
        let sudahDiTrialTimLain = window.trialAktif && window.trialAktif.some(t => t.pemain.nama === p.nama);
        btnJual.classList.remove("profil-btn--disabled", "profil-btn--batal");
        if (sudahDiTrialTimLain) {
            btnJual.style.background = "var(--accent-dim)";
            btnJual.style.color = "var(--accent)";
            btnJual.innerText = "SEDANG TRIAL";
            btnJual.disabled = true;
            btnJual.onclick = null;
        } else {
            btnJual.style.background = "#2563EB";
            btnJual.style.color = "#fff";
            btnJual.innerText = "TRIAL";
            btnJual.disabled = false;
            btnJual.onclick = function () {
                tutupProfil();
                window.mulaiTrialDariUI(p.nama, "TIMLAIN", null, namaTimLain, hargaPemainFix);
            };
        }
    }
    gantiTabProfil("ringkasan"); // [UPDATE] selalu reset ke tab Ringkasan tiap buka profil pemain baru
    getEl("modalProfil").classList.remove("sembunyi");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
};

// [UPDATE] Ganti tab aktif di halaman Profil Pemain (Ringkasan/Atribut/Karir).
window.gantiTabProfil = function (namaTab) {
    let peta = { ringkasan: "profilTabRingkasan", atribut: "profilTabAtribut", karir: "profilTabKarir" };
    let panelAktifId = peta[namaTab];
    if (!panelAktifId) return;

    document.querySelectorAll("#profilTabbar button").forEach(btn => {
        btn.classList.toggle("profil-tab--active", btn.dataset.profiltab === namaTab);
    });
    Object.values(peta).forEach(idPanel => {
        let panel = getEl(idPanel);
        if (panel) panel.classList.toggle("profil-tab--active", idPanel === panelAktifId);
    });
};

window.tutupProfil = function () {
    let modalProfil = getEl("modalProfil");
    if (modalProfil) modalProfil.classList.add("sembunyi");
    // Null-safe check: modalInfoTim mungkin tidak ada di semua versi game
    let modalInfoTim = getEl("modalInfoTim");
    if (!modalInfoTim || modalInfoTim.classList.contains("sembunyi")) {
        document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "";
    }
};

// ==========================================
// FUNGSI BUKA & TUTUP MODAL STAFF (UNIFIED)
// ==========================================
window.bukaProfilStaff = function (tipe, val) {
    let s = null;
    let btnRekrut = getEl("btnProfilRekrutStaff");

    // 1. Ambil data staff tergantung dari mana dia diklik
    if (tipe === "TIM") {
        s = staffKita[val];
        if (!s) return;

        // --- UBAH LABEL & NAMPILIN SISA KONTRAK ---
        getEl("labelStaffHarga").innerText = "Sisa Kontrak:";
        // Asumsinya pas deal proposal, lu nyimpen durasinya di variabel sisaKontrak
        let sisa =
            typeof s.sisaKontrak !== "undefined"
                ? s.sisaKontrak + " Musim"
                : "Belum Diset";
        getEl("profilStaffHarga").innerText = sisa;

        btnRekrut.innerText = "PECAT STAFF";
        btnRekrut.style.background = "#E5484D";
        btnRekrut.onclick = function () {
            pecatStaff(val);
            tutupProfilStaff();
        };
    } else if (tipe === "BURSA") {
        s = bursaStaff[val];
        if (!s) return;

        // --- UBAH LABEL JADI HARGA REKRUT KALO DI BURSA ---
        getEl("labelStaffHarga").innerText = "Nilai Kontrak:";
        getEl("profilStaffHarga").innerText =
            `Rp ${(s.harga / 1000000).toFixed(1)} Jt`;

        btnRekrut.innerText = "AJUKAN PROPOSAL";
        btnRekrut.style.background = "#00B37E";
        btnRekrut.onclick = function () {
            bukaModalProposalPelatih(val);
        };
    }

    // 2. Tembak info dasar ke UI
    getEl("profilStaffNama").innerText = s.nama;
    getEl("profilStaffRole").innerText = s.role;

    const daftarBenderaStaff = [
        "🇮🇩 Indonesia",
        "🇵🇭 Filipina",
        "🇲🇾 Malaysia",
        "🇸🇬 Singapura",
        "🇹🇷 Turkiye",
        "🇺🇸 USA",
        "🇰🇷 Korea Selatan"
    ];
    if (!s.negara || s.negara === "undefined") {
        s.negara =
            daftarBenderaStaff[
                Math.floor(Math.random() * daftarBenderaStaff.length)
            ];
    }
    let elNegaraStaff = getEl("profilStaffNegara");
    if (elNegaraStaff) elNegaraStaff.innerText = s.negara;
    let elSifatStaff = getEl("profilStaffSifat");
    if (elSifatStaff) elSifatStaff.innerText = "🧠 " + (s.kepribadian || "Normal");
    getEl("profilStaffBuff").innerText = `+${s.buffPower} POWER TIM`;
    getEl("profilStaffGaji").innerText =
        `Rp ${(s.gaji / 1000000).toFixed(1)} Jt`;

    // 3. Tembak ATRIBUT KHUSUS (Integrasi dengan script.js)
    if (!s.atribut && typeof generateAtributStaff === "function") {
        s.atribut = generateAtributStaff(s.role);
    }
    if (typeof renderAtributUIStaff === "function") {
        renderAtributUIStaff(s);
    }

    getEl("modalProfilStaff").classList.remove("sembunyi");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
};

window.tutupProfilStaff = function () {
    getEl("modalProfilStaff").classList.add("sembunyi");
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "";
};

window.bukaMejaNego = function (tipe, index) {
    if (tipe === "BELI" && !apakahTransferTerbuka()) {
        bukaModal(
            "TRANSFER DITUTUP",
            "Bursa transfer sedang tidak aktif.",
            "#E5484D"
        );
        return;
    }
    let ghLimit = databaseGH[levelGH - 1].limitRoster;
    if (tipe === "BELI" && rosterKita.length >= ghLimit) {
        bukaModal(
            "ROSTER PENUH 🚫",
            `Kapasitas GH Level ${levelGH} maksimal <b>${ghLimit} Pemain</b>!`,
            "#E5484D"
        );
        return;
    }
    let p = tipe === "BELI" ? pemainTransfer[index] : rosterKita[index];
    if (p.kesempatanNego === undefined) p.kesempatanNego = 3;
    if (p.kesempatanNego <= 0) {
        bukaModal(
            "DIBLACKLIST! 🚫",
            `<b>${p.nama}</b> udah muak denger tawaran lu.`,
            "#E5484D"
        );
        return;
    }
    if (tipe === "BELI" && p.sudahTransfer) {
        bukaModal(
            "GAGAL NEGO",
            `<b>${p.nama}</b> sudah pernah melakukan transfer musim ini. Sesuai regulasi MPL, dia baru bisa pindah tim lagi musim depan.`,
            "#E5484D"
        );
        return;
    }

    dataNego.tipe = tipe;
    dataNego.index = index;
    dataNego.pemain = p;
    dataNego.demandTransfer = 0;
    if (tipe === "BELI") {
        // Free Agent minta gaji 120% karena statusnya gratisan!
        dataNego.demandGaji = Math.floor(p.gaji * 1.2);
        dataNego.demandDurasi = 2;
    } else {
        dataNego.demandGaji = Math.floor(p.gaji * 1.1);
        dataNego.demandDurasi = 1;
    }

    // Sembunyiin UI Transfer karena ini bursa agen bebas / perpanjang
    getEl("barisDemandTransfer").classList.add("sembunyi");
    getEl("grupNegoTransfer").classList.add("sembunyi");

    let tampilOvr = tipe === "BELI" && !p.scouted ? "?" : p.ovr;
    getEl("negoPlayerInfo").innerHTML =
        `${p.nama} (OVR: ${tampilOvr})<br><span style="font-size:11px; color:#E8720C;">Sisa Nego: <b>${p.kesempatanNego}x</b></span>`;
    getEl("negoDemandGaji").innerText =
        `Rp ${(dataNego.demandGaji / 1000000).toFixed(1)} Jt`;
    getEl("negoDemandDurasi").innerText = dataNego.demandDurasi;

    getEl("inputNegoGaji").value = "";
    getEl("inputNegoDurasi").value = "";
    getEl("modalNego").classList.remove("sembunyi");
};

window.tutupNego = function () {
    getEl("modalNego").classList.add("sembunyi");
    getEl("inputNegoDurasi").disabled = false;
};

// ==========================================
// GLOBAL: TAB SWITCHER FOR PER-GAME STATS
window.switchStatTab = function(idx) {
    document.querySelectorAll(".stat-game-panel").forEach(function(el, i) {
        el.style.display = (i === idx) ? "block" : "none";
    });
    document.querySelectorAll("[id^='statTab_']").forEach(function(btn, i) {
        btn.classList.toggle("aktif", i === idx);
    });
};

// MODAL HASIL PERTANDINGAN (HIGHLIGHT & MVP)
// ==========================================
window.bukaHasilMatch = function (data) {
    let { home, away, skorHome, skorAway, gameLog, mvp, mvpTim,
          statsHome, statsAway, gameDuration, awards, timMenang, timKalah, perGameStats } = data;

    let isHomePlayer = home.nama === (typeof timPlayer !== "undefined" ? timPlayer : "");
    let playerMenang = timMenang && timMenang.nama === (typeof timPlayer !== "undefined" ? timPlayer : "");

    // ============================
    // 1. HEADER SKOR
    // ============================
    let warnaHome = skorHome > skorAway ? "#00B37E" : "#E5484D";
    let warnaAway = skorAway > skorHome ? "#00B37E" : "#E5484D";
    let labelHome = skorHome > skorAway ? "VICTORY" : "DEFEAT";
    let labelAway = skorAway > skorHome ? "VICTORY" : "DEFEAT";

    getEl("hasilMatchSkor").innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:5px; flex:1;">
            <div class="hasil-team-label" style="color:${warnaHome};">${labelHome}</div>
            <img src="${home.logo}" style="width:44px; height:44px; border-radius:var(--radius-sm); object-fit:cover; background:#F7F9FC;" onerror="this.src='https://ui-avatars.com/api/?name=${home.nama}&background=1e1e1e&color=fff'">
            <span class="hasil-team-name">${home.nama}</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:3px; padding:0 8px;">
            <div class="hasil-skor-angka">${skorHome} — ${skorAway}</div>
            <div class="hasil-skor-label">Regular Season</div>
            ${gameDuration ? `<div class="hasil-skor-duration">⏱ ${gameDuration}</div>` : ""}
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:5px; flex:1;">
            <div class="hasil-team-label" style="color:${warnaAway};">${labelAway}</div>
            <img src="${away.logo}" style="width:44px; height:44px; border-radius:var(--radius-sm); object-fit:cover; background:#F7F9FC;" onerror="this.src='https://ui-avatars.com/api/?name=${away.nama}&background=1e1e1e&color=fff'">
            <span class="hasil-team-name">${away.nama}</span>
        </div>
    `;

    // ============================
    // 2. HIGHLIGHT PER GAME
    // ============================
    // Pisahin entri "game beneran" (punya g.tim = nama tim pemenang game itu)
    // dari narasi pembuka/penutup dramatis (g.tim === "", cuma ada di
    // simulasikanSeriesDramatis buat playoff/MSC/M-Series). Yang beneran
    // game masuk timeline reel (dot + garis penghubung), narasi tampil
    // sebagai kutipan simpel di luar reel biar gak keitung sebagai "game".
    let namaTimKita = typeof timPlayer !== "undefined" ? timPlayer : "";
    let htmlNarasiSebelum = "";
    let htmlReel = "";
    let htmlNarasiSesudah = "";
    let sudahAdaGame = false;
    let gameKe = 0;

    gameLog.forEach((g, i) => {
        let adalahGameNyata = g.tim === home.nama || g.tim === away.nama;
        if (adalahGameNyata) {
            sudahAdaGame = true;
            gameKe++;
            let menangKita = g.tim === namaTimKita;
            htmlReel += `
                <div class="highlight-item${menangKita ? " win" : ""}" style="animation-delay: ${gameKe * 0.12}s">
                    <div class="highlight-dot"></div>
                    <div class="highlight-card">
                        <span class="highlight-game-label">GAME ${gameKe}</span>
                        <div class="highlight-text">${g.teks}</div>
                    </div>
                </div>
            `;
        } else {
            let potongan = `<div class="highlight-narasi" style="animation-delay: ${i * 0.12}s">${g.teks}</div>`;
            if (sudahAdaGame) htmlNarasiSesudah += potongan;
            else htmlNarasiSebelum += potongan;
        }
    });

    let htmlHighlight = htmlNarasiSebelum;
    if (htmlReel) htmlHighlight += `<div class="highlight-reel">${htmlReel}</div>`;
    htmlHighlight += htmlNarasiSesudah;
    getEl("hasilMatchHighlight").innerHTML = htmlHighlight;

    // ============================
    // 3. STATISTIK AFTER MATCH (PER GAME)
    // ============================
    let statHtml = "";

    function buildStatBar(labelKiri, valKiri, valKanan, warnaBatang) {
        let total = valKiri + valKanan;
        let pctKiri = total > 0 ? Math.round((valKiri / total) * 100) : 50;
        let pctKanan = 100 - pctKiri;
        let numKiri = valKiri.toLocaleString("id-ID");
        let numKanan = valKanan.toLocaleString("id-ID");
        return `
        <div style="margin-bottom:11px;">
            <div class="stat-bar-label-center">${labelKiri}</div>
            <div style="display:flex; align-items:center; gap:7px;">
                <span class="stat-val" style="text-align:right;">${numKiri}</span>
                <div style="flex:1; height:5px; background:#F7F9FC; border-radius:3px; overflow:hidden; display:flex;">
                    <div style="width:${pctKiri}%; background:${warnaBatang}; border-radius:3px 0 0 3px; transition:width 0.55s ease;"></div>
                    <div style="width:${pctKanan}%; background:#E9ECF2; border-radius:0 3px 3px 0;"></div>
                </div>
                <span class="stat-val">${numKanan}</span>
            </div>
        </div>`;
    }

    function buildSingleGameStat(gameStats, gameIdx) {
        let sh = gameStats.statsHome;
        let sa = gameStats.statsAway;
        if (!sh || !sa) return "";
        let objHome = `${sh.turtle}/${sh.lord}/${sh.turret}`;
        let objAway = `${sa.turtle}/${sa.lord}/${sa.turret}`;
        let durHtml = gameStats.gameDuration ? `<div style="font-size:9px; color:#E5484D; text-align:center; margin-bottom:8px;">⏱ ${gameStats.gameDuration}</div>` : "";
        return `
        <div id="statPanel_game_${gameIdx}" class="stat-game-panel" style="display:none;">
            ${durHtml}
            ${buildStatBar("DAMAGE DEALT",   sh.dmgDealt,  sa.dmgDealt,  "#E5484D")}
            ${buildStatBar("DAMAGE TAKEN",   sh.dmgTaken,  sa.dmgTaken,  "#E8720C")}
            ${buildStatBar("DAMAGE TO TURRET", sh.dmgTurret, sa.dmgTurret, "#00B37E")}
            <div style="margin-top:6px;">
                <div style="font-size:9px; color:#888; text-align:center; letter-spacing:0.5px; margin-bottom:4px;">TURTLE / LORD / TURRET</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:bold; color:#12151C;">${objHome}</span>
                    <span style="font-size:9px; color:#555;">vs</span>
                    <span style="font-size:12px; font-weight:bold; color:#12151C;">${objAway}</span>
                </div>
            </div>
        </div>`;
    }

    if (data.perGameStats && data.perGameStats.length > 0) {
        let pgs = data.perGameStats;
        let tabButtons = pgs.map((gs, i) => {
            let isActive = i === 0;
            let winnerLabel = gs.menangNama ? `<span style="font-size:9px;display:block;font-weight:normal;letter-spacing:0;font-family:var(--font-body);">${gs.menangNama.length > 7 ? gs.menangNama.substring(0,7)+"…" : gs.menangNama}</span>` : "";
            return `<button onclick="switchStatTab(${i})" id="statTab_${i}" class="stat-tab-btn${isActive ? " aktif" : ""}">
                GAME ${i+1}
                ${winnerLabel}
            </button>`;
        }).join("");

        let panels = pgs.map((gs, i) => buildSingleGameStat(gs, i)).join("");

        statHtml = `
        <div style="background:#F1F3F8; border:1px solid var(--border,#E9ECF2); border-radius:var(--radius-lg,12px); padding:14px 12px; margin-bottom:14px;">
            <div style="font-size:var(--text-xs,10px); font-weight:bold; letter-spacing:2px; color:var(--gold,#C9971F); text-align:center; margin-bottom:12px; font-family:'Oswald',sans-serif; text-transform:uppercase;">📊 Statistik Pertandingan</div>
            <div style="display:flex; gap:6px; margin-bottom:12px;">${tabButtons}</div>
            ${panels}
        </div>`;
    } else if (statsHome && statsAway) {
        // Fallback to old single-stat rendering
        function statBar(labelKiri, valKiri, valKanan, labelKanan, warnaBatang) {
            let total = valKiri + valKanan;
            let pctKiri = total > 0 ? Math.round((valKiri / total) * 100) : 50;
            let pctKanan = 100 - pctKiri;
            let numKiri = valKiri.toLocaleString("id-ID");
            let numKanan = valKanan.toLocaleString("id-ID");
            return `
            <div style="margin-bottom:10px;">
                <div style="font-size:9px; color:#888; text-align:center; letter-spacing:0.5px; margin-bottom:4px;">${labelKiri}</div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:11px; font-weight:bold; color:#12151C; min-width:48px; text-align:right;">${numKiri}</span>
                    <div style="flex:1; height:6px; background:#F1F3F8; border-radius:3px; overflow:hidden; display:flex;">
                        <div style="width:${pctKiri}%; background:${warnaBatang}; border-radius:3px 0 0 3px; transition:width 0.6s ease;"></div>
                        <div style="width:${pctKanan}%; background: var(--surface-4); border-radius:0 3px 3px 0;"></div>
                    </div>
                    <span style="font-size:11px; font-weight:bold; color:#12151C; min-width:48px;">${numKanan}</span>
                </div>
            </div>`;
        }
        let objHome = `${statsHome.turtle}/${statsHome.lord}/${statsHome.turret}`;
        let objAway = `${statsAway.turtle}/${statsAway.lord}/${statsAway.turret}`;
        statHtml = `
        <div style="background:#F1F3F8; border:1px solid #E9ECF2; border-radius:10px; padding:14px 12px; margin-bottom:14px;">
            <div style="font-size:10px; font-weight:bold; letter-spacing:1px; color:#C9971F; text-align:center; margin-bottom:12px; font-family:'Oswald',sans-serif;">📊 STATISTIK PERTANDINGAN</div>
            ${statBar("DAMAGE DEALT",   statsHome.dmgDealt,  statsAway.dmgDealt,  "DAMAGE DEALT",  "#E5484D")}
            ${statBar("DAMAGE TAKEN",   statsHome.dmgTaken,  statsAway.dmgTaken,  "DAMAGE TAKEN",  "#E8720C")}
            ${statBar("DAMAGE TO TURRET", statsHome.dmgTurret, statsAway.dmgTurret, "DAMAGE TO TURRET", "#00B37E")}
            <div style="margin-top:6px;">
                <div style="font-size:9px; color:#888; text-align:center; letter-spacing:0.5px; margin-bottom:4px;">TURTLE / LORD / TURRET</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:bold; color:#12151C;">${objHome}</span>
                    <span style="font-size:9px; color:#555;">vs</span>
                    <span style="font-size:12px; font-weight:bold; color:#12151C;">${objAway}</span>
                </div>
            </div>
        </div>`;
    }

    // ============================
    // 4. AWARDS SECTION
    // ============================
    let awardsHtml = "";
    if (awards) {
        function awardCard(label, warnaLabel, pemain, statLabel, statVal) {
            let nama = pemain ? pemain.nama : "-";
            let role = pemain ? (pemain.role || "") : "";
            let inisial = nama !== "-" ? nama.trim().slice(0, 2).toUpperCase() : "?";
            return `
            <div style="background:var(--surface-1); border:1px solid var(--border); border-radius:12px; padding:10px 7px; text-align:center; flex:1; min-width:0;">
                <div style="font-size:8.5px; font-weight:bold; letter-spacing:0.4px; color:${warnaLabel}; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-transform:uppercase;">${label}</div>
                <div class="award-avatar" style="border-color:${warnaLabel}; background:${warnaLabel}1F; color:${warnaLabel};">${inisial}</div>
                <div style="font-size:10px; font-weight:bold; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${nama}</div>
                <div style="font-size:8.5px; color:var(--text-3); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${role}</div>
                <div style="font-size:8px; color:var(--text-3); margin-top:2px;">${statLabel}</div>
                <div style="font-size:11px; font-weight:bold; color:${warnaLabel};">${Number(statVal).toLocaleString("id-ID")}</div>
            </div>`;
        }

        awardsHtml = `
        <div style="margin-bottom:14px;">
            <div style="font-size:var(--text-xs,10px); font-weight:bold; letter-spacing:2px; color:var(--gold,#C9971F); text-align:center; margin-bottom:10px; font-family:'Oswald',sans-serif; text-transform:uppercase;">🏅 Penghargaan</div>
            <div style="display:flex; gap:6px;">
                ${awardCard("RICH GUY",     "#C9971F", awards.richGuy?.pemain,     "Gold/Min",    awards.richGuy?.goldPerMinute    || 0)}
                ${awardCard("THE CARRY",    "#E5484D", awards.theCarry?.pemain,    "Dmg Dealt",   awards.theCarry?.dmgDealt        || 0)}
                ${awardCard("SAND BAG",     "#E8720C", awards.sandBag?.pemain,     "Dmg Taken",   awards.sandBag?.dmgTaken         || 0)}
                ${awardCard("BEST WINGMAN", "#00B37E", awards.bestWingman?.pemain, "Assists",     awards.bestWingman?.totalAssists || 0)}
            </div>
        </div>`;
    }

    // ============================
    // 5. MVP PERTANDINGAN
    // ============================
    let isMvpKita = mvpTim === (typeof timPlayer !== "undefined" ? timPlayer : "");
    let mvpHtml = `
        <div class="hasil-mvp-box__icon">🏆</div>
        <div>
            <div class="hasil-mvp-label">MVP Pertandingan</div>
            <div class="hasil-mvp-nama">${mvp.nama}</div>
            <div class="hasil-mvp-sub">${mvp.role || "Player"} · ${mvpTim}${isMvpKita ? " ⭐" : ""}</div>
        </div>`;
    getEl("hasilMatchMvp").innerHTML = mvpHtml;

    // Inject semua ke scroll body
    getEl("hasilMatchHighlight").innerHTML = htmlHighlight;
    let scrollBody = getEl("hasilMatchHighlight").parentElement;
    // Hapus elemen statistik lama kalau ada
    let oldStat = scrollBody.querySelector(".statistik-section");
    if (oldStat) oldStat.remove();
    let oldAwards = scrollBody.querySelector(".awards-section");
    if (oldAwards) oldAwards.remove();

    // Sisipkan statistik + awards setelah highlight
    if (statHtml || awardsHtml) {
        let wrapper = document.createElement("div");
        wrapper.innerHTML = statHtml + awardsHtml;
        wrapper.className = "statistik-section";
        getEl("hasilMatchHighlight").insertAdjacentElement("afterend", wrapper);
        // Init first tab if per-game stats exist
        if (data.perGameStats && data.perGameStats.length > 0) {
            let first = document.getElementById("statPanel_game_0");
            if (first) first.style.display = "block";
        }
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    getEl("modalHasilMatch").classList.remove("sembunyi");
};

window.tutupHasilMatch = function () {
    getEl("modalHasilMatch").classList.add("sembunyi");
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "";
};

window.tutupKonfirmasi = function () {
    getEl("modalKonfirmasi").classList.add("sembunyi");
    pendingJualIndex = -1;
};

//Kelompok UI Menu & Fasilitas
function tutupSubLayar() {
    document
        .querySelectorAll(".sub-layar")
        .forEach(el => el.classList.add("sembunyi"));
    getEl("layarDashboard").classList.remove("sembunyi");

    // BIKIN LAYAR DASHBOARD BALIK KE PALING ATAS
    window.scrollTo(0, 0);

    updateDashboard();
}

window.gantiTabManajemen = function (namaTab) {
    getEl("tabTim").classList.add("sembunyi");
    getEl("tabKeuangan").classList.add("sembunyi");
    getEl("tabPertandingan").classList.add("sembunyi");

    getEl("btnTabTim").classList.remove("aktif");
    getEl("btnTabKeuangan").classList.remove("aktif");
    getEl("btnTabPertandingan").classList.remove("aktif");

    let judul = getEl("judulManajemen");

    if (namaTab === "Tim") {
        getEl("tabTim").classList.remove("sembunyi");
        getEl("btnTabTim").classList.add("aktif");
        judul.innerHTML = '<i class="fa-solid fa-users"></i> ROSTER TIM';
    } else if (namaTab === "Keuangan") {
        getEl("tabKeuangan").classList.remove("sembunyi");
        getEl("btnTabKeuangan").classList.add("aktif");
        judul.innerText = "💰 KAS & SPONSOR";
        renderKas();
        window.renderSponsorUI();
    } else if (namaTab === "Pertandingan") {
        getEl("tabPertandingan").classList.remove("sembunyi");
        getEl("btnTabPertandingan").classList.add("aktif");
        judul.innerText = "📅 JADWAL & HASIL";
        renderLogSkenaMpl();
    }
    window.scrollTo(0, 0);
};

function renderFasilitas() {
    let gh = databaseGH[levelGH - 1];
    let nextGh = databaseGH[levelGH]; // Buat ngecek level selanjutnya

    let html = `
    <div class="gh-card">
        <div class="gh-card__head">
            <div class="gh-card__level">ASET SAAT INI (LEVEL ${gh.level})</div>
            <div class="gh-card__name">${gh.nama}</div>
            <div class="gh-card__desc">${gh.desc}</div>
        </div>
        <div class="gh-card__body">
            <div class="gh-stat-row">
                <span>Kapasitas Roster</span>
                <span class="gh-stat-row__val">${rosterKita.length} / ${gh.limitRoster} Orang</span>
            </div>
            <div class="gh-stat-row">
                <span>Kapasitas Staff</span>
                <span class="gh-stat-row__val">Maks. ${gh.limitStaff} Orang</span>
            </div>
            <div class="gh-stat-row gh-stat-row--last">
                <span>Biaya Perawatan</span>
                <span class="gh-stat-row__val" style="color:var(--red);">-Rp ${(gh.sewa / 1000000).toFixed(1)} Jt / Musim</span>
            </div>
        </div>
    </div>`;

    if (nextGh) {
        html += `
        <h3 class="section-title" style="margin-top:18px;">Proyek Upgrade GH</h3>
        <div class="gh-upgrade-card">
            <div class="gh-upgrade-card__title">Naik ke Level ${nextGh.level}: ${nextGh.nama}</div>
            <div class="gh-upgrade-card__cost">Biaya Renovasi: <b>Rp ${(nextGh.biayaUpgrade / 1000000).toFixed(1)} Jt</b></div>
            <button class="btn-primary-block" onclick="upgradeGH()">RENOVASI SEKARANG</button>
        </div>`;
    } else {
        html += `<div class="gh-maxed-banner">🏆 Fasilitas Gaming House Anda sudah mencapai Level Maksimal!</div>`;
    }

    // ===== SECTION AKADEMI =====
    html += `<h3 class="section-title" style="margin-top:18px;">🎓 Akademi Tim</h3>`;

    if (levelGH < 2) {
        html += `
        <div class="academy-locked">
            <div class="academy-locked__icon">🔒</div>
            <div class="academy-locked__text">Akademi terbuka mulai <b>GH Level 2</b>.</div>
            <div class="academy-locked__sub">Upgrade Gaming House untuk membuka fitur ini.</div>
        </div>`;
    } else {
        let ak = (typeof akademiKita !== "undefined") ? akademiKita : { prospek: [], levelAkademi: 1, totalLulusan: 0 };
        let labelLevel = ak.levelAkademi >= 2 ? "🌟 ELITE" : "⚡ DASAR";
        let ovrRange  = ak.levelAkademi >= 2 ? "58–67" : "50–57";

        html += `
        <div class="academy-status">
            <div class="academy-status__top">
                <div>
                    <div class="academy-status__label">STATUS AKADEMI: ${labelLevel}</div>
                    <div class="academy-status__sub">OVR Prospek: ${ovrRange} | Total Lulusan: ${ak.totalLulusan}</div>
                </div>
                <div class="academy-status__count">Prospek: <b>${ak.prospek.length}/3</b></div>
            </div>
            <div class="academy-status__note">
                Akademi menghasilkan 1 prospek baru tiap akhir musim. Promosikan ke tim utama atau lepas ke bursa transfer.
            </div>
        </div>`;

        if (ak.prospek.length === 0) {
            html += `<div class="empty-note">Belum ada prospek — hasilkan musim ini dengan menyelesaikan musim reguler.</div>`;
        } else {
            ak.prospek.forEach((p, i) => {
                let usiaDiAkademi = musimKe - (p.musimMasuk || musimKe);
                let warnaUsia = usiaDiAkademi >= 2 ? "var(--red)" : "var(--text-2)";
                html += `
                <div class="prospect-card">
                    <div class="prospect-card__top">
                        <div>
                            <div class="prospect-card__name">${p.nama}</div>
                            <div class="prospect-card__meta">${p.role} · Umur ${p.umur} · ${p.negara}</div>
                        </div>
                        <div class="prospect-card__ovr">
                            <div class="prospect-card__ovr-num">${p.ovr}</div>
                            <div class="prospect-card__ovr-label">OVR</div>
                        </div>
                    </div>
                    <div class="prospect-card__stats">
                        <span>MEK ${p.mekanik}</span>
                        <span>MAK ${p.makro}</span>
                        <span>MNT ${p.mental}</span>
                    </div>
                    <div class="prospect-card__usia" style="color:${warnaUsia};">
                        Musim di akademi: ${usiaDiAkademi}${usiaDiAkademi >= 2 ? " ⚠️ Segera promosikan!" : ""}
                    </div>
                    <div class="prospect-card__actions">
                        <button class="btn-promosi" onclick="window.promosiProspek(${i})">⬆️ PROMOSIKAN</button>
                        <button class="btn-lepas" onclick="window.lepasProspek(${i})">📤 LEPAS</button>
                    </div>
                </div>`;
            });
        }
    }

    getEl("kontenFasilitas").innerHTML = html;
}

window.bukaDetailSponsor = function (index) {
    let s = penawaranSponsor[index];
    // FIX FASE 15: gunakan cariTimAsliDiDatabase (cek semua 11 database)
    // bukan cuma 4 database MPL, supaya tidak crash kalau player di MDL/LEN
    let timKita = (typeof cariTimAsliDiDatabase === "function")
        ? cariTimAsliDiDatabase(timPlayer)
        : [...daftarTim, ...daftarTimPH, ...daftarTimMY, ...daftarTimSG].find(t => t.nama === timPlayer);
    let isPowerCukup = timKita ? timKita.power >= s.minimalPower : false;

    getEl("detailSponsorNama").innerText = s.nama;
    getEl("detailSponsorDana").innerText =
        `Rp ${(s.bayar / 1000000).toFixed(1)} Jt`;
    getEl("detailSponsorBonus").innerText =
        `Rp ${(s.bonusJuara / 1000000).toFixed(1)} Jt`;
    getEl("detailSponsorDurasi").innerText = `${s.durasi} Musim`;

    let btnAmbil = getEl("btnAmbilSponsorModal");
    if (isPowerCukup) {
        btnAmbil.disabled = false;
        btnAmbil.style.background = "#5B3DF5";
        btnAmbil.style.color = "#fff";
        btnAmbil.innerText = "TERIMA";
        btnAmbil.style.cursor = "pointer";
        btnAmbil.onclick = function () {
            tutupDetailSponsor();
            ambilSponsor(index);
        };
    } else {
        btnAmbil.disabled = true;
        btnAmbil.style.background = "#333";
        btnAmbil.style.color = "#666";
        btnAmbil.innerText = "POWER KURANG";
        btnAmbil.style.cursor = "not-allowed";
        btnAmbil.onclick = null;
    }

    getEl("modalSponsor").classList.remove("sembunyi");
};

window.tutupDetailSponsor = function () {
    getEl("modalSponsor").classList.add("sembunyi");
};

//Kelompok UI Raksasa (Tabel & Bracket)
function renderKas() {
    // Update teks total kas di header/dashboard
    let kasTeks = `Rp ${kasTim.toLocaleString("id-ID")}`;
    if (getEl("teksTotalKas")) getEl("teksTotalKas").innerText = kasTeks;
    if (getEl("dashKas")) getEl("dashKas").innerText = kasTeks;

    let containerList = getEl("listRiwayatKeuangan");
    if (!containerList) return;

    // Bersihkan kontainer duluan
    containerList.innerHTML = "";

    if (riwayatKas.length === 0) {
        containerList.innerHTML = `<div class="riwayat-kas-empty">Belum ada transaksi.</div>`;
        return;
    }

    // 1. Siapkan meja kerja gaib (DocumentFragment)
    let fragment = document.createDocumentFragment();

    riwayatKas.forEach(k => {
        let warna = k.jenis === "MASUK" ? "#00B37E" : "#E5484D";
        let simbol = k.jenis === "MASUK" ? "+" : "-";

        // 2. Bikin elemen bungkus luar untuk tiap baris kas
        let div = document.createElement("div");
        div.className = "card-kas";

        // 3. Rakit isi dalamnya
        div.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span class="kas-desc">${k.deskripsi}</span>
                <span class="kas-nom" style="color:${warna}; font-weight: bold;">${simbol} Rp ${(k.nominal / 1000000).toFixed(1)} Jt</span>
            </div>
            <div class="kas-tgl" style="font-size: 10px; color: #888;">📅 ${k.waktu}</div>
        `;

        // 4. Taruh di meja kerja
        fragment.appendChild(div);
    });

    // 5. Tembak semua riwayat ke layar sekaligus
    containerList.appendChild(fragment);
}

// ==========================================================
// GLOBAL POWER RANKING - RENDER
// ==========================================================
function gprFormatMovement(movement) {
    if (!movement) return `<span class="gpr-move gpr-move--same">► 0</span>`;
    if (movement.tipe === "NEW") return `<span class="gpr-move gpr-move--new">NEW</span>`;
    if (movement.tipe === "UP") return `<span class="gpr-move gpr-move--up">▲ +${movement.jumlah}</span>`;
    if (movement.tipe === "DOWN") return `<span class="gpr-move gpr-move--down">▼ -${movement.jumlah}</span>`;
    return `<span class="gpr-move gpr-move--same">► 0</span>`;
}

function renderGlobalPowerRanking() {
    let tbody = getEl("badanGlobalPowerRanking");
    if (!tbody) return;

    // [FIX MOVEMENT] Jangan panggil gprHitungRanking(false) di sini.
    // gprHitungRanking() SELALU membaca window.gprRankingSebelumnya sebagai
    // baseline buat hitung movement, TAPI commitSnapshot=true (dipanggil di
    // titik2 resmi seperti Grand Final) langsung nimpa baseline itu dengan
    // ranking BARU di pemanggilan yang sama. Movement yang benar (dibanding
    // baseline LAMA) cuma "hidup" sesaat di window.gprRankingTerkini pas
    // commit itu terjadi. Kalau render manggil ulang dengan false, baseline
    // yang dibaca udah keburu ke-overwrite -> hasilnya selalu "► 0" gara2
    // dibandingin sama dirinya sendiri. Makanya render tinggal pakai cache
    // gprRankingTerkini yang udah dihitung di titik resmi tsb, dan cuma
    // hitung ulang manual (false) kalau belum pernah dihitung sama sekali.
    let ranking = (window.gprRankingTerkini && window.gprRankingTerkini.length > 0)
        ? window.gprRankingTerkini
        : ((typeof window.gprHitungRanking === "function") ? window.gprHitungRanking(false) : []);

    if (ranking.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-note">Belum ada data tim bro, mainkan musimnya dulu.</td></tr>`;
        return;
    }

    let fragment = document.createDocumentFragment();
    ranking.forEach(r => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.rank}</td>
            <td style="text-align:left">${r.nama}</td>
            <td>${r.poin}</td>
            <td>${r.gelarLiga}</td>
            <td>${r.gelarMSC}</td>
            <td>${r.gelarMSeries}</td>
            <td>${gprFormatMovement(r.movement)}</td>
        `;
        fragment.appendChild(tr);
    });
    tbody.innerHTML = "";
    tbody.appendChild(fragment);
}
window.renderGlobalPowerRanking = renderGlobalPowerRanking;


function renderRiwayatJuara() {
    let container = getEl("kontenRiwayat");
    if (!container) return;

    // Kosongkan container sebelum me-render ulang
    container.innerHTML = "";

    if (bankRiwayatJuara.length === 0) {
        container.innerHTML = `<div class="empty-note">Belum ada sejarah yang terukir bro. Mainkan musimnya!</div>`;
        return;
    }

    // Kelompokkan data berdasarkan Season
    let groupedBySeason = {};
    bankRiwayatJuara.forEach(j => {
        if (!groupedBySeason[j.season])
            groupedBySeason[j.season] = { tahun: j.tahun, turnamen: [] };
        groupedBySeason[j.season].turnamen.push(j);
    });

    // Urutkan dari Season terbaru ke terlama
    let sortedSeasons = Object.keys(groupedBySeason).sort((a, b) => b - a);

    // 1. Inisialisasi Document Fragment
    let fragment = document.createDocumentFragment();

    sortedSeasons.forEach(s => {
        let seasonData = groupedBySeason[s];

        // 2. Buat elemen Header Season
        let headerSeason = document.createElement("div");
        headerSeason.className = "riwayat-season-head";
        headerSeason.textContent = `SEASON ${s} (${seasonData.tahun})`;
        fragment.appendChild(headerSeason);

        // 3. Buat Wrapper untuk daftar turnamen dalam 1 season
        let turnamenWrapper = document.createElement("div");
        turnamenWrapper.className = "riwayat-season-body";

        // Urutkan biar turnamen Global (MSC/M-Series) selalu di posisi paling atas
        seasonData.turnamen.sort((a, b) => {
            let isAGlobal = a.negara.includes("🌐") ? 2 : 1;
            let isBGlobal = b.negara.includes("🌐") ? 2 : 1;
            return isBGlobal - isAGlobal;
        });

        seasonData.turnamen.forEach((j, index) => {
            let isGlobal = j.negara.includes("🌐");
            let kelasTema = isGlobal
                ? "riwayat-item__label--gold"
                : j.negara.includes("MSC")
                  ? "riwayat-item__label--cyan"
                  : "riwayat-item__label--white";
            let kelasLogoBorder = isGlobal ? "riwayat-item__logo--gold" : "";
            let kelasNamaBold = isGlobal ? "riwayat-item__nama--bold" : "";
            let labelTurnamen = isGlobal ? j.negara : `🏆 MPL ${j.negara}`;

            // 4. Buat item Turnamen
            let itemTurnamen = document.createElement("div");
            itemTurnamen.className = "riwayat-item" + (index === seasonData.turnamen.length - 1 ? " riwayat-item--last" : "");

            // Isi struktur dalam item menggunakan innerHTML agar kode tetap efisien dan mudah dibaca
            itemTurnamen.innerHTML = `
                <div class="riwayat-item__col">
                    <span class="riwayat-item__label ${kelasTema}">${labelTurnamen}</span>
                    <div class="riwayat-item__row">
                        <img src="${j.tim.logo}" class="riwayat-item__logo ${kelasLogoBorder}" onerror="this.src='https://ui-avatars.com/api/?name=${j.tim.nama}&background=333&color=fff'">
                        <span class="riwayat-item__nama ${kelasNamaBold}">${j.tim.nama}</span>
                    </div>
                </div>
            `;

            // Masukkan item ke dalam wrapper season
            turnamenWrapper.appendChild(itemTurnamen);
        });

        // Masukkan wrapper season yang sudah penuh ke dalam fragment
        fragment.appendChild(turnamenWrapper);
    });

    // 5. Eksekusi DOM Manipulation: Tempelkan fragment ke container utama (hanya 1x reflow)
    container.appendChild(fragment);
}

function renderBoxBracket(matchObj, num, labelHome, labelAway, caption) {
    // [FIX] Caption sekarang bisa di-custom penuh (misal "UPPER BRACKET
    // ROUND 1 MATCH 5 - BO3") biar teksnya sama persis kayak gambar
    // resmi, bukan cuma "MATCH N" generik.
    let teksCaption = caption || (num ? `MATCH ${num}` : "");
    let labelMatch = teksCaption ? `<div class="b-match-label" style="font-size:9px;color:#888;text-align:center;letter-spacing:0.3px;margin-bottom:2px;line-height:1.3;">${teksCaption}</div>` : "";
    if (!matchObj) {
        // [FIX] Slot kosong sekarang bisa dikasih label deskriptif (misal
        // "1st of Group A" / "Winner Match 1") biar player paham asal-usul
        // tim yang bakal ngisi slot itu, bukan cuma "TBD" generik.
        let txtHome = labelHome || "TBD";
        let txtAway = labelAway || "TBD";
        return `<div class="bracket-match">${labelMatch}
            <div class="b-team"><div class="b-logo"></div><div class="b-name" style="font-size:10px;color:#888;line-height:1.3;">${txtHome}</div></div>
            <div class="b-team"><div class="b-logo"></div><div class="b-name" style="font-size:10px;color:#888;line-height:1.3;">${txtAway}</div></div>
        </div>`;
    }
    let isAWin = matchObj.sudahMain && matchObj.skorHome > matchObj.skorAway;
    let isBWin = matchObj.sudahMain && matchObj.skorAway > matchObj.skorHome;

    // Tambahan atribut onclick agar nama tim di bracket bisa diklik
    let clickHome =
        matchObj.home.nama !== "TBD"
            ? `style="cursor: pointer;" onclick="bukaInfoTim('${matchObj.home.nama}')"`
            : "";
    let clickAway =
        matchObj.away.nama !== "TBD"
            ? `style="cursor: pointer;" onclick="bukaInfoTim('${matchObj.away.nama}')"`
            : "";

    return `<div class="bracket-match">
        ${labelMatch}
        <div class="b-team ${isAWin ? "winner" : ""}" ${clickHome}>
            <img src="${matchObj.home.logo}" class="b-logo" onerror="this.src='https://ui-avatars.com/api/?name=${matchObj.home.nama}&background=333&color=fff'">
            <div class="b-name">${matchObj.home.nama}</div>
            <div class="b-score">${matchObj.sudahMain ? matchObj.skorHome : "-"}</div>
        </div>
        <div class="b-team ${isBWin ? "winner" : ""}" ${clickAway}>
            <img src="${matchObj.away.logo}" class="b-logo" onerror="this.src='https://ui-avatars.com/api/?name=${matchObj.away.nama}&background=333&color=fff'">
            <div class="b-name">${matchObj.away.nama}</div>
            <div class="b-score">${matchObj.sudahMain ? matchObj.skorAway : "-"}</div>
        </div>
    </div>`;
}

function renderLogSkenaMpl() {
    let container = getEl("logMatchContainer");
    let htmlKonten = "";

    // AUTO DETEKSI REGION BUAT BRACKET DI TAB PERTANDINGAN
    let pObj = pData; // Default ID
    if (daftarTimPH.some(t => t.nama === timPlayer)) pObj = window.pDataPH;
    else if (daftarTimMY.some(t => t.nama === timPlayer)) pObj = window.pDataMY;
    else if (daftarTimSG.some(t => t.nama === timPlayer)) pObj = window.pDataSG;

    if (statusGame === "PLAYOFF" || statusGame === "JUARA") {
        htmlKonten += `<div class="bracket-scroll"><div class="bracket-container"><div class="bracket-round"><div class="round-title">PLAY-IN (BO5)</div>${renderBoxBracket(pObj.m1, 1)}${renderBoxBracket(pObj.m2, 2)}</div><div class="bracket-round"><div class="round-title">UPPER SEMI (BO5)</div>${renderBoxBracket(pObj.m3, 3)}${renderBoxBracket(pObj.m4, 4)}</div><div class="bracket-round"><div class="round-title">UB FINAL (BO5)</div>${renderBoxBracket(pObj.m6, 6)}<div class="round-title" style="margin-top:15px;">LOWER SEMI (BO5)</div>${renderBoxBracket(pObj.m5, 5)}</div><div class="bracket-round" style="justify-content: flex-end;"><div class="round-title">LOWER FINAL (BO5)</div>${renderBoxBracket(pObj.m7, 7)}</div><div class="bracket-round" style="justify-content: center;"><div class="round-title" style="color:#E5484D; font-size:14px;">GRAND FINAL (BO7)</div>${renderBoxBracket(pObj.m8, 8)}</div></div></div><div style="border-top: 1px dashed var(--border-md); margin-top: 15px; padding-top: 15px; text-align: center; color: #5B3DF5; font-family: 'Oswald', sans-serif; font-size: 14px; letter-spacing: 1px;">RIWAYAT REGULAR SEASON</div>`;
    }
    if (
        bankJadwalMaster.length === 0 &&
        statusGame !== "PLAYOFF" &&
        statusGame !== "JUARA"
    ) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">Mulai musim dulu bro!</div>`;
        return;
    }
    let tanggalSakarang = "";
    bankJadwalMaster.forEach(m => {
        if (m.tanggal !== tanggalSakarang) {
            tanggalSakarang = m.tanggal;
            htmlKonten += `<div class="log-hari-header">Week ${m.week} - ${tanggalSakarang}</div>`;
        }
        let skorTeks = m.sudahMain ? `${m.skorHome} - ${m.skorAway}` : "VS";
        htmlKonten += `<div class="log-item-card"><div class="log-tim-info home"><img src="${m.home.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${m.home.nama}&background=333&color=fff'"><span class="log-tim-name">${m.home.nama}</span></div><div class="log-skor-box">${skorTeks}</div><div class="log-tim-info away"><span class="log-tim-name">${m.away.nama}</span><img src="${m.away.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${m.away.nama}&background=333&color=fff'"></div></div>`;
    });
    container.innerHTML = htmlKonten;
}

// ==========================================================
// [MSC x EWC 2026] HELPER RENDER -- klasemen Wild Card
// ==========================================================
function renderKlasemenWCTable(judul, klasemenArr, hasilArr) {
    if (!klasemenArr) return "";
    let rows = klasemenArr.map((t, idx) => {
        let menang = hasilArr.filter(m => m && m.menang && m.menang.nama === t.nama).length;
        let kalah = hasilArr.filter(m => m && m.kalah && m.kalah.nama === t.nama).length;
        let statusLabel = idx === 0
            ? '<span style="color:#00B37E;">Lolos SF</span>'
            : idx <= 3 ? '<span style="color:#C9971F;">Gauntlet</span>'
            : '<span style="color:#888;">Tereliminasi</span>';
        return `<tr><td>${idx + 1}</td><td onclick="bukaInfoTim('${t.nama}')" style="cursor:pointer;">${t.nama}</td><td>${menang}-${kalah}</td><td>${statusLabel}</td></tr>`;
    }).join("");
    return `<h4 style="color:#0891B2;margin:10px 0 5px;">${judul}</h4>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead><tr style="color:#888;"><th>#</th><th style="text-align:left;">Tim</th><th>W-L</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

// Bracket Gauntlet + Final Wild Card (Day 3-4)
function renderBracketWC() {
    let wc = window.wildCardData;
    if (!wc || wc.fase < 3 || !wc.gauntlet) return "";
    let html = `<div class="bracket-scroll"><div class="bracket-container">
        <div class="bracket-round">
            <div class="round-title">CROSS-GROUP GAUNTLET</div>
            ${renderBoxBracket(wc.gauntlet.m1A, 1)}${renderBoxBracket(wc.gauntlet.m2A, 2)}
            ${renderBoxBracket(wc.gauntlet.m1B, 3)}${renderBoxBracket(wc.gauntlet.m2B, 4)}
        </div>`;
    if (wc.finalBracket) {
        html += `
        <div class="bracket-round">
            <div class="round-title">WILD CARD FINAL BRACKET</div>
            ${renderBoxBracket(wc.finalBracket.m1, 5)}${renderBoxBracket(wc.finalBracket.m2, 6)}
        </div>
        <div class="bracket-round" style="justify-content:center;">
            <div class="round-title" style="color:#5B3DF5;">TIKET KE MSC GROUP STAGE</div>
            ${renderBoxBracket(wc.finalBracket.m3, 7)}
        </div>`;
    }
    html += `</div></div>`;
    return html;
}

// Bracket GSL 1 grup Group Stage
function renderBracketGSLGrup(g, namaGrup) {
    if (!g || !g.m1) return `<div style="color:#666;font-size:12px;text-align:center;">Grup ${namaGrup} belum di-draw.</div>`;
    // [FIX] Sebelumnya M5/M6 (lolos rekor 2-0) numpuk sama M7/M8 (LB R1)
    // di 1 kolom yang sama, jadi keliatan kayak M5/M6 gak lolos kemana2
    // (cuma M9/M10 yang dikasih label "LOLOS KNOCKOUT"). Sekarang dipisah
    // jadi 4 kolom jelas persis kayak gambar official, M5/M6 dan M9/M10
    // dua-duanya dikasih label lolos yang sama jelasnya.
    // [FIX] Restrukturisasi jadi 2 BLOK BERTUMPUK (Upper Bracket block di
    // atas, Lower Bracket block di bawahnya) -- bukan 4 kolom sejajar
    // horizontal lagi. M5/M6 disejajarkan vertikal di tengah M1-M4 (pakai
    // justify-content: space-around), M7/M8 pindah tepat di bawah M4
    // (blok baru), M9/M10 di sampingnya. Ini jauh lebih deket alur baca
    // bracket asli dibanding susunan 4-kolom-sejajar sebelumnya.
    let html = `<div style="color:#5B3DF5;font-weight:bold;margin:10px 0 5px;text-align:center;">GRUP ${namaGrup}</div>
    <div class="bracket-container">
        <div class="bracket-round">
            <div class="round-title">UPPER BRACKET ROUND 1</div>
            ${renderBoxBracket(g.m1, 1, null, null, "MATCH 1 - BO3")}
            ${renderBoxBracket(g.m2, 2, null, null, "MATCH 2 - BO3")}
            ${renderBoxBracket(g.m3, 3, null, null, "MATCH 3 - BO3")}
            ${renderBoxBracket(g.m4, 4, null, null, "MATCH 4 - BO3")}
        </div>
        <div class="bracket-round" style="justify-content:space-around;">
            <div class="round-title" style="color:#00B37E;">ADVANCE TO KNOCKOUT (2-0)</div>
            ${renderBoxBracket(g.m5 || null, 5, "Winner M1", "Winner M2", "UPPER BRACKET ROUND 1<br>MATCH 5 - BO3")}
            ${renderBoxBracket(g.m6 || null, 6, "Winner M3", "Winner M4", "UPPER BRACKET ROUND 1<br>MATCH 6 - BO3")}
        </div>
    </div>
    <div class="bracket-container" style="margin-top:15px;">
        <div class="bracket-round">
            <div class="round-title">LOWER BRACKET ROUND 1</div>
            ${renderBoxBracket(g.m7 || null, 7, "Loser M1", "Loser M2", "LOWER BRACKET ROUND 1<br>MATCH 7 - BO3")}
            ${renderBoxBracket(g.m8 || null, 8, "Loser M3", "Loser M4", "LOWER BRACKET ROUND 1<br>MATCH 8 - BO3")}
        </div>
        <div class="bracket-round" style="justify-content:space-around;">
            <div class="round-title" style="color:#00B37E;">ADVANCE TO KNOCKOUT (2-1)</div>
            ${renderBoxBracket(g.m9 || null, 9, "Loser M6", "Winner M7", "LOWER BRACKET ROUND 2<br>MATCH 9 - BO3")}
            ${renderBoxBracket(g.m10 || null, 10, "Loser M5", "Winner M8", "LOWER BRACKET ROUND 2<br>MATCH 10 - BO3")}
        </div>
    </div>`;
    return html;
}

// Bracket Knockout Stage (QF-SF-3rd-GF)
function renderBracketKnockoutMSC() {
    let kd = window.knockoutData;
    if (!kd) return "";
    let html = `<div class="bracket-scroll"><div class="bracket-container">
        <div class="bracket-round">
            <div class="round-title">QUARTER FINAL (BO5)</div>
            ${renderBoxBracket(kd.qf1, 1)}${renderBoxBracket(kd.qf2, 2)}${renderBoxBracket(kd.qf3, 3)}${renderBoxBracket(kd.qf4, 4)}
        </div>
        <div class="bracket-round">
            <div class="round-title">SEMI FINAL (BO5)</div>
            ${renderBoxBracket(kd.sf1 || null, 5, "Winner QF1", "Winner QF2")}
            ${renderBoxBracket(kd.sf2 || null, 6, "Winner QF3", "Winner QF4")}
        </div>
        <div class="bracket-round" style="justify-content:center;">
            <div class="round-title" style="color:#5B3DF5;">GRAND FINAL (BO7) <span style="color:#666;font-weight:normal;">• 18:00 WIB</span></div>
            ${renderBoxBracket(kd.grandFinal || null, 7, "Winner SF1", "Winner SF2")}
            ${kd.juara3 ? `<div style="margin-top:10px;font-size:12px;color:#cd7f32;text-align:center;">🥉 Juara 3: ${kd.juara3.nama}</div>` : ""}
            <div class="round-title" style="color:#cd7f32;margin-top:20px;">PEREBUTAN JUARA 3 (BO5) <span style="color:#666;font-weight:normal;">• 15:00 WIB</span></div>
            ${renderBoxBracket(kd.juara3Match || null, 8, "Loser SF1", "Loser SF2")}
        </div>
    </div></div>`;
    return html;
}

// Render jadwal Day 1/2 yang lagi "nunggu disimulasikan" -- otomatis
// kosong/gak nampil begitu Day 1 & 2 udah selesai dimainkan.
function renderJadwalWC() {
    let wc = window.wildCardData;
    let st = window.mscEwcState;
    if (!wc || !st) return "";

    let hariAktif = null, jadwalA = null, jadwalB = null;
    if (!st.wcDay1) {
        hariAktif = 1;
        jadwalA = wc.jadwalA.slice(0, 5);
        jadwalB = wc.jadwalB.slice(0, 5);
    } else if (!st.wcDay2) {
        hariAktif = 2;
        jadwalA = wc.jadwalA.slice(5, 10);
        jadwalB = wc.jadwalB.slice(5, 10);
    } else {
        return ""; // Day 1 & 2 udah kelar, jadwal round robin gak relevan lagi
    }

    let barisJadwal = (pasangan) => pasangan.map(([a, b]) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;border-bottom:1px solid #222;">
            <span style="flex:1;text-align:right;color:#5C6472;">${a.nama}</span>
            <span style="flex:0 0 30px;text-align:center;color:#666;">vs</span>
            <span style="flex:1;text-align:left;color:#5C6472;">${b.nama}</span>
        </div>`
    ).join("");

    return `<div style="margin-top:15px;">
        <h4 style="color:#0891B2;margin:10px 0 5px;text-align:center;">📅 JADWAL WILD CARD DAY ${hariAktif}</h4>
        <div style="color:#0891B2;font-size:11px;font-weight:bold;margin-bottom:3px;">GRUP A</div>
        ${barisJadwal(jadwalA)}
        <div style="color:#0891B2;font-size:11px;font-weight:bold;margin:8px 0 3px;">GRUP B</div>
        ${barisJadwal(jadwalB)}
    </div>`;
}

function renderLayarMSC() {
    let container = getEl("logMSCContainer");

    // KUNCI: Kalau Musim Genap (M-Series), langsung kasih tau info yang bener!
    if (musimKe % 2 === 0) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">MSC adalah turnamen pertengahan tahun (Musim Ganjil).<br>Sekarang adalah panggung <b>M-Series</b>!</div>`;
        return;
    }

    if (!window.wildCardData && !window.groupStageData && !window.knockoutData) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">MSC x EWC 2026 belum dimulai. Tuntaskan Regional Season dulu!</div>`;
        return;
    }

    let html = "";

    // ============ WILD CARD (selalu tampil begitu wildCardData ada) ============
    if (window.wildCardData) {
        let wc = window.wildCardData;
        html += `<div style="color:#0891B2;font-family:'Oswald',sans-serif;font-size:16px;text-align:center;letter-spacing:1px;">🎮 WILD CARD</div>`;

        // [FIX] Klasemen sekarang dihitung LIVE dari hasil yang udah main,
        // bukan nunggu Day 2 (fase 2) baru muncul -- begitu Day 1 kelar,
        // klasemen sementara langsung kebaca.
        if (wc.hasilA && wc.hasilA.length > 0) {
            let klasemenLiveA = wc.klasemenA || hitungKlasemenWC(wc.groupA, wc.hasilA);
            let klasemenLiveB = wc.klasemenB || hitungKlasemenWC(wc.groupB, wc.hasilB);
            html += renderKlasemenWCTable("GRUP A" + (wc.klasemenA ? "" : " (sementara)"), klasemenLiveA, wc.hasilA);
            html += renderKlasemenWCTable("GRUP B" + (wc.klasemenB ? "" : " (sementara)"), klasemenLiveB, wc.hasilB);
        } else {
            html += `<div style="text-align:center;color:#666;font-size:12px;margin-top:10px;">Round robin grup belum dimulai.</div>`;
        }

        // [FIX] Section Jadwal -- nunjukin pertandingan Day 1/2 yang
        // dijadwalkan tapi belum disimulasikan (delay 1 hari sesuai request).
        html += renderJadwalWC();

        // [FIX] Skeleton Gauntlet & Final Bracket SELALU tampil (TBD kalau
        // belum ada datanya), biar player tau alurnya dari awal.
        html += `<div class="bracket-scroll"><div class="bracket-container">
            <div class="bracket-round">
                <div class="round-title">CROSS-GROUP GAUNTLET</div>
                ${renderBoxBracket(wc.gauntlet ? wc.gauntlet.m1A : null, 1, "4th of Group A", "3rd of Group B (swapped)")}
                ${renderBoxBracket(wc.gauntlet ? wc.gauntlet.m2A : null, 2, "Winner Match 1", "2nd of Group A")}
                ${renderBoxBracket(wc.gauntlet ? wc.gauntlet.m1B : null, 3, "4th of Group B", "3rd of Group A (swapped)")}
                ${renderBoxBracket(wc.gauntlet ? wc.gauntlet.m2B : null, 4, "Winner Match 3", "2nd of Group B")}
            </div>
            <div class="bracket-round">
                <div class="round-title">WILD CARD FINAL BRACKET</div>
                ${renderBoxBracket(wc.finalBracket ? wc.finalBracket.m1 : null, 5, "1st of Group A", "Winner of New Group B", "MATCH 1 - BO3")}
                ${renderBoxBracket(wc.finalBracket ? wc.finalBracket.m2 : null, 6, "1st of Group B", "Winner of New Group A", "MATCH 2 - BO3")}
            </div>
            <div class="bracket-round" style="justify-content:center;">
                <div class="round-title" style="color:#5B3DF5;">TIKET KE MSC GROUP STAGE</div>
                ${renderBoxBracket(wc.finalBracket ? wc.finalBracket.m3 : null, 7, "Winner Match 1", "Winner Match 2", "MATCH 3 - FINAL BO3")}
            </div>
        </div></div>`;

        if (wc.juaraWildCard) {
            html += `<div style="text-align:center;color:#00B37E;margin:10px 0;font-size:13px;">🎟️ Tiket ke-16 Group Stage: <b>${wc.juaraWildCard.nama}</b></div>`;
        }
    }

    // ============ GROUP STAGE (skeleton nunggu kalau belum di-draw) ============
    html += `<div style="border-top:1px dashed var(--border-md);margin-top:15px;padding-top:15px;color:#5B3DF5;font-family:'Oswald',sans-serif;font-size:16px;text-align:center;letter-spacing:1px;">🏆 GROUP STAGE</div>`;
    if (window.groupStageData) {
        html += `<div class="bracket-scroll">
            ${renderBracketGSLGrup(window.groupStageData.A, "A")}
            ${renderBracketGSLGrup(window.groupStageData.B, "B")}
        </div>`;
    } else {
        html += `<div style="text-align:center;color:#666;font-size:12px;margin-top:5px;">Menunggu Wild Card selesai & drawing 16 tim.</div>`;
    }

    // ============ KNOCKOUT (skeleton nunggu kalau belum mulai) ============
    html += `<div style="border-top:1px dashed var(--border-md);margin-top:15px;padding-top:15px;color:#E5484D;font-family:'Oswald',sans-serif;font-size:16px;text-align:center;letter-spacing:1px;">⚔️ KNOCKOUT STAGE</div>`;
    if (window.knockoutData) {
        html += renderBracketKnockoutMSC();
    } else {
        html += `<div style="text-align:center;color:#666;font-size:12px;margin-top:5px;">Menunggu Group Stage selesai.</div>`;
    }

    if (window.knockoutData && window.knockoutData.juaraMSC) {
        html += `<div style="text-align:center;color:#C9971F;font-size:18px;font-weight:bold;margin:20px 0;">👑 JUARA MSC 2026: ${window.knockoutData.juaraMSC.nama}</div>`;
    }

    container.innerHTML = html;
}

function renderLayarMSeries() {
    let container = getEl("logMSeriesContainer");
    if (
        musimKe % 2 !== 0 ||
        (statusGame !== "MSERIES" && statusGame !== "OFFSEASON")
    ) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">M-Series belum dimulai. Turnamen ini diadakan pada akhir tahun (Season Genap).</div>`;
        return;
    }

    let html = `
    <div class="bracket-scroll">
        <div class="bracket-container" style="justify-content: center;">
            <div class="bracket-round">
                <div class="round-title" style="color:#5B3DF5;">QUARTER FINAL</div>
                ${renderBoxBracket(mSeriesData.q1, 1)}
                ${renderBoxBracket(mSeriesData.q2, 2)}
                ${renderBoxBracket(mSeriesData.q3, 3)}
                ${renderBoxBracket(mSeriesData.q4, 4)}
            </div>
            <div class="bracket-round">
                <div class="round-title" style="color:#5B3DF5;">SEMI FINAL</div>
                ${renderBoxBracket(mSeriesData.s1, 5)}
                ${renderBoxBracket(mSeriesData.s2, 6)}
            </div>
            <div class="bracket-round" style="justify-content: center;">
                <div class="round-title" style="color:#5B3DF5; font-size:14px;">GRAND FINAL M-SERIES</div>
                ${renderBoxBracket(mSeriesData.gf, 7)}
            </div>
        </div>
    </div>`;
    container.innerHTML = html;
}

// ==========================================================
// [M7 WORLD CHAMPIONSHIP] Render halaman M7 -- ganti total
// tampilan M-Series lama utk musim genap ke atas.
// ==========================================================
function renderKlasemenWCM7Table(judul, klasemenArr, hasilArr) {
    if (!klasemenArr) return "";
    let rows = klasemenArr.map((t, idx) => {
        let menang = hasilArr.filter(m => m && m.menang && m.menang.nama === t.nama).length;
        let kalah = hasilArr.filter(m => m && m.kalah && m.kalah.nama === t.nama).length;
        let statusLabel = idx <= 1
            ? '<span style="color:#00B37E;">Lolos Qualification</span>'
            : '<span style="color:#888;">Tereliminasi</span>';
        return `<tr><td>${idx + 1}</td><td onclick="bukaInfoTim('${t.nama}')" style="cursor:pointer;">${t.nama}</td><td>${menang}-${kalah}</td><td>${statusLabel}</td></tr>`;
    }).join("");
    return `<h4 style="color:#5B3DF5;margin:10px 0 5px;">${judul}</h4>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead><tr style="color:#888;"><th>#</th><th style="text-align:left;">Tim</th><th>W-L</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function renderSwissBracketM7(judul, hasilArr, warna) {
    if (!hasilArr || hasilArr.length === 0) return "";
    let items = hasilArr.map((m, i) => renderBoxBracket(m, i + 1)).join("");
    return `<div class="bracket-round">
        <div class="round-title" style="color:${warna || '#0891B2'};font-size:11px;">${judul}</div>
        ${items}
    </div>`;
}

function renderStandingSwissM7() {
    let sw = window.swissM7Data;
    if (!sw) return "";
    let baris = (arr) => arr.map(t => `<tr><td onclick="bukaInfoTim('${t.ref.nama}')" style="cursor:pointer;">${t.ref.nama}</td><td>${t.w}-${t.l}</td></tr>`).join("");
    let aktif = sw.teams.filter(t => t.w < 3 && t.l < 3);
    return `<div style="margin-top:10px;">
        <h4 style="color:#0891B2;margin:10px 0 5px;">RECORD SEMUA TIM</h4>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead><tr style="color:#888;"><th style="text-align:left;">Tim</th><th>Rekor</th></tr></thead>
            <tbody>
                ${baris(sw.qualified)}
                ${baris(aktif)}
                ${baris(sw.eliminated)}
            </tbody>
        </table>
    </div>`;
}

function renderKnockoutM7() {
    let kd = window.knockoutM7Data;
    if (!kd) return "";
    let html = `<div class="bracket-scroll"><div class="bracket-container">
        <div class="bracket-round">
            <div class="round-title">UPPER BRACKET QF (BO3)</div>
            ${renderBoxBracket(kd.ubqf.m1, 1)}${renderBoxBracket(kd.ubqf.m2, 2)}${renderBoxBracket(kd.ubqf.m3, 3)}${renderBoxBracket(kd.ubqf.m4, 4)}
        </div>
        <div class="bracket-round">
            <div class="round-title">UPPER BRACKET SF (BO5)</div>
            ${renderBoxBracket(kd.ubsf ? kd.ubsf.m1 : null, 5, "Winner UBQF1", "Winner UBQF2")}
            ${renderBoxBracket(kd.ubsf ? kd.ubsf.m2 : null, 6, "Winner UBQF3", "Winner UBQF4")}
        </div>
        <div class="bracket-round" style="justify-content:center;">
            <div class="round-title" style="color:#5B3DF5;">UPPER BRACKET FINAL (BO5)</div>
            ${renderBoxBracket(kd.ubfinal || null, 7, "Winner UBSF1", "Winner UBSF2")}
        </div>
    </div></div>
    <div class="bracket-scroll" style="margin-top:10px;"><div class="bracket-container">
        <div class="bracket-round">
            <div class="round-title" style="color:#E5484D;">LOWER BRACKET R1 (BO5)</div>
            ${renderBoxBracket(kd.lbr1 ? kd.lbr1.m1 : null, 8, "Loser UBQF1", "Loser UBQF2")}
            ${renderBoxBracket(kd.lbr1 ? kd.lbr1.m2 : null, 9, "Loser UBQF3", "Loser UBQF4")}
        </div>
        <div class="bracket-round">
            <div class="round-title" style="color:#E5484D;">LOWER BRACKET R2 (BO5)</div>
            ${renderBoxBracket(kd.lbr2 ? kd.lbr2.m1 : null, 10, "Winner LBR1-1", "Loser UBSF2")}
            ${renderBoxBracket(kd.lbr2 ? kd.lbr2.m2 : null, 11, "Winner LBR1-2", "Loser UBSF1")}
        </div>
        <div class="bracket-round">
            <div class="round-title" style="color:#E5484D;">LOWER BRACKET SEMI (BO5)</div>
            ${renderBoxBracket(kd.lbr3 || null, 12, "Winner LBR2-1", "Winner LBR2-2")}
        </div>
        <div class="bracket-round" style="justify-content:center;">
            <div class="round-title" style="color:#E5484D;">LOWER BRACKET FINAL (BO5)</div>
            ${renderBoxBracket(kd.lbfinal || null, 13, "Winner LB Semi", "Loser UB Final")}
        </div>
    </div></div>
    <div class="bracket-scroll" style="margin-top:10px;"><div class="bracket-container">
        <div class="bracket-round" style="justify-content:center;">
            <div class="round-title" style="color:#5B3DF5;">GRAND FINAL (BO7 - Tanpa Bracket Reset)</div>
            ${renderBoxBracket(kd.grandFinal || null, 14, "Winner UB Final", "Winner LB Final")}
        </div>
    </div></div>`;
    return html;
}

// [FIX] Equivalent renderJadwalWC() tapi buat M7 Wild Card -- sebelumnya
// gak ada, jadi jadwal round-robin hari berjalan (termasuk match tim
// player) gak pernah nongol di Container Box selama fase Wild Card M7,
// beda sama MSC yang udah punya renderJadwalWC(). wildCardM7Data.jadwalA/B
// strukturnya per-ronde (array of pair per hari), BEDA sama wildCardData
// MSC yang di-slice(0,5)/(5,10), jadi diakses langsung via index hari.
function renderJadwalWCM7() {
    let wc = window.wildCardM7Data;
    let st = window.m7State;
    if (!wc || !st) return "";

    let hariAktif = null, jadwalA = null, jadwalB = null;
    if (!st.wcDay1) {
        hariAktif = 1;
        jadwalA = wc.jadwalA[0];
        jadwalB = wc.jadwalB[0];
    } else if (!st.wcDay2) {
        hariAktif = 2;
        jadwalA = wc.jadwalA[1];
        jadwalB = wc.jadwalB[1];
    } else if (!st.wcDay3) {
        hariAktif = 3;
        jadwalA = wc.jadwalA[2];
        jadwalB = wc.jadwalB[2];
    } else {
        return ""; // Day 1-3 udah kelar, jadwal round robin gak relevan lagi
    }

    let barisJadwal = (pasangan) => pasangan.map(([a, b]) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;border-bottom:1px solid #222;">
            <span style="flex:1;text-align:right;color:${a.nama === timPlayer ? '#5B3DF5' : '#5C6472'};font-weight:${a.nama === timPlayer ? 'bold' : 'normal'};">${a.nama}</span>
            <span style="flex:0 0 30px;text-align:center;color:#666;">vs</span>
            <span style="flex:1;text-align:left;color:${b.nama === timPlayer ? '#5B3DF5' : '#5C6472'};font-weight:${b.nama === timPlayer ? 'bold' : 'normal'};">${b.nama}</span>
        </div>`
    ).join("");

    return `<div style="margin-top:15px;">
        <h4 style="color:#5B3DF5;margin:10px 0 5px;text-align:center;">📅 JADWAL WILD CARD DAY ${hariAktif}</h4>
        <div style="color:#5B3DF5;font-size:11px;font-weight:bold;margin-bottom:3px;">GRUP A</div>
        ${barisJadwal(jadwalA)}
        <div style="color:#5B3DF5;font-size:11px;font-weight:bold;margin:8px 0 3px;">GRUP B</div>
        ${barisJadwal(jadwalB)}
    </div>`;
}

function renderLayarM7() {
    let container = getEl("logMSeriesContainer");
    if (!container) return;

    if (musimKe % 2 !== 0) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">M${(edisiMSeries || 0) + 1} World Championship adalah turnamen akhir tahun (Musim Genap).<br>Sekarang adalah panggung <b>MSC</b>!</div>`;
        return;
    }

    if (!window.m7State && !window.wildCardM7Data && !window.swissM7Data && !window.knockoutM7Data) {
        container.innerHTML = `<div style="text-align:center; color:#666; margin-top:50px;">M${(edisiMSeries || 0) + 1} World Championship belum dimulai. Tuntaskan Regional Season dulu!</div>`;
        return;
    }

    let html = "";

    // ============ WILD CARD ============
    if (window.wildCardM7Data) {
        let wc = window.wildCardM7Data;
        html += `<div style="color:#5B3DF5;font-family:'Oswald',sans-serif;font-size:16px;text-align:center;letter-spacing:1px;">🎮 WILD CARD</div>`;
        if (wc.hasilA && wc.hasilA.length > 0) {
            let klasemenLiveA = wc.klasemenA || hitungKlasemenWCM7(wc.groupA, wc.hasilA);
            let klasemenLiveB = wc.klasemenB || hitungKlasemenWCM7(wc.groupB, wc.hasilB);
            html += renderKlasemenWCM7Table("GRUP A" + (wc.klasemenA ? "" : " (sementara)"), klasemenLiveA, wc.hasilA);
            html += renderKlasemenWCM7Table("GRUP B" + (wc.klasemenB ? "" : " (sementara)"), klasemenLiveB, wc.hasilB);
        } else {
            html += `<div style="text-align:center;color:#666;font-size:12px;margin-top:10px;">Round robin grup belum dimulai.</div>`;
        }

        // [FIX] Sebelumnya gak ada -- jadwal hari berjalan (termasuk match
        // tim player) gak pernah tampil selama Wild Card M7 berlangsung.
        html += renderJadwalWCM7();

        if (wc.semifinal) {
            html += `<div class="bracket-scroll"><div class="bracket-container">
                <div class="bracket-round" style="justify-content:center;">
                    <div class="round-title" style="color:#5B3DF5;">QUALIFICATION MATCH (BO5)</div>
                    ${renderBoxBracket(wc.semifinal.sf1, 1, "Juara Grup A", "Runner-up Grup B")}
                    ${renderBoxBracket(wc.semifinal.sf2, 2, "Juara Grup B", "Runner-up Grup A")}
                </div>
            </div></div>`;
        }
        if (wc.golonganM7) {
            html += `<div style="text-align:center;color:#00B37E;margin:10px 0;font-size:13px;">🎟️ Lolos ke Main Event: <b>${wc.golonganM7.map(t => t.nama).join(", ")}</b></div>`;
        }
    }

    // ============ SWISS STAGE ============
    html += `<div style="border-top:1px dashed var(--border-md);margin-top:15px;padding-top:15px;color:#0891B2;font-family:'Oswald',sans-serif;font-size:16px;text-align:center;letter-spacing:1px;">🇸 SWISS STAGE</div>`;
    if (window.swissM7Data) {
        let sw = window.swissM7Data;
        html += `<div class="bracket-scroll"><div class="bracket-container">
            ${renderSwissBracketM7("ROUND 1 (BO1)", sw.rounds.r1)}
            ${sw.rounds.r2 ? renderSwissBracketM7("R2 - Bracket 1-0 (BO1)", sw.rounds.r2.b10) : ""}
            ${sw.rounds.r2 ? renderSwissBracketM7("R2 - Bracket 0-1 (BO1)", sw.rounds.r2.b01) : ""}
            ${sw.rounds.r3a ? renderSwissBracketM7("R3 - Bracket 2-0 (BO3)", sw.rounds.r3a.b20, "#00B37E") : ""}
            ${sw.rounds.r3a ? renderSwissBracketM7("R3 - Bracket 1-1 (BO1)", sw.rounds.r3a.b11) : ""}
            ${sw.rounds.r3b ? renderSwissBracketM7("R3 - Bracket 0-2 (BO3)", sw.rounds.r3b.b02, "#E5484D") : ""}
            ${sw.rounds.r4 ? renderSwissBracketM7("R4 - Bracket 2-1 (BO3)", sw.rounds.r4.b21, "#00B37E") : ""}
            ${sw.rounds.r4 ? renderSwissBracketM7("R4 - Bracket 1-2 (BO3)", sw.rounds.r4.b12, "#E5484D") : ""}
            ${sw.rounds.r5 ? renderSwissBracketM7("R5 - Bracket 2-2 (BO3)", sw.rounds.r5.b22, "#5B3DF5") : ""}
        </div></div>`;
        if (sw.qualified.length === 8) {
            html += `<div style="text-align:center;color:#00B37E;margin:10px 0;font-size:13px;">🏆 Lolos Knockout: <b>${sw.qualified.map(t => t.ref.nama).join(", ")}</b></div>`;
        }
    } else {
        html += `<div style="text-align:center;color:#666;font-size:12px;margin-top:5px;">Menunggu Wild Card selesai.</div>`;
    }

    // ============ KNOCKOUT ============
    html += `<div style="border-top:1px dashed var(--border-md);margin-top:15px;padding-top:15px;color:#E5484D;font-family:'Oswald',sans-serif;font-size:16px;text-align:center;letter-spacing:1px;">⚔️ KNOCKOUT STAGE (DOUBLE ELIMINATION)</div>`;
    if (window.knockoutM7Data) {
        html += renderKnockoutM7();
    } else {
        html += `<div style="text-align:center;color:#666;font-size:12px;margin-top:5px;">Menunggu Swiss Stage selesai.</div>`;
    }

    if (window.knockoutM7Data && window.knockoutM7Data.juaraM7) {
        html += `<div style="text-align:center;color:#C9971F;font-size:18px;font-weight:bold;margin:20px 0;">👑 JUARA M${edisiMSeries} WORLD CHAMPIONSHIP: ${window.knockoutM7Data.juaraM7.nama}</div>`;
    }

    container.innerHTML = html;
}

function generateRegionalBracketHTML(dataObj) {
    if (!dataObj || !dataObj.m1) {
        return `<div style="text-align:center; color:#666; margin-top:20px; font-size:12px;">Playoffs belum dimulai. Tuntaskan Regular Season dulu!</div>`;
    }
    return `
    <div class="bracket-container" style="padding-bottom: 20px;">
        <div class="bracket-round">
            <div class="round-title">M1 & M2 - BO5</div>
            ${renderBoxBracket(dataObj.m1, 1)}
            ${renderBoxBracket(dataObj.m2, 2)}
        </div>
        <div class="bracket-round">
            <div class="round-title">M3 & M4- BO5</div>
            ${renderBoxBracket(dataObj.m3, 3)}
            ${renderBoxBracket(dataObj.m4, 4)}
        </div>
        <div class="bracket-round">
            <div class="round-title">Final Upper Bracket<br>M6 - BO5</div>
            ${renderBoxBracket(dataObj.m6, 6)}
            <div class="round-title" style="margin-top:15px;">M5 - BO5</div>
            ${renderBoxBracket(dataObj.m5, 5)}
        </div>
        <div class="bracket-round" style="justify-content: flex-end;">
            <div class="round-title">Final Lower Bracket<br>M7 - BO7</div>
            ${renderBoxBracket(dataObj.m7, 7)}
        </div>
        <div class="bracket-round" style="justify-content: center;">
            <div class="round-title" style="color:#5B3DF5; font-size:10px;">QUALIFIED TO MSC/M-SERIES<br>GRAND FINAL<br>M8 - BO7</div>
            ${renderBoxBracket(dataObj.m8, 8)}
        </div>
    </div>`;
}

function renderSemuaBracketRegional() {
    if (getEl("playoffBracketID"))
        getEl("playoffBracketID").innerHTML =
            generateRegionalBracketHTML(pData);
    if (getEl("playoffBracketPH"))
        getEl("playoffBracketPH").innerHTML = generateRegionalBracketHTML(
            window.pDataPH
        );
    if (getEl("playoffBracketMY"))
        getEl("playoffBracketMY").innerHTML = generateRegionalBracketHTML(
            window.pDataMY
        );
    if (getEl("playoffBracketSG"))
        getEl("playoffBracketSG").innerHTML = generateRegionalBracketHTML(
            window.pDataSG
        );

    // [MSC x EWC 2026] Bracket playoff 9 region baru -- reuse
    // generateRegionalBracketHTML() yang sama, karena struktur pData
    // (m1-m8) 9 region baru ini identik sama region lama.
    (window.REGION_SINGLE_TIER_BARU || []).forEach(kode => {
        let elBracket = getEl("playoffBracket" + kode);
        if (elBracket) elBracket.innerHTML = generateRegionalBracketHTML(window["pData" + kode]);
    });
}

window.bukaInfoTim = function (namaTim) {
    // FIX FASE 15: cek semua 11 database, bukan cuma 4 MPL, supaya klik
    // nama tim dari klasemen MDL/LEN/MAL (Fase 11-13) tidak gagal diam-diam.
    let timCari = (typeof cariTimAsliDiDatabase === "function")
        ? cariTimAsliDiDatabase(namaTim)
        : null;

    if (!timCari) {
        let semuaRegion = [daftarTim, daftarTimPH, daftarTimMY, daftarTimSG];
        for (let region of semuaRegion) {
            let found = region.find(t => t.nama === namaTim);
            if (found) { timCari = found; break; }
        }
    }
    if (!timCari) return;

    // 1. Reset ke Tab Tim Setiap Dibuka
    gantiTabDetailTim("Tim");

    // 2. Info Header
    getEl("detailTimHeaderNama").innerText = timCari.nama;
    getEl("detailTimLogo").src = timCari.logo;

    // 3. Render Chemistry AI (Simulasi Visual)
    let chemScore = Math.min(100, Math.floor(timCari.power * 1.15)); // Anggap aja tim AI chemistry-nya ngikutin Power
    getEl("detailTimChemBar").style.width = chemScore + "%";
    let chemDesc = getEl("detailTimChemText");
    if (chemScore < 40) {
        chemDesc.innerText = "⚠️ Chemistry buruk!";
        chemDesc.style.color = "#E5484D";
        getEl("detailTimChemBar").style.background = "#E5484D";
    } else if (chemScore >= 80) {
        chemDesc.innerText = "🔥 Tim sangat kompak!";
        chemDesc.style.color = "#5B3DF5";
        getEl("detailTimChemBar").style.background =
            "linear-gradient(90deg, #5B3DF5, #E8720C)";
    } else {
        chemDesc.innerText = "Tim sedang membangun ritme.";
        chemDesc.style.color = "#5C6472";
        getEl("detailTimChemBar").style.background =
            "linear-gradient(90deg, #0891B2, #00B37E)";
    }

    // 4. Tentukan Starter/Sub untuk Tim AI
    let mainPlayers = [];
    if (timCari.nama !== timPlayer && timCari.roster) {
        let roles = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
        roles.forEach(role => {
            let pInRole = timCari.roster.filter(p => p.role === role);
            if (pInRole.length > 0) {
                pInRole.sort((a, b) => b.ovr - a.ovr);
                mainPlayers.push(pInRole[0].nama); // OVR tertinggi auto inti
            }
        });
    }

    // 5. Render Staff
    let isTimKita = timCari.nama === timPlayer;
    let htmlStaff = `<div class="roster-card-list">`;
    let staffData = isTimKita ? staffKita : timCari.staff;

    const renderRowStaff = (s, labelPosisi, roleKey) => {
        if (!s) {
            return `<div class="roster-card roster-card--empty">
                <div class="roster-card__main">
                    <div class="roster-card__name" style="color:var(--text-3);">Posisi Kosong</div>
                    <div class="roster-card__meta"><span>${labelPosisi}</span></div>
                </div>
            </div>`;
        }
        if (isTimKita) {
            return `<div class="roster-card" style="cursor:default;">
                <div class="roster-card__main">
                    <div class="roster-card__name">${s.nama}</div>
                    <div class="roster-card__meta"><span>${labelPosisi}</span><span>${s.umur || "-"} th</span></div>
                </div>
            </div>`;
        }
        // Tim lawan — tampilkan info kontrak & tombol surat
        let kontrakHabis = (s.sisaKontrak || 1) <= 1;
        let sudahKirimSurat = typeof daftarSuratStaff !== "undefined" &&
            daftarSuratStaff.some(sr => sr.staff.nama === s.nama && sr.musimKirim === musimKe && sr.status === "PENDING");

        let badgeKontrak = kontrakHabis
            ? `<span class="roster-card__tag" style="background:rgba(255,193,7,0.15);color:#C9971F;">Kontrak Habis</span>`
            : `<span style="font-size:10px;color:var(--text-3);">${s.sisaKontrak || "?"} musim lagi</span>`;

        let tombol = sudahKirimSurat
            ? `<button class="roster-card__btn" disabled style="opacity:0.5;">✉️ Terkirim</button>`
            : kontrakHabis
                ? `<button class="roster-card__btn" style="border-color:#C9971F;color:#C9971F;" onclick="kirimSuratKetertarikanStaff('${s.nama}','${timCari.nama}','${roleKey}')">✉️ Kirim Surat</button>`
                : `<button class="roster-card__btn" disabled title="Kontrak masih aktif" style="opacity:0.4;">🔒 Terikat</button>`;

        return `<div class="roster-card" style="cursor:default;">
            <div class="roster-card__main">
                <div class="roster-card__name">${s.nama} ${badgeKontrak}</div>
                <div class="roster-card__meta"><span>${labelPosisi}</span></div>
            </div>
            ${tombol}
        </div>`;
    };

    htmlStaff += renderRowStaff(staffData?.pelatih, "Pelatih Kepala", "pelatih");
    htmlStaff += renderRowStaff(staffData?.asisten, "Asisten Pelatih", "asisten");
    htmlStaff += renderRowStaff(staffData?.analis, "Analis", "analis");
    htmlStaff += `</div>`;
    getEl("detailTimStaff").innerHTML = htmlStaff;

    // 6. Render Roster
    let htmlRoster = `<div class="roster-card-list">`;
    let targetRoster = timCari.nama === timPlayer ? rosterKita : timCari.roster;

    if (targetRoster && targetRoster.length > 0) {
        let sortedRoster = [...targetRoster].sort((a, b) => b.ovr - a.ovr);
        sortedRoster.forEach(p => {
            let isInti =
                (timCari.nama === timPlayer && p.isStarter) ||
                mainPlayers.includes(p.nama);
            let tagHtml = isInti
                ? `<span class="roster-card__tag roster-card__tag--inti">▲ INTI</span>`
                : `<span class="roster-card__tag roster-card__tag--sub">▼ SUB</span>`;

            let isScouted = timCari.nama === timPlayer ? true : p.scouted;
            let tampilUmur = isScouted ? p.umur : "?";
            let tahunHabis = kalenderGame.getFullYear() + (p.sisaKontrak || 0);
            let tampilKontrak = p.sisaKontrak ? tahunHabis : "?";
            let tampilOvr = isScouted ? p.ovr : "?";
            let isKlikabel = timCari.nama !== timPlayer;
            let clickAttr = isKlikabel
                ? ` onclick="bukaProfilPemain('TIMLAIN', '${p.nama}', '${timCari.nama}')" style="cursor:pointer;"`
                : ` style="cursor:default;"`;

            htmlRoster += `
            <div class="roster-card"${clickAttr}>
                <div class="roster-card__main">
                    <div class="roster-card__name">${p.nama} ${tagHtml}</div>
                    <div class="roster-card__meta"><span>${p.role}</span><span>${tampilUmur} th</span><span>Kontrak s.d. ${tampilKontrak}</span></div>
                </div>
                <div class="roster-card__right">
                    <div class="roster-card__ovr">${tampilOvr}</div>
                    <div class="roster-card__ovr-label">OVR</div>
                </div>
            </div>`;
        });
    } else {
        htmlRoster += `<div style="color:#666; font-style:italic; text-align:center; padding:14px;">Roster tidak ditemukan.</div>`;
    }
    htmlRoster += `</div>`;
    getEl("detailTimRoster").innerHTML = htmlRoster;

    // 7. Render Keuangan (Kas AI & Riwayat Juara)
    let kasTampil =
        timCari.kas !== undefined ? timCari.kas : timCari.power * 250000; // Dummy fallback
    getEl("detailTimKas").innerText = `Rp ${kasTampil.toLocaleString("id-ID")}`;

    let htmlRiwayat = "";
    let riwayatGabungan = [];
    if (timCari.riwayatLama)
        timCari.riwayatLama.forEach(r =>
            riwayatGabungan.push({ tahun: r.tahun, gelar: r.gelar })
        );
    bankRiwayatJuara.forEach(r => {
        if (r.tim.nama === timCari.nama)
            riwayatGabungan.push({
                tahun: r.tahun,
                gelar: r.negara.includes("🌐")
                    ? r.negara
                    : `Juara MPL ${r.negara}`
            });
    });

    if (riwayatGabungan.length > 0) {
        riwayatGabungan.sort((a, b) => b.tahun - a.tahun);
        riwayatGabungan.forEach(r => {
            htmlRiwayat += `<div style="display:flex; gap:10px; border-bottom:1px dashed var(--border-md); padding:8px 0; font-size:13px;"><span style="color:#5B3DF5; width:50px; font-weight:bold;">${r.tahun}</span><span style="color:#12151C;">${r.gelar}</span></div>`;
        });
    } else {
        htmlRiwayat =
            "<div style='color:#666; font-size:12px; font-style:italic;'>Tim ini belum pernah mengangkat trofi bergengsi.</div>";
    }
    getEl("detailTimRiwayat").innerHTML = htmlRiwayat;

    // 8. Render Jadwal Tim Tersebut
    let htmlJadwal = "";
    let matchTim = bankJadwalMaster.filter(
        m => m.home.nama === timCari.nama || m.away.nama === timCari.nama
    );
    if (matchTim.length > 0) {
        let tglSkrg = "";
        matchTim.forEach(m => {
            if (m.tanggal !== tglSkrg) {
                tglSkrg = m.tanggal;
                htmlJadwal += `<div class="log-hari-header">Week ${m.week} - ${tglSkrg}</div>`;
            }
            let skorTeks = m.sudahMain ? `${m.skorHome} - ${m.skorAway}` : "VS";
            htmlJadwal += `<div class="log-item-card"><div class="log-tim-info home"><img src="${m.home.logo}" class="logo-tim"><span class="log-tim-name">${m.home.nama}</span></div><div class="log-skor-box">${skorTeks}</div><div class="log-tim-info away"><span class="log-tim-name">${m.away.nama}</span><img src="${m.away.logo}" class="logo-tim"></div></div>`;
        });
    } else {
        htmlJadwal = `<div style="text-align:center; padding:20px; color:#666;">Belum ada jadwal pertandingan.</div>`;
    }
    getEl("detailTimLogMatch").innerHTML = htmlJadwal;

    bukaSubLayar("layarDetailTim");
};

window.gantiTabDetailTim = function (namaTab) {
    getEl("tabDetailTim").classList.add("sembunyi");
    getEl("tabDetailKeuangan").classList.add("sembunyi");
    getEl("tabDetailJadwal").classList.add("sembunyi");

    getEl("btnTabDetailTim").classList.remove("aktif");
    getEl("btnTabDetailKeuangan").classList.remove("aktif");
    getEl("btnTabDetailJadwal").classList.remove("aktif");

    if (namaTab === "Tim") {
        getEl("tabDetailTim").classList.remove("sembunyi");
        getEl("btnTabDetailTim").classList.add("aktif");
    } else if (namaTab === "Keuangan") {
        getEl("tabDetailKeuangan").classList.remove("sembunyi");
        getEl("btnTabDetailKeuangan").classList.add("aktif");
    } else if (namaTab === "Jadwal") {
        getEl("tabDetailJadwal").classList.remove("sembunyi");
        getEl("btnTabDetailJadwal").classList.add("aktif");
    }
    window.scrollTo(0, 0);
};

// ==========================================================
// [FIX] Widget "Container Box" di Dashboard buat MSC & M7 --
// SEBELUMNYA SELALU nampilin kartu promo statis "CEK BRACKET MSC/M7",
// gak peduli tim player lagi ada match aktif atau kagak. Sekarang:
// begitu tim player ketemu di match manapun yang lagi aktif (SEMUA
// fase -- termasuk Wild Card round-robin & Swiss Stage, bukan cuma
// bracket 1v1), match itu ditampilin (VS kalau belum disimulasikan,
// skor kalau udah). Kalau tim player udah KALAH (tereliminasi) di
// match terakhirnya, ATAU emang gak ketemu sama sekali (masih nunggu
// fase berikutnya diinisialisasi), tetep balik ke kartu promo
// "CEK BRACKET" seperti semula.
// ==========================================================
function _mNmValid(m) {
    return !!(m && m.home && m.away && (m.home.nama === timPlayer || m.away.nama === timPlayer));
}
function _mNmEliminated(m) {
    return !!(m && m.menang && m.kalah && m.kalah.nama === timPlayer);
}
// [FIX] SEBELUMNYA _mNmValid dipakai buat nyari match, TAPI itu gak peduli
// match-nya udah disimulasikan (m.menang ada) atau belum -- jadi match
// yang tim player MENANGIN tetep "nyangkut" ditampilin terus tiap hari
// sampai pairing berikutnya di-reveal, padahal harusnya begitu match
// selesai & belum ada pairing baru, widget balik ke "CEK BRACKET" (lagi
// nunggu). Sekarang search HARUS pakai versi yang nolak match yang UDAH
// disimulasikan -- cuma match yang BENERAN belum main yang boleh tampil.
function _mNmPending(m) {
    return _mNmValid(m) && !m.menang;
}

function cariMatchAktifTimPlayerMSC() {
    let wc = window.wildCardData;
    let gs = window.groupStageData;
    let kd = window.knockoutData;

    // Urutan PALING BARU -> PALING LAMA, biar begitu fase lanjutan
    // udah diinisialisasi, itu yang diprioritasin ketimbang fase lama.
    if (kd) {
        if (_mNmPending(kd.grandFinal)) return { m: kd.grandFinal, label: "GRAND FINAL MSC" };
        if (_mNmPending(kd.juara3Match)) return { m: kd.juara3Match, label: "PEREBUTAN JUARA 3 MSC" };
        let sfK = [kd.sf1, kd.sf2].find(m => _mNmPending(m));
        if (sfK) return { m: sfK, label: "KNOCKOUT SEMIFINAL MSC" };
        let qfK = [kd.qf1, kd.qf2, kd.qf3, kd.qf4].find(m => _mNmPending(m));
        if (qfK) return { m: qfK, label: "KNOCKOUT QUARTERFINAL MSC" };
    }
    if (gs) {
        for (let kodeGrup of ["A", "B"]) {
            let g = gs[kodeGrup];
            if (!g) continue;
            for (let key of ["m10", "m9", "m8", "m7", "m6", "m5", "m4", "m3", "m2", "m1"]) {
                if (_mNmPending(g[key])) return { m: g[key], label: `GROUP STAGE MSC - GRUP ${kodeGrup}` };
            }
        }
    }
    if (wc) {
        if (wc.finalBracket) {
            let fbK = [wc.finalBracket.m3, wc.finalBracket.m2, wc.finalBracket.m1].find(m => _mNmPending(m));
            if (fbK) return { m: fbK, label: "WILD CARD FINAL BRACKET" };
        }
        if (wc.gauntlet) {
            let gK = [wc.gauntlet.m2A, wc.gauntlet.m2B, wc.gauntlet.m1A, wc.gauntlet.m1B].find(m => _mNmPending(m));
            if (gK) return { m: gK, label: "WILD CARD GAUNTLET" };
        }

        // Belum ada hasil sama sekali -- cek jadwal hari ini yang belum
        // disimulasikan (state di antara wcMulai & wcDay1/wcDay2).
        let st = window.mscEwcState;
        if (st && wc.jadwalA) {
            let slice = !st.wcDay1 ? [0, 5] : (!st.wcDay2 ? [5, 10] : null);
            if (slice) {
                let pasangan = [...wc.jadwalA.slice(slice[0], slice[1]), ...wc.jadwalB.slice(slice[0], slice[1])]
                    .find(([a, b]) => a.nama === timPlayer || b.nama === timPlayer);
                if (pasangan) return { m: { home: pasangan[0], away: pasangan[1] }, label: `WILD CARD DAY ${!st.wcDay1 ? 1 : 2}` };
            }
        }
    }
    return null;
}

function cariMatchAktifTimPlayerM7() {
    let wc = window.wildCardM7Data;
    let sw = window.swissM7Data;
    let kd = window.knockoutM7Data;

    if (kd) {
        if (_mNmPending(kd.grandFinal)) return { m: kd.grandFinal, label: "GRAND FINAL M7" };
        if (_mNmPending(kd.lbfinal)) return { m: kd.lbfinal, label: "LOWER BRACKET FINAL" };
        if (_mNmPending(kd.ubfinal)) return { m: kd.ubfinal, label: "UPPER BRACKET FINAL" };
        if (_mNmPending(kd.lbr3)) return { m: kd.lbr3, label: "LOWER BRACKET ROUND 3" };
        if (kd.lbr2) {
            let f = [kd.lbr2.m1, kd.lbr2.m2].find(m => _mNmPending(m));
            if (f) return { m: f, label: "LOWER BRACKET ROUND 2" };
        }
        if (kd.ubsf) {
            let f = [kd.ubsf.m1, kd.ubsf.m2].find(m => _mNmPending(m));
            if (f) return { m: f, label: "UPPER BRACKET SEMIFINAL" };
        }
        if (kd.lbr1) {
            let f = [kd.lbr1.m1, kd.lbr1.m2].find(m => _mNmPending(m));
            if (f) return { m: f, label: "LOWER BRACKET ROUND 1" };
        }
        if (kd.ubqf) {
            let f = [kd.ubqf.m1, kd.ubqf.m2, kd.ubqf.m3, kd.ubqf.m4].find(m => _mNmPending(m));
            if (f) return { m: f, label: "UPPER BRACKET QUARTERFINAL" };
        }
    }
    if (sw && sw.rounds) {
        let semuaRound = [
            ["SWISS STAGE R5", sw.rounds.r5 ? sw.rounds.r5.b22 : null],
            ["SWISS STAGE R4", sw.rounds.r4 ? [...(sw.rounds.r4.b21 || []), ...(sw.rounds.r4.b12 || [])] : null],
            ["SWISS STAGE R3", sw.rounds.r3b ? sw.rounds.r3b.b02 : null],
            ["SWISS STAGE R3", sw.rounds.r3a ? [...(sw.rounds.r3a.b20 || []), ...(sw.rounds.r3a.b11 || [])] : null],
            ["SWISS STAGE R2", sw.rounds.r2 ? [...(sw.rounds.r2.b10 || []), ...(sw.rounds.r2.b01 || [])] : null],
            ["SWISS STAGE R1", sw.rounds.r1]
        ];
        for (let [label, arr] of semuaRound) {
            if (!arr) continue;
            let f = arr.find(m => _mNmPending(m));
            if (f) return { m: f, label };
        }
    }
    if (wc) {
        if (wc.semifinal) {
            let f = [wc.semifinal.sf1, wc.semifinal.sf2].find(m => _mNmPending(m));
            if (f) return { m: f, label: "WILD CARD QUALIFICATION MATCH" };
        }

        let st = window.m7State;
        if (wc.jadwalA && st) {
            let idx = !st.wcDay1 ? 0 : (!st.wcDay2 ? 1 : (!st.wcDay3 ? 2 : -1));
            if (idx >= 0) {
                let pasangan = [...(wc.jadwalA[idx] || []), ...(wc.jadwalB[idx] || [])]
                    .find(([a, b]) => a.nama === timPlayer || b.nama === timPlayer);
                if (pasangan) return { m: { home: pasangan[0], away: pasangan[1] }, label: `WILD CARD DAY ${idx + 1}` };
            }
        }
    }
    return null;
}

// Render kartu "nm-teams" (logo vs logo) buat 1 match MSC/M7 -- dipakai
// bareng oleh 2 blok statusGame di updateDashboard() di bawah.
// [FIX] SEBELUMNYA nampilin label fase (mis. "GROUP STAGE MSC - GRUP A")
// di bawah logo, sementara widget PLAYOFF/MPL nampilin Hari+Tanggal --
// gak konsisten. Sekarang disamain: SEMUA widget (PLAYOFF, MSC, M7)
// nampilin Hari+Tanggal doang di bawah "Logo Tim vs Logo Tim", persis
// konsep Regular Season/Playoff (label fase udah ada di header
// "STATUS MUSIM" di atas, jadi gak perlu diulang di sini).
function _renderNmMatchMSCM7(aktif) {
    let m = aktif.m;
    return `<div class="nm-wrapper"><div class="nm-inner"><div class="nm-teams"><div class="nm-team"><img src="${m.home.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${m.home.nama}&background=333&color=fff'"><span class="nm-name">${m.home.nama}</span></div><div class="nm-vs">VS</div><div class="nm-team"><img src="${m.away.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${m.away.nama}&background=333&color=fff'"><span class="nm-name">${m.away.nama}</span></div></div><div class="nm-date">${dapetHariTanggalLengkap(kalenderGame)}</div></div></div>`;
}

// [FIX] Label "M7 World Championship" di menu Liga Dunia & header layar
// M-Series sebelumnya statis di HTML (hardcode "M7"), gak pernah
// disesuaikan sama edisiMSeries yang sebenarnya. Dipanggil tiap
// updateDashboard() biar selalu sinkron.
function updateLabelMSeries() {
    let nomor = edisiMSeries > 0 ? edisiMSeries : 1;
    let navLabel = getEl("navLabelMSeries");
    if (navLabel) navLabel.textContent = `M${nomor} World Championship`;
    let headerLabel = getEl("headerLabelMSeries");
    if (headerLabel) headerLabel.textContent = `🏆 M${nomor} WORLD CHAMPIONSHIP`;
}

function updateDashboard() {
    renderBerita(); // <--- TAMBAHIN BARIS INI
    updateLabelMSeries();
    // (BAGIAN ATAS UPDATE DASHBOARD)
    let roles = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
    let totalOVR = 0;
    let mainPlayers = [];
    let mainPlayersObj = [];

    roles.forEach(role => {
        let pInRole = rosterKita.filter(p => p.role === role);
        if (pInRole.length > 0) {
            // 1. Cari siapa yang statusnya Starter
            let starter = pInRole.find(p => p.isStarter === true);

            // 2. Fallback: Kalau belum ada yang di-set (misal awal game atau abis jual pemain)
            // Otomatis pilih yang OVR tertinggi jadi Starter sementara
            if (!starter) {
                pInRole.sort((a, b) => b.ovr - a.ovr);
                starter = pInRole[0];
                starter.isStarter = true;
            }

            totalOVR += starter.ovr;
            mainPlayers.push(starter.nama);
            mainPlayersObj.push(starter);
        }
    });

    let basePower = Math.floor(totalOVR / 5);

    // --- LOGIKA TEAM CHEMISTRY ---
    let chemScore = 50; // Base awal
    let countPekerjaKeras = 0;
    let countMalas = 0;
    let countries = {};

    if (mainPlayersObj.length === 5) {
        mainPlayersObj.forEach(p => {
            let s = p.sifat ? p.sifat : "Normal";
            if (s === "Pekerja Keras") countPekerjaKeras++;
            if (s === "Malas") countMalas++;

            let negara = p.negara ? p.negara : "🇮🇩 Indonesia";
            if (!countries[negara]) countries[negara] = 0;
            countries[negara]++;
        });

        // Efek Clash Sifat Kepribadian
        if (countPekerjaKeras >= 3) chemScore += 25; // Skuad rajin dapet bonus besar
        if (countMalas > 0) chemScore -= countMalas * 15; // Si pemalas ngerusak tim
        if (countPekerjaKeras > 0 && countMalas > 0) chemScore -= 15; // Berantem di ruang ganti
        // Efek Moral Hancur (Cadangan Toxic)
        let toxicPlayers = rosterKita.filter(
            p => p.moral !== undefined && p.moral < 30
        ).length;
        if (toxicPlayers > 0) {
            chemScore -= toxicPlayers * 15; // Tiap 1 pemain ngambek, chem dipotong 15%
        }

        // Efek Satu Negara (Kesamaan Bahasa)
        let maxSameCountry = Math.max(...Object.values(countries));
        if (maxSameCountry === 5)
            chemScore += 20; // Full 1 negara kompak parah
        else if (maxSameCountry >= 3) chemScore += 10;
    } else {
        chemScore = 0; // Kalau roster inti gak lengkap 5 role
    }

    if (chemScore > 100) chemScore = 100;
    if (chemScore < 0) chemScore = 0;

    // --- RENDER UI CHEMISTRY KE LAYAR ---
    if (getEl("chemValueText")) {
        getEl("chemValueText").innerText = chemScore + "%";
        let fillBar = getEl("chemBarFill");
        fillBar.style.width = chemScore + "%";

        let valColor = "#0891B2";
        let descText = "Tim masih mencari ritme bermain.";
        if (chemScore < 40) {
            valColor = "#E5484D";
            descText = "⚠️ Chemistry buruk!";
            fillBar.style.background = "#E5484D";
        } else if (chemScore >= 80) {
            valColor = "#5B3DF5";
            descText = "🔥 Tim sangat kompak! Mendapat bonus Power +10%.";
            fillBar.style.background =
                "linear-gradient(90deg, #5B3DF5, #E8720C)";
        } else {
            fillBar.style.background =
                "linear-gradient(90deg, #0891B2, #00B37E)";
        }

        getEl("chemValueText").style.color = valColor;
        getEl("chemDescText").innerHTML = descText;
    }

    // --- HITUNG FINAL POWER TIM ---
    let buffStaff = 0;
    if (staffKita.pelatih) buffStaff += staffKita.pelatih.buffPower;
    if (staffKita.asisten) buffStaff += staffKita.asisten.buffPower;
    if (staffKita.analis) buffStaff += staffKita.analis.buffPower;

    let powerAkhir = basePower + buffStaff;

    // POTONG ATAU TAMBAH POWER BERDASARKAN CHEMISTRY
    if (chemScore >= 80)
        powerAkhir += Math.floor((basePower + buffStaff) * 0.1); // Bonus +10%
    else if (chemScore < 40)
        powerAkhir -= Math.floor((basePower + buffStaff) * 0.1); // Hukuman -10%

    // --- KODE BARU: LIMIT POWER MENTOK DI 100 ---
    if (powerAkhir > 100) powerAkhir = 100;

    // ===============================================
    // --- UPDATE UI BOX DETAIL POWER & REPUTASI ---
    // ===============================================
    if (getEl("detailPowerPemain")) {
        getEl("detailPowerPemain").innerText = basePower;
        getEl("detailPowerStaff").innerText = "+" + buffStaff;

        // Kalkulasi visual efek chemistry
        let efekChemVisual = 0;
        if (chemScore >= 80)
            efekChemVisual = Math.floor((basePower + buffStaff) * 0.1);
        else if (chemScore < 40)
            efekChemVisual = -Math.floor((basePower + buffStaff) * 0.1);

        let elChem = getEl("detailPowerChem");
        if (efekChemVisual > 0) {
            elChem.innerText = "+" + efekChemVisual;
            elChem.style.color = "#5B3DF5"; // Gold
        } else if (efekChemVisual < 0) {
            elChem.innerText = efekChemVisual;
            elChem.style.color = "#E5484D"; // Merah
        } else {
            elChem.innerText = "0";
            elChem.style.color = "#5C6472"; // Abu-abu
        }

        getEl("detailPowerTotal").innerText = powerAkhir;
        getEl("detailReputasiTim").innerText =
            typeof reputasiManajer !== "undefined"
                ? reputasiManajer + " Poin"
                : "0 Poin";
    }
    // ===============================================

    // === FASE 15 FIX ===
    // SEBELUMNYA: timKita.power = powerAkhir (di-assign tiap render
    // dashboard, melanggar prinsip "power dasar cuma berubah saat
    // transfer"). SEKARANG: powerAkhir HANYA dipakai utk tampilan
    // (dashPower & detail breakdown di atas) -- TIDAK ditulis permanen
    // ke database tim. Power dasar tim (tim.power) hanya diubah oleh
    // fungsi-fungsi yang terkait transfer (lihat hitungPowerTim() &
    // titik-titik pemanggilannya di script.js/acquisition_merger_patch.js).
    //
    // Bug tambahan yang ikut diperbaiki: pencarian timKita sebelumnya
    // cuma cek 4 database MPL (daftarTim/PH/MY/SG), jadi kalau player
    // main di MDL/MAL/LEN, timKita selalu undefined. Sekarang pakai
    // cariTimAsliDiDatabase() yang sudah cek semua 11 database (Fase 4).

    // Tampilin Power di Top Bar (Dash) -- nilai TAMPILAN saja
    getEl("dashPower").innerText = powerAkhir;

    getEl("dashKas").innerText = `Rp ${kasTim.toLocaleString("id-ID")}`;
    renderKas();

    getEl("dashTgl").innerText = dapetTanggalTeks(); // Tampilkan tanggal kalender (gak usah disamarkan lagi)

    let teksStatus = "";
    if (statusGame === "PRAMUSIM" || statusGame === "OFFSEASON")
        teksStatus = `Off-Season S${musimKe}`;
    else if (
        statusGame === "PLAYOFF" ||
        statusGame === "JUARA" ||
        statusGame === "MSC" ||
        statusGame === "MSERIES"
    )
        teksStatus = `GLOBAL / PLAYOFFS S${musimKe}`;
    else teksStatus = `Season ${musimKe} - W${mingguKe}`;


    // --- LOGIKA SISTEM TRANSFER BARU SESUAI GAMBAR ---
    let statusTransferLama = transferBuka;

    // [FIX] BUG: transferBuka ketutup prematur buat pemain MPL/LEN.
    // Begitu MDL (liga LAIN) mulai reguler season-nya, statusGame ke-flip
    // global jadi "REGULER" -- padahal liga PEMAIN SENDIRI (MPL/LEN)
    // belum mulai sama sekali (roster lock-nya masih berhari-hari lagi).
    // Widget "STATUS MUSIM" di bawah UDAH benar ngenalin fase transisi
    // ini dan tetap nampilin countdown ala-PRAMUSIM (roster lock, MPL
    // mulai, dst) -- tapi logic transferBuka di sini cuma ngecek literal
    // statusGame === "PRAMUSIM", jadi ketutup duluan padahal dashboard-nya
    // sendiri masih bilang "Transfer Ditutup: dalam 38 hari" (which
    // means belum ditutup). Makanya Dashboard & halaman Transfer
    // kontradiksi. Sekarang dicek pake gate transisi yang SAMA persis
    // dengan yang dipakai widget di bawah.
    let _ligaTransferGate = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
    let _tblTransferGate = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
    let _masihFaseTransisiMPLBelumMulai = (
        statusGame === "REGULER" &&
        _ligaTransferGate !== "MDL" &&
        _tblTransferGate &&
        typeof tanggalSetelahAtauSama === "function" &&
        !tanggalSetelahAtauSama(kalenderGame, _tblTransferGate.mplLenMulai)
    );

    // [FIX BARU] BUG: transferBuka ketutup pas MSC/M7 lagi JALAN, padahal
    // di realita transfer window MPL/LEN itu CALENDAR-DRIVEN (25 Mei - 27
    // Jul buat S18) dan gak peduli turnamen internasional apa yang lagi
    // berlangsung bareng. Sebelumnya statusGame pas MSC/M7 jalan itu BUKAN
    // salah satu dari PRAMUSIM/MID_SEASON/JEDA_TRANSFER, jadi selalu
    // ke-force TUTUP -- padahal tanggalnya masih di dalam window resmi.
    // Sekarang dicek juga langsung ke tanggal transferWindowMulaiMPL &
    // rosterLockMPL, independen dari statusGame apapun yang lagi aktif.
    let _dalamWindowTransferKalender = (
        _ligaTransferGate !== "MDL" &&
        _tblTransferGate &&
        _tblTransferGate.transferWindowMulaiMPL &&
        _tblTransferGate.rosterLockMPL &&
        typeof tanggalSetelahAtauSama === "function" &&
        tanggalSetelahAtauSama(kalenderGame, _tblTransferGate.transferWindowMulaiMPL) &&
        !tanggalSetelahAtauSama(kalenderGame, _tblTransferGate.rosterLockMPL)
    );

    // HANYA BUKA PAS PRAMUSIM, JEDA TENGAH MUSIM (7 HARI), & JEDA TRANSFER
    // PASCA-MSC (30 hari, di-set oleh selesaikanMSCEwc() di msc_ewc_engine.js).
    // [FIX] Sebelumnya JEDA_TRANSFER gak ada di daftar ini, jadi tiap kali
    // updateDashboard() jalan, transferBuka yang udah di-set true oleh
    // selesaikanMSCEwc() langsung ke-override balik jadi false -- padahal
    // widget Status Musim (yang baca statusGame langsung, bukan transferBuka)
    // tetap nunjukin "BURSA TRANSFER TERBUKA". Makanya Dashboard & halaman
    // Transfer kelihatan kontradiksi.
    if (statusGame === "PRAMUSIM" || statusGame === "MID_SEASON" || statusGame === "JEDA_TRANSFER" || _masihFaseTransisiMPLBelumMulai || _dalamWindowTransferKalender) {
        transferBuka = true;
    } else {
        transferBuka = false; // Week 1-4, Week 5-9, dan Playoffs -> TUTUP
    }

    if (
        statusTransferLama === false &&
        transferBuka === true &&
        statusGame === "MID_SEASON"
    ) {
        tambahBerita(
            "🔓 <span>MID-SEASON Transfer BUKA!</span> Punya waktu 7 hari untuk rombak roster."
        );
    } else if (
        statusTransferLama === true &&
        transferBuka === false &&
        statusGame === "REGULER" &&
        mingguKe === 5
    ) {
        tambahBerita(
            "🔒 <span>BURSA Transfer DITUTUP!</span> Roster terkunci sampai akhir musim."
        );
    }



    let sortedRoster = [...rosterKita].sort((a, b) => {
        let isAInti = mainPlayers.includes(a.nama) ? 1 : 0;
        let isBInti = mainPlayers.includes(b.nama) ? 1 : 0;
        return isBInti - isAInti;
    });

    // CARD ROSTER — diganti dari tabel ke list kartu (mobile-friendly)
    let htmlRoster = `<div class="roster-card-list">`;

    sortedRoster.forEach(p => {
        let isInti = mainPlayers.includes(p.nama);
        let tagHtml = isInti
            ? `<span class="roster-card__tag roster-card__tag--inti">▲ INTI</span>`
            : `<span class="roster-card__tag roster-card__tag--sub">▼ SUB</span>`;

        // --- LOGIKA TAMPILAN MORAL ---
        if (p.moral === undefined) p.moral = 100;
        let moralCls = "prima", moralIcon = "fa-face-smile";
        if (p.moral < 30) { moralCls = "marah";  moralIcon = "fa-face-angry"; }
        else if (p.moral < 60) { moralCls = "kecewa"; moralIcon = "fa-face-frown"; }
        else if (p.moral < 80) { moralCls = "netral"; moralIcon = "fa-face-meh"; }
        let moralHtml = `<span class="roster-moral-icon roster-moral-icon--${moralCls}" title="Moral: ${p.moral}%"><i class="fa-solid ${moralIcon}"></i></span>`;

        // MENGHITUNG TAHUN BERAKHIRNYA KONTRAK
        let tahunHabis = kalenderGame.getFullYear() + p.sisaKontrak;

        htmlRoster += `
        <div class="roster-card" onclick="bukaProfilPemain('ROSTER', '${p.nama}')">
            <div class="roster-card__main">
                <div class="roster-card__name">${p.nama} ${moralHtml} ${tagHtml}</div>
                <div class="roster-card__meta"><span>${p.role}</span><span>${p.umur} th</span><span>Kontrak s.d. ${tahunHabis}</span></div>
            </div>
            <div class="roster-card__right">
                <div class="roster-card__ovr">${p.ovr}</div>
                <div class="roster-card__ovr-label">OVR</div>
            </div>
        </div>`;
    });

    htmlRoster += `</div>
    <p style="text-align: center; color: #666; font-size: 10px; margin-top: 15px;">*Klik nama pemain untuk melihat detail & negosiasi kontrak.</p>`;

    getEl("listRoster").innerHTML = htmlRoster;

    // --- RENDER STAFF KITA ---
    let htmlKita = `<div class="roster-card-list">`;

    let roleStaffs = [
        { key: "pelatih", label: "Pelatih Kepala" },
        { key: "asisten", label: "Asisten Pelatih" },
        { key: "analis", label: "Analis" }
    ];

    roleStaffs.forEach(r => {
        let s = staffKita[r.key];
        if (s) {
            // Fix: Kalau belum punya umur, kasih random 30-40 tahun dan simpan permanen
            if (!s.umur) s.umur = Math.floor(Math.random() * 11) + 30;

            htmlKita += `
            <div class="roster-card">
                <div class="roster-card__main" onclick="bukaProfilStaff('TIM', '${r.key}')" style="cursor:pointer;">
                    <div class="roster-card__name">${s.nama}</div>
                    <div class="roster-card__meta"><span>${r.label}</span><span>${s.umur} th</span></div>
                </div>
                <div class="roster-card__right">
                    <span class="roster-card__buff">+${s.buffPower}</span>
                </div>
                <button class="roster-card__btn roster-card__btn--danger" onclick="event.stopPropagation();pecatStaff('${r.key}')">PECAT</button>
            </div>`;
        } else {
            htmlKita += `
            <div class="roster-card roster-card--empty">
                <div class="roster-card__main">
                    <div class="roster-card__name" style="color:var(--text-3);">Posisi Kosong</div>
                    <div class="roster-card__meta"><span>${r.label}</span></div>
                </div>
                <button class="roster-card__btn" onclick="bukaSubLayar('layarTransfer')">CARI</button>
            </div>`;
        }
    });
    htmlKita += `</div>`;

    if (getEl("widgetStaffKita")) getEl("widgetStaffKita").innerHTML = htmlKita;

    // --- RENDER BURSA TRANSFER GABUNGAN (PEMAIN & STAFF) ---
    let htmlTransfer = "";
    let statusRosterLockUI = (typeof timPlayerSedangRosterLock === "function") ? timPlayerSedangRosterLock() : { terkunci: false };

    if (!apakahTransferTerbuka() || statusRosterLockUI.terkunci) {
        getEl("notifTransfer").classList.remove("sembunyi");
        getEl("notifTransfer").innerHTML = statusRosterLockUI.terkunci
            ? (typeof pesanRosterLockAktif === "function" ? pesanRosterLockAktif(statusRosterLockUI) : "🔒 Roster Lock aktif! Transfer ditutup sampai musim ini berakhir.")
            : "⚠️ Bursa Transfer ditutup!";
    } else {
        getEl("notifTransfer").classList.add("sembunyi");

        // [FIX] Guard defensif -- konsisten dengan pola typeof check yang
        // udah dipakai di patches_roster.js/akademi_v3.js/patches_financial.js.
        // Kalau pemainTransfer belum ke-bind pas titik ini (race condition
        // saat load), fallback ke array kosong biar updateDashboard() gak
        // crash di tengah jalan (yang bikin Status Musim & Klasemen di
        // bawahnya ikut gak pernah ke-render).
        let daftarBursaPemain = (typeof pemainTransfer !== "undefined") ? pemainTransfer : [];

        // Bangun dataset gabungan pemain + staff -- satu sumber data
        // dipakai bareng buat render tabel & buat filter pencarian.
        window._bursaTransferData = [];
        daftarBursaPemain.forEach((p, i) => {
            if (p.sedangDinego) return; // Sembunyiin kalau lagi mikir proposal kita
            window._bursaTransferData.push({
                tipe: "PEMAIN", idx: i, nama: p.nama, role: p.role,
                umur: p.umur, harga: p.harga, negara: p.negara || "🌐 Global"
            });
        });
        bursaStaff.forEach((s, index) => {
            if (!s.umur) s.umur = Math.floor(Math.random() * 11) + 30; // Sama kayak sebelumnya, simpan permanen
            window._bursaTransferData.push({
                tipe: "STAFF", idx: index, nama: s.nama, role: s.role,
                umur: s.umur, harga: s.harga, negara: s.negara || "🌐 Global"
            });
        });

        htmlTransfer = `
        <div class="bursa-filter-bar">
            <input id="bursaFilterNama" type="text" class="bursa-filter-search" placeholder="🔍 Cari nama..." oninput="renderBursaTransferRows()">
            <div class="bursa-filter-row">
                <select id="bursaFilterRole" class="bursa-filter-select" onchange="renderBursaTransferRows()"><option value="">Semua Role</option></select>
                <select id="bursaFilterUmur" class="bursa-filter-select" onchange="renderBursaTransferRows()">
                    <option value="">Semua Umur</option>
                    <option value="muda">≤ 20 Thn</option>
                    <option value="prima">21–25 Thn</option>
                    <option value="matang">26–30 Thn</option>
                    <option value="senior">31+ Thn</option>
                </select>
                <select id="bursaFilterNegara" class="bursa-filter-select" onchange="renderBursaTransferRows()"><option value="">Semua Negara</option></select>
            </div>
        </div>
        <table class="bursa-table">
            <thead>
                <tr>
                    <th>Nama</th>
                    <th>Role</th>
                    <th class="bursa-table__center">Umur</th>
                    <th class="bursa-table__num">Nilai</th>
                    <th class="bursa-table__center">Negara</th>
                </tr>
            </thead>
            <tbody id="bursaTableBody"></tbody>
        </table>
        <p id="bursaFilterEmptyHint" class="sembunyi" style="text-align:center;color:var(--text-3);font-size:11px;padding:16px 8px;">Gak ada hasil yang cocok sama filter ini.</p>
        <p style="text-align: center; color: var(--text-3); font-size: 10px; margin-top: 15px; margin-bottom: 0px;">*Ketuk baris untuk melihat profil lengkap, trial, & negosiasi kontrak.</p>`;
    }

    getEl("listTransfer").className = "";
    getEl("listTransfer").innerHTML = htmlTransfer;
    if (typeof populateBursaFilterOptions === "function") populateBursaFilterOptions();
    if (typeof renderBursaTransferRows === "function") renderBursaTransferRows();

    // FIX: jadwalTimPlayer cuma diisi buatJadwalMusim() buat region MPL ID/PH/MY/SG --
    // player yang main di LEN/MDL/MAL gak pernah kecek di sana, jadi widget "Jadwal
    // Selanjutnya" permanen kosong. Refresh manual di sini tiap render.
    if (typeof ligaPlayer !== "undefined" && ligaPlayer !== "MPL" && typeof ambilJadwalSelanjutnyaNonMPL === "function") {
        let matchSelanjutnyaNonMPL = ambilJadwalSelanjutnyaNonMPL();
        jadwalTimPlayer = matchSelanjutnyaNonMPL ? [matchSelanjutnyaNonMPL] : [];
    }

    // [FIX] Subtitle "Week X Regular Season" / fase playoff / round MSC-M7
    // dsb di bawah header "STATUS MUSIM" -- dihitung terpisah dari logika
    // matchup widgetJadwalData di bawah, biar konsisten muncul di semua
    // statusGame tanpa perlu nambahin ke tiap cabang if/else satu-satu.
    let _elFaseLabel = getEl("statusMusimFaseLabel");
    if (_elFaseLabel) {
        _elFaseLabel.textContent = (typeof hitungLabelFaseMusim === "function") ? hitungLabelFaseMusim() : "";
    }

    let nmContainer = getEl("widgetJadwalData");
    if (statusGame === "PRAMUSIM") {
        let _tblPra = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        let _ligaPra = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
        let _isMDLPlayer = (_ligaPra === "MDL");
        const _blnPra = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        const _fmt = (d) => d ? `${d.getDate()} ${_blnPra[d.getMonth()]}` : "–";

        let _infoRows = "";

        if (_isMDLPlayer) {
            let _mdlMulai = _tblPra ? _tblPra.mdlMulai : null;
            let _mdlLock  = _mdlMulai ? new Date(_mdlMulai.getTime() - 7*86400000) : null;
            let _sisaLock = (_tblPra && _mdlLock && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mdlLock) : -1;
            let _sisaMDL  = (_tblPra && _mdlMulai && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mdlMulai) : 0;

            if (_sisaLock > 0)
                _infoRows += `<div class="season-row"><div class="season-row__icon" style="background:var(--red-dim);color:var(--red);"><i class="fa-solid fa-lock"></i></div><div class="season-row__body"><div class="season-row__label">Roster Lock MDL</div><div class="season-row__date">${_fmt(_mdlLock)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--red);">${_sisaLock}</div><span class="season-row__days-unit">hari</span></div></div>`;
            if (_sisaMDL > 0)
                _infoRows += `<div class="season-row"><div class="season-row__icon" style="background:var(--blue-dim);color:var(--blue);"><i class="fa-solid fa-swords"></i></div><div class="season-row__body"><div class="season-row__label">MDL Mulai</div><div class="season-row__date">${_fmt(_mdlMulai)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--blue);">${_sisaMDL}</div><span class="season-row__days-unit">hari</span></div></div>`;
            else
                _infoRows += `<div class="season-note"><i class="fa-solid fa-swords" style="color:var(--blue);"></i> MDL Regular Season sudah dimulai!</div>`;

        } else {
            let _mplMulai = _tblPra ? _tblPra.mplLenMulai : null;
            let _mplLock  = _mplMulai ? new Date(_mplMulai.getTime() - 7*86400000) : null;
            let _sisaLock = (_tblPra && _mplLock && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mplLock) : -1;
            let _sisaMPL  = (_tblPra && _mplMulai && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mplMulai) : 0;
            let _namaLiga = _ligaPra === "LEN" ? "LEN" : `MPL ${(typeof regionPlayer !== "undefined" ? regionPlayer : "ID")}`;

            // Baris 1 & 2: Roster Lock + Transfer Ditutup (hilang kalau sudah lewat)
            if (_sisaLock > 0) {
                _infoRows += `<div class="season-row"><div class="season-row__icon" style="background:var(--red-dim);color:var(--red);"><i class="fa-solid fa-lock"></i></div><div class="season-row__body"><div class="season-row__label">Roster Lock ${_namaLiga}</div><div class="season-row__date">${_fmt(_mplLock)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--red);">${_sisaLock}</div><span class="season-row__days-unit">hari</span></div></div>`;
                _infoRows += `<div class="season-row"><div class="season-row__icon" style="background:var(--red-dim);color:var(--red);"><i class="fa-solid fa-ban"></i></div><div class="season-row__body"><div class="season-row__label">Transfer Ditutup</div><div class="season-row__date">${_fmt(_mplLock)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--red);">${_sisaLock}</div><span class="season-row__days-unit">hari</span></div></div>`;
            }

            // Baris 3: Reguler Season mulai
            if (_sisaMPL > 0)
                _infoRows += `<div class="season-row"><div class="season-row__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-trophy"></i></div><div class="season-row__body"><div class="season-row__label">${_namaLiga} Mulai</div><div class="season-row__date">${_fmt(_mplMulai)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--orange);">${_sisaMPL}</div><span class="season-row__days-unit">hari</span></div></div>`;
            else
                _infoRows += `<div class="season-note"><i class="fa-solid fa-swords" style="color:var(--orange);"></i> ${_namaLiga} Regular Season sudah dimulai!</div>`;

            // Info MDL sebagai konteks kecil (hanya kalau MDL belum mulai)
            let _mdlMulai2 = _tblPra ? _tblPra.mdlMulai : null;
            let _sisaMDL2  = (_tblPra && _mdlMulai2 && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mdlMulai2) : 0;
            if (_sisaMDL2 > 0)
                _infoRows += `<div class="season-note"><i class="fa-solid fa-circle-info"></i> MDL mulai dalam ${_sisaMDL2} hari (${_fmt(_mdlMulai2)})</div>`;
        }

        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="season-lead">Rekrut &amp; persiapkan roster sebelum musim dimulai</div>
            ${_infoRows}
        </div></div>`;
        } else if (statusGame === "MID_SEASON") {
        // Transfer window mid-season: tampilkan countdown hari
        let _sisaMid = (typeof midSeasonHari !== "undefined") ? midSeasonHari : 0;
        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="count-hero">
                <div class="count-hero__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-right-left"></i></div>
                <div class="count-hero__body">
                    <div class="count-hero__title" style="color:var(--orange);">Bursa Transfer Terbuka</div>
                    <div class="count-hero__desc">Selesaikan deal sebelum paruh kedua. MPL/LEN Minggu ke-5 dimulai setelah jeda ini.</div>
                </div>
                <div class="count-hero__days"><div class="count-hero__days-num" style="color:var(--orange);">${_sisaMid}</div><span class="count-hero__days-unit">hari</span></div>
            </div>
        </div></div>`;
    } else if (statusGame === "REGULER" && (function() {
        // Cek apakah kita masih di fase "MDL berjalan, MPL/LEN belum mulai"
        // yaitu kalenderGame sudah lewat 9 Feb tapi belum 27 Mar
        let _ligaGate2 = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
        if (_ligaGate2 === "MDL") return false; // MDL player langsung ke blok REGULER normal
        let _tbl2 = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        if (!_tbl2) return false;
        return (typeof tanggalSetelahAtauSama === "function")
            && !tanggalSetelahAtauSama(kalenderGame, _tbl2.mplLenMulai); // belum 27 Mar
    })()) {
        // Fase transisi: statusGame sudah REGULER (MDL mulai) tapi MPL/LEN belum mulai
        // Tampilkan info yang sama dengan PRAMUSIM akhir (tanpa baris MDL konteks)
        let _tblTr = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        let _ligaTr = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
        const _blnTr = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        const _fmtTr = (d) => d ? `${d.getDate()} ${_blnTr[d.getMonth()]}` : "–";

        let _mplMulaiTr = _tblTr ? _tblTr.mplLenMulai : null;
        // [FIX] Sebelumnya SELALU dihitung "-7 hari dari mplLenMulai",
        // padahal itu cuma asumsi/template, bukan tanggal resmi. Sekarang
        // prioritas ke rosterLockMPL eksplisit (kalau tabel musim ini
        // punya datanya, misal S18 asli: 27 Jul, gap 18 hari ke 14 Ags) --
        // fallback ke heuristik -7 hari cuma buat musim yang belum ada
        // data resminya.
        let _mplLockTr  = (_tblTr && _tblTr.rosterLockMPL)
            ? _tblTr.rosterLockMPL
            : (_mplMulaiTr ? new Date(_mplMulaiTr.getTime() - 7*86400000) : null);
        let _sisaLockTr = (_tblTr && _mplLockTr && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mplLockTr) : -1;
        let _sisaMPLTr  = (_tblTr && _mplMulaiTr && typeof selisihHari === "function") ? selisihHari(kalenderGame, _mplMulaiTr) : 0;
        let _namaLigaTr = _ligaTr === "LEN" ? "LEN" : `MPL ${(typeof regionPlayer !== "undefined" ? regionPlayer : "ID")}`;

        let _rowsTr = "";
        if (_sisaLockTr > 0) {
            _rowsTr += `<div class="season-row"><div class="season-row__icon" style="background:var(--red-dim);color:var(--red);"><i class="fa-solid fa-lock"></i></div><div class="season-row__body"><div class="season-row__label">Roster Lock ${_namaLigaTr}</div><div class="season-row__date">${_fmtTr(_mplLockTr)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--red);">${_sisaLockTr}</div><span class="season-row__days-unit">hari</span></div></div>`;
            _rowsTr += `<div class="season-row"><div class="season-row__icon" style="background:var(--red-dim);color:var(--red);"><i class="fa-solid fa-ban"></i></div><div class="season-row__body"><div class="season-row__label">Transfer Ditutup</div><div class="season-row__date">${_fmtTr(_mplLockTr)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--red);">${_sisaLockTr}</div><span class="season-row__days-unit">hari</span></div></div>`;
        }
        if (_sisaMPLTr > 0)
            _rowsTr += `<div class="season-row"><div class="season-row__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-trophy"></i></div><div class="season-row__body"><div class="season-row__label">${_namaLigaTr} Mulai</div><div class="season-row__date">${_fmtTr(_mplMulaiTr)}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--orange);">${_sisaMPLTr}</div><span class="season-row__days-unit">hari</span></div></div>`;
        _rowsTr += `<div class="season-note"><i class="fa-solid fa-circle-check" style="color:var(--blue);"></i> MDL sudah berjalan</div>`;

        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="season-lead">MDL sudah berjalan — tunggu giliran ${_namaLigaTr}</div>
            ${_rowsTr}
        </div></div>`;
    } else if (statusGame === "REGULER" && jadwalTimPlayer.length > 0 && (function() {
        // Date-gate: jangan tampil jadwal MPL/LEN sebelum mplLenMulai (27 Mar).
        // statusGame sudah REGULER sejak 9 Feb (MDL mulai) tapi jadwal MPL
        // baru boleh tampil saat kalenderGame >= 27 Mar.
        let _ligaGate = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
        if (_ligaGate === "MDL") return true; // MDL mulai 9 Feb, langsung boleh
        let _tblGate = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        if (!_tblGate) return true;
        return (typeof tanggalSetelahAtauSama === "function")
            ? tanggalSetelahAtauSama(kalenderGame, _tblGate.mplLenMulai)
            : true;
    })()) {
        let nextMatch = jadwalTimPlayer[jadwalTimPlayer.length - 1];
        let _ligaP = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
        let _isMPL = (_ligaP === "MPL");

        // MPL: punya tanggalRaw dari buatJadwalMusim → tampilkan tanggal akurat
        // MDL/LEN/MAL: tidak punya tanggalRaw (jadwal background, tidak terjadwal
        //   per tanggal fix) → tampilkan info liga + "match hari ini" saja
        let _infoBottom = "";
        if (_isMPL && nextMatch.tanggalRaw) {
            // [FIX] Konsisten sama format non-MPL: "Hari, Tanggal Bulan Tahun".
            // MPL punya jam kickoff fix, jadi ditambahin "• Jam WIB" di belakang.
            let _tglMatch = (typeof dapetHariTanggalLengkap === "function")
                ? dapetHariTanggalLengkap(new Date(nextMatch.tanggalRaw))
                : dapetTanggalPendek(new Date(nextMatch.tanggalRaw));
            let _jam = nextMatch.home.nama === timPlayer ? "18:15 WIB" : "15:00 WIB";
            _infoBottom = `<div class="nm-date">${_tglMatch} • ${_jam}</div>`;
        } else {
            // MDL/LEN/MAL: gak punya tanggalRaw fix -- proyeksiin tanggal
            // match berikutnya dari posisi array + kuota harian liga.
            // [FIX] Samain persis konsepnya kayak Regular Season MPL:
            // cuma Hari + Tanggal doang, pakai class "nm-date" polos
            // (tanpa inline style override, tanpa teks tambahan).
            let _tglProyeksi = (typeof proyeksiTanggalMatchNonMPL === "function") ? proyeksiTanggalMatchNonMPL(nextMatch) : null;
            if (_tglProyeksi && typeof dapetHariTanggalLengkap === "function") {
                _infoBottom = `<div class="nm-date">${dapetHariTanggalLengkap(_tglProyeksi)}</div>`;
            } else {
                // Fallback aman kalau proyeksi gagal (mis. match gak ketemu di array)
                let _sisaMatch = jadwalTimPlayer.length;
                let _namaLiga = _ligaP === "MDL" ? "MDL" : _ligaP === "LEN" ? "LEN" : _ligaP === "MAL" ? "MAL MY" : _ligaP;
                _infoBottom = `<div class="nm-date">${_namaLiga} Regular Season • ${_sisaMatch} match tersisa</div>`;
            }
        }
        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner"><div class="nm-teams"><div class="nm-team"><img src="${nextMatch.home.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${nextMatch.home.nama}&background=333&color=fff'"><span class="nm-name">${nextMatch.home.nama}</span></div><div class="nm-vs">VS</div><div class="nm-team"><img src="${nextMatch.away.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${nextMatch.away.nama}&background=333&color=fff'"><span class="nm-name">${nextMatch.away.nama}</span></div></div>${_infoBottom}</div></div>`;
    } else if (statusGame === "PLAYOFF" && (typeof ligaPlayer !== "undefined") && (ligaPlayer === "LEN" || ligaPlayer === "MDL" || ligaPlayer === "MAL")) {
        // [FIX] Tim MDL/MAL/LEN gak ikut bracket Playoff MPL (m1-m8 di pData/
        // pDataPH/pDataMY/pDataSG), jadi JANGAN numpang nampilin matchup MPL
        // ID kayak sebelumnya.
        //
        // [FIX] Playoff Degradasi/Promosi MDL-LEN sekarang dieksekusi LANGSUNG
        // di hari-H (playoffMulai), di klik yang sama -- lihat playoffFase===1
        // di klikTombolUtama(). window._bracketPlayoffDegradasiMDLLENTerakhir
        // langsung keisi di klik itu juga, jadi widget di bawah ini otomatis
        // nampilin highlight hasil tanpa perlu klik kedua.
        let _bracketFinal = window._bracketPlayoffDegradasiMDLLENTerakhir;

        if (_bracketFinal && _bracketFinal.length > 0) {
            // H+1 ke atas: hasil sudah final -- tampilin highlight/hasil.
            let _matchPlayerPO = _bracketFinal.find(m =>
                (m.home && m.home.nama === timPlayer) || (m.away && m.away.nama === timPlayer));

            if (_matchPlayerPO) {
                let _skorTeks = `${_matchPlayerPO.skorHome ?? 0} - ${_matchPlayerPO.skorAway ?? 0}`;
                let _menang = (_matchPlayerPO.menang===timPlayer);
                nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner"><div class="nm-teams"><div class="nm-team"><img src="${_matchPlayerPO.home.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${_matchPlayerPO.home.nama}&background=333&color=fff'"><span class="nm-name">${_matchPlayerPO.home.nama}</span></div><div class="nm-vs">${_skorTeks}</div><div class="nm-team"><img src="${_matchPlayerPO.away.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${_matchPlayerPO.away.nama}&background=333&color=fff'"><span class="nm-name">${_matchPlayerPO.away.nama}</span></div></div><div class="nm-result-tag" style="color:${_menang?'var(--green)':'var(--red)'};"><i class="fa-solid ${_menang?'fa-circle-check':'fa-circle-xmark'}"></i> ${_menang ? 'PROMOSI BERHASIL!' : 'GAGAL PROMOSI'}</div></div></div>`;
            } else {
                let _labelLigaPO = ligaPlayer === "LEN" ? "LEN (Playoff Promosi)" : "MDL/MAL (Playoff Degradasi)";
                let _subLigaPO = ligaPlayer === "LEN"
                    ? "2 tim terbaik LEN sudah bertanding memperebutkan slot promosi ke MDL."
                    : "2 tim terbawah sudah bertanding mempertahankan slot MDL dari tantangan LEN.";
                nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
                    <div class="season-banner">
                        <div class="season-banner__icon" style="background:var(--accent-dim);color:var(--accent);"><i class="fa-solid fa-trophy"></i></div>
                        <div class="season-banner__title" style="color:var(--accent);">${_labelLigaPO} Selesai</div>
                        <div class="season-banner__desc">${_subLigaPO}</div>
                        <div class="season-note" style="margin-top:8px;"><i class="fa-solid fa-circle-info"></i> MPL sedang berlangsung Playoff — tunggu Open Transfer Window &amp; musim berikutnya.</div>
                    </div>
                </div></div>`;
            }
        } else {
            // Masih hari-H (match belum dieksekusi) -- tampilin JADWAL.
            let _previewPO = (typeof ambilPreviewPlayoffDegradasiMDLLEN === "function")
                ? ambilPreviewPlayoffDegradasiMDLLEN() : [];
            let _matchPlayerPreview = _previewPO.find(m =>
                (m.home && m.home.nama === timPlayer) || (m.away && m.away.nama === timPlayer));

            if (_matchPlayerPreview) {
                let _tblHariIni = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
                let _labelHariIni = (_tblHariIni && _tblHariIni.playoffMulai && typeof dapetHariTanggalLengkap === "function")
                    ? dapetHariTanggalLengkap(_tblHariIni.playoffMulai)
                    : "Hari Ini!";
                nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner"><div class="nm-teams"><div class="nm-team"><img src="${_matchPlayerPreview.home.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${_matchPlayerPreview.home.nama}&background=333&color=fff'"><span class="nm-name">${_matchPlayerPreview.home.nama}</span></div><div class="nm-vs">VS</div><div class="nm-team"><img src="${_matchPlayerPreview.away.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${_matchPlayerPreview.away.nama}&background=333&color=fff'"><span class="nm-name">${_matchPlayerPreview.away.nama}</span></div></div><div class="nm-result-tag" style="color:var(--orange);"><i class="fa-solid fa-calendar-day"></i> Playoff Degradasi/Promosi — ${_labelHariIni}</div></div></div>`;
            } else if (_previewPO.length > 0) {
                nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
                    <div class="season-banner">
                        <div class="season-banner__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-calendar-day"></i></div>
                        <div class="season-banner__title" style="color:var(--orange);">Playoff Degradasi Hari Ini</div>
                        <div class="season-banner__desc">Tim ${ligaPlayer} lu gak lolos ke Playoff Degradasi/Promosi musim ini.</div>
                    </div>
                </div></div>`;
            } else {
                nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
                    <div class="season-banner">
                        <div class="season-banner__icon" style="background:var(--accent-dim);color:var(--accent);"><i class="fa-solid fa-trophy"></i></div>
                        <div class="season-banner__title" style="color:var(--accent);">MPL Sedang Playoff</div>
                        <div class="season-banner__desc">Musim ${ligaPlayer} lu sudah berakhir — tunggu Open Transfer Window &amp; musim berikutnya.</div>
                    </div>
                </div></div>`;
            }
        }
    } else if (statusGame === "JEDA_PLAYOFF" && (typeof ligaPlayer !== "undefined") && (ligaPlayer === "LEN" || ligaPlayer === "MDL" || ligaPlayer === "MAL") && (function() {
        // Cek apakah udah masuk H-1 sebelum Playoff Degradasi/Promosi
        // (dan belum ada hasil final -- kalau udah ada hasil, biarin
        // cabang PLAYOFF di atas yang nangani pas statusGame berubah).
        let _tbl = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        if (!_tbl || !_tbl.playoffMulai) return false;
        let _h1 = new Date(_tbl.playoffMulai);
        _h1.setDate(_h1.getDate() - 1);
        return kalenderGame >= _h1;
    })()) {
        // [FIX] Tampilin PREVIEW matchup Playoff Degradasi/Promosi mulai
        // H-1, khususnya kalau tim player sendiri jadi salah satu peserta.
        let _previewPO = (typeof ambilPreviewPlayoffDegradasiMDLLEN === "function")
            ? ambilPreviewPlayoffDegradasiMDLLEN() : [];
        let _matchPlayerPreview = _previewPO.find(m =>
            (m.home && m.home.nama === timPlayer) || (m.away && m.away.nama === timPlayer));

        // Tanggal pasti match-nya (H-1 doang, tapi match-nya sendiri jatuh
        // di playoffMulai) -- dipakai buat ganti label statis "Besok!"
        // jadi hari+tanggal beneran, misal "Rabu, 10 Juni 2026".
        let _tblPO = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        let _labelBesok = (_tblPO && _tblPO.playoffMulai && typeof dapetHariTanggalLengkap === "function")
            ? dapetHariTanggalLengkap(_tblPO.playoffMulai)
            : "Besok!";

        if (_matchPlayerPreview) {
            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner"><div class="nm-teams"><div class="nm-team"><img src="${_matchPlayerPreview.home.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${_matchPlayerPreview.home.nama}&background=333&color=fff'"><span class="nm-name">${_matchPlayerPreview.home.nama}</span></div><div class="nm-vs">VS</div><div class="nm-team"><img src="${_matchPlayerPreview.away.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${_matchPlayerPreview.away.nama}&background=333&color=fff'"><span class="nm-name">${_matchPlayerPreview.away.nama}</span></div></div><div class="nm-result-tag" style="color:var(--orange);"><i class="fa-solid fa-hourglass-half"></i> Playoff Degradasi/Promosi — ${_labelBesok}</div></div></div>`;
        } else if (_previewPO.length > 0) {
            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
                <div class="season-banner">
                    <div class="season-banner__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-hourglass-half"></i></div>
                    <div class="season-banner__title" style="color:var(--orange);">Playoff Degradasi Besok</div>
                    <div class="season-banner__desc">Tim ${ligaPlayer} lu gak lolos ke Playoff Degradasi/Promosi musim ini.</div>
                </div>
            </div></div>`;
        } else {
            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
                <div class="count-hero">
                    <div class="count-hero__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-hourglass-half"></i></div>
                    <div class="count-hero__body">
                        <div class="count-hero__title" style="color:var(--orange);">Jeda Pra-Playoff</div>
                        <div class="count-hero__desc">Persiapan strategi &amp; bootcamp akhir.</div>
                    </div>
                    <div class="count-hero__days"><div class="count-hero__days-num" style="color:var(--orange);">${hariJeda}</div><span class="count-hero__days-unit">hari</span></div>
                </div>
            </div></div>`;
        }
    } else if (statusGame === "PLAYOFF") {
        // AUTO DETEKSI REGION PLAYOFF
        let pObj = pData; // Default ID
        if (daftarTimPH.some(t => t.nama === timPlayer)) pObj = window.pDataPH;
        else if (daftarTimMY.some(t => t.nama === timPlayer))
            pObj = window.pDataMY;
        else if (daftarTimSG.some(t => t.nama === timPlayer))
            pObj = window.pDataSG;

        // [FIX] Beberapa fase punya LEBIH DARI SATU match yang jalan
        // bersamaan (mis. Fase 2 = m3 UB Semi 1 DAN m4 UB Semi 2 sekaligus;
        // Fase 3 = m6 UB Final DAN m5 LB Semi sekaligus). Sebelumnya cuma
        // 1 slot tetap yang dicek per fase, jadi kalau tim player ada di
        // slot "satunya" (m4 bukan m3, atau m5 bukan m6), widget salah
        // nunjukin "Cek Bracket" padahal tim player BENERAN ada match hari
        // itu. Sekarang SEMUA match yang aktif di fase ini dicek satu-satu.
        let kandidat = [];
        if (playoffFase === 1) {
            kandidat = [
                { m: pObj.m1, label: "Fase Play-In" },
                { m: pObj.m2, label: "Fase Play-In" }
            ];
        } else if (playoffFase === 2) {
            kandidat = [
                { m: pObj.m3, label: "Upper Bracket Semi" },
                { m: pObj.m4, label: "Upper Bracket Semi" }
            ];
        } else if (playoffFase === 3) {
            kandidat = [
                { m: pObj.m6, label: "Upper Bracket Final" },
                { m: pObj.m5, label: "Lower Bracket Semi Final" }
            ];
        } else if (playoffFase === 4) {
            kandidat = [{ m: pObj.m7, label: "Lower Bracket Final" }];
        } else if (playoffFase === 5) {
            kandidat = [{ m: pObj.m8, label: "GRAND FINAL" }];
        }

        let ditemukan = kandidat.find(k => k.m &&
            ((k.m.home && k.m.home.nama === timPlayer) ||
             (k.m.away && k.m.away.nama === timPlayer)));

        if (ditemukan) {
            let timHome = ditemukan.m.home;
            let timAway = ditemukan.m.away;
            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner"><div class="nm-teams"><div class="nm-team"><img src="${timHome.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${timHome.nama}&background=333&color=fff'"><span class="nm-name">${timHome.nama}</span></div><div class="nm-vs">VS</div><div class="nm-team"><img src="${timAway.logo}" class="nm-logo" onerror="this.src='https://ui-avatars.com/api/?name=${timAway.nama}&background=333&color=fff'"><span class="nm-name">${timAway.nama}</span></div></div><div class="nm-date">${dapetHariTanggalLengkap(kalenderGame)}</div></div></div>`;
        } else {
            // [FIX] Sebelumnya nge-link ke layarJadwalHasil (cuma log
            // pertandingan biasa). Sekarang diarahin ke layar Klasemen
            // Liga Dunia sesuai region tim player (udah ketauan dari
            // pObj di atas), yang emang punya section "HASIL PLAYOFFS"
            // berisi bracket-nya.
            let _layarBracketRegion = "layarKlasemenMPLID";
            if (pObj === window.pDataPH) _layarBracketRegion = "layarKlasemenMPLPH";
            else if (pObj === window.pDataMY) _layarBracketRegion = "layarKlasemenMPLMY";
            else if (pObj === window.pDataSG) _layarBracketRegion = "layarKlasemenMPLSG";

            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;"><div class="season-banner"><div class="season-banner__icon" style="background:var(--accent-dim);color:var(--accent);"><i class="fa-solid fa-trophy"></i></div><div class="season-banner__title" style="color:var(--accent);">Playoff ${ligaPlayer || "MPL"} Berlangsung</div><button class="season-banner__btn" style="border-color:var(--gold);color:var(--gold);" onclick="bukaSubLayar('${_layarBracketRegion}')">Cek Bracket Playoff</button></div></div></div>`;
        }
    } else if (statusGame === "JEDA_PLAYOFF") {
        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="count-hero">
                <div class="count-hero__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-hourglass-half"></i></div>
                <div class="count-hero__body">
                    <div class="count-hero__title" style="color:var(--orange);">Jeda Pra-Playoff</div>
                    <div class="count-hero__desc">Persiapan strategi &amp; bootcamp akhir.</div>
                </div>
                <div class="count-hero__days"><div class="count-hero__days-num" style="color:var(--orange);">${hariJeda}</div><span class="count-hero__days-unit">hari</span></div>
            </div>
        </div></div>`;
    } else if (statusGame === "JEDA_MSC" || statusGame === "JEDA_MSC_EWC") {
        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="count-hero">
                <div class="count-hero__icon" style="background:var(--cyan-dim);color:var(--cyan);"><i class="fa-solid fa-plane-departure"></i></div>
                <div class="count-hero__body">
                    <div class="count-hero__title" style="color:var(--cyan);">Persiapan MSC</div>
                    <div class="count-hero__desc">Boot camp &amp; scrimmage internasional.</div>
                </div>
                <div class="count-hero__days"><div class="count-hero__days-num" style="color:var(--cyan);">${hariJeda}</div><span class="count-hero__days-unit">hari</span></div>
            </div>
        </div></div>`;
    } else if (statusGame === "JEDA_MSERIES" || statusGame === "JEDA_M7") {
        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="count-hero">
                <div class="count-hero__icon" style="background:var(--accent-dim);color:var(--accent);"><i class="fa-solid fa-plane-departure"></i></div>
                <div class="count-hero__body">
                    <div class="count-hero__title" style="color:var(--accent);">Persiapan M${edisiMSeries}</div>
                    <div class="count-hero__desc">Persiapan final untuk panggung dunia.</div>
                </div>
                <div class="count-hero__days"><div class="count-hero__days-num" style="color:var(--accent);">${hariJeda}</div><span class="count-hero__days-unit">hari</span></div>
            </div>
        </div></div>`;
    } else if (statusGame === "JEDA_TRANSFER") {
        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="count-hero">
                <div class="count-hero__icon" style="background:var(--green-dim);color:var(--green);"><i class="fa-solid fa-lock-open"></i></div>
                <div class="count-hero__body">
                    <div class="count-hero__title" style="color:var(--green);">Bursa Transfer Terbuka</div>
                    <div class="count-hero__desc">Rekrut &amp; jual pemain sebelum deadline!</div>
                </div>
                <div class="count-hero__days"><div class="count-hero__days-num" style="color:var(--green);">${hariJeda}</div><span class="count-hero__days-unit">hari</span></div>
            </div>
        </div></div>`;
    } else if (statusGame === "MSC" || statusGame === "MSC_EWC") {
        let _aktifMSC = (typeof cariMatchAktifTimPlayerMSC === "function") ? cariMatchAktifTimPlayerMSC() : null;
        if (_aktifMSC && !_mNmEliminated(_aktifMSC.m)) {
            nmContainer.innerHTML = _renderNmMatchMSCM7(_aktifMSC);
        } else {
            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;"><div class="season-banner"><div class="season-banner__icon" style="background:var(--cyan-dim);color:var(--cyan);"><i class="fa-solid fa-earth-asia"></i></div><div class="season-banner__title" style="color:var(--cyan);">Mid Season Cup</div><div class="season-banner__desc">Turnamen Global Berlangsung!</div><button class="season-banner__btn" style="border-color:var(--cyan);color:var(--cyan);" onclick="bukaSubLayar('layarMSC')">Cek Bracket MSC</button></div></div></div>`;
        }
    } else if (statusGame === "MSERIES" || statusGame === "M7") {
        let _aktifM7 = (typeof cariMatchAktifTimPlayerM7 === "function") ? cariMatchAktifTimPlayerM7() : null;
        if (_aktifM7 && !_mNmEliminated(_aktifM7.m)) {
            nmContainer.innerHTML = _renderNmMatchMSCM7(_aktifM7);
        } else {
            nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;"><div class="season-banner"><div class="season-banner__icon" style="background:var(--gold-dim);color:var(--gold);"><i class="fa-solid fa-trophy"></i></div><div class="season-banner__title" style="color:var(--gold);">M${edisiMSeries} World Championship</div><div class="season-banner__desc">Puncak Turnamen Berlangsung!</div><button class="season-banner__btn" style="border-color:var(--gold);color:var(--gold);" onclick="bukaSubLayar('layarMSeries')">Cek Bracket M${edisiMSeries}</button></div></div></div>`;
        }
    } else if (statusGame === "OFFSEASON") {
        // Handler OFFSEASON: tampil info musim baru yang akan datang
        let _tblOff = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        let _musimBerikutnya = (typeof musimKe !== "undefined") ? musimKe + 1 : "?";
        const _blnOff = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

        let _infoMDL = "", _infoMPL = "";
        if (_tblOff) {
            // Hitung sisa hari ke MDL S berikutnya
            let _mdlMulai = _tblOff.musimBerikutnyaMdlMulai || _tblOff.mdlMulai;
            let _mplMulai = _tblOff.musimBerikutnyaMplLenMulai || _tblOff.mplLenMulai;
            if (_mdlMulai) {
                let _sisaMDL = typeof selisihHari === "function" ? selisihHari(kalenderGame, _mdlMulai) : 0;
                let _tglMDL = `${_mdlMulai.getDate()} ${_blnOff[_mdlMulai.getMonth()]}`;
                _infoMDL = _sisaMDL > 0
                    ? `<div class="season-row"><div class="season-row__icon" style="background:var(--blue-dim);color:var(--blue);"><i class="fa-solid fa-calendar-check"></i></div><div class="season-row__body"><div class="season-row__label">MDL S${_musimBerikutnya} Mulai</div><div class="season-row__date">${_tglMDL}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--blue);">${_sisaMDL}</div><span class="season-row__days-unit">hari</span></div></div>`
                    : `<div class="season-note"><i class="fa-solid fa-circle-info"></i> Persiapan musim baru...</div>`;
            }
            if (_mplMulai) {
                let _sisaMPL = typeof selisihHari === "function" ? selisihHari(kalenderGame, _mplMulai) : 0;
                let _tglMPL = `${_mplMulai.getDate()} ${_blnOff[_mplMulai.getMonth()]}`;
                _infoMPL = _sisaMPL > 0
                    ? `<div class="season-row"><div class="season-row__icon" style="background:var(--orange-dim);color:var(--orange);"><i class="fa-solid fa-trophy"></i></div><div class="season-row__body"><div class="season-row__label">MPL/LEN S${_musimBerikutnya} Mulai</div><div class="season-row__date">${_tglMPL}</div></div><div class="season-row__days"><div class="season-row__days-num" style="color:var(--orange);">${_sisaMPL}</div><span class="season-row__days-unit">hari</span></div></div>`
                    : "";
            }
        }

        nmContainer.innerHTML = `<div class="nm-wrapper"><div class="nm-inner" style="padding:6px 4px;">
            <div class="season-lead"><i class="fa-solid fa-flag-checkered" style="color:var(--green);"></i> Akhir Musim S${(typeof musimKe !== "undefined" ? musimKe : "?")} — evaluasi &amp; persiapkan roster untuk musim berikutnya</div>
            ${_infoMDL}${_infoMPL}
        </div></div>`;
    } else {
        nmContainer.innerHTML = `<div class="jadwal-empty"><i class="fa-solid fa-calendar-xmark"></i><span class="jadwal-empty-text">Belum Ada Jadwal</span></div>`;
    }

    // === FIX: Tombol Utama dinamis (label awal & warna ngikutin state) ===
    // Sebelumnya tombol ini SELALU merah & SELALU bertuliskan "MULAI PERTANDINGAN"
    // dari HTML sampai diklik minimal sekali — walau statusnya Off-Season dan
    // belum ada pertandingan apapun. Sekarang disinkronkan tiap updateDashboard().
    (function aturTombolUtama() {
        let btn = getEl("btnMainkan");
        if (!btn) return;

        // Date-gate sama dengan widget: jangan anggap "ada pertandingan"
        // sebelum mplLenMulai (27 Mar) meski statusGame sudah REGULER.
        let _ligaBtn = (typeof ligaPlayer !== "undefined") ? ligaPlayer : "MPL";
        let _tblBtn = (typeof ambilTabelTanggalMusimSaatIni === "function") ? ambilTabelTanggalMusimSaatIni() : null;
        let _mplSudahMulai = _ligaBtn === "MDL" || !_tblBtn ||
            ((typeof tanggalSetelahAtauSama === "function") && tanggalSetelahAtauSama(kalenderGame, _tblBtn.mplLenMulai));
        let adaPertandinganSekarang =
            (statusGame === "REGULER" && jadwalTimPlayer.length > 0 && _mplSudahMulai) ||
            statusGame === "PLAYOFF" || statusGame === "MSC" || statusGame === "MSERIES" ||
            statusGame === "MSC_EWC" || statusGame === "M7";

        // Label default cuma dipasang kalau belum pernah diklik sama sekali,
        // biar gak nimpa teks detail (mis. "Lewati 1 Hari (Sisa Off-Season: X Hari)")
        // yang udah diatur klikTombolUtama() per klik.
        if (!window.tombolUtamaSudahDiklik) {
            // Teks tombol: "MULAI PERTANDINGAN" saat ada match aktif,
            // "LANJUTKAN HARI" untuk semua fase lain.
            // Teks seperti "MULAI SEASON X" tidak diperlukan karena
            // widget STATUS MUSIM sudah informatif.
            btn.innerText = "Hari Berikutnya";
        }

        btn.classList.add("btn-hero");
        btn.classList.toggle("btn-hero--netral", !adaPertandinganSekarang);
    })();

    // ===============================================
    // --- 5. KLASEMEN MINI DASHBOARD (AUTO REGION) ---
    // ===============================================
    // FIX BUG: sebelumnya cuma cek 4 database MPL (daftarTim/PH/MY/SG).
    // Kalau player main di MDL/MAL/LEN, timPlayer tidak ketemu di
    // satupun dari 4 itu, jadi regionKita SELALU jatuh ke default MPL ID
    // (makanya selalu nongol BTR/ONIC/GEEK/TLID walau player main di liga lain).
    // Sekarang dicek ke SEMUA 11 database liga yang ada.
    let regionKita = daftarTim; // fallback default kalau benar2 tidak ketemu di manapun
    let timPlayerKetemu = false;

    if (daftarTim.some(t => t.nama === timPlayer)) {
        regionKita = daftarTim; timPlayerKetemu = true;
    } else if (daftarTimPH.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimPH; timPlayerKetemu = true;
    } else if (daftarTimMY.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimMY; timPlayerKetemu = true;
    } else if (daftarTimSG.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimSG; timPlayerKetemu = true;
    } else if (typeof daftarTimMDL_ID !== "undefined" && daftarTimMDL_ID.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimMDL_ID; timPlayerKetemu = true;
    } else if (typeof daftarTimMDL_PH !== "undefined" && daftarTimMDL_PH.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimMDL_PH; timPlayerKetemu = true;
    } else if (typeof daftarTimMAL_Affiliated_MY !== "undefined" && daftarTimMAL_Affiliated_MY.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimMAL_Affiliated_MY; timPlayerKetemu = true;
    } else if (typeof daftarTimMAL_Challenger_MY !== "undefined" && daftarTimMAL_Challenger_MY.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimMAL_Challenger_MY; timPlayerKetemu = true;
    } else if (typeof daftarTimLEN !== "undefined" && daftarTimLEN.some(t => t.nama === timPlayer)) {
        regionKita = daftarTimLEN; timPlayerKetemu = true;
    }

    // Kalau player ada di tim Afiliasi (MDL ID/PH), tipe arraynya beda lagi
    if (!timPlayerKetemu) {
        if (typeof daftarTimMDL_Afiliasi_ID !== "undefined" && daftarTimMDL_Afiliasi_ID.some(t => t.nama === timPlayer)) {
            regionKita = daftarTimMDL_ID; timPlayerKetemu = true; // tetap pakai klasemen GABUNGAN
        } else if (typeof daftarTimMDL_Afiliasi_PH !== "undefined" && daftarTimMDL_Afiliasi_PH.some(t => t.nama === timPlayer)) {
            regionKita = daftarTimMDL_PH; timPlayerKetemu = true;
        }
    }

    // Tentukan sub-layar klasemen lengkap yang sesuai dengan region player,
    // dipakai sama tombol "LIHAT KLASEMEN LENGKAP →" di dashboard.
    let subLayarKlasemenTarget = "layarKlasemenMPLID";
    if (regionKita === daftarTimPH) subLayarKlasemenTarget = "layarKlasemenMPLPH";
    else if (regionKita === daftarTimMY) subLayarKlasemenTarget = "layarKlasemenMPLMY";
    else if (regionKita === daftarTimSG) subLayarKlasemenTarget = "layarKlasemenMPLSG";
    else if (typeof daftarTimMDL_ID !== "undefined" && regionKita === daftarTimMDL_ID) subLayarKlasemenTarget = "layarKlasemenMDLID";
    else if (typeof daftarTimMDL_PH !== "undefined" && regionKita === daftarTimMDL_PH) subLayarKlasemenTarget = "layarKlasemenMDLPH";
    else if (typeof daftarTimMAL_Affiliated_MY !== "undefined" && regionKita === daftarTimMAL_Affiliated_MY) subLayarKlasemenTarget = "layarKlasemenMALMY";
    else if (typeof daftarTimMAL_Challenger_MY !== "undefined" && regionKita === daftarTimMAL_Challenger_MY) subLayarKlasemenTarget = "layarKlasemenMALMY";
    else if (typeof daftarTimLEN !== "undefined" && regionKita === daftarTimLEN) subLayarKlasemenTarget = "layarKlasemenLEN";

    let btnKlasemenLengkap = getEl("btnLihatKlasemenLengkap");
    if (btnKlasemenLengkap) {
        btnKlasemenLengkap.onclick = function () { bukaSubLayar(subLayarKlasemenTarget); };
    }

    // Pastikan poin netGame terupdate & tersortir
    regionKita.forEach(t => {
        t.netGame = t.gameW - t.gameL;
    });
    regionKita.sort(
        (a, b) =>
            b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
    );

    let htmlTabelMini = "";
    let indextimPlayer = regionKita.findIndex(t => t.nama === timPlayer);

    // Logika Sliding Window (Selalu nampilin 4 tim di Dashboard)
    let startIdx = indextimPlayer - 1;
    let endIdx = indextimPlayer + 2;

    if (startIdx < 0) {
        startIdx = 0;
        endIdx = 3;
    } else if (endIdx >= regionKita.length) {
        endIdx = regionKita.length - 1;
        startIdx = Math.max(0, endIdx - 3);
    }

    regionKita.forEach((tim, i) => {
        if (i >= startIdx && i <= endIdx) {
            // Garis merah peringatan otomatis ngikutin jumlah tim region tersebut
            // FIX: batasMerah disesuaikan per ukuran liga, bukan cuma SG vs lainnya.
            // MPL SG (8 tim, no-franchise) -> garis merah di posisi 4 (bottom half)
            // LEN (9 tim, tidak ada degradasi ke liga lain) -> tidak perlu garis merah
            // MDL/MAL (gabungan besar) -> garis merah mengikuti separuh bawah
            // Zona merah per liga (index berbasis 0):
            // MPL ID/PH/MY (9 tim): posisi 7,8,9 = degradasi → batasMerah = 6
            // MPL SG (6 tim): posisi 4,5,6 = zona berbahaya → batasMerah = 3
            // LEN (9 tim): tidak ada degradasi → tidak ada garis merah
            // MDL (16 tim): bottom 2 kena Playoff Degradasi → batasMerah = 14
            let batasMerah;
            if (typeof daftarTimLEN !== "undefined" && regionKita === daftarTimLEN) {
                batasMerah = regionKita.length; // tidak ada garis merah untuk LEN
            } else if (regionKita === daftarTimSG) {
                batasMerah = 3; // MPL SG 6 tim: bottom 3 zona merah
            } else if (typeof daftarTimMDL_ID !== "undefined" && (regionKita === daftarTimMDL_ID || regionKita === daftarTimMDL_PH)) {
                batasMerah = regionKita.length - 2; // MDL: bottom 2 kena degradasi
            } else {
                batasMerah = 6; // MPL ID/PH/MY (9 tim): posisi 7-9 zona merah
            }
            let _isHijauMini = i < 2;
            let _isMerahMini = i >= batasMerah;
            let rowStyle =
                _isHijauMini
                    ? "border-left: 3px solid #00B37E;"
                    : _isMerahMini
                      ? "border-left: 3px solid #E5484D;"
                      : "";

            // Highlight baris tim player, stabilo hijau/merah untuk zona
            let bgColor =
                i === indextimPlayer
                    ? "rgba(37,99,235,0.10)"
                    : _isHijauMini
                      ? (i % 2 === 0 ? "rgba(0,179,126,0.10)" : "rgba(0,179,126,0.16)")
                      : _isMerahMini
                        ? (i % 2 === 0 ? "rgba(229,72,77,0.08)" : "rgba(229,72,77,0.14)")
                        : i % 2 === 0
                          ? "var(--surface-2)"
                          : "var(--surface-3)";

            htmlTabelMini += `<tr style="background: ${bgColor} !important;"><td style="${rowStyle} font-size: 14px; font-weight: bold;">${i + 1}</td><td style="text-align: left; cursor: pointer;" onclick="bukaInfoTim('${tim.nama}')"><div class="team-cell"><img src="${tim.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${tim.nama}&background=333&color=fff'"> <strong>${tim.nama}</strong></div></td><td style="color: #E5484D; font-weight: bold;">${tim.poin}</td> <td>${tim.matchW} - ${tim.matchL}</td><td style="color: #E5484D; font-weight: bold;">${tim.netGame > 0 ? "+" + tim.netGame : tim.netGame}</td><td>${tim.gameW} - ${tim.gameL}</td></tr>`;
        }
    });

    if (getEl("badanKlasemen")) {
        getEl("badanKlasemen").innerHTML = htmlTabelMini;
    }

    // Panel "PERLU PERHATIAN" -- ditaro di sini krn baru di titik ini
    // regionKita & indextimPlayer (punya tim player) udah pasti ke-compute.
    renderNotifikasiDashboard(regionKita, indextimPlayer);

    // ===============================================
    // --- RENDER SEMUA KLASEMEN LIGA REGIONAL ---
    renderKlasemenRegional(
        daftarTim,
        "badanKlasemenDetailMPLID",
        "teksMusimMPLID"
    );
    renderKlasemenRegional(
        daftarTimPH,
        "badanKlasemenDetailMPLPH",
        "teksMusimMPLPH"
    );
    renderKlasemenRegional(
        daftarTimMY,
        "badanKlasemenDetailMPLMY",
        "teksMusimMPLMY"
    );
    renderKlasemenRegional(
        daftarTimSG,
        "badanKlasemenDetailMPLSG",
        "teksMusimMPLSG"
    );

    // [MSC x EWC 2026 - FASE 3] Render klasemen 9 region baru
    if (typeof daftarTimKH !== "undefined") renderKlasemenRegional(daftarTimKH, "badanKlasemenDetailKH", "teksMusimKH");
    if (typeof daftarTimMM !== "undefined") renderKlasemenRegional(daftarTimMM, "badanKlasemenDetailMM", "teksMusimMM");
    if (typeof daftarTimMENA !== "undefined") renderKlasemenRegional(daftarTimMENA, "badanKlasemenDetailMENA", "teksMusimMENA");
    if (typeof daftarTimTR !== "undefined") renderKlasemenRegional(daftarTimTR, "badanKlasemenDetailTR", "teksMusimTR");
    if (typeof daftarTimEECA !== "undefined") renderKlasemenRegional(daftarTimEECA, "badanKlasemenDetailEECA", "teksMusimEECA");
    if (typeof daftarTimEA !== "undefined") renderKlasemenRegional(daftarTimEA, "badanKlasemenDetailEA", "teksMusimEA");
    if (typeof daftarTimAM !== "undefined") renderKlasemenRegional(daftarTimAM, "badanKlasemenDetailAM", "teksMusimAM");
    if (typeof daftarTimIN !== "undefined") renderKlasemenRegional(daftarTimIN, "badanKlasemenDetailIN", "teksMusimIN");
    if (typeof daftarTimWEU !== "undefined") renderKlasemenRegional(daftarTimWEU, "badanKlasemenDetailWEU", "teksMusimWEU");

    renderSemuaBracketRegional();
            // --- UPDATE UI VISUAL BAR ---
    window.updateStatistikVisual();
    // --- UPDATE UI SPONSOR ---
    window.renderSponsorUI();
    // --- UPDATE MENTAL & STAMINA ---
    if (typeof renderMentalStamina === "function") renderMentalStamina();
}

function renderKlasemenRegional(arrayTim, idContainer, idTeksMusim) {
    let container = getEl(idContainer);
    if (!container) return;

    // 1. Kalkulasi poin & urutkan (Sorting)
    arrayTim.forEach(t => {
        t.netGame = t.gameW - t.gameL;
    });
    arrayTim.sort(
        (a, b) =>
            b.poin - a.poin || b.netGame - a.netGame || b.matchW - a.matchW
    );

    // 2. Kosongkan container dari render sebelumnya
    container.innerHTML = "";

    // 3. Siapkan meja kerja gaib (DocumentFragment)
    let fragment = document.createDocumentFragment();

    // Tentukan batasMerah dan batasHijau per liga
    let _nTim = arrayTim.length;
    let _batasHijau = 2;   // posisi 1 & 2 selalu zona hijau (top 2)
    let _batasMerahFull;
    if (typeof daftarTimLEN !== "undefined" && arrayTim === daftarTimLEN) {
        _batasMerahFull = _nTim; // LEN: tidak ada zona merah
    } else if (typeof daftarTimSG !== "undefined" && arrayTim === daftarTimSG) {
        _batasMerahFull = 3; // MPL SG 6 tim: posisi 4-6 zona merah
    } else if (typeof daftarTimMDL_ID !== "undefined" && (arrayTim === daftarTimMDL_ID || (typeof daftarTimMDL_PH !== "undefined" && arrayTim === daftarTimMDL_PH))) {
        _batasMerahFull = _nTim - 2; // MDL: bottom 2 zona merah
    } else {
        _batasMerahFull = 6; // MPL ID/PH/MY (9 tim): posisi 7-9 zona merah
    }

    arrayTim.forEach((tim, i) => {
        let _isHijau = i < _batasHijau;
        let _isMerah = i >= _batasMerahFull;

        // Garis kiri + background stabilo
        let rowStyle = _isHijau
            ? "border-left: 3px solid #00B37E;"
            : _isMerah
              ? "border-left: 3px solid #E5484D;"
              : "";
        let rowBg = _isHijau
            ? (i % 2 === 0 ? "rgba(0,179,126,0.10)" : "rgba(0,179,126,0.16)")   // stabilo hijau
            : _isMerah
              ? (i % 2 === 0 ? "rgba(229,72,77,0.08)" : "rgba(229,72,77,0.14)")  // stabilo merah
              : (i % 2 === 0 ? "#F7F9FC" : "#F1F3F8");  // normal

        // 4. Bikin elemen baris tabel <tr>
        let tr = document.createElement("tr");
        if (_isHijau) tr.classList.add("zona-hijau");
        else if (_isMerah) tr.classList.add("zona-merah");
        tr.style.background = _isHijau || _isMerah ? "" : rowBg;

        // Highlight khusus kalau itu tim milik player
        let isTimKita =
            typeof timPlayer !== "undefined" && tim.nama === timPlayer;
        let styleNama = isTimKita ? "color: #5B3DF5; font-weight: bold;" : "";

        // 5. Rakit isian kolom <td>
        tr.innerHTML = `
            <td style="${rowStyle} font-size: 14px; font-weight: bold;">${i + 1}</td>
            <td style="text-align: left; cursor: pointer;">
                <div class="team-cell">
                    <img src="${tim.logo}" class="logo-tim" onerror="this.src='https://ui-avatars.com/api/?name=${tim.nama}&background=333&color=fff'">
                    <span class="team-name" style="${styleNama}">${tim.nama}</span>
                </div>
            </td>
            <td style="color: #E5484D; font-weight: bold;">${tim.poin}</td>
            <td>${tim.matchW} - ${tim.matchL}</td>
            <td style="color: #E5484D; font-weight: bold;">${tim.netGame > 0 ? "+" + tim.netGame : tim.netGame}</td>
            <td>${tim.gameW} - ${tim.gameL}</td>
        `;

        // 6. Pasang fungsi klik dengan aman (tanpa string injection)
        tr.querySelector("td:nth-child(2)").onclick = function () {
            bukaInfoTim(tim.nama);
        };

        // 7. Simpan baris ke meja kerja
        fragment.appendChild(tr);
    });

    // 8. Tembak sekaligus ke DOM
    container.appendChild(fragment);

    // Update teks musim di header tabel (Variabel global musimKe)
    if (getEl(idTeksMusim)) {
        getEl(idTeksMusim).innerText = musimKe;
    }
}

function bukaModalProposalPelatih(index) {
    targetPelatihNego = bursaStaff[index];
    indexPelatihNego = index;

    // Tampilkan info siapa yang lagi di-nego
    getEl("teksInfoPelatih").innerText =
        `Negosiasi dengan ${targetPelatihNego.nama} (${targetPelatihNego.kepribadian})\nEkspektasi Gaji: Rp ${(targetPelatihNego.ekspektasiGaji / 1000000).toFixed(1)} Jt`;

    // Set Default form
    getEl("inputGajiPelatih").value = targetPelatihNego.ekspektasiGaji;
    getEl("inputTargetPelatih").value = "Top 4 MPL";
    getEl("inputDurasiPelatih").value = "1";
    getEl("inputBonusPelatih").value = "0";

    // Buka form proposal, tutup modal profil staff (jika sedang terbuka)
    getEl("modalProposalPelatih").classList.remove("sembunyi");
    let modalProfilStaff = getEl("modalProfilStaff");
    if (modalProfilStaff) modalProfilStaff.classList.add("sembunyi");
}

function tutupModalProposalPelatih() {
    getEl("modalProposalPelatih").classList.add("sembunyi");
}

// ============================================================
// PATCH MENTAL & STAMINA — Render + Decay/Recovery
// ============================================================

// [1] RENDER BAR MENTAL & STAMINA ke #sectionMentalStamina
function renderMentalStamina() {
    let el = getEl("sectionMentalStamina");
    if (!el) return;

    let starters = [];
    let roles = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
    roles.forEach(role => {
        let inRole = rosterKita.filter(p => p.role === role);
        if (inRole.length === 0) return;
        let starter = inRole.find(p => p.isStarter) || inRole.sort((a,b) => b.ovr - a.ovr)[0];
        starters.push(starter);
    });

    if (starters.length === 0) {
        el.innerHTML = `<div class="empty-state" style="padding:10px;">Belum ada data pemain.</div>`;
        return;
    }

    let html = "";
    starters.forEach(p => {
        // Pastikan stamina ada — init kalau belum
        if (p.stamina === undefined) p.stamina = Math.min(99, Math.max(50, (p.ovr || 70) + Math.floor(Math.random() * 10) - 5));
        if (p.mental === undefined)  p.mental  = Math.min(99, Math.max(35, (p.ovr || 70) - 5 + Math.floor(Math.random() * 10)));

        let mVal = p.mental;
        let sVal = p.stamina;

        // Warna mental & stamina
        let mColor = mVal >= 75 ? "var(--green)" : mVal >= 50 ? "var(--accent)" : "var(--red)";
        let sColor = sVal >= 75 ? "var(--cyan)"  : sVal >= 50 ? "var(--accent)" : "var(--red)";

        // Kondisi pemain: Prima / Stabil / Lelah
        let kondisi;
        if (mVal >= 75 && sVal >= 75) {
            kondisi = { cls: "prima", icon: "fa-bolt", label: "Prima" };
        } else if (mVal < 50 || sVal < 50) {
            kondisi = { cls: "lelah", icon: "fa-battery-quarter", label: "Lelah" };
        } else {
            kondisi = { cls: "stabil", icon: "fa-face-meh", label: "Stabil" };
        }

        let inisial = (p.nama || "?").trim().charAt(0).toUpperCase();

        html += `
        <div class="player-row">
            <div class="player-avatar">${inisial}</div>
            <div class="player-info">
                <div class="player-name-row">
                    <span class="player-name">${p.nama}</span>
                    <span class="player-ovr">OVR ${p.ovr}</span>
                    <span class="cond-pill cond-pill--${kondisi.cls}"><i class="fa-solid ${kondisi.icon}"></i> ${kondisi.label}</span>
                </div>
                <div class="player-bars">
                    <div class="player-bar-row">
                        <span class="player-bar-icon"><i class="fa-solid fa-face-smile" style="color:${mColor};"></i></span>
                        <div class="player-bar-track"><div class="player-bar-fill" style="width:${mVal}%;background:${mColor};"></div></div>
                        <span class="player-bar-value" style="color:${mColor};">${mVal}</span>
                    </div>
                    <div class="player-bar-row">
                        <span class="player-bar-icon"><i class="fa-solid fa-bolt" style="color:${sColor};"></i></span>
                        <div class="player-bar-track"><div class="player-bar-fill" style="width:${sVal}%;background:${sColor};"></div></div>
                        <span class="player-bar-value" style="color:${sColor};">${sVal}</span>
                    </div>
                </div>
            </div>
        </div>`;
    });

    el.innerHTML = html;
}
window.renderMentalStamina = renderMentalStamina;

// [2] DECAY stamina pasca-match, recovery saat jeda
// Dipanggil dari script.js setelah setiap match/hari jeda
window.prosesStaminaMental = function(isMatchDay) {
    if (!rosterKita || rosterKita.length === 0) return;

    rosterKita.forEach(p => {
        // Init kalau belum ada
        if (p.stamina === undefined) p.stamina = Math.min(99, Math.max(50, (p.ovr || 70)));
        if (p.mental  === undefined) p.mental  = Math.min(99, Math.max(35, (p.ovr || 70) - 5));

        if (isMatchDay) {
            // Match: stamina turun 4-8, mental sedikit fluktuasi
            let decayStamina = 4 + Math.floor(Math.random() * 5);
            p.stamina = Math.max(10, p.stamina - decayStamina);

            // Mental dipengaruhi sifat
            let sifat = p.sifat || "Normal";
            if (sifat === "Malas") p.mental = Math.max(10, p.mental - 3);
            else if (sifat === "Pekerja Keras") p.mental = Math.min(99, p.mental + 1);
        } else {
            // Hari jeda: stamina recover 5-10, mental recover 2-4
            let recoverStamina = 5 + Math.floor(Math.random() * 6);
            let recoverMental  = 2 + Math.floor(Math.random() * 3);
            p.stamina = Math.min(99, p.stamina + recoverStamina);
            p.mental  = Math.min(99, p.mental  + recoverMental);
        }
    });

    renderMentalStamina();
};

