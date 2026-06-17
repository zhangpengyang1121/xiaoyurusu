import React, { useState, useEffect } from 'react';
import { Post, Comment, BlogUser } from '../clientApi';
import Markdown from 'react-markdown';
import { 
  fetchComments, 
  addComment, 
  approveComment, 
  replyComment, 
  deleteComment, 
  toggleLike, 
  checkHasLiked,
  incrementView 
} from '../clientApi';
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Send, 
  Trash2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Eye, 
  Lock 
} from 'lucide-react';

interface BlogDetailProps {
  post: Post;
  user: BlogUser | null;
  onBack: () => void;
  onLogin: () => void;
  onRefresh?: () => void;
}

export default function BlogDetail({ post, user, onBack, onLogin, onRefresh }: BlogDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  
  // Visitor states
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showWechatQR, setShowWechatQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // 1. Atomically increment views on mounting (only once per post visit)
  useEffect(() => {
    let active = true;
    const incView = async () => {
      try {
        await incrementView(post.id);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Background view increment error:', err);
      }
    };
    if (active) {
      incView();
    }
    return () => {
      active = false;
    };
  }, [post.id]);

  // 2. Sync comments from server
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const data = await fetchComments(post.id);
      setComments(data);
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [post.id, user]);

  // 3. Sync whether user has liked the post
  useEffect(() => {
    if (!user) {
      setHasLiked(false);
      return;
    }
    const checkLikedState = async () => {
      try {
        const res = await checkHasLiked(post.id);
        setHasLiked(res.hasLiked);
      } catch (err) {
        console.error('Check like error:', err);
      }
    };
    checkLikedState();
  }, [post.id, user]);

  // Handle claps and liking validation
  const handleLikeToggle = async () => {
    if (!user) {
      onLogin();
      return;
    }
    try {
      const res = await toggleLike(post.id);
      setHasLiked(res.hasLiked);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Like toggle error:', error);
    }
  };

  // Handle comment writing (with guest and approval queue)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user && !visitorName.trim()) {
      alert('请输入您的称呼作为姓名标志。');
      return;
    }

    const content = newComment.trim();
    try {
      await addComment(post.id, {
        content,
        authorName: user ? user.displayName : visitorName.trim(),
        authorEmail: user ? user.email : visitorEmail.trim(),
        authorAvatar: user?.photoURL || ''
      });
      setNewComment('');
      setVisitorName('');
      setVisitorEmail('');
      await loadComments();
      if (onRefresh) onRefresh();
      
      if (!isAdmin) {
        alert('您的评论观点已提交成功！因为您不是管理员，评论进入审核队列，审核通过后即可公开显示。');
      }
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  // Blogger Moderation: Approve Visitor Comments
  const handleApproveComment = async (commentId: string) => {
    try {
      await approveComment(post.id, commentId);
      await loadComments();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Approve comment error:', error);
    }
  };

  // Blogger Reply to comments
  const handleSendReply = async (commentId: string, replyContent: string) => {
    if (!replyContent.trim() || !user) return;
    try {
      await replyComment(post.id, commentId, replyContent.trim());
      await loadComments();
    } catch (error) {
      console.error('Send reply error:', error);
    }
  };

  // Handle comment deletion (Only author or admin can trigger)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await deleteComment(post.id, commentId);
      await loadComments();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const wordCount = post.content ? post.content.length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 400));

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10" id="blog-detail-container">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="group mb-8 flex items-center gap-2 font-sans text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 cursor-pointer"
        id="detail-back-btn"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>返回文章列表</span>
      </button>

      {/* Article Header Editorial card */}
      <header className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {post.categories && post.categories.length > 0 ? (
            post.categories.map((cat, index) => (
              <span key={index} className="rounded-full bg-gray-100 px-3 py-1 font-sans text-xs font-semibold text-gray-600">
                {cat}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 font-sans text-xs font-semibold text-gray-600">
              {post.category || '未分类'}
            </span>
          )}
          {!post.published && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-amber-700 uppercase">
              <Lock className="h-3 w-3" /> 草稿 
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
          {post.title}
        </h1>

        {/* Author metadata panel */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            {post.authorAvatar ? (
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="h-10 w-10 rounded-full border border-gray-100 shadow-2xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-display text-sm font-bold text-gray-600">
                {post.authorName?.charAt(0) || 'A'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="flex items-center gap-1 font-sans text-sm font-bold text-gray-800">
                {post.authorName}
                {(post.authorId === 'yinaiermei4431' || post.authorId === 'zhangpengyang1121' || post.authorId === '977280003043' || isAdmin) && (
                  <span title="站长">
                    <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 font-sans text-xs text-gray-400">
                <span>{formatDate(post.createdAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {readTime} 分钟阅读</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-sans text-xs text-gray-400">
            <span className="flex items-center gap-1 font-mono">
              <Eye className="h-4 w-4" />
              <span>{post.views || 0} 次阅读</span>
            </span>
            <span>•</span>
            
            {/* Social Sharing Buttons */}
            <div className="flex items-center gap-1.5" id="social-share-bar">
              <span className="text-gray-400 font-sans mr-0.5">分享:</span>
              
              <button
                onClick={() => setShowWechatQR(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer font-bold font-sans text-[10px]"
                title="分享到微信"
              >
                <span>微</span>
              </button>

              <a
                href={`https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title + ' | 因爱而美小雨如酥生活美学馆')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer font-bold font-sans text-[10px]"
                title="分享到微博"
              >
                <span>博</span>
              </a>

              <a
                href={`https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.summary || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer font-bold font-sans text-[10px]"
                title="分享到QQ空间"
              >
                <span>空</span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`「推荐阅读」来自因爱而美小雨如酥生活美学馆之《${post.title}》：${window.location.href}`);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer font-sans text-[10px] font-bold ${
                  copySuccess ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title="复制分享链接"
              >
                <span>{copySuccess ? 'OK' : '链'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Render area */}
      <article className="markdown-body prose max-w-none transition-fade" id="blog-markdown-view">
        <Markdown>{post.content}</Markdown>
      </article>

      {/* Tags section */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-b border-gray-100 pb-8" id="detail-tags-container">
          {post.tags.map((tag, i) => (
            <span 
              key={i} 
              className="rounded-lg bg-gray-50 px-3 py-1 font-mono text-xs text-gray-500 hover:bg-gray-100 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Reader Like / Clap Zone */}
      <div className="my-10 flex flex-col items-center justify-center rounded-2xl bg-gray-50/50 py-8 text-center" id="clapping-zone">
        <h4 className="font-display text-sm font-semibold text-gray-700">觉得内容有启发？给文章鼓个掌吧</h4>
        <button
          onClick={handleLikeToggle}
          className={`group mt-4 flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${
            hasLiked 
              ? 'bg-red-500 text-white shadow-red-100' 
              : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100'
          }`}
          id="clap-big-btn"
        >
          <Heart className={`h-6 w-6 transition-transform group-active:scale-90 ${hasLiked ? 'fill-white' : ''}`} />
        </button>
        <span className="mt-2.5 font-mono text-sm font-bold text-gray-600">
          {post.likesCount || 0} 个赞
        </span>
      </div>

      {/* Comments Section */}
      <section className="mt-12 border-t border-gray-100 pt-10" id="comments-section">
        <div className="mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-800" />
          <h3 className="font-display text-lg font-bold text-gray-900">
            读者评论 ({comments.length})
          </h3>
        </div>

        {/* Comment input form - Multi-mode Guest & Authenticated Comments */}
        <form onSubmit={handleAddComment} className="mb-8 bg-gray-50/50 rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <h4 className="font-display text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span>发表您的评论观点</span>
          </h4>

          {/* Guest identification row (Only visible if NOT logged-in) */}
          {!user && (
            <div className="grid gap-3 sm:grid-cols-2" id="visitor-identity-form">
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-gray-600">您的称呼 (Name, 必填)</label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. 读者朋友"
                  className="h-10 rounded-xl border border-gray-100 bg-white px-3 font-sans text-xs text-gray-700 shadow-3xs outline-hidden transition-all focus:border-gray-200"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[11px] font-bold text-gray-600">电子邮箱 (Email, 可选 - 不公开)</label>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="e.g. sample@example.com"
                  className="h-10 rounded-xl border border-gray-100 bg-white px-3 font-sans text-xs text-gray-700 shadow-3xs outline-hidden transition-all focus:border-gray-200"
                />
              </div>
            </div>
          )}

          {/* Comment text area */}
          <div className="flex flex-col gap-1.5">
            {user && (
              <div className="flex items-center gap-2 mb-1 text-xs text-gray-500 font-sans">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || ''} 
                    className="h-5 w-5 rounded-full border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span>已登录为: <strong>{user.displayName || '已登录用户'}</strong></span>
              </div>
            )}
            <textarea
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="请输入您有深度与善意的讨论内容，最多输入1000格字..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-xl border border-gray-100 bg-white p-3.5 font-sans text-sm text-gray-800 shadow-3xs outline-hidden transition-all focus:border-gray-200 focus:ring-2 focus:ring-gray-100"
              id="comment-textarea"
            />
            
            <div className="mt-1 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1 font-sans">
                {!user ? '💡 游客留言评论需要通过博主审核才能公开可见。' : '✔️ 登录用户发表评论更为便捷。'}
              </span>
              <div className="flex items-center gap-3">
                {!user && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="font-sans text-xs text-sky-600 hover:underline cursor-pointer"
                  >
                    或点击此处快捷登录账号
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!newComment.trim() || (!user && !visitorName.trim())}
                  className="flex items-center gap-1.5 self-end rounded-full bg-gray-900 px-4 py-1.5 font-sans text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  id="submit-comment-btn"
                >
                  <Send className="h-3 w-3" />
                  <span>发表评论</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments Feed list */}
        {isLoadingComments ? (
          <div className="space-y-4 py-4" id="comments-loader">
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-50" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-gray-50" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-5" id="comments-feed">
            {comments.map((comment) => {
              const isCommentOwner = user?.uid === comment.authorId;
              const isCommentAdmin = comment.authorId === 'yinaiermei4431' || comment.authorId === 'zhangpengyang1121' || comment.authorName === '站长小雨如酥' || comment.authorName === '博主小雨如酥' || comment.authorName === '小雨如酥' || comment.authorEmail === 'yinaiermei4431@outlook.com';
              return (
                <div 
                  key={comment.id}
                  className="group flex flex-col gap-3.5 rounded-xl border border-gray-50 bg-white p-4.5 shadow-3xs"
                  id={`comment-item-${comment.id}`}
                >
                  <div className="flex gap-3.5">
                    {comment.authorAvatar ? (
                      <img 
                        src={comment.authorAvatar} 
                        alt={comment.authorName} 
                        className="h-8 w-8 rounded-full border border-gray-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 font-sans text-xs font-bold text-gray-500 uppercase">
                        {comment.authorName?.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          <span className="font-sans font-bold text-gray-800">
                            {comment.authorName}
                          </span>
                          {isCommentAdmin && (
                            <span className="rounded-sm bg-gray-950 px-1 py-0.5 font-mono text-[8px] font-bold text-white uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                          {!comment.approved && (
                            <span className="rounded-sm bg-amber-50 border border-amber-200 px-1 py-0.5 font-sans text-[8px] font-semibold text-amber-700">
                              待审核 (Pending)
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {isAdmin && !comment.approved && (
                            <button
                              onClick={() => handleApproveComment(comment.id)}
                              className="rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-sans text-[10px] font-bold px-2 py-0.5 transition-colors cursor-pointer"
                              id={`approve-comment-btn-${comment.id}`}
                            >
                              审核通过
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                              className="font-sans text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              {replyingToId === comment.id ? '取消回复' : '回复'}
                            </button>
                          )}

                          {/* Deletes Comment (Visible if Owner or Admin is logged-in) */}
                          {(isCommentOwner || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="rounded-full p-1 text-gray-300 opacity-0 hover:bg-gray-50 hover:text-red-500 transition-all group-hover:opacity-100 cursor-pointer"
                              title="删除评论"
                              id={`delete-comment-${comment.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-1.5 font-sans text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Admin inline reply form */}
                      {replyingToId === comment.id && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col gap-2">
                          <label className="font-sans text-[10px] text-gray-600 font-bold">博主小雨如酥 直接回复：</label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full text-xs font-sans p-2 rounded-lg border border-gray-200 outline-none focus:border-gray-500 bg-white"
                            placeholder="请对该读者的评论进行耐心且专业的解答..."
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleSendReply(comment.id, replyText);
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                            className="self-end rounded-md bg-gray-900 px-3 py-1 font-sans text-[11px] text-white hover:bg-black transition-colors cursor-pointer"
                          >
                            发送回复
                          </button>
                        </div>
                      )}

                      {/* Render admin reply threads */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-3" id={`comment-replies-${comment.id}`}>
                          {comment.replies.map((rep) => (
                            <div key={rep.id} className="bg-[#fafafa] rounded-xl p-3 border border-gray-100/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-sans text-xs font-bold text-gray-800">博主 小雨如酥</span>
                                  <span className="rounded-sm bg-gray-900 px-1 py-0.5 font-mono text-[8px] font-bold text-white uppercase tracking-wider">
                                    博主
                                  </span>
                                  <span className="font-mono text-[9px] text-gray-400">
                                    {formatDate(rep.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-1 font-sans text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                                {rep.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center" id="empty-comments font-sans text-xs">
            <p className="text-sm text-gray-400">暂无读者评论。发表第一条精彩评论，开启思想碰撞吧！</p>
          </div>
        )}
      </section>

      {/* WeChat Share QR Code Modal */}
      {showWechatQR && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4" 
          id="wechat-qr-modal"
          onClick={() => setShowWechatQR(false)}
        >
          <div 
            className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl text-center relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-display text-sm font-bold text-gray-900 mb-2">微信扫一扫：分享到朋友圈</h4>
            <p className="font-sans text-[11px] text-gray-400 mb-4 leading-normal">
              使用微信扫一扫扫描下方二维码，<br />
              即可将精品好文分享给微信好友。
            </p>
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border border-gray-100 bg-[#fbfbfb] p-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                alt="WeChat QR Code"
                className="h-full w-full select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => setShowWechatQR(false)}
              className="mt-5 w-full rounded-xl bg-gray-900 py-2 font-sans text-xs font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer shadow-3xs"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
