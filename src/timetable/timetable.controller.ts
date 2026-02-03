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

// Task tracking for each activity

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

    // fetch tasks for each activity and build a mapping by activity id
    const tasksByActivity: Record<number, any[]> = {};
    await Promise.all(
      activities.map(async (act) => {
        const tasks = await this.timetableService.getTasksForActivity(act.id);
        tasksByActivity[act.id] = tasks || [];
      }),
    );

    // attach tasks to each activity DTO for easier template rendering
    activities.forEach((a) => {
      // @ts-ignore - attach dynamic property for template
      (a as any).tasks = tasksByActivity[a.id] || [];
    });

    return {
      timetable,
      days,
      currentActivity,
      now: new Date(),
      tasksByActivity,
    };
  }

  @Post('activities')
  @Redirect('/timetable')
  async createActivity(@Body() body: any) {
    await this.timetableService.createActivity(body);
  }

  @Post('activities/:id/tasks')
  @Redirect()
  async createTask(
    @Param('id', ParseIntPipe) id: number,
    @Body('description') description: string,
  ) {
    await this.timetableService.createTaskForActivity(id, description);
    return { url: `/timetable/activities/${id}/tasks` };
  }

  @Get('activities/:id/tasks')
  @Render('tasks')
  async getTasksForActivity(@Param('id', ParseIntPipe) id: number) {
    const activity = await this.timetableService.getActivityById(id);
    const tasks = await this.timetableService.getTasksForActivity(id);
    return { activity, tasks };
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

  @Post('tasks/:id/complete')
  @Redirect()
  async completeTask(@Param('id', ParseIntPipe) id: number) {
    const saved = await this.timetableService.markTaskComplete(id);
    return { url: `/timetable/activities/${saved.activityId}/tasks` };
  }

  @Post('tasks/:id/carry')
  @Redirect()
  async carryTask(@Param('id', ParseIntPipe) id: number) {
    const carried = await this.timetableService.carryTaskToNextOccurrence(id);
    return { url: `/timetable/activities/${carried.activityId}/tasks` };
  }
}
