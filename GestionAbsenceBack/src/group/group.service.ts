import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, group } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateGroupBySemesterNameDto } from './dto/create-group-semester-name.dto';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}

  async get(id: Prisma.groupWhereUniqueInput): Promise<group | null> {
    return this.prisma.group.findUnique({
      where: id,
    });
  }

  async getAll(): Promise<group[]> {
    return this.prisma.group.findMany();
  }

  async getByStudentId(studentId: number) {
    return this.prisma.group.findMany({
      where: {
        group_inscription: {
          some: {
            student_id: studentId,
          },
        },
      },
    });
  }

  // MODIFIÉ : Accepte 'year' et filtre par S1/S2, S3/S4, S5/S6
  async getAllBySemester(year: number): Promise<group[]> {
    // Détermine les noms de semestre pour l'année donnée
    // (ex: year=1 -> S1, S2; year=2 -> S3, S4)
    const semesterNames = [`S${(year - 1) * 2 + 1}`, `S${(year - 1) * 2 + 2}`];

    return this.prisma.group.findMany({
      where: {
        group_semester: {
          name: {
            in: semesterNames,
          },
        },
      },
      orderBy: {
        semester_id: 'asc',
      },
    });
  }

  async post(data: CreateGroupDto): Promise<group> {
    const { name, semester_id } = data;
    return this.prisma.group.create({
      data: {
        name,
        group_semester: {
          connect: {
            id: semester_id,
          },
        },
      },
    });
  }

  async postFromSemesterName(
    data: CreateGroupBySemesterNameDto,
  ): Promise<group> {
    const { semester_name, name } = data;
    const semester = await this.prisma.semester.findFirst({
      where: {
        name: semester_name,
      },
    });
    if (!semester) {
      throw new Error('Semestre introuvable');
    }
    return this.prisma.group.create({
      data: {
        name,
        group_semester: {
          connect: {
            id: semester.id,
          },
        },
      },
    });
  }

  async update(
    id: Prisma.groupWhereUniqueInput,
    data: Prisma.groupUpdateInput,
  ): Promise<group> {
    return this.prisma.group.update({
      where: id,
      data,
    });
  }

  async delete(id: Prisma.groupWhereUniqueInput): Promise<group> {
    return this.prisma.group.delete({
      where: id,
    });
  }

  async deleteMany() {
    return this.prisma.group.deleteMany();
  }
}
