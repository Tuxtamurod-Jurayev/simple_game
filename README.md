# Command & Conquer: Generals (Tactical 3D Web RTS v6.0) 🎮

Brauzerda ishlaydigan, **React 18+, TypeScript, Three.js (@types/three), WebGL, Web Audio API va Web Speech API** asosidagi to'liq 3D protsessual real vaqt strategiya (RTS) o'yini.

---

## 🌟 6-BOSQICH YANGILIKLARI: THREE.JS 3D DVIJOK VA HARBIY MODELLASH

2D Canvas renderlashdan butunlay voz kechilib, barcha obyektlar (binolar, tanklar, vertolyotlar, snaryadlar va zarrachalar) **Three.js** yordamida to'liq 3D muhitga o'tkazildi. Tashqi model fayllari (`.gltf`/`.obj`) ishlatilmasdan, barcha 3D modellar **Low-Poly / Military CAD Style** uslubida kod orqali protsessual qurilgan.

### 1. 3D Arxitektura va Tizimlar
* **`ThreeGameCanvas.tsx`**: WebGL 60 FPS silliq render sikli, PCFSoftShadowMap yumshoq dinamik soyalar, ACESFilmicToneMapping yorug'lik kompozitsiyasi va Raycaster integratsiyasi.
* **`camera3D.ts`**: Strategik RTS kamerasi (burchak: ~55°, balandlik: 20-65 oralig'ida silliq Zoom, W/A/S/D va 25px chekka Edge Scroll).
* **`lightingSystem.ts`**: 
  * Quyosh nuri (`DirectionalLight`, `castShadow = true`, 2048x2048 shadow map).
  * Cho'l atrof-muhiti iliq qum rangli yoritilishi (`AmbientLight`, `#fef08a`).
  * Portlashlar nuqtasida paydo bo'lib 0.3s ichida so'nuvchi kuchli dinamik `PointLight` yorug'lik chaqnashlari.
* **`audio3D.ts`**: Kameragacha bo'lgan masofaga qarab ovoz balandligini avtomatik sozlovchi pozitsion audio tizimi.

---

### 2. Protsessual 3D Modellar va Animatsiyalar
* **Binolar (`Building3D.ts`):**
  * **HQ (Command Center):** Sakkizburchak bunker, metall vertolyot maydonchasi (Helipad), 360° doimiy aylanuvchi antenna parabolic radari.
  * **War Factory:** Angar konstruksiyasi, og'ir temir darvoza, tom qismidagi tutun quvurlari.
  * **Superqurollar:** Particle Cannon orbital antennasi, Nuclear Missile shaxtasi va Scud Storm raketa rampasi.
  * **Qurilish animatsiyasi (Scaffolding):** 0% dan 100% gacha bino pastdan tepaga o'sadi (`scale.y: 0.001 -> 1.0`), atrofida metall karkas chiziqlari (`EdgesGeometry`) karkas hosil qiladi va 100% da zirhli qoplamaga aylanadi.
* **Harbiy Texnikalar (`Unit3D.ts`):**
  * **Zanjirli gusenitsalar (Tracks):** Har bir tank korpusi ostida mustaqil gusenitsa bloklari.
  * **Mustaqil Aylanuvchi Minora (Turret):** Korpus harakat yo'nalishidan qat'i nazar, dushmanga 360° buriluvchi minora (`rotation.y`).
  * **Stvol va Qaytish (Recoil):** O'q otilganda stvol orqaga tiralib, yana oldinga silliq qaytadi.
  * **Overlord Tank:** 4 ta gusenitsali ulkan platforma, ikkita parallel stvol.
  * **Gattling Tank:** 6 ta aylanuvchi stvolli minigun klasteri.
  * **Supply Chinook:** Balandlikda (`y = 18`) uchuvchi, sekundiga 60 marta aylanuvchi parraklar va yerga tushuvchi dinamik soya.
* **Snaryadlar va Zarrachalar (`Projectile3D.ts`, `ParticleFX.ts`):**
  * 3D yorug'lik sferalari, tutun izli raketalar, orbital ko'k lazer nuri va yadroviy zamburug'simon bulut.
  * Har bir portlashda 50+ mayda uchqunlar va kengayuvchi qora tutun zarrachalari.
* **3D Fog of War (`FogOfWar3D.ts`):**
  * 60x40 matritsa asosida yer yuzasida silliq filtrlanuvchi shaffoflik va qorong'ilik plitasi.

---

### 3. Taktik Boshqaruv va HUD (`UIOverlay.tsx`)
* **3D Maydonda Harakat:** O'ng tugma bosilganda yerda yashil taktik nishon nuri paydo bo'ladi va tanlangan birliklar qatorda harakatlanadi.
* **Guruhlab Tanlash (Drag Select):** Ekranda sichqoncha bilan ramka tortib bir vaqtning o'zida o'nlab tanklarni tanlash.
* **Ghost Placement:** Qurilish vaqtida yerda bino o'lchamiga mos yashil/qizil 3D kubik paydo bo'ladi.
* **Minimap va 12 Tugmali Command Grid:** Mini-xarita radari, birliklar portreti va tezkor klaviatura buyruqlari.

---

## 🕹 Boshqaruv
* `W, A, S, D` yoki Strelkalar — 3D kamerani surish.
* Sichqoncha g'ildiragi (Scroll) — 3D kamerani yaqinlashtirish / uzoqlashtirish (Zoom).
* Kursor chetiga borish — Avtomatik chetga surilish (Edge Scrolling).
* Chap tugma bilan ramka tortish — Guruhlab tanlash (Box Selection).
* O'ng tugma — Harakatlanish yoki dushmanga hujum qilish buyrug'i.
* `Q, W, E, R, A, S, D, F...` — Bino qurish va bo'linmalar chiqarish.

---

## 🛠 O'rnatish va Ishga Tushirish

```bash
# Kutubxonalarni o'rnatish
npm install

# Dasturni ishlab chiquvchi rejimida ishga tushirish
npm run dev

# Ishlab chiqarish uchun build qilish
npm run build
```
Brauzerda: `http://localhost:3000`
