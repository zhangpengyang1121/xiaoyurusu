import { supabase } from './supabase';

export interface BlogUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'super_admin' | 'admin' | 'reader';
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  categories?: string[];
  tags: string[];
  createdAt: any;
  updatedAt: any;
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
  createdAt: any;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string | null;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  approved: boolean;
  replies?: Reply[];
  createdAt: any;
}

export function getSavedUser(): BlogUser | null {
  const data = localStorage.getItem('blog_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveUser(user: BlogUser) {
  localStorage.setItem('blog_user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('blog_user');
}

// ==================== 认证 ====================

export async function loginUser(email: string, password: string): Promise<BlogUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message || '登录失败');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', data.user.id)
    .single();

  const user: BlogUser = {
    uid: data.user.id,
    email: data.user.email || email,
    displayName: profile?.display_name || email.split('@')[0],
    photoURL: data.user.user_metadata?.avatar_url,
    role: (profile?.role as 'super_admin' | 'admin' | 'reader') || 'reader',
  };
  saveUser(user);
  return user;
}

export async function registerUser(email: string, password: string, displayName: string): Promise<BlogUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error || !data.user) throw new Error(error?.message || '注册失败');

  const user: BlogUser = {
    uid: data.user.id,
    email: data.user.email || email,
    displayName,
    role: 'reader',
  };
  saveUser(user);
  return user;
}

export async function logoutUser() {
  await supabase.auth.signOut().catch(() => {});
  clearUser();
}

// ==================== 文章 ====================

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    summary: p.summary || '',
    category: p.category,
    categories: p.categories || [p.category],
    tags: p.tags || [],
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    published: p.published,
    views: p.views || 0,
    likesCount: p.likes_count || 0,
    authorId: p.author_id,
    authorName: p.author_name,
  }));
}

export async function createPost(postData: Partial<Post>): Promise<Post> {
  const user = getSavedUser();
  const insertData: any = {
    title: postData.title,
    slug: postData.slug,
    content: postData.content,
    summary: postData.summary || '',
    category: postData.category || '随笔',
    categories: postData.categories || [postData.category || '随笔'],
    tags: postData.tags || [],
    published: postData.published !== false,
    author_id: user?.uid,
    author_name: user?.displayName || '小雨如酥',
  };
  if (postData.createdAt) {
    insertData.created_at = postData.createdAt;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    summary: data.summary || '',
    category: data.category,
    categories: data.categories,
    tags: data.tags || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    published: data.published,
    views: data.views || 0,
    likesCount: data.likes_count || 0,
    authorId: data.author_id,
    authorName: data.author_name,
  };
}

export async function updatePost(id: string, postData: Partial<Post>): Promise<Post> {
  const updateData: any = {
    title: postData.title,
    slug: postData.slug,
    content: postData.content,
    summary: postData.summary,
    category: postData.category,
    categories: postData.categories,
    tags: postData.tags,
    published: postData.published,
  };
  if (postData.createdAt) {
    updateData.created_at = postData.createdAt;
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    summary: data.summary || '',
    category: data.category,
    categories: data.categories,
    tags: data.tags || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    published: data.published,
    views: data.views || 0,
    likesCount: data.likes_count || 0,
    authorId: data.author_id,
    authorName: data.author_name,
  };
}

export async function deletePost(id: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ==================== 评论 ====================

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  const comments = (data || []).map((c: any) => ({
    id: c.id,
    postId: c.post_id,
    content: c.content,
    authorId: c.author_id,
    authorName: c.author_name || '匿名读者',
    authorEmail: c.author_email,
    authorAvatar: c.author_avatar,
    approved: c.approved,
    createdAt: c.created_at,
    replies: [],
  }));

  // 加载回复
  for (const comment of comments) {
    const { data: repliesData } = await supabase
      .from('comment_replies')
      .select('*')
      .eq('comment_id', comment.id)
      .order('created_at', { ascending: true });
    comment.replies = (repliesData || []).map((r: any) => ({
      id: r.id,
      authorName: r.author_name,
      authorId: r.author_id,
      content: r.content,
      createdAt: r.created_at,
    }));
  }

  return comments;
}

export async function addComment(postId: string, commentData: Partial<Comment>): Promise<Comment> {
  const user = getSavedUser();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      content: commentData.content,
      author_id: user?.uid || null,
      author_name: commentData.authorName || user?.displayName || '匿名读者',
      author_email: commentData.authorEmail || user?.email,
      author_avatar: commentData.authorAvatar || user?.photoURL,
      approved: user?.role === 'admin',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    postId: data.post_id,
    content: data.content,
    authorId: data.author_id,
    authorName: data.author_name,
    authorEmail: data.author_email,
    authorAvatar: data.author_avatar,
    approved: data.approved,
    createdAt: data.created_at,
    replies: [],
  };
}

