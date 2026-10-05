import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSaved, initialSaved, manifest, paragraphAt, positionOf, switchPosition, matches } from '../src/model.ts';
test('Profil değişimi aynı saniyeyi kopyalamaz; ortak paragrafın başına döner', () => {
  const p = manifest.profiles['demo-standard'].paragraphs[4];
  const target = switchPosition('demo-standard', 'demo-slow', p.start + 8);
  assert.equal(target, manifest.profiles['demo-slow'].paragraphs[4].start);
  assert.equal(paragraphAt('demo-slow', target).id, p.id);
  assert.notEqual(target, p.start + 8);
});
test('Tam paragraf sınırı sonraki paragrafı seçer', () => {
  const next = manifest.profiles['demo-standard'].paragraphs[1];
  assert.equal(paragraphAt('demo-standard', next.start).id, 'p02');
});
test('Android milisaniyeye yuvarlanan paragraf konumu önceki paragrafa kaymaz', () => {
  for (const profile of ['demo-standard', 'demo-slow']) {
    for (const p of manifest.profiles[profile].paragraphs.slice(1)) {
      const androidPosition = Math.floor(p.start * 1000) / 1000;
      assert.equal(paragraphAt(profile, androidPosition).id, p.id);
      assert.equal(paragraphAt(profile, androidPosition - 0.002).id, manifest.profiles[profile].paragraphs[Number(p.id.slice(1)) - 2].id);
    }
  }
});
test('Bozuk veya farklı metin sürümünden kayıtlar güvenli başlar', () => {
  for (const raw of [null, '{', JSON.stringify({ ...initialSaved, textVersion: 'old' }), JSON.stringify({ ...initialSaved, paragraphId: 'unknown' })]) assert.deepEqual(decodeSaved(raw), initialSaved);
});
test('İlerleme paragraf içi konum, hız, profil ve yer imiyle geri yüklenir', () => {
  const saved = { ...initialSaved, profile: 'demo-slow', paragraphId: 'p03', offset: 7.2, rate: 1.25, started: true, favorite: true };
  assert.deepEqual(decodeSaved(JSON.stringify(saved)), saved);
  assert.equal(positionOf(saved.profile, saved.paragraphId, saved.offset), manifest.profiles['demo-slow'].paragraphs[2].start + 7.2);
});
test('Geçersiz sayılar sınırlanır ve Türkçe arama I/ı harfini doğru eşler', () => {
  assert.equal(decodeSaved(JSON.stringify({ ...initialSaved, offset: -4, rate: 100 })).offset, 0);
  assert.equal(decodeSaved(JSON.stringify({ ...initialSaved, rate: 100 })).rate, 1);
  assert.equal(matches('KIYIDAKİ IŞIK'), true);
  assert.equal(matches('bulunmayan kitap'), false);
});
