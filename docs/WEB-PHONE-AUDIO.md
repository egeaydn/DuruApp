# Aynı sesle web ve Android telefon karşılaştırması

11 Ekim 2026. Amaç emülatördeki cızırtıyı ayırmak; Anlatıcı 1'in mevcut, temizlenmiş WAV dosyası değiştirilmez. ElevenLabs'e yeni üretim isteği gönderilmez. API anahtarı tarayıcıya veya telefona konmaz.

## Bilgisayarda web

```powershell
npm.cmd run web:audio
```

Adres: http://127.0.0.1:8084. Bu **geliştirme** ekranı Anlatıcı 1'i kullanır. Standart `build:web`/`preview:web` yayın paketi sistem demosunu kullandığından bu karşılaştırma için uygun değildir. Emülatörün mevcut Metro'su 8081'de kalır; web için 8084 kullanılır. İlgili terminali açık tut. Web zaten açıksa ikinci sunucuyu başlatma.

Katalogdan hikâyeyi aç. Oynatıcıda **Anlatıcı 1** ve **1×** göründüğünü kontrol et. Aynı paragrafı dinlerken emülatörü ve diğer oynatıcıları duraklat. Mümkünse karşılaştırmalarda aynı kulaklık/benzer ses düzeyi kullan; farklı çıkış cihazı ayrıca kaydedilsin.

Otomatik dosya/oynatma kontrolü:

```powershell
npm.cmd run test:web:audio
```

Bu kontrol gerçek tarayıcı sesini yükler ve oynatır; HTTP'den gelen WAV'ın SHA-256 değerini `assets/audio/elevenlabs-manifest.json` ile karşılaştırır. Anlatıcı 1, 1×, gerçek ilerleme, süre ve duraklatma doğrulanır. Rapor `web-test-results/ai-audio.json`; insan dinleme kalitesi bu otomasyonla onaylanmaz.

**Bu oturum:** otomatik kontrol geçti. Kullanıcı aynı geliştirme web ekranını dinleyip **“Cızırtı yok”** yanıtını verdi; emülatörde cızırtı sürüyor. Bu sonuç emülatör/native ses çıkışı ihtimalini güçlendirir. Bütün kayıtlar veya bütün cihazlarda kusur olmadığı anlamına gelmez; gerçek telefondaki native uygulama testi henüz ayrı yapılmalıdır.

## Android telefonda USB

1. Telefonda Geliştirici seçeneklerini etkinleştir (genellikle Ayarlar → Telefon hakkında → Yapım/Derleme numarasına 7 kez dokun).
2. **USB hata ayıklama** seçeneğini aç. Veri aktarabilen USB kablosuyla bilgisayara bağla; kilidi aç ve bu bilgisayar için hata ayıklama iznini kabul et.
3. Duru proje kökünde `npm.cmd run android:phone` çalıştır. Mevcut native Metro terminali 8081'de açık olmalıdır. Kapalıysa önce `npm.cmd start` kullan.

Komut yalnız fiziksel telefonu seçer; emülatöre kurulum yapmaz. Birden fazla telefon varsa `--serial <cihaz kimliği>` gerekir. Telefon yetkisiz/offline ise işlem başlamaz. Telefonunda Duru kurulu değilse mevcut işlemciye uygun geliştirme APK'sını `adb install -r` ile kurar. 8081 için USB port yönlendirmesini kurup Duru geliştirme bağlantısını açar; uygulama verilerini temizlemez.

Mevcut emülatör APK'sı yalnız `x86_64` içermekteydi. Telefon için ARM64 debug APK ayrıca hazırlanır; yardımcı komut `native-test-results/apk/duru-phone-arm64-debug.apk` dosyasını öncelikli kullanır ve telefonun desteklediği ABI ile karşılaştırır. Uygun APK yoksa `npm.cmd run android:build -- --device` komutunda **fiziksel telefonu** seçerek derle. Expo Go yerine projenin geliştirme APK'sı kullanılır.

Telefon tarayıcısında da aynı web kaydını açmak için:

```powershell
npm.cmd run android:phone -- --web
```

8084 web terminali açık olmalıdır. USB yönlendirmesi telefonun localhost adresini bu bilgisayara bağlar; bağlantı için Wi-Fi/firewall değişikliği veya dışarıya yayın gerekmez. USB kablosunu bağlı tut. Telefonda verilen localhost URL'si USB yönlendirmesi olmadan çalışmaz.

## Dinleme sonucu kaydı

Her ortam için cihaz/OS, paragraf, yaklaşık saniye, 1× hız, çıkış cihazı (hoparlör/kulaklık/Bluetooth) ve cızırtı sonucunu kaydet. Önce telefonun native uygulamasını, gerekirse aynı telefondaki tarayıcıyı karşılaştır. Aynı anda yalnız bir oynatıcı çalsın.

Telefon native uygulaması da temizse emülatör tarafına odaklan; native uygulamada cızırtı varken telefon tarayıcısı temizse native oynatıcı/cihaz ses yolunu ayrıca incele. Mevcut kaydı bu karşılaştırmadan önce yeniden üretme veya daha kuvvetli filtre uygulama.

Kaynaklar: [Android USB hata ayıklama ve ADB](https://developer.android.com/tools/adb), [Expo geliştirme derlemesi kullanımı](https://docs.expo.dev/develop/development-builds/use-development-builds/).
