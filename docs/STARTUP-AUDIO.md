# Expo terminali ve emülatör sesi

5 Ekim 2026 · Windows · Pixel 9 / API 36 · Expo 57.

## Günlük çalıştırma

Emülatörü Android Studio Device Manager'dan aç, proje kökünde çalıştır:

```powershell
npm.cmd run android
```

Expo terminali açık kalır; geliştirme istemcisinin QR kodu ve kısayolları görünür. `a` Android'i açar, `r` yeniler, bu kurulu CLI sürümünde `c` QR kodunu gösterir. Dosyayı kaydetmek Fast Refresh'i tetikler. `Ctrl+C` sonrasında “Stopped server” çıktısını bekle. Alternatif: `npm.cmd start`, ardından `a`; `npm.cmd start -- --android` da kullanılabilir.

İlk native kurulum veya native bağımlılık/config değişikliğinde:

```powershell
npm.cmd run android:build
```

Bu komut Expo prebuild ile üretilen Android klasörünü günceller, APK'yı derler ve kurar. Günlük TypeScript değişikliklerinde bu adım gerekmez. Başka terminalde Metro açıkken native build komutunun başarıyla bitip çıkması normaldir; açık kalan terminal günlük `android` / `start` terminalidir.

## Düzeltilen nedenler

- Önceki `android` komutu native derleme yapıp mevcut Metro'ya bağlanıyordu. Derleme tamamlanınca komut kapanıyor, kullanıcıya ayrı Metro terminali ve QR göstermiyordu. Günlük geliştirme ile native derleme ayrıldı; günlük CLI aynı süreçte terminali yönetir.
- `expo-dev-client` eklendi; `duru` ve `exp+duru` şemaları native projeye uygulandı. Geliştirme APK'sı emülatöre yeniden kuruldu.
- Metro'nun IPv6'da dinleyip emülatöre IPv4 adresi vermesi giderildi. Günlük bağlantı `127.0.0.1:8081` kullanır. QR fiziksel telefondaki Expo Go için değildir; telefon bağlantısı ayrıca yapılandırılmalıdır.
- Android'de önbellekteki WAV hazır olmasına rağmen JavaScript durumunda `isLoaded=false` kalabildiği gözlendi. Hazırlık, native durumdan en fazla 15 saniye boyunca kontrol edilir; kaynak değişimi/eski oynatıcı iptali ayrı ele alınır. Kayıtlı konuma seek sırasında geçici yükleme bildirimi hazırlığı iptal etmez. Hazır olmadan konum üzerine yazılmaz.
- Windows emülatör oturumu G435'e yönlenmiş, %100 ve sessize alınmamıştı. Android medya sesi 5/15'ti; ses düğmeleriyle 10/15'e çıkarıldığı `dumpsys audio` ile doğrulandı. Bu emülatörde `cmd media_session volume --set 10` gerçek düzeyi değiştirmedi; yalnız komutun çıktısına güvenilmedi. Uygulama sistem ses düzeyini değiştirmez.

## Doğrulama

- Yeni native bağımlılıklarla Android debug build başarılı (ilk derleme 6 dk 27 sn; şema güncellemesinden sonraki derleme 1 dk 24 sn). APK kuruldu, yeni şemayla uygulama açıldı.
- `npm.cmd run android -- --offline --clear`: QR, açık kalan terminal, localhost Metro ve emülatörde açılış doğrulandı. `--offline` ağ kontrollerini süreç ortamından kapatır, localhost'u korur.
- Soğuk açılıştan sonra Anlatıcı 3 oynadı; uygulama ekranında süre 1:09'a ilerledi. Anlatıcı 6'ya geçiş, hedef paragrafın başlangıcına (75,232 sn) döndü; oynat/duraklat çalıştı.
- Anlatıcı 6 80,473 sn'de duraklatıldı. Süreç kapatılıp tekrar açıldı; Anlatıcı 6, 4. paragraf ve 1:20 konumu duraklatılmış olarak geri geldi. Yükleme/hata göstergesi kalmadı.
- Windows Core Audio ile emülatörün G435 oturumunda oynarken sıfırdan büyük sinyal ölçüldü (örnek tepe: 0,0668). Aynı WAV'ın Windows'tan doğrudan kısa oynatılmasını kullanıcı duyduğunu doğruladı. **Emülatör sesini kulaklıkta duyma teyidi henüz alınmadı**; sinyal ölçümü insan dinleme teyidi veya anlatım kalitesi değerlendirmesi değildir.
- TypeScript kontrolü, 11/11 mevcut davranış testi, web paketleme ve gerçek tarayıcı kabul testi geçti. `node --check scripts/android.mjs` geçti. Windows sandbox'ındaki `uv_os_get_passwd ENOMEM` test başlatma hatasının ardından aynı testler normal izinlerle geçti.
- Web kabul testi gerçek WAV oynatma, ses değişimi, kaldığı yere dönme, hata/yeniden deneme, hız, paragraf, zamanlayıcı ve tamamlanmayı doğruladı.
- Native yapılandırma kontrolü geçti: iOS background audio, Android medya foreground service, mikrofon izni yok. Son web paketindeki 17 dosyada gerçek yerel API anahtarının byte dizisi bulunmadı; anahtar değeri rapora veya komut çıktısına yazılmadı.

Test Metro oturumu `Ctrl+C` ile kapatıldı ve “Stopped server” doğrulandı. Kullanıcı günlük komutla kendi terminalini açabilir.

Bu oturumda yeni TTS üretimi yapılmadı; önceden üretilen altı AI deneme kaydı kullanıldı. Gerçek Android/iPhone, uzun kilit ekranı oynatma ve ses kesintisi testleri ayrı: [DEVICE-TESTS.md](DEVICE-TESTS.md).

Yerel ekran/diagnostik çıktıları `native-test-results/` içindedir ve git'e eklenmez. Expo terminal davranışının kaynağı: [Expo CLI belgeleri](https://docs.expo.dev/more/expo-cli/); QR kısayolu kurulu CLI çıktısından doğrulandı.
