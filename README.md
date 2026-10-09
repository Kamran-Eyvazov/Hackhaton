# MəktəbAI

## Quraşdırma
1. Node.js 20+ quraşdırın (https://nodejs.org)
2. Terminalda layihə qovluğunda:
   ```
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   ```
3. `.env` faylında `OPENAI_API_KEY` yazın (https://platform.openai.com/api-keys)
4. Demo data (ixtiyari, tövsiyə olunur): `npm run seed`
5. Başladın: `npm start` -> http://localhost:3000

## Demo hesablar (seed-dən sonra, şifrə hamısı: demo1234)
- Müəllim: tamerlan@demo.az
- Valideyn: parent1@demo.az
- Sinif kodu: 5A-DEMO

## Struktur
- `db.js`      SQLite cədvəlləri (users, classes, children, attempts, sessions)
- `server.js`  API + Claude (Sokratik söhbət, sadələşdirmə, xülasə)
- `seed.js`    demo data
- `public/`    frontend (index.html, app.js, style.css)
