#!/usr/bin/env node
/**
 * Скрипт назначения Custom Claim { admin: true } пользователю Firebase Auth.
 * 
 * Использование:
 *   node scripts/set-admin.cjs <путь_к_serviceAccountKey.json> <UID_пользователя>
 * 
 * Пример:
 *   node scripts/set-admin.cjs ./serviceAccountKey.json 4k3J9sl2NmOpQ...
 */

const fs = require('fs');
const path = require('path');

const keyPath = process.argv[2];
const targetUid = process.argv[3];

if (!keyPath || !targetUid) {
  console.error('\n❌ Ошибка: Не указаны обязательные параметры.\n');
  console.log('Использование:');
  console.log('  node scripts/set-admin.cjs <путь_к_serviceAccountKey.json> <UID_пользователя>\n');
  console.log('Пример:');
  console.log('  node scripts/set-admin.cjs ./serviceAccountKey.json 4k3J9sl2NmOpQ...\n');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), keyPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`\n❌ Файл ключа не найден по пути: ${resolvedPath}\n`);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
} catch (err) {
  console.error('\n❌ Ошибка чтения JSON файла ключа:', err.message);
  process.exit(1);
}

// Проверяем наличие firebase-admin, если нет - даем подсказку
let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('\n❌ Пакет firebase-admin не установлен.');
  console.log('Установите его командой:');
  console.log('  npm install -D firebase-admin\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim() {
  try {
    const user = await admin.auth().getUser(targetUid);
    console.log(`\nНайден пользователь: ${user.email || user.uid}`);
    
    await admin.auth().setCustomUserClaims(targetUid, { admin: true });
    
    console.log(`✅ Успешно! Роль { admin: true } назначена пользователю ${user.email || targetUid}.`);
    console.log('\nВАЖНО: Пользователю нужно выйти и снова войти в аккаунт в приложении, чтобы токен обновился!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Ошибка при назначении прав:', err.message);
    process.exit(1);
  }
}

setAdminClaim();
