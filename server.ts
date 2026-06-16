import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

dotenv.config();

// Define local file DB location
const DB_FILE = path.join(process.cwd(), "blog_db.json");

interface DBData {
  users: Record<string, any>;
  posts: Record<string, any>;
  comments: Record<string, any[]>;
  likes: Record<string, string[]>;
}

// Seed helper for initial dummy data if DB doesn't exist
const initialSeedPosts = {
  "sample-1": {
    id: "sample-1",
    title: "我的独立写作空间：小雨如酥生活美学馆顺利上线",
    slug: "independent-blog-for-reading-and-aesthetics-online",
    category: "随笔",
    categories: ["随笔"],
    tags: ["个人随想", "生活美学", "独立书房"],
    summary: "经过数天的构思与打磨，这个属于我的随笔空间终于诞生。这不是一个简单的信息流，而是我们在快节奏的网络深渊中为自己寻得的一块精神自留地。",
    content: `# 开启静心创作的旅程：在这个美学空间我们能聊些什么？

大家好！我是**小雨如酥**，这篇文字宣告我的个人独立随笔博客官方上线。

在经历了一段时间繁杂的生活周期后，我愈发感受到将思维落于笔下、回归平和的宝贵。本平台是一个纯粹、安宁的文字角落。这里没有算法推荐的绑架，只有对生活微小瞬间的记录和书卷中的哲思。

在未来的时光里，这里将主要围绕以下几大主题发布内容：
- 📂 **经典与品读**：对我而言，最舒适的美学就是捧一卷书，赏墨印字迹。我将在此分享深刻打动过我的文学巨著、人文历史以及社会科学类经典读物笔记。
- 🧱 **生活之陶冶**：草木、素陶、手作。在这个喧嚣的数字化洪流中，分享如何利用自然之物、泥土温润气息来重新建立我们对时间流逝的精妙感知。
- 📝 **日常随想随笔**：偶有所感所悟的一两句话，或是冬日暖阳折射在桌面干花上的光斑，都是生活中无可替代的仪式感。

由于本站专注于中国境内线路的高速优化与无尘排版，欢迎各位文字同好们在这里留步，在下方留言共同探讨经典阅读和生活美学，让这一片小天地真正升华。`,
    published: true,
    views: 125,
    likesCount: 12,
    authorId: "admin-yinaiermei",
    authorName: "小雨如酥",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 * 48 },
    updatedAt: { seconds: Math.floor(Date.now() / 1000) - 3600 * 48 }
  },
  "sample-2": {
    id: "sample-2",
    title: "【品读经典】瓦尔登湖畔的午后，与梭罗一同寻见极简之美",
    slug: "walden-reading-notes",
    category: "读书",
    categories: ["读书"],
    tags: ["经典品读", "超验主义", "自然本真"],
    summary: "读毕《瓦尔登湖》，掩卷沉思：我们是否主动给自己的生命添加了太多无谓的行囊？在今日这个纷繁的世界中，如何回归梭罗那清澈、专注的精神本源？",
    content: `# 与梭罗一同寻见极简：读《瓦尔登湖》有感

> "我步入丛林，因为我希望生活得有意义，只面对生活的基本事实，看看我是否能学到它要教我的一切，而不是等我死的时候，发现自己没活过。" -- 亨利·戴维·梭罗

每当现代的喧嚣让我无法静立，我总会下意识地从书架中抽出来这本素雅的《瓦尔登湖》。在这个暖意盎然的午后，泡一杯清茶，随他的笔触重返马萨诸塞州康科德镇的那片宁静森林。

## 什么是纯粹的「生活事实」？
梭罗花了很少的银两在瓦尔登湖畔搭建起属于他自己、仅有单间大小的小木屋。他通过一整年种植马铃薯、大豆，自己烤面包来维持开销。他发现：
- 现代人的劳碌，大多并非源于基本的生存本钱，而是源作对过剩器物的虚妄渴望。
- 拥有越繁复的家什，越容易沦为这堆器物的被动奴役。

美学其实并不是在生活的表面贴上昂贵的金箔，而是像梭罗用斧头砍断松树枝一样，通过一刀一刻的精简除去芜杂。当我们脱离无休无止的通知提示，回归一杯泉、一束野花，才足以看清自我灵魂的原色。`,
    published: true,
    views: 94,
    likesCount: 8,
    authorId: "admin-yinaiermei",
    authorName: "小雨如酥",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 * 24 },
    updatedAt: { seconds: Math.floor(Date.now() / 1000) - 3600 * 24 }
  },
  "sample-3": {
    id: "sample-3",
    title: "关于泥土与火焰的呢喃：手作陶器中的「侘寂」留白",
    slug: "handmade-pottery-wabisabi-aesthetics",
    category: "生活美学",
    categories: ["生活美学"],
    tags: ["陶器手作", "侘寂美学", "东方美意"],
    summary: "将一块朴拙的稀泥置于拉坯机之上，当指尖慢慢感受到泥土湿润而细腻的阻力，那不仅是一只杯、一尊瓶的成型，更是一场将呼吸与自然揉捏而合的内心修行。",
    content: `# 泥土与火焰的手作之吻：于拉坯中冥想

在这个被光滑荧幕和冰冷算法包围的世代，我最治愈的时刻是由指腹 and 沙泥直接擦摩的那个下午。

这几年来，我在书房的角落中置办了属于自己的手作泥胎。每一次，当双足踩下拉坯转盘的控制踏板，看着不规则的泥砂围绕轴心飞快盘旋：
1. **揉泥定中心**：如果指尖气力不均，泥团就会发生摆动。你必须先稳固呼吸，用核心内侧向心抱圆的力量把它的偏差规正——这极其类似古老的精神定境。
2. **舒展塑雏形**：在顺畅的圆周节奏下，把一指探入它的腹心，缓缓往外引流出一块容纳茶汤的温存虚空。

## 侘寂（Wabi-Sabi）：残缺亦是丰饶
制作手作陶器最令人着迷的是它的不可预测。或许在烧窑的历程中，窑温发生不可控的微小震荡，导致釉面形成一丝断纹（冰裂），甚至胎底泛出一层铁砂斑：
- 这些并不是瑕疵，正是它们宣示了这一尊陶器是真正诞生于粗糙的自然机理。
- 机械量产的茶杯平整光滑得毫无表情，而一只有凹凸质感的手作陶杯，却好似正呼气吐纳，和持杯人进行微弱而长久的体温对话。

生活本如陶土，不必严丝合缝、不必完美无暇。去发现那些粗糙中蕴藏的平和、古旧中承载的墨香，就是给疲乏的身骨，提供一席宁静舒展的席垫。`,
    published: true,
    views: 110,
    likesCount: 16,
    authorId: "admin-yinaiermei",
    authorName: "小雨如酥",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 * 12 },
    updatedAt: { seconds: Math.floor(Date.now() / 1000) - 3600 * 12 }
  }
};

