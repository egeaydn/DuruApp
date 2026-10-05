import crypto from 'node:crypto';
import fs from 'node:fs';
import { readWave } from './wave.mjs';
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function supportedVoice(voice) {
  return ['premade', 'generated'].includes(voice.category) || (voice.source === 'voice-library' && ['professional', 'high_quality'].includes(voice.category)) || (voice.category === 'professional' && voice.sharing?.enabled_in_library === true && voice.sharing?.review_status === 'allowed');
}
export async function lookupVoice(apiKey, voiceId, fetcher = fetch) {
  try {
    const voice = await (await apiRequest(apiKey, `/v1/voices/${encodeURIComponent(voiceId)}`, {}, fetcher)).json();
    if (supportedVoice(voice)) return voice;
  }
  catch (error) { if (error.code !== 'voice_not_found') throw error; }
  const library = await (await apiRequest(apiKey, `/v1/shared-voices?search=${encodeURIComponent(voiceId)}&page_size=100`, {}, fetcher)).json();
  const voice = library.voices?.find(v => v.voice_id === voiceId);
  if (!voice || !['professional', 'high_quality'].includes(voice.category)) throw Error('Ses hesabında veya uygun Voice Library kayıtlarında bulunamadı.');
  return { ...voice, source: 'voice-library' };
}
export function identityFor(story, narrator, paragraphIndex) {
  const p = story.paragraphs[paragraphIndex];
  return { provider: 'ElevenLabs', bookId: story.id, textVersion: story.textVersion, narratorId: narrator.id, voiceId: narrator.voiceId, modelId: narrator.modelId, paragraphId: p.id, text: p.text, previousText: story.paragraphs[paragraphIndex - 1]?.text ?? '', nextText: story.paragraphs[paragraphIndex + 1]?.text ?? '', outputFormat: 'pcm_24000', settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1 } };
}
export function cached(file, identity) {
  try {
    const bytes = fs.readFileSync(file), meta = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8'));
    readWave(bytes);
    return meta.identityHash === sha256(JSON.stringify(identity)) && meta.audioHash === sha256(bytes);
  } catch { return false; }
}
export async function apiRequest(apiKey, endpoint, options = {}, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(`https://api.elevenlabs.io${endpoint}`, { ...options, headers: { ...options.headers, 'xi-api-key': apiKey }, signal: AbortSignal.timeout(90000) });
  } catch {
    // Never print request objects, provider error bodies, or secrets. No automatic billed retries.
    throw Error('ElevenLabs bağlantısı tamamlanamadı. Ücretlendirme/üretim geçmişini kontrol et; otomatik tekrar yapılmadı.');
  }
  if (!response.ok) {
    let body;
    try { body = await response.json(); } catch { /* Never echo the raw body. */ }
    const errors = { missing_permissions: 'API anahtarının gerekli izni kapalı.', invalid_api_key: 'API anahtarı geçersiz.', voice_not_found: 'Ses bu hesabın My Voices listesinde bulunamadı.', quota_exceeded: 'Üretim kotası yetersiz.', paid_plan_required: 'Bu işlem için sağlayıcı ücretli plan istiyor.' };
    const code = Object.hasOwn(errors, body?.detail?.status ?? '') ? body.detail.status : undefined;
    const required = ['models_read', 'voices_read', 'voices_write', 'text_to_speech'].filter(p => typeof body?.detail?.message === 'string' && body.detail.message.includes(p));
    const messages = { 401: 'Kimlik doğrulama veya anahtar izinleri başarısız.', 403: 'Anahtar, ses veya plan izni yetersiz.', 402: 'Bakiye/plan yetersiz.', 429: 'Kota veya istek sınırı aşıldı.' };
    const error = Error(`ElevenLabs HTTP ${response.status}: ${errors[code] || messages[response.status] || 'İstek başarısız; sağlayıcı panelini kontrol et.'}${required.length ? ` Gerekli izin: ${required.join(', ')}.` : ''}`);
    error.code = code;
    throw error;
  }
  return response;
}
export function requireReview(review, narrator, story, paragraphs) {
  if (review?.voiceId !== narrator.voiceId || review?.modelId !== narrator.modelId || review?.textVersion !== story.textVersion || review?.identityVerified !== true || review?.commercialUseVerified !== true || !review?.rightsEvidence?.trim() || !review?.reviewedAt?.trim()) throw Error(`${narrator.id}: ses kimliği/ticari haklar için review.json tamamlanmalı.`);
  for (const p of paragraphs) if (review.paragraphs?.[p.id]?.accepted !== true || review.paragraphs[p.id].audioHash !== p.sha256) throw Error(`${narrator.id}/${p.id}: mevcut ses hash'iyle dinleme onayı eksik.`);
}
