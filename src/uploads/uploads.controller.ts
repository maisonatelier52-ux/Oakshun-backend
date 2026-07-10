import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

cloudinary.config({
    cloud_name: 'k43wtdgk',
    api_key: '156293741679574',
    api_secret: 'SHPzEMV37SI9x1KtmKL64xki0XA'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'oakshun',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    } as any,
});

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: storage,
        }),
    )
    uploadFile(
        @UploadedFile() file: any,
    ) {
        console.log('--- Cloudinary Upload Request Received ---');
        if (!file) {
            console.error('No file received in request!');
            return { error: 'No file received' };
        }
        
        console.log('File successfully uploaded to Cloudinary:', {
            url: file.path,
            filename: file.filename,
        });

        // Cloudinary returns the full URL in `file.path`
        return {
            url: file.path,
        };
    }
}
