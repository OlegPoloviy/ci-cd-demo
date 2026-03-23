import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { UserRoleGuard } from '../../common/guards/user-role.guard';
import { UserRole } from '../auth/types/auth.types';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { PresignFileDto } from './dto/presign-file.dto';
import { CompleteFileDto } from './dto/complete-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Roles(UserRole.ADMIN)
  @Post('presign')
  @UseGuards(JwtAuthGuard, UserRoleGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate presigned URL for product image upload' })
  async generatePresignedUrl(@Request() req, @Body() dto: PresignFileDto) {
    const adminId = req.user.id;

    return this.filesService.presign(dto, adminId);
  }

  @Post('complete')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, UserRoleGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Complete file upload and bind to entity' })
  async completeUpload(@Request() req, @Body() dto: CompleteFileDto) {
    const adminId = req.user.id;
    return this.filesService.completeUpload(dto, adminId);
  }
}
