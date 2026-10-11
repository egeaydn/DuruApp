// Local diagnostics only: never calls TTS or changes installed recordings.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readWave, makeWave, joinWaves } from './lib/wave.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const db = value => value ? Number((20 * Math.log10(value)).toFixed(2)) : null;
function measure(wave) {
  const channels = wave.fmt.readUInt16LE(2), sampleRate = wave.fmt.readUInt32LE(4);
  let peak = 0, clippedSamples = 0, maxJump = 0, jumpFrame = 0;
  for (let offset = 0; offset < wave.data.length; offset += 2) {
    const sample = wave.data.readInt16LE(offset);
    peak = Math.max(peak, Math.abs(sample));
    if (sample === -32768 || sample === 32767) clippedSamples++;
    if (offset >= channels * 2) {
      const jump = Math.abs(sample - wave.data.readInt16LE(offset - channels * 2));
      if (jump > maxJump) { maxJump = jump; jumpFrame = Math.floor(offset / (channels * 2)); }
    }
  }
  return { sampleRate, channels, frames: wave.data.length / (channels * 2), duration: wave.duration,
    peakDbfs: db(peak / 32768), rmsDbfs: db(wave.rms / 32768), clippedSamples,
    maxAdjacentJump: maxJump / 32768, jumpAt: jumpFrame / sampleRate };
}
try {
  const story = JSON.parse(fs.readFileSync('content/story.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('assets/audio/elevenlabs-manifest.json', 'utf8'));
  const track = manifest.profiles['eleven-1'];
  if (manifest.bookId !== story.id || manifest.textVersion !== story.textVersion) throw Error('Metin sürümü eşleşmiyor.');
  const paragraphs = story.paragraphs.map(paragraph => {
    const item = track.paragraphs.find(p => p.id === paragraph.id);
    if (!item) throw Error('Paragraf manifesti eksik.');
    const sourceFile = path.join('generated-audio', 'eleven-1', story.id, story.textVersion, `${paragraph.id}.wav`);
    const original = fs.readFileSync(sourceFile), installed = fs.readFileSync(path.join('assets/audio', item.file));
    const metadata = JSON.parse(fs.readFileSync(`${sourceFile}.json`, 'utf8'));
    if (hash(original) !== metadata.audioHash || hash(installed) !== item.sha256 ||
      (item.sourceSha256 && hash(original) !== item.sourceSha256) || metadata.identity?.voiceId !== track.voiceId ||
      metadata.identity?.paragraphId !== paragraph.id || metadata.identity?.text !== paragraph.text) throw Error('Kaynak kimliği veya hash eşleşmiyor.');
    const raw = readWave(original), clean = readWave(installed);
    if (!raw.fmt.equals(clean.fmt) || raw.data.length !== clean.data.length || Math.abs(clean.duration - item.duration) > 1e-6) throw Error('Örnekleme/süre eşleşmiyor.');
    return { id: paragraph.id, original, installed, raw, clean, rawStats: measure(raw), cleanStats: measure(clean) };
  });
  const installedBook = fs.readFileSync('assets/audio/eleven-1.wav');
  if (hash(installedBook) !== track.sha256 || !installedBook.equals(joinWaves(paragraphs.map(p => p.installed)))) throw Error('Birleşik oynatma kaydı doğrulanamadı.');
  let elapsed = 0;
  for (const paragraph of paragraphs) {
    const item = track.paragraphs.find(p => p.id === paragraph.id);
    if (Math.abs(item.start - elapsed) > 1e-6) throw Error('Paragraf başlangıcı eşleşmiyor.');
    elapsed += paragraph.clean.duration;
  }
  const output = 'native-test-results/audio-focus';
  fs.mkdirSync(output, { recursive: true });
  const previews = [];
  function preview(paragraph, label, requestedStart = 0) {
    const { sampleRate, channels } = paragraph.rawStats;
    const start = Math.floor(Math.max(0, Math.min(requestedStart, paragraph.raw.duration - 8)) * sampleRate);
    const end = Math.min(start + 8 * sampleRate, paragraph.rawStats.frames);
    const files = {};
    for (const [name, wave] of [['raw', paragraph.raw], ['clean', paragraph.clean]]) {
      const file = path.join(output, `${label}-${name}.wav`);
      fs.writeFileSync(file, makeWave(wave.data.subarray(start * channels * 2, end * channels * 2), sampleRate, channels));
      files[name] = file;
    }
    previews.push({ paragraphId: paragraph.id, start: start / sampleRate, duration: (end - start) / sampleRate, files });
  }
  preview(paragraphs[0], 'intro');
  const candidate = paragraphs.reduce((a, b) => a.rawStats.maxAdjacentJump >= b.rawStats.maxAdjacentJump ? a : b);
  preview(candidate, `transition-${candidate.id}`, candidate.rawStats.jumpAt - 3);
  const report = { narratorId: 'eleven-1', textVersion: story.textVersion, duration: elapsed, processing: track.processing ?? null,
    limitation: 'Sayısal ölçüm cızırtı veya doğal anlatım kalitesi kanıtı değildir. En büyük örnek farkı normal konuşmadan da kaynaklanabilir. Dosyalar dinlenmelidir.',
    paragraphs: paragraphs.map(p => ({ id: p.id, raw: p.rawStats, clean: p.cleanStats })), previews };
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Anlatıcı 1: ${paragraphs.length} paragraf, ${elapsed.toFixed(3)} sn. Ham/temiz örnekleme ve paragraf süreleri eşleşiyor.`);
  console.log(`Tam ölçeğe dayanan örnekler: ham ${paragraphs.reduce((n, p) => n + p.rawStats.clippedSamples, 0)}, temiz ${paragraphs.reduce((n, p) => n + p.cleanStats.clippedSamples, 0)}.`);
  for (const p of previews) console.log(`${p.paragraphId} / ${p.start.toFixed(3)} sn: ${p.files.raw} ve ${p.files.clean}`);
  console.log('Tanı: native-test-results/audio-focus/report.json. Mevcut sesler değiştirilmedi; API isteği yapılmadı.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
