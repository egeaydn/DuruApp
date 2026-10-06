# Android Studio ile geliştirme

Tarih: 5 Ekim 2026. Android Studio 2025.2.2, Pixel_9 AVD, Android API 36, x86_64. Uygulama kimliği: `app.duru.prototype`, Expo 57 / React Native 0.86.3 debug derlemesi.

## Tekrar açma

1. Android Studio → Tools → Device Manager → Pixel 9 yanındaki başlat düğmesi.
2. Duru proje kökünde PowerShell terminali aç.
3. Kurulu geliştirme istemcisi için `npm.cmd run android` çalıştır; QR ve kısayolları gösteren Expo terminalini açık tut. Uygulama otomatik açılır.
4. `App.tsx` veya `src/` dosyalarını kaydet; Fast Refresh değişiklikleri emülatöre taşır.

Android Studio'da native projeyi görmek için File → Open ile `android/` klasörünü seç. Arayüz TypeScript kodu Duru proje kökünde kalır. Native klasör Expo tarafından üretilir ve git'e dahil edilmez.

Yalnızca sunucuyu açmak için `npm.cmd start` veya `npm.cmd run android:metro`, ardından `a` kullan. İlk kurulum, yeni native bağımlılık veya config plugin değişikliği için `npm.cmd run android:build` kullan. TypeScript arayüz değişiklikleri günlük `android` komutuyla yüklenir. `android:build` native derleme komutudur; başka terminalde Metro varsa kurulumdan sonra biter.

Komut mevcut SDK ve Java'yı süreç kapsamında bulur; bu bilgisayarda SDK `C:\Users\tr\AppData\Local\Android\Sdk`, Java Android Studio'nun `jbr` klasörüdür. Genel sistem ortam değişkenleri değiştirilmedi. Metro yalnızca localhost 8081'de çalışır; web paket önizlemesi localhost 8083'tedir. `duru` / `exp+duru` bağlantı şemaları ve `expo-dev-client` geliştirme istemcisi kullanılır. Native kurulum komutu aynı Metro'ya `--no-bundler` ile bağlanır. İki Metro sunucusu başlatma; önceki terminalde Ctrl+C sonrası “Stopped server” çıktısını bekle.

`npm.cmd run android -- --offline`, ağ doğrulamalarını `EXPO_OFFLINE` ile kapatır ve localhost bağlantısını korur. Metro önbelleği hata verirse bir defa `npm.cmd run android -- --clear` kullan. Günlük Metro iki worker ile çalışır. QR bağlantısı bu bilgisayardaki geliştirme derlemesi içindir; fiziksel telefon bağlantısı ayrıca yapılandırılmalıdır.

## Ses duyulmazsa

Cızırtı veya 1× hız şikâyeti için 6 Ekim incelemesi: [AUDIO-QUALITY.md](AUDIO-QUALITY.md). Snapshot'tan devam eden emülatör için Device Manager'da **Cold Boot** denenebilir; bu işlem Wipe Data gerektirmez.

Süre ilerliyorsa önce emülatörün **medya** sesini, Windows Ses düzeyi karıştırıcısındaki `qemu-system-x86_64` / Android Emulator oturumunu ve bu oturumun çıkış cihazını kontrol et. Zil sesi veya Windows ana ses seviyesi tek başına yeterli değildir. Son kontrolde emülatör G435 Wireless Gaming Headset'e yönleniyordu; Windows oturumu %100 ve sessize alınmamıştı. Android medya sesi 5/15'ten 10/15'e çıkarıldı. Aynı gerçek WAV, Windows'tan doğrudan oynatılınca kullanıcı tarafından duyuldu. Sinyal/oynatıcı durumu incelemesi, kullanıcı tarafından emülatör sesinin duyulduğunu doğrulama yerine geçmez.

İlk derleme gerekli Gradle, NDK 27.1.12297006 ve build-tools 36.0.0 indirmeleriyle yaklaşık 11 dakika sürdü; önbellekli son native derleme 15 saniyede geçti. APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Debug APK geliştirme için Metro bağlantısı gerektirir; bağımsız release APK testi yapılmadı.

## Bu oturumda doğrulananlar

Güncel Expo terminali, native build ve G435 ses incelemesi: [STARTUP-AUDIO.md](STARTUP-AUDIO.md). Aşağıdaki maddeler ilk prototipin tarihsel emülatör testlerini içerir.

- Native Gradle build başarılı, uygulama Pixel 9 emülatörüne kuruldu ve açıldı.
- Türkçe katalog ve tam oynatıcı, fontlar ve SVG kapak görüntülendi.
- Gerçek WAV Android Media3 oynatıcısında çözümlendi; medya oturumunda `PLAYING`, ilerleyen konum ve hikâye/profil başlığı gözlendi. Bu, insan tarafından ses kalitesi değerlendirmesi değildir.
- Duraklatma ve 15 saniye geri atlama kontrol edildi.
- Uygulama süreci kapatılıp yeniden açıldı; yavaş profil ve 229,105 saniye (3:49) konumu geri geldi. Medya oturumu `PAUSED` kaldı, ses otomatik başlamadı.
- Dengeli profilde p04 içinden yavaş profile geçiş, hedef p04 başlangıcı olan 92,520 saniyeye döndü. Android konumu tam milisaniyeye yuvarladığından yanlış önceki paragraf etiketini gösteren sınır hatası giderildi; ek davranış testi geçti.
- Sistem medya oynat komutu uygulama arka plandayken çalıştı; kısa kalan kayıt sonuna kadar ilerledi. Bu, uzun ekran kilidi testi değildir.
- Ekran çıktısı: `native-test-results/android-player.png`. Test çıktıları git'e dahil edilmez.

İlk Metro oturumunda asset isteği zaman aşımına uğradı. Yalnızca localhost Metro yeniden başlatılınca aynı WAV isteği başarıyla tamamlandı. Tekrar yaşanırsa Metro'yu Ctrl+C ile kapat, `npm.cmd run android:metro` ile yeniden başlat ve Duru'yu tekrar aç.

TypeScript kontrolü, 6/6 model testi, web paketleme ve web kabul testi son değişikliklerden sonra geçti. Windows sandbox içinde test çalıştırıcısının kullanıcı bilgisi sorgusu `uv_os_get_passwd ENOMEM` verdi; aynı test normal kullanıcı ortamında geçti.

Fiziksel Android/iPhone, uzun süreli arka plan, kilit ekranı düğmelerine dokunma, ses kesintileri, erişilebilirlik ve release/uçak modu testleri bekliyor: [DEVICE-TESTS.md](DEVICE-TESTS.md). [Expo Audio belgeleri](https://docs.expo.dev/versions/latest/sdk/audio/) native arka plan yapılandırmasının kaynağıdır.
