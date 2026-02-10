import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsUrl,
    IsDateString,
    IsOptional,
    Min,
    MinLength,
} from 'class-validator';

export class CreateAuctionDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    title: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(10, { message: 'Description must be at least 10 characters' })
    description: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0.01, { message: 'Starting price must be greater than 0' })
    startingPrice: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    reservePrice?: number;

    @IsNotEmpty()
    @IsString()
    imageUrl: string;

    @IsNotEmpty()
    @IsDateString()
    endTime: Date;
}

