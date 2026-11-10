# Command & Conquer: Mini-Generals 🎮

Brauzerda ishlaydigan, ortiqcha o‘rnatishlarni talab qilmaydigan, *Command & Conquer: Generals* uslubidagi yengil va qiziqarli real vaqt strategiya (RTS) o‘yini.

---

## 🚀 Texnologiyalar
* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Renderlash mexanizmi:** HTML5 Canvas 2D
* **Arxitektura:** Yagona mustaqil `index.html` fayl (server yoki internet talab etilmaydi)

---

## 🎯 2-Bosqich: Kengaytirilgan Iqtisodiyot, AI va Jang Mexanikasi

### 1. Iqtisodiyot va Resurslar (Supply System)
* **Supply Dock:** Xarita markazida joylashgan cheklangan resurs koni.
* **Ishchi mashina (Worker):** Avtomatik ravishda kon va HQ o'rtasida qatnaydi, har gal `+100$` quti tashiydi va bazaga pul qo'shadi.

### 2. Baza va Harbiy Ishlab Chiqarish
* **Bosh bino (HQ):** Asosiy tayanch bino (2000 HP).
* **Kazarma (Barracks - 500$):** Piyoda askar (**Mergan Askar / Ranger**) chiqaradi.
* **Zavod (War Factory - 800$):** Zirhli texnika (**Jangovar Tank**) chiqaradi.
* **Tezkor klavishlar:**
  * <kbd>Q</kbd> — Kazarma qurish ($500)
  * <kbd>W</kbd> — Zavod qurish ($800)
  * <kbd>E</kbd> — Ishchi mashina chiqarish ($200)
  * <kbd>R</kbd> — Mergan askar chiqarish ($150)
  * <kbd>T</kbd> — Jangovar tank chiqarish ($600)

### 3. Taktik Jangovar Tizim (Combat)
* **Masofadan otish (Attack Range):** Har bir jangovar birlik o'z otish masofasiga ega bo'lib, dushman yaqinlashganda avtomatik snaryad uzadi.
* **Binolarni o'qqa tutish:** Tanklar va askarlar nafaqat dushman birliklariga, balki dushman binolariga (shu jumladan HQ ga) ham o'q uzadi.
* **Jon chiziqlari (HP):** Barcha birliklar va binolar tepasida jon chizig'i mavjud. HP tugasa ob'ekt portlab xaritadan o'chiriladi.

### 4. Sun'iy Intellekt (AI Raqib - 1 ga 1)
* Xaritaning o'ng tomonida qizil rangli dushman bazasi joylashgan.
* AI vaqti-vaqti bilan yangi tank va askarlar chiqaradi, kuch to'playdi va o'yinchi bazasiga qarab hujum uyushtiradi.
* **G'alaba va Mag'lubiyat:** Dushman HQ vayron qilinsa — **G'alaba**, o'yinchining HQ si vayron bo'lsa — **Mag'lubiyat** ekrani chiqadi.

---

## 🕹 Ishga tushirish
Hech qanday o'rnatish shart emas. `index.html` faylini istalgan brauzerda ikki marta bosib oching.
