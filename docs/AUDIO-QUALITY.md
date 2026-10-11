# Emülatörde cızırtı ve oynatma hızı

6 Ekim 2026 · Windows · Pixel 9 / Android API 36 · Expo 57.

## 11 Ekim 2026 — Tek sesle kalite çalışması

Güncel karşılaştırma: aynı Anlatıcı 1 WAV'ı geliştirme web ekranında hash ve 1× oynatma kontrolünü geçti; kullanıcı **“Cızırtı yok”** bildirdi. Emülatörde cızırtı sürüyor. Bu, emülatör/native ses yolu ihtimalini güçlendirir; fiziksel telefon native testi ayrı bekleniyor. Komutlar ve USB bağlantısı: [WEB-PHONE-AUDIO.md](WEB-PHONE-AUDIO.md).

Kapsam mevcut özgün hikâyenin ses kalitesidir. Yeni kitap, katalog API'si veya Sanity eklenmedi. Android/Expo geliştirme sürümünde tek ses **Anlatıcı 1** olur. Ses değiştirme düğmeleri, anlatıcı seçimi ekranı ve oynatıcının profil değiştirme işlemi kaldırıldı. Diğer seslerin ham kayıtları arşivde tutulur; uygulama diğer beş ElevenLabs WAV'ını ve yavaş demo WAV'ını içe aktarmaz.

İnceleme bekleyen AI kaydı yayın derlemesinde otomatik etkinleştirilmez. Standart `build:web` çıktısı tek, etiketli sistem demosu kullanır; Android geliştirme istemcisi Anlatıcı 1 kullanır. Web paketindeki iki ses varlığı alternatiflerdir; aynı anda çalınmazlar. Ticari yayına hazırlık bu çalışmanın kapsamında değildir.

Eski başka bir sesin ilerlemesi, aynı paragraf kimliğiyle tek sesin paragraf başına taşınır. Farklı sesin paragraf içi saniyesi kopyalanmaz. Aynı anlatıcıda paragraf içi konum korunur. Hız, tamamlanma, başlamış olma ve yer imi tercihleri korunur.

### Cızırtıyı ayırma planı

1. Anlatıcı 1'i 1× hızda ve tek aktif oynatıcıyla değerlendir. Aynı metin aralığının ham ve mevcut temizlenmiş örneklerini kullan; ses seviyesini sabit tut.
2. Aynı kısa kaydı Windows, emülatör ve mümkünse fiziksel Android telefonda dinle. Windows'ta da duyulan kusur için kaynak/temizleme tarafını; yalnız emülatörde duyulan kusur için emülatör/oynatma tarafını incele. Cold Boot uygulama verilerini silmeden ayrıca denenebilir.
3. Sorunun duyulduğu paragrafı ve saniyeyi kaydet. Bilinen aralık üzerinde küçük filtre değişikliklerini A/B karşılaştır; telaffuzun ve doğallığın bozulmadığını dinleyerek doğrula. Sayısal ölçüm veya API başarısı dinleme onayı değildir.
4. Temizleme yeterli olmazsa yalnız problemli paragraf için yeni üretim/model ayarını değerlendir. Bu oturumda ücretli üretim yapılmadı. Değişmeyen paragrafları tekrar üretme.

Yeni `npm.cmd run audio:inspect` komutu yalnızca yerel kaydı inceler; kurulu sesleri değiştirmez. Ham metadata/kimlik/hash, işlenmiş hash, birleşik WAV, paragraf başlangıçları ve sürelerini doğrular. Örnekleme, tepe/RMS, tam ölçeğe dayanan örnek sayısı ve en büyük komşu örnek farkını raporlar. Büyük örnek farkı normal konuşmadan da kaynaklanabilir; cızırtının kanıtı değildir.

Karşılaştırma dosyaları 1× hızda eş başlangıç/süreye sahiptir; ses seviyeleri yeniden normalize edilmez:

- `native-test-results/audio-focus/intro-raw.wav` ve `intro-clean.wav`: p01'in ilk 8 saniyesi.
- `native-test-results/audio-focus/transition-p02-raw.wav` ve `transition-p02-clean.wav`: p02 içinde 13,305 saniyeden başlayan 8 saniye; ham kaydın en büyük komşu örnek farkının çevresi.
- Sayısal kayıt: `native-test-results/audio-focus/report.json`. Yerel test çıktıları git'e eklenmez.

### Bu değişikliğin doğrulaması

