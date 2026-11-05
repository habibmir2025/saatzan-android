import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import XLSX from 'xlsx-js-style';

function buildWorkbook(data) {
  const wb = XLSX.utils.book_new();
  for (const sheet of data.sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws['!cols'] = sheet.name === 'کارکرد روزانه'
      ? [{wch:16},{wch:14},{wch:14},{wch:17},{wch:17},{wch:16},{wch:16},{wch:13}]
      : [{wch:43},{wch:30}];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({r:R,c:C})];
        if (!cell) continue;
        cell.s = {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          font: { name: 'Tahoma', sz: 11, color: { rgb: '172554' } },
          border: {
            bottom: { style: 'thin', color: { rgb: 'D8E3F0' } },
            right: { style: 'thin', color: { rgb: 'D8E3F0' } }
          }
        };
        if (R === 0) cell.s = {
          fill: { fgColor: { rgb: '164E8A' } },
          font: { name: 'Tahoma', bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        };
        if (sheet.name === 'کارکرد روزانه' && R === range.e.r) cell.s = {
          fill: { fgColor: { rgb: 'DBEAFE' } },
          font: { name: 'Tahoma', bold: true, color: { rgb: '1E3A8A' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
        if (sheet.name === 'خلاصه ماه' && R > 0 && C === 1 && [2,4].includes(R)) cell.s = {
          fill: { fgColor: { rgb: R === 4 ? 'DCFCE7' : 'DBEAFE' } },
          font: { name: 'Tahoma', bold: true, color: { rgb: R === 4 ? '166534' : '1D4ED8' }, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }
    ws['!rows'] = sheet.rows.map((_,i)=>({hpt:i===0?28:22}));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}

window.saatzanCreateXlsx = buildWorkbook;
window.saatzanExportXlsx = async function(data) {
  const base64 = buildWorkbook(data);
  const filename = String(data.filename || 'saatzan.xlsx').replace(/[\\/:*?"<>|]/g, '_');
  const file = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
    recursive: true
  });
  if (!file || !file.uri) throw new Error('فایل اکسل در حافظه موقت ساخته نشد.');
  await Share.share({
    title: 'گزارش اکسل ساعت‌زن',
    text: 'گزارش کارکرد روزانه و خلاصه ماهانه',
    files: [file.uri],
    dialogTitle: 'ذخیره یا ارسال فایل اکسل'
  });
  return {uri:file.uri,filename};
};

// Persistent private backup in the app's data directory.
const AUTO_BACKUP_PATH = 'saatzan-auto-backup.json';
window.saatzanAutoBackup = async function(payload) {
  const data = JSON.stringify(payload);
  await Filesystem.writeFile({ path: AUTO_BACKUP_PATH, data, directory: Directory.Data, recursive: true });
  return true;
};
window.saatzanRestoreAutoBackup = async function() {
  try {
    const result = await Filesystem.readFile({ path: AUTO_BACKUP_PATH, directory: Directory.Data });
    const data = typeof result.data === 'string' ? result.data : '';
    const payload = JSON.parse(data);
    if (payload && payload.format === 'saatzan-backup' && Array.isArray(payload.records) && payload.settings && typeof payload.settings === 'object') return payload;
  } catch (e) {
    // No backup yet, or file is unavailable.
  }
  return null;
};
