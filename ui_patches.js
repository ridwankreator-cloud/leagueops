// ============================================================
// UI PATCHES -- GABUNGAN
// File ini gabungan dari beberapa patch JS terpisah (sekarang jadi
// 1 file biar gak kebanyakan file lepas). Tiap bagian masih dipisah
// jelas per fitur, masing-masing dibungkus IIFE sendiri (gak saling
// gantung) -- kalau mau rollback SATU fitur aja, tinggal hapus
// section-nya (dari komentar "=== MULAI ===" sampai "=== SELESAI
// ==="), gak perlu hapus semua.
// ============================================================

// ============================================================
// === MULAI: HASIL MATCH FULLSCREEN ===
// (asalnya: hasil_match_fullscreen_patch.js)
// ============================================================
// ============================================================
// HASIL MATCH — FULLSCREEN PATCH
// Restructure DOM modal #modalHasilMatch jadi fullscreen (sekali
// jalan, idempotent), lalu re-render header skor pakai markup yang
// lebih rapi (pill Victory/Defeat, logo lebih besar, tombol close).
// Isi highlight / statistik / awards / MVP TETAP dibuild oleh
// window.bukaHasilMatch asli di ui.js -- patch ini cuma numpang
// lewat (wrap) fungsi itu, gak nulis ulang logicnya.
//
// Rollback: hapus <script> ke file ini di index.html (dan CSS
// pasangannya, hasil_match_fullscreen_patch.css).
// ============================================================

(function () {
    function restrukturSekaliJalan() {
        let modal = document.getElementById("modalHasilMatch");
        if (!modal || modal.dataset.fullscreenPatched === "1") return;
        modal.dataset.fullscreenPatched = "1";

        // Overlay ini gak butuh align-items:flex-end (bottom-sheet)
        // lagi -- CSS patch yang ngatur full-layar via #modalHasilMatch.
        modal.removeAttribute("style");

        let sheet = modal.querySelector(".modal-hasil-sheet");
        let titleLama = sheet.querySelector(".hasil-title");
        let skorWrap = document.getElementById("hasilMatchSkor");
        if (!sheet || !titleLama || !skorWrap) return;

        let header = document.createElement("div");
        header.className = "hasil-header-patch";

        let topbar = document.createElement("div");
        topbar.className = "hasil-topbar-patch";
        topbar.innerHTML =
            '<button class="hasil-btn-close-patch" onclick="tutupHasilMatch()">✕</button>' +
            '<div class="hasil-title-patch">' +
                '<i class="fa-solid fa-satellite-dish hasil-icon-patch"></i>' +
                '<span class="hasil-title-text-patch">Hasil Pertandingan</span>' +
            '</div>' +
            '<div class="hasil-topbar-spacer-patch"></div>';

        header.appendChild(topbar);
        sheet.insertBefore(header, titleLama);
        header.appendChild(skorWrap); // pindahin node skor yg udah ada (id-nya tetep sama)
        titleLama.remove();

        // Shadow header baru muncul pas discroll, biar jelas ada
        // layer di atas konten (bukan numpuk/nutupin diam-diam).
        let scrollBody = sheet.querySelector(".hasil-scroll-body");
        if (scrollBody) {
            scrollBody.addEventListener("scroll", function () {
                header.classList.toggle("di-scroll-patch", this.scrollTop > 4);
            });
        }
    }

    // Ganti emoji jadi Font Awesome icon. Cuma jalan di dalam
    // #modalHasilMatch (lewat scrollBody.innerHTML), gak nyentuh
    // emoji 🏆/📡 dkk di bagian lain aplikasi.
    function gantiEmojiIkon(html) {
        return html
            .replace(/📡/g, '<i class="fa-solid fa-satellite-dish hasil-icon-patch"></i>')
            .replace(/🏆/g, '<i class="fa-solid fa-trophy hasil-icon-patch"></i>')
            .replace(/📊/g, '<i class="fa-solid fa-chart-bar hasil-icon-patch"></i>')
            .replace(/🏅/g, '<i class="fa-solid fa-medal hasil-icon-patch"></i>')
            .replace(/⏱/g, '<i class="fa-solid fa-stopwatch hasil-icon-patch"></i>');
    }

    function renderSkorRapi(data) {
        let { home, away, skorHome, skorAway, gameDuration } = data;
        let warnaHome = skorHome > skorAway ? "#00B37E" : "#E5484D";
        let warnaAway = skorAway > skorHome ? "#00B37E" : "#E5484D";
        let labelHome = skorHome > skorAway ? "VICTORY" : "DEFEAT";
        let labelAway = skorAway > skorHome ? "VICTORY" : "DEFEAT";

        document.getElementById("hasilMatchSkor").innerHTML = `
            <div class="hasil-team-col-patch">
                <div class="hasil-team-label-patch" style="color:${warnaHome};">${labelHome}</div>
                <img src="${home.logo}" class="hasil-team-logo-patch" onerror="this.src='https://ui-avatars.com/api/?name=${home.nama}&background=1e1e1e&color=fff'">
                <span class="hasil-team-name-patch">${home.nama}</span>
            </div>
            <div class="hasil-skor-center-patch">
                <div class="hasil-skor-angka">${skorHome} — ${skorAway}</div>
                <div class="hasil-skor-label">Regular Season</div>
                ${gameDuration ? `<div class="hasil-skor-duration"><i class="fa-solid fa-stopwatch hasil-icon-patch"></i> ${gameDuration}</div>` : ""}
            </div>
            <div class="hasil-team-col-patch">
                <div class="hasil-team-label-patch" style="color:${warnaAway};">${labelAway}</div>
                <img src="${away.logo}" class="hasil-team-logo-patch" onerror="this.src='https://ui-avatars.com/api/?name=${away.nama}&background=1e1e1e&color=fff'">
                <span class="hasil-team-name-patch">${away.nama}</span>
            </div>
        `;
    }

    if (typeof window.bukaHasilMatch !== "function") {
        console.warn("[hasil_match_fullscreen_patch] window.bukaHasilMatch belum ada -- cek urutan <script> di index.html (patch ini harus dimuat SETELAH ui.js).");
        return;
    }

    let bukaHasilMatchAsli = window.bukaHasilMatch;
    window.bukaHasilMatch = function (data) {
        bukaHasilMatchAsli(data); // logic asli: highlight, statistik per-game, awards, MVP
        restrukturSekaliJalan();
        renderSkorRapi(data);

        let scrollBody = document.querySelector("#modalHasilMatch .hasil-scroll-body");
        if (scrollBody) {
            scrollBody.innerHTML = gantiEmojiIkon(scrollBody.innerHTML);
            scrollBody.scrollTop = 0;
        }
    };
})();

