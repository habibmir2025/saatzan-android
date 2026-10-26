import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

const SETTINGS_KEY = 'saatzan_settings_v1';
const $ = id => document.getElementById(id);
const native = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
let promptRunning = false;
let authenticated = false;

function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  catch (_) { return {}; }
}
function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function showLock(message) {
  $('biometricLockMessage').textContent = message || 'برای ورود، اثر انگشت یا قفل صفحه گوشی را تأیید کنید.';
  $('biometricLock').style.display = 'flex';
  document.documentElement.classList.add('biometric-required');
}
function hideLock() {
  $('biometricLock').style.display = 'none';
  document.documentElement.classList.remove('biometric-required');
}
async function authenticate() {
  if (promptRunning) return false;
  promptRunning = true;
  showLock('برای ورود، اثر انگشت یا قفل صفحه گوشی را تأیید کنید.');
  try {
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable && !info.deviceIsSecure) {
      showLock('اثر انگشت در گوشی ثبت نشده یا قفل صفحه فعال نیست. ابتدا در تنظیمات گوشی اثر انگشت یا PIN را فعال کنید.');
      return false;
    }
    await BiometricAuth.authenticate({
      reason: 'برای باز کردن برنامه ساعت‌زن من تأیید هویت کنید.',
      allowDeviceCredential: true,
      androidTitle: 'ساعت‌زن من',
      androidSubtitle: 'برای ورود، اثر انگشت یا قفل صفحه را تأیید کنید',
      androidConfirmationRequired: false
    });
    authenticated = true;
    hideLock();
    return true;
  } catch (error) {
    const code = error && error.code;
    showLock(code === 'userCancel' ? 'برای استفاده از برنامه، احراز هویت را کامل کنید.' : 'تأیید انجام نشد. دوباره تلاش کنید یا قفل صفحه گوشی را بررسی کنید.');
    return false;
  } finally {
    promptRunning = false;
  }
}

window.saatzanConfigureBiometric = async enabled => {
  if (!native()) {
    alert('قفل اثر انگشت فقط در نسخه نصب‌شده اندروید کار می‌کند.');
    return false;
  }
  if (!enabled) {
    const current = readSettings();
    current.biometricEnabled = false;
    saveSettings(current);
    authenticated = true;
    hideLock();
    return true;
  }
  const info = await BiometricAuth.checkBiometry();
  if (!info.isAvailable && !info.deviceIsSecure) {
    alert('اثر انگشت یا قفل صفحه در گوشی فعال نیست. ابتدا آن را در تنظیمات گوشی فعال کنید.');
    return false;
  }
  const ok = await authenticate();
  if (!ok) return false;
  const current = readSettings();
  current.biometricEnabled = true;
  saveSettings(current);
  return true;
};

window.saatzanRetryBiometric = authenticate;
$('biometricRetry')?.addEventListener('click', authenticate);

(async function initBiometric() {
  const settings = readSettings();
  if (!native()) {
    hideLock();
    return;
  }
  if (settings.biometricEnabled) {
    showLock();
    await authenticate();
  } else {
    hideLock();
  }
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && readSettings().biometricEnabled) {
      authenticated = false;
      await authenticate();
    }
  });
})();
