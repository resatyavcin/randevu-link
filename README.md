# Randevu Link

Randevu paneli, müşteri rezervasyon sayfası ve personel portalı. Uygulama Next.js
App Router, React ve TanStack Query kullanır. Mevcut sürüm yerel demo verileriyle
çalışır; kayıtlar tarayıcıda saklanır.

## Çalıştırma

Bu klasörde:

```sh
pnpm install
pnpm dev
```

Panel: `http://localhost:3000`, rezervasyon: `/booking`, personel portalı: `/staff`.
Personel portalındaki demo doğrulama kodu `123456`.

`.env.example` iş yeri bilgilerini tanımlar. Mevcut `.env.local`, görseller,
bağımlılık kilidi ve yapılandırmalar klasör taşıması sırasında korunmuştur.
Yeni kurulumda `.env.example` dosyasını `.env.local` olarak kopyalayabilirsiniz.
Demo verisini sıfırlamak için tarayıcı yerel deposundaki `randevu-link.demo.v1`
kaydını silip sayfayı yenileyin. Depolama anahtarları ve mevcut yollar korunmuştur.

## Clean Architecture

```text
src/
  domain/          Modeller, değer nesneleri ve saf iş kuralları
  application/     Repository sözleşmeleri, kullanım senaryoları ve hatalar
  infrastructure/  Yerel demo, repository uygulamaları, oturum deposu ve ayarlar
  composition/     Bağımlılıkların bağlandığı uygulama girişleri
  presentation/    Bileşenler, ekranlar, sorgu kancaları ve sunum yardımcıları
  app/             Next.js yolları, metadata, stil ve service worker
```

Domain ve application katmanları React, Next.js, TanStack Query ve tarayıcı
deposundan bağımsızdır. Repository sözleşmeleri application içinde tanımlıdır;
infrastructure bu sözleşmeleri uygular. `createServices` işlemleri enjekte edilen
repository'lere bağlar. Müşteri geçmişini toplama application katmanında,
geçmiş sıralama ve iş yeri arama kuralları domain katmanındadır.

Ekranlar composition girişlerini kullanır; doğrudan infrastructure içe aktarımı
yapmaz. TanStack Query sorguları ve önbellek yenilemeleri presentation katmanında
kalır. Next.js yolları `app` içinde korunur; ekran içerikleri `presentation/views`
altındadır. Ayrıntılar için [mimari belgesi](docs/architecture.md).

## Kontroller

```sh
pnpm check                # Mimari, TypeScript, lint ve tüm testler
pnpm check:architecture   # Katman sınırları, eksik içe aktarımlar ve döngüler
pnpm test:unit            # Bağımsız iş kuralları ve kullanım senaryoları
pnpm test:demo            # Randevu, ödeme, seans, katalog ve personel akışları
pnpm build               # Üretim derlemesi
pnpm start               # Üretim sunucusu
```

[Taşıma haritası](docs/migration-map.json), önceki yapıda bulunan 161 kaynak
dosyasının yeni konumunu listeler. İş kuralları ayrıştırılan dosyalarda harita
ana giriş dosyasını gösterir; çıkarılan parçalar mimari belgede açıklanır.
