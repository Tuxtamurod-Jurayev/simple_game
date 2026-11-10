# Command & Conquer: Generals (React + Vite + TypeScript RTS) 🎮

Brauzerda ishlaydigan, **React 18 + Vite + TypeScript** arxitekturasiga ega to'liq modulli va zamonaviy real vaqt strategiya (RTS) o'yini.

---

## 🚀 3-Bosqich Yangiliklari: React, TypeScript va Guruhlab Tanlash (Box Selection)

### 1. Arxitektura va Modullik
* **React 18 & TypeScript:** To'liq tiplashtirilgan interfeyslar (`Unit`, `Building`, `GameState`, `Projectile`).
* **Komponentlar:**
  * `GameCanvas.tsx` — 60 FPS Canvas 2D render sikli, fizika, jang va ramkali tanlash.
  * `UIOverlay.tsx` — Mablag', energiya, dushman HQ va audio sozlamalari.
  * `BuildMenu.tsx` — Generals uslubidagi tanlangan obyekt kartasi va tezkor ishlab chiqarish menyusi.
  * `audio.ts` — Web Audio API orqali procedural tovushlar.

### 2. Ramkali Guruhlab Tanlash (Box / Drag Selection)
* Sichqonchaning chap tugmasini bosib ramka tortish orqali bir vaqtning o'zida butun qo'shinni (tanklar, ishchilar, askarlar) tanlash mumkin!
* O'ng tugma (yoki bo'sh joyga bosish) orqali tanlangan butun guruh taktik safda (formation) yangi koordinataga yo'l oladi.

### 3. C&C Generals Vizual Modellari va Jang Tizimi
* **Crusader Tank:** Tishli gusenitsalar, erga tushadigan izlar, mustaqil 360° aylanuvchi minora va recoil animatsiyasi.
* **Supply Truck:** 6 g'ildirakli og'ir transport, sariq resurs qutilarini yuklash/tushirish.
* **US Ranger:** Flak jilet, kaska, avtomat va yurish animatsiyasi.
* **USA Command Center:** Helipad ("H"), aylanuvchi radar va miltillovchi qizil mayoq.
* **War Factory & Barracks:** Angar darvozalari, qum qopli bunkerlar.
* **Taktik Radar (Minimap):** Jonli mini-xarita va radar nuri aylanishi.

---

## 🕹 Boshqaruv
* **Sichqonchaning chap tugmasi:** Biror obyektni tanlash yoki ramka chizib **guruhlab tanlash**.
* **Sichqonchaning o'ng tugmasi (yoki chap tugma):** Tanlangan guruhni harakatlantirish.
* <kbd>Q</kbd> — Kazarma (Barracks) qurish ($500)
* <kbd>W</kbd> — Zavod (War Factory) qurish ($800)
* <kbd>E</kbd> — Supply Truck chiqarish ($200)
* <kbd>R</kbd> — US Ranger askar tayyorlash ($150)
* <kbd>T</kbd> — Crusader Tank ishlab chiqarish ($600)

---

## 🛠 O'rnatish va Ishga tushirish

```bash
# Qaramliklarni o'rnatish
npm install

# Ishchi serverni ishga tushirish (Vite)
npm run dev

# Ishlab chiqarish uchun build qilish
npm run build
```
