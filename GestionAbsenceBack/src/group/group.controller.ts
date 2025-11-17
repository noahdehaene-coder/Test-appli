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
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateGroupBySemesterNameDto } from './dto/create-group-semester-name.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Group')
@Controller('group')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes' })
  @ApiResponse({ status: 200, description: 'Liste des groupes' })
  getAll() {
    return this.groupService.getAll();
  }

  @Get('by-semester/:year')
  @ApiOperation({ summary: 'Récupérer les groupes par année (L1, L2, L3)' })
  @ApiParam({ name: 'year', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Liste des groupes triés par semestre' })
  getAllBySemester(@Param('year', ParseIntPipe) year: number) {
    return this.groupService.getAllBySemester(year);
  }

  @Get('by-student/:id')
  @ApiOperation({ summary: 'Récupérer les groupes par ID étudiant' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de l\'étudiant' })
  @ApiResponse({ status: 200, description: 'Groupes trouvés' })
  getByStudentId(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.getByStudentId(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe par ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du groupe' })
  @ApiResponse({ status: 200, description: 'Groupe trouvé' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.get({ id: id });
  }

  @Post()
  @ApiOperation({ summary: 'Créer un groupe' })
  @ApiResponse({ status: 201, description: 'Groupe créé avec succès' })
  async post(@Body() data: CreateGroupDto) {
    return this.groupService.post(data);
  }

  @Post('from-semester-name')
  @ApiOperation({
    summary: 'Créer un groupe à partir du nom du semestre (ex: S1)',
  })
  @ApiResponse({ status: 201, description: 'Groupe créé avec succès' })
  async postFromSemesterName(@Body() data: CreateGroupBySemesterNameDto) {
    return this.groupService.postFromSemesterName(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du groupe' })
  @ApiResponse({ status: 200, description: 'Groupe mis à jour' })
  async put(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateGroupDto,
  ) {
    return this.groupService.update({ id: id }, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un groupe par ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du groupe' })
  @ApiResponse({ status: 200, description: 'Groupe supprimé' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.delete({ id: id });
  }

  @Delete()
  @ApiOperation({ summary: 'Supprimer tous les groupes' })
  @ApiResponse({ status: 200, description: 'Tous les groupes ont été supprimés' })
  async deleteMany() {
    return this.groupService.deleteMany();
  }
}
