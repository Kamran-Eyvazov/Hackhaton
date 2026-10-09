// Demo data: node seed.js  (müəllim + 12 şagird + cəhdlər)
const { db, hashPw } = require('./db');
const mk = (role, name, email) => {
  const { salt, hash } = hashPw('demo1234');
  return db.prepare('INSERT INTO users(role,name,email,salt,hash) VALUES(?,?,?,?,?)').run(role, name, email, salt, hash).lastInsertRowid;
};
if (db.prepare("SELECT 1 FROM users WHERE email='tamerlan@demo.az'").get()) { console.log('Demo data artıq var.'); process.exit(); }

const t = mk('teacher', 'Tamerlan müəllim', 'tamerlan@demo.az');
const cid = db.prepare("INSERT INTO classes(name,code,teacher_id) VALUES('5a','5A-DEMO',?)").run(t).lastInsertRowid;

const kids = [['Aysel',0.40],['Elvin',0.10],['Nigar',0.55],['Rəşad',0.35],['Leyla',0.12],['Murad',0.65],
              ['Səbinə',0.28],['Orxan',0.50],['Ülviyyə',0.05],['Kamran',0.58],['Zeynəb',0.2],['Tural',0.4]];
const topics = [['Adi kəsrlər',1.4],['Onluq kəsrlər',0.8],['Kəsrlərin müqayisəsi',0.6]];
const types = ['concept', 'calculation', 'gap'];
const needs = ['none','none','dyslexia','none','none','vision','none','none','none','hearing','none','none'];
const ins = db.prepare('INSERT INTO attempts(child_id,topic,error_type,solved) VALUES(?,?,?,?)');

kids.forEach(([name, base], i) => {
  const p = mk('parent', name + ' valideyni', `parent${i + 1}@demo.az`);
  const id = db.prepare('INSERT INTO children(parent_id,class_id,name,needs) VALUES(?,?,?,?)').run(p, cid, name + ' M.', needs[i]).lastInsertRowid;
  for (let k = 0; k < 15; k++) {
    const [topic, w] = topics[Math.floor(Math.random() * topics.length)];
    const wrong = Math.random() < Math.min(base * w, 0.9);
    ins.run(id, topic, wrong ? types[Math.floor(Math.random() * 3)] : 'none', wrong ? 0 : 1);
  }
});
console.log('Hazırdır!\nMüəllim: tamerlan@demo.az / demo1234\nValideyn: parent1@demo.az / demo1234\nSinif kodu: 5A-DEMO');
