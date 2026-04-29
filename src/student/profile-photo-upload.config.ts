import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Request } from 'express';

const UPLOAD_SUBDIR = join('uploads', 'students');

const allowedMime = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export function profilePhotoDiskStorage() {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), UPLOAD_SUBDIR);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req: Request, file, cb) => {
      const id = req.params['id'] ?? 'unknown';
      const ext = extname(file.originalname) || '.jpg';
      cb(null, `${id}-${Date.now()}${ext}`);
    },
  });
}

export function profilePhotoFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!allowedMime.has(file.mimetype.toLowerCase())) {
    cb(
      new BadRequestException(
        'profilePhoto must be an image (jpeg, png, webp, or gif)',
      ),
      false,
    );
    return;
  }
  cb(null, true);
}

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
