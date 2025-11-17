import { Controller, Post, Delete, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UseGuards, SetMetadata } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Utilisateurs')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  
  @SetMetadata('role', UserRole.GESTIONNAIRE)
  @Get('professors')
  @ApiOperation({ summary: 'Lister tous les professeurs' })
  async getProfessors() {
    return this.userService.getProfessors();
  }

  
  @SetMetadata('role', UserRole.GESTIONNAIRE)
  @Post('professor')
  @ApiOperation({ summary: 'Créer un nouveau professeur' })
  async createProfessor(@Body() body: any) {
    return this.userService.createProfessor(body);
  }

  
  @SetMetadata('role', UserRole.GESTIONNAIRE)
  @Delete('professor/:id')
  @ApiOperation({ summary: 'Supprimer un professeur par ID' })
  async deleteProfessor(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteProfessor(id);
  }

}