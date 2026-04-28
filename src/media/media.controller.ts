import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Get,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/Jwt auth.guard';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';

@ApiTags('Media')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ModuleName('media')
  @Permissions('media.create')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
      fileType: { type: 'string' },
      studentId: { type: 'string' },
      facultyId: { type: 'string' },
      courseId: { type: 'string' },
      sectionId: { type: 'string' },
    },
  },
})
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMediaDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'TEMP_USER_ID'; // replace with JWT later
    return this.mediaService.upload(file, dto, userId);
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Get('section/:id')
  findBySection(@Param('id') id: string) {
    return this.mediaService.findBySection(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}