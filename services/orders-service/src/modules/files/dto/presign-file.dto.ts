import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignFileDto {
  @ApiProperty({
    description: 'The ID of the product associated with the file',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'The name of the file to be uploaded',
    example: 'image.jpg',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'The MIME type of the file to be uploaded',
    example: 'image/jpeg',
  })
  @IsString()
  contentType: string;

  @ApiProperty({
    description: 'The size of the file to be uploaded in bytes',
    example: 102400,
  })
  @IsNumber()
  fileSize: number;
}