// === SELESAI: HASIL MATCH FULLSCREEN ===

// ============================================================
// === MULAI: EMAIL MODAL (UNDANGAN TRIAL DKK) ===
// (asalnya: email_modal_patch.js)
// ============================================================
// ============================================================
// EMAIL MODAL -- TIDY-UP PATCH (Undangan Trial dkk)
// Numpang lewat (wrap) window.bacaEmail dari ui.js -- isi email
// tetap dirakit oleh script.js/ui.js apa adanya, patch ini cuma
// ngerapiin tampilannya setelah kebuka:
//   1. Kotak info "Tim pengundang / Pemain / Durasi trial" (email
//      undangan trial) dirombak jadi card list + Font Awesome icon.
//   2. Sisa emoji 🏟️/👤/⏳ yang mungkin masih ada (email lain yang
//      belum ke-cover pola di atas) diganti icon juga, sebagai jaga2.
// Email yang gak match pola manapun tetap tampil normal (fallback).
//
// Rollback: hapus <script> ke file ini di index.html (dan CSS
// pasangannya, email_modal_patch.css).
// ============================================================

(function () {
    // Kotak info "🏟️ Tim pengundang / 👤 Pemain / ⏳ Durasi trial"
    // (dipakai fungsi undangan trial AI di script.js) -> card rapi.
    function upgradeInfoCardTrial(html) {
        let re = /<div style="background:#F1F3F8;[^"]*">\s*🏟️ Tim pengundang: <b style="color:#5B3DF5;">([^<]+)<\/b><br>\s*👤 Pemain: <b>([^<]+)<\/b> — ([^<]+)<br>\s*⏳ Durasi trial: <b>([^<]+)<\/b> \(([^)]+)\)\s*<\/div>/;
        let m = html.match(re);
        if (!m) return html;
        let [full, tim, pemain, role, durasi, sisa] = m;
        let baru = `
        <div class="email-info-card-patch">
            <div class="email-info-row-patch"><i class="fa-solid fa-shield-halved email-info-icon-patch"></i><span>Tim pengundang: <b class="email-info-accent-patch">${tim}</b></span></div>
            <div class="email-info-row-patch"><i class="fa-solid fa-user email-info-icon-patch"></i><span>Pemain: <b>${pemain}</b> — ${role}</span></div>
            <div class="email-info-row-patch"><i class="fa-solid fa-hourglass-half email-info-icon-patch"></i><span>Durasi trial: <b>${durasi}</b> (${sisa})</span></div>
        </div>`;
        return html.replace(full, baru);
    }

    // Jaga-jaga: kalau masih ada emoji ini nyisa di email lain
    // (pola yang gak match upgradeInfoCardTrial), tetap diganti icon.
    function gantiEmojiEmail(html) {
        return html
            .replace(/🏟️/g, '<i class="fa-solid fa-shield-halved email-info-icon-patch"></i>')
            .replace(/👤/g, '<i class="fa-solid fa-user email-info-icon-patch"></i>')
            .replace(/⏳/g, '<i class="fa-solid fa-hourglass-half email-info-icon-patch"></i>');
    }

    if (typeof window.bacaEmail !== "function") {
        console.warn("[email_modal_patch] window.bacaEmail belum ada -- cek urutan <script> di index.html (patch ini harus dimuat SETELAH ui.js).");
        return;
    }

    let bacaEmailAsli = window.bacaEmail;
    window.bacaEmail = function (index) {
        bacaEmailAsli(index);

        let isi = document.getElementById("bacaEmailIsi");
        if (!isi) return;

        let html = upgradeInfoCardTrial(isi.innerHTML);
        html = gantiEmojiEmail(html);
        isi.innerHTML = html;
    };
})();

