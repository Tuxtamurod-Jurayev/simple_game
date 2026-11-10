# Command & Conquer: Generals (Tactical Web RTS v5.0) 🎮

Brauzerda ishlaydigan, **React 18+, TypeScript, HTML5 Canvas 2D, Web Audio API va Web Speech API** asosidagi to'liq protsessual real vaqt strategiya (RTS) o'yini.

---

## 🚀 5-Bosqich Yangiliklari: Asimmetrik Fraktsiyalar, Fog of War, Superqurollar va Sintezlangan Audio

### 1. Uchta Asimmetrik Fraktsiya
* **USA (AQSH):**
  * **Yuqori texnologiya va Lazer:** Paladin tanki yaqinlashayotgan dushman snaryadlarini lazer bilan urib tushiradi (*Point Defense Laser*).
  * **Supply Chinook:** Havoda to'siqlarsiz uchuvchi ikki parrakli vertolyot (+$140 resurs).
  * **Particle Cannon:** Osmondan tushuvchi moviy lazer nuri bilan dushmanni kuydiradi.
  * **Maxsus qoida:** Energiya yetishmasa (Low Power), radar o'chadi va ishlab chiqarish 50% sekinlashadi.
* **CHINA (XITOY):**
  * **Horde Bonusi:** 4 va undan ortiq Xitoy tanklari birga tursa, ostida oltin aura yonadi va otish tezligi +25% ga oshadi!
  * **Overlord Tank:** Ulkan 4 gusenitsali monstr tank, 2 ta og'ir parallel stvol va gattling pulemyoti.
  * **Gattling Tank:** 6 stvolli aylanuvchi pulemyot (uzluksiz o't ochganda otish tezligi tezlashadi).
  * **Nuclear Missile Silo:** Katta maydonga yadroviy zarba beruvchi raketa (Screen Shake va olovli zarba to'lqini).
* **GLA (GLOBAL LIBERATION ARMY):**
  * **No Power Required:** GLA elektr energiyasiga muhtoj emas (doimo 100% quvvatda ishlaydi).
  * **Salvage Crates:** Dushman tanklari portlaganda tushgan metall qutilarni olib texnikalarini kuchaytiradi (+25% HP va qo'shimcha raketa stvollari).
  * **Scorpion & Marauder Tanklari:** Og'ir to'plar va Scorpion raketalari.
  * **Scud Storm:** 7 ta zaharli Scud raketasi va uzoq vaqt saqlanuvchi Anthrax gazi.

---

### 2. Katta Xarita, Kamera va "Fog of War" (2D Grid Tizimi)
* **Katta Jang Maydoni:** `2400 x 1600` piksel.
* **Kamera Boshqaruvi:** `W, A, S, D` / strelkalar yoki sichqoncha bilan chetga (25px) borganda avtomatik siljish (Edge Scrolling).
* **Urush Tumani (Fog of War):** `60 x 40` matritsa (jami 2400 katak):
  * `0 (Qora):` O'rganilmagan hudud.
  * `1 (Yarim qorong'i - Shroud):` Avval ko'rilgan landshaft va binolar, lekin harakatdagi dushman tanklari yashirin.
  * `2 (Ochiq - Visible):` Birliklar ko'rish radiusidagi to'liq ochiq maydon.

---

### 3. Protsessual Vizual Chizmalar va Sintezlangan Audio
* **0 Tashqi Fayl:** Barcha binolar, tanklar, aylanuvchi minoralar, samolyotlar va zarrachalar kod yordamida (Canvas 2D) protsessual chiziladi.
* **Web Audio API:**
  * Og'ir tank to'pi zarbasi (`sawtooth` 140Hz -> 30Hz + shovqin).
  * Lazer nuri (`sine` + `square` 880Hz -> 1760Hz).
  * Gattling pulemyoti va trevoga sirenasi.
  * Portlashlar (kichik, katta, nuke).
* **Web Speech API:** Fraktsiyalarga xos ovozli buyruqlar (*"Ready for action", "China will grow larger", "For the cause"*).

---

### 4. Taktik Boshqaruv Paneli (Command HUD)
* **Taktik Radar (Minimap):** 240x135 interaktiv mini-xarita (chap tugma — kamerani siljitish, o'ng tugma — qo'shinni yuborish).
* **Tanlangan Obyekt Portreti:** Zirh, HP, Veterancy unvoni va Production Queue (0% -> 100%).
* **12-Tugmali Command Grid:** Tezkor klaviatura buyruqlari bilan inshootlar qurish va tanklar chiqarish.
* **Superqurollar & General Powers:** Spy Satellite, Emergency Repair & Cash Drop, A-10 Thunderbolt carpet bombing.

---

## 🕹 Boshqaruv
* `W, A, S, D` yoki Strelkalar — Kamerani surish.
* Kursor chetiga borish — Edge scrolling.
* Chap tugma bilan ramka tortish — Guruhlab tanlash (Box Selection).
* O'ng tugma — Tanlangan birliklarni taktik safda yuborish.
* `[Q]`, `[W]`, `[E]`, `[R]` — Tezkor qurilish va birlik chiqarish.

---

## 🛠 Ishga tushirish

```bash
# Qaramliklarni o'rnatish
npm install

# Dev serverni ishga tushirish (Vite)
npm run dev

# Ishlab chiqarish uchun build qilish
npm run build
```
