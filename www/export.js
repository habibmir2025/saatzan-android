import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Native Android export: create a real CSV file and share it as an attachment.
// ShareOptions.files is required here; `url` shares a link/text URL, not a local file.
window.saatzanExportFile = async function (content, filename) {
  if (!content || typeof content !== 'string') {
    throw new Error('محتوای گزارش برای خروجی خالی یا نامعتبر است.');
  }

  const safeName = String(filename || 'gozaresh.csv').replace(/[\\/:*?"<>|]/g, '_');
  const result = await Filesystem.writeFile({
    path: safeName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  if (!result || !result.uri) {
    throw new Error('فایل CSV در حافظه موقت گوشی ساخته نشد.');
  }

  // On Android, pass the file URI in `files` so the Sharesheet receives an
  // actual attachment that can be saved to Downloads or opened in Excel.
  await Share.share({
    title: 'گزارش ماهانه ساعت‌زن من',
    text: 'گزارش ماهانه ساعت‌زن من (CSV)',
    files: [result.uri],
    dialogTitle: 'ذخیره یا ارسال گزارش ماهانه',
  });

  return { uri: result.uri, filename: safeName };
};