// === SELESAI: EMAIL MODAL ===

// ============================================================
// === MULAI: HASIL MSC (WILD CARD / GROUP STAGE) ===
// (asalnya: msc_hasil_modal_patch.js)
// ============================================================
// ============================================================
// HASIL MSC (WILD CARD / GROUP STAGE) -- TIDY-UP PATCH
// window.bukaModal (di ui.js) dipakai generik buat ratusan
// notifikasi lain di game. Patch ini numpang lewat (wrap) fungsi
// itu: kontennya di-cek dulu, KALAU strukturnya cocok pola hasil
// pertandingan (dibikin oleh buatRingkasanHasilHariWC /
// buatRingkasanHasilRoundGS di msc_ewc_engine.js -- label grup
// warna #0891B2 + baris "tim - skor - tim"), baru dirender ulang
// jadi list card + icon judul. Notifikasi lain (non-hasil-match)
// dibiarin lewat apa adanya, gak disentuh.
//
// Rollback: hapus <script> ke file ini di index.html (dan CSS
// pasangannya, msc_hasil_modal_patch.css).
// ============================================================

(function () {
    // Emoji judul yang dipakai khusus buat modal hasil WC/GS di
    // msc_ewc_engine.js -> Font Awesome icon. Ditambah 2 judul modal
    // Trial Player (script.js) yang emoji-nya di BELAKANG teks.
    const petaIkonJudul = [
        [/^🎮\s*/, "fa-gamepad"],
        [/^⚔️\s*/, "fa-fire"],
        [/^🎟️\s*/, "fa-ticket"],
        [/^🏆\s*/, "fa-trophy"],
        [/^⚠️\s*/, "fa-triangle-exclamation"],
        [/\s*🔍$/, "fa-magnifying-glass"],
        [/\s*⚡$/, "fa-bolt"],
        [/\s*⏳$/, "fa-hourglass-half"],
        [/\s*❌$/, "fa-circle-xmark"],
        [/\s*🔄$/, "fa-rotate"],
    ];

    function ambilIkonJudul(judul) {
        for (let [re, iconClass] of petaIkonJudul) {
            if (re.test(judul)) return { icon: iconClass, teks: judul.replace(re, "").trim() };
        }
        return null;
    }

    // Parse HTML ringkasan hasil (bentukan buatRingkasanHasilHariWC /
    // buatRingkasanHasilRoundGS) jadi struktur {label, rows[]}.
    // Return null kalau HTML-nya bukan pola itu (berarti bukaModal
    // ini dipanggil buat notifikasi lain -- biarin default).
    function parseRingkasanHasil(html) {
        let wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        let outer = wrapper.querySelector('div[style*="text-align:left"]');
        if (!outer) return null;

        let adaLabelGrup = Array.from(outer.children).some(
            el => (el.getAttribute("style") || "").includes("#0891B2")
        );
        if (!adaLabelGrup) return null;

        let sections = [];
        let current = null;
        Array.from(outer.children).forEach(el => {
            let style = el.getAttribute("style") || "";
            if (style.includes("#0891B2")) {
                current = { label: el.textContent.trim(), rows: [] };
                sections.push(current);
            } else if (current) {
                let spans = el.querySelectorAll("span");
                if (spans.length === 3) {
                    let homeStyle = spans[0].getAttribute("style") || "";
                    let awayStyle = spans[2].getAttribute("style") || "";
                    current.rows.push({
                        home: spans[0].textContent.trim(),
                        skor: spans[1].textContent.trim(),
                        away: spans[2].textContent.trim(),
                        homeMenang: homeStyle.includes("00B37E"),
                        awayMenang: awayStyle.includes("00B37E"),
                    });
                }
            }
        });
        return sections.length ? sections : null;
    }

    function renderSections(sections) {
        return '<div class="msc-hasil-wrap-patch">' + sections.map(sec => `
            <div class="msc-hasil-grup-label-patch">${sec.label}</div>
            <div class="msc-hasil-list-patch">
                ${sec.rows.map(r => `
                    <div class="msc-hasil-row-patch">
                        <span class="msc-hasil-tim-patch msc-hasil-tim-kiri-patch ${r.homeMenang ? "menang" : ""}">${r.home}</span>
                        <span class="msc-hasil-skor-patch">${r.skor}</span>
                        <span class="msc-hasil-tim-patch msc-hasil-tim-kanan-patch ${r.awayMenang ? "menang" : ""}">${r.away}</span>
                    </div>`).join("")}
            </div>
        `).join("") + "</div>";
    }

    if (typeof window.bukaModal !== "function") {
        console.warn("[msc_hasil_modal_patch] window.bukaModal belum ada -- cek urutan <script> di index.html (patch ini harus dimuat SETELAH ui.js).");
        return;
    }

    let bukaModalAsli = window.bukaModal;
    window.bukaModal = function (judul, pesan, warnaGaris) {
        let sections = parseRingkasanHasil(pesan);
        let info = ambilIkonJudul(judul);

        bukaModalAsli(judul, sections ? renderSections(sections) : pesan, warnaGaris);

        if (info) {
            let titleEl = document.getElementById("modalTitle");
            if (titleEl) {
                titleEl.classList.add("modal-title-patch");
                titleEl.innerHTML =
                    `<i class="fa-solid ${info.icon}"></i>` +
                    `<span class="modal-title-text-patch">${info.teks}</span>`;
            }
        }
    };
})();

