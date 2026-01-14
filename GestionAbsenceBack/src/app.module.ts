import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentModule } from './student/student.module';
import { SlotModule } from './slot/slot.module';
import { SessionTypeModule } from './session_type/session_type.module';
import { SemesterModule } from './semester/semester.module';
import { PresenceModule } from './presence/presence.module';
import { InscriptionModule } from './inscription/inscription.module';
import { GroupModule } from './group/group.module';
import { CourseMaterialModule } from './course_material/course_material.module';
import { CsvModule } from './csv/csv.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProfessorPreferenceModule } from './professor_preference/professor_preference.module';
import { PromotionModule } from './promotion/promotion.module';


@Module({
  imports: [StudentModule, SlotModule, SemesterModule, SessionTypeModule, PresenceModule, InscriptionModule, GroupModule, CourseMaterialModule, CsvModule, AuthModule, UserModule, ProfessorPreferenceModule, PromotionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
