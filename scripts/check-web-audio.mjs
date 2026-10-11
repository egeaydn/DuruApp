// Verify the actual development page plays exactly the installed AI recording.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(fs.readFileSync('assets/audio/elevenlabs-manifest.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let page;
try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__duruAudio = [];
    const NativeAudio = window.Audio;
    window.Audio = new Proxy(NativeAudio, { construct(target, args) {
      const audio = Reflect.construct(target, args); window.__duruAudio.push(audio); return audio;
    } });
  });
  page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8084', { timeout: 90000 });
  await page.getByText('Dünya biraz bekleyebilir.').waitFor({ timeout: 60000 });
  console.log('Web katalog yüklendi.');
  assert.equal(await page.getByRole('button', { name: 'Ses değiştir', exact: true }).count(), 0);
  await page.getByLabel('Kıyıdaki Işık kitap ayrıntısını aç').click();
  await page.waitForFunction(() => window.__duruAudio.some(a => a.src.includes('eleven-1') && a.readyState >= 2), undefined, { polling: 100, timeout: 30000 });
  console.log('Anlatıcı 1 ses dosyası hazır.');
  await page.getByRole('button', { name: 'Dinlemeye başla', exact: true }).click();
  await page.waitForFunction(() => window.__duruAudio.some(a => !a.paused && a.currentTime > 1), undefined, { polling: 100, timeout: 30000 });
  await page.evaluate(() => { window.__duruCurrentAudio = window.__duruAudio.find(a => !a.paused && a.currentTime > 1); });
  console.log('Gerçek oynatma ilerledi.');
  await page.getByRole('button', { name: 'Duraklat', exact: true }).first().click();
  await page.waitForFunction(() => window.__duruCurrentAudio.paused, undefined, { polling: 100, timeout: 10000 });
  const media = await page.evaluate(() => {
    const audio = window.__duruCurrentAudio;
    return { url: audio.src, duration: audio.duration, rate: audio.playbackRate, position: audio.currentTime,
      saved: JSON.parse(localStorage.getItem('duru.listening.v1') || '{}') };
  });
  const response = await context.request.get(media.url);
  assert.equal(response.ok(), true);
  const hash = createHash('sha256').update(await response.body()).digest('hex');
  assert.equal(hash, manifest.profiles['eleven-1'].sha256);
  assert.equal(media.saved.profile, 'eleven-1');
  assert.equal(media.rate, 1);
  assert.ok(Math.abs(media.duration - manifest.profiles['eleven-1'].duration) < .01);
  assert.deepEqual(errors, []);
  fs.mkdirSync('web-test-results', { recursive: true });
  fs.writeFileSync('web-test-results/ai-audio.json', JSON.stringify({ ...media, hash, qualityAccepted: false }, null, 2) + '\n');
  console.log('Web Anlatıcı 1 kontrolü geçti: emülatörle aynı WAV hash, 1×, gerçek oynatma ve duraklatma. İnsan dinleme değerlendirmesi bekleniyor.');
} catch (error) {
  if (page) console.error(await page.evaluate(() => ({ audio: window.__duruAudio?.map(a => ({ paused: a.paused, time: a.currentTime, ready: a.readyState, error: a.error?.message })), text: document.body.innerText.slice(-1500) })));
  throw error;
} finally { await browser.close(); }
