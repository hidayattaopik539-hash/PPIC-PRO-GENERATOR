// =================================================================
// Data_Master.js
// Data Master Line/Shift (Asumsi C05001 dan PLANT K118)
// =================================================================
const MASTER_DATA_LINES = [
    // --- Data C05001 (3 Shift) ---
    { "PLANT": "K118", "KODE_LINE": "C05001", "GEDUNG": "GDC", "ORD_TYPE": "ZP13", "SHIFT": 1, "JAM_START": "060000", "JAM_END": "140000" },
    { "PLANT": "K118", "KODE_LINE": "C05001", "GEDUNG": "GDC", "ORD_TYPE": "ZP13", "SHIFT": 2, "JAM_START": "140000", "JAM_END": "220000" },
    { "PLANT": "K118", "KODE_LINE": "C05001", "GEDUNG": "GDC", "ORD_TYPE": "ZP13", "SHIFT": 3, "JAM_START": "220000", "JAM_END": "060000" },

    // --- Tambahkan Line Uji Coba A11005 (Dari Screenshot Anda, gunakan data dummy/asumsi) ---
    { "PLANT": "K118", "KODE_LINE": "A11005", "GEDUNG": "GDA", "ORD_TYPE": "ZP13", "SHIFT": 1, "JAM_START": "060000", "JAM_END": "140000" },
    { "PLANT": "K118", "KODE_LINE": "A11005", "GEDUNG": "GDA", "ORD_TYPE": "ZP13", "SHIFT": 2, "JAM_START": "140000", "JAM_END": "220000" },
    { "PLANT": "K118", "KODE_LINE": "A11005", "GEDUNG": "GDA", "ORD_TYPE": "ZP13", "SHIFT": 3, "JAM_START": "220000", "JAM_END": "060000" },

    // Tambahkan semua data Line/Shift lainnya dari spreadsheet Anda di sini
];

// Data Master SKU (Dibiarkan KOSONG/MINIMAL karena diinput DINAMIS, tapi harus ada untuk menghindari error)
const MASTER_DATA_SKU = {};