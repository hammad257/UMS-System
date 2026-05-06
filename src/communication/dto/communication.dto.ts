import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AnnouncementAudience,
  AnnouncementStatus,
  NotificationType,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID('4')
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export class CreateMessageDto {
  @ApiProperty()
  @IsUUID('4')
  recipientId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ description: 'Provide for replies; omit for new threads' })
  @IsOptional()
  @IsUUID('4')
  threadId?: string;
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  body!: string;

  @ApiProperty({ enum: AnnouncementAudience, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AnnouncementAudience, { each: true })
  audience!: AnnouncementAudience[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ enum: AnnouncementStatus })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}
