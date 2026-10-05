# Prototip doğrulama raporu

Tarih: **5 Ekim 2026**. Windows çalışma alanında Node 22.23.3 (proje içi), Expo 57.0.26, React Native 0.86.3, TypeScript 7.0.2 ve yerel Chrome ile doğrulandı.

## Geçen kontroller

- `npm run typecheck`: TypeScript hatası yok.
- `npm test`: 11/11 davranış testi geçti. Ortak paragraf üzerinden profil değişimi, paragraf sınırları, Android'in milisaniyeye yuvarladığı konumlar, geçersiz/eski metin sürümünden kayıtların güvenli açılması, kayıt geri yükleme ve Türkçe arama kontrol edildi. ElevenLabs test sağlayıcısıyla PCM doğrulama, anahtarı gizleyen hata akışı, uygun ses kategorileri, aynı ID'nin paylaşılan kütüphaneden doğrulanması, altı ses üretim planı, önbellek, tek paragraf yenileme, geliştirme denemesi ve inceleme gerektiren kurulum akışı da kontrol edildi.
- `npm run audio:verify`: 16 ayrı demo paragrafında WAV/16 bit PCM bütünlüğü ve sessiz olmayan örnekler doğrulandı. Standart profil 195,75 saniye, yavaş profil 244,10 saniye. Birleşik dosyalar ve profil başına başlangıç/süre manifesti üretildi.
- `npm run config:verify`: Expo native config introspection ile iOS `UIBackgroundModes: audio`, Android medya foreground service ve playback izni doğrulandı. Mikrofon izni bulunmadığı kontrol edildi.
- `npm run build:web`: Metro web dışa aktarımı tamamlandı; `dist/` üretildi. Gerçek ses dosyaları pakete dahil.
- `npm run test:web`: katalogdan ayrıntı açma, boş arama, gerçek sesin oynatılması ve ilerlemesi, ±15 saniye atlama, paragraf seçimi, profil değişiminde hedef paragrafın başına dönme, duraklatma, sayfa yeniden açıldıktan sonra kayıtlı konuma 1,5 saniye toleransla devam etme, yer imi, gerçek playbackRate, uyku son tarihinde duraklatma, hikâye tamamlanması, engellenmiş ses isteğinde hata ve yeniden denemeyle toparlanma geçti. Ana akışta tarayıcı JavaScript hatası oluşmadı.
- 1440×1100 masaüstü ve 390×844 mobil görünümde katalog ve oynatıcı ekran görüntüleri incelendi. Mobil yatay taşma kontrolü geçti.
- İlk ElevenLabs anlatıcısıyla 8 paragraf gerçek API üzerinden üretildi. Pixel 9 emülatöründe AI deneme profili, paragraf üzerinden ses değişimi, gerçek oynatma ve süreç yeniden açıldıktan sonra 1:07 konumunun duraklatılmış olarak geri yüklenmesi doğrulandı. Ayrıntılar: [ELEVENLABS-TRIAL.md](ELEVENLABS-TRIAL.md).
- Gerçek yerel API anahtarının byte dizisi web paketindeki dosyalarda bulunmadı. Mobil kod servis anahtarı okumaz.

Uyku testi Playwright'ın hızlandırılmış saatini kullanarak 1 dakikalık son tarihi geçirir; gerçek ses oynatıcısı taklit edilmez. Bu test telefonun uygulamayı askıya alma davranışını ölçmez. Ses oynatma testi gerçek WAV dosyalarını çözümleyip tarayıcı oynatıcısının durum/konumunu kontrol eder; insan dinleme kalitesi testi değildir.

Ekran görüntüleri: `web-test-results/catalog-desktop.png`, `detail-desktop.png`, `player-desktop.png`, `catalog-mobile.png`, `player-mobile.png`. Bunlar yerel yeniden üretilebilir test çıktılarıdır ve git'e dahil edilmez.

## Giderilen işlevsel sorunlar

