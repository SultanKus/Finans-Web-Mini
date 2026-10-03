// ---------- Finansal sağlık skorları (saf fonksiyonlar: DOM'a dokunmaz) ----------

// Yardımcı: bir dönemin ROA'sı = net kâr / toplam varlık
function roa(d) { return d.gelir.net_kar / d.bilanco.toplam_varliklar; }
function cariOran(d) { return d.bilanco.donen_varliklar / d.bilanco.kisa_vadeli_yukumlulukler; }
function brutMarj(d) { return d.gelir.brut_kar / d.gelir.hasilat; }
function aktifDevir(d) { return d.gelir.hasilat / d.bilanco.toplam_varliklar; }
function uzunBorcOrani(d) { return d.bilanco.uzun_vadeli_yukumlulukler / d.bilanco.toplam_varliklar; }

// Piotroski F-Skoru: 9 kriter, her biri geçerse 1 puan (0-9).
// 8-9 güçlü, 0-2 zayıf kabul edilir. Cari yılı bir önceki yılla kıyaslar.
function piotroski(a, p) {
  var k = [
    ['Net kâr pozitif',                       a.gelir.net_kar > 0],
    ['Faaliyet nakit akışı pozitif',          a.nakit.faaliyet_nakit_akisi > 0],
    ['ROA bir önceki yıldan yüksek',          roa(a) > roa(p)],
    ['Nakit akışı net kârdan büyük',          a.nakit.faaliyet_nakit_akisi > a.gelir.net_kar],
    ['Uzun vadeli borç/aktif düştü',          uzunBorcOrani(a) < uzunBorcOrani(p)],
    ['Cari oran yükseldi',                    cariOran(a) > cariOran(p)],
    ['Yeni hisse çıkarılmadı',                a.hisse_sayisi <= p.hisse_sayisi],
    ['Brüt kâr marjı yükseldi',               brutMarj(a) > brutMarj(p)],
    ['Aktif devir hızı yükseldi',             aktifDevir(a) > aktifDevir(p)]
  ];
  var puan = k.filter(function (x) { return x[1]; }).length;
  return { puan: puan, kriterler: k };
}

// Altman Z-Skoru (imalat şirketleri için orijinal model):
// Z = 1,2*X1 + 1,4*X2 + 3,3*X3 + 0,6*X4 + 1,0*X5
// X1 işletme sermayesi/aktif, X2 geçmiş yıl kârları/aktif, X3 faaliyet kârı/aktif,
// X4 piyasa değeri/toplam yükümlülük, X5 hasılat/aktif
function altman(a, piyasaDegeri) {
  var b = a.bilanco, TA = b.toplam_varliklar;
  var yukumluluk = b.kisa_vadeli_yukumlulukler + b.uzun_vadeli_yukumlulukler;
  var z = 1.2 * (b.donen_varliklar - b.kisa_vadeli_yukumlulukler) / TA
        + 1.4 * b.gecmis_yil_karlari / TA
        + 3.3 * a.gelir.faaliyet_kari / TA
        + 0.6 * piyasaDegeri / yukumluluk
        + 1.0 * a.gelir.hasilat / TA;
  var bolge = z > 2.99 ? 'Güvenli' : (z >= 1.81 ? 'Gri bölge' : 'Sıkıntı riski');
  return { z: z, bolge: bolge };
}
