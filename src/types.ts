export interface Timestamp {
  seconds: number;
  nanoseconds?: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  categories?: string[]; // Multiple categories support
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  published: boolean;
  views: number;
  likesCount: number;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

export interface Reply {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string; // Optional email for visitors
  authorAvatar?: string;
  approved: boolean; // Moderation/approval status
  replies?: Reply[]; // Admin replies
  createdAt: Timestamp;
}

export type ViewTab = 'feed' | 'post' | 'write' | 'edit';
