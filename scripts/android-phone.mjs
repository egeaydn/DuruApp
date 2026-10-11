import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Android telefonu USB ile bağla; USB hata ayıklamayı aç ve bilgisayarı telefonda yetkilendir.');
    console.log('npm.cmd run android:phone                 Kurulu geliştirme APK ile native test');
    console.log('npm.cmd run android:phone -- --web        Aynı kaydı telefon tarayıcısında aç');
    console.log('İsteğe bağlı: --serial <cihaz kimliği>. Emülatör hedeflenmez.');
    process.exit(0);
  }
  let serial, web = false;
  while (args.length) {
    const flag = args.shift();
    if (flag === '--web') web = true;
    else if (flag === '--serial' && args[0] && !args[0].startsWith('--')) serial = args.shift();
    else throw Error('Kullanım: android:phone -- [--web] [--serial <cihaz kimliği>]');
  }
  const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')].filter(Boolean);
  const sdk = candidates.find(folder => fs.existsSync(path.join(folder, 'platform-tools', 'adb.exe')));
  if (!sdk) throw Error('Android SDK bulunamadı; ANDROID_HOME ayarla.');
  const adb = path.join(sdk, 'platform-tools', 'adb.exe');
  const run = (...command) => execFileSync(adb, command, { encoding: 'utf8', timeout: 120000 });
  const physical = run('devices', '-l').split(/\r?\n/).map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length >= 2 && !parts[0].startsWith('emulator-') && ['device', 'unauthorized', 'offline'].includes(parts[1]));
  const devices = serial ? physical.filter(parts => parts[0] === serial) : physical;
  if (!devices.length) throw Error('Android telefon bağlı değil. USB kablosunu tak, USB hata ayıklamayı aç ve telefondaki bilgisayar iznini kabul et.');
  if (devices.length !== 1) throw Error('Birden fazla telefon var. --serial ile test edeceğin telefonu belirt.');
  const [deviceId, state] = devices[0];
  if (state !== 'device') throw Error(state === 'unauthorized' ? 'Telefondaki USB hata ayıklama iznini kabul et.' : 'Telefon offline; USB bağlantısını kontrol et.');
  const port = web ? 8084 : 8081;
  let response;
  try { response = await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(2000) }); }
  catch { throw Error(web ? 'Önce npm.cmd run web:audio çalıştır.' : 'Önce npm.cmd start çalıştır ve Metro terminalini açık tut.'); }
  if (!response.ok() || !(await response.text()).includes('packager-status:running')) throw Error('Seçilen portta Metro hazır değil.');
  const deviceRun = (...command) => run('-s', deviceId, ...command);
  if (!web && !deviceRun('shell', 'pm', 'path', 'app.duru.prototype').includes('package:')) {
    const supportedAbis = deviceRun('shell', 'getprop', 'ro.product.cpu.abilist').trim().split(',');
    const apkCandidates = ['native-test-results/apk/duru-phone-arm64-debug.apk', 'android/app/build/outputs/apk/debug/app-debug.apk'];
    // ZIP stores its library entry names uncompressed in the central directory.
    // Check ABI names before attempting to install an emulator-only APK.
    const apk = apkCandidates.map(file => path.resolve(file)).find(file => {
      if (!fs.existsSync(file)) return false;
      const archive = fs.readFileSync(file);
      return supportedAbis.some(abi => archive.includes(Buffer.from(`lib/${abi}/`)));
    });
    if (!apk) throw Error('Bu telefonun işlemcisine uygun APK yok. npm.cmd run android:build -- --device ile telefonu seçerek derle.');
    console.log('Duru geliştirme APK telefona kuruluyor…');
    const installation = deviceRun('install', '-r', apk);
    if (!installation.includes('Success')) throw Error('APK kurulumu tamamlanmadı.');
  }
  deviceRun('reverse', `tcp:${port}`, `tcp:${port}`);
  const url = web ? 'http://127.0.0.1:8084' : 'duru://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081';
  const launch = deviceRun('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', url, ...(web ? [] : ['app.duru.prototype']));
  if (!launch.includes('Status: ok')) throw Error('Ekran açılamadı; telefonu açıp yeniden dene.');
  console.log(web ? 'Telefon tarayıcısında Anlatıcı 1 web testi açıldı.' : 'Telefon geliştirme uygulaması aynı Anlatıcı 1 kaydına bağlandı.');
  console.log('USB kablosunu ve ilgili Metro terminalini açık tut. 1× seç; diğer oynatıcıları duraklat.');
} catch (error) {
  console.error(error.code ? 'ADB işlemi başarısız; kabloyu, telefon iznini ve APK uyumluluğunu kontrol et.' : error.message);
  process.exitCode = 1;
}
