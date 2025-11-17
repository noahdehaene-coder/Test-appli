import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getProfessors(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      where: { role: UserRole.PROFESSEUR },
      select: { id: true, name: true, email: true }, // Ne pas renvoyer le mot de passe
    });
  }

  async createProfessor(data: any): Promise<Partial<User>> {
    const { name, email, password } = data;
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.PROFESSEUR,
      },
    });

    
    const { password: _, ...result } = user;
    return result; // Renvoyer l'utilisateur sans le mot de passe
  }

  async deleteProfessor(id: number): Promise<Partial<User>> {
    const user = await this.prisma.user.delete({
      where: { id: id, role: UserRole.PROFESSEUR },
    });
    
    const { password: _, ...result } = user;
    return result;
  }
}