// Bir şirketin son dönem metriklerini hesaplar (saf fonksiyon). yon: 1 = yüksek iyi, -1 = düşük iyi
function metrikler(s) {
  var yillar = Object.keys(s.donemler).sort().reverse();
  var d = s.donemler[yillar[0]], p = s.donemler[yillar[1]], b = d.bilanco, g = d.gelir;
  return [
    { ad: 'Cari oran',      yon: 1,  deger: cariOran(d), tur: 'oran' },
    { ad: 'Borç / özkaynak', yon: -1, deger: (b.kisa_vadeli_yukumlulukler + b.uzun_vadeli_yukumlulukler) / b.ozkaynaklar, tur: 'oran' },
    { ad: 'ROE',            yon: 1,  deger: g.net_kar / b.ozkaynaklar, tur: 'yuzde' },
    { ad: 'ROA',            yon: 1,  deger: roa(d), tur: 'yuzde' },
    { ad: 'Net kâr marjı',  yon: 1,  deger: g.net_kar / g.hasilat, tur: 'yuzde' },
    { ad: 'Brüt kâr marjı', yon: 1,  deger: brutMarj(d), tur: 'yuzde' },
    { ad: 'Piotroski (0-9)', yon: 1, deger: piotroski(d, p).puan, tur: 'tam' },
    { ad: 'Altman Z',       yon: 1,  deger: altman(d, s.piyasa_degeri).z, tur: 'oran' }
  ];
}

function bicim(x, tur) {
  if (tur === 'yuzde') return (x * 100).toFixed(1).replace('.', ',') + ' %';
  if (tur === 'tam') return String(x);
  return x.toFixed(2).replace('.', ',');
}

// Şirket listesi: sembol -> JSON dizisi; satırlarda en iyi değer vurgulanır
function tabloCiz(sirketler) {
  var tum = sirketler.map(metrikler), h = '<table class="table table-sm rakam"><thead><tr><th>Gösterge</th>';
  sirketler.forEach(function (s) { h += '<th>' + s.sembol + '</th>'; });
  h += '</tr></thead><tbody>';
  tum[0].forEach(function (m, i) {
    // En iyi değer: yön 1 ise en büyük, -1 ise en küçük
    var degerler = tum.map(function (t) { return t[i].deger; });
    var en = m.yon === 1 ? Math.max.apply(null, degerler) : Math.min.apply(null, degerler);
    h += '<tr><td>' + m.ad + '</td>';
    tum.forEach(function (t) {
      h += '<td' + (t[i].deger === en ? ' class="en-iyi"' : '') + '>' + bicim(t[i].deger, m.tur) + '</td>';
    });
    h += '</tr>';
  });
  $('#tablo').html(h + '</tbody></table>');
  $('#sonuc').removeClass('d-none');
}

function karsilastir() {
  var secili = $('#secenekler input:checked').map(function () { return this.value; }).get();
  $('#uyari').empty();
  if (secili.length < 2) { $('#sonuc').addClass('d-none'); return; }
  // Her şirket için bir AJAX isteği; $.when hepsi bitince çalışır (paralel istek)
  var istekler = secili.map(function (k) { return $.getJSON('../api/companies/' + k + '.json'); });
  $.when.apply($, istekler).done(function () {
    // Birden çok istekte her argüman [veri, durum, xhr] dizisidir; veri ilk eleman
    tabloCiz(Array.prototype.slice.call(arguments).map(function (a) { return a[0]; }));
  }).fail(function () {
    $('#uyari').html('<div class="alert alert-danger">Veri alınamadı. Sayfayı <code>python3 -m http.server 8000</code> ile sunucu üzerinden açın.</div>');
  });
}

$(function () {
  $.getJSON('../api/companies.json').done(function (veri) {
    $.each(veri.sirketler, function (_, s) {
      $('#secenekler').append('<label class="form-check"><input class="form-check-input" type="checkbox" value="' + s.sembol +
        '"> <span class="form-check-label">' + s.sembol + '</span></label>');
    });
  });
  // En fazla 3 şirket: dördüncü seçimi geri al
  $('#secenekler').on('change', 'input', function () {
    if ($('#secenekler input:checked').length > 3) {
      this.checked = false;
      $('#uyari').html('<div class="alert alert-warning">En fazla 3 şirket seçebilirsiniz.</div>');
      return;
    }
    karsilastir();
  });
});
