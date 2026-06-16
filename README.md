# 小雨如酥生活美学馆

一个优雅的生活美学与阅读博客，基于 React + Express + Supabase 构建。

## 功能特性

- 📝 Markdown 文章编辑与渲染
- 💬 评论系统（带审核机制）
- ❤️ 点赞功能
- 🤖 AI 辅助创作（Gemini）
- 📄 Word 文档导入
- 🔐 用户认证系统
- 📱 响应式设计

## 技术栈

- **前端**: React 19, TypeScript, Tailwind CSS 4, Vite
- **后端**: Express.js, Node.js
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **AI**: Google Gemini
- **部署**: Cloudflare Pages/Workers

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入以下信息：

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `GEMINI_API_KEY` - Google Gemini API Key

### 3. 配置 Supabase 数据库

#### 方式一：使用 Supabase CLI（推荐）

```bash
# 安装 Supabase CLI (macOS)
brew install supabase

# 初始化本地 Supabase
supabase init

# 链接到你的 Supabase 项目
supabase link --project-ref your-project-ref

# 运行数据库迁移
supabase db push
```

#### 方式二：手动执行 SQL

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目 -> SQL Editor
3. 复制 `supabase/migrations/20260616000000_init_schema.sql` 的内容并执行

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Cloudflare

### 1. 推送到 GitHub

代码已在此仓库中。

### 2. 连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages -> Create a project
3. 选择 "Connect to Git"
4. 选择 `xiaoyurusu` 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. 添加环境变量（在 Pages Settings 中）

### 3. 配置环境变量

在 Cloudflare Pages 的环境变量设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
```

### 4. 部署

触发部署后，Cloudflare 会自动构建并部署。

## 数据库表结构

- `profiles` - 用户资料
- `posts` - 文章
- `comments` - 评论
- `comment_replies` - 评论回复
- `likes` - 点赞记录
- `storage.buckets` - 文件存储

## 成为管理员

1. 在 Supabase Dashboard 中进入 `profiles` 表
2. 找到你的用户记录
3. 将 `role` 字段从 `reader` 改为 `admin`

## 许可证

MIT License
