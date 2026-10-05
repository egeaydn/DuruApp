# Gerçek telefon test raporu

Tarih: 5 Ekim 2026. Durum: **FİZİKSEL TELEFONDA ÇALIŞTIRILMADI**. Bu oturumda Android/iOS telefonuna erişilmedi. Android debug derlemesi yalnızca Pixel 9 emülatörüne kuruldu: [ANDROID-EMULATOR.md](ANDROID-EMULATOR.md). Emülatör ve web testleri fiziksel telefon testinin yerine geçmez.

Her test için cihaz modeli, işletim sistemi sürümü, uygulama commit/versiyonu, derleme türü, saat, sonuç ve hata kaydını ekle. iOS ve Android sonuçlarını ayrı kaydet.

1. Geliştirme derlemesini telefona kur. Uygulamada mikrofon izni istemediğini kontrol et. Katalogdan hikâyeyi aç ve gerçek WAV kaydını dinle.
2. Oynat/duraklat, ileri/geri 15 saniye, tüm paragraflar, bölüm geçişleri, 0.75×/1×/2× hız ve tamamlandıktan sonra yeniden başlama.
3. Bir paragrafın ortasında profil değiştir. Aynı paragrafın hedef kaydının başına gittiğini dinleyerek ve arayüzden doğrula. Hızlı ardışık profil değişikliklerinde eski sesin devam etmediğini kontrol et.
4. Duraklat, uygulamayı kapat ve yeniden aç. Profil, hız, paragraf, paragraf içi konum ve yer imi geri gelmeli; ses kendiliğinden başlamamalı.
5. En az 10 dakika arka planda/ekran kilitliyken oynat (kısa hikâyeyi yeniden başlatmak gerekebilir). Bu prototipin tek kaydı 3–4 dakika olduğundan uzun kesintisiz test için geçici özgün uzun fixture gerekir. Android medya bildiriminde ve iOS Control Center/kilit ekranında başlık, profil, oynat/duraklat ve seek kontrollerini doğrula.
6. Telefon çağrısı, başka uygulamanın sesi, kulaklık/Bluetooth ayrılması ve tekrar bağlanması. İşletim sisteminin duraklatmasını doğrula; uygulama kesinti sırasında zorla yeniden başlatmamalı.
7. Ön planda 1 dakikalık uyku zamanlayıcısını gerçek süreyle dene. Sonra ekran kilitliyken dene ve olası gecikmeyi ayrı kaydet. Arka planda kesin durdurma bu sürümde garanti edilmez.
8. Native derleme kurulu ve sesler hazırken uçak modunda katalog/ses oynatma ve yeniden açılış. Web için ilk açılış çevrimdışı desteklenmez.
9. VoiceOver/TalkBack, büyük sistem yazıları, küçük ekran ve telefonun alt güvenli alanı. Buton adları, profil seçili durumu ve konum kontrolünü dene.
10. Bozuk ilerleme kaydı ve depolama hatası; uygulamanın anlaşılır mesaj vermesi ve kullanılabilir kalması.

Yayın öncesi aynı matris release/internal testing derlemelerinde de çalıştırılmalı. Geliştirme derlemesinin başarılı olması mağaza derlemesindeki davranışı kanıtlamaz.
