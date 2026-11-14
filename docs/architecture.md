# Proje yapısı

```text
src/
  app/           Next.js sayfaları, layout, stiller ve service worker
  components/    booking, booking-link, budget, showcase, profile, ui, layout, providers
  lib/           Yardımcılar, işletme ayarları ve tarayıcı tercihleri
  data/          Adres araması ve yerel bütçe kayıtları
  types/         Ortak işletme ve konum tipleri
public/
  fonts/         Yerel yazı tipleri ve OFL lisansları
```

`/booking` işletme profilini ve üç işlem düğmesini gösterir. Düğmeler yalnızca
başlık ve kapatma düğmesi içeren bir drawer açar. Randevu oluşturma, seans,
iptal akışı, örnek yorumlar ve demo veri kaynağı yoktur.

`/booking-link` profil ve görünüm ayarlarını içerir. Tercihler doğrudan tarayıcıda
saklanır; sorgu önbelleği veya servis katmanı kullanılmaz. Menü dört sayfayı açar.

`/budget` gelir/gider hareketlerini listeler. Kayıtlar `data/budget.ts` üzerinden
tarayıcıda saklanır; tutarlar tam sayı kuruş cinsindedir. Tarih, açıklama ve tutar
ile işlem eklenebilir. Aylar arasında geçiş yapılabilir; toplamlar ve hareketler seçili
aya aittir. Silme yalnızca seçim modunda, modalda `onaylıyorum` yazılarak yapılır. Sabit gelir/giderler başlangıç ve bitiş ayı dahil aylık hesaplanır; gelecek aylar
hareketlere ve toplamlara dahil edilmez. Tekrarlı kayıtlar bir kez saklanır,
sabit işlemler silme seçiminden korunur. Tarih, ay ve tutar seçimi iç içe drawer
bileşenlerinden yapılır; sabit işlem için ayrı ekleme düğmesi bulunur. Örnek finansal veri eklenmez.

`components/booking/service-picker.tsx` görsel tasarım için özellikle korunur:
`GenderSelector`, `ServiceCategory`, `ServicePicker`. Bileşenler içeriklerini
props ile alır; içinde demo veri veya API çağrısı yoktur. Kullanıcı Arayüzü sayfasında örneklerle gösterilirler.

`lib` arayüz veya veri modüllerini içe aktarmaz. `types` yalnızca diğer tip
dosyalarına bağımlıdır. `scripts/check-architecture.mjs` bağımlılık yönlerini,
eksik yolları ve döngüleri kontrol eder.

`pnpm check` yapı, tip, lint ve bütçe hesaplama testlerini çalıştırır. Kaldırılan demo akışlarına
ait testler de kaldırılmıştır. `pnpm build` üretim derlemesini doğrular.
Yazı tipleri `next/font/local` ile yerel dosyalardan yüklenir.

`docs/migration-map.json` eski dosyaları güncel konumlarına eşler.

`components/booking/google-reviews.tsx` Google yorum kartıdır; gerçek yorum, puan ve
link props ile verilir. `kvkk-link.tsx` altı çizili düğme ve KVKK drawer içerir;
metin children ile verilir. Bileşenler örnek veri veya hukuki metin içermez; önizleme içerikleri yalnızca
Kullanıcı Arayüzü sayfasında tanımlıdır. Drawer içinde kullanım için `nested` desteklenir.

`/ui` Kullanıcı Arayüzü sayfasıdır. Hizmet seçimi, Google yorum kartı, KVKK
bağlantısı ve iç içe drawer örneklerini gösterir. Butonlar, bütçe tutar/tarih/ay alanları ve kategori menüsü ile kart seçimini içeren
işlem listesi de burada denenebilir. Örnek bütçe içerikleri yalnızca önizlemede tutulur.
Önizlemeler kayıt oluşturmaz.
`components/layout/panel-shell.tsx` ortak menü ve sayfa çerçevesidir. Kapak ve
avatar varsayılan olarak kapalıdır; yalnızca `/booking-link` bu çerçevede
`businessHeader` seçeneğini açar. `/booking` kendi profil başlığını kullanır.
Bütçe, arayüz ve bulunamadı sayfaları sade menü başlığıyla açılır.

Bütçede kategori ve ekstre tanımları ile ay bazında birikim tercihleri ayrı bir
sürüm anahtarıyla `data/budget.ts` üzerinden saklanır. Eski işlem kayıtları
kategori olmadan okunmaya devam eder. Ekstre tutarını güncellemek aynı ayın
kaydını değiştirir; ikinci kez gidere eklemez. Sabit kayıtlarda bitiş ayı boş
bırakılabilir ve ad, tutar, aralık düzenlenebilir. Düzenleme tüm geçerli aylara
uygulanır. Arama, kategori filtresi, tarih/tutar sıralaması ve günlük gruplama
aylık toplamları değiştirmez. Birikim tutarı gider oluşturmaz; harcanabilir
bakiyeden ayrılır. Ay dökümü hesap kalemlerini gösterir. Silme yalnızca mevcut
seçim ve metin onayıyla yapılır; Sarraf'ın kaydırarak silme akışı kullanılmaz.
