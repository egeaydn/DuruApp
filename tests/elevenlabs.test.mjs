import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { apiRequest, cached, identityFor, sha256, supportedVoice, lookupVoice } from '../scripts/lib/elevenlabs.mjs';
import { makeWave, readWave, joinWaves } from '../scripts/lib/wave.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const tone = () => {
  const pcm = Buffer.alloc(24000);
  for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(Math.sin(i / 20) * 4000), i * 2);
  return makeWave(pcm);
};
test('PCM süreleri gerçek örneklerden ölçülür, sessiz/eksik veri reddedilir', () => {
  const wav = tone();
  assert.equal(readWave(wav).duration, 0.5);
  assert.equal(readWave(joinWaves([wav, wav])).duration, 1);
  assert.throws(() => readWave(makeWave(Buffer.alloc(24000))), /Sessiz/);
  assert.throws(() => readWave(wav.subarray(0, 200)), /Eksik/);
  assert.throws(() => makeWave(Buffer.alloc(1001)), /Eksik/);
});
test('API hatası anahtarı ve sağlayıcı gövdesini açığa çıkarmaz, otomatik tekrar yok', async () => {
  let calls = 0;
  await assert.rejects(apiRequest('private-test-secret', '/v1/models', {}, async () => {
    calls++; return new Response('private-test-secret', { status: 401 });
  }), error => !error.message.includes('private-test-secret') && error.message.includes('401'));
  assert.equal(calls, 1);
  await assert.rejects(apiRequest('private-test-secret', '/v1/models', {}, async () => { throw Error('private-test-secret'); }), error => !error.message.includes('private-test-secret'));
  await assert.rejects(apiRequest('private-test-secret', '/v1/models', {}, async () => Response.json({ detail: { status: 'missing_permissions', message: 'private-test-secret models_read' } }, { status: 401 })), error => error.code === 'missing_permissions' && error.message.includes('models_read') && !error.message.includes('private-test-secret') && !error.message.includes('geçersiz'));
});
test('Koleksiyonda bulunmayan veya kategori bilgisi eksik ses, tam kütüphane ID eşleşmesiyle doğrulanır', async () => {
  for (const exists of [false, true]) {
    const urls = [];
    const voice = await lookupVoice('private-test-secret', 'library-voice', async input => {
      urls.push(input);
      return input.includes('/shared-voices?')
        ? Response.json({ voices: [{ voice_id: 'library-voice', name: 'Test', category: 'high_quality' }] })
        : exists ? Response.json({ voice_id: 'library-voice', category: 'professional' })
          : Response.json({ detail: { status: 'voice_not_found' } }, { status: 400 });
    });
    assert.equal(voice.source, 'voice-library');
    assert.equal(supportedVoice(voice), true);
    assert.equal(urls.length, 2);
  }
  await assert.rejects(lookupVoice('private-test-secret', 'missing', async input => input.includes('/shared-voices?') ? Response.json({ voices: [{ voice_id: 'other', category: 'famous' }] }) : Response.json({ detail: { status: 'voice_not_found' } }, { status: 400 })), /bulunamadı/);
});
test('Kullanıcı klonu dışarıda, sağlayıcı kütüphanesi ayrı değerlendirilir', () => {
  assert.equal(supportedVoice({ category: 'cloned' }), false);
  assert.equal(supportedVoice({ category: 'professional' }), false);
  assert.equal(supportedVoice({ category: 'professional', sharing: { enabled_in_library: true, review_status: 'allowed' } }), true);
  assert.equal(supportedVoice({ category: 'generated' }), true);
});
test('Altı anlatıcı için üretim, önbellek, tek paragraf yenileme ve uygulamaya kurma akışı', async () => {
  const outputRoot = path.join(root, 'native-test-results');
  fs.mkdirSync(outputRoot, { recursive: true });
  const workspace = fs.mkdtempSync(path.join(outputRoot, 'tts-'));
  for (const directory of ['content', 'assets/audio', 'src']) fs.mkdirSync(path.join(workspace, directory), { recursive: true });
  fs.copyFileSync(path.join(root, 'content/story.json'), path.join(workspace, 'content/story.json'));
  const story = JSON.parse(fs.readFileSync(path.join(workspace, 'content/story.json'), 'utf8'));
  fs.writeFileSync(path.join(workspace, '.env'), `ELEVENLABS_API_KEY=private-test-secret\n${[1, 2, 3, 4, 5, 6].map(i => `ELEVENLABS_VOICE_${i}_ID=test-voice-${i}`).join('\n')}\n`);
  fs.writeFileSync(path.join(workspace, 'assets/audio/elevenlabs-manifest.json'), JSON.stringify({ bookId: story.id, textVersion: story.textVersion, narrators: [], profiles: {} }));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('ELEVENLABS_')));
  const run = (...args) => execFileSync(process.execPath, ['--import', pathToFileURL(path.join(root, 'tests/fixtures/elevenlabs-mock.mjs')).href, path.join(root, 'scripts/elevenlabs.mjs'), ...args], { cwd: workspace, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(run('plan', '--all'), /48 paragraf/);
  assert.match(run('generate'), /6 yeni istek/);
  const requestCount = () => fs.readFileSync(path.join(workspace, 'requests.jsonl'), 'utf8').trim().split('\n').length;
  assert.equal(requestCount(), 6);
  assert.match(run('generate'), /0 yeni istek/);
  assert.equal(requestCount(), 6);
  run('generate', '--narrator', 'eleven-1', '--all');
  assert.equal(requestCount(), 13);
  const output = path.join(workspace, 'generated-audio/eleven-1', story.id, story.textVersion);
  const reviewFile = path.join(output, 'review.json');
  assert.throws(() => run('install', '--narrator', 'eleven-1'), /review.json/);
  run('preview', '--narrator', 'eleven-1');
  const preview = JSON.parse(fs.readFileSync(path.join(workspace, 'assets/audio/elevenlabs-manifest.json'), 'utf8'));
  assert.equal(preview.narrators[0].stage, 'preview');
  assert.equal(JSON.parse(fs.readFileSync(reviewFile, 'utf8')).commercialUseVerified, false);
  const previewWorkspace = path.join(workspace, 'preview-app');
  for (const directory of ['content', 'assets/audio', 'src']) fs.mkdirSync(path.join(previewWorkspace, directory), { recursive: true });
  fs.copyFileSync(path.join(root, 'content/story.json'), path.join(previewWorkspace, 'content/story.json'));
  fs.copyFileSync(path.join(root, 'assets/audio/manifest.json'), path.join(previewWorkspace, 'assets/audio/manifest.json'));
  fs.copyFileSync(path.join(workspace, 'assets/audio/elevenlabs-manifest.json'), path.join(previewWorkspace, 'assets/audio/elevenlabs-manifest.json'));
  fs.copyFileSync(path.join(root, 'src/model.ts'), path.join(previewWorkspace, 'src/model-preview-prod.ts'));
  const productionModel = await import(pathToFileURL(path.join(previewWorkspace, 'src/model-preview-prod.ts')).href);
  assert.equal(productionModel.hasAiNarrators, false);
  fs.copyFileSync(path.join(root, 'src/model.ts'), path.join(previewWorkspace, 'src/model-preview-dev.ts'));
  const previousDev = globalThis.__DEV__;
  try {
    globalThis.__DEV__ = true;
    const developmentModel = await import(pathToFileURL(path.join(previewWorkspace, 'src/model-preview-dev.ts')).href);
    assert.equal(developmentModel.profiles.find(p => p.id === 'eleven-1').stage, 'preview');
    assert.match(developmentModel.narratorReviewNotice, /henüz doğrulanmadı/);
  } finally { if (previousDev === undefined) delete globalThis.__DEV__; else globalThis.__DEV__ = previousDev; }
  const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  Object.assign(review, { identityVerified: true, commercialUseVerified: true, rightsEvidence: 'TEST FIXTURE ONLY — no actual license', reviewedAt: '2026-10-05' });
  for (const p of Object.values(review.paragraphs)) p.accepted = true;
  fs.writeFileSync(reviewFile, JSON.stringify(review));
  run('install', '--narrator', 'eleven-1');
  const installed = JSON.parse(fs.readFileSync(path.join(workspace, 'assets/audio/elevenlabs-manifest.json'), 'utf8'));
  assert.equal(installed.narrators[0].kind, 'ai');
  assert.equal(installed.profiles['eleven-1'].paragraphs.length, 8);
  assert.ok(Math.abs(installed.profiles['eleven-1'].duration - readWave(fs.readFileSync(path.join(workspace, 'assets/audio/eleven-1.wav'))).duration) < 1 / 24000);
  assert.doesNotMatch(fs.readFileSync(path.join(workspace, 'src/elevenlabsSources.ts'), 'utf8'), /private-test-secret/);
  fs.copyFileSync(path.join(root, 'src/model.ts'), path.join(workspace, 'src/model.ts'));
  fs.copyFileSync(path.join(root, 'assets/audio/manifest.json'), path.join(workspace, 'assets/audio/manifest.json'));
  const model = await import(pathToFileURL(path.join(workspace, 'src/model.ts')).href);
  assert.equal(model.profiles.find(p => p.id === 'eleven-1').kind, 'ai');
  assert.equal(model.hasAiNarrators, true);
  assert.equal(model.switchPosition('demo-standard', 'eleven-1', model.positionOf('demo-standard', 'p04') + 5), installed.profiles['eleven-1'].paragraphs[3].start);
  assert.equal(model.decodeSaved(JSON.stringify({ ...model.initialSaved, profile: 'eleven-1', paragraphId: 'p04', offset: 0.1 })).profile, 'eleven-1');
  run('generate', '--narrator', 'eleven-1', '--paragraph', 'p04', '--force');
  assert.equal(requestCount(), 14);
  const n = { id: 'eleven-1', voiceId: 'test-voice-1', modelId: 'eleven_multilingual_v2' }, p01 = path.join(output, 'p01.wav');
  const identity = identityFor(story, n, 0);
  assert.equal(cached(p01, identity), true);
  assert.equal(cached(p01, { ...identity, textVersion: 'new' }), false);
  assert.equal(cached(p01, { ...identity, nextText: 'changed' }), false);
  const metaPath = `${p01}.json`, meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  meta.audioHash = sha256('wrong'); fs.writeFileSync(metaPath, JSON.stringify(meta));
  assert.equal(cached(p01, identity), false);
  assert.throws(() => run('generate', '--narrtor', 'eleven-1'), /Geçersiz/);

  run('generate', '--all');
  for (let slot = 1; slot <= 6; slot++) run('preview', '--narrator', `eleven-${slot}`);
  const afterAll = requestCount();
  assert.match(run('generate', '--all'), /0 yeni istek/);
  assert.equal(requestCount(), afterAll);
  const multiWorkspace = path.join(workspace, 'multi-app');
  for (const dir of ['content', 'assets/audio', 'src']) fs.mkdirSync(path.join(multiWorkspace, dir), { recursive: true });
  for (const file of ['content/story.json', 'assets/audio/manifest.json', 'src/model.ts']) fs.copyFileSync(path.join(root, file), path.join(multiWorkspace, file));
  fs.copyFileSync(path.join(workspace, 'assets/audio/elevenlabs-manifest.json'), path.join(multiWorkspace, 'assets/audio/elevenlabs-manifest.json'));
  try {
    globalThis.__DEV__ = true;
    const multi = await import(pathToFileURL(path.join(multiWorkspace, 'src/model.ts')).href);
    const voices = multi.profiles.filter(p => p.kind === 'ai');
    assert.equal(voices.length, 6);
    assert.equal(new Set(voices.map(p => multi.manifest.profiles[p.id].duration)).size, 6);
    for (const from of voices) for (const to of voices) for (const paragraph of story.paragraphs) {
      const target = multi.switchPosition(from.id, to.id, multi.positionOf(from.id, paragraph.id) + 0.1);
      assert.equal(target, multi.positionOf(to.id, paragraph.id));
      assert.equal(multi.paragraphAt(to.id, Math.floor(target * 1000) / 1000).id, paragraph.id);
      const saved = { ...multi.initialSaved, profile: to.id, paragraphId: paragraph.id, offset: 0, rate: 1.25, started: true };
      assert.deepEqual(multi.decodeSaved(JSON.stringify(saved)), saved);
    }
    for (const voice of voices) {
      const review = JSON.parse(fs.readFileSync(path.join(workspace, 'generated-audio', voice.id, story.id, story.textVersion, 'review.json'), 'utf8'));
      if (voice.id !== 'eleven-1') assert.equal(review.commercialUseVerified, false);
    }
  } finally { if (previousDev === undefined) delete globalThis.__DEV__; else globalThis.__DEV__ = previousDev; }
});
