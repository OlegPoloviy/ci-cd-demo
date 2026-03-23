import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CompleteFileDto {
  @ApiProperty({
    example: 'bef6bc5d-c494-465b-b5d4-3572576849c7',
    description: 'File ID received at the presign step',
  })
  @IsUUID()
  fileId: string;
}
