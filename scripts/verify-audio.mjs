import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readWave } from './lib/wave.mjs';
export { readWave } from './lib/wave.mjs';
const story = JSON.parse(fs.readFileSync('content/story.json', 'utf8'));
const manifest = { bookId: story.id, textVersion: story.textVersion, demo: true, provider: 'Windows SAPI', voice: 'Microsoft Tolga (tr-TR)', profiles: {} };
for (const id of ['demo-standard', 'demo-slow']) {
  let start = 0;
  const waves = [];
  const paragraphs = story.paragraphs.map(p => {
    const file = path.join('assets/audio', id, `${p.id}.wav`);
    const bytes = fs.readFileSync(file);
    const wave = readWave(bytes);
    if (waves.length && !wave.fmt.equals(waves[0].fmt)) throw Error('PCM biçimleri farklı');
    waves.push(wave);
    const item = { id: p.id, start, duration: wave.duration, file: `${id}/${p.id}.wav`, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
    start += wave.duration;
    return item;
  });
  const data = Buffer.concat(waves.map(w => w.data));
  const fmt = waves[0].fmt;
  const header = Buffer.alloc(12); header.write('RIFF'); header.writeUInt32LE(4 + 8 + fmt.length + 8 + data.length, 4); header.write('WAVE', 8);
  const fmtHeader = Buffer.alloc(8); fmtHeader.write('fmt '); fmtHeader.writeUInt32LE(fmt.length, 4);
  const dataHeader = Buffer.alloc(8); dataHeader.write('data'); dataHeader.writeUInt32LE(data.length, 4);
  const full = Buffer.concat([header, fmtHeader, fmt, dataHeader, data]);
  fs.writeFileSync(path.join('assets/audio', `${id}.wav`), full);
  manifest.profiles[id] = { duration: start, sha256: crypto.createHash('sha256').update(full).digest('hex'), paragraphs };
  console.log(`${id}: ${paragraphs.length} paragraf, ${start.toFixed(2)} saniye; PCM ve sessizlik kontrolü geçti.`);
}
fs.writeFileSync('assets/audio/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
