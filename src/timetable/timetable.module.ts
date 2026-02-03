import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from 'src/entities/activity.enetity';
import { Task } from 'src/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Task])],
  providers: [TimetableService],
  controllers: [TimetableController],
})
export class TimetableModule {}
