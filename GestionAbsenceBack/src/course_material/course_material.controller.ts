import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CourseMaterialService } from './course_material.service';
import { CreateCourseMaterialDto } from './dto/create-course_material.dto';
import { UpdateCourseMaterialDto } from './dto/update-course_material.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@ApiTags('Course-Material')
@Controller('course_material')
@UseGuards(JwtAuthGuard) 
export class CourseMaterialController {
  constructor(
    private readonly courseMaterialService: CourseMaterialService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les matières' })
  getAll() {
    return this.courseMaterialService.getAll();
  }

  @Get('by-student/:id')
  @ApiOperation({ summary: 'Récupérer les matières par étudiant' })
  @ApiParam({ name: 'id', type: Number })
  getByStudentId(@Param('id', ParseIntPipe) studentId: number) {
    return this.courseMaterialService.getByStudentId(studentId);
  }

  @Get('by-semester/:id')
  @ApiOperation({ summary: 'Récupérer les matières par semestre' })
  @ApiParam({ name: 'id', type: Number })
  getBySemesterId(@Param('id', ParseIntPipe) semesterId: number) {
    return this.courseMaterialService.getBySemesterId(semesterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une matière par ID' })
  @ApiParam({ name: 'id', type: Number })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.courseMaterialService.get({ id: id });
  }

  @Post()
  @ApiOperation({ summary: 'Créer une matière' })
  async post(@Body() data: CreateCourseMaterialDto) {
    return this.courseMaterialService.post(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une matière' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCourseMaterialDto,
  ) {
    return this.courseMaterialService.update({ id: id }, data);
  }


  @Delete('all')
  @ApiOperation({ summary: 'Supprimer toutes les matières' })
  async deleteMany() {
    return this.courseMaterialService.deleteMany();
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une matière par ID' })
  @ApiParam({ name: 'id', type: Number })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.courseMaterialService.delete({ id: id });
  }
}
