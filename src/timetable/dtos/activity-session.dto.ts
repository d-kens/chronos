export class ActivitySessionDto {
  id: number;
  activityId: number;
  sessionDate: Date;
  actualStartTime: string;
  actualEndTime: string | null;
  learnings: string;
  notes: string | undefined;
  completed: boolean;
  createdAt: Date;
}
