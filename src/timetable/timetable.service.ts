import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from 'src/entities/activity.enetity';
import { Repository } from 'typeorm';
import { ActivityDto } from './dtos/activity.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
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
