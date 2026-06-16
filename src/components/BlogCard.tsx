import { Post } from '../types';
import { Eye, Heart, Calendar, Clock, Edit3, Bookmark } from 'lucide-react';

interface BlogCardProps {
  post: Post;
  onClick: () => void;
  onEdit?: () => void;
  isAdmin: boolean;
}

export default function BlogCard({ post, onClick, onEdit, isAdmin }: BlogCardProps) {
  // Simple reading time estimator
  const wordCount = post.content ? post.content.length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 400)); // ~400 characters per minute Chinese rate

  // Date formatting
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <article 
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xs cursor-pointer"
      id={`blog-card-${post.id}`}
    >
      {/* Category / Tags Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5" id={`card-categories-${post.id}`}>
          {post.categories && post.categories.length > 0 ? (
            post.categories.map((cat, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 transition-colors group-hover:bg-gray-100 font-display"
              >
                {cat}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 transition-colors group-hover:bg-gray-100 font-display">
              {post.category || '未分类'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {!post.published && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-700 uppercase">
              草稿 (Draft)
            </span>
          )}
          {isAdmin && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-full p-1.5 text-gray-400 opacity-60 transition-all hover:bg-gray-50 hover:text-gray-900 group-hover:opacity-100"
              title="编辑文章"
              id={`edit-post-btn-${post.id}`}
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Summary */}
      <div className="flex-1">
        <h3 className="font-display text-lg font-bold leading-normal tracking-wide text-gray-900 transition-colors group-hover:text-amber-800">
          {post.title}
        </h3>
        
        <p className="mt-2.5 line-clamp-3 font-sans text-sm leading-relaxed text-gray-500">
          {post.summary || '暂无内容概要...'}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag, i) => (
              <span 
                key={i} 
                className="font-mono text-[11px] text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Stats */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 font-sans text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-300" />
            <span>{formatDate(post.createdAt)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-300" />
            <span>{readTime} 分钟阅读</span>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-gray-300" />
            <span>{post.views || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-gray-300" />
            <span>{post.likesCount || 0}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
