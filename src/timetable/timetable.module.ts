import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from 'src/entities/activity.enetity';
import { ActivitySession } from 'src/entities/activity-session.enetity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivitySession])],
  providers: [TimetableService],
  controllers: [TimetableController]
})
export class TimetableModule {}
