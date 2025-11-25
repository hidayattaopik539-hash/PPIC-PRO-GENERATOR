// =================================================================
// GLOBALS & DATA MASTERS DINAMIS
// =================================================================
let productionOrders = []; 
let nextBatchNumber = 1;
let dynamicSkuMaster = []; // Array of {SKU, LINE_CODE, RPH, ALT, JK, QTY_PAGI, QTY_SIANG, QTY_MALAM, TOTAL_QTY}
let dynamicLineMaster = {}; 

const poTableBody = document.querySelector('#po-table tbody');
const generateCsvBtn = document.getElementById('generate-csv-btn');


// =================================================================
// FUNGSI 1A: LOAD MASTER SKU MAPPING (9 KOLOM) - TIDAK BERUBAH
// =================================================================
document.getElementById('loadSkuDataBtn').addEventListener('click', function() {
    const input = document.getElementById('skuMasterInput').value;
    const lines = input.trim().split('\n');
    dynamicSkuMaster = []; 
    const uniqueChecker = new Set(); 
    let errorCount = 0;
    let duplicateCount = 0;

    if (lines.length === 0 || input.trim() === "") {
        document.getElementById('skuLoadStatus').style.color = 'red';
        document.getElementById('skuLoadStatus').textContent = "❌ Gagal memuat. Masukkan data SKU Mapping.";
        return;
    }

    lines.forEach((line) => {
        const values = line.split(';'); 
        
        if (values.length < 9) {
            errorCount++;
            return; 
        }

        const skuCode = values[0].trim().toUpperCase();
        const lineCode = values[1].trim().toUpperCase();
        
        const uniqueKey = `${skuCode}-${lineCode}`;

        if (skuCode && lineCode) {
            if (uniqueChecker.has(uniqueKey)) {
                duplicateCount++;
                return; 
            }

            uniqueChecker.add(uniqueKey);

            dynamicSkuMaster.push({
                SKU: skuCode,
                LINE_CODE: lineCode, 
                ALT: values[2].trim(),
                RPH: values[3].trim(),
                JK: parseInt(values[4].trim()), 
                
                QTY_PAGI: parseFloat(values[5].trim().replace('.', '').replace(',', '.')), 
                QTY_SIANG: parseFloat(values[6].trim().replace('.', '').replace(',', '.')), 
                QTY_MALAM: parseFloat(values[7].trim().replace('.', '').replace(',', '.')), 
                TOTAL_QTY: parseFloat(values[8].trim().replace('.', '').replace(',', '.'))
            });
        } else {
            errorCount++;
        }
    });

    const count = dynamicSkuMaster.length;
    if (count > 0) {
        document.getElementById('skuLoadStatus').style.color = 'green';
        document.getElementById('skuLoadStatus').textContent = `✅ Berhasil memuat ${count} entri SKU. ${duplicateCount > 0 ? `(${duplicateCount} duplikasi SKU/LINE diabaikan)` : ''} ${errorCount > 0 ? `(${errorCount} baris error)` : ''}`;
    } else {
        document.getElementById('skuLoadStatus').style.color = 'red';
        document.getElementById('skuLoadStatus').textContent = "❌ Gagal memuat. Pastikan format input benar (9 kolom).";
    }
});


// =================================================================
// FUNGSI 1B: LOAD MASTER LINE/SHIFT/JAM KERJA (5 KOLOM) - TIDAK BERUBAH
// =================================================================
document.getElementById('loadLineDataBtn').addEventListener('click', function() {
    const input = document.getElementById('lineMasterInput').value;
    const lines = input.trim().split('\n');
    dynamicLineMaster = {};
    let errorCount = 0;

    if (lines.length === 0 || input.trim() === "") {
        document.getElementById('lineLoadStatus').style.color = 'red';
        document.getElementById('lineLoadStatus').textContent = "❌ Gagal memuat. Masukkan data Line/Shift.";
        return;
    }

    lines.forEach((line) => {
        const values = line.split(';'); 
        
        if (values.length < 5) {
            errorCount++;
            return; 
        }

        const lineCode = values[0].trim().toUpperCase();
        
        if (lineCode) {
            const lineData = {
                KODE_LINE: lineCode,
                GEDUNG: values[1].trim(),
                SHIFT: parseInt(values[2].trim()),
                JAM_START: values[3].trim(),
                JAM_END: values[4].trim()
            };
            
            if (!dynamicLineMaster[lineCode]) {
                dynamicLineMaster[lineCode] = [];
            }
            dynamicLineMaster[lineCode].push(lineData);
        }
    });

    const count = Object.keys(dynamicLineMaster).length;
    let totalShifts = 0;
    Object.values(dynamicLineMaster).forEach(arr => totalShifts += arr.length);

    if (count > 0) {
        document.getElementById('lineLoadStatus').style.color = 'green';
        document.getElementById('lineLoadStatus').textContent = `✅ Berhasil memuat ${totalShifts} shift dari ${count} Line.`;
    } else {
        document.getElementById('lineLoadStatus').style.color = 'red';
        document.getElementById('lineLoadStatus').textContent = "❌ Gagal memuat. Pastikan format input benar.";
    }
});


