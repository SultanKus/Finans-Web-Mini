# Bilanço Mercek (finans-web-mini)

Temel analiz ve değerleme üzerine dört küçük web aracı. Derleme yok, kurulum yok: sadece HTML, CSS, JavaScript ve CDN'den yüklenen kütüphaneler.
**Yatırım tavsiyesi değildir.** Veriler örnektir (`gercek_veri: false`); KAP verisiyle değiştirilmeden güvenilmemelidir.

## Çalıştırma
AJAX, dosya olarak açılan sayfada çalışmaz. Proje klasöründe:

    python3 -m http.server 8000

Sonra tarayıcıda `http://localhost:8000/` adresini açın (Windows'ta `python -m http.server 8000` gerekebilir).

## Klasör yapısı
- `index.html`: dört araca giden ana sayfa
- `mali-tablo/`: bilanço, gelir tablosu, oranlar, veri doğrulama, Piotroski ve Altman (`app.js`, `skorlar.js`)
- `hisse-tarama/`: AngularJS ile kriterlere göre süzme ve sıralama
- `degerleme/`: DCF hesaplayıcı ve duyarlılık tablosu
- `karsilastirma/`: 2-3 şirketi yan yana karşılaştırma
- `assets/stil.css`: ortak stil (CSS değişkenleri)
- `api/`: web service gibi davranan statik JSON dosyaları

## JSON şeması

`api/companies.json` (liste özeti; hisse tarama kullanır):

    { "guncelleme": "2026-10-03", "gercek_veri": false,
      "sirketler": [ { "sembol", "ad", "sektor", "fk", "roe", "borc_ozkaynak", "piyasa_degeri" } ] }

`api/companies/SEMBOL.json` (tek şirket detayı):

| Alan | Açıklama |
|---|---|
| sembol, ad, sektor | Kimlik bilgileri |
| para_birimi, birim | Örn. `TRY`, `milyon`; tüm şirketlerde aynı birim kullanın |
| fk, piyasa_degeri, hisse_sayisi | Piyasa verisi (piyasa değeri milyon TL, hisse sayısı milyon adet) |
| kaynak, gercek_veri | Verinin kaynağı; KAP'a geçince `true` yapın |
| donemler | Yıl anahtarlı nesne (`"2024"`, `"2023"`); en az iki yıl gerekir |
| donemler.YIL.hisse_sayisi | O yılın hisse sayısı (Piotroski için) |
| donemler.YIL.bilanco | donen_varliklar, duran_varliklar, toplam_varliklar, kisa_vadeli_yukumlulukler, uzun_vadeli_yukumlulukler, ozkaynaklar, gecmis_yil_karlari |
| donemler.YIL.gelir | hasilat, satis_maliyeti (pozitif sayı), brut_kar, faaliyet_kari, net_kar |
| donemler.YIL.nakit | faaliyet_nakit_akisi |

Gerçek veriye geçerken: `toplam_varliklar = donen + duran` ve `toplam_varliklar = kısa + uzun yükümlülük + özkaynak` olmalı (doğrulama bölümü bunu kontrol eder).
`companies.json` içindeki değerler son yıldan hesaplanır: `roe = net_kar / ozkaynaklar × 100`, `borc_ozkaynak = (kisa + uzun) / ozkaynaklar`, `fk = piyasa_degeri / net_kar`.
`EREGL.json` 2024 bilançosu doğrulamayı göstermek için bilerek tutmuyor.

## Hangi dosyada hangi teknoloji

| Dosya | Teknoloji |
|---|---|
| `index.html`, tüm sayfaların HTML'i | HTML5, Bootstrap 5 (grid, kart, tablo, rozet) |
| `assets/stil.css` | CSS3 (özel değişkenler, duyarlı yerleşim) |
| `mali-tablo/app.js` | jQuery, AJAX (`$.getJSON`, `$.ajax`), JSON, DOM işlemleri |
| `mali-tablo/skorlar.js` | Saf JavaScript (Piotroski, Altman) |
| `hisse-tarama/index.html`, `app.js` | AngularJS 1.8 (`ng-model`, `ng-repeat`, `filter`, `orderBy`, `$http`) |
| `degerleme/app.js` | jQuery, olay dinleme, DCF hesabı |
| `karsilastirma/app.js` | jQuery, AJAX (`$.when` ile paralel istek), JSON |
| `api/*.json` | JSON, web service gibi statik uç noktalar |

## Mülakat soruları ve cevapları

**1. AJAX nedir, projede nerede kullanıldı?**
Sayfayı yenilemeden sunucudan veri isteyip ekranı güncelleme yöntemidir. Mali tablo sayfasında şirket seçilince `$.ajax` ile `api/companies/XXX.json` çekilir ve tablolar yeniden çizilir.

**2. Sayfayı çift tıklayıp açınca neden veri gelmiyor?**
Tarayıcı `file://` ile açılan sayfanın başka dosyaları AJAX ile okumasını güvenlik nedeniyle engeller. Bu yüzden `python3 -m http.server` ile küçük bir HTTP sunucusu çalıştırıyoruz.

**3. jQuery ile AngularJS arasındaki fark nedir?**
jQuery DOM'u elle değiştirir: veriyi çeker, HTML metni üretir, sayfaya yazarız. AngularJS ise veriyi `$scope`'a koyar ve HTML bu veriye bağlı kalır; veri değişince ekran kendiliğinden güncellenir. İki projede de aynı işi yapıp farkı görebiliyoruz.

**4. `ng-model`, `ng-repeat`, `filter` ve `orderBy` ne yapar?**
`ng-model` kutu ile değişken arasında iki yönlü bağ kurar. `ng-repeat` listedeki her eleman için bir satır üretir. `filter` hangi elemanların kalacağını belirler (bizde `kriterFiltresi` fonksiyonu), `orderBy` sıralar. Üçü tek satırda zincirlenir.

**5. Statik JSON dosyası "web service" sayılır mı?**
İstemci açısından evet: bir URL'ye istek atıp JSON alır. Gerçek bir web service veriyi veritabanından üretir, parametre alır (örn. `/api/companies/THYAO`) ve doğrulama yapar. Projede kasıtlı olarak statik dosya kullandık; sayfalar sadece URL ve JSON biçimini bilir, veri kaynağı sonradan gerçek servise değiştirilebilir.

**6. DCF'te nihai değer nedir, iskonto oranı neden büyümeden büyük olmalı?**
Projeksiyon bittikten sonraki sonsuz dönemin değeridir: `son yıl nakit × (1+g) / (iskonto − g)`. İskonto büyümeye eşit ya da küçükse payda sıfır ya da negatif olur ve değer anlamsızlaşır; sayfa bu durumda uyarı verir.

**7. Piotroski F-Skoru ve Altman Z-Skoru nedir, sınırları nelerdir?**
Piotroski 9 evet/hayır kriterle (kârlılık, kaldıraç, verimlilik) şirketin yıldan yıla iyileşip iyileşmediğine bakar. Altman Z beş orandan iflas riskini tahmin eder. Altman'ın orijinal modeli imalat şirketleri için geliştirilmiştir; bankalarda ve perakendede dikkatli yorumlanmalıdır.

**8. Veri doğrulama neden önemli, hangi kontrolleri yaptınız?**
Hatalı veri üzerinden hesaplanan oran yanlış karar verdirir. Dört kontrol var: bilanço dengesi (aktif = yükümlülük + özkaynak, %1 tolerans), eksik kalem, negatif özkaynak ve önceki döneme göre %100'ü aşan hasılat/net kâr sıçraması. Sıçrama genellikle veri girişi hatasına ya da ölçü birimi karışıklığına işaret eder.
