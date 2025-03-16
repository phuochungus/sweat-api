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
  HEART = 'HEART',
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
  SEEN = 'SEEN',
  UNSEEN = 'UNSEEN',
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
export enum NOTIFICATION_TYPE {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  REACT = 'REACT',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  ACCEPT_FRIEND_REQUEST = 'ACCEPT_FRIEND_REQUEST',
}

export * from './country';
