// AngularJS 1.8: modül -> controller. $scope, HTML ile controller arasındaki köprüdür.
angular.module('taramaApp', [])
  .controller('TaramaCtrl', ['$scope', '$http', function ($scope, $http) {

    $scope.sirketler = [];
    $scope.sektorler = [];
    $scope.kriter = { fkUst: null, roeAlt: null, borcUst: null, sektor: null };
    $scope.siralama = 'sembol';   // orderBy'a verilen alan adı
    $scope.ters = false;          // true ise büyükten küçüğe

    // $http ile web service (JSON) çağrısı; sayfa yenilenmez
    $http.get('../api/companies.json').then(function (cevap) {
      $scope.sirketler = cevap.data.sirketler;
      // Sektör listesini şirketlerden türet, tekrarları ele
      $scope.sektorler = $scope.sirketler
        .map(function (s) { return s.sektor; })
        .filter(function (s, i, dizi) { return dizi.indexOf(s) === i; })
        .sort();
    }, function () { $scope.hata = true; });

    // filter:kriterFiltresi her şirket için çağrılır; true dönerse şirket listede kalır.
    // Boş kutu (null/undefined) o kriteri uygulamamak demektir.
    $scope.kriterFiltresi = function (s) {
      var k = $scope.kriter;
      if (k.fkUst != null && !(s.fk <= k.fkUst)) return false;
      if (k.roeAlt != null && !(s.roe >= k.roeAlt)) return false;
      if (k.borcUst != null && !(s.borc_ozkaynak <= k.borcUst)) return false;
      if (k.sektor && s.sektor !== k.sektor) return false;
      return true;
    };

    // Başlığa tıklama: aynı alana tekrar tıklanırsa yön değişir
    $scope.sirala = function (alan) {
      if ($scope.siralama === alan) { $scope.ters = !$scope.ters; }
      else { $scope.siralama = alan; $scope.ters = false; }
    };
    $scope.ok = function (alan) {
      return $scope.siralama === alan ? ($scope.ters ? '▼' : '▲') : '';
    };
    $scope.temizle = function () {
      $scope.kriter = { fkUst: null, roeAlt: null, borcUst: null, sektor: null };
    };
  }]);
