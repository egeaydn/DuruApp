// Loaded only by isolated CLI tests. No request is sent to the real provider.
import fs from 'node:fs';
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(input);
  if (url.origin !== 'https://api.elevenlabs.io') throw Error('Beklenmeyen test adresi');
  if (options.headers?.['xi-api-key'] !== 'private-test-secret') throw Error('Test anahtarı gönderilmedi');
  if (url.pathname === '/v1/models') return Response.json([{ model_id: 'eleven_multilingual_v2', can_do_text_to_speech: true, languages: [{ language_id: 'tr' }] }]);
  if (url.pathname.startsWith('/v1/voices/')) return Response.json({ voice_id: url.pathname.split('/').at(-1), name: 'Test anlatıcı', category: 'premade' });
  if (url.pathname.startsWith('/v1/text-to-speech/') && options.method === 'POST') {
    const request = JSON.parse(options.body);
    fs.appendFileSync('requests.jsonl', JSON.stringify({ voiceId: url.pathname.split('/').at(-1), text: request.text }) + '\n');
    const pcm = Buffer.alloc(24000 + request.text.length * 8);
    for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(Math.round(Math.sin(i / 20) * 4000), i * 2);
    return new Response(pcm, { headers: { 'Content-Type': 'audio/pcm' } });
  }
  throw Error('Beklenmeyen test isteği');
};
