import { Controller, Get, Delete, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SessionTypeService } from './session_type.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Session-Type')
@Controller('session_type')
@UseGuards(JwtAuthGuard) // Sécurise tout le contrôleur
export class SessionTypeController {
  constructor(private readonly sessionTypeService: SessionTypeService) {}

  @Get('global-types')
  @ApiOperation({ summary: 'Récupérer la liste des types de session globaux (CM, TD, TP...)' })
  @ApiResponse({ status: 200, description: 'Liste des types globaux' })
  async getGlobalTypes() {
    return this.sessionTypeService.getGlobalTypes();
  }
  
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les types de session (liens matière/type)' })
  @ApiResponse({ status: 200, description: 'Liste des types de session' })
  getAll() {
    return this.sessionTypeService.getAll();
  }

  @Delete('all')
  @ApiOperation({ summary: 'Supprimer tous les types de session' })
  @ApiResponse({ status: 200, description: 'Tous les types de session ont été supprimés' })
  async deleteMany() {
    return this.sessionTypeService.deleteMany();
  }
}
