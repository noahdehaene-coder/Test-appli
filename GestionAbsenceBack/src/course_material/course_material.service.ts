import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, course_material } from '@prisma/client';
import { CreateCourseMaterialDto } from './dto/create-course_material.dto';

@Injectable()
export class CourseMaterialService {
  constructor(private prisma: PrismaService) {}

  async get(
    id: Prisma.course_materialWhereUniqueInput,
  ): Promise<course_material | null> {
    return this.prisma.course_material.findUnique({
      where: id,
    });
  }

  async getAll(): Promise<course_material[]> {
    return this.prisma.course_material.findMany();
  }

 async getByStudentId(studentId: number) {
    const absences = await this.prisma.presence.findMany({
      where: {
        student_id: studentId,
      },
      include: {
        presence_slot: {
          select: {
            slot_session_type: {
              select: {
                sessionTypeGlobal: {
                  select: { name: true },
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

    const simplified = absences.map((presence) => ({
      id: presence.presence_slot.slot_session_type.session_type_course_material.id, 
      name:
        presence.presence_slot.slot_session_type.session_type_course_material
          .name,
      type:
        presence.presence_slot.slot_session_type.sessionTypeGlobal.name,
    }));

    return simplified.filter(
      (value, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.id === value.id,
        ),
    );
  }

  async getAbsencesByStudent(studentId: number) {
    const absences = await this.prisma.presence.findMany({
      where: { student_id: studentId },
      include: {
        presence_slot: {
          select: {
            id: true,
            date: true,
            start_time: true,
            end_time: true,
            slot_session_type: {
              select: {
                sessionTypeGlobal: { select: { name: true } },
                session_type_course_material: { 
                    select: { 
                        id: true,
                        name: true 
                    } 
                },
              },
            },
          },
        },
      },
    });

    // Get all slots for all courses to find which ones this student attended (not marked absent)
    const allSlots = await this.prisma.slot.findMany({
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

    // Get all presences for this student (all absences)
    const studentPresences = await this.prisma.presence.findMany({
      where: { student_id: studentId },
      select: { slot_id: true },
    });

    const absentSlotIds = new Set(studentPresences.map((p) => p.slot_id));

    // Build a set of "date + courseId" pairs where student attended at least one session
    // (a student attended a slot if they're NOT in the presence table)
    const attendedSameDayCourses = new Set<string>();
    allSlots.forEach((slot) => {
      if (!absentSlotIds.has(slot.id)) {
        const dateStr = new Date(slot.date).toISOString().split('T')[0];
        const courseId = slot.slot_session_type.session_type_course_material.id;
        attendedSameDayCourses.add(`${dateStr}|${courseId}`);
      }
    });

    // Filter absences: exclude if student attended same course same day
    const filteredAbsences = absences.filter((a) => {
      const dateStr = new Date(a.presence_slot.date).toISOString().split('T')[0];
      const courseId = a.presence_slot.slot_session_type.session_type_course_material.id;
      const key = `${dateStr}|${courseId}`;
      return !attendedSameDayCourses.has(key);
    });

    return filteredAbsences.map((a) => ({
      course_material: a.presence_slot.slot_session_type.session_type_course_material.name,
      session_type: a.presence_slot.slot_session_type.sessionTypeGlobal.name,
      
      date: a.presence_slot.date,
      start_time: a.presence_slot.start_time,
      end_time: a.presence_slot.end_time,
      courseId: a.presence_slot.slot_session_type.session_type_course_material.id,

      justified: a.justified,       
      student_id: a.student_id,     
      slot_id: a.presence_slot.id,

      justificationFile: a.justificationFile
    }));
  }

  async getBySemesterId(semesterId: number): Promise<course_material[]> {
    return this.prisma.course_material.findMany({
      where: {
        semester_id: semesterId,
      },
    });
  }

  async post(data: CreateCourseMaterialDto): Promise<course_material> {
    const { name, semester_id } = data;
    
    return this.prisma.course_material.create({
      data: {
        name: name,
        course_material_semester: {
          connect: {
            id: semester_id,
          },
        },
      },
    });
  }

  async update(
    id: Prisma.course_materialWhereUniqueInput,
    data: Prisma.course_materialUpdateInput,
  ): Promise<course_material> {
    return this.prisma.course_material.update({
      where: id,
      data,
    });
  }

  async delete(
    id: Prisma.course_materialWhereUniqueInput,
  ): Promise<course_material> {
    return this.prisma.course_material.delete({
      where: id,
    });
  }

  async deleteMany() {
    return this.prisma.course_material.deleteMany();
  }
}