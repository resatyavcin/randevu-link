# Mimari ve taşıma kapsamı

## Bağımlılık yönü

| Katman | İçe aktarabileceği katmanlar |
| --- | --- |
| domain | domain |
| application | application, domain |
| infrastructure | infrastructure, application, domain |
| presentation | presentation, application, domain, composition |
| composition | Bağımlılıkları bağlamak için tüm uygulama katmanları |
| app | app, presentation, composition, application, domain |

Domain ve application dış paket, tarayıcı deposu veya framework kullanamaz.
Composition, uygulamanın somut bağımlılıklarını seçen giriş noktasıdır.
`scripts/check-architecture.mjs` statik içe aktarımları, yeniden dışa aktarımları,
sabit yollarla dinamik yüklemeleri, katman sınırlarını ve bağımlılık döngülerini
denetler. Test dosyaları, birden fazla katmanı doğrulayabildiği için bu grafiğin
dışındadır. TypeScript ayrıca sözleşmeleri ve repository uygulamalarını denetler.

## Taşınan parçalar

| Önceki konum | Yeni sorumluluk / konum |
| --- | --- |
| `src/lib/api-types.ts` | `domain/models/contracts.ts`: mevcut veri modelleri ve sabitleri |
| `src/lib/auth.ts` | `domain/models/auth.ts`: oturum tipleri; `infrastructure/storage/auth-session.ts`: tarayıcı deposu |
| `src/lib/phone.ts` | `domain/value-objects/phone.ts` |
| `src/lib/business.ts` | `domain/models/business.ts`, `domain/services/business-directory.ts`, `composition/business.ts`, `presentation/lib/navigation.ts` |
| `src/lib/api-client.ts` | `composition/services.ts`: repository'leri application işlemlerine bağlama |
| `src/lib/data/services/*` | `application/ports/*`: 16 sözleşme; `infrastructure/repositories/*`: somut uygulamalar |
| `src/lib/data/transport.ts` | `infrastructure/transport/demo-transport.ts`; ortak hata `application/errors/api-error.ts` |
| `src/lib/data/customer-history.ts` | Veri toplama `application/use-cases/customer-history.ts`, kurallar `domain/services/customer-history.ts`, sorgu `presentation/hooks/customer-history.ts` |
| Diğer `src/lib/data/*` | `presentation/hooks/*`: TanStack Query sorgu ve kayıt durumları |
| `src/lib/appointments-store.ts` | `presentation/hooks/appointments.ts`: ekran modeli eşlemesi ve sorgular |
| `src/lib/demo/*` | `infrastructure/demo/*`: yerel sunucu benzetimi, başlangıç verileri ve entegrasyon testleri |
| `src/lib/env.ts` | `infrastructure/config/env.ts`, dışa açılan giriş `composition/config.ts` |
| Diğer `src/lib/*` | `presentation/lib/*`: bildirimler, biçimleme, animasyon ve arayüz yardımcıları |
| `src/components/*` | `presentation/components/*`: tüm bileşenler ve sağlayıcılar |
| `src/app/**/*-view.tsx`, `search-client.tsx` | `presentation/views/*` |
| Next.js dosyaları | `src/app` içinde aynı URL yapısı, yönlendirmeler, metadata, offline sayfası ve service worker |

Görseller, ikonlar, favicon, salon fotoğrafları, stiller, doğrulama akışları,
tema ve görünüm tercihleri, sosyal bağlantılar, tablo tercihleri, sorgu anahtarları,
formlar, yerel veri anahtarları ve demo senaryoları korunmuştur. Proje klasörü
bütün olarak yeniden adlandırıldığı için gizli ortam dosyaları ve yerel proje
ayarları da taşınmıştır. Git deposu üst klasörde kalır; mevcut Git değişiklikleri
stage edilmemiş veya sıfırlanmamıştır.

## Veri erişimini değiştirme

Mevcut repository'ler `demo-transport.ts` üzerinden yerel sunucu benzetimine
gider. Bu benzetim randevu çakışması, ödeme ve seans işlemlerinin mevcut demo
davranışını korur. Gerçek bir sunucu eklemek için `application/ports` sözleşmelerini
uygulayan yeni infrastructure adaptörleri yazın ve bunları `composition/services.ts`+içinde seçin. Domain, kullanım senaryoları ve ekranların repository uygulamasını
bilmesi gerekmez. Mevcut DTO isimleri sözleşme uyumluluğu için korunmuştur.

## Doğrulama

`pnpm check` katman kontrollerini, tip kontrolünü, lint denetimini, bağımsız
kullanım senaryosu testlerini ve mevcut demo akış testlerini çalıştırır.
`pnpm build` ayrıca Next.js yollarının üretim derlemesini doğrular. İlk derlemede
`next/font/google` tarafından kullanılan fontların indirilmesi gerekebilir.