// === SELESAI: HASIL MSC ===

// ============================================================
// === MULAI: RIWAYAT JUARA (LEMARI TROFI) ===
// (asalnya: riwayat_juara_shelf_patch.js)
// ============================================================
// ============================================================
// RIWAYAT JUARA -- LEMARI TROFI PATCH
// Numpang lewat (wrap) window.renderRiwayatJuara dari ui.js: logic
// & data asli (bankRiwayatJuara, pengelompokan season, dst) tetap
// jalan apa adanya dan ngisi #kontenRiwayat seperti biasa. Patch
// ini cuma MEM-PARSE hasil render itu (bukan nyentuh data mentah)
// terus nyusun ulang tampilannya jadi:
//   - Tab season horizontal (bukan list nempel ke bawah)
//   - Turnamen Global (MSC/M-Series) -> kartu hero
//   - Turnamen MPL regional -> grid 2 kolom
// Logo tim di-clone langsung dari <img> asli (src + onerror-nya)
// biar fallback ui-avatars yang udah ada tetep jalan persis sama.
//
// Rollback: hapus <script> ke file ini di index.html (dan CSS
// pasangannya, riwayat_juara_shelf_patch.css).
// ============================================================

(function () {
    if (typeof window.renderRiwayatJuara !== "function") {
        console.warn("[riwayat_juara_shelf_patch] window.renderRiwayatJuara belum ada -- cek urutan <script> di index.html (patch ini harus dimuat SETELAH ui.js).");
        return;
    }

    function parseSeasons(container) {
        let seasons = [];
        let current = null;

        Array.from(container.children).forEach(el => {
            if (el.classList.contains("riwayat-season-head")) {
                current = { label: el.textContent.trim(), global: [], regional: [] };
                seasons.push(current);
            } else if (el.classList.contains("riwayat-season-body") && current) {
                el.querySelectorAll(".riwayat-item").forEach(item => {
                    let labelEl = item.querySelector(".riwayat-item__label");
                    let logoEl = item.querySelector(".riwayat-item__logo");
                    let namaEl = item.querySelector(".riwayat-item__nama");
                    if (!labelEl || !logoEl || !namaEl) return;

                    let isGold = labelEl.classList.contains("riwayat-item__label--gold");
                    let isCyan = labelEl.classList.contains("riwayat-item__label--cyan");

                    // 🏆 udah dipindah jadi badge bulat sendiri, 🌐 diganti icon globe
                    let labelHtml = labelEl.textContent
                        .replace(/🏆\s*/g, "")
                        .trim()
                        .replace(/🌐\s*/g, '<i class="fa-solid fa-earth-americas rj-globe-icon-patch"></i> ');

                    let data = {
                        labelHtml,
                        isCyan,
                        logoEl: logoEl.cloneNode(true), // clone <img> asli -> src & onerror ikut persis
                        nama: namaEl.textContent.trim(),
                    };
                    (isGold ? current.global : current.regional).push(data);
                });
            }
        });

        return seasons;
    }

    function buildHero(g) {
        let wrap = document.createElement("div");
        wrap.className = "rj-hero-patch";

        let badge = document.createElement("div");
        badge.className = "rj-hero-patch__badge";
        badge.innerHTML = '<i class="fa-solid fa-trophy"></i>';

        let logo = g.logoEl;
        logo.className = "rj-hero-patch__logo";

        let info = document.createElement("div");
        info.className = "rj-hero-patch__info";
        info.innerHTML =
            `<div class="rj-hero-patch__label"><i class="fa-solid fa-star"></i> ${g.labelHtml}</div>` +
            `<div class="rj-hero-patch__nama">${g.nama}</div>`;

        wrap.appendChild(badge);
        wrap.appendChild(logo);
        wrap.appendChild(info);
        return wrap;
    }

    function buildGridItem(r) {
        let wrap = document.createElement("div");
        wrap.className = "rj-grid-item-patch";

        let badge = document.createElement("div");
        badge.className = "rj-grid-item-patch__badge" + (r.isCyan ? " rj-grid-item-patch__badge--cyan" : "");
        badge.innerHTML = '<i class="fa-solid fa-trophy"></i>';

        let logo = r.logoEl;
        logo.className = "rj-grid-item-patch__logo";

        let nama = document.createElement("div");
        nama.className = "rj-grid-item-patch__nama";
        nama.textContent = r.nama;

        let label = document.createElement("div");
        label.className = "rj-grid-item-patch__label";
        label.innerHTML = r.labelHtml;

        wrap.appendChild(badge);
        wrap.appendChild(logo);
        wrap.appendChild(nama);
        wrap.appendChild(label);
        return wrap;
    }

    function renderSeasonContent(seasons, idx, contentEl) {
        let s = seasons[idx];
        contentEl.innerHTML = "";

        if (s.global.length) {
            let title = document.createElement("div");
            title.className = "rj-section-title-patch";
            title.innerHTML = '<i class="fa-solid fa-earth-americas"></i> Turnamen Global';
            contentEl.appendChild(title);
            s.global.forEach(g => contentEl.appendChild(buildHero(g)));
        }

        if (s.regional.length) {
            let title = document.createElement("div");
            title.className = "rj-section-title-patch";
            title.innerHTML = '<i class="fa-solid fa-flag"></i> MPL Regional';
            contentEl.appendChild(title);

            let grid = document.createElement("div");
            grid.className = "rj-grid-patch";
            s.regional.forEach(r => grid.appendChild(buildGridItem(r)));
            contentEl.appendChild(grid);
        }

        if (!s.global.length && !s.regional.length) {
            contentEl.innerHTML = '<div class="empty-note">Belum ada juara di season ini.</div>';
        }
    }

    let renderRiwayatJuaraAsli = window.renderRiwayatJuara;
    window.renderRiwayatJuara = function () {
        renderRiwayatJuaraAsli(); // logic & data asli tetap yang ngisi #kontenRiwayat dulu

        let container = document.getElementById("kontenRiwayat");
        if (!container) return;

        // Belum ada juara sama sekali -- biarin pesan default apa adanya.
        if (!container.querySelector(".riwayat-season-head")) return;

        let seasons = parseSeasons(container);
        if (!seasons.length) return;

        let tabRow = document.createElement("div");
        tabRow.className = "rj-tab-row-patch";

        let contentEl = document.createElement("div");
        contentEl.id = "kontenRiwayatShelf";

        seasons.forEach((s, i) => {
            let btn = document.createElement("button");
            btn.className = "rj-tab-patch" + (i === 0 ? " aktif" : "");

            // "SEASON X (Tahun)" -> "SEASON X" + tahun kecil di sampingnya
            let m = s.label.match(/^(.*)\s*\((.+)\)$/);
            btn.innerHTML = m
                ? `${m[1].trim()}<span class="rj-tahun-patch">${m[2]}</span>`
                : s.label;

            btn.onclick = function () {
                tabRow.querySelectorAll(".rj-tab-patch").forEach(b => b.classList.remove("aktif"));
                btn.classList.add("aktif");
                renderSeasonContent(seasons, i, contentEl);
            };
            tabRow.appendChild(btn);
        });

        container.innerHTML = "";
        container.appendChild(tabRow);
        container.appendChild(contentEl);
        renderSeasonContent(seasons, 0, contentEl); // season terbaru (index 0) default aktif
    };
})();

