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
            id: true,
            name: true,
            student_number: true,
          },
        },
        presence_slot: {
          select: {
            id: true,
            date: true,
            start_time: true,
            end_time: true,
            slot_session_type: {
              select: {
                sessionTypeGlobal: { 
                  select: { name: true }
                },
                session_type_course_material: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get all slots from courses in these semesters
    const allSlots = await this.prisma.slot.findMany({
      where: {
        slot_session_type: {
          session_type_course_material: {
            course_material_semester: {
              name: {
                in: semesterNames,
              },
            },
          },
        },
      },
      select: {
        id: true,
        date: true,
        slot_session_type: {
          select: {
            session_type_course_material: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Get all presences (absences) in these semesters
    const allPresences = await this.prisma.presence.findMany({
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
      select: { student_id: true, slot_id: true },
    });

    const absentSlotMap = new Map<number, Set<number>>();
    allPresences.forEach((p) => {
      if (!absentSlotMap.has(p.student_id)) {
        absentSlotMap.set(p.student_id, new Set());
      }
      absentSlotMap.get(p.student_id)!.add(p.slot_id);
    });

    // For each student, build a set of "date + courseId" pairs where they attended a session
    const uniqueStudentIds = new Set(absences.map((a) => a.student_id));
    const studentAttendedDayCourses = new Map<number, Set<string>>();

    for (const studentId of uniqueStudentIds) {
      const attendedSlotsForStudent = allSlots.filter((slot) => {
        const absentSlots = absentSlotMap.get(studentId) || new Set();
        return !absentSlots.has(slot.id);
      });

      const attendedDayCourses = new Set<string>();
      attendedSlotsForStudent.forEach((slot) => {
        const dateStr = new Date(slot.date).toISOString().split('T')[0];
        const courseId = slot.slot_session_type.session_type_course_material.id;
        attendedDayCourses.add(`${dateStr}|${courseId}`);
      });

      studentAttendedDayCourses.set(studentId, attendedDayCourses);
    }

    // Filter absences: exclude if student attended same course same day
    const filteredAbsences = absences.filter((a) => {
      const dateStr = new Date(a.presence_slot.date).toISOString().split('T')[0];
      const courseId = a.presence_slot.slot_session_type.session_type_course_material.id;
      const key = `${dateStr}|${courseId}`;
      const attendedCourses = studentAttendedDayCourses.get(a.student_id);
      return !attendedCourses?.has(key);
    });

    const simplified = filteredAbsences.map((a) => ({
      name: a.presence_student.name,
      student_number: a.presence_student.student_number,
      date: a.presence_slot.date,
      start_time: a.presence_slot.start_time,
      end_time: a.presence_slot.end_time,
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

    // Get all absences for this course to know which slots students missed
    const allAbsences = await this.prisma.presence.findMany({
      where: {
        presence_slot: {
          slot_session_type: {
            course_material_id: courseId,
          },
        },
      },
      select: { student_id: true, slot_id: true },
    });

    // Get all slots for this course
    const courseSlots = await this.prisma.slot.findMany({
      where: {
        slot_session_type: {
          course_material_id: courseId,
        },
      },
      select: {
        id: true,
        date: true,
      },
    });

    // Build a set of all student IDs in this course
    const uniqueStudentIds = new Set(absences.map((a) => a.student_id));

    // For each student, find if they attended ANY session of this course on each day
    const studentAbsencesToExclude = new Map<number, Set<string>>();

    for (const studentId of uniqueStudentIds) {
      // Find all slots for this course where this student did NOT have an absence
      const attendedSlots = courseSlots.filter((slot) => {
        return !allAbsences.some(
          (a) => a.student_id === studentId && a.slot_id === slot.id
        );
      });

      // For each date where student attended at least one slot, mark it as "attended"
      const attendedDates = new Set<string>();
      attendedSlots.forEach((slot) => {
        const dateStr = new Date(slot.date).toISOString().split('T')[0];
        attendedDates.add(dateStr);
      });

      studentAbsencesToExclude.set(studentId, attendedDates);
    }

    // Filter absences: exclude if student attended ANY session of this course on that day
    const filteredAbsences = absences.filter((a) => {
      const dateStr = new Date(a.presence_slot.date).toISOString().split('T')[0];
      const attendedDates = studentAbsencesToExclude.get(a.student_id);
      return !attendedDates?.has(dateStr);
    });

    return filteredAbsences.map((a) => ({
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
