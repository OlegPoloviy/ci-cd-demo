import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { ObjectStorageService } from './object-storage.service';
import { FilesService } from './files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileRecordEntity } from './file-record.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([FileRecordEntity]), ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, ObjectStorageService],
})
export class FilesModule {}
