-- 更新 profiles 表的角色约束，添加 super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin', 'reader'));

-- 设置站长和管理员账号
-- 注意：用户必须先在前端注册过账号，这里才能找到对应的记录
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'yinaiermei4431@outlook.com';
UPDATE public.profiles SET role = 'admin' WHERE email = 'zhangpengyang1121@outlook.com';

SELECT '角色更新完成' AS message;
