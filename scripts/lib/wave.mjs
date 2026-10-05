export function readWave(buffer) {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') throw Error('Geçersiz WAV');
  let fmt, data;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (offset + 8 + size > buffer.length) throw Error('Eksik WAV verisi');
    if (id === 'fmt ') fmt = buffer.subarray(offset + 8, offset + 8 + size);
    if (id === 'data') data = buffer.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  if (!fmt || fmt.length < 16 || !data || data.length < 1000 || fmt.readUInt16LE(0) !== 1 || fmt.readUInt16LE(14) !== 16) throw Error('16 bit PCM WAV bekleniyor');
  const channels = fmt.readUInt16LE(2), sampleRate = fmt.readUInt32LE(4);
  if (![1, 2].includes(channels) || sampleRate < 8000 || fmt.readUInt16LE(12) !== channels * 2 || fmt.readUInt32LE(8) !== sampleRate * channels * 2 || data.length % (channels * 2)) throw Error('PCM biçimi veya uzunluğu geçersiz');
  let energy = 0;
  for (let i = 0; i < data.length; i += 2) energy += data.readInt16LE(i) ** 2;
  const rms = Math.sqrt(energy / (data.length / 2));
  if (rms < 20) throw Error('Sessiz ses dosyası');
  return { fmt, data, duration: data.length / fmt.readUInt32LE(8), rms };
}
export function makeWave(data, sampleRate = 24000, channels = 1) {
  if (data.length % (channels * 2)) throw Error('Eksik PCM örneği');
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + data.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
export function joinWaves(buffers) {
  const waves = buffers.map(readWave);
  if (!waves.length || waves.some(w => !w.fmt.equals(waves[0].fmt))) throw Error('PCM biçimleri farklı veya liste boş');
  return makeWave(Buffer.concat(waves.map(w => w.data)), waves[0].fmt.readUInt32LE(4), waves[0].fmt.readUInt16LE(2));
}
