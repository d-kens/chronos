import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from 'src/entities/activity.enetity';
import { Task } from 'src/entities/task.entity';
import { Repository } from 'typeorm';
import { ActivityDto } from './dtos/activity.dto';
import { TaskDto } from './dtos/task.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  // Helper method to format time (remove seconds)
  private formatTime(time: Date | string): string {
    if (!time) return '';

    if (time instanceof Date) {
      return time.toTimeString().slice(0, 5);
    }

    return time.toString().slice(0, 5);
  }

  // Convert Activity entity to DTO
  private toActivityDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      day: activity.day,
      startTime: this.formatTime(activity.startTime),
      endTime: this.formatTime(activity.endTime),
      activity: activity.activity,
      isActive: activity.isActive,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  async getAllActivities(): Promise<ActivityDto[]> {
    const activities = await this.activityRepository.find({
      where: { isActive: true },
      order: { day: 'ASC', startTime: 'ASC' },
    });

    return activities.map((activity) => this.toActivityDto(activity));
  }

  async getActivitiesByDay(day: string): Promise<ActivityDto[]> {
    const activities = await this.activityRepository.find({
      where: { day, isActive: true },
      order: { startTime: 'ASC' },
    });

    return activities.map((activity) => this.toActivityDto(activity));
  }

  async createActivity(activityData: Partial<Activity>): Promise<ActivityDto> {
    const activity = this.activityRepository.create(activityData);
    const saved = await this.activityRepository.save(activity);
    return this.toActivityDto(saved);
  }

  async updateActivity(
    id: number,
    activityData: Partial<Activity>,
  ): Promise<ActivityDto> {
    const activity = await this.activityRepository.findOneBy({ id });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    Object.assign(activity, activityData);
    const saved = await this.activityRepository.save(activity);
    return this.toActivityDto(saved);
  }

  async deleteActivity(id: number): Promise<void> {
    await this.activityRepository.update(id, { isActive: false });
  }

  async getActivityById(id: number): Promise<ActivityDto> {
    const activity = await this.activityRepository.findOneBy({ id });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    return this.toActivityDto(activity);
  }

  private toTaskDto(task: Task): TaskDto {
    return {
      id: task.id,
      description: task.description,
      isDone: task.isDone,
      carried: task.carried ?? false,
      activityId: task.activity?.id,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    };
  }

  async createTaskForActivity(
    activityId: number,
    description: string,
  ): Promise<TaskDto> {
    const activity = await this.activityRepository.findOneBy({
      id: activityId,
    });
    if (!activity)
      throw new NotFoundException(`Activity ${activityId} not found`);

    const task = this.taskRepository.create({ description, activity });
    const saved = await this.taskRepository.save(task);
    return this.toTaskDto(saved);
  }

  async getTasksForActivity(activityId: number): Promise<TaskDto[]> {
    const tasks = await this.taskRepository.find({
      where: { activity: { id: activityId } },
      relations: ['activity'],
    });
    return tasks.map((t) => this.toTaskDto(t));
  }

  async markTaskComplete(taskId: number): Promise<TaskDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['activity'],
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    task.isDone = true;
    task.completedAt = new Date();
    const saved = await this.taskRepository.save(task);
    return this.toTaskDto(saved);
  }

  // When a task wasn't completed, carry it to the next occurrence of the activity
  async carryTaskToNextOccurrence(taskId: number): Promise<TaskDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['activity'],
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const currentActivity = task.activity;
    if (!currentActivity)
      throw new NotFoundException(`Activity for task ${taskId} not found`);

    const allSameActivities = await this.activityRepository.find({
      where: { activity: currentActivity.activity, isActive: true },
    });

    const dayOrder = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const toMinutes = (time: Date | string) => {
      if (!time) return 0;
      // time can be Date or string
      const t =
        time instanceof Date
          ? time.toTimeString().slice(0, 5)
          : time.toString().slice(0, 5);
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };

    const currentKey =
      dayOrder.indexOf(currentActivity.day) * 24 * 60 +
      toMinutes(currentActivity.startTime);

    const sorted = allSameActivities
      .map((a) => ({
        a,
        key: dayOrder.indexOf(a.day) * 24 * 60 + toMinutes(a.startTime),
      }))
      .sort((x, y) => x.key - y.key);

    let next = sorted.find((s) => s.key > currentKey);
    if (!next) {
      // wrap to first occurrence (next week)
      next = sorted[0];
    }

    const targetActivity = next.a;

    const newTask = this.taskRepository.create({
      description: task.description,
      activity: targetActivity,
      carried: true,
    });
    const saved = await this.taskRepository.save(newTask);

    // remove original task from current activity since it's carried over
    await this.taskRepository.delete(task.id);

    return this.toTaskDto(saved);
  }

  async getCurrentActivity(): Promise<ActivityDto | null> {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    const activity = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.day = :day', { day: currentDay })
      .andWhere('activity.startTime <= :currentTime', { currentTime })
      .andWhere('activity.endTime >= :currentTime', { currentTime })
      .andWhere('activity.isActive = :isActive', { isActive: true })
      .getOne();

    return activity ? this.toActivityDto(activity) : null;
  }
}
