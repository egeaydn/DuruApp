import fs from 'node:fs';
import path from 'node:path';
import { apiRequest, cached, identityFor, requireReview, sha256, supportedVoice, lookupVoice } from './lib/elevenlabs.mjs';
import { joinWaves, makeWave, readWave } from './lib/wave.mjs';

if (fs.existsSync('.env')) process.loadEnvFile('.env');
const story = JSON.parse(fs.readFileSync('content/story.json', 'utf8'));
const args = process.argv.slice(2), command = args.shift() || 'help';
const validOptions = new Set(['--narrator', '--paragraph', '--all', '--force']);
const seenOptions = new Set();
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  if (!validOptions.has(flag) || seenOptions.has(flag)) { console.error('Geçersiz veya tekrarlanan seçenek. npm run tts -- help'); process.exit(1); }
  seenOptions.add(flag);
  if (flag === '--narrator' || flag === '--paragraph') {
    if (!args[++i] || args[i].startsWith('--')) { console.error(`${flag} için değer gerekiyor.`); process.exit(1); }
  }
}
if (seenOptions.has('--all') && seenOptions.has('--paragraph')) { console.error('--all veya --paragraph seçeneklerinden birini kullan.'); process.exit(1); }
const value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const narrators = [1, 2, 3, 4, 5, 6].filter(slot => process.env[`ELEVENLABS_VOICE_${slot}_ID`]?.trim()).map(slot => ({ id: `eleven-${slot}`, voiceId: process.env[`ELEVENLABS_VOICE_${slot}_ID`].trim(), label: process.env[`ELEVENLABS_VOICE_${slot}_LABEL`]?.trim() || `Anlatıcı ${slot}`, modelId: process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_multilingual_v2' }));
const directory = n => path.join('generated-audio', n.id, story.id, story.textVersion);
const selected = value('--narrator') ? narrators.filter(n => n.id === value('--narrator')) : narrators;
function key() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) throw Error('.env içindeki ELEVENLABS_API_KEY boş. Yeni anahtarı yalnızca bu yerel dosyaya gir.');
  return apiKey;
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
function paragraphFile(n, p) { return path.join(directory(n), `${p.id}.wav`); }
function plan() {
  if (!selected.length) throw Error('.env içinde en az bir Voice ID tanımla ve --narrator eleven-1 … eleven-6 seçimini kontrol et.');
  if (selected.some(n => !/^[A-Za-z0-9_-]{1,100}$/.test(n.voiceId))) throw Error('Voice ID biçimi geçersiz.');
  if (new Set(narrators.map(n => n.voiceId)).size !== narrators.length) throw Error('Her anlatıcı için farklı Voice ID seç.');
  const paragraphId = value('--paragraph');
  if (paragraphId && !story.paragraphs.some(p => p.id === paragraphId)) throw Error('Paragraf kimliği bulunamadı.');
  if (args.includes('--force') && !paragraphId) throw Error('--force yalnızca --paragraph pXX ile tek paragrafı tekrar üretir.');
  const jobs = selected.flatMap(n => story.paragraphs.flatMap((p, index) => {
    if (!args.includes('--all') && p.id !== (paragraphId || 'p01') || paragraphId && p.id !== paragraphId) return [];
    const identity = identityFor(story, n, index), file = paragraphFile(n, p);
    return [{ n, p, identity, file, reuse: !args.includes('--force') && cached(file, identity) }];
  }));
  const pending = jobs.filter(j => !j.reuse);
  console.log(`${jobs.length} paragraf; ${jobs.length - pending.length} önbellek; ${pending.length} yeni istek; ${pending.reduce((sum, j) => sum + Array.from(j.p.text).length, 0)} metin karakteri.`);
  console.log('Yeni istekler hesabındaki kredileri kullanır; parasal fiyat/indirim panelden doğrulanmalı.');
  return jobs;
}
async function generate() {
  const jobs = plan(), pending = jobs.filter(j => !j.reuse);
  if (pending.length) {
    const apiKey = key();
    const models = await (await apiRequest(apiKey, '/v1/models')).json();
    for (const n of selected) {
      const model = models.find(m => m.model_id === n.modelId);
      if (!model?.can_do_text_to_speech || !model.languages?.some(l => l.language_id === 'tr')) throw Error(`${n.id}: model Türkçe TTS desteği doğrulanamadı.`);
      const voice = await lookupVoice(apiKey, n.voiceId);
      if (voice.voice_id !== n.voiceId || !supportedVoice(voice)) throw Error(`${n.id}: sağlayıcı hazır/Voice Design veya Voice Library anlatıcısı doğrulanamadı; kullanıcı klonu kapsam dışı.`);
      fs.mkdirSync(directory(n), { recursive: true });
      writeJson(path.join(directory(n), 'voice.json'), { voiceId: n.voiceId, name: voice.name, category: voice.category, source: voice.source || 'my-voices', provider: 'ElevenLabs', checkedAt: new Date().toISOString(), commercialRightsVerified: false });
    }
    for (const job of pending) {
      const { n, p, file, identity } = job, start = performance.now();
      const request = { text: p.text, model_id: n.modelId, voice_settings: identity.settings, previous_text: identity.previousText, next_text: identity.nextText };
      if (n.modelId !== 'eleven_multilingual_v2') request.language_code = 'tr';
      const response = await apiRequest(apiKey, `/v1/text-to-speech/${encodeURIComponent(n.voiceId)}?output_format=pcm_24000`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      let pcm;
      try { pcm = Buffer.from(await response.arrayBuffer()); } catch { throw Error(`${n.id}/${p.id}: ses indirmesi kesildi. Otomatik yeniden üretim yapılmadı; sağlayıcı geçmişini kontrol et.`); }
      const bytes = makeWave(pcm), wave = readWave(bytes);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, bytes);
      writeJson(`${file}.json`, { identity, identityHash: sha256(JSON.stringify(identity)), audioHash: sha256(bytes), duration: wave.duration, latencyMs: Math.round(performance.now() - start), characters: Array.from(p.text).length, generatedAt: new Date().toISOString(), qualityAccepted: false });
      console.log(`${n.id}/${p.id}: ${wave.duration.toFixed(2)} sn üretildi; dinleyerek değerlendir.`);
    }
  }
  for (const n of selected) {
    fs.mkdirSync(directory(n), { recursive: true });
    const file = path.join(directory(n), 'review.json');
    let review = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
    if (review?.voiceId !== n.voiceId || review?.modelId !== n.modelId || review?.textVersion !== story.textVersion) review = { voiceId: n.voiceId, modelId: n.modelId, textVersion: story.textVersion, identityVerified: false, commercialUseVerified: false, rightsEvidence: '', reviewedAt: '', paragraphs: {} };
    review.paragraphs ??= {};
    for (const p of story.paragraphs) {
      const file = paragraphFile(n, p);
      if (!fs.existsSync(file)) continue;
      const hash = sha256(fs.readFileSync(file));
      if (review.paragraphs[p.id]?.audioHash !== hash) review.paragraphs[p.id] = { audioHash: hash, accepted: false, notes: '' };
    }
    writeJson(file, review);
    console.log(`Dinleme/hak kaydı: ${file}`);
  }
}
function install(preview = false) {
  if (!selected.length) throw Error('.env içinde Voice ID tanımla.');
  const published = JSON.parse(fs.readFileSync('assets/audio/elevenlabs-manifest.json', 'utf8'));
  if (published.bookId !== story.id || published.textVersion !== story.textVersion) throw Error('Mevcut ElevenLabs manifestinin metin sürümü farklı; yeniden kayıt/migrasyon gerekir.');
  // Validate every selected narrator before writing any application asset.
  const prepared = selected.map(n => {
    let start = 0;
    const buffers = [], paragraphs = story.paragraphs.map((p, index) => {
      const file = paragraphFile(n, p);
      if (!cached(file, identityFor(story, n, index))) throw Error(`${n.id}/${p.id}: geçerli kayıt eksik. Önce generate --all çalıştır.`);
      const bytes = fs.readFileSync(file), wave = readWave(bytes); buffers.push(bytes);
      const result = { id: p.id, start, duration: wave.duration, file: `${n.id}/${p.id}.wav`, sha256: sha256(bytes) };
      start += wave.duration; return result;
    });
    const review = JSON.parse(fs.readFileSync(path.join(directory(n), 'review.json'), 'utf8'));
    if (!preview) requireReview(review, n, story, paragraphs);
    const audio = joinWaves(buffers);
    return { n, buffers, audio, review, track: { duration: start, sha256: sha256(audio), voiceId: n.voiceId, modelId: n.modelId, paragraphs } };
  });
  for (const { n, buffers, audio, review, track } of prepared) {
    const dest = path.join('assets/audio', n.id); fs.mkdirSync(dest, { recursive: true });
    buffers.forEach((bytes, index) => fs.writeFileSync(path.join(dest, `${story.paragraphs[index].id}.wav`), bytes));
    fs.writeFileSync(`${dest}.wav`, audio); writeJson(path.join(dest, 'rights-and-review.json'), review);
    published.profiles[n.id] = track;
    published.narrators = published.narrators.filter(p => p.id !== n.id);
    published.narrators.push({ id: n.id, label: n.label, description: preview ? 'ElevenLabs · Deneme kaydı · Hak incelemesi bekliyor' : 'ElevenLabs · AI anlatıcı', kind: 'ai', stage: preview ? 'preview' : 'reviewed', badge: preview ? 'AI deneme' : 'AI anlatıcı' });
  }
  writeJson('assets/audio/elevenlabs-manifest.json', published);
  const entries = published.narrators.map(n => `  ${JSON.stringify(n.id)}: require('../assets/audio/${n.id}.wav'),`).join('\n');
  fs.writeFileSync('src/elevenlabsSources.ts', `// Üretilmiş ses varlıkları. API anahtarı içermez.\nexport const elevenlabsSources: Record<string, number | string> = {\n${entries}\n};\n`);
  console.log(preview ? 'Deneme kaydı yalnızca geliştirme arayüzündeki Profil seçimine eklendi. Kalite ve ticari haklar onaylanmadı.' : 'Onaylı anlatıcı kayıtları uygulamadaki Profil seçimine eklendi. Demo sesler korundu.');
}
async function main() {
  if (command === 'voices') {
    let page;
    do {
      const url = new URL('https://api.elevenlabs.io/v2/voices'); url.searchParams.set('page_size', '100');
      if (page) url.searchParams.set('next_page_token', page);
      const result = await (await apiRequest(key(), url.pathname + url.search)).json();
      for (const v of result.voices) if (supportedVoice(v)) console.log(`${v.voice_id}\t${v.name}\t${v.category}`);
      page = result.has_more ? result.next_page_token : undefined;
    } while (page);
  } else if (command === 'plan') plan();
  else if (command === 'generate') await generate();
  else if (command === 'install') install();
  else if (command === 'preview') {
    if (!value('--narrator')) throw Error('Yerel deneme için tek anlatıcı seç: preview --narrator eleven-1');
    install(true);
  }
  else if (command === 'help') console.log('ElevenLabs: voices | plan | generate [--narrator eleven-1] [--paragraph p01 | --all] [--force] | preview --narrator eleven-1 | install [--narrator eleven-1]');
  else throw Error('Bilinmeyen komut. npm run tts -- help');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