- TypeScript kontrolü ve standart web paketleme başarılı.
- 14/14 davranış testi başarılı; eski seslerden paragraf bazında taşıma, aynı anlatıcının konumunu koruma ve tek sesle yayın/geliştirme ayrımı kontrol edildi.
- Gerçek WAV ile web kabulü başarılı: tek ses/seçim arayüzünün yokluğu, paragraf seçimi, oynat/duraklat, ±15 saniye, yeniden açılışta devam, yer imi, hız/perde koruması, yükleme sırasında 1× seçimi, zamanlayıcı, tamamlanma ve hata/yeniden deneme.
- Anlatıcı 1'in 8 paragrafı: 24 kHz, mono, 16 bit PCM; toplam 210,187 saniye. Ham ve mevcut temizlenmiş dosyaların örnek sayıları ve biçimleri eşleşiyor. Tam ölçeğe dayanan örnek sayısı her iki kayıtta 0. Bu, kaynakta bozulma olmadığını kanıtlamaz.
- Android emülatörde ayrıntı ve tam oynatıcı açıldı: Anlatıcı 1, 1×, 3:30 süre, Hız/Uyku/Bölümler görünür; ses değiştirme kontrolü yok. Medya kaydı duraklatılmış durumda hazır. Yeni insan dinleme değerlendirmesi veya fiziksel cihaz testi yapılmadı.
- Kullanıcının mevcut Metro terminali korundu; yerel web test sunucusu test sonunda kapatıldı. Native bağımlılık eklenmedi; APK yeniden derlenmedi.

**Sonuç sınırı:** Tek sese geçiş tamamlandı. Mevcut `duru-clean-v1` kaydı değişmedi; cızırtının tamamen çözüldüğü iddia edilmiyor. Önceki kısa örnekte cızırtının azaldığı değerlendirmesi geçerlidir; tam hikâye için yeni dinleme teyidi bekleniyor.

