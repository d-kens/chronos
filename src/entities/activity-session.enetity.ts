import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Activity } from './activity.enetity';

@Entity('activity_sessions')
export class ActivitySession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activityId: number;

  @ManyToOne(() => Activity, (activity) => activity.sessions)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column({ type: 'datetime' })
  sessionDate: Date;

  @Column({ type: 'time' })
  actualStartTime: Date;

  @Column({ type: 'time', nullable: true })
  actualEndTime: Date;

  @Column({ type: 'text', nullable: true })
  learnings: string;

  @Column({ type: 'text', nullable: true })
  notes: string | undefined;

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}