import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivitySession } from 'src/entities/activity-session.enetity';
import { Activity } from 'src/entities/activity.enetity';
import { Repository, Between } from 'typeorm';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(ActivitySession)
    private sessionRepository: Repository<ActivitySession>,
  ) {}

  // Activity Management
  async getAllActivities(): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { isActive: true },
      order: { day: 'ASC', startTime: 'ASC' },
    });
  }

  async getActivitiesByDay(day: string): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { day, isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  async createActivity(activityData: Partial<Activity>): Promise<Activity> {
    const activity = this.activityRepository.create(activityData);
    return this.activityRepository.save(activity);
  }

  async updateActivity(
    id: number,
    activityData: Partial<Activity>,
  ): Promise<Activity> {
    const activity = await this.activityRepository.findOneBy({ id });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    Object.assign(activity, activityData);

    return this.activityRepository.save(activity);
  }

  async deleteActivity(id: number): Promise<void> {
    await this.activityRepository.update(id, { isActive: false });
  }

  async getActivityById(id: number): Promise<Activity> {
    const activity = await this.activityRepository.findOneBy({ id });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    return activity;
  }

  async getCurrentActivity(): Promise<Activity | null> {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.day = :day', { day: currentDay })
      .andWhere('activity.startTime <= :currentTime', { currentTime })
      .andWhere('activity.endTime >= :currentTime', { currentTime })
      .andWhere('activity.isActive = :isActive', { isActive: true })
      .getOne();

    return activities;
  }

  async startSession(activityId: number): Promise<ActivitySession> {
    const now = new Date();
    const session = this.sessionRepository.create({
      activityId,
      sessionDate: now,
      actualStartTime: now.toTimeString().slice(0, 8),
      completed: false,
    });
    return this.sessionRepository.save(session);
  }

  async completeSession(
    sessionId: number,
    learnings: string,
    notes?: string,
  ): Promise<ActivitySession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['activity'],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    session.actualEndTime = new Date();
    session.learnings = learnings;
    session.notes = notes;
    session.completed = true;

    return this.sessionRepository.save(session);
  }

  async getActiveSession(): Promise<ActivitySession | null> {
    return this.sessionRepository.findOne({
      where: { completed: false },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTodaysSessions(): Promise<ActivitySession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.sessionRepository.find({
      where: {
        sessionDate: Between(today, tomorrow),
      },
      relations: ['activity'],
      order: { sessionDate: 'DESC' },
    });
  }
}
