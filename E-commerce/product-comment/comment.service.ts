// (Core)
import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';

// (Dev)
import { ProductComment } from 'src/databases/mongoose/models/product-comment/schema';
import { Product } from 'src/databases/mongoose/models/product/schema';
import { User } from 'src/databases/mongoose/models/user/schema';
import { TFindDocument } from 'src/common/types/public.type';
import { CommentMessages } from 'src/modules/v1/product-comment/enum/comment.enum';
import { PublicMessages } from 'src/common/enums/public.enum';
import {
  CreateCommentDto,
  CreateCommentParams,
  UpdateCommentDto,
  UpdateCommentParams,
  DeleteCommentParams,
  LikeCommentDto,
  DislikeCommentDto,
  ReportCommentDto,
  GetAcceptedCommentsQueries,
  GetAcceptedCommentsParams,
  GetUnacceptedCommentsQueries,
  GetUnacceptedCommentsParams,
  AcceptCommentDto,
  RejectCommentDto,
  GetUserCommentsQueries,
  GetWaitForCommentQueries,
} from 'src/modules/v1/product-comment/dto/comment.dto';
import { IPagination } from 'src/common/interfaces/public.interface';
import { paginationGenerator, paginationSolver } from 'src/utils/functions.util';

// (Third-party)
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(ProductComment.name) private commentModel: Model<ProductComment>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ) {}

  async createComment(res: Response, req: Request, body: CreateCommentDto, params: CreateCommentParams) {
    const { _id: userId } = req.user;
    let {
      title,
      comment: userComment,
      rate,
      recommendation_status,
      positive_points,
      negative_points,
      images,
      is_anonymous,
    } = body;

    const product: TFindDocument<Product> = await this.productModel.findById(params.productId).exec();
    if (!product) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_PRODUCT);
    }

    const [isCreated, isBuyer] = await Promise.all([
      this.commentModel
        .findOne({
          product_id: product._id,
          user_id: userId,
        })
        .exec(),
      this.productModel
        .findOne({
          _id: product._id,
          buyers_id: {
            $in: userId,
          },
        })
        .exec(),
    ]);

    if (isCreated) {
      throw new BadRequestException(CommentMessages.COMMENT_HAS_BEEN_CREATED);
    }

    if (!isBuyer) {
      rate = 0;
      recommendation_status = undefined;
      images = undefined;
    }

    await this.commentModel.create({
      user_id: userId,
      product_id: product._id,
      title,
      comment: userComment,
      rate,
      recommendation_status,
      status: 'waiting',
      is_approved: false,
      positive_points,
      negative_points,
      images: [],
      is_buyer: isBuyer ? true : false,
      is_anonymous,
    });

    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      data: {
        message: CommentMessages.CREATE_COMMENT_SUCCESS,
      },
    });
  }
  async updateComment(res: Response, req: Request, body: UpdateCommentDto, params: UpdateCommentParams) {
    const { _id: userId } = req.user;
    const {
      title,
      comment: userComment,
      rate,
      recommendation_status,
      positive_points,
      negative_points,
      images,
      is_anonymous,
    } = body;

    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: params.commentId,
        user_id: userId,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    if (title) comment.title = title;
    if (userComment) comment.comment = userComment;
    if (comment.is_buyer && rate) {
      comment.rate = rate;
    } else {
      comment.rate = 0;
    }
    if (comment.is_buyer && recommendation_status) {
      comment.recommendation_status = recommendation_status;
    } else {
      comment.recommendation_status = undefined;
    }
    if (comment.is_buyer && images) {
      comment.images = [];
    } else {
      comment.images = undefined;
    }
    if (positive_points) comment.positive_points = positive_points;
    if (negative_points) comment.negative_points = negative_points;
    if (is_anonymous !== undefined) comment.is_anonymous = is_anonymous;

    comment.status = 'waiting';
    comment.is_approved = false;

    await comment.save();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: CommentMessages.UPDATE_COMMENT_SUCCESS,
      },
    });
  }
  async deleteComment(res: Response, req: Request, params: DeleteCommentParams) {
    const { _id: userId } = req.user;

    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: params.commentId,
        user_id: userId,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    await this.commentModel.deleteOne({ _id: comment._id });

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: CommentMessages.DELETE_COMMENT_SUCCESS,
      },
    });
  }
  async likeComment(res: Response, req: Request, body: LikeCommentDto) {
    const { _id: userId } = req.user;

    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: body.comment_id,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    const [hasLiked, hasDisliked] = await Promise.all([
      this.commentModel.findOne({
        _id: comment._id,
        likes: userId,
      }),
      this.commentModel.findOne({
        _id: comment._id,
        dislikes: userId,
      }),
    ]);

    let updateQuery: object;
    let message: string;

    if (hasLiked) {
      updateQuery = { $pull: { likes: userId } };
      message = PublicMessages.CANCELED_LIKE;
    } else if (hasDisliked) {
      updateQuery = { $pull: { dislikes: userId }, $push: { likes: userId } };
      message = PublicMessages.LIKE_ADDED;
    } else {
      updateQuery = { $push: { likes: userId } };
      message = PublicMessages.LIKE_ADDED;
    }

    await this.commentModel.updateOne({ _id: comment._id }, updateQuery);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message,
      },
    });
  }
  async dislikeComment(res: Response, req: Request, body: DislikeCommentDto) {
    const { _id: userId } = req.user;

    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: body.comment_id,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    const [hasLiked, hasDisliked] = await Promise.all([
      this.commentModel.findOne({
        _id: comment._id,
        likes: userId,
      }),
      this.commentModel.findOne({
        _id: comment._id,
        dislikes: userId,
      }),
    ]);

    let updateQuery: object;
    let message: string;

    if (hasDisliked) {
      updateQuery = { $pull: { dislikes: userId } };
      message = PublicMessages.CANCELED_DISLIKE;
    } else if (hasLiked) {
      updateQuery = { $pull: { likes: userId }, $push: { dislikes: userId } };
      message = PublicMessages.DISLIKE_ADDED;
    } else {
      updateQuery = { $push: { dislikes: userId } };
      message = PublicMessages.DISLIKE_ADDED;
    }

    await this.commentModel.updateOne({ _id: comment._id }, updateQuery);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message,
      },
    });
  }
  async reportComment(res: Response, req: Request, body: ReportCommentDto) {
    const { _id: userId } = req.user;

    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: body.comment_id,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    const hasReported: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: comment._id,
        reports: userId,
      })
      .exec();
    if (hasReported) {
      throw new BadRequestException(CommentMessages.COMMENT_HAS_BEEN_REPORTED);
    }

    await this.commentModel.updateOne(
      { _id: comment._id },
      {
        $push: { reports: userId },
      }
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: CommentMessages.REPORT_COMMENT_SUCCESS,
      },
    });
  }
  async getAcceptedComments(
    res: Response,
    req: Request,
    queries: GetAcceptedCommentsQueries,
    params: GetAcceptedCommentsParams
  ) {
    const { sort } = queries;

    let sortQuery = {};
    switch (sort) {
      case '1':
        sortQuery = { _id: -1 };
        break;

      case '2':
        sortQuery = { _id: 1 };
        break;

      case '3':
        sortQuery = { is_buyer: -1 };
        break;

      default:
        sortQuery = { _id: -1 };
        break;
    }

    const pagination: IPagination = {
      page: queries.page,
      limit: queries.limit,
    };
    const { limit, page, skip } = paginationSolver(pagination);

    const comments: TFindDocument<ProductComment> = await this.commentModel
      .aggregate([
        {
          $match: {
            product_id: new Types.ObjectId(params.productId),
            is_approved: true,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            pipeline: [
              {
                $project: { first_name: 1, last_name: 1 },
              },
            ],
            as: 'creator',
          },
        },
        {
          $unwind: '$creator',
        },
        {
          $addFields: {
            username: {
              $function: {
                body: function (is_anonymous: boolean, user: User) {
                  let userName: string = 'کاربر مازالی';
                  if (!is_anonymous && user.first_name && user.last_name) {
                    userName = `${user.first_name} ${user.last_name}`;
                  }
                  return userName;
                },
                args: ['$is_anonymous', '$creator'],
                lang: 'js',
              },
            },
            like_count: { $size: '$likes' },
            dislike_count: { $size: '$dislikes' },
          },
        },
        {
          $sort: sortQuery,
        },
        {
          $project: {
            title: 1,
            comment: 1,
            rate: 1,
            recommendation_status: 1,
            positive_points: 1,
            negative_points: 1,
            images: 1,
            is_buyer: 1,
            is_anonymous: 1,
            username: 1,
            like_count: 1,
            dislike_count: 1,
            createdAt: 1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ])
      .exec();

    const averageRate = await this.commentModel.aggregate([
      {
        $match: {
          product_id: new Types.ObjectId(params.productId),
          status: 'approved',
          is_approved: true,
          rate: {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: null,
          averageRate: { $avg: '$rate' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averageRate: { $round: ['$averageRate', 1] },
          count: 1,
        },
      },
    ]);
    const rate: number = averageRate.length > 0 ? averageRate[0].averageRate : 0;
    const count: number = averageRate.length > 0 ? averageRate[0].count : 0;

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        comments,
        rating: {
          rate,
          count,
        },
        pagination: paginationGenerator(comments.length, page, limit),
      },
    });
  }
  async getUnacceptedComments(
    res: Response,
    req: Request,
    queries: GetUnacceptedCommentsQueries,
    params: GetUnacceptedCommentsParams
  ) {
    const { sort } = queries;

    let sortQuery = {};
    switch (sort) {
      case '1':
        sortQuery = { _id: -1 };
        break;

      case '2':
        sortQuery = { _id: 1 };
        break;

      case '3':
        sortQuery = { is_buyer: -1 };
        break;

      default:
        sortQuery = { _id: -1 };
        break;
    }

    const pagination: IPagination = {
      page: queries.page,
      limit: queries.limit,
    };
    const { limit, page, skip } = paginationSolver(pagination);

    const comments: TFindDocument<ProductComment> = await this.commentModel
      .aggregate([
        {
          $match: {
            product_id: new Types.ObjectId(params.productId),
            is_approved: false,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            pipeline: [
              {
                $project: { first_name: 1, last_name: 1 },
              },
            ],
            as: 'creator',
          },
        },
        {
          $unwind: '$creator',
        },
        {
          $sort: sortQuery,
        },
        {
          $project: {
            title: 1,
            comment: 1,
            rate: 1,
            recommendation_status: 1,
            status: 1,
            is_approved: 1,
            positive_points: 1,
            negative_points: 1,
            images: 1,
            is_buyer: 1,
            is_anonymous: 1,
            creator: 1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ])
      .exec();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        comments,
        pagination: paginationGenerator(comments.length, page, limit),
      },
    });
  }
  async acceptComment(res: Response, req: Request, body: AcceptCommentDto) {
    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: body.comment_id,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    if (comment.is_approved && comment.status === 'approved') {
      throw new BadRequestException(CommentMessages.COMMENT_HAS_BEEN_APPROVED);
    }

    await this.commentModel.updateOne(
      { _id: comment._id },
      {
        $set: { status: 'approved', is_approved: true },
      }
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: CommentMessages.ACCEPT_COMMENT_SUCCESS,
      },
    });
  }
  async rejectComment(res: Response, req: Request, body: RejectCommentDto) {
    const comment: TFindDocument<ProductComment> = await this.commentModel
      .findOne({
        _id: body.comment_id,
      })
      .exec();
    if (!comment) {
      throw new NotFoundException(CommentMessages.NOT_FOUND_COMMENT);
    }

    if (!comment.is_approved && comment.status === 'rejected') {
      throw new BadRequestException(CommentMessages.COMMENT_HAS_NOT_BEEN_REJECTED);
    }

    await this.commentModel.updateOne(
      { _id: comment._id },
      {
        $set: { status: 'rejected', is_approved: false },
      }
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: CommentMessages.REJECT_COMMENT_SUCCESS,
      },
    });
  }
  async getUserComments(res: Response, req: Request, queries: GetUserCommentsQueries) {
    const { _id: userId } = req.user;

    const pagination: IPagination = {
      page: queries.page,
      limit: queries.limit,
    };
    const { limit, page, skip } = paginationSolver(pagination);

    const comments: TFindDocument<Comment> = await this.commentModel
      .aggregate([
        {
          $match: { user_id: userId },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product_id',
            foreignField: '_id',
            pipeline: [
              {
                $project: { title_fa: 1, title_en: 1, images: 1, slug: 1 },
              },
            ],
            as: 'product',
          },
        },
        {
          $unwind: '$product',
        },
        {
          $project: {
            title: 1,
            comment: 1,
            rate: 1,
            recommendation_status: 1,
            status: 1,
            is_approved: 1,
            positive_points: 1,
            negative_points: 1,
            images: 1,
            is_buyer: 1,
            is_anonymous: 1,
            createdAt: 1,
            product: 1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ])
      .exec();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        comments,
        pagination: paginationGenerator(comments.length, page, limit),
      },
    });
  }
  async getWaitForComment(res: Response, req: Request, queries: GetWaitForCommentQueries) {
    const { _id: userId } = req.user;

    const pagination: IPagination = {
      page: queries.page,
      limit: queries.limit,
    };
    const { limit, page, skip } = paginationSolver(pagination);

    const [boughtProducts, comments] = await Promise.all([
      this.productModel
        .find({ buyers_id: { $in: userId } })
        .select({
          title_fa: 1,
          title_en: 1,
          slug: 1,
          images: 1,
        })
        .lean()
        .exec(),
      this.commentModel.find({ user_id: userId }).skip(skip).limit(limit).exec(),
    ]);

    const products = boughtProducts.filter(
      (product) => !comments.some((comment) => comment.product_id.toString() === product._id.toString())
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        products,
        pagination: paginationGenerator(products.length, page, limit),
      },
    });
  }
}