Web varlıklarının dosya adresi, native varlıkların sayısal kimlik olması ayrı ele alındı. Paragraf seçiminin hemen ardından profil değiştirildiğinde gecikmiş UI durumu yerine gerçek oynatıcı konumu kullanıldı. Kaydın yüklenme sırasında sıfırlanmaması için kaynak kimliği ve hazır durumuna göre restore/persist sıralaması kuruldu. Profil/hız seçili durumu için web ARIA ve native accessibility bilgileri birlikte sağlandı.

## Kalan sınırlar

- Altı ElevenLabs Voice ID yapılandırıldı; ilk ses geliştirme uygulamasında AI deneme olarak kullanılabilir. Diğer beş sesin kayıtları henüz üretilmedi. İnsan dinleme kalitesi ve ticari kullanım hakları doğrulanmadı. Yerel fixture testleri gerçek Türkçe dinleme veya lisans doğrulaması değildir. Akış: [ELEVENLABS.md](ELEVENLABS.md).
- AI deneme profili üretim arayüzünde gizlenir; WAV varlığı prototip paketinde bulunabilir. Ticari yayın için hak incelemesi ve deneme varlıklarının yayın paketinden çıkarılması ya da onaylanmış varlıklarla değiştirilmesi gerekir.

- Android debug derlemesi Pixel 9 emülatörüne kuruldu; native arayüz ve gerçek WAV oynatma doğrulandı. Ayrıntılar: [ANDROID-EMULATOR.md](ANDROID-EMULATOR.md).
- **Gerçek iOS/Android telefon testi yapılmadı.** Fiziksel cihazda ekran kilitli oynatma, medya bildirimi/Control Center, çağrı/kulaklık kesintisi ve VoiceOver/TalkBack sonuçları henüz yok. Ayrı test planı: [DEVICE-TESTS.md](DEVICE-TESTS.md).
- Uyku zamanlayıcısı JavaScript tabanlıdır; arka planda işletim sistemi/sekme kısıtlaması kesin durdurma zamanını geciktirebilir. Uygulama yeniden açılırsa uyku zamanı devam etmez.
- İlerleme yaklaşık saniyede bir yazılır; ani süreç sonlandırmada son yaklaşık bir saniye kaybolabilir. Cihazlar arası senkronizasyon yoktur.
- Web ilk açılışı çevrimdışı desteklenmez. Native paket içinde kayıtlar vardır; telefon uçak modu testi beklenir.
- İki sistem demosunun WAV dosyaları yaklaşık 19,4 MB, ilk AI denemesi yaklaşık 10,1 MB'tır; ticari katalogda doğrulanmış AAC/MP3 ve indirme/cache katmanı gerekir.
- Sistem demosunun doğal AI anlatım kalitesi veya ticari yeniden dağıtım hakkı doğrulanmadı. İlk ElevenLabs sesi üretildi; Türkçe kalite/hak değerlendirmesi ve birden fazla sağlayıcı karşılaştırması tamamlanmadı.
- Çevrimiçi `npm audit` bu kilit dosyasının Expo/React Native araç zincirinde **23 uyarı (7 moderate, 16 high)** bildirdi. Kaynak alt bağımlılıklar arasında `braces`, `node-forge` ve `uuid` var. Kontrol anında npm kayıt sistemindeki son `braces`/`node-forge` sürümleri de etkilenen aralıktaydı. `npm audit fix --force` eski ve uyumsuz Expo/React Native sürümlerine geçmeyi önerdiğinden uygulanmadı. Yayın hazırlığında araç zinciri yamaları yeniden kontrol edilmeli. Çevrimdışı npm komutunun “0 vulnerabilities” çıktısı çevrimiçi audit sonucunu geçersiz kılmaz.

Servis API anahtarı mobil pakette bulunmaz. İlk anlatıcı için gerçek TTS API çağrıları yapıldı; hesap, ödeme, kullanıcı ses klonlama veya mağaza yayını eklenmedi.
