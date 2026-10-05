# ElevenLabs anlatıcı entegrasyonu

5 Ekim 2026. Altı Voice ID `.env` / `.env.example` içine tanımlandı. İlk sesle 8 paragrafın gerçek ElevenLabs kayıtları üretildi ve Android emülatöründe AI deneme profili olarak oynatıldı. Diğer beş ses, ticari haklar ve dinleme kalitesi henüz doğrulanmadı. Sonuçlar: [ELEVENLABS-TRIAL.md](ELEVENLABS-TRIAL.md).

## Anahtar

Sohbette paylaşılan anahtar yerel dosyaya kaydedilmedi. ElevenLabs panelinde bu anahtarı iptal edip yenisini oluştur. Yeni değeri proje kökündeki `.env` dosyasında yalnızca şu alana yaz:

```dotenv
ELEVENLABS_API_KEY=YENI_ANAHTAR
```

`EXPO_PUBLIC_` öneki kullanma. `.env` git dışında kalır. Anahtar yalnızca Node geliştirme komutuyla `xi-api-key` başlığında ElevenLabs'e gönderilir; mobil arayüz ve oynatıcı servis çağrısı yapmaz. Mobil paket yalnızca onaylanmış ses varlıklarını alır. `.env.example` gerçek anahtar içermez. `.env` dosyasını paylaşma.

Sesler sırasıyla `eleven-1` … `eleven-6` kimliklerine eşlenir. `ELEVENLABS_VOICE_N_LABEL` alanından kullanıcıya gösterilecek adı değiştirebilirsin; şu an adlar **Anlatıcı 1–6**, sağlayıcının gerçek isimleri değildir. Model varsayılanı `eleven_multilingual_v2`.

## Önce kısa örnek

```powershell
# Hesabının erişebildiği uygun sesleri listele (üretim yapmaz):
npm.cmd run tts:voices

# Altı seste p01 üretim planı; anahtar ve API çağrısı gerekmez:
npm.cmd run tts:plan

# Önce bir anlatıcıda tek paragrafı üret:
npm.cmd run tts:generate -- --narrator eleven-1 --paragraph p01

# Altı anlatıcıda aynı ilk paragrafı üret:
npm.cmd run tts:generate
```

İlk paragraf 349 metin karakteridir; altı sesle 6 yeni üretim isteği ve toplam 2.094 karakter. Bu, para veya kredi fiyatı hesabı değildir. Gerçek fiyatı hesabın modeli, planı ve sesin özel ücretleri belirler; panelden doğrula. Varsayılan komut tam hikâyeyi üretmez. Herhangi bir API hatasında otomatik ücretli yeniden deneme yapılmaz; zaman aşımından sonra sağlayıcı geçmişini kontrol et.

Kayıtlar `generated-audio/eleven-N/kiyidaki-isik/1.0.0/` altında WAV ve metadata olarak tutulur. Dosyaları yerel ses oynatıcısında dinle. Doğallık, Defne/Nermin telaffuzu, duygu, hız ve tutarlılığı değerlendir. Başarılı API çağrısı kalite onayı değildir.

API önce modelin Türkçe TTS desteğini ve ses kimliğine erişimi kontrol eder. Hazır sesler, Voice Design ve sağlayıcının yayınlanmış/onaylı Voice Library anlatıcıları desteklenir. Kullanıcı tarafından klonlanan özel sesler ve izinsiz taklit kapsam dışıdır. Sağlayıcı kategori bilgisi tek başına ünlü taklidi olmadığını veya ticari hakkı kanıtlamaz; ayrıca insan incelemesi gerekir.

## Tam hikâye ve tek paragraf yenileme

```powershell
# Yalnızca seçilen anlatıcıda 8 paragraf:
npm.cmd run tts:plan -- --narrator eleven-1 --all
npm.cmd run tts:generate -- --narrator eleven-1 --all

# Altı anlatıcıda toplam 48 paragraf için önce maliyet kapsamını gör:
npm.cmd run tts:plan -- --all
npm.cmd run tts:generate -- --all

# Hatalı p04'ü yalnızca bir anlatıcı için tekrar üret:
npm.cmd run tts:generate -- --narrator eleven-1 --paragraph p04 --force
```

Tam hikâye altı sesle 16.872 metin karakteridir. Metin/sürüm, paragraf, anlatıcı/Voice ID, model, ayarlar, önceki/sonraki metin ve ses dosyası hash'i önbellek kimliğine dahildir. Aynı geçerli kayıt tekrar üretilmez. Metin değişikliği komşu paragrafın bağlamını da değiştirirse ilgili önbellek geçersiz olur. `--force` tek paragraf seçimi gerektirir. Ses süreleri PCM örneklerinden ölçülür; farklı seslerde aynı saniye aynı metin kabul edilmez.

