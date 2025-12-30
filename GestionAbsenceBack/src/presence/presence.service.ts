import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, presence } from '@prisma/client';
import { CreatePresenceDto } from './dto/create-presence.dto';

@Injectable()
export class PresenceService {
  constructor(private prisma: PrismaService) {}

  async getBySlotId(slotId: number) {
    return this.prisma.presence.findMany({
      where: { slot_id: slotId },
    });
  }

  async deleteBySlot(slotId: number) {
    return this.prisma.presence.deleteMany({
      where: { slot_id: slotId },
    });
  }

  async getByYear(year: number) {
    const semesterNames = [`S${(year - 1) * 2 + 1}`, `S${(year - 1) * 2 + 2}`];
    
    const absences = await this.prisma.presence.findMany({
      where: {
        presence_student: {
          student_inscription: {
            some: {
              inscription_group: {
                group_semester: {
                  name: {
                    in: semesterNames,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        presence_student: { 
          select: {
            name: true,
            student_number: true,
          },
        },
        presence_slot: {
          select: {
            date: true,
            slot_session_type: {
              select: {
                sessionTypeGlobal: { 
                  select: { name: true }
                },
                session_type_course_material: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const simplified = absences.map((a) => ({
      name: a.presence_student.name,
      student_number: a.presence_student.student_number,
      date: a.presence_slot.date,
      session_type: a.presence_slot.slot_session_type.sessionTypeGlobal.name,
      course_material:
        a.presence_slot.slot_session_type.session_type_course_material.name,
    }));
    return simplified;
  }

  async get(id: Prisma.presenceWhereUniqueInput): Promise<presence | null> {
    return this.prisma.presence.findUnique({
      where: id,
    });
  }

  async getAll(): Promise<presence[]> {
    return this.prisma.presence.findMany();
  }

  async post(data: CreatePresenceDto): Promise<presence> {
    const { student_id, slot_id } = data;

    return this.prisma.presence.create({
      data: {
        presence_student: {
          connect: { id: student_id },
        },
        presence_slot: {
          connect: { id: slot_id },
        },
      },
    });
  }

  async updateJustification(student_id: number, slot_id: number, justified: boolean) {
    return this.prisma.presence.update({
      where: {
        student_id_slot_id: {
          student_id,
          slot_id,
        },
      },
      data: {
        justified: justified,
      },
    });
  }

  async postMany(slotId: number, studentIds: number[]) {
    const data = studentIds.map((studentId) => ({
      student_id: studentId,
      slot_id: slotId,
    }));
    
    return this.prisma.presence.createMany({ 
      data,
    });
  }

  async delete(id: Prisma.presenceWhereUniqueInput): Promise<presence> {
    return this.prisma.presence.delete({
      where: id,
    });
  }

  async deleteMany() {
    return this.prisma.presence.deleteMany();
  }

  async addJustification(studentId: number, slotId: number, filePath: string) {
    return this.prisma.presence.upsert({
      where: {
        student_id_slot_id: {
          student_id: studentId,
          slot_id: slotId,
        },
      },
      update: {
        justified: true,
        justificationFile: filePath,
      },
      create: {
        student_id: studentId,
        slot_id: slotId,
        justified: true,
        justificationFile: filePath,
      },
    });
  }

  async getAbsencesByCourse(courseId: number) {
    const absences = await this.prisma.presence.findMany({
      where: {
        presence_slot: {
          slot_session_type: {
            course_material_id: courseId,
          },
        },
      },
      include: {
        presence_student: { 
          select: { name: true, student_number: true } 
        },
        presence_slot: {
          select: {
            id: true,
            date: true,
            start_time: true,
            end_time: true,
            slot_session_type: {
              select: {
                sessionTypeGlobal: { select: { name: true } },
                session_type_course_material: { select: { name: true } }
              },
            },
          },
        },
      },
    });

    return absences.map((a) => ({
      id: `${a.student_id}-${a.presence_slot.id}`, 
      
      name: a.presence_student.name,               
      studentNumber: a.presence_student.student_number,
      
      date: a.presence_slot.date,
      start_time: a.presence_slot.start_time,
      end_time: a.presence_slot.end_time,
      
      session_type: a.presence_slot.slot_session_type.sessionTypeGlobal.name,
      course_material: a.presence_slot.slot_session_type.session_type_course_material.name,
      
      justified: a.justified,
      justificationFile: a.justificationFile,
      student_id: a.student_id,
      slot_id: a.presence_slot.id
    }));
  }
}
