import { Controller, Post, Param, ParseIntPipe, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Promotion')
@Controller('promotion')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('semester/:year/:semester')
  @ApiOperation({ 
    summary: 'Promouvoir les étudiants d\'un semestre',
    description: 'Promeut les étudiants d\'un semestre au semestre suivant. Ne fonctionne que pour S1, S3, S5.'
  })
  @ApiParam({ name: 'year', type: Number, example: 1, description: 'L\'année (1, 2 ou 3)' })
  @ApiParam({ name: 'semester', type: Number, example: 1, description: 'Le semestre (1, 3 ou 5)' })
  @ApiResponse({ status: 200, description: 'Promotion réussie' })
  async promoteSemester(
    @Param('year', ParseIntPipe) year: number,
    @Param('semester', ParseIntPipe) semester: number,
  ) {
    try {
      return await this.promotionService.promoteSemester(year, semester);
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('year')
  @ApiOperation({ 
    summary: 'Promouvoir une nouvelle année',
    description: 'Promeut tous les étudiants d\'une année. Les L3S6 sont supprimés. Les L1S2 deviennent L2S3, les L2S4 deviennent L3S5.'
  })
  @ApiResponse({ status: 200, description: 'Promotion d\'année réussie' })
  async promoteYear() {
    try {
      return await this.promotionService.promoteYear();
    } catch (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
