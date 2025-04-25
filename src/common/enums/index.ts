export enum MatchStatus {
  FINISH = 'FINISH',
  UPCOMING = 'UPCOMING',
}
export enum MediaType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
}
export enum PostPrivacy {
  FRIEND = 'FRIEND',
  PUBLIC = 'PUBLIC',
}
export enum ReactType {
  LIKE = 'LIKE',
}
export enum UserGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}
export enum FriendRequestStatus {
  ACCEPTED = 'ACCEPTED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}
export enum NotificationStatus {
  READ = 'READ',
  UNREAD = 'UNREAD',
}
export enum MIME_TYPE {
  IMAGES = 'images',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILES = 'files',
}
export enum TYPE_UPLOAD {
  IMAGE = 1,
  VIDEO = 2,
}

export * from './country';
export * from './friend-request-status.enum';
export * from './notification-status.enum';
export * from './post-privacy.enum';
export * from './react-type.enum';
export * from './user-gender.enum';
