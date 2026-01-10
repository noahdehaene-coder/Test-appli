import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards, Req, Query, BadRequestException} from '@nestjs/common';
import { SlotService } from './slot.service';
import { CreateSlotDto } from './dto/create-slot-by-session.dto';
import { CreateSlotBySessionDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Prisma } from '@prisma/client';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Creneaux')
@Controller('slot')
@UseGuards(JwtAuthGuard)
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Get('recent-calls')
  @ApiOperation({ summary: 'Récupérer les modèles d\'appels récents pour le professeur connecté' })
  async getRecentCalls(@Req() req: any, @Query('dayOfWeek') dayOfWeek?: string) {
    const professorId = Number(req.user?.id); 
    if (isNaN(professorId) || professorId <= 0) { 
        throw new BadRequestException('Professor ID is missing or invalid in the token payload.');
    }
    const dayOfWeekNum = dayOfWeek ? Number(dayOfWeek) : undefined;
    return this.slotService.getRecentCalls(professorId, dayOfWeekNum);
  }

  @Get('week-slots')
  @ApiOperation({ summary: 'Récupérer tous les appels de la semaine en cours (partagés entre tous les professeurs)' })
  @ApiResponse({ status: 200, description: 'Liste des appels de la semaine' })
  async getWeekSlots(@Req() req: any) {
    const professorId = Number(req.user?.id);
    if (isNaN(professorId) || professorId <= 0) { 
      throw new BadRequestException('Professor ID is missing or invalid in the token payload.');
    }
    return this.slotService.getWeekSlots(professorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un créneau par son ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Créneau trouvé' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    console.log(id);
    return this.slotService.get({ id: Number(id) });
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les créneaux' })
  @ApiResponse({ status: 200, description: 'Liste complète des créneaux' })
  getAll() {
    return this.slotService.getAll();
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Récupérer les créneaux par date' })
  @ApiParam({ name: 'date', type: String, description: 'Date au format YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Créneaux trouvés pour cette date' })
  getAllByDate(@Param('date') date: string) {
    return this.slotService.getAllByDate(date);
  }

  @Get('my-slots/:date')
  @ApiOperation({ summary: 'Récupérer les créneaux du professeur connecté pour une date donnée' })
  async getMySlots(@Req() req: any, @Param('date') date: string) {
    const professorId = Number(req.user?.id);
    return this.slotService.findByProfessorAndDate(professorId, date);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un créneau' })
  @ApiResponse({ status: 201, description: 'Créneau créé avec succès' })
  async post(@Body() createSlotDto: CreateSlotDto) {
    return this.slotService.post(createSlotDto);
  }

  @Post('by-session')
  @ApiOperation({ summary: 'Créer un slot via un type de session' })
  @ApiResponse({ status: 201, description: 'Slot créé via le nom d’une matière et le nom de son type de session' })
  async postBySession(@Body() createSlotBySessionDto: CreateSlotBySessionDto, @Req() req: any,) {
    const professorId = req.user.id;
    return this.slotService.postBySessionName(createSlotBySessionDto, professorId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Chercher un créneau sans le créer' })
  async search(@Body() dto: CreateSlotBySessionDto, @Req() req: any) {
    const professorId = req.user.id;
    return this.slotService.findBySessionName(dto, professorId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un créneau par ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du créneau à modifier' })
  @ApiResponse({ status: 200, description: 'Créneau mis à jour' })
  async putById(@Param('id', ParseIntPipe) id: number, @Body() updateSlotDto: UpdateSlotDto) {
    return this.slotService.put(Number(id), updateSlotDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un créneau par ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du créneau à supprimer' })
  @ApiResponse({ status: 200, description: 'Créneau supprimé' })
  async deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.slotService.delete({ id: Number(id) });
  }

  @Delete()
   @ApiOperation({ summary: 'Supprimer tous les créneaux' })
  @ApiResponse({ status: 200, description: 'Suppression en masse réussie' })
  async deleteMany() {
    return this.slotService.deleteMany();
  }
}
