// ==========================================================================
// CUSTOM SELECT PATCH
// Pengganti tampilan native <select> (yang di Android muncul sebagai picker
// putih bawaan OS, gak konsisten sama tema gelap game) dengan dropdown
// custom yang stylenya senada sama modal-box lain di game.
//
// <select> aslinya TETAP ADA di DOM (cuma disembunyikan pakai CSS), jadi
// semua kode existing yang baca `.value` atau listen event "change" gak
// perlu diubah sama sekali. Tinggal:
//   1) Tambahin class="custom-select" ke <select> yang mau diubah tampilannya
//   2) Panggil window.initCustomSelects() sekali setelah HTML select itu
//      di-render ke DOM (misal langsung setelah bukaModal(...))
// ==========================================================================
(function () {

    function closeAllDropdowns() {
        document.querySelectorAll(".cs-dropdown").forEach(dd => dd.remove());
        document.querySelectorAll(".cs-trigger.open").forEach(t => t.classList.remove("open"));
    }

    function positionDropdown(dd, trigger) {
        let rect = trigger.getBoundingClientRect();
        dd.style.left = rect.left + "px";
        dd.style.width = rect.width + "px";
        dd.style.top = (rect.bottom + 4) + "px";

        // Kalau ternyata gak muat ke bawah (deket tepi bawah layar) dan
        // ruang di atas trigger lebih lega, buka ke atas aja.
        let ddHeight = dd.offsetHeight;
        let spaceBelow = window.innerHeight - rect.bottom;
        let spaceAbove = rect.top;
        if (spaceBelow < ddHeight && spaceAbove > spaceBelow) {
            dd.style.top = (rect.top - ddHeight - 4) + "px";
        }
    }

    function openDropdown(select, trigger) {
        closeAllDropdowns();
        trigger.classList.add("open");

        let dd = document.createElement("div");
        dd.className = "cs-dropdown";

        Array.from(select.options).forEach((opt, idx) => {
            let item = document.createElement("div");
            item.className = "cs-option" + (idx === select.selectedIndex ? " selected" : "");
            item.textContent = opt.textContent;
            item.addEventListener("click", function (e) {
                e.stopPropagation();
                if (select.selectedIndex !== idx) {
                    select.selectedIndex = idx;
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                }
                trigger.querySelector(".cs-label").textContent = opt.textContent;
                closeAllDropdowns();
            });
            dd.appendChild(item);
        });

        document.body.appendChild(dd);
        positionDropdown(dd, trigger);
    }

    function buildOne(select) {
        if (select.dataset.csInit === "1") return;
        select.dataset.csInit = "1";

        let wrap = document.createElement("div");
        wrap.className = "custom-select-wrap";
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);

        let trigger = document.createElement("div");
        trigger.className = "cs-trigger";
        let selectedOpt = select.options[select.selectedIndex];
        trigger.innerHTML = `<span class="cs-label">${selectedOpt ? selectedOpt.textContent : ""}</span><span class="cs-arrow"></span>`;
        wrap.appendChild(trigger);

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            let isOpen = trigger.classList.contains("open");
            closeAllDropdowns();
            if (!isOpen) openDropdown(select, trigger);
        });
    }

    document.addEventListener("click", closeAllDropdowns);
    // Cuma tutup dropdown kalau yang di-scroll itu HALAMAN/modal di belakangnya,
    // bukan isi dropdown itu sendiri -- sebelumnya listener ini nangkep semua
    // event scroll (termasuk scroll di dalam .cs-dropdown pas listnya kepanjangan),
    // jadi dropdown langsung nutup sendiri begitu disentuh & opsi paling bawah
    // (misal "Figur Pemain") gak pernah kejangkau.
    window.addEventListener("scroll", function (e) {
        if (e.target && e.target.nodeType === 1 && e.target.closest(".cs-dropdown")) return;
        closeAllDropdowns();
    }, true);
    window.addEventListener("resize", closeAllDropdowns);

    // Nutup dropdown yang ke-mount di <body> tiap kali modal ditutup, biar
    // gak nyangkut nampang setelah modal-nya udah hilang.
    if (typeof window.tutupModal === "function") {
        let _origTutupModal = window.tutupModal;
        window.tutupModal = function () {
            closeAllDropdowns();
            return _origTutupModal.apply(this, arguments);
        };
    }

    window.initCustomSelects = function (root) {
        (root || document).querySelectorAll("select.custom-select").forEach(buildOne);
    };
})();
