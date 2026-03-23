import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PresignFileDto } from './dto/presign-file.dto';
import { generateProductKey } from '../../common/utils/key.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectStorageService } from './object-storage.service';
import { FileRecordEntity } from './file-record.entity';
import { FileStatus } from './file-record.entity';
import { CompleteFileDto } from './dto/complete-file.dto';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileRecordEntity)
    private readonly fileRepository: Repository<FileRecordEntity>,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async presign(dto: PresignFileDto, userId: string) {
    const extension = path.extname(dto.fileName);
    const key = generateProductKey(dto.productId, extension);

    const fileRecord = this.fileRepository.create({
      ownerId: userId,
      productId: dto.productId,
      key: key,
      contentType: dto.contentType,
      size: dto.fileSize,
      status: FileStatus.PENDING,
    });

    const savedFile = await this.fileRepository.save(fileRecord);

    try {
      const uploadUrl =
        await this.objectStorageService.createPresignedUploadUrl(
          key,
          dto.contentType,
        );

      return {
        fileId: savedFile.id,
        key: savedFile.key,
        uploadUrl: uploadUrl,
        contentType: savedFile.contentType,
      };
    } catch (error) {
      await this.fileRepository.remove(savedFile);
      console.error('Presign Error:', error);
      throw new InternalServerErrorException('Could not generate upload URL');
    }
  }

  async completeUpload(dto: CompleteFileDto, userId: string) {
    const fileRecord = await this.fileRepository.findOne({
      where: { id: dto.fileId },
    });

    if (!fileRecord) {
      throw new NotFoundException('File record not found');
    }

    if (fileRecord.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this file');
    }

    if (fileRecord.status === FileStatus.READY) {
      return {
        message: 'File is already confirmed',
        viewUrl: this.objectStorageService.getFileViewUrl(fileRecord.key),
      };
    }

    fileRecord.status = FileStatus.READY;
    await this.fileRepository.save(fileRecord);

    return {
      message: 'File successfully uploaded and attached to product',
      fileId: fileRecord.id,
      status: fileRecord.status,
      viewUrl: this.objectStorageService.getFileViewUrl(fileRecord.key),
    };
  }
}
