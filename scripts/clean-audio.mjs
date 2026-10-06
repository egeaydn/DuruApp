import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from './lib/elevenlabs.mjs';
import { cleanWave, cleaning } from './lib/audio-clean.mjs';
import { joinWaves, readWave } from './lib/wave.mjs';


try {
  const args = process.argv.slice(2);
  const command = args.shift() || 'preview';
  if (!['preview', 'install', 'restore'].includes(command)) throw Error('Kullanım: audio:clean -- preview|install|restore [--narrator eleven-1]');
  let narratorId;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--narrator' || !/^eleven-[1-6]$/.test(args[1])) throw Error('Geçersiz anlatıcı seçimi.');
    narratorId = args[1];
  }
  const manifestFile = 'assets/audio/elevenlabs-manifest.json';
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const story = JSON.parse(fs.readFileSync('content/story.json', 'utf8'));
  if (manifest.bookId !== story.id || manifest.textVersion !== story.textVersion) throw Error('Metin sürümü eşleşmiyor.');
  const selected = manifest.narrators.filter(n => narratorId ? n.id === narratorId : command === 'preview' ? n.id === 'eleven-1' : true);
  if (!selected.length || selected.some(n => n.stage !== 'preview')) throw Error('Bu araç yalnızca geliştirme denemesi olan anlatıcıları işler.');
  const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

  function sourceFor(narrator, paragraph) {
    const file = path.join('generated-audio', narrator.id, story.id, story.textVersion, `${paragraph.id}.wav`);
    const original = fs.readFileSync(file);
    const metadata = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8'));
    if (metadata.audioHash !== sha256(original) || metadata.identity?.voiceId !== manifest.profiles[narrator.id].voiceId || metadata.identity?.paragraphId !== paragraph.id || metadata.identity?.text !== paragraph.text) throw Error(`${narrator.id}/${paragraph.id}: ham üretim doğrulanamadı.`);
    readWave(original);
    return original;
  }
  function processedFor(narrator, paragraph, original) {
    const sourceHash = sha256(original);
    const fingerprint = sha256(JSON.stringify({ ...cleaning, sourceHash }));
    const folder = path.join('generated-audio', 'processed', narrator.id, story.id, story.textVersion, fingerprint);
    const file = path.join(folder, `${paragraph.id}.wav`);
    let bytes;
    try {
      const metadata = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8'));
      const cached = fs.readFileSync(file);
      if (metadata.fingerprint === fingerprint && metadata.audioHash === sha256(cached) && readWave(cached).data.length === readWave(original).data.length) bytes = cached;
    } catch { /* A missing or invalid cache is rebuilt from the original only. */ }
    if (!bytes) {
      bytes = cleanWave(original);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(file, bytes);
      writeJson(`${file}.json`, { ...cleaning, fingerprint, sourceHash, audioHash: sha256(bytes), qualityAccepted: false });
    }
    return { bytes, file, sourceHash };
  }

  if (command === 'preview') {
    const n = selected[0], p = story.paragraphs[0];
    const result = processedFor(n, p, sourceFor(n, p));
    console.log(`Dinleme örneği: ${result.file}`);
    console.log('Ses/süre korunur. Bu çıktı insan dinleme değerlendirmesi olmadan kalite onayı sayılmaz.');
  } else {
    // Prepare and verify every result before changing any installed audio.
    const prepared = selected.map(n => {
      const previous = manifest.profiles[n.id];
      let start = 0;
      const buffers = [], paragraphs = story.paragraphs.map(p => {
        const original = sourceFor(n, p);
        const result = command === 'restore' ? { bytes: original } : processedFor(n, p, original);
        const wave = readWave(result.bytes);
        buffers.push(result.bytes);
        const item = { id: p.id, start, duration: wave.duration, file: `${n.id}/${p.id}.wav`, sha256: sha256(result.bytes), ...(command === 'install' ? { sourceSha256: result.sourceHash } : {}) };
        start += wave.duration;
        console.log(`${n.id}/${p.id}: ${command === 'restore' ? 'ham kaynak hazır' : 'temizleme hazır'}, süre ${wave.duration.toFixed(3)} sn`);
        return item;
      });
      const audio = joinWaves(buffers);
      if (Math.abs(start - previous.duration) > 0.001 || paragraphs.some((p, i) => Math.abs(p.start - previous.paragraphs[i].start) > 0.001)) throw Error('Paragraf zamanları değişti; kurulum durduruldu.');
      const track = { duration: start, sha256: sha256(audio), voiceId: previous.voiceId, modelId: previous.modelId, paragraphs, ...(command === 'install' ? { processing: cleaning } : {}) };
      const reviewFile = path.join('assets/audio', n.id, 'rights-and-review.json');
      const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
      for (const p of paragraphs) review.paragraphs[p.id] = { audioHash: p.sha256, accepted: false, notes: command === 'install' ? 'Yerel temizleme uygulandı; bu paragrafın dinleme değerlendirmesi bekleniyor.' : 'Ham kayda dönüldü; dinleme değerlendirmesi bekleniyor.' };
      return { n, buffers, audio, track, review, reviewFile };
    });
    for (const { n, buffers, audio, track, review, reviewFile } of prepared) {
      buffers.forEach((bytes, i) => fs.writeFileSync(path.join('assets/audio', n.id, `${story.paragraphs[i].id}.wav`), bytes));
      fs.writeFileSync(path.join('assets/audio', `${n.id}.wav`), audio);
      manifest.profiles[n.id] = track;
      writeJson(reviewFile, review);
    }
    writeJson(manifestFile, manifest);
    console.log('Kurulum tamamlandı. Ham üretimler korundu; TTS API çağrısı yapılmadı.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