export async function approveComment(_postId: string, commentId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from('comments').update({ approved: true }).eq('id', commentId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function replyComment(_postId: string, commentId: string, content: string): Promise<Reply> {
  const user = getSavedUser();
  const { data, error } = await supabase
    .from('comment_replies')
    .insert({
      comment_id: commentId,
      content: content.trim(),
      author_id: user?.uid,
      author_name: '博主 小雨如酥',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    authorName: data.author_name,
    authorId: data.author_id,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function deleteComment(_postId: string, commentId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw new Error(error.message);
  return { success: true };
}

// ==================== 点赞 ====================

export async function checkHasLiked(postId: string): Promise<{ hasLiked: boolean }> {
  const user = getSavedUser();
  if (!user) return { hasLiked: false };

  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.uid)
    .limit(1);

  if (error) return { hasLiked: false };
  return { hasLiked: data && data.length > 0 };
}

export async function toggleLike(postId: string): Promise<{ likesCount: number; hasLiked: boolean }> {
  const user = getSavedUser();
  if (!user) throw new Error('请先登录');

  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.uid)
    .limit(1);

  let hasLiked: boolean;
  if (existing && existing.length > 0) {
    await supabase.from('likes').delete().eq('id', existing[0].id);
    hasLiked = false;
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: user.uid });
    hasLiked = true;
  }

  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact' })
    .eq('post_id', postId);

  return { likesCount: count || 0, hasLiked };
}

// ==================== 浏览量 ====================

export async function incrementView(postId: string): Promise<void> {
  await supabase.rpc('increment_post_view', { post_id: postId }).catch(async () => {
    const { data } = await supabase.from('posts').select('views').eq('id', postId).single();
    await supabase.from('posts').update({ views: (data?.views || 0) + 1 }).eq('id', postId);
  });
}

// ==================== 示例数据 ====================

export async function seedServerSamples(): Promise<{ success: boolean }> {
  const user = getSavedUser();
  if (!user) throw new Error('需要登录');

  const samplePosts = [
    {
      title: '我的独立写作空间：小雨如酥生活美学馆顺利上线',
      slug: 'welcome-to-my-blog',
      category: '随笔',
      categories: ['随笔'],
      tags: ['个人随想', '生活美学', '独立书房'],
      summary: '经过数天的构思与打磨，这个属于我的随笔空间终于诞生。这不是一个简单的信息流，而是我们在快节奏的网络深渊中为自己寻得的一块精神自留地。',
      content: `# 开启静心创作的旅程

大家好！我是**小雨如酥**，这篇文字宣告我的个人独立随笔博客官方上线。

在经历了一段时间繁杂的生活周期后，我愈发感受到将思维落于笔下、回归平和的宝贵。

## 在这里，你会读到什么？

- 📂 **经典与品读**：对我而言，最舒适的美学就是捧一卷书，赏墨印字迹。
- 🧱 **生活之陶冶**：草木、素陶、手作。
- 📝 **日常随想随笔**：偶有所感所悟的一两句话。

欢迎各位文字同好们在这里留步，共同探讨经典阅读和生活美学。`,
    },
    {
      title: '【品读经典】瓦尔登湖畔的午后，与梭罗一同寻见极简之美',
      slug: 'walden-reading-notes',
      category: '读书',
      categories: ['读书'],
      tags: ['经典品读', '超验主义', '自然本真'],
      summary: '读毕《瓦尔登湖》，掩卷沉思：我们是否主动给自己的生命添加了太多无谓的行囊？',
      content: `# 与梭罗一同寻见极简

> "我步入丛林，因为我希望生活得有意义，只面对生活的基本事实。" -- 亨利·戴维·梭罗

每当现代的喧嚣让我无法静立，我总会下意识地从书架中抽出这本素雅的《瓦尔登湖》。

## 什么是纯粹的「生活事实」？

梭罗花了很少的银两在瓦尔登湖畔搭建起属于他自己、仅有单间大小的小木屋。他发现：
- 现代人的劳碌，大多并非源于基本的生存本钱，而是源自对过剩器物的虚妄渴望。
- 拥有越繁复的家什，越容易沦为这堆器物的被动奴役。

美学其实并不是在生活的表面贴上昂贵的金箔，而是通过一刀一刻的精简去除芜杂。`,
    },
  ];

  for (const post of samplePosts) {
    await supabase.from('posts').insert({
      ...post,
      published: true,
      author_id: user.uid,
      author_name: user.displayName || '小雨如酥',
    });
  }

  return { success: true };
}
