import {
  Body,
  Controller,
  Patch,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { AddGuardianDto } from './dto/create-student.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateStudentAcademicDto, UpdateStudentProfileDto } from './dto/update-student.dto';
import {
  PROFILE_PHOTO_MAX_BYTES,
  profilePhotoDiskStorage,
  profilePhotoFileFilter,
} from './profile-photo-upload.config';
import { Roles } from 'src/common/guards/roles.decorator';
import { Role } from 'src/common/types';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('student')
@ApiTags('Student Management')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post(':studentId/guardians')
  @Roles(Role.ADMIN)
  @ModuleName('Student')
  @Permissions('studentGuardian.create')
  @ApiOperation({ summary: 'Add guardian' })
  @ApiBody({ type: AddGuardianDto })
  addGuardian(
    @Param('studentId') studentId: string,
    @Body() dto: AddGuardianDto,
  ) {
    return this.studentService.addGuardian(studentId, dto);
  }


  @Patch(':id/profile')
  @Roles(Role.ADMIN)
  @ModuleName('Student')
  @Permissions('StudentProfile.update')
  @UseInterceptors(
    FileInterceptor('profilePhoto', {
      storage: profilePhotoDiskStorage(),
      fileFilter: profilePhotoFileFilter,
      limits: { fileSize: PROFILE_PHOTO_MAX_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profilePhoto: {
          type: 'string',
          format: 'binary',
          description: 'Optional image (jpeg, png, webp, gif), max 5MB',
        },
        phone: { type: 'string' },
        email: { type: 'string' },
        gender: { type: 'string' },
        bloodGroup: { type: 'string' },
        nationality: { type: 'string' },
        address: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
      },
    },
  })
  @ApiOperation({ summary: 'update student profile (multipart; optional profilePhoto file)' })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProfileDto,
    @UploadedFile() profilePhoto?: Express.Multer.File,
  ) {
    const photoPath = profilePhoto
      ? `/uploads/students/${profilePhoto.filename}`
      : undefined;
    return this.studentService.updateProfile(id, dto, photoPath);
  }

  @Patch(':id/academic')
  @Roles(Role.ADMIN)
  @ModuleName('Student')
  @Permissions('AcademicProfile.update')
  @ApiOperation({ summary: 'Set Academic information' })
  updateAcademic(
    @Param('id') id: string,
    @Body() dto: UpdateStudentAcademicDto,
  ) {
    return this.studentService.updateAcademic(id, dto);
  }

}
