# İlk gerçek ElevenLabs denemesi

Tarih: 5 Ekim 2026. Özgün `Kıyıdaki Işık` metni v1.0.0, ilk seçilen Voice ID `GLHtjkeLJ9Rxcv9JhLmh`. Sağlayıcı kütüphanesindeki adı: **Muhammer Arabacı - Enthusiastic, Direct**. Uygulamada **Anlatıcı 1 · AI deneme** olarak gösterilir.

## Sonuç

- Model: `eleven_multilingual_v2`, çıktı: `pcm_24000` → mono 16 bit WAV.
- 8 paragraf, 2.812 metin karakteri, toplam 210,187 saniye (3:30).
- Üretim isteklerinin ölçülen toplam süresi: 45.607 ms; ilk paragraf 12.480 ms, diğerleri yaklaşık 4,2–5,0 saniye. Bu süreler tek koşunun indirme dahil istemci ölçümleridir.
- İlk p01 kaydı tam hikâye komutunda önbellekten kullanıldı; gereksiz ikinci üretim yapılmadı.
- Paragraf kimliği, metin/ses/model/bağlam sürümleri ve dosya hashleri metadata'da saklandı. PCM bütünlüğü/sessizlik kontrolü geçti.
- Gerçek para ve tüketilen kredi miktarı sağlayıcı panelinden ayrıca kaydedilmeli; karakter sayısı faturanın karşılığı olarak sunulmaz.

Ham kayıtlar: `generated-audio/eleven-1/kiyidaki-isik/1.0.0/`. Uygulamaya eklenen WAV: `assets/audio/eleven-1.wav`. Profil/süre bilgisi: `assets/audio/elevenlabs-manifest.json`.

## Erişim sorunlarının çözümü

İlk API isteğinde `missing_permissions` / `models_read` ve `voices_read` görüldü. Kullanıcı anahtar izinlerini güncelledikten sonra model kataloğu okundu. Altı verilen ID, My Voices listesinde bulunmadığından `voice_not_found` döndü. İlk ID paylaşılan kütüphanede tam eşleşmeyle bulundu.

Koleksiyona ekleme isteği `voices_write` kapalı olduğundan reddedildi; bu işlem başarılı olmadı. Doğrudan TTS üretimi ise kütüphane ID'siyle başarılı oldu. Üretim komutu artık My Voices kaydı yoksa veya sağlayıcı kategori ayrıntıları eksikse paylaşılan kütüphanede **aynı ID'yi** doğrular. Farklı bir ses seçmez. `famous` kategorisi, kullanıcı özel klonları ve eşleşmeyen sesler kabul edilmez. Sağlayıcı kategorisi ticari lisans/human kalite onayı değildir.

401 yanıtı artık otomatik olarak “anahtar geçersiz” diye yorumlanmaz; güvenli hata kodu ve gereken bilinen izin adı gösterilir. Anahtar/ham hata gövdesi yazdırılmaz.

## Emülatör kontrolü

Pixel 9, Android API 36, `app.duru.prototype` geliştirme derlemesi:

- Profil seçiminde iki sistem demosuna ek olarak Anlatıcı 1 / AI deneme görüldü.
- Yavaş sistem profilindeki p02'den geçiş, ElevenLabs p02 başlangıcı olan 26,006 saniyeye döndü.
- Android Media3 oturumunda `PLAYING` ve 26,006 → 65,143 saniye ilerleme görüldü. Başlık `Kıyıdaki Işık`, sanatçı `AI deneme · Anlatıcı 1`.
- Duraklatıldıktan sonra uygulama süreci kapatılıp yeniden açıldı; Anlatıcı 1 seçimi ve 67,254 saniyelik konum geri yüklendi. Arayüz 1:07 / 3:30 gösterdi ve otomatik oynatmadı.
- Görsel çıktı: `native-test-results/android-elevenlabs.png`.
- TypeScript, 11/11 davranış testi, web paketleme ve web kabul testi geçti. Gerçek yerel API anahtarının byte dizisi `dist/` dosyalarında bulunmadı.

Bu, insan tarafından ses kalitesi veya fiziksel telefon testi değildir. Diğer beş sesin kayıtları henüz üretilmedi. 10–15 dakikalık ortak metin üzerinde sağlayıcı karşılaştırması yapılmadı.

## Deneme ile ticari kurulum

`tts:preview` yalnızca tek anlatıcıyı seçerek geliştirme arayüzünde denemeyi sağlar:

```powershell
npm.cmd run tts:generate -- --narrator eleven-1 --all
npm.cmd run tts:preview -- --narrator eleven-1
npm.cmd run android
```

API anahtarı telefona konmaz; sesler önceden üretilir. Bu dosyalar hazırsa uygulamayı açmak için yeni TTS üretimi gerekmez. Diğer bir seçilmiş ses için `eleven-2` … `eleven-6` kullan. Varsayılan olarak altı tam hikâye birden üretilmez.

Deneme, kalite ve ticari hak onaylarını **true** yapmaz. `stage: preview` profilleri `__DEV__` olmayan arayüzde gösterilmez. Bununla birlikte prototip web paketinde WAV varlığı hâlâ bulunabilir; bu prototip paketini ticari yayımlama. İnceleme tamamlandıktan sonra normal `tts:install` yolunu kullan; yayın öncesi hak/dağıtım/çevrimdışı kapsamı ve hukuki inceleme gerekliliği sürer.

API referansları: [paylaşılan sesler](https://elevenlabs.io/docs/api-reference/voices/voice-library/get-shared), [TTS üretimi](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).
