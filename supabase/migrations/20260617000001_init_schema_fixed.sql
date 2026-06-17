-- 初始化小雨如酥生活美学馆数据库表结构
-- 运行时间: 2026-06-17

-- ============================================
-- 1. 用户表 (profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'reader')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公开读取已发布文章" ON public.posts
    FOR SELECT USING (published = true OR auth.uid() = author_id);

CREATE POLICY "仅管理员可插入文章" ON public.posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "仅管理员可更新文章" ON public.posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

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

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON public.comments(approved);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公开读取已审核评论" ON public.comments
    FOR SELECT USING (approved = true);

CREATE POLICY "登录用户可查看自己的评论" ON public.comments
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "公开可提交评论" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "仅管理员可管理评论" ON public.comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "仅管理员可删除评论" ON public.comments
    FOR DELETE USING (
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

CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON public.comment_replies(comment_id);

ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公开读取回复" ON public.comment_replies
    FOR SELECT USING (true);

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

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "登录用户可查看点赞" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "登录用户可管理自己的点赞" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "登录用户可删除自己的点赞" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. 触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name'::TEXT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. increment_post_view 函数
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_post_view(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts
    SET views = COALESCE(views, 0) + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.increment_post_view(UUID) TO anon, authenticated;

-- ============================================
-- 8. 创建初始管理员用户（可选）
-- ============================================
-- INSERT INTO public.profiles (id, email, display_name, role)
-- VALUES (gen_random_uuid(), 'yinaiermei4431@outlook.com', '小雨如酥', 'admin');

-- ============================================
-- 完成！
-- ============================================
SELECT '数据库表结构创建完成' AS message;
