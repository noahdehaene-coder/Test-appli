import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StudentService } from 'src/student/student.service';
import { UserService } from 'src/user/user.service';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class CsvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
  ) {}

  async parseCsvAddStudents(fileBuffer: Buffer): Promise<any[]> {
    const students: { student_number: string; name: string; first_name: string; last_name: string; }[] = [];
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    return new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (row) => {
          const student_number = row[Object.keys(row)[0]]?.trim();
          const last_name = row[Object.keys(row)[1]]?.trim();
          const first_name = row[Object.keys(row)[2]]?.trim();

          if (student_number && last_name && first_name) {
            const name = `${last_name} ${first_name}`;
            students.push({ student_number, name, first_name, last_name });
          }
        })
        .on('end', async () => {
          try {
            for (const s of students) {
               const createdStudent = await this.prisma.student.upsert({
                 where: { student_number: s.student_number },
                 update: { name: s.name },
                 create: {student_number: s.student_number,name: s.name}
               });
               await this.userService.createOrUpdateStudentAccount(createdStudent, s.first_name, s.last_name);
            }
            resolve(students);
          } catch (error) {
            reject(`Erreur dans l'insertion : ${error.message}`);
          }
        })
        .on('error', (err) => reject(err));
    });
  }

  async parseCsvAddInscription(
    groupId: number,
    fileBuffer: Buffer,
  ): Promise<any[]> {
    const studentsNumber: string[] = [];
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    return new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (row) => {
          const student_number = row[Object.keys(row)[0]]?.trim();
          if (student_number) {
            studentsNumber.push(student_number);
          }
        })
        .on('end', async () => {
          try {
            const students =
              await this.studentService.findByStudentNumber(studentsNumber);
            const foundNumbers = students.map((s) => s.student_number);
            const inscriptions = students.map((student) => ({
              student_id: student.id,
              group_id: groupId,
            }));
            await this.prisma.inscription.createMany({ data: inscriptions });
            resolve(inscriptions);
          } catch (error) {
            reject(`Erreur dans l'insertion : ${error.message}`);
          }
        })
        .on('error', (err) => reject(err));
    });
  }
}
