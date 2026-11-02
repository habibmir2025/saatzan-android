import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Native Android export: create a real CSV file and share it as an attachment.
// ShareOptions.files is required here; `url` shares a link/text URL, not a local file.
window.saatzanExportFile = async function (content, filename, category = 'report') {
  if (!content || typeof content !== 'string') {
    throw new Error('محتوای گزارش برای خروجی خالی یا نامعتبر است.');
  }

  const safeName = String(filename || 'gozaresh.csv').replace(/[\\/:*?"<>|]/g, '_');
  let result;
  if (category === 'backup') {
    // A dedicated persistent folder for backups, not the temporary cache.
    const folder = 'Saatzan/Backup';
    await Filesystem.mkdir({ path: folder, directory: Directory.Documents, recursive: true });
    result = await Filesystem.writeFile({
      path: `${folder}/${safeName}`,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  } else {
    result = await Filesystem.writeFile({
      path: safeName,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
  }

  if (!result || !result.uri) {
    throw new Error('فایل CSV در حافظه موقت گوشی ساخته نشد.');
  }

  // On Android, pass the file URI in `files` so the Sharesheet receives an
  // actual attachment that can be saved to Downloads or opened in Excel.
  await Share.share({
    title: category === 'backup' ? 'پشتیبان ساعت‌زن' : 'گزارش ساعت‌زن',
    text: category === 'backup' ? 'فایل پشتیبان سوابق و تنظیمات ساعت‌زن' : 'گزارش ماهانه ساعت‌زن',
    files: [result.uri],
    dialogTitle: category === 'backup' ? 'ذخیره یا ارسال فایل پشتیبان' : 'ذخیره یا ارسال گزارش',
  });

  return { uri: result.uri, filename: safeName };
};
