export enum CommentMessages {
  NOT_FOUND_PRODUCT = 'محصول با این مشخصات یافت نشد',
  COMMENT_HAS_BEEN_CREATED = 'شما قبلا برای این محصول نظر خود را ثبت کرده اید',
  CREATE_COMMENT_SUCCESS = 'دیدگاه شما با موفقیت ثبت شد و بعد تایید شده به نمایش گذاشته میشود',
  NOT_FOUND_COMMENT = 'دیدگاه با این مشخصات یافت نشد',
  UPDATE_COMMENT_SUCCESS = 'دیدگاه با موفقیت بروزرسانی شد',
  DELETE_COMMENT_SUCCESS = 'دیدگاه با موفقیت حذف شد',
  COMMENT_HAS_BEEN_REPORTED = 'شما قبلا این دیدگاه را گزارش کرده اید',
  REPORT_COMMENT_SUCCESS = 'گزارش با موفقیت ثبت شد',
  COMMENT_HAS_BEEN_APPROVED = 'این دیدگاه هم اکنون فعال است',
  ACCEPT_COMMENT_SUCCESS = 'این دیدگاه با موفقیت برای عموم فعال شد',
  COMMENT_HAS_NOT_BEEN_REJECTED = 'این دیدگاه هم اکنون غیر فعال است',
  REJECT_COMMENT_SUCCESS = 'دیدگاه با موفقیت غیر فعال شد',
}

export enum CommentStatus {
  WAITING = 'waiting',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RecommendationStatus {
  SUGGEST = 'recommended',
  UNCERTAIN = 'not_sure',
  NOT_SUGGEST = 'not_recommended',
}