// =================================================================
// FUNGSI UTILITY: GET QTY BERDASARKAN SHIFT - TIDAK BERUBAH
// =================================================================
function getQtyForShift(shiftNumber, skuProps) {
    if (shiftNumber === 1) return skuProps.QTY_PAGI;
    if (shiftNumber === 2) return skuProps.QTY_SIANG;
    if (shiftNumber === 3) return skuProps.QTY_MALAM;
    return 0; 
}


// =================================================================
// FUNGSI 2: GENERATE ALL PRODUCTION ORDER - TIDAK BERUBAH
// =================================================================
document.getElementById('generateAllBtn').addEventListener('click', function() {
    const startDate = document.getElementById('startDate').value.trim();
    const plantCode = document.getElementById('plantCode').value.trim().toUpperCase();
    const orderType = document.getElementById('orderType').value.trim().toUpperCase();
    
    productionOrders = []; 
    nextBatchNumber = 1;   

    // 1. VALIDASI MASTER DATA
    if (dynamicSkuMaster.length === 0) {
        alert("ERROR: Data Master SKU Mapping belum dimuat.");
        return;
    }
    if (Object.keys(dynamicLineMaster).length === 0) {
        alert("ERROR: Data Master Line/Shift belum dimuat.");
        return;
    }
    if (!startDate || startDate.length !== 8) {
        alert("ERROR: Masukkan Tanggal Produksi (YYYYMMDD) yang valid.");
        return;
    }
    if (!plantCode || !orderType) {
        alert("ERROR: Isi KODE PLANT dan ORDER TYPE.");
        return;
    }

    // 2. ITERASI SEMUA ENTRY DI ARRAY SKU MASTER
    dynamicSkuMaster.forEach(skuProperties => {
        const skuCode = skuProperties.SKU;
        const lineCodeToUse = skuProperties.LINE_CODE; 
        
        const relevantLines = dynamicLineMaster[lineCodeToUse];

        if (!relevantLines || relevantLines.length === 0) {
             console.warn(`WARNING: KODE LINE ${lineCodeToUse} (dari SKU ${skuCode}) tidak ditemukan di Master Line yang dimuat. Melewati entri ini.`);
             return; 
        }
        
        const currentBatchNumber = nextBatchNumber; 
        let isBatchUsed = false;

        // 3. GENERATE BARIS PO PER SHIFT
        relevantLines.forEach((masterData) => {
            
            const currentQty = getQtyForShift(masterData.SHIFT, skuProperties);

            if (currentQty > 0) { 
                isBatchUsed = true;
                const newPO = {
                    NO: currentBatchNumber,
                    PLANT: plantCode, 
                    SKU: skuCode,
                    TYPE: orderType, 
                    TGL_1: startDate,
                    TGL_2: startDate,
                    RPH: skuProperties.RPH,
                    ALT: skuProperties.ALT,
                    LINE: masterData.KODE_LINE,
                    GEDUNG: masterData.GEDUNG, 
                    KEPERLUAN: '', 
                    SHIFT: masterData.SHIFT,
                    QTY: currentQty, 
                    JAM_1: masterData.JAM_START, 
                    JAM_2: masterData.JAM_END,
                    JK: skuProperties.JK, 
                    SPEED: 60, 
                    "LIMIT/UNLIMIT": skuProperties.ALT === '0000' ? 'X' : '' 
                };
                
                productionOrders.push(newPO);
            }
        });

        if (isBatchUsed) {
            nextBatchNumber++; 
        }
    });

    if (productionOrders.length > 0) {
        updateTable(); 
        alert(`Berhasil membuat ${productionOrders.length} baris Production Order dari ${nextBatchNumber - 1} entri SKU.`);
    } else {
        alert("Tidak ada Production Order yang dibuat. Periksa kembali format data input Anda.");
    }
});