Kaynaklar: [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/), [FFmpeg filtreleri](https://ffmpeg.org/ffmpeg-filters.html#adeclick), [Android Cold Boot](https://developer.android.com/studio/run/emulator-snapshots).

## 6 Ekim — Önceki düzeltmeler

Kullanıcı, doğrudan Windows'tan çalınan Anlatıcı 1'de hızın normal ama hafif cızırtının sürdüğünü; farklı sistem demosunda cızırtı olmadığını bildirdi. Hafif temizlenmiş aynı 8 saniyede **“Cızırtı azaldı, ses doğal”** değerlendirmesini verdi. Bunun üzerine altı anlatıcının 48 paragrafına aynı yerel işlem uygulandı.

FFmpeg ile dürtü temizleme (`adeclick`), hafif gürültü azaltma (`afftdn`, 6 dB) ve ses yükseltmeyen, gecikmesi telafi edilen tepe sınırlama kullanılır. Ham üretim dosyaları değiştirilmez. İşlem çıktıları ham ses hash'i ve filtre sürümüyle önbelleğe alınır; manifest her paragrafın ham ve işlenmiş hash'ini kaydeder. Güncel dinleme kayıtları yeni ses hash'iyle inceleme bekler; tek kısa örneğin değerlendirilmesi tüm anlatıcıların tam kalite onayı sayılmaz.

`src/useListening.ts` yükleme sırasında seçilen en son hızı bir ref içinde tutar. Ses kaynağının hazırlığı bittiğinde ilk render'dan kalan eski hız yerine bu değer uygulanır. Böylece yüklenirken 1× seçilse bile hazırlık sonunda eski 1,75× hızına dönme yarışı engellenir. 1× hâlâ kaydın özgün hızıdır; dosyanın örnekleme başlığı veya hızı değiştirilmez.

Hız ayarlanırken perde koruması açık tutulur; `setPlaybackRate` yüksek kaliteyle çağrılır. Web'de önceki çağrı `preservesPitch=false` yapabiliyordu; bu da 1× dışındaki hızlarda sesin incelmesine/kalınlaşmasına neden oluyordu. Android'in kendi pitch correction mekanizması kullanılır. Bu ayar bir gürültü temizleme filtresi değildir.

Fast Refresh temizliğinde serbest bırakılmış native oynatıcıdan `player.id` okumak hata üretiyordu. Kimlik, nesne hayattayken yakalanır; temizleme ve eski hazırlık işlerini iptal etme bu değerle yapılır.

Pixel 9, `-no-snapshot-load -no-snapshot-save` ile Cold Boot yapıldı. Uygulama verileri ve kayıtlı ilerleme silinmedi. Yeniden aynı localhost Metro'ya bağlandı. Önceki emülatörün ses kayıtlarında çok büyük geçici gecikme değerleri görülmüştü; bunlar tek başına cızırtının kesin nedenini kanıtlamaz.

## Doğrulama

- Altı ElevenLabs WAV dosyası 24.000 Hz / 16 bit PCM olarak doğrulandı; süreler 196,53–232,57 saniye. 48 temizlenmiş paragrafın örnek sayıları ham kaynaklarla birebir aynı; paragraf başlangıçları ve birleşik WAV/manifest hash'leri doğrulandı. TTS üretim ayarları değiştirilmedi, yeni ücretli API isteği yapılmadı.
- Temizleme öncesi Anlatıcı 1'de tam ölçeğe dayanan PCM örneği bulunmadı; en yüksek örnek yaklaşık −0,21 dBFS. Anlatıcı 3'te tam ölçeğe çok yakın 7 örnek vardı. Bu dosya analizi bütün kayıtların insan tarafından temiz/doğal bulunduğu anlamına gelmez; kaynakta oluşmuş bozulmayı perde koruması onarmaz.
- Cold Boot sonrası native medya oturumu Anlatıcı 1 için `speed=1.0` gösterdi. Windows kronometresinde 5,169 saniyede kayıt 5,104 saniye ilerledi (oran 0,987; ADB komut gecikmesi ölçüme dahildir). Bu örnekte 1×'te hızlanma görülmedi.
- Aynı kısa örnek sırasında Android mixer underrun sayaçları sıfırdı. Bu kısa kontrol sürekli ses kalitesi veya farklı yük koşulları testi değildir.
- Gecikmeli gerçek WAV isteğiyle yeni web regresyon testi eklendi: 1,75× kayıt geri yüklenirken dosya bekletilir, kullanıcı 1× seçer, dosya serbest bırakılır. Gerçek `HTMLAudioElement.playbackRate=1`, `preservesPitch=true` ve oynatma ilerlemesi doğrulanır.
- 13/13 test geçti. Yeni testler gerçek FFmpeg ile bilinen tek örneklik dürtünün azalmasını, süre/örnekleme korunmasını, ham kaynağın değişmemesini, önbellek kullanımını, hash/review eşleşmesini, ham kayda eksiksiz geri dönüşü ve hatalı kaynakta kurulumun başlamamasını kontrol eder.
- Son temizlenmiş varlıklarla web kabul testi; oynatma, profil geçişi, devam etme, hata/yeniden deneme, hız, zamanlayıcı ve tamamlanma kontrolleriyle birlikte geçti. TypeScript kontrolü ve web paketleme geçti. Emülatörde temizlenmiş Anlatıcı 1 gerçek `PLAYING / speed=1.0` durumunda gözlendi.
- Son varlıklarda Anlatıcı 6 seçimi aynı paragrafın başına döndü; native `PLAYING / speed=1.0` ve duraklatma doğrulandı. Altı sesin tüm paragrafları insan tarafından dinlenmiş sayılmaz.
- Son web paketindeki 17 dosyada yerel API anahtarının byte dizisi bulunmadı. Kullanıcının Metro terminali korundu; yalnızca bu test için açılan web önizleme sunucusu kapatıldı.

**Dinleme sınırı:** kullanıcı, Anlatıcı 1'in temizlenmiş kısa örneğinde cızırtının azaldığını ve sesin doğal kaldığını doğruladı. Tamamen yok olduğu, bütün paragrafların ve diğer beş sesin dinleme kalitesi doğrulanmadı. Fiziksel telefon testi yapılmadı.

## Yerel ses temizleme komutları

```powershell
# Yalnızca bir paragrafın deneme çıktısını hazırla:
npm.cmd run audio:clean -- preview --narrator eleven-1
# Altı AI deneme kaydını önbellekten hazırla ve kur:
npm.cmd run audio:clean -- install
# Tek anlatıcıyı kur veya ham kaydına dön:
npm.cmd run audio:clean -- install --narrator eleven-1
npm.cmd run audio:clean -- restore --narrator eleven-1
```

FFmpeg yalnızca geliştirici aracıdır; mobil uygulama içine eklenmez. Ham kaynaklar `generated-audio/<anlatıcı>/<kitap>/<metin sürümü>/` altında bu bilgisayarda korunur; bu klasör git'e dahil değildir. Geri dönüş/yeniden temizleme için ham üretim dosyaları ve metadata gerekir. Temizlenmiş oynatma dosyaları `assets/audio/` içindedir ve anahtarsız oynar.

Yeni bir paragraf gerçek TTS ile yeniden üretilirse önce normal `tts:preview` akışıyla ham anlatıcı manifestini güncelle, sonra `audio:clean install --narrator ...` çalıştır. Değişmeyen paragrafların temizlenmiş önbelleği tekrar kullanılır.

## Tekrar deneme

Mevcut Expo terminalinde `r` ile yenile; uygulamada **Hız → 1×** seç. Hızı tercihine göre azaltmak için **0,75×** de kullanılabilir. Bu seçim dosyanın özgün 1× hızını yeniden tanımlamaz.

Emülatör cızırtısı tekrar ederse Android Studio → **Device Manager → Pixel 9 → menü → Cold Boot** kullan. **Wipe Data** kullanma; bu sorun için kayıtlı ilerlemeyi silmek gerekmez. Metro açık değilse proje terminalinde:

```powershell
npm.cmd run android
```

Metro zaten açıksa ikinci sunucuyu başlatma; `a` uygulamayı tekrar açar. Bu değişiklikler TypeScript'tedir; yeniden native APK derlemesi gerekmez.

Kaynaklar: [Android snapshot / Cold Boot belgeleri](https://developer.android.com/studio/run/emulator-snapshots), [emülatör komut seçenekleri](https://developer.android.com/studio/run/emulator-commandline), [Expo Audio hız ve perde koruması](https://docs.expo.dev/versions/latest/sdk/audio/). SDK davranışı ayrıca kurulu `expo-audio` kaynaklarından kontrol edildi.

Yerel dürtü temizleme filtresinin kaynağı: [FFmpeg adeclick](https://www.ffmpeg.org/doxygen/8.1/af__adeclick_8c_source.html). Filtre kullanılması tek başına doğal anlatım kalitesini kanıtlamaz.
