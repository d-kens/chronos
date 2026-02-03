export class TaskDto {
  id: number;
  description: string;
  isDone: boolean;
  carried: boolean;
  activityId: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
