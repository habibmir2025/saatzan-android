import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

window.saatzanExportFile = async function (content, filename) {
  const result = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8
  });
  await Share.share({
    title: 'گزارش ماهانه ساعت‌زن من',
    text: 'فایل CSV گزارش ماهانه را ذخیره کنید یا با Excel باز کنید.',
    url: result.uri,
    dialogTitle: 'ذخیره یا ارسال گزارش'
  });
};
