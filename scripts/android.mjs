import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const windows = process.platform === 'win32';
const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
  windows && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  !windows && process.env.HOME && path.join(process.env.HOME, process.platform === 'darwin' ? 'Library/Android/sdk' : 'Android/Sdk')].filter(Boolean);
const sdk = candidates.find(p => fs.existsSync(path.join(p, 'platform-tools', windows ? 'adb.exe' : 'adb')));
if (!sdk) {
  console.error('Android SDK bulunamadı. Android Studio → SDK Manager içindeki SDK konumunu ANDROID_HOME ile belirt.');
  process.exit(1);
}
const javaCandidates = [process.env.JAVA_HOME, windows && path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr')].filter(Boolean);
const javaHome = javaCandidates.find(p => fs.existsSync(path.join(p, 'bin', windows ? 'java.exe' : 'java')));
const env = { ...process.env, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk };
env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --dns-result-order=ipv4first`.trim();
if (javaHome) env.JAVA_HOME = javaHome;
env.PATH = [path.join(sdk, 'platform-tools'), path.join(sdk, 'emulator'), javaHome && path.join(javaHome, 'bin'), path.dirname(process.execPath), process.env.PATH].filter(Boolean).join(path.delimiter);
console.log(`Duru Android SDK: ${sdk}`);
console.log(`Duru Java: ${javaHome || 'PATH üzerindeki Java'}`);
const args = process.argv.slice(2);
// Expo's --no-bundler mode uses its standard 8081 port. Start a private
// Metro explicitly, so the native CLI never opens a second LAN server.
const noBundler = args.includes('--no-bundler');
if (args.includes('--port') || args.includes('-p') || args.some(arg => arg.startsWith('--port='))) {
  console.error('Bu yerel Android komutu standart 8081 Metro portunu kullanır; --port vermene gerek yok.');
  process.exit(1);
}
let metro;
if (!noBundler) {
  const port = '8081';
  async function metroReady() {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(1500) });
      return response.ok && (await response.text()).includes('packager-status:running');
    } catch { return false; }
  }
  if (!await metroReady()) {
    metro = spawn(process.execPath, ['node_modules/expo/bin/cli', 'start', '--port', port, '--localhost'], { env, stdio: 'inherit' });
    let ready = false;
    for (let attempt = 0; attempt < 90 && metro.exitCode === null; attempt++) {
      if (await metroReady()) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready) { metro.kill(); console.error('Yerel Metro başlatılamadı. Port kullanımını kontrol et.'); process.exit(1); }
  }
  console.log(`Metro localhost: http://127.0.0.1:${port}`);
  args.push('--no-bundler');
}
const child = spawn(process.execPath, ['node_modules/expo/bin/cli', 'run:android', ...args], { env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; if (code && metro) metro.kill(); });
process.on('SIGINT', () => { child.kill(); metro?.kill(); process.exit(130); });