// === SELESAI: RIWAYAT JUARA ===

// ============================================================
// === MULAI: BERITA MUSIM INI (GAYA A -- TIMELINE ICON) ===
// Numpang lewat (wrap) window.bukaBeritaLengkap dari ui.js: data
// (bankBerita) & logic asli tetap yang ngisi #listBeritaFull dulu.
// Patch ini cuma post-process tiap .news-item yang udah kebentuk:
// emoji di depan teks diganti Font Awesome icon (peta ~55 emoji
// yang kepake di seluruh project buat tambahBerita), dikelompokin
// ke salah satu warna semantik (alert/lock/waktu/deal/accent/info),
// terus dirender ulang jadi timeline dengan badge bulat + pill
// tanggal, bukan list polos dipisah garis putus-putus lagi.
// ============================================================
(function () {
    const petaBerita = {
        "⚔️": ["fa-hand-fist", "accent"], "⚔": ["fa-hand-fist", "accent"],
        "⚠️": ["fa-triangle-exclamation", "alert"], "⚠": ["fa-triangle-exclamation", "alert"],
        "⚡": ["fa-bolt", "accent"],
        "✅": ["fa-circle-check", "deal"],
        "✈️": ["fa-plane", "info"], "✈": ["fa-plane", "info"],
        "❌": ["fa-circle-xmark", "alert"],
        "⬆️": ["fa-arrow-up", "deal"], "⬆": ["fa-arrow-up", "deal"],
        "⏳": ["fa-hourglass-half", "waktu"],
        "🌍": ["fa-earth-americas", "info"],
        "🌐": ["fa-earth-americas", "info"],
        "🎓": ["fa-graduation-cap", "deal"],
        "🎙️": ["fa-microphone", "info"], "🎙": ["fa-microphone", "info"],
        "🎟️": ["fa-ticket", "accent"], "🎟": ["fa-ticket", "accent"],
        "🎮": ["fa-gamepad", "accent"],
        "🎯": ["fa-bullseye", "deal"],
        "🏁": ["fa-flag-checkered", "deal"],
        "🏆": ["fa-trophy", "accent"],
        "🏟️": ["fa-landmark", "info"], "🏟": ["fa-landmark", "info"],
        "🏦": ["fa-building-columns", "waktu"],
        "🏳️": ["fa-flag", "alert"], "🏳": ["fa-flag", "alert"],
        "👋": ["fa-hand", "info"],
        "💀": ["fa-skull", "alert"],
        "💔": ["fa-heart-crack", "alert"],
        "💪": ["fa-dumbbell", "deal"],
        "💰": ["fa-sack-dollar", "waktu"],
        "💸": ["fa-money-bill-wave", "waktu"],
        "💼": ["fa-briefcase", "info"],
        "📅": ["fa-calendar-day", "info"],
        "📈": ["fa-arrow-trend-up", "deal"],
        "📉": ["fa-arrow-trend-down", "alert"],
        "📊": ["fa-chart-bar", "info"],
        "📋": ["fa-clipboard-list", "info"],
        "📝": ["fa-pen-to-square", "info"],
        "📤": ["fa-paper-plane", "info"],
        "📨": ["fa-envelope", "info"],
        "📭": ["fa-inbox", "lock"],
        "📰": ["fa-newspaper", "info"],
        "🔄": ["fa-rotate", "info"],
        "🔍": ["fa-magnifying-glass", "info"],
        "🔒": ["fa-lock", "lock"],
        "🔓": ["fa-lock-open", "lock"],
        "🔔": ["fa-bell", "info"],
        "🔥": ["fa-fire", "accent"],
        "🔭": ["fa-binoculars", "info"],
        "🔴": ["fa-circle-exclamation", "alert"],
        "😔": ["fa-face-frown", "alert"],
        "😤": ["fa-face-angry", "alert"],
        "😱": ["fa-face-surprise", "alert"],
        "🚀": ["fa-rocket", "deal"],
        "🚨": ["fa-circle-exclamation", "alert"],
        "🚪": ["fa-door-open", "lock"],
        "🛡️": ["fa-shield-halved", "info"], "🛡": ["fa-shield-halved", "info"],
        "🤝": ["fa-handshake", "deal"],
        "🥉": ["fa-medal", "accent"],
        "🧑": ["fa-user", "info"],
        "🧳": ["fa-suitcase", "info"],
        "🪦": ["fa-door-closed", "lock"],
    };

    // Ambil emoji di depan teks (kalau ada), balikin icon+tipe+sisa
    // teks tanpa emoji-nya. Berita yang gak ada emoji di depan
    // (misal "BREAKING: ...") jatuh ke default fa-bolt/accent.
    function ambilIkonBerita(teks) {
        let m = teks.match(/^\s*(\p{Extended_Pictographic}\uFE0F?)/u);
        if (!m) return { icon: "fa-bolt", tipe: "accent", sisa: teks.trim() };
        let emoji = m[1];
        let info = petaBerita[emoji] || petaBerita[emoji.replace(/\uFE0F$/, "")] || ["fa-flag", "info"];
        return { icon: info[0], tipe: info[1], sisa: teks.slice(m[0].length).trim() };
    }
    window.__ambilIkonBerita = ambilIkonBerita; // dipakai juga sama patch ticker dashboard di bawah

    function upgradeBeritaItem(itemEl) {
        let dateEl = itemEl.querySelector(".news-date");
        let textEl = itemEl.querySelector(".news-text");
        if (!dateEl || !textEl) return;

        let tanggal = dateEl.textContent.replace(/📅\s*/, "").trim();
        let { icon, tipe, sisa } = ambilIkonBerita(textEl.innerHTML);

        itemEl.classList.add("berita-item-patch", "tipe-" + tipe);
        itemEl.removeAttribute("style");
        itemEl.innerHTML = `
            <div class="berita-badge-patch"><i class="fa-solid ${icon}"></i></div>
            <div class="berita-body-patch">
                <div class="berita-tanggal-patch"><i class="fa-regular fa-calendar"></i> ${tanggal}</div>
                <div class="berita-teks-patch">${sisa}</div>
            </div>`;
    }

    if (typeof window.bukaBeritaLengkap !== "function") {
        console.warn("[ui_patches: berita] window.bukaBeritaLengkap belum ada -- cek urutan <script> (harus dimuat SETELAH ui.js).");
        return;
    }

    let bukaBeritaLengkapAsli = window.bukaBeritaLengkap;
    window.bukaBeritaLengkap = function () {
        bukaBeritaLengkapAsli(); // data & logic asli tetap yang ngisi #listBeritaFull dulu
        let container = document.getElementById("listBeritaFull");
        if (!container) return;
        container.querySelectorAll(".news-item").forEach(upgradeBeritaItem);
    };
})();

