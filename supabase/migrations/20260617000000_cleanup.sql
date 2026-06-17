-- 清理脚本：删除所有策略、表、函数
-- 警告：这会删除所有数据！

-- 删除策略
DROP POLICY IF EXISTS "公开profiles可见" ON public.profiles;
DROP POLICY IF EXISTS "用户只能更新自己的profile" ON public.profiles;
DROP POLICY IF EXISTS "公开读取已发布文章" ON public.posts;
DROP POLICY IF EXISTS "仅管理员可插入文章" ON public.posts;
DROP POLICY IF EXISTS "仅管理员可更新文章" ON public.posts;
DROP POLICY IF EXISTS "仅管理员可删除文章" ON public.posts;
DROP POLICY IF EXISTS "公开读取已审核评论" ON public.comments;
DROP POLICY IF EXISTS "登录用户可查看自己的评论" ON public.comments;
DROP POLICY IF EXISTS "公开可提交评论" ON public.comments;
DROP POLICY IF EXISTS "仅管理员可管理评论" ON public.comments;
DROP POLICY IF EXISTS "仅管理员可删除评论" ON public.comments;
DROP POLICY IF EXISTS "公开读取回复" ON public.comment_replies;
DROP POLICY IF EXISTS "仅管理员可添加回复" ON public.comment_replies;
DROP POLICY IF EXISTS "登录用户可查看点赞" ON public.likes;
DROP POLICY IF EXISTS "登录用户可管理自己的点赞" ON public.likes;
DROP POLICY IF EXISTS "登录用户可删除自己的点赞" ON public.likes;

-- 删除触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.increment_post_view(UUID);

-- 删除表（按依赖顺序）
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comment_replies CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

SELECT '清理完成' AS message;
