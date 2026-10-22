// ==========================================
// META_DISPLAY_PATCH.JS
// ==========================================
// Nampilin meta musim yang lagi aktif di dashboard (di bawah Saldo),
// karena window.getMetaAktif() (dari match_engine.js) sebelumnya cuma
// didefinisikan tapi gak pernah dipanggil di UI mana pun.
// ==========================================

function _renderMetaAktifDashboard() {
    let el = getEl("dashMetaAktif");
    if (!el) return;
    if (typeof window.getMetaAktif !== "function") return;

    let meta = window.getMetaAktif();
    if (!meta) {
        el.innerText = "Meta musim belum aktif";
        return;
    }
    el.innerText = `Meta Musim: ${meta.nama}`;
}

if (typeof window.updateDashboard === "function") {
    let _updateDashboardAsli = window.updateDashboard;
    window.updateDashboard = function () {
        let hasil = _updateDashboardAsli.apply(this, arguments);
        _renderMetaAktifDashboard();
        return hasil;
    };
}
