// ---------- DCF (İndirgenmiş Nakit Akışı) hesabı: saf fonksiyon, DOM'a dokunmaz ----------
// Fikir: bir şirketin bugünkü değeri, gelecekte üreteceği nakitlerin bugüne indirilmiş toplamıdır.
// g = {fcf, buyume, iskonto, surekli, yil, borc, nakit, hisse}; oranlar ondalık (0,25 gibi).
function dcf(g) {
  var r = g.iskonto, gs = g.surekli;
  // Gordon büyüme formülü r > gs ister; değilse nihai değer anlamsız (sıfıra bölme ya da negatif).
  if (r <= gs) return null;

  var yillik = [], toplamPV = 0;
  for (var t = 1; t <= g.yil; t++) {
    // t. yıl nakit akışı: ilk yıl nakit akışı her yıl "büyüme" oranında artar
    var nakit = g.fcf * Math.pow(1 + g.buyume, t - 1);
    // Bugünkü değer: nakit / (1 + iskonto)^t  (uzaktaki para daha az değerli)
    var pv = nakit / Math.pow(1 + r, t);
    yillik.push({ yil: t, nakit: nakit, pv: pv });
    toplamPV += pv;
  }
  var sonNakit = yillik[yillik.length - 1].nakit;
  // Nihai değer: projeksiyon sonrası sonsuza dek gs oranında büyüyen nakit akışının değeri
  //   TV = son yıl nakit * (1 + gs) / (iskonto - gs)
  var nihai = sonNakit * (1 + gs) / (r - gs);
  var nihaiPV = nihai / Math.pow(1 + r, g.yil);   // nihai değer de bugüne indirilir

  var firmaDegeri = toplamPV + nihaiPV;            // Firma değeri = nakit akışları PV + nihai değer PV
  var ozkaynak = firmaDegeri - g.borc + g.nakit;   // Özkaynak değeri = firma değeri - borç + nakit
  return { yillik: yillik, toplamPV: toplamPV, nihai: nihai, nihaiPV: nihaiPV,
           firmaDegeri: firmaDegeri, ozkaynak: ozkaynak, hisseBasi: ozkaynak / g.hisse };
}

// ---------- Biçimlendirme ----------
function f(n, k) { return Number.isFinite(n) ? n.toLocaleString('tr-TR', { minimumFractionDigits: k || 0, maximumFractionDigits: k || 0 }) : '—'; }

// ---------- Girdileri oku (% kutuları 100'e bölünür) ----------
function girdiOku() {
  return {
    fcf: parseFloat($('#fcf').val()), buyume: parseFloat($('#buyume').val()) / 100,
    iskonto: parseFloat($('#iskonto').val()) / 100, surekli: parseFloat($('#surekli').val()) / 100,
    yil: parseInt($('#yil').val(), 10), borc: parseFloat($('#borc').val()),
    nakit: parseFloat($('#nakit').val()), hisse: parseFloat($('#hisse').val())
  };
}

// Girdi hatası varsa mesaj döner, yoksa boş metin
function kontrol(g) {
  var degerler = [g.fcf, g.buyume, g.iskonto, g.surekli, g.yil, g.borc, g.nakit, g.hisse];
  if (!degerler.every(Number.isFinite)) return 'Tüm alanları sayıyla doldurun.';
  if (g.yil < 1 || g.yil > 15) return 'Projeksiyon yılı 1 ile 15 arasında olmalı.';
  if (g.hisse <= 0) return 'Hisse sayısı sıfırdan büyük olmalı.';
  if (g.iskonto <= g.surekli) return 'İskonto oranı sürekli büyüme oranından büyük olmalı; aksi halde nihai değer hesaplanamaz.';
  return '';
}

// ---------- Ekrana çizim ----------
function hesaplaVeCiz() {
  var g = girdiOku(), hata = kontrol(g);
  if (hata) { $('#sonuc').addClass('d-none'); $('#hata').html('<div class="alert alert-warning">' + hata + '</div>'); return; }
  $('#hata').empty();
  var s = dcf(g);

  // Özet kutuları
  var ozet = [['Nakit akışları (bugünkü)', f(s.toplamPV)], ['Nihai değer', f(s.nihai)], ['Nihai değer (bugünkü)', f(s.nihaiPV)],
              ['Firma değeri', f(s.firmaDegeri)], ['Özkaynak değeri', f(s.ozkaynak)], ['Hisse başına değer (TL)', f(s.hisseBasi, 2)]];
  var oh = '';
  ozet.forEach(function (o) { oh += '<div class="col-6 col-md-4"><div class="oran-kutu">' + o[0] + '<b>' + o[1] + '</b></div></div>'; });
  $('#ozet').html(oh);

  // Yıllık nakit akışı tablosu
  var th = '<table class="table table-sm rakam"><thead><tr><th>Yıl</th><th>Nakit akışı</th><th>Bugünkü değer</th></tr></thead><tbody>';
  s.yillik.forEach(function (y) { th += '<tr><td>' + y.yil + '</td><td>' + f(y.nakit) + '</td><td>' + f(y.pv) + '</td></tr>'; });
  $('#nakitTablo').html(th + '</tbody></table>');

  // Duyarlılık tablosu 5x5: iskonto (satır, ±2 puan adımla) x sürekli büyüme (sütun, ±1 puan adımla).
  // Her hücrede dcf() aynı girdilerle ama değişen iki oranla yeniden çağrılır.
  var dh = '<table class="table table-sm rakam"><thead><tr><th>İskonto \\ Sürekli büyüme</th>';
  var sutunlar = [-2, -1, 0, 1, 2];
  sutunlar.forEach(function (d) { dh += '<th>%' + f((g.surekli * 100) + d, 1) + '</th>'; });
  dh += '</tr></thead><tbody>';
  [-4, -2, 0, 2, 4].forEach(function (rd) {
    dh += '<tr><td><strong>%' + f((g.iskonto * 100) + rd, 1) + '</strong></td>';
    sutunlar.forEach(function (sd) {
      var kopya = $.extend({}, g, { iskonto: g.iskonto + rd / 100, surekli: g.surekli + sd / 100 });
      var sonuc = dcf(kopya);
      dh += '<td' + (rd === 0 && sd === 0 ? ' class="merkez"' : '') + '>' + (sonuc ? f(sonuc.hisseBasi, 2) : '—') + '</td>';
    });
    dh += '</tr>';
  });
  $('#duyarlilik').html(dh + '</tbody></table>');
  $('#sonuc').removeClass('d-none');
}

// Sayfa açılınca bir kez, sonra herhangi bir kutu değişince yeniden hesapla
$(function () {
  $('#girdiler input').on('input', hesaplaVeCiz);
  hesaplaVeCiz();
});
