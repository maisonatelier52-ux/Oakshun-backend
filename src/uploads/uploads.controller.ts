import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './public/uploads',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    const filename = `${uniqueSuffix}${ext}`;
                    callback(null, filename);
                },
            }),
        }),
    )
    uploadFile(
        @UploadedFile() file: Express.Multer.File,
    ) {
        console.log('--- Upload Request Received ---');
        if (!file) {
            console.error('No file received in request!');
            return { error: 'No file received' };
        }
        console.log('File details:', {
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
        });
        // Return the URL to access the file
        return {
            url: `/uploads/${file.filename}`,
        };
    }
}
