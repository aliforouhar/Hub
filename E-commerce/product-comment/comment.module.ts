// (Core)
import { Module } from '@nestjs/common';

// (Dev)
import { Product, ProductSchema } from 'src/databases/mongoose/models/product/schema';
import { ProductComment, ProductCommentSchema } from 'src/databases/mongoose/models/product-comment/schema';
import { CommentController } from 'src/modules/v1/product-comment/comment.controller';
import { CommentService } from 'src/modules/v1/product-comment/comment.service';

// (Third-party)
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductComment.name, schema: ProductCommentSchema },
    ]),
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [],
})
export class ProductCommentModule {}
