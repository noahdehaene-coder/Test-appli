import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du script de seed...');

  const saltRounds = 10;
  const defaultPassword = 'admin';
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  console.log(`Mot de passe par défaut ('${defaultPassword}') hashé.`);

  
  const semesters = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  
  for (const semesterName of semesters) {
    await prisma.semester.upsert({
      where: { name: semesterName },
      update: {}, 
      create: { name: semesterName },
    });
  }
  
  console.log('Les 6 semestres ont été vérifiés/créés.');

  const sessionTypes = ['CM', 'TD', 'TP'];
  
  for (const typeName of sessionTypes) {
    await prisma.sessionTypeGlobal.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName },
    });
  }
  console.log('Les types de session globaux (CM, TD, TP) ont été vérifiés/créés.');

  await prisma.user.upsert({
    where: { email: 'gestionnaire@univ-grenoble-alpes.fr' }, // Email unique
    update: {}, // Ne rien faire s'il existe déjà
    create: {
      email: 'gestionnaire@univ-grenoble-alpes.fr',
      name: 'Admin Principal',
      password: hashedPassword,
      role: UserRole.GESTIONNAIRE,
    },
  });

  console.log('Utilisateur Gestionnaire créé avec succès.');
  console.log(`Email: gestionnaire@univ-grenoble-alpes.fr`);
  console.log(`Mot de passe: ${defaultPassword}`);
  console.log('Seed terminé.');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });