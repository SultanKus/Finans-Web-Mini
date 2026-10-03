// ---------- Biçimlendirme yardımcıları ----------
function sayi(n) { return Number.isFinite(n) ? n.toLocaleString('tr-TR') : '—'; }
function yuzde(x) { return Number.isFinite(x) ? (x * 100).toFixed(1).replace('.', ',') + ' %' : '—'; }
function oranStr(x) { return Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '—'; }

// Tablo satır başlıkları (JSON anahtarı -> ekranda görünen ad)
var ETIKET = {
  donen_varliklar: 'Dönen varlıklar', duran_varliklar: 'Duran varlıklar', toplam_varliklar: 'Toplam varlıklar',
  kisa_vadeli_yukumlulukler: 'Kısa vadeli yükümlülükler', uzun_vadeli_yukumlulukler: 'Uzun vadeli yükümlülükler',
  ozkaynaklar: 'Özkaynaklar', gecmis_yil_karlari: 'Geçmiş yıl kârları',
  hasilat: 'Hasılat', satis_maliyeti: 'Satış maliyeti', brut_kar: 'Brüt kâr',
  faaliyet_kari: 'Faaliyet kârı', net_kar: 'Net kâr'
};

// ---------- Hesaplamalar (saf fonksiyonlar) ----------
// Oranlar dönem sonu rakamlarıyla hesaplanır (ortalama özkaynak/aktif kullanılmaz, basit tutuldu).
function oranlariHesapla(d) {
  var b = d.bilanco, g = d.gelir;
  return [
    ['Cari oran',      oranStr(b.donen_varliklar / b.kisa_vadeli_yukumlulukler)],
    ['Borç / özkaynak', oranStr((b.kisa_vadeli_yukumlulukler + b.uzun_vadeli_yukumlulukler) / b.ozkaynaklar)],
    ['ROE',            yuzde(g.net_kar / b.ozkaynaklar)],
    ['ROA',            yuzde(g.net_kar / b.toplam_varliklar)],
    ['Net kâr marjı',  yuzde(g.net_kar / g.hasilat)],
    ['Brüt kâr marjı', yuzde(g.brut_kar / g.hasilat)]
  ];
}

// Dört doğrulama kontrolü. Her biri {baslik, durum: 'ok'|'uyari', mesaj} döner.
function dogrula(s, yil, oncekiYil) {
  var a = s.donemler[yil], p = s.donemler[oncekiYil], b = a.bilanco, sonuc = [];

  // 1) Aktif = yükümlülük + özkaynak mı? (yüzde 1 tolerans)
  var kaynak = b.kisa_vadeli_yukumlulukler + b.uzun_vadeli_yukumlulukler + b.ozkaynaklar;
  var sapma = Math.abs(b.toplam_varliklar - kaynak) / b.toplam_varliklar;
  sonuc.push({ baslik: 'Bilanço dengesi',
    durum: sapma <= 0.01 ? 'ok' : 'uyari',
    mesaj: sapma <= 0.01 ? 'Aktif = yükümlülük + özkaynak (sapma ' + yuzde(sapma) + ').'
      : 'Aktif ' + sayi(b.toplam_varliklar) + ' ama kaynaklar ' + sayi(kaynak) + ' (sapma ' + yuzde(sapma) + ').' });

  // 2) Eksik kalem var mı? (alan hiç yok, null veya sayı değil)
  var gerekli = {
    bilanco: ['donen_varliklar', 'duran_varliklar', 'toplam_varliklar', 'kisa_vadeli_yukumlulukler',
              'uzun_vadeli_yukumlulukler', 'ozkaynaklar', 'gecmis_yil_karlari'],
    gelir: ['hasilat', 'satis_maliyeti', 'brut_kar', 'faaliyet_kari', 'net_kar']
  };
  var eksik = [];
  Object.keys(gerekli).forEach(function (grup) {
    gerekli[grup].forEach(function (alan) {
      if (!Number.isFinite(a[grup][alan])) eksik.push(ETIKET[alan]);
    });
  });
  sonuc.push({ baslik: 'Eksik kalem', durum: eksik.length ? 'uyari' : 'ok',
    mesaj: eksik.length ? 'Eksik: ' + eksik.join(', ') : 'Tüm kalemler dolu.' });

  // 3) Negatif özkaynak
  sonuc.push({ baslik: 'Özkaynak', durum: b.ozkaynaklar < 0 ? 'uyari' : 'ok',
    mesaj: b.ozkaynaklar < 0 ? 'Özkaynak negatif.' : 'Özkaynak pozitif.' });

  // 4) Önceki döneme göre yüzde 100'ü aşan sıçrama (hasılat veya net kâr)
  var siciramalar = [];
  [['hasilat', 'Hasılat'], ['net_kar', 'Net kâr']].forEach(function (x) {
    var eski = p.gelir[x[0]], yeni = a.gelir[x[0]];
    var degisim = (yeni - eski) / Math.abs(eski);
    if (Math.abs(degisim) > 1) siciramalar.push(x[1] + ' ' + yuzde(degisim));
  });
  sonuc.push({ baslik: 'Dönemsel sıçrama', durum: siciramalar.length ? 'uyari' : 'ok',
    mesaj: siciramalar.length ? 'Önceki döneme göre: ' + siciramalar.join(', ') : 'Hasılat ve net kâr değişimi %100 sınırı içinde.' });

  return sonuc;
}

