# Gerçek ses ve ticari sürüm — sonraki aşama

5 Ekim 2026: Kullanıcı ilk etapta yalnızca anahtarsız prototipi seçti. Sağlayıcı API çağrısı, ücretli ses üretimi, 10–15 dakikalık karşılaştırma veya ticari lisans doğrulaması yapılmadı. Aşağıdaki maddeler sonraki aşamanın iş tanımıdır.

## Gerçek TTS değerlendirmesi

Türkçe adayların başlangıç kaynakları: [Azure Speech REST ve voice list](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech), [ElevenLabs modelleri](https://elevenlabs.io/docs/overview/models), [Google Cloud Türkçe ses listesi](https://cloud.google.com/text-to-speech/docs/voices). Bunlar doğal anlatım kalitesini veya belirli bir sesin kullanım hakkını tek başına kanıtlamaz. [ElevenLabs ticari kullanım açıklaması](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform) ücretsiz ve ticari plan ayrımını ayrıca açıklar; seçilen sesin/planın güncel sözleşmesi incelenmelidir.

1. Aynı özgün, sürümlenmiş Türkçe metni oluştur. Yaklaşık 1.400–1.800 kelimeyle başla, her sağlayıcının gerçek çıktısında toplam süreyi ölç; 10–15 dakika aralığına girmezse metni tüm sağlayıcılarda aynı yeni sürümle değiştir. Prototipteki kısa hikâye bu uzunlukta değildir.
2. Metinde özel isimler, yer isimleri, diyalog, soru, iç ses, ölçülü duygu ve uzun cümleler bulunsun. Ünlü sesi, gerçek kişiye izinsiz benzetme ve kullanıcı ses klonlama kullanma.
3. Doğallık, özel isim telaffuzu, duygu ve paragraf arası tutarlılık için kör A/B dinleme oturumu yap. En az iki ana dili Türkçe değerlendirici, 1–5 puan, zaman kodu, sorunlu paragraf kimliği ve açıklama kaydetsin. Başarılı HTTP yanıtını kalite puanı sayma.
4. Her paragraf için istek başlangıcı, ilk byte ve son byte zamanı, HTTP sonucu, yeniden deneme sayısı, çıktı süresi/boyutu ve faturalandırılan birimi kaydet. Maliyet = ilgili tarihteki gerçek plan/birim tarifesi × ücretli kullanım; ücretsiz kota ve yeniden üretimleri ayrıca kaydet. Gecikme için medyan/p95, maliyet için metin başına ve bitmiş ses dakikası başına değer raporla.
5. Anahtarları yalnızca güvenilir geliştirici komut dosyasının ortam değişkenlerinde veya sunucu secret deposunda tut. Anahtar içeren dosyaları git'e ekleme; mobil uygulama yalnızca önceden üretilmiş ses ve güvenli manifest alsın.

## Paragraf üretimi ve depolama

Cache anahtarı: `bookId / textVersion / narratorId / voiceVersion / paragraphId / textHash / settingsHash`. Her üretimin sağlayıcı/model sürümü, çıktı formatı, ses hash'i, süre, ticari hak kaydı ve dinleme değerlendirmesi saklansın. Aynı anahtar/hash için doğrulanmış dosya varsa API'yi tekrar çağırma. Hatalı paragrafı kimliğiyle tek başına üret; diğer kayıtları koru. HTTP ve PCM/codec doğrulamasından sonra insan dinleme onayı olmadan dağıtım manifestine alma. Süreler değiştiğinde birleşik dosyayı ve hedef anlatıcının paragraf sınırlarını yeniden hesapla.

Doğrulanan ticari sesleri uygulamaya eklerken `src/model.ts` profil bilgisini ve `src/audioSources.ts` varlıklarını bir katalog manifesti katmanına taşı. Ortak paragraf kimliği geçişini koru; saniyeyi farklı ses kaydına taşımayı kullanma. Demo etiketini yalnızca gerçek ticari ses kimliği ve hak kaydı doğrulandıktan sonra kaldır.

## Ticari yayın

Her kitap, çeviri, kapak ve ses için hak sahibi, kaynak, sözleşme, kapsam, başlangıç/bitiş, bölge, AI seslendirme, dijital dağıtım ve çevrimdışı dinleme kayıtları tut. İnsan sesi taklidi/klonlama hakkını varsayma. Yayın öncesi sözleşmeleri hukuk uzmanına incelet.

Sonraki işler: içerik erişim kontrolü ve süreli ses URL'leri, güvenli çevrimdışı indirme, mağaza ödeme/üyelik politikaları, hesap silme, gizlilik ve veri saklama, hak sona erince içerik erişiminin kaldırılması. Telefon arka planı, kesin uyku durdurması, release derleme testleri ve bağımlılık güvenlik uyarıları yayın öncesi kapanmalıdır. Bu prototip herkese açık ticari dağıtım için onaylanmış değildir.