function loadDB(): DBData {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content);
      // Ensure all root keys exist
      return {
        users: db.users || {},
        posts: db.posts || {},
        comments: db.comments || {},
        likes: db.likes || {}
      };
    } catch (err) {
      console.error("Error reading JSON DB, using default structure:", err);
    }
  }
  return { users: {}, posts: { ...initialSeedPosts }, comments: {}, likes: {} };
}

function saveDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving JSON DB:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. REGISTER API
  app.post("/api/auth/register", async (req, res) => {
    const { email, pass, displayName } = req.body;
    if (!email || !pass || !displayName) {
      return res.status(400).send("请填写所有必填字段（注册邮箱、密码、昵称）。");
    }
    const cleanEmail = email.trim().toLowerCase();
    const dbData = loadDB();
    if (dbData.users[cleanEmail]) {
      return res.status(400).send("该邮箱已被注册。如有疑问可通过专属通道取得反馈。");
    }
    const isRootAdmin = cleanEmail === "yinaiermei4431@outlook.com";
    const newUser = {
      uid: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      password: pass,
      displayName: displayName.trim(),
      role: isRootAdmin ? "admin" : "reader",
      createdAt: new Date().toISOString()
    };
    dbData.users[cleanEmail] = newUser;
    saveDB(dbData);
    res.json({
      user: {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role
      }
    });
  });

  // 2. LOGIN API
  app.post("/api/auth/login", async (req, res) => {
    const { email, pass } = req.body;
    if (!email || !pass) {
      return res.status(400).send("请完整填写登录邮箱与安全密码。");
    }
    const cleanEmail = email.trim().toLowerCase();
    const dbData = loadDB();
    
    // Auto-bootstrap Admin Account
    if (!dbData.users[cleanEmail] && cleanEmail === "yinaiermei4431@outlook.com") {
      dbData.users[cleanEmail] = {
        uid: "admin-yinaiermei",
        email: cleanEmail,
        password: pass,
        displayName: "小雨如酥",
        role: "admin",
        createdAt: new Date().toISOString()
      };
      saveDB(dbData);
    }

    const userData = dbData.users[cleanEmail];
    if (!userData) {
      return res.status(400).send("此邮箱暂未在美学馆注册。建议通过一键快捷注册登录。");
    }

    if (userData.password !== pass) {
      return res.status(400).send("安全保障密码不正确。请仔细检查您的拼写。");
    }

    res.json({
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role || "reader"
      }
    });
  });

  // 3. GET POSTS (Separated for public / admin views)
  app.get("/api/posts", async (req, res) => {
    try {
      const userEmail = req.headers['x-user-email'] as string || '';
      const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';

      const dbData = loadDB();
      const list = Object.values(dbData.posts).filter((p: any) => {
        if (isAdmin) return true;
        return p.published === true;
      });

      // Sort client-side desc by date based on standard timestamp or seconds representation
      list.sort((a, b) => {
        const getSec = (x: any) => {
          if (!x) return 0;
          if (x.seconds) return x.seconds;
          if (typeof x === 'string') return Math.floor(new Date(x).getTime() / 1000);
          return 0;
        };
        return getSec(b.createdAt) - getSec(a.createdAt);
      });

      res.json(list);
    } catch (err: any) {
      console.error("Get posts proxy error:", err);
      res.status(500).send(err.message || "文章拉取失败。");
    }
  });

  // 4. CREATE POST (Admin only)
  app.post("/api/posts", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
    if (!isAdmin) {
      return res.status(403).send("只有专属站长小雨如酥能够在此落笔发表。");
    }

    const { title, slug, content, summary, category, categories, tags, published } = req.body;
    if (!title || !slug || !content) {
      return res.status(400).send("标题、路径和主体文章内容均不可为空。");
    }

    const postId = `post-${Date.now()}`;
    const dbData = loadDB();

    try {
      const newPost = {
        id: postId,
        title,
        slug,
        content,
        summary: summary || '',
        category: category || '随笔',
        categories: categories || [category || '随笔'],
        tags: tags || [],
        published: published !== false,
        views: 1,
        likesCount: 0,
        authorId: 'admin-yinaiermei',
        authorName: '小雨如酥',
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      };
      dbData.posts[postId] = newPost;
      saveDB(dbData);
      res.json(newPost);
    } catch (err: any) {
      console.error("Create post proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // 5. UPDATE POSTS (Admin only)
  app.put("/api/posts/:id", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
    if (!isAdmin) {
      return res.status(403).send("拒绝访问：仅限本美学馆站长修改文章。");
    }

    const { id } = req.params;
    const { title, slug, content, summary, category, categories, tags, published } = req.body;
    const dbData = loadDB();

    try {
      const post = dbData.posts[id];
      if (!post) {
        return res.status(404).send("文章未找到。");
      }

      dbData.posts[id] = {
        ...post,
        title,
        slug,
        content,
        summary,
        category,
        categories: categories || [category],
        tags,
        published,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      };
      saveDB(dbData);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Update post proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // 6. DELETE POSTS (Admin only)
  app.delete("/api/posts/:id", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
    if (!isAdmin) {
      return res.status(403).send("拒绝访问：仅限本站长删除。");
    }

    const { id } = req.params;
    const dbData = loadDB();

    try {
      if (dbData.posts[id]) {
        delete dbData.posts[id];
        delete dbData.comments[id];
        delete dbData.likes[id];
        saveDB(dbData);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("Delete post error:", err);
      res.status(500).send(err.message);
    }
  });

  // 7. GET COMMENTS (Respects moderation queue)
  app.get("/api/posts/:postId/comments", async (req, res) => {
    const { postId } = req.params;
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';

    try {
      const dbData = loadDB();
      const allComments = dbData.comments[postId] || [];
      const list = allComments.filter((c: any) => {
        if (isAdmin) return true;
        return c.approved === true;
      });

      // Sort chronological asc
      list.sort((a, b) => {
        const getSec = (x: any) => {
          if (!x) return 0;
          if (x.seconds) return x.seconds;
          if (typeof x === 'string') return Math.floor(new Date(x).getTime() / 1000);
          return 0;
        };
        return getSec(a.createdAt) - getSec(b.createdAt);
      });

      res.json(list);
    } catch (err: any) {
      console.error("Get comments proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // 8. ADD COMMENTS (Visitor or logged-in)
  app.post("/api/posts/:postId/comments", async (req, res) => {
    const { postId } = req.params;
    const { content, authorName, authorEmail, authorAvatar } = req.body;
    const callerEmail = req.headers['x-user-email'] as string || '';
    const callerId = req.headers['x-user-id'] as string || '';
    const decodedCallerName = req.headers['x-user-name'] ? decodeURIComponent(req.headers['x-user-name'] as string) : '';

    if (!content) {
      return res.status(400).send("评论文字不可为空格。");
    }

    const isCommentAdmin = callerEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';

    try {
      const newComment = {
        id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        postId,
        content,
        authorId: callerId || `guest-${Date.now()}`,
        authorName: isCommentAdmin ? "博主小雨如酥" : (decodedCallerName || authorName || "雅致读者"),
        authorEmail: isCommentAdmin ? callerEmail : (authorEmail || ''),
        authorAvatar: authorAvatar || '',
        approved: isCommentAdmin, // Skip moderation for Admin replies/comments
        replies: [],
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      const dbData = loadDB();
      if (!dbData.comments[postId]) {
        dbData.comments[postId] = [];
      }
      dbData.comments[postId].push(newComment);
      saveDB(dbData);
      res.json(newComment);
    } catch (err: any) {
      console.error("Write comment proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // 9. APPROVE COMMENT (Admin only)
  app.post("/api/posts/:postId/comments/:commentId/approve", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
    if (!isAdmin) {
      return res.status(403).send("拒绝访问：仅限站长执行评论审核。");
    }

    const { postId, commentId } = req.params;
    const dbData = loadDB();

    try {
      const comments = dbData.comments[postId] || [];
      const comment = comments.find((c: any) => c.id === commentId);
      if (comment) {
        comment.approved = true;
        saveDB(dbData);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("Approve comment proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // 10. REPLY COMMMENTS (Admin only)
  app.post("/api/posts/:postId/comments/:commentId/reply", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
    if (!isAdmin) {
      return res.status(403).send("仅本站长（小雨如酥）可见专属回复。");
    }

    const { postId, commentId } = req.params;
    const { content } = req.body;
    const dbData = loadDB();

    try {
      const comments = dbData.comments[postId] || [];
      const comment = comments.find((c: any) => c.id === commentId);
      if (!comment) {
        return res.status(404).send("找不到需要回复的目标评论。");
      }

      const existingReplies = comment.replies || [];
      const newReply = {
        id: `reply-${Date.now()}`,
        authorName: '博主小雨如酥',
        authorId: 'admin-yinaiermei',
        content: content.trim(),
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      comment.replies = [...existingReplies, newReply];
      saveDB(dbData);

      res.json({ id: commentId, replies: comment.replies });
    } catch (err: any) {
      console.error("Admin reply proxy error:", err);
      res.status(500).send(err.message);
    }
  });

  // 11. DELETE COMMENTS (Admin or comments owner)
  app.delete("/api/posts/:postId/comments/:commentId", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const userId = req.headers['x-user-id'] as string || '';
    const { postId, commentId } = req.params;
    const dbData = loadDB();

    try {
      const comments = dbData.comments[postId] || [];
      const index = comments.findIndex((c: any) => c.id === commentId);
      if (index === -1) {
        return res.status(404).send("未定位到目标评论。");
      }

      const comment = comments[index];
      const commentOwner = comment.authorId === userId;
      const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';

      if (!commentOwner && !isAdmin) {
        return res.status(403).send("拒绝访问：您仅可对您发表的言论执行撤销。");
      }

      comments.splice(index, 1);
      saveDB(dbData);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Delete comment error:", err);
      res.status(500).send(err.message);
    }
  });

  // 12. CHECK HAS LIKED POST
  app.get("/api/posts/:postId/like/check", async (req, res) => {
    const userId = req.headers['x-user-id'] as string || '';
    if (!userId) {
      return res.json({ hasLiked: false });
    }

    const { postId } = req.params;
    const dbData = loadDB();
    try {
      const likesList = dbData.likes[postId] || [];
      res.json({ hasLiked: likesList.includes(userId) });
    } catch (err) {
      res.json({ hasLiked: false });
    }
  });

  // Increment view count for a post (Public route for reader interactions)
  app.post("/api/posts/:postId/view", async (req, res) => {
    const { postId } = req.params;
    const dbData = loadDB();
    try {
      const post = dbData.posts[postId];
      if (post) {
        post.views = (post.views || 0) + 1;
        saveDB(dbData);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("Increment views error:", err);
      res.status(500).send(err.message || "Failed to increment view count");
    }
  });

  // 13. TOGGLE LIKES ON POSTS
  app.post("/api/posts/:postId/like", async (req, res) => {
    const userId = req.headers['x-user-id'] as string || '';
    if (!userId) {
      return res.status(401).send("请发表观点或快捷注册登录后点赞文章。");
    }

    const { postId } = req.params;
    const dbData = loadDB();

    try {
      if (!dbData.likes[postId]) {
        dbData.likes[postId] = [];
      }
      const likesList = dbData.likes[postId];
      const index = likesList.indexOf(userId);
      const post = dbData.posts[postId];

      if (index !== -1) {
        likesList.splice(index, 1);
        if (post) {
          post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
        }
        saveDB(dbData);
        return res.json({ likesCount: post?.likesCount || 0, hasLiked: false });
      } else {
        likesList.push(userId);
        if (post) {
          post.likesCount = (post.likesCount || 0) + 1;
        }
        saveDB(dbData);
        return res.json({ likesCount: post?.likesCount || 0, hasLiked: true });
      }
    } catch (err: any) {
      console.error("Toggle like error:", err);
      res.status(500).send(err.message);
    }
  });

  // 14. GEMINI GENERATOR PROXY
  app.post("/api/generate-post", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).send("Prompt is required");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send("GEMINI_API_KEY environment variable is not defined on the server host.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `You are an expert copywriter, book reviewer, and life aesthetics curator. A blogger named 小雨如酥 (who writes about reading and life aesthetics, with NO software development or artificial intelligence content) wants to write an article.
User theme/prompt: "${prompt}"

Return a JSON object conforming strictly to this format:
{
  "title": "A catchy, beautifully polished title in Chinese",
  "category": "One of: 读书, 生活美学, 随笔, 日记, 艺术, 摄影",
  "summary": "A high-quality 2-sentence summary in Chinese reflecting the theme and outlining the content",
  "content": "A fully polished, professionally written, well-structured blog article outline or draft in high-quality Chinese Markdown about reading, books, literature, philosophy, or aesthetics. Use headings, blockquotes, lists, and beautiful literary flow",
  "tags": ["up to 4 precise lowercase tags matching the text, e.g. classic, aesthetics, design, reading"]
}

IMPORTANT: Return ONLY the raw JSON string. Do NOT wrap in markdown segments like \`\`\`json \`\`\` or similar.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.1-flash',
        contents: systemPrompt,
      });

      let text = response.text || "";
      text = text.trim();
      
      if (text.startsWith("```json")) {
        text = text.substring(7);
      } else if (text.startsWith("```")) {
        text = text.substring(3);
      }
      if (text.endsWith("```")) {
        text = text.substring(0, text.length - 3);
      }
      text = text.trim();

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      res.status(500).send(error.message || "Failed to generate blog post from Gemini API.");
    }
  });

  // 15. SEED SYSTEM
  app.post("/api/posts/seed", async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string || '';
    const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
    if (!isAdmin) {
      return res.status(403).send("拒绝访问：仅限本美学馆站长执行样本灌录。");
    }

    try {
      const dbData = loadDB();
      dbData.posts = { ...initialSeedPosts };
      saveDB(dbData);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Seed error:", err);
      res.status(500).send(err.message);
    }
  });

  // 16. DOCX TO MARKDOWN CONVERSION API (Allows native Word doc parsing for admin)
  app.post(
    "/api/convert-docx",
    express.raw({ type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", limit: "15mb" }),
    async (req, res) => {
      const userEmail = req.headers['x-user-email'] as string || '';
      const isAdmin = userEmail.trim().toLowerCase() === 'yinaiermei4431@outlook.com';
      if (!isAdmin) {
        return res.status(403).send("拒绝访问：仅限本美学馆站长自主上传并解析 Word 稿件。");
      }

      try {
        const buffer = req.body;
        if (!buffer || buffer.length === 0) {
          return res.status(400).send("Word 稿件内容为空或上传中断，请重试。");
        }

        // Convert docx buffer to HTML using mammoth
        const result = await mammoth.convertToHtml({ buffer });
        let html = result.value || "";

        // Set up Turndown to convert HTML to high quality Markdown
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          hr: '---',
          bulletListMarker: '-',
          codeBlockStyle: 'fenced'
        });
        turndownService.use(gfm);

        let markdown = turndownService.turndown(html);

        // Smart extraction of Title: search for first Heading tag in html
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        let extractedTitle = '';
        if (h1Match) {
          extractedTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
        }

        if (!extractedTitle) {
          const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
          if (h2Match) {
            extractedTitle = h2Match[1].replace(/<[^>]*>/g, '').trim();
          }
        }

        // Clean markdown body if the leading header repeats the title exactly
        if (extractedTitle) {
          const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const titlePattern = new RegExp(`^\\s*#+\\s*${escapeRegExp(extractedTitle)}\\s*\\n+`, 'i');
          markdown = markdown.replace(titlePattern, '');
        }

        // Auto extract summary from first paragraph text
        const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const extractedSummary = plainText.length > 150 ? plainText.slice(0, 150) + "..." : plainText;

        res.json({
          title: extractedTitle,
          markdown: markdown.trim(),
          summary: extractedSummary,
        });
      } catch (err: any) {
        console.error("Docx conversion error:", err);
        res.status(500).send(err.message || "Word 转化为 Markdown 期间发生错误，请确保文档格式为标准 .docx 格式。");
      }
    }
  );

  // Vite middleware routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server loaded and listening on port ${PORT}`);
  });
}

startServer();
