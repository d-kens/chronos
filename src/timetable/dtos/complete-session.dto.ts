import { IsOptional, IsString } from 'class-validator';

export class CompleteSessionDto {
  @IsString()
  learnings: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
