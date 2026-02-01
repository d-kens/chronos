import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Render,
  ParseIntPipe,
  Redirect,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CompleteSessionDto } from './dtos/complete-session.dto';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // Home page: timetable + current activity + today's sessions
  @Get()
  @Render('index')
  async home() {
    const [activities, currentActivity, activeSession, todaysSessions] =
      await Promise.all([
        this.timetableService.getAllActivities(),
        this.timetableService.getCurrentActivity(),
        this.timetableService.getActiveSession(),
        this.timetableService.getTodaysSessions(),
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
      activeSession,
      todaysSessions,
      now: new Date(),
    };
  }

  // Create activity
  @Post('activities')
  @Redirect('/timetable')
  async createActivity(@Body() body: any) {
    await this.timetableService.createActivity(body);
  }

  // Delete activity
  @Post('activities/:id/delete')
  @Redirect('/timetable')
  async deleteActivity(@Param('id', ParseIntPipe) id: number) {
    await this.timetableService.deleteActivity(id);
  }

  // Update activity
  @Post('activities/:id/edit')
  @Redirect('/timetable')
  async updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    await this.timetableService.updateActivity(id, body);
  }

  // Start session
  @Post('sessions/start/:activityId')
  @Redirect('/timetable')
  async startSession(@Param('activityId', ParseIntPipe) activityId: number) {
    await this.timetableService.startSession(activityId);
  }

  // Complete session
  @Post('sessions/:id/complete')
  @Redirect('/timetable')
  async completeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CompleteSessionDto,
  ) {
    await this.timetableService.completeSession(id, body.learnings, body.notes);
  }
}
