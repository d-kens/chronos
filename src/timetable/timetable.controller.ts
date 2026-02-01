import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Render,
  ParseIntPipe,
  Redirect,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @Render('index')
  async home() {
    const [activities, currentActivity] = await Promise.all([
      this.timetableService.getAllActivities(),
      this.timetableService.getCurrentActivity(),
    ]);

    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const timetable = days.reduce(
      (acc, day) => {
        acc[day] = activities.filter((a) => a.day === day);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return {
      timetable,
      days,
      currentActivity,
      now: new Date(),
    };
  }

  @Post('activities')
  @Redirect('/timetable')
  async createActivity(@Body() body: any) {
    await this.timetableService.createActivity(body);
  }

  @Post('activities/:id/delete')
  @Redirect('/timetable')
  async deleteActivity(@Param('id', ParseIntPipe) id: number) {
    await this.timetableService.deleteActivity(id);
  }

  @Post('activities/:id/edit')
  @Redirect('/timetable')
  async updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    await this.timetableService.updateActivity(id, body);
  }
}
