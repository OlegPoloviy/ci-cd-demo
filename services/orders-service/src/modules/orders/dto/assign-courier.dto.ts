import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignCourierDto {
  @ApiProperty({ description: 'Courier user ID' })
  @IsUUID()
  courierId: string;
}
