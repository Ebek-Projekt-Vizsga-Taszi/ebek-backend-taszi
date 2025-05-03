const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  // Ellenőrizzük, hogy létezik-e már a szervezeti fiók
  const existingSzervezet = await prisma.szervezet.findUnique({
    where: { email: 'szervezet@szervezet.hu' }
  });

  if (!existingSzervezet) {
    // Jelszó hashelése
    const hashedPassword = await argon2.hash('szervezet');

    // Szervezeti fiók létrehozása
    await prisma.szervezet.create({
      data: {
        email: 'szervezet@szervezet.hu',
        felhasznalonev: 'szervezet',
        jelszo: hashedPassword,
        nev: 'Teszt Szervezet'
      }
    });

    console.log('Szervezeti fiók létrehozva');
  } else {
    console.log('Szervezeti fiók már létezik');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 