// =================================================================
// FUNGSI 3: UPDATE TABEL (TAMPILAN) - DITAMBAH LOGIKA SPASI BARIS
// =================================================================
function updateTable() {
    poTableBody.innerHTML = ''; 
    const nf = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    let lastBatchNumber = 0; // Inisialisasi nomor batch terakhir

    productionOrders.forEach((po, index) => {
        
        // <<< LOGIKA BARU: TAMBAH BARIS KOSONG JIKA BATCH BERGANTI >>>
        if (po.NO !== lastBatchNumber && lastBatchNumber !== 0) {
            const emptyRow = poTableBody.insertRow();
            emptyRow.style.height = '10px'; // Memberi sedikit tinggi visual
            // Sisipkan sel kosong untuk menjaga struktur
            for (let i = 0; i < 18; i++) { 
                emptyRow.insertCell();
            }
        }
        // <<< END LOGIKA BARU >>>

        const row = poTableBody.insertRow();
        
        const keyMap = [
            { key: 'NO', editable: false, len: 4 }, 
            { key: 'PLANT', editable: true, len: 5 },
            { key: 'SKU', editable: true, len: 12 },
            { key: 'TYPE', editable: true, len: 4 },
            { key: 'TGL_1', editable: true, len: 8 }, 
            { key: 'TGL_2', editable: true, len: 8 }, 
            { key: 'RPH', editable: true, len: 8 },
            { key: 'ALT', editable: true, len: 6 },
            { key: 'LINE', editable: true, len: 10 },
            { key: 'GEDUNG', editable: true, len: 6 },
            { key: 'KEPERLUAN', editable: true, len: 10 }, 
            { key: 'SHIFT', editable: true, len: 2 },
            { key: 'QTY', editable: true, len: 8, format: true }, 
            { key: 'JAM_1', editable: true, len: 6 }, 
            { key: 'JAM_2', editable: true, len: 6 }, 
            { key: 'JK', editable: true, len: 2 },
            { key: 'SPEED', editable: true, len: 4 },
            { key: 'LIMIT/UNLIMIT', editable: true, len: 1 }
        ];

        keyMap.forEach(item => {
            const cell = row.insertCell();
            let value = po[item.key];
            
            if (item.format) {
                value = nf.format(value);
            }

            if (item.editable) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value !== undefined ? value : ''; 
                input.name = item.key; 
                input.maxLength = item.len;
                input.setAttribute('data-col', item.key);
                cell.appendChild(input);
            } else {
                cell.textContent = value;
                cell.style.textAlign = 'center';
            }
        });

        // Perbarui nomor batch terakhir
        lastBatchNumber = po.NO;
    });
}


// =================================================================
// FUNGSI 4: GENERATE CSV (MEMBACA DATA DARI INPUT FIELD DI TABEL) - TIDAK BERUBAH
// =================================================================
generateCsvBtn.addEventListener('click', function() {
    const rows = poTableBody.querySelectorAll('tr');

    if (rows.length === 0) {
        alert("Tidak ada data untuk diunduh. Silakan generate Production Order terlebih dahulu.");
        return;
    }

    // Ambil data dari tabel yang sudah diedit
    const editedPOs = [];
    rows.forEach(row => {
        // Abaikan baris kosong yang merupakan pemisah
        if (row.style.height === '10px') {
            return;
        }

        const rowData = {};
        const allCells = row.querySelectorAll('td'); 
        
        const headerKeys = [
            'NO', 'PLANT', 'SKU', 'TYPE', 'TGL_1', 'TGL_2', 'RPH', 'ALT', 'LINE', 
            'GEDUNG', 'KEPERLUAN', 'SHIFT', 'QTY', 'JAM_1', 'JAM_2', 'JK', 'SPEED', 'LIMIT/UNLIMIT'
        ];
        
        allCells.forEach((cell, index) => {
            const key = headerKeys[index];
            let value;
            const inputElement = cell.querySelector('input');

            if (inputElement) {
                value = inputElement.value;
            } else {
                value = cell.textContent;
            }
            
            rowData[key] = value;
        });
        
        editedPOs.push(rowData);
    });
    

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `PO_Upload_PPIC_${today}.csv`;
    
    // Header CSV (sesuai format SAP, tanpa kolom KEPERLUAN)
    const headers = "PLANT;SKU;TYPE;TGL_START;TGL_END;RPH;ALT;LINE;GEDUNG;SHIFT;QTY;JAM_START;JAM_END;JK;SPEED;LIMIT/UNLIMIT"; 
    
    const csvRows = editedPOs.map(po => {
        const rowData = [];
        
        rowData.push(po.PLANT);
        rowData.push(po.SKU);
        rowData.push(po.TYPE); 
        rowData.push(po.TGL_1); 
        rowData.push(po.TGL_2); 
        
        // RPH: Format untuk SAP (titik sebagai desimal)
        let rphValue = po.RPH.replace(/\./g, '').replace(/,/g, '.'); 
        rowData.push(rphValue);

        rowData.push(po.ALT);
        rowData.push(po.LINE);
        rowData.push(po.GEDUNG);
        // KOLOM KEPERLUAN DILEWATI DI SINI (TIDAK MASUK CSV)
        rowData.push(po.SHIFT);
        
        // QTY: Format untuk SAP (titik sebagai desimal)
        let qtyValue = po.QTY.replace(/\./g, '').replace(/,/g, '.'); 
        rowData.push(qtyValue); 

        rowData.push(po.JAM_1); 
        rowData.push(po.JAM_2); 

        rowData.push(po.JK);
        rowData.push(po.SPEED);
        rowData.push(po["LIMIT/UNLIMIT"]);

        return rowData.join(';');
    });

    const csvContent = headers + "\n" + csvRows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    alert(`File CSV ${filename} berhasil diunduh!`);
});