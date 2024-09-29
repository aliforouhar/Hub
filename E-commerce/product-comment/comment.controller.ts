// (Core)
import { Controller, Res, Req, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { Response, Request } from 'express';

// (Dev)
import { CommentService } from 'src/modules/v1/product-comment/comment.service';
import { SwaggerConsumer, Permissions } from 'src/common/enums/public.enum';
import { RequirePermissions } from 'src/authorization/RBAC/rbac.decorator';
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

// (Third-party)
import { ApiTags, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Product Comment')
@Controller('product/comment/v1')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post('create/:productId')
  @ApiConsumes(SwaggerConsumer.JSON)
  createComment(
    @Res() response: Response,
    @Req() request: Request,
    @Body() body: CreateCommentDto,
    @Param() params: CreateCommentParams
  ) {
    return this.commentService.createComment(response, request, body, params);
  }

  @Put('update/:commentId')
  @ApiConsumes(SwaggerConsumer.JSON)
  updateComment(
    @Res() response: Response,
    @Req() request: Request,
    @Body() body: UpdateCommentDto,
    @Param() params: UpdateCommentParams
  ) {
    return this.commentService.updateComment(response, request, body, params);
  }

  @Delete('delete/:commentId')
  deleteComment(@Res() response: Response, @Req() request: Request, @Param() params: DeleteCommentParams) {
    return this.commentService.deleteComment(response, request, params);
  }

  @Post('like')
  likeComment(@Res() response: Response, @Req() request: Request, @Body() body: LikeCommentDto) {
    return this.commentService.likeComment(response, request, body);
  }

  @Post('dislike')
  dislikeComment(@Res() response: Response, @Req() request: Request, @Body() body: DislikeCommentDto) {
    return this.commentService.dislikeComment(response, request, body);
  }

  @Post('report')
  reportComment(@Res() response: Response, @Req() request: Request, @Body() body: ReportCommentDto) {
    return this.commentService.reportComment(response, request, body);
  }

  @Get('accepted/:productId')
  getAcceptedComments(
    @Res() response: Response,
    @Req() request: Request,
    @Query() queries: GetAcceptedCommentsQueries,
    @Param() params: GetAcceptedCommentsParams
  ) {
    return this.commentService.getAcceptedComments(response, request, queries, params);
  }

  @Get('unaccepted/:productId')
  @RequirePermissions(Permissions.ALL)
  getUnacceptedComments(
    @Res() response: Response,
    @Req() request: Request,
    @Query() queries: GetUnacceptedCommentsQueries,
    @Param() params: GetUnacceptedCommentsParams
  ) {
    return this.commentService.getUnacceptedComments(response, request, queries, params);
  }

  @Post('accept')
  @RequirePermissions(Permissions.ALL)
  acceptComment(@Res() response: Response, @Req() request: Request, @Body() body: AcceptCommentDto) {
    return this.commentService.acceptComment(response, request, body);
  }

  @Post('reject')
  @RequirePermissions(Permissions.ALL)
  rejectComment(@Res() response: Response, @Req() request: Request, @Body() body: RejectCommentDto) {
    return this.commentService.rejectComment(response, request, body);
  }

  @Get('user-comments')
  getUserComments(@Res() response: Response, @Req() request: Request, @Query() queries: GetUserCommentsQueries) {
    return this.commentService.getUserComments(response, request, queries);
  }

  @Get('wait-for-comment')
  getWaitForComment(@Res() response: Response, @Req() request: Request, @Query() queries: GetWaitForCommentQueries) {
    return this.commentService.getWaitForComment(response, request, queries);
  }
}
