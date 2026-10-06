# Duru

Türkçe, sakin bir sesli kitap deneyimi için React Native + Expo SDK 57 + TypeScript prototipi. Anahtarsız demo çalışır. ElevenLabs için yerel `.env` kullanan paragraf bazında üretim ve anlatıcı kurulum akışı eklendi. Altı Voice ID'nin tam hikâye kayıtları **AI deneme** olarak hazır; oynatıcıdaki **Ses değiştir** ile ortak paragraf üzerinden geçiş yapılır. Pixel 9 emülatöründe doğrulandı: [docs/VOICE-SWITCH.md](docs/VOICE-SWITCH.md). Kurulum: [docs/ELEVENLABS.md](docs/ELEVENLABS.md). Üyelik, ödeme ve mağaza yayını yoktur.

## Çalıştırma

Node 22.13+ gerekir. Bu proje, mevcut bilgisayardaki eski Node sürümüne müdahale etmeden geliştirme bağımlılığı olarak Node 22.23.3 içerir. `npm run` komutları proje içindeki sürümü kullanır. Kilit dosyasıyla temiz kurulum:

```powershell
npm.cmd ci
npm.cmd run web
```

Windows PowerShell'de `npm.ps1` yürütme ilkesi engeline takılmamak için `npm.cmd` kullanılır. macOS/Linux'ta aynı komutlar `npm` ile çalışır.

Android geliştirme istemcisi kuruluysa günlük kullanım:

```powershell
npm.cmd run android
```

Bu komut Expo terminalini açık tutar, geliştirme derlemesine ait QR kodunu gösterir ve emülatörde uygulamayı açar. `a` Android'i açar, `r` yeniler, `c` QR kodunu gösterir, `Ctrl+C` sunucuyu kapatır. Yalnızca sunucu için `npm.cmd start`, sonra `a` kullan. `npm.cmd start -- --android` da aynı akışı açar. Tek Metro terminali açık tut; mevcut sunucuyu kapatırken “Stopped server” çıktısını bekle.

İlk kurulum veya native bağımlılık/config değişikliği için `npm.cmd run android:build` kullan. Bu işlem Expo prebuild ile üretilen `android/` klasörünü günceller ve native APK'yı kurar. Günlük TypeScript değişikliklerinde yeniden native derleme gerekmez. Bağlantı localhost üzerinden emülatöre yönlendirilir; bu QR kodu fiziksel telefonda Expo Go bağlantısı değildir. Ayrıntılar: [docs/ANDROID-EMULATOR.md](docs/ANDROID-EMULATOR.md).

Hazır web paketini yerel olarak açmak için:

```powershell
npm.cmd run build:web
npm.cmd run preview:web
```

Adres: http://127.0.0.1:8083. Sunucu WAV için HTTP Range isteklerini destekler. Web sürümünün ilk açılışında uygulama ve font dosyalarının yüklenmesi gerekir; web için çevrimdışı PWA kurulumu yoktur. Native uygulamada demo sesleri paket içindedir.

## Prototipte neler var?

- Tek özgün hikâye: **Kıyıdaki Işık**, 4 bölüm, 8 paragraf; uygulama içinde çizilmiş özgün SVG kapak.
- Katalog, Türkçe harf duyarlı arama, boş sonuç, kitap ayrıntısı, kitaplık ve yer imi.
- Gerçek paketlenmiş WAV dosyalarıyla oynat/duraklat, ±15 saniye, dokunarak konum seçimi, paragraf seçimi, 0.75–2× hız, uyku zamanlayıcısı, tamamlanma ve yeniden dinleme.
- Dengeli ve yavaş okuma **aynı Microsoft Tolga Türkçe sistem sesinin iki demo ritmidir**. Doğal AI anlatıcı veya farklı kişi gibi sunulmaz. Kullanıcıdan mikrofon erişimi istenmez.
- İlerleme, profil, hız ve yer imi AsyncStorage ile cihazda saklanır. Yeniden açılışta konum geri yüklenir; kullanıcı oynatmaya basana kadar ses başlamaz.
- Yükleme göstergesi, ses hatası, yeniden deneme ve depolama hatası mesajları.
- Mobil ve geniş ekran düzeni, Türkçe kontrol etiketleri, profil/hız için seçili durum semantiği, büyüyebilen yazılar ve SVG kapak.

