# Altı anlatıcı arasında ses değiştirme

5 Ekim 2026. Verilen altı Voice ID'nin her biri için özgün `Kıyıdaki Işık` v1.0.0 metninin 8 paragrafı gerçek ElevenLabs API üzerinden hazırlandı. Toplam 48 kayıt var; ilk anlatıcının 8 kaydı önbellekten kullanıldı, kalan 40 istek 14.060 metin karakteri içerdi. Gerçek kredi/para tüketimi sağlayıcı panelinden ayrıca ölçülmelidir.

## Kullanım

Android Studio Device Manager'dan Pixel 9'u aç. Kurulu geliştirme uygulaması için:

```powershell
npm.cmd run android:metro
```

Terminali açık tutup `a` ile Duru'yu aç. Günlük kullanımda doğrudan `npm.cmd run android` de kullanılabilir. İlk kurulum veya native değişiklik gerektiğinde `npm.cmd run android:build` kullan. Tam oynatıcı → **Ses değiştir** → **Anlatıcı 1–6**. Seçimden sonra oynatıcıya dönülür. Sesler anahtarsız yerel varlıklardan oynatılır; mobil uygulamada seçim yapmak TTS üretimi başlatmaz.

AI anlatıcılar ve iki sistem sesi demosu ayrı gruplarda gösterilir. Ses değişimi mevcut paragraf kimliğini hedef kayda eşler ve o paragrafın başına döner; farklı seslerde aynı saniye kullanılmaz. Oynuyorsa yeni ses hazır olduğunda devam eder, duraklatılmışsa duraklatılmış kalır. Hız ve uyku son tarihi korunur. Yeni ses seçimi yükleme sırasında da cihazdaki ilerleme kaydına yazılır. Yüklenirken ikinci bir ses seçmek oynatma isteğini iptal etmez.

## Kayıtlar

- Anlatıcı 1: `GLHtjkeLJ9Rxcv9JhLmh`, 210,187 saniye.
- Anlatıcı 2: `Md4RAnfKt9kVIbvqUxly`, 210,698 saniye.
- Anlatıcı 3: `sqN4QwtcnanCCWx6TTYj`, 226,302 saniye.
- Anlatıcı 4: `J17lijyP1BHYcM7ld0Rg`, 232,571 saniye.
- Anlatıcı 5: `5RqXmIU9ikjifeWoXHMG`, 230,435 saniye.
- Anlatıcı 6: `NNn9dv8zq2kUo7d3JSGG`, 196,534 saniye.

Kimlikler ve paragraf süreleri `assets/audio/elevenlabs-manifest.json` içinde; WAV dosyaları `assets/audio/eleven-N.wav` altında. Sağlayıcı adları ve hak inceleme durumu `docs/rights.json` içinde kayıtlıdır. Özgün hikâye kullanılır; kullanıcı tarafından ses klonlama eklenmedi.

Üretimi veya eklemeyi yeniden çalıştırmak gerekirse:

```powershell
npm.cmd run tts:plan -- --all
npm.cmd run tts:generate -- --all
1..6 | ForEach-Object { npm.cmd run tts:preview -- --narrator "eleven-$_" }
```

Geçerli kayıtlar önbellekten kullanılır. Mevcut plan sonucu: **48 önbellek, 0 yeni istek**. Hatalı tek paragrafı yenileme ve ticari inceleme akışı: [ELEVENLABS.md](ELEVENLABS.md).

## Doğrulama

- `npm.cmd run typecheck`, `npm.cmd test` (11/11), `npm.cmd run build:web` ve `npm.cmd run test:web` geçti.
- İzole test sağlayıcısının altı farklı süreli kaydında 6×6 anlatıcı çifti ve 8 paragrafın tamamı kontrol edildi: hedef paragraf başı, Android milisaniye yuvarlaması, ses/hız/ilerleme geri yükleme. Geçerli 48 kayıt için yeniden üretim yapılmadığı da doğrulandı. Test sesleri ayrı fixture klasörlerinde kalır.
- Pixel 9 API 36 emülatöründe altı gerçek anlatıcı birlikte görüldü. Beş yeni sese sırayla geçildi; p08 etiketi ve duraklatılmış durum korundu. Gösterilen başlangıçlar sırasıyla 3:05, 3:18, 3:25, 3:23 ve 2:54 oldu.
- Anlatıcı 6 üçüncü paragraftan Android Media3 `PLAYING` durumunda açıldı. Dinleme dördüncü paragrafa ilerledikten sonra Anlatıcı 2'ye geçiş, hedef p04 başlangıcı 82,663 saniyede `PLAYING` olarak devam etti. Medya başlığı `AI deneme · Anlatıcı 2` oldu; duraklatma konumu 83,659 saniyeydi.
- Süreç kapatılıp yeniden açıldı: Anlatıcı 2, p04 ve **1:23 / 3:30** geri yüklendi; otomatik oynatmadı.
- Görseller: `native-test-results/android-voices.png`, `native-test-results/android-switch-player.png`. Arayüz incelendi; altı AI seçenek görünür, demo grubu kaydırılarak ulaşılabilir.
- Gerçek yerel API anahtarının byte dizisi `dist/` dosyalarında bulunmadı. Anahtar yalnızca yerel Node üretim komutunda kullanılır.

## Kalan sınırlar

Altı ses **AI deneme** olarak geliştirme arayüzünde kullanılabilir. İnsan dinleme kalitesi ve ticari haklar onaylanmadı; inceleme alanları değiştirilmedi. Üretim arayüzü deneme profillerini gizler, ancak prototip paketinde WAV varlıkları bulunabilir; ticari yayıma hazır değildir. Fiziksel Android/iPhone, uzun arka plan, kesintiler ve erişilebilirlik testleri henüz yapılmadı: [DEVICE-TESTS.md](DEVICE-TESTS.md). 10–15 dakikalık sağlayıcı karşılaştırması bu çalışmanın kapsamında yapılmadı.
