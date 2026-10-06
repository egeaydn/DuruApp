import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { cleanWave } from '../scripts/lib/audio-clean.mjs';
import { makeWave, readWave, joinWaves } from '../scripts/lib/wave.mjs';
import { identityFor, sha256 } from '../scripts/lib/elevenlabs.mjs';

const tone = () => {
  const data = Buffer.alloc(24000);
  for (let i = 0; i < 12000; i++) data.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 220 / 24000) * 3000), i * 2);
  data.writeInt16LE(30000, 6000 * 2);
  return makeWave(data);
};
test('Yerel temizleme dürtü gürültüsünü azaltır, örnekleme ve süreyi korur', () => {
  const source = readWave(tone()), result = readWave(cleanWave(tone()));
  assert.equal(result.data.length, source.data.length);
  assert.equal(result.duration, source.duration);
  assert.equal(result.fmt.readUInt32LE(4), 24000);
  assert.equal(result.fmt.readUInt16LE(2), 1);
  let peak = 0;
  for (let i = 0; i < result.data.length; i += 2) peak = Math.max(peak, Math.abs(result.data.readInt16LE(i)));
  assert.ok(peak < 15000, `Dürtü kalmış: ${peak}`);
});

test('Kurulum ham üretimi korur, önbelleği kullanır, hash ve review kayıtlarını eşler; geri dönüş eksiksizdir', () => {
  const workspace = fileURLToPath(new URL('../', import.meta.url));
  const outputRoot = path.join(workspace, 'native-test-results');
  fs.mkdirSync(outputRoot, { recursive: true });
  const folder = fs.mkdtempSync(path.join(outputRoot, 'clean-test-'));
  const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value));
  try {
    const story = { id: 'fixture', textVersion: '1', paragraphs: [{ id: 'p01', text: 'İlk cümle.' }, { id: 'p02', text: 'İkinci cümle.' }] };
    const narrator = { id: 'eleven-1', voiceId: 'fixture-voice', modelId: 'eleven_multilingual_v2', stage: 'preview' };
    const rawFolder = path.join(folder, 'generated-audio/eleven-1/fixture/1');
    const assetFolder = path.join(folder, 'assets/audio/eleven-1');
    fs.mkdirSync(rawFolder, { recursive: true }); fs.mkdirSync(assetFolder, { recursive: true }); fs.mkdirSync(path.join(folder, 'content'));
    const original = tone();
    const paragraphs = story.paragraphs.map((p, i) => {
      const raw = path.join(rawFolder, `${p.id}.wav`);
      fs.writeFileSync(raw, original); fs.writeFileSync(path.join(assetFolder, `${p.id}.wav`), original);
      writeJson(`${raw}.json`, { identity: identityFor(story, narrator, i), audioHash: sha256(original) });
      return { id: p.id, start: i * .5, duration: .5, file: `eleven-1/${p.id}.wav`, sha256: sha256(original) };
    });
    const full = joinWaves([original, original]);
    fs.writeFileSync(path.join(folder, 'assets/audio/eleven-1.wav'), full);
    writeJson(path.join(folder, 'content/story.json'), story);
    const manifestFile = path.join(folder, 'assets/audio/elevenlabs-manifest.json');
    writeJson(manifestFile, { bookId: story.id, textVersion: story.textVersion, narrators: [narrator], profiles: { 'eleven-1': { duration: 1, voiceId: narrator.voiceId, modelId: narrator.modelId, sha256: sha256(full), paragraphs } } });
    writeJson(path.join(assetFolder, 'rights-and-review.json'), { commercialUseVerified: false, paragraphs: {} });
    const run = mode => execFileSync(process.execPath, [path.join(workspace, 'scripts/clean-audio.mjs'), mode, '--narrator', 'eleven-1'], { cwd: folder, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    run('install');
    const track = JSON.parse(fs.readFileSync(manifestFile)).profiles['eleven-1'];
    assert.equal(track.duration, 1);
    assert.deepEqual(track.paragraphs.map(p => p.start), [0, .5]);
    assert.equal(sha256(fs.readFileSync(path.join(rawFolder, 'p01.wav'))), sha256(original));
    assert.notEqual(track.paragraphs[0].sha256, sha256(original));
    assert.equal(track.sha256, sha256(fs.readFileSync(path.join(folder, 'assets/audio/eleven-1.wav'))));
    const review = JSON.parse(fs.readFileSync(path.join(assetFolder, 'rights-and-review.json')));
    assert.equal(review.commercialUseVerified, false);
    assert.equal(review.paragraphs.p01.audioHash, track.paragraphs[0].sha256);
    assert.equal(review.paragraphs.p01.accepted, false);
    const cacheRoot = path.join(folder, 'generated-audio/processed/eleven-1/fixture/1');
    const cacheFile = fs.readdirSync(cacheRoot).map(id => path.join(cacheRoot, id, 'p01.wav')).find(file => fs.existsSync(file));
    const cacheTime = fs.statSync(cacheFile).mtimeMs;
    run('install');
    assert.equal(fs.statSync(cacheFile).mtimeMs, cacheTime);
    assert.equal(JSON.parse(fs.readFileSync(manifestFile)).profiles['eleven-1'].sha256, track.sha256);
    run('restore');
    assert.deepEqual(fs.readFileSync(path.join(assetFolder, 'p01.wav')), original);
    assert.deepEqual(fs.readFileSync(path.join(folder, 'assets/audio/eleven-1.wav')), full);
    assert.equal(JSON.parse(fs.readFileSync(manifestFile)).profiles['eleven-1'].processing, undefined);
    const beforeFailure = fs.readFileSync(manifestFile);
    writeJson(path.join(rawFolder, 'p02.wav.json'), { identity: identityFor(story, narrator, 1), audioHash: 'invalid' });
    assert.throws(() => run('install'));
    assert.deepEqual(fs.readFileSync(manifestFile), beforeFailure);
    assert.deepEqual(fs.readFileSync(path.join(assetFolder, 'p01.wav')), original);
  } finally {
    const relative = path.relative(outputRoot, folder);
    if (!relative.startsWith('..') && !path.isAbsolute(relative) && relative.startsWith('clean-test-')) fs.rmSync(folder, { recursive: true, force: true });
  }
});