## Ses ve paragraf eşlemesi

6 Ekim'de altı AI deneme kaydına yerel cızırtı temizleme uygulandı; ham üretimler saklandı, süre ve paragraf başlangıçları korundu. Yüklenirken değiştirilen hızın 1× etiketiyle eşleşmesi ve perde koruması da düzeltildi. Dinleme sonucu, temizleme/geri dönüş komutları ve kalan kalite sınırları: [docs/AUDIO-QUALITY.md](docs/AUDIO-QUALITY.md).

`content/story.json` özgün metni ve kalıcı `p01`…`p08` kimliklerini içerir. `assets/audio/<profil>/<paragraf>.wav` ayrı paragraf kayıtlarıdır. `assets/audio/manifest.json`, metin sürümünü, sistem sesi kimliğini, dosya hashlerini ve her profilin **kendi** paragraf başlangıç/sürelerini tutar.

`npm run audio:verify`, 16 bit PCM başlıklarını, verinin bütünlüğünü ve sessiz olmadığını kontrol eder; ardından her profilin paragraf dosyalarını birleştirerek kesintisiz WAV oynatma dosyasını ve manifesti oluşturur. Bu sayede paragraf geçişlerinde JavaScript'in arka planda çalışmasına ihtiyaç duyulmaz. Dosya doğrulaması telaffuz veya doğal anlatım kalitesini kanıtlamaz.

Profil değişiminde oynatıcının gerçek konumundan mevcut paragraf kimliği bulunur; hedef profilin aynı paragrafının **başına** gidilir. Aynı saniye kopyalanmaz. Bu davranış arayüzde açıklanır. İlerleme kaydı `bookId + textVersion + profile + paragraphId + offset` içerir. Farklı metin sürümünden veya bozuk kayıtlar güvenli başlangıca döner. Konum yaklaşık her saniye ve duraklatma/durum değişiminde yazılır; ani süreç sonlandırmada son yaklaşık bir saniye kaybolabilir.

Demo kayıtlarını yeniden üretmek için Windows'ta Microsoft Tolga sistem sesi kurulu olmalıdır. Uygulamayı kullanmak için ses üretmek veya bu sesi telefona kurmak **gerekmez**; WAV dosyaları zaten projededir.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/generate-demo.ps1
npm.cmd run audio:verify
```

Hatalı tek paragrafı üretme ve önbellek ayrıntıları `scripts/generate-demo.ps1` içindedir. Demo sistem sesinin ticari dağıtım hakları doğrulanmamıştır; ticari yayın öncesi lisanslı anlatıcı kaydıyla değiştirilmelidir. Kaynak/hak kayıtları: [docs/rights.json](docs/rights.json).

Örneğin yalnızca dengeli profildeki üçüncü paragrafı tekrar üretmek:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/generate-demo.ps1 -ParagraphId p03 -ProfileId demo-standard -Force
npm.cmd run audio:verify
```

Üretim komut dosyası metin sürümü, paragraf metni/kimliği, ses ve hızın hash'ini yan dosyada saklar. Aynı kimlik/hash için geçerli kayıt varsa yeniden üretmez. Metin değişince hash değişir; değişen paragraf üretilir. Bu önbellek demo içindir; gerçek sağlayıcı üretimi bu aşamaya dahil değildir.

