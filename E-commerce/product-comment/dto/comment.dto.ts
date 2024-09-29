// (Core)

// (Dev)
import { RecommendationStatus } from 'src/modules/v1/product-comment/enum/comment.enum';
import { PaginationDto } from 'src/common/dtos/public.dto';

// (Third-party)
import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiPropertyOptional({ enum: [0, 1, 2, 3, 4, 5] })
  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  rate: number;

  @ApiPropertyOptional({ enum: RecommendationStatus })
  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  recommendation_status: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positive_points: [string];

  @ApiPropertyOptional({ type: String, isArray: true })
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  negative_points: [string];

  @ApiPropertyOptional({ type: String, isArray: true })
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: [string];

  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsBoolean()
  is_anonymous: boolean;
}
export class CreateCommentParams {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  productId: string;
}
export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
export class UpdateCommentParams {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  commentId: string;
}
export class DeleteCommentParams {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  commentId: string;
}
export class LikeCommentDto {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  comment_id: string;
}
export class DislikeCommentDto {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  comment_id: string;
}
export class ReportCommentDto {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  comment_id: string;
}
export class GetAcceptedCommentsQueries extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ enum: [1, 2, 3] })
  @Expose()
  @IsOptional()
  @IsString()
  sort: string;
}
export class GetAcceptedCommentsParams {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  productId: string;
}
export class GetUnacceptedCommentsQueries extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ enum: [1, 2, 3] })
  @Expose()
  @IsOptional()
  @IsString()
  sort: string;
}
export class GetUnacceptedCommentsParams {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  productId: string;
}
export class AcceptCommentDto {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  comment_id: string;
}
export class RejectCommentDto {
  @ApiProperty()
  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsMongoId()
  comment_id: string;
}
export class GetUserCommentsQueries extends PartialType(PaginationDto) {}
export class GetWaitForCommentQueries extends PartialType(PaginationDto) {}