Ses çıktısı `pcm_24000` alınır ve mono 16 bit WAV başlığı eklenir. PCM biçimi, bütünlük, süre ve sessizlik kontrol edilir. Metadata süre, üretim gecikmesi, karakter sayısı ve hash içerir; hesapta tüketilen gerçek krediler ayrıca sağlayıcı panelinden ölçülmelidir. Akışta istek gövdesi, anahtar ve ham sağlayıcı hata gövdesi günlüğe yazılmaz.

## Uygulamada etkinleştirme

Kullanıcı yerel emülatör denemesi istediğinde `npm.cmd run tts:preview -- --narrator eleven-1` komutuyla, tam hikâyesi hazır olan tek ses geliştirme arayüzünde **AI deneme** etiketiyle dinlenebilir. Kalite ve hak onayı verilmez; demo profilleri korunur. `__DEV__` olmayan arayüzde deneme profili görünmez; prototip çıktı dosyaları yayıma hazır sayılmaz.

Normal/ticari anlatıcı kurulumunda ilk ürün talebindeki dinleme ve ticari hak doğrulaması `tts:install` öncesinde tamamlanmalıdır.

Her anlatıcının `generated-audio/.../review.json` kaydında:

- `identityVerified`: ses kimliğini, kaynağını ve taklit içermediğini doğruladıktan sonra `true`.
- `commercialUseVerified`: hesabın planı ve o sesin ticari kullanım koşulları doğrulandıktan sonra `true`.
- `rightsEvidence`: plan/ses lisansının belge veya kaynak kaydı; AI seslendirme, dijital dağıtım, süre, bölge ve çevrimdışı kapsamı kaydet.
- `reviewedAt`: inceleme tarihi.
- Her paragrafta `accepted`: dosyayı dinleyip uygun bulduktan sonra `true`; `notes` alanında değerlendirme. `audioHash` mevcut dosyanın hash'iyle aynı olmalı.

Bu alanlar API tarafından otomatik onaylanmaz. Ücretli hesap sahibi olmak tek başına seçilen her sesin tüm kullanım haklarını kanıtlamaz. Yayın öncesi hukuki inceleme gerekliliği devam eder.

```powershell
npm.cmd run tts:install -- --narrator eleven-1
npm.cmd run typecheck
npm.cmd run android
```

Kurulum 8 paragrafın tamamını, kimlik/önbellek eşleşmesini ve kayıtlı incelemeyi doğrular; birleştirilmiş WAV, süre manifesti ve statik `require` dosyasını üretir. Onaylı anlatıcı **Profil** seçiminde ElevenLabs AI sesi olarak görünür. Demo sistem sesleri ayrı etiketlenir. Profil değişimi aynı paragrafın hedef sesteki başına döner. Sonraki sesleri `eleven-2` … `eleven-6` için aynı şekilde ekle. `install` API anahtarı veya yeni üretim çağrısı gerektirmez.

Uygulama varlıkları: `assets/audio/elevenlabs-manifest.json`, `assets/audio/eleven-N.wav`, `assets/audio/eleven-N/rights-and-review.json`, `src/elevenlabsSources.ts`. Tam WAV'lar prototipte büyüktür; yayın aşamasında sıkıştırılmış dosya/indirme katmanı gerekir. Aynı Voice ID kaydı yeniden üretildiğinde mevcut dinleme ilerlemesi aynı paragraf kimliğini kullanır; paragraf içi eski konum yeni sürede sınırlanır.

## Doğrulama sınırı

Yerel test sağlayıcısı ile altı ses yapılandırması, ilk paragraf üretimi, önbellekle ikinci çağrının üretim yapmaması, tam hikâye, tek paragraf yenileme, eksik dinleme/hak kaydının reddedilmesi ve statik uygulama varlığı kurulumunu test ediyoruz. Test sesleri sentetik ton fixture'larıdır; gerçek ElevenLabs veya doğal Türkçe ses kalitesi testi değildir. Fixture'lar yalnızca `native-test-results/tts-*` içindeki ayrı projelere yazılır; uygulamanın gerçek kataloğuna eklenmez.

Kaynaklar: [TTS endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [ses listeleme](https://elevenlabs.io/docs/api-reference/voices/search), [modeller](https://elevenlabs.io/docs/api-reference/models/list). ElevenLabs, ücretsiz planın ticari lisans içermediğini bildirir: [yayın/ticari kullanım koşulları](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform).
