import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Promotion pour un semestre spécifique
   * Exemple: L1S1 -> L1S2, L2S3 -> L2S4, L3S5 -> L3S6
   * - Supprime tous les groupes du semestre actuel
   * - Passe les étudiants au semestre suivant
   * - Les assigne au groupe classe correspondant (ex: L1S2)
   */
  async promoteSemester(year: number, semester: number): Promise<{ success: boolean; message: string }> {
    // Validation
    if (year < 1 || year > 3) {
      throw new Error('L\'année doit être entre 1 et 3');
    }
    if (semester !== 1 && semester !== 3 && semester !== 5) {
      throw new Error('La promotion ne peut se faire que du S1, S3 ou S5');
    }

    const currentSemesterId = semester; // S1, S3, S5 = 1, 3, 5
    const nextSemesterId = currentSemesterId + 1; // S2, S4, S6 = 2, 4, 6

    const currentSemesterName = `S${currentSemesterId}`;
    const nextSemesterName = `S${nextSemesterId}`;
    const classGroupName = `L${year}${nextSemesterName}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer le semestre actuel et vérifier qu'il existe
      const currentSemester = await tx.semester.findUnique({
        where: { name: currentSemesterName },
      });

      if (!currentSemester) {
        throw new Error(`Le semestre ${currentSemesterName} n'existe pas`);
      }

      // 2. Récupérer le semestre suivant et vérifier qu'il existe
      const nextSemester = await tx.semester.findUnique({
        where: { name: nextSemesterName },
      });

      if (!nextSemester) {
        throw new Error(`Le semestre ${nextSemesterName} n'existe pas`);
      }

      // 3. Récupérer tous les groupes du semestre actuel
      const groupsToDelete = await tx.group.findMany({
        where: { semester_id: currentSemester.id },
      });

      // 4. Récupérer tous les étudiants des groupes du semestre actuel
      const studentIds = new Set<number>();
      for (const group of groupsToDelete) {
        const inscriptions = await tx.inscription.findMany({
          where: { group_id: group.id },
        });
        inscriptions.forEach((insc) => studentIds.add(insc.student_id));
      }

      // 5. Trouver ou créer le groupe classe du semestre suivant (ex: L1S2)
      let classGroup = await tx.group.findFirst({
        where: {
          name: classGroupName,
          semester_id: nextSemester.id,
        },
      });

      if (!classGroup) {
        classGroup = await tx.group.create({
          data: {
            name: classGroupName,
            semester_id: nextSemester.id,
          },
        });
      }

      // 6. Supprimer les inscriptions des groupes du semestre actuel
      await tx.inscription.deleteMany({
        where: {
          group_id: {
            in: groupsToDelete.map((g) => g.id),
          },
        },
      });

      // 7. Supprimer les groupes du semestre actuel
      await tx.group.deleteMany({
        where: { semester_id: currentSemester.id },
      });

      // 8. Créer les inscriptions des étudiants dans le groupe classe du semestre suivant
      for (const studentId of studentIds) {
        await tx.inscription.create({
          data: {
            student_id: studentId,
            group_id: classGroup.id,
          },
        });
      }

      return {
        success: true,
        message: `Promotion de L${year}S${semester} vers L${year}S${semester + 1} réussie. ${studentIds.size} étudiants promus.`,
      };
    });
  }

  /**
   * Promotion d'année complète
   * - Les étudiants L1S2 -> L2S3, L2S4 -> L3S5 (structure S1,S2,S3,S4,S5,S6)
   * - Les étudiants L3S6 sont supprimés (fin de licence)
   * - Supprime tous les groupes actuels
   * - Assigne les étudiants au groupe classe correspondant du semestre suivant
   */
  async promoteYear(): Promise<{ success: boolean; message: string }> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer tous les semestres
      const s2 = await tx.semester.findUnique({ where: { name: 'S2' } });
      const s3 = await tx.semester.findUnique({ where: { name: 'S3' } });
      const s4 = await tx.semester.findUnique({ where: { name: 'S4' } });
      const s5 = await tx.semester.findUnique({ where: { name: 'S5' } });
      const s6 = await tx.semester.findUnique({ where: { name: 'S6' } });

      if (!s2 || !s3 || !s4 || !s5 || !s6) {
        throw new Error('Certains semestres n\'existent pas');
      }

      // 2. Récupérer tous les étudiants de L1S2, L2S4 et L3S6
      const l1s2Groups = await tx.group.findMany({
        where: { semester_id: s2.id },
      });

      const l2s4Groups = await tx.group.findMany({
        where: { semester_id: s4.id },
      });

      const l3s6Groups = await tx.group.findMany({
        where: { semester_id: s6.id },
      });

      // Récupérer les IDs des étudiants
      const l1s2StudentIds = new Set<number>();
      const l2s4StudentIds = new Set<number>();
      const l3s6StudentIds = new Set<number>();

      for (const group of l1s2Groups) {
        const inscriptions = await tx.inscription.findMany({
          where: { group_id: group.id },
        });
        inscriptions.forEach((insc) => l1s2StudentIds.add(insc.student_id));
      }

      for (const group of l2s4Groups) {
        const inscriptions = await tx.inscription.findMany({
          where: { group_id: group.id },
        });
        inscriptions.forEach((insc) => l2s4StudentIds.add(insc.student_id));
      }

      for (const group of l3s6Groups) {
        const inscriptions = await tx.inscription.findMany({
          where: { group_id: group.id },
        });
        inscriptions.forEach((insc) => l3s6StudentIds.add(insc.student_id));
      }

      // 3. Supprimer les étudiants de L3S6
      for (const studentId of l3s6StudentIds) {
        // Supprimer les inscriptions associées
        await tx.inscription.deleteMany({
          where: { student_id: studentId },
        });
        // Supprimer l'étudiant
        await tx.student.delete({
          where: { id: studentId },
        });
      }

      // 4. Supprimer tous les groupes actuels d'abord
      await tx.inscription.deleteMany({});

      // Supprimer les groupes
      await tx.group.deleteMany();

      // 5. Créer les groupes classes des semestres suivants
      const l2s3GroupName = 'L2S3';
      const l3s5GroupName = 'L3S5';

      const l2s3Group = await tx.group.create({
        data: {
          name: l2s3GroupName,
          semester_id: s3.id,
        },
      });

      const l3s5Group = await tx.group.create({
        data: {
          name: l3s5GroupName,
          semester_id: s5.id,
        },
      });

      // 6. Créer les inscriptions des étudiants dans les groupes classes appropriés
      for (const studentId of l1s2StudentIds) {
        await tx.inscription.create({
          data: {
            student_id: studentId,
            group_id: l2s3Group.id,
          },
        });
      }

      for (const studentId of l2s4StudentIds) {
        await tx.inscription.create({
          data: {
            student_id: studentId,
            group_id: l3s5Group.id,
          },
        });
      }

      const totalPromoted = l1s2StudentIds.size + l2s4StudentIds.size;
      const totalDeleted = l3s6StudentIds.size;

      return {
        success: true,
        message: `Nouvelle année réussie. ${totalPromoted} étudiants promus, ${totalDeleted} étudiants supprimés (fin de licence).`,
      };
    });
  }
}