## Doğrulama

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run audio:verify
npm.cmd run config:verify
npm.cmd run build:web
```

Web kabul testi için ayrı terminalde `npm run preview:web` açıkken:

```powershell
npm.cmd run test:web
```

Test yerel Google Chrome kullanır; Chrome yoksa `scripts/smoke-web.mjs` içindeki tarayıcı kanalı uyarlanmalıdır. Test, `window.Audio` oluşturucusunu izler; ses oynatma işlevini taklit etmez. Gerçek WAV yüklenir ve gerçek tarayıcı oynatıcısının konumu kontrol edilir. Zamanlayıcı testi yalnızca saati hızlandırır. Ekran görüntüleri `web-test-results/` altında üretilir.

Son sonuçlar, ortam kısıtları ve test kapsamı: [docs/VERIFICATION.md](docs/VERIFICATION.md). Pixel 9 emülatör kurulumu ve native testler: [docs/ANDROID-EMULATOR.md](docs/ANDROID-EMULATOR.md). Fiziksel telefon testleri ayrı ve **henüz çalıştırılmadı**: [docs/DEVICE-TESTS.md](docs/DEVICE-TESTS.md).

## Telefon geliştirme derlemesi

Android için Android SDK/JDK ve bağlı telefon; iOS için macOS, Xcode, imzalama ve bağlı iPhone gerekir:

```sh
npm run android:build
# Bağlı fiziksel Android telefonunu seçmek için:
npm run android:build -- --device
# macOS:
npx expo run:ios --device
```

Android Studio'da **Tools → Device Manager** üzerinden Pixel 9 gibi bir sanal cihazı başlat. İlk native kurulum için `npm.cmd run android:build`, günlük açık kalan Expo terminali için `npm.cmd run android` kullan. `App.tsx` ve `src/` dosyalarını kaydettikçe Fast Refresh ile emülatörde değişiklikleri takip edebilirsin. Android Studio'dan native projeyi incelemek için üretilen `android/` klasörünü aç; React Native arayüz kodunun kaynağı bu klasörün dışındaki TypeScript dosyalarıdır.

`scripts/android.mjs`, mevcut SDK ve geçerli Java yolunu süreç için bulur; Windows'ta gerekirse Android Studio'nun JBR'ını kullanır. Genel ortam değişkenlerini değiştirmez. Native Metro varsayılanı 8081'dir; web önizlemesi 8083'de kalır. Farklı SDK kurulumu için `ANDROID_HOME` belirt. İlk native derleme Gradle/Android bağımlılıklarını indirdiğinden daha uzun sürer. Sonraki yalnızca TypeScript değişiklikleri için `npm.cmd run android:metro` kullanıp emülatörde kurulu Duru'yu açabilirsin. Native bağımlılık veya `app.json` eklentisi değişirse `npm.cmd run android:build` ile yeniden derle.

`app.json` içindeki expo-audio eklentisi iOS `UIBackgroundModes: audio` ve Android medya oynatma foreground service yapılandırmasını üretir. Oynatıcı `shouldPlayInBackground`, `playsInSilentMode`, `doNotMix` kullanır; oynatma başladığında native kilit ekranı kontrollerini kitap/profil bilgileriyle etkinleştirir. Ayrıntılar için [Expo Audio belgeleri](https://docs.expo.dev/versions/v57.0.0/sdk/audio/).

**Uyku zamanlayıcısı sınırlaması:** uygulama açıkken çalışır. JavaScript zamanlayıcısı telefonun arka planda uygulamayı askıya alması veya tarayıcının sekmeyi kısıtlaması durumunda gecikebilir; uygulama etkinleşince geçmiş son tarih kontrol edilir. Arka planda kesin zamanda durdurma ticari sürümde native zamanlayıcı ve gerçek cihaz testleri gerektirir. Uyku zamanı yeniden açılışta devam etmez.

## Sonraki aşama

Gerçek ses üretimi ve yayın hazırlığı için [docs/NEXT-STAGES.md](docs/NEXT-STAGES.md) yol haritası vardır. Bu aşamalar uygulanmış veya ticari ses hakkı doğrulanmış değildir. Mobil paket ya da `EXPO_PUBLIC` değişkenleri içine hiçbir servis anahtarı koyma.

