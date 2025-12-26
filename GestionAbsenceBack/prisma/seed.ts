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

  const coursesData = [
    { semester: 'S1', courses: ['Introduction à la statistique', 'Analyse réelle 1', 'Algèbre linéaire 1', 'Initiation à l\'informatique et à l\'algorithmique', 'Introduction aux sciences cognitives','Introduction aux sciences économiques','Anglais 1','Méthodologie du travail universitaire'] },
    { semester: 'S2', courses: ['Algèbre linéaire 2', 'Analyse réelle 2', 'Probabilités 1', 'Programmation fonctionnelle','Balises en méthodologie expérimentale','Cognition : du neurone à la pensée','Langage et cognition','Microéconomie 1','Macroéconomie 1','Anglais 2'] },
    { semester: 'S3', courses: ['Algèbre linéaire 3', 'Analyse réelle 3', 'Probabilités 2', 'Algorithmique et programmation par objets','Cognition : invariants et différences','Cognition : perception et motricité','Cognition et développement','Anglais 3','Microéconomie 2','Macroéconomie 2'] },
    { semester: 'S4', courses: ['Statistique mathématique 1', 'Mathématiques pour l\'informatique', 'Introduction aux bases de données', 'Langages formels et calculabilité','Programmation logique','Microéconomie 3','Macroéconomie 3','Anglais 4','Cognition et ergonomie','Cognition : mémoire(s) et représentations','Langage et cerveau'] },
    { semester: 'S5', courses: ['Statistique mathématique 2', 'Programmation objet avancée et structure de données', 'Cognition et apprentissage(s)', 'Cognition distribuée','Mathématiques complémentaires','Initiation à L\'IA','Econométrie 1'] },
    { semester: 'S6', courses: ['Statistique mathématique 3', 'Réseaux','Systèmes','Cognition ou intelligence(s) : l\'intégration','Modélisation des fonctions langagières','Introduction aux technologies du web','Compléments de mathématiques 2','Économie des contrats et des relations verticales','Econométrie 2'] },
  ];

  for (const data of coursesData) {
    const semester = await prisma.semester.findUnique({ where: { name: data.semester } });
    
    if (semester) {
      for (const courseName of data.courses) {
        await prisma.course_material.upsert({
          where: { name: courseName },
          update: {},
          create: {
            name: courseName,
            semester_id: semester.id,
          },
        });
      }
    }
  }
  console.log('Les matières (Course Materials) ont été injectées.');

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