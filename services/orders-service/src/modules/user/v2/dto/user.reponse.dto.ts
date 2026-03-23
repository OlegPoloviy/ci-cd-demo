import { ApiProperty } from '@nestjs/swagger';
import { ProfileDto } from './profile.dto';

export class UserV2ResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ada@lovelace.dev' })
  email!: string;

  @ApiProperty({ type: ProfileDto })
  profile!: ProfileDto;

  @ApiProperty({ example: '2026-01-20T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-20T12:00:00.000Z' })
  updatedAt!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;

  @ApiProperty({ example: 123 })
  total!: number;
}

export class UsersListV2ResponseDto {
  @ApiProperty({ type: UserV2ResponseDto, isArray: true })
  data!: UserV2ResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
