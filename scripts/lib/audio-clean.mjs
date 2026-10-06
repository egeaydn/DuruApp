import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { makeWave, readWave } from './wave.mjs';

export const cleaning = {
  version: 'duru-clean-v1',
  filter: 'adeclick=t=3,afftdn=nr=6:nf=-45:tn=1,alimiter=limit=0.891251:level=false:latency=true',
};

export function cleanWave(original) {
  const wave = readWave(original);
  if (!ffmpeg) throw Error('Bu platform için FFmpeg bulunamadı.');
  const result = spawnSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-af', cleaning.filter,
    '-ar', String(wave.fmt.readUInt32LE(4)), '-ac', String(wave.fmt.readUInt16LE(2)),
    '-c:a', 'pcm_s16le', '-f', 's16le', 'pipe:1',
  ], { input: original, maxBuffer: Math.max(original.length * 2, 1024 * 1024), timeout: 120000 });
  if (result.error || result.status !== 0) throw Error('Yerel ses temizleme tamamlanamadı; mevcut uygulama kaydı değiştirilmedi.');
  // Paragraph positions must remain valid. Never compensate for a timing error
  // by changing a WAV header, cropping speech, or silently padding the result.
  if (result.stdout.length !== wave.data.length) throw Error('Temizleme örnek sayısını değiştirdi; kayıt kurulmadı.');
  const cleaned = makeWave(result.stdout, wave.fmt.readUInt32LE(4), wave.fmt.readUInt16LE(2));
  readWave(cleaned);
  return cleaned;
}
