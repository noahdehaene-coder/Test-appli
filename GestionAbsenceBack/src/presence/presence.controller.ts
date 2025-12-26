import { Controller, Get, Post, Put, Delete, Param, Body, UploadedFile, UseInterceptors, ParseIntPipe, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Presence')
@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get('slot/:slot_id')
  @ApiOperation({ summary: 'Récupérer les absences par ID de créneau' })
  async getBySlot(@Param('slot_id', ParseIntPipe) slot_id: number) {
     return this.presenceService.getBySlotId(slot_id);
  }

  @Put('update/:slot_id')
  @ApiOperation({ summary: 'Mettre à jour les absences pour un créneau' })
  async updateMany(@Param('slot_id', ParseIntPipe) slot_id: number, @Body() student_ids: number[]) {
    await this.presenceService.deleteBySlot(slot_id);
    if (student_ids.length > 0) {
      return this.presenceService.postMany(slot_id, student_ids);
    }
    return { message: 'Mise à jour effectuée' };
  }

  @Get('by-year/:year')
  @ApiOperation({ summary: 'Récupérer les absences par année' })
  @ApiParam({ name: 'year', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Liste des absences pour une année donnée. Ex : en donnant 1 en paramètre, renvoie les absences des semestres 1 et 2' })
  async GetByYear(@Param('year', ParseIntPipe) year: number) {
    return this.presenceService.getByYear(year);
  }

  @Get(':student_id/:slot_id')
  @ApiOperation({ summary: 'Récupérer une absence spécifique (étudiant et créneau)' })
  @ApiParam({ name: 'student_id', type: Number })
  @ApiParam({ name: 'slot_id', type: Number })
  @ApiResponse({ status: 200, description: 'Absence trouvée' })
  async getById(@Param('student_id', ParseIntPipe) student_id: number, @Param('slot_id', ParseIntPipe) slot_id: number) {
    return this.presenceService.get({
      student_id_slot_id: { student_id, slot_id },
    });
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les absence' })
  @ApiResponse({ status: 200, description: 'Liste complète des absences' })
  getAll() {
    return this.presenceService.getAll();
  }

  @Post()
  @ApiOperation({ summary: 'Créer une absence' })
  @ApiResponse({ status: 201, description: 'Absence créée avec succès' })


  async post(@Body() createPresenceDto: CreatePresenceDto) {
    return this.presenceService.post(createPresenceDto);
  }

  @Post('many/:slot_id')
  @ApiOperation({ summary: 'Créer plusieurs absences pour un créneau donné' })
  @ApiParam({ name: 'slot_id', type: Number })
  @ApiResponse({ status: 201, description: 'Absences multiples créées avec succès' })
  async postMany(@Param('slot_id', ParseIntPipe) slot_id: number, @Body() student_ids: number[]) {
    return this.presenceService.postMany(slot_id, student_ids);
  }

  @Delete(':student_id/:slot_id')
  @ApiOperation({ summary: 'Supprimer une absence (étudiant et créneau)' })
  @ApiParam({ name: 'student_id', type: Number })
  @ApiParam({ name: 'slot_id', type: Number })
  @ApiResponse({ status: 200, description: 'Absence supprimée' })
  async deleteById(@Param('student_id', ParseIntPipe) student_id: number, @Param('slot_id', ParseIntPipe) slot_id: number) {
    return this.presenceService.delete({
      student_id,
      slot_id,
      student_id_slot_id: undefined,
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Supprimer toutes les absences' })
  @ApiResponse({ status: 200, description: 'Toutes les absences ont été supprimées' })
  async deleteMany() {
    return this.presenceService.deleteMany();
  }

  @Put(':student_id/:slot_id')
  @ApiOperation({ summary: 'Modifier le statut justifié/non justifié' })
  async updateJustification(
    @Param('student_id', ParseIntPipe) student_id: number,
    @Param('slot_id', ParseIntPipe) slot_id: number,
    @Body() body: { justified: boolean },
  ) {
    return this.presenceService.updateJustification(student_id, slot_id, body.justified);
  }

  @Post('justify/:slot_id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Uploader un justificatif (PDF uniquement)' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/justificatifs', // Assurez-vous que ce dossier existe
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `justif-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (file.mimetype !== 'application/pdf') {
        return callback(new BadRequestException('Seuls les fichiers PDF sont autorisés'), false);
      }
      callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  }))
  async uploadJustification(
    @Param('slot_id', ParseIntPipe) slotId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) throw new BadRequestException('Fichier manquant');
    
    // req.user contient le payload du JWT. 
    // Assurez-vous que votre AuthService/JwtStrategy inclut 'studentId' si disponible.
    // Sinon, il faudra le récupérer via le UserService avec l'email.
    
    const user = req.user; 
    
    // Vérification basique
    if (!user.studentId && user.role !== 'GESTIONNAIRE') { 
        throw new BadRequestException("Ce compte n'est pas lié à un étudiant.");
    }

    // Sauvegarde en base
    return this.presenceService.addJustification(
      user.studentId, // ID de la table 'student'
      slotId, 
      file.path
    );
  }
}
