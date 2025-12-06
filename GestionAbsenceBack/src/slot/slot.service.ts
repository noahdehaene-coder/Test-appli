import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, slot as SlotModel } from '@prisma/client'; // Alias 'slot'
import { CreateSlotBySessionDto } from './dto/create-slot.dto'; // Import inversé
import { CreateSlotDto } from './dto/create-slot-by-session.dto'; // Import inversé
import { UpdateSlotDto } from './dto/update-slot.dto';

@Injectable()
export class SlotService {
  constructor(private prisma: PrismaService) {}

  async get(id: Prisma.slotWhereUniqueInput): Promise<SlotModel | null> {
    return this.prisma.slot.findUnique({
      where: id,
    });
  }

  async getAll(): Promise<SlotModel[]> {
    return this.prisma.slot.findMany();
  }

  async getAllByDate(date: string): Promise<SlotModel[]> {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    return this.prisma.slot.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        slot_session_type: {
          select: {
            sessionTypeGlobal: {
              select: { name: true }
            },
            session_type_course_material: {
              select: { name: true },
            },
          },
        },
        slot_group: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findByProfessorAndDate(professorId: number, dateString: string) {
    const startDate = new Date(dateString);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(dateString);
    endDate.setUTCHours(23, 59, 59, 999);

    return this.prisma.slot.findMany({
      where: {
        professorId: professorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        slot_group: { select: { name: true, id: true } },
        slot_session_type: {
            include: {
                sessionTypeGlobal: { select: { name: true, id: true } },
                session_type_course_material: { select: { name: true } }
            }
        }
      }
    });
  }

  async postBySessionName(data: CreateSlotBySessionDto, professorId: number) {
    const { groupId, courseName, sessionTypeGlobalId, date } = data; 

    if (typeof date !== 'string' || !date) {
      throw new Error(`La date fournie n'est pas valide ou est manquante.`);
    }
    let isoDate: Date;
    if (date.includes('/')) {
      const parts = date.split('/');
      if (parts.length !== 3) {
        throw new Error(`Format de date (DD/MM/YYYY) invalide reçu : ${date}.`);
      }
      isoDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      isoDate = new Date(date);
    }
    if (isNaN(isoDate.getTime())) {
      throw new Error(`Date invalide après conversion : ${date}`);
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { semester_id: true }
    });
    if (!group) {
      throw new Error('Groupe non trouvé.');
    }

    const courseMaterial = await this.prisma.course_material.upsert({
      where: { name: courseName },
      update: {}, 
      create: {
        name: courseName,
        semester_id: group.semester_id, 
      },
    });

    const sessionTypeRecord = await this.prisma.session_type.upsert({
      where: {
        sessionTypeGlobalId_course_material_id: {
          sessionTypeGlobalId: sessionTypeGlobalId,
          course_material_id: courseMaterial.id,
        }
      },
      update: {}, 
      create: { 
        sessionTypeGlobalId: sessionTypeGlobalId,
        course_material_id: courseMaterial.id,
      },
    });

    return this.prisma.slot.upsert({
      where: {
        date_session_type_id_group_id_professorId: {
          date: isoDate,
          session_type_id: sessionTypeRecord.id,
          group_id: groupId,
          professorId: professorId
        }
      },
      update: {},
      create: {
        date: isoDate,
        slot_group: {
          connect: { id: groupId },
        },
        slot_session_type: {
          connect: { id: sessionTypeRecord.id }, 
        },
        professor: {
          connect: { id: professorId },
        },
      },
    });
  }

  async getRecentCalls(professorId: number) {
    const recentSlots = await this.prisma.slot.findMany({
      where: { professorId: professorId },
      orderBy: { date: 'desc' },
      take: 20, 
      include: {
        slot_group: { select: { name: true } },
        slot_session_type: {
          select: {
            sessionTypeGlobal: { 
              select: { 
                name: true,
                id: true,
              }
            },
            session_type_course_material: { 
              select: { name: true } 
            },
          },
        },
      },
    });

    const uniqueTemplates = new Map();
    for (const slot of recentSlots) {
      if (!slot.slot_group || !slot.slot_session_type || !slot.slot_session_type.session_type_course_material || !slot.slot_session_type.sessionTypeGlobal) {
        continue; 
      }
      const courseName = slot.slot_session_type.session_type_course_material.name;
      const sessionType = slot.slot_session_type.sessionTypeGlobal.name;
      const sessionTypeGlobalId = slot.slot_session_type.sessionTypeGlobal.id;
      const groupId = slot.group_id;
      const groupName = slot.slot_group.name;
      const key = `${groupId}-${courseName}-${sessionType}`;

      if (!uniqueTemplates.has(key)) {
        uniqueTemplates.set(key, {
          key: key, 
          groupId: groupId,
          groupName: groupName,
          courseName: courseName,
          sessionType: sessionType,
          sessionTypeGlobalId: sessionTypeGlobalId,
          displayText: `${courseName} (${sessionType}) - ${groupName}`,
        });
      }
    }
    return Array.from(uniqueTemplates.values());
  }

  async post(data: CreateSlotDto): Promise<SlotModel> {
    throw new Error('La méthode "post" est obsolète. Utilisez "postBySessionName".');
  }

  async put(id: number, data: UpdateSlotDto): Promise<SlotModel> {
    const updateData = {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.group_id && { slot_group: { connect: { id: data.group_id } } }),
      ...(data.session_type_id && { slot_session_type: { connect: { id: data.session_type_id } } }),
    };
    return this.prisma.slot.update({
      where: { id: id },
      data: updateData,
    });
  }

  async delete(id: Prisma.slotWhereUniqueInput): Promise<SlotModel> {
    return this.prisma.slot.delete({
      where: id,
    });
  }

  async deleteMany(): Promise<Prisma.BatchPayload> {
    return this.prisma.slot.deleteMany();
  }

  async findBySessionName(data: CreateSlotBySessionDto, professorId: number) {
    const { groupId, courseName, sessionTypeGlobalId, date } = data;

    let isoDate: Date;
    if (date.includes('/')) {
      const parts = date.split('/');
      isoDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      isoDate = new Date(date);
    }

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return null;

    const course = await this.prisma.course_material.findUnique({ where: { name: courseName } });
    if (!course) return null;

    const sessionType = await this.prisma.session_type.findUnique({
      where: {
        sessionTypeGlobalId_course_material_id: {
          sessionTypeGlobalId: sessionTypeGlobalId,
          course_material_id: course.id,
        },
      },
    });
    if (!sessionType) return null;

    return this.prisma.slot.findUnique({
      where: {
        date_session_type_id_group_id_professorId: {
          date: isoDate,
          session_type_id: sessionType.id,
          group_id: groupId,
          professorId: professorId,
        },
      },
    });
  }
}