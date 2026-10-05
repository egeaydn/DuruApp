# Android Studio ile geliştirme

Tarih: 5 Ekim 2026. Android Studio 2025.2.2, Pixel_9 AVD, Android API 36, x86_64. Uygulama kimliği: `app.duru.prototype`, Expo 57 / React Native 0.86.3 debug derlemesi.

## Tekrar açma

1. Android Studio → Tools → Device Manager → Pixel 9 yanındaki başlat düğmesi.
2. Duru proje kökünde PowerShell terminali aç.
3. `npm.cmd run android` çalıştır; terminali açık tut. Kurulum ve açılış otomatik yapılır.
4. `App.tsx` veya `src/` dosyalarını kaydet; Fast Refresh değişiklikleri emülatöre taşır.

Android Studio'da native projeyi görmek için File → Open ile `android/` klasörünü seç. Arayüz TypeScript kodu Duru proje kökünde kalır. Native klasör Expo tarafından üretilir ve git'e dahil edilmez.

Uygulama zaten kuruluysa yalnızca `npm.cmd run android:metro` çalıştırıp emülatörde Duru simgesini açmak yeterli. Yeni native bağımlılık veya config plugin değişikliği için yeniden `npm.cmd run android` kullan.

Komut mevcut SDK ve Java'yı süreç kapsamında bulur; bu bilgisayarda SDK `C:\Users\tr\AppData\Local\Android\Sdk`, Java Android Studio'nun `jbr` klasörüdür. Genel sistem ortam değişkenleri değiştirilmedi. Metro yalnızca localhost 8081'de çalışır; web paket önizlemesi localhost 8083'tedir. Expo native CLI `--no-bundler` ile aynı Metro'yu kullanır. `--port` verme.

İlk derleme gerekli Gradle, NDK 27.1.12297006 ve build-tools 36.0.0 indirmeleriyle yaklaşık 11 dakika sürdü; önbellekli son native derleme 15 saniyede geçti. APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Debug APK geliştirme için Metro bağlantısı gerektirir; bağımsız release APK testi yapılmadı.

## Bu oturumda doğrulananlar

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
