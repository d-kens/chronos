import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Activity } from './entities/activity.enetity';
import { Task } from './entities/task.entity';
import { TimetableModule } from './timetable/timetable.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'p@RRc3L@@dm!n#2170',
      database: 'timetable_db',
      entities: [Activity, Task],
      synchronize: true,
      logging: true,
    }),
    TimetableModule,
  ],
})
export class AppModule {}