// === SELESAI: BERITA MUSIM INI ===

// ============================================================
// === MULAI: BERITA TICKER DASHBOARD (KABAR TERKINI) ===
// Ini beda fungsi sama modal "Lihat Semua" di atas -- ticker satu
// baris di dashboard dirender window.renderBerita (isi #boxBerita),
// bukan window.bukaBeritaLengkap. Emoji di depan teks diganti icon
// kecil juga di sini, pakai peta yang sama (window.__ambilIkonBerita,
// di-expose dari section BERITA MUSIM INI di atas).
// ============================================================
(function () {
    if (typeof window.renderBerita !== "function") {
        console.warn("[ui_patches: berita ticker] window.renderBerita belum ada -- cek urutan <script>.");
        return;
    }

    let renderBeritaAsli = window.renderBerita;
    window.renderBerita = function () {
        renderBeritaAsli(); // logic & data asli (bankBerita) tetap yang jalan duluan

        let box = document.getElementById("boxBerita");
        if (!box || typeof bankBerita === "undefined" || bankBerita.length === 0) return;
        if (typeof window.__ambilIkonBerita !== "function") return; // jaga2 kalau section di atas gak kemuat

        let b = bankBerita[0];
        let { icon, sisa } = window.__ambilIkonBerita(b.teks);

        box.classList.add("berita-ticker-patch");
        box.innerHTML = `<i class="fa-solid ${icon} berita-ticker-icon-patch"></i><b>${b.tanggal}</b>: ${sisa}`;
    };
})();