// ---------- Ekrana çizim ----------
function tabloYap(grup, alanlar, yillar, s) {
  var h = '<table class="table table-sm rakam"><thead><tr><th>Kalem (' + s.para_birimi + ', ' + s.birim + ')</th>';
  yillar.forEach(function (y) { h += '<th>' + y + '</th>'; });
  h += '</tr></thead><tbody>';
  alanlar.forEach(function (alan) {
    h += '<tr><td>' + ETIKET[alan] + '</td>';
    yillar.forEach(function (y) { h += '<td>' + sayi(s.donemler[y][grup][alan]) + '</td>'; });
    h += '</tr>';
  });
  return h + '</tbody></table>';
}

function ciz(s) {
  // Yıllar yeniden eskiye sıralanır: ilki cari, ikincisi önceki dönem
  var yillar = Object.keys(s.donemler).sort().reverse();
  var yil = yillar[0], onceki = yillar[1], d = s.donemler[yil];

  $('#baslik').text(s.sembol + ' — ' + s.ad + ' (' + s.sektor + ')');

  // Doğrulama rozetleri (Bootstrap badge + kendi renk sınıfımız)
  var dh = '<ul class="list-unstyled mb-0">';
  dogrula(s, yil, onceki).forEach(function (r) {
    dh += '<li class="mb-2"><span class="badge rozet-' + r.durum + ' me-2">' +
          (r.durum === 'ok' ? 'Uygun' : 'Uyarı') + '</span><strong>' + r.baslik + ':</strong> ' + r.mesaj + '</li>';
  });
  $('#dogrulama').html(dh + '</ul>');

  // Oranlar
  var oh = '';
  oranlariHesapla(d).forEach(function (o) {
    oh += '<div class="col-6 col-md-4 col-xl-2"><div class="oran-kutu">' + o[0] + '<b>' + o[1] + '</b></div></div>';
  });
  $('#oranlar').html(oh);

  // Skorlar (skorlar.js)
  var pio = piotroski(d, s.donemler[onceki]), alt = altman(d, s.piyasa_degeri);
  var sh = '<p><strong>Piotroski F-Skoru: ' + pio.puan + ' / 9</strong> &nbsp; <strong>Altman Z-Skoru: ' +
           oranStr(alt.z) + ' (' + alt.bolge + ')</strong></p><ul class="mb-1">';
  pio.kriterler.forEach(function (k) { sh += '<li>' + (k[1] ? '✔ ' : '✘ ') + k[0] + '</li>'; });
  $('#skorlar').html(sh + '</ul><p class="not mb-0">Altman Z orijinal modeli imalat şirketleri içindir; banka ve perakende için yorumlarken dikkatli olun.</p>');

  // Tablolar
  $('#bilancoTablo').html(tabloYap('bilanco', Object.keys(d.bilanco), yillar, s));
  $('#gelirTablo').html(tabloYap('gelir', Object.keys(d.gelir), yillar, s));
  $('#icerik').removeClass('d-none');
}

function hataGoster() {
  $('#icerik').addClass('d-none');
  $('#uyari').html('<div class="alert alert-danger">Veri alınamadı. Sayfayı dosya olarak açmayın; ' +
    'klasörde <code>python3 -m http.server 8000</code> çalıştırıp <code>localhost:8000</code> adresini kullanın.</div>');
}

// ---------- Başlangıç: DOM hazır olunca ----------
$(function () {
  // 1) Şirket listesini AJAX ile çek, açılır listeyi doldur
  $.getJSON('../api/companies.json').done(function (veri) {
    $.each(veri.sirketler, function (_, s) {
      $('#sirketSec').append($('<option>').val(s.sembol).text(s.sembol + ' — ' + s.ad));
    });
  }).fail(hataGoster);

  // 2) Seçim değişince seçilen şirketin JSON'unu çek; sayfa yenilenmez
  $('#sirketSec').on('change', function () {
    var sembol = $(this).val();
    if (!sembol) { $('#icerik').addClass('d-none'); return; }
    $('#uyari').empty();
    $.ajax({ url: '../api/companies/' + sembol + '.json', dataType: 'json', cache: false })
      .done(ciz).fail(hataGoster);
  });
});
