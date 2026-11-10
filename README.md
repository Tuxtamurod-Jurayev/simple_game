# Command & Conquer: Generals (Tactical Web RTS v4.0) 🎮

Brauzerda ishlaydigan, **React + TypeScript + Canvas** arxitekturasiga ega to'liq modulli va zamonaviy real vaqt strategiya (RTS) o'yini.

---

## 🎖 4-Bosqich: Vizual Realizm, AI Qiyinchilik Darajalari va Haqiqiy Generals HUD

### 1. Taktik Skirmish Menyu (AI Qiyinchilik Darajalari)
O'yin boshlanishida dushman generalining darajasi tanlanadi:
* **Oson (Kursant / Easy):** Boshlang'ich mablag' $1,500, sekin rivojlanadi (9.5s), faqat yengil texnikalar bilan hujum qiladi.
* **O'rta (Mayor / Medium):** Boshlang'ich mablag' $3,000, Crusader tanklari va Humvee guruhlari bilan muntazam hujum qiladi (6s).
* **Qiyin (General / Brutal Hard):** Boshlang'ich mablag' $5,500, 1.6x daromad koeffitsienti, har 3.5 soniyada hujum qiladi, ikki stvolli og'ir **Overlord** tanklarini chiqaradi va eng kam jonli (HP) nishonlarni birinchi yo'q qiladi.

### 2. Realistik Harbiy Modellar va VFX
* **Crusader Tank:** Zirhli korpus, tishli gusenitsalar va 360° nishonga qarab aylanuvchi mustaqil minora (turret).
* **Humvee Recon:** Yuqori tezlikka ega taktik razvedka mashinasi.
* **Overlord Tank:** Ikki stvolli ulkan og'ir tank (1300 HP, 75 damage, stvollardan ketma-ket og'ir o't ochadi).
* **Supply Truck:** Resurs kashfiyotchisi, konlardan $120 lik qutilarni tashib bazaga pul yig'adi.
* **VFX & Zararlar:**
  * O'q uzilganda stvoldan olov chaqnashi (*Muzzle Flash*).
  * 40% dan kam HP qolgan texnikalardan qora tutun chiqishi.
  * Portlash zarrachalari va zarba to'lqinlari.
  * Cho'l relefi, asfalt baza yo'laklari va tosh barxanlari.

### 3. Klassik Generals HUD Interfeysi
* **Yuqori Taktik Panel:**
  * Credits ($), Energiya shkalasi (Power bar), Tanlangan AI darajasi.
* **Asosiy Maydon (1100 x 520 px):**
  * Box selection (ramka tortib bir nechta birlikni tanlash), nishon doiralari, snaryad treyseri.
* **Pastki Generals Boshqaruv Paneli (Classic Control Bar):**
  * **Chap:** Taktik Radar (Jonli Minimap - birliklar va bazalar koordinatasi bilan).
  * **O'rta:** Tanlangan tank/bino portreti, zirh va buyruqlar holati.
  * **O'ng (3x4 Command Grid):**
    * Supply Truck ($250)
    * Humvee Recon ($400)
    * Crusader Tank ($700)
    * Overlord Tank ($1200)
    * War Factory ($800)
    * **A-10 Air Strike (Aviatsiya zarbasi):** 100% ga to'lganda ketma-ket 5 ta kuchli aviabomba tashlab dushman bazasini yakson qiladi!

---

## 🕹 Boshqaruv
* **Sichqonchaning chap tugmasi:** Biror obyektni tanlash yoki ramka chizib **guruhlab tanlash**.
* **Sichqonchaning o'ng tugmasi:** Tanlangan butun guruhni saf tortib (formation) harakatlantirish.
* **War Factory qurish:** Menyu orqali tanlab xaritaga joylashtirish.
* **A-10 Air Strike:** 100% zaryadlanganda bosib dushmanga havodan zarba berish.

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