// === SELESAI: BERITA TICKER DASHBOARD ===

// ============================================================
// === MULAI: BURSA TRANSFER (SEARCH ICON + NOTIF ROSTER LOCK) ===
// Tombol "Trial" / "Open Rec." di header Bursa Transfer udah
// diedit langsung di index.html (icon dipisah dari teks, gak lewat
// wrap function). Section ini nanganin 2 bagian yang dibangun ulang
// setiap kali window.updateDashboard jalan:
//   1. Input pencarian ("🔍 Cari nama...") -> placeholder polos,
//      icon beneran ditaruh di dalam kotak input (bukan nyampur ke
//      teks placeholder).
//   2. Notif merah di atas list Bursa Transfer (pesan Roster Lock
//      dari calendar_system_patch.js, atau fallback "Transfer
//      ditutup") -> emoji depan diganti icon.
// #listTransfer di-replace total (innerHTML =) tiap render, jadi
// upgrade ini emang harus diulang tiap panggilan updateDashboard --
// itu paling murah/aman buat elemen yang didesain sekali-render.
// ============================================================
(function () {
    if (typeof window.updateDashboard !== "function") {
        console.warn("[ui_patches: bursa transfer] window.updateDashboard belum ada -- cek urutan <script>.");
        return;
    }

    function upgradeSearchInput() {
        let input = document.getElementById("bursaFilterNama");
        if (!input || input.parentElement.classList.contains("bursa-search-wrap-patch")) return;

        input.placeholder = input.placeholder.replace(/^\s*🔍\s*/, "").trim();

        let wrap = document.createElement("div");
        wrap.className = "bursa-search-wrap-patch";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        let icon = document.createElement("i");
        icon.className = "fa-solid fa-magnifying-glass bursa-search-icon-patch";
        wrap.appendChild(icon);
    }

    function upgradeNotifTransfer() {
        let notif = document.getElementById("notifTransfer");
        if (!notif) return;
        notif.innerHTML = notif.innerHTML
            .replace(/^\s*🔒\s*/, '<i class="fa-solid fa-lock notif-transfer-icon-patch"></i> ')
            .replace(/^\s*⚠️\s*/, '<i class="fa-solid fa-triangle-exclamation notif-transfer-icon-patch"></i> ');
    }

    let updateDashboardAsli = window.updateDashboard;
    window.updateDashboard = function () {
        updateDashboardAsli.apply(this, arguments);
        upgradeSearchInput();
        upgradeNotifTransfer();
    };
})();

// === SELESAI: BURSA TRANSFER ===

// ============================================================
// === MULAI: TRIAL PLAYER (TREN ICON) ===
// LABEL_TREND_TRIAL di script.js pakai emoji (📈/➡️/📉) yang nempel
// di teks warna ("Tren: 📉 Menurun") -- muncul di 2 tempat: list
// kandidat trial (window.renderLayarTrialPlayer, container
// #trialDaftarKandidat) dan modal laporan detail
// (window.bukaLaporanTrial, container #trialModalKonten). Keduanya
// di-wrap biar emoji-nya ganti icon setelah render asli jalan.
// ============================================================
(function () {
    function upgradeTrenEmoji(container) {
        if (!container) return;
        container.innerHTML = container.innerHTML
            .replace(/📈\s*/g, '<i class="fa-solid fa-arrow-trend-up tren-icon-patch"></i> ')
            .replace(/➡️\s*/g, '<i class="fa-solid fa-arrow-right tren-icon-patch"></i> ')
            .replace(/📉\s*/g, '<i class="fa-solid fa-arrow-trend-down tren-icon-patch"></i> ');
    }

    if (typeof window.renderLayarTrialPlayer === "function") {
        let renderLayarTrialPlayerAsli = window.renderLayarTrialPlayer;
        window.renderLayarTrialPlayer = function () {
            renderLayarTrialPlayerAsli();
            upgradeTrenEmoji(document.getElementById("trialDaftarKandidat"));
        };
    } else {
        console.warn("[ui_patches: trial tren] window.renderLayarTrialPlayer belum ada -- cek urutan <script>.");
    }

    if (typeof window.bukaLaporanTrial === "function") {
        let bukaLaporanTrialAsli = window.bukaLaporanTrial;
        window.bukaLaporanTrial = function (pemainNama) {
            bukaLaporanTrialAsli(pemainNama);
            upgradeTrenEmoji(document.getElementById("trialModalKonten"));
        };
    } else {
        console.warn("[ui_patches: trial tren] window.bukaLaporanTrial belum ada -- cek urutan <script>.");
    }
})();

