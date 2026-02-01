import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivitySession } from 'src/entities/activity-session.enetity';
import { Activity } from 'src/entities/activity.enetity';
import { Repository, Between } from 'typeorm';
import { ActivityDto } from './dtos/activity.dto';
import { ActivitySessionDto } from './dtos/activity-session.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(ActivitySession)
    private sessionRepository: Repository<ActivitySession>,
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

  // Convert ActivitySession entity to DTO
  private toSessionDto(session: ActivitySession): ActivitySessionDto {
    return {
      id: session.id,
      activityId: session.activityId,
      sessionDate: session.sessionDate,
      actualStartTime: this.formatTime(session.actualStartTime),
      actualEndTime: session.actualEndTime
        ? this.formatTime(session.actualEndTime)
        : null,
      learnings: session.learnings,
      notes: session.notes,
      completed: session.completed,
      createdAt: session.createdAt,
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

  async startSession(activityId: number): Promise<ActivitySessionDto> {
    const now = new Date();
    const session = this.sessionRepository.create({
      activityId,
      sessionDate: now,
      actualStartTime: now as unknown as Date,
      completed: false,
    });
    const saved = await this.sessionRepository.save(session);
    return this.toSessionDto(saved);
  }

  async completeSession(
    sessionId: number,
    learnings: string,
    notes?: string,
  ): Promise<ActivitySessionDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['activity'],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    session.actualEndTime = new Date() as unknown as Date;
    session.learnings = learnings;
    session.notes = notes;
    session.completed = true;

    const saved = await this.sessionRepository.save(session);
    return this.toSessionDto(saved);
  }

  async getActiveSession(): Promise<ActivitySessionDto | null> {
    const session = await this.sessionRepository.findOne({
      where: { completed: false },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
    });

    return session ? this.toSessionDto(session) : null;
  }

  async getTodaysSessions(): Promise<ActivitySessionDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.sessionRepository.find({
      where: {
        sessionDate: Between(today, tomorrow),
      },
      relations: ['activity'],
      order: { sessionDate: 'DESC' },
    });

    return sessions.map((session) => this.toSessionDto(session));
  }
}
