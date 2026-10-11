import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
globalThis.__DEV__ = true;
const { decodeSaved, initialSaved, manifest, paragraphAt, positionOf, matches, profiles } = await import('../src/model.ts');

test('Geliştirme sürümünde tek anlatıcı Anlatıcı 1 olur', () => {
  assert.deepEqual(profiles.map(p => p.id), ['eleven-1']);
  assert.equal(initialSaved.profile, 'eleven-1');
});
test('Eski ses kaydı aynı paragrafın başına taşınır; saniye kopyalanmaz', () => {
  for (const old of ['demo-standard', 'demo-slow', 'eleven-2', 'eleven-6']) {
    const restored = decodeSaved(JSON.stringify({ ...initialSaved, profile: old, paragraphId: 'p04', offset: 8, rate: 1.25, started: true, favorite: true }));
    assert.equal(restored.profile, 'eleven-1');
    assert.equal(restored.paragraphId, 'p04');
    assert.equal(restored.offset, 0);
    assert.equal(restored.rate, 1.25);
    assert.equal(restored.started, true);
    assert.equal(restored.favorite, true);
    assert.equal(positionOf(restored.profile, restored.paragraphId, restored.offset), manifest.profiles['eleven-1'].paragraphs[3].start);
  }
});
test('Tam ve Android milisaniyesine yuvarlanan paragraf sınırları doğru seçilir', () => {
  const items = manifest.profiles['eleven-1'].paragraphs;
  for (const [index, p] of items.entries()) {
    assert.equal(paragraphAt('eleven-1', p.start).id, p.id);
    assert.equal(paragraphAt('eleven-1', Math.floor(p.start * 1000) / 1000).id, p.id);
    if (index) assert.equal(paragraphAt('eleven-1', Math.floor(p.start * 1000) / 1000 - 0.002).id, items[index - 1].id);
  }
});
test('Bozuk veya farklı metin sürümünden kayıtlar güvenli başlar', () => {
  for (const raw of [null, '{', JSON.stringify({ ...initialSaved, textVersion: 'old' }), JSON.stringify({ ...initialSaved, paragraphId: 'unknown' })]) assert.deepEqual(decodeSaved(raw), initialSaved);
});
test('Aynı anlatıcıda paragraf içi konum, hız ve yer imi korunur', () => {
  const saved = { ...initialSaved, paragraphId: 'p03', offset: 7.2, rate: 1.25, started: true, favorite: true };
  assert.deepEqual(decodeSaved(JSON.stringify(saved)), saved);
  assert.equal(positionOf(saved.profile, saved.paragraphId, saved.offset), manifest.profiles['eleven-1'].paragraphs[2].start + 7.2);
});
test('Geçersiz sayılar sınırlanır ve Türkçe arama I/ı harfini doğru eşler', () => {
  assert.equal(decodeSaved(JSON.stringify({ ...initialSaved, offset: -4, rate: 100 })).offset, 0);
  assert.equal(decodeSaved(JSON.stringify({ ...initialSaved, rate: 100 })).rate, 1);
  assert.equal(matches('KIYIDAKİ IŞIK'), true);
  assert.equal(matches('bulunmayan kitap'), false);
});
test('Yayın paketinde inceleme bekleyen AI kaydı yerine tek açık demo kullanılır', () => {
  const code = "globalThis.__DEV__ = false; const m = await import('./src/model.ts'); const model = m.default ?? m; console.log(JSON.stringify({ ids: model.profiles.map(p => p.id), saved: model.decodeSaved(JSON.stringify({ ...model.initialSaved, profile: 'eleven-1', paragraphId: 'p03', offset: 9 })) }));";
  const release = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], { encoding: 'utf8' }));
  assert.deepEqual(release.ids, ['demo-standard']);
  assert.equal(release.saved.profile, 'demo-standard');
  assert.equal(release.saved.paragraphId, 'p03');
  assert.equal(release.saved.offset, 0);
});