// === SELESAI: TRIAL PLAYER (TREN ICON) ===

// ============================================================
// === MULAI: ALERT() -> MODAL APLIKASI ===
// window.alert() bawaan browser (kayak "Halaman pada http://localhost
// menyatakan: ...") itu UI asli WebView, bukan bagian dari app --
// gak bisa di-restyle sama sekali dari CSS. Dipakai ~25 kali di
// script.js buat macem2 validasi/peringatan (bukan cuma "Isi nama
// CEO"). Di-override total: semua alert() sekarang lewat
// window.bukaModal (modal app sendiri) biar konsisten sama UI yang
// lain. Guard clause di kode asli (return setelah alert) tetap aman
// karena override ini tetap jalan sinkron sebelum lanjut ke baris
// berikutnya -- cuma tampilan popup-nya yang beda, bukan alurnya.
// ============================================================
(function () {
    if (typeof window.bukaModal !== "function") {
        console.warn("[ui_patches: alert->modal] window.bukaModal belum ada -- cek urutan <script>.");
        return;
    }

    window.alert = function (pesan) {
        // Buang emoji peringatan yang mungkin udah nempel di depan pesan
        // aslinya (mis. "⚠️ Bursa transfer belum dibuka!"), biar gak
        // dobel sama icon judul "⚠️ Peringatan" yang baru.
        let bersih = String(pesan).replace(/^\s*[⚠️❌✅🔒🔓]+\s*/u, "");
        window.bukaModal("⚠️ Peringatan", bersih, "#E5484D");
    };
})();

// === SELESAI: ALERT() -> MODAL APLIKASI ===

// ============================================================
// === MULAI: PILIH KLUB (TAB LIGA, BUKAN 2 LANGKAH) ===
// Ganti total window.bukaPilihTim (sebelumnya alur 2 langkah: klik
// card liga -> pindah ke daftar tim + tombol "Kembali") jadi tab
// liga yang selalu keliatan; klik tab langsung ganti daftar klub di
// bawahnya. Data & logic tim (DAFTAR_LIGA_PILIHAN, ambilTimUntukLiga)
// TETAP dari script.js apa adanya -- yang diganti cuma cara
// nampilinnya. Penting: window.pilihLigaUntukMulai (script.js) masih
// DIPAKAI di sini (bukan diganti) khusus buat nge-set variabel
// `ligaTerpilihSementara` dengan benar, soalnya variabel itu `let` di
// scope script.js, gak bisa disentuh dari file lain kayak
// `window.ligaTerpilihSementara`.
//
// window.kembaliKePilihLiga jadi gak kepake lagi (dead code, aman
// dibiarin di script.js buat rollback gampang -- tinggal hapus
// section ini kalau mau balik ke alur lama).
// ============================================================
(function () {
    if (typeof window.pilihLigaUntukMulai !== "function") {
        console.warn("[ui_patches: pilih klub tab] window.pilihLigaUntukMulai belum ada -- cek urutan <script>.");
        return;
    }

    const LABEL_TAB_SINGKAT_PATCH = { LEN: "LIGA NASIONAL", MDL: "MDL / MAL", MPL: "MPL" };

    window.pilihTabLigaPatch = function (kodeLiga) {
        document.querySelectorAll(".liga-tab-patch").forEach(b => {
            b.classList.toggle("aktif", b.dataset.kode === kodeLiga);
        });

        let daftar = (typeof DAFTAR_LIGA_PILIHAN !== "undefined") ? DAFTAR_LIGA_PILIHAN : window.DAFTAR_LIGA_PILIHAN;
        let liga = daftar && daftar.find(l => l.kode === kodeLiga);
        let descEl = document.getElementById("ligaDescPatch");
        if (descEl && liga) descEl.textContent = liga.deskripsi;

        window.pilihLigaUntukMulai(kodeLiga); // logic asli: set ligaTerpilihSementara + render daftar klub ke #listTimPilihan
    };

    window.bukaPilihTim = function () {
        let daftar = (typeof DAFTAR_LIGA_PILIHAN !== "undefined") ? DAFTAR_LIGA_PILIHAN : window.DAFTAR_LIGA_PILIHAN;
        if (!daftar) return;

        let tabRow = document.getElementById("ligaTabRowPatch");
        if (tabRow) {
            tabRow.innerHTML = daftar.map((l, i) => `
                <button class="liga-tab-patch${i === 0 ? " aktif" : ""}" data-kode="${l.kode}" onclick="pilihTabLigaPatch('${l.kode}')">${LABEL_TAB_SINGKAT_PATCH[l.kode] || l.nama}</button>
            `).join("");
        }

        if (daftar.length) window.pilihTabLigaPatch(daftar[0].kode);

        let modal = document.getElementById("modalPilihTim");
        if (modal) modal.classList.remove("sembunyi");
    };
})();

// === SELESAI: PILIH KLUB (TAB LIGA, BUKAN 2 LANGKAH) ===
