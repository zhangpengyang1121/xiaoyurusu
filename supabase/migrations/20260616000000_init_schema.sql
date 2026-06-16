-- 初始化小雨如酥生活美学馆数据库表结构
-- 运行时间: 2026-06-16

-- ============================================
-- 1. 用户表 (profiles - 基于 auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'reader')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公开profiles可见" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "用户只能更新自己的profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. 文章表 (posts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    summary TEXT,
    category TEXT NOT NULL DEFAULT '随笔',
    categories TEXT[] DEFAULT ARRAY['随笔'],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    published BOOLEAN NOT NULL DEFAULT false,
    views INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT '匿名',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

-- RLS 策略
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 公开读取已发布的文章
CREATE POLICY "公开读取已发布文章" ON public.posts
    FOR SELECT USING (published = true OR auth.uid() = author_id);

-- 仅管理员可插入文章
CREATE POLICY "仅管理员可插入文章" ON public.posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 仅管理员可更新文章
CREATE POLICY "仅管理员可更新文章" ON public.posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 仅管理员可删除文章
CREATE POLICY "仅管理员可删除文章" ON public.posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 3. 评论表 (comments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT '匿名读者',
    author_email TEXT,
    author_avatar TEXT,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

-- RLS 策略
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 公开读取已审核的评论
CREATE POLICY "公开读取已审核评论" ON public.comments
    FOR SELECT USING (approved = true OR auth.uid() = author_id);

-- 所有人都可以提交评论（待审核）
CREATE POLICY "所有人可提交评论" ON public.comments
    FOR INSERT WITH CHECK (true);

-- 管理员可更新评论
CREATE POLICY "管理员可更新评论" ON public.comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 作者或管理员可删除评论
CREATE POLICY "作者或管理员可删除评论" ON public.comments
    FOR DELETE USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 4. 评论回复表 (comment_replies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT '博主',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON public.comment_replies(comment_id);

-- RLS 策略
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- 公开读取回复
CREATE POLICY "公开读取回复" ON public.comment_replies
    FOR SELECT USING (true);

-- 仅管理员可添加回复
CREATE POLICY "仅管理员可添加回复" ON public.comment_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 5. 点赞表 (likes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- RLS 策略
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 登录用户可管理自己的点赞
CREATE POLICY "登录用户可查看点赞" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "登录用户可添加点赞" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "登录用户可删除自己的点赞" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. 自动更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. 自动创建 profile 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 监听 auth.users 的新建用户事件
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 8. 存储桶配置 (用于未来可能的图片上传)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-assets', 'blog-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "公开访问blog-assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog-assets');

CREATE POLICY "管理员可上传blog-assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'blog-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "管理员可删除blog-assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'blog-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 9. 设置站长为管理员
-- ============================================
-- 注意: 你需要在 Supabase Dashboard 中手动将你的用户 role 改为 'admin'
-- 或者在 profiles 表中执行:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'yinaiermei4431@outlook.com';
