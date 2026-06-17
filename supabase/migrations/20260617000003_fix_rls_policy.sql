-- 修复 RLS 策略：让 super_admin 也有发布文章的权限

-- 更新 posts 表的策略
DROP POLICY IF EXISTS "仅管理员可插入文章" ON public.posts;
CREATE POLICY "仅管理员可插入文章" ON public.posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "仅管理员可更新文章" ON public.posts;
CREATE POLICY "仅管理员可更新文章" ON public.posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "仅管理员可删除文章" ON public.posts;
CREATE POLICY "仅管理员可删除文章" ON public.posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- 更新 comments 表的策略（管理员审核评论）
DROP POLICY IF EXISTS "仅管理员可更新评论" ON public.comments;
CREATE POLICY "仅管理员可更新评论" ON public.comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "仅管理员可删除评论" ON public.comments;
CREATE POLICY "仅管理员可删除评论" ON public.comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

SELECT 'RLS策略已修复，super_admin 现在有发布权限' AS message;
