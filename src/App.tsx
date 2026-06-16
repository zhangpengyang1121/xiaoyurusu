import { useState, useEffect } from 'react';
import { 
  BlogUser, 
  Post, 
  getSavedUser, 
  clearUser, 
  fetchPosts, 
  createPost, 
  updatePost, 
  seedServerSamples 
} from './clientApi';
import { ViewTab } from './types';

// Import components
import Header from './components/Header';
import BlogList from './components/BlogList';
import BlogDetail from './components/BlogDetail';
import BlogEditor from './components/BlogEditor';
import LoginModal from './components/LoginModal';

import { Sparkles, Loader2, Compass } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<BlogUser | null>(getSavedUser());
  const [authReady, setAuthReady] = useState(true); // LocalStorage-based auth is instantly ready
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  
  const [currentTab, setCurrentTab] = useState<ViewTab>('feed');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  // 1. Fetch posts initially and when user authentication state changes
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const list = await fetchPosts();
      setPosts(list);
    } catch (err) {
      console.error('Load posts failed:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  // 2. Keep selectedPost synced with list updates (e.g. view count, like increments, edit contents)
  useEffect(() => {
    if (selectedPost) {
      const updated = posts.find((p) => p.id === selectedPost.id);
      if (updated) {
        setSelectedPost(updated);
      }
    }
  }, [posts, selectedPost?.id]);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setCurrentTab('feed');
    setSelectedPost(null);
    setEditingPost(null);
  };

  // 3. Save write / update post content to database
  const handleSavePost = async (postData: {
    title: string;
    slug: string;
    content: string;
    summary: string;
    category: string;
    categories?: string[];
    tags: string[];
    published: boolean;
  }) => {
    if (!user) return;
    try {
      if (editingPost) {
        await updatePost(editingPost.id, postData);
        setEditingPost(null);
      } else {
        await createPost(postData);
      }
      await loadPosts(); // Fetch latest list
      setCurrentTab('feed');
    } catch (err: any) {
      alert(err.message || '文章保存失败。');
    }
  };

  // 4. Seeder helper to populate sample posts if empty and admin requests
  const handleSeedSamples = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await seedServerSamples();
      await loadPosts();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTabChange = (tab: ViewTab) => {
    setCurrentTab(tab);
    if (tab === 'feed') {
      setSelectedPost(null);
      setEditingPost(null);
    }
  };

  const selectPostToView = (post: Post) => {
    setSelectedPost(post);
    setCurrentTab('post');
  };

  const selectPostToEdit = (post: Post) => {
    setEditingPost(post);
    setCurrentTab('edit');
  };

  // Render core views Router
  const renderContent = () => {
    if (!authReady) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="font-sans text-xs font-semibold text-gray-400">正在检查博客系统安全协议...</span>
        </div>
      );
    }

    if (currentTab === 'feed') {
      if (isLoadingPosts) {
        return (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
            <span className="font-sans text-xs text-gray-400">正从数据库拉取博客文章...</span>
          </div>
        );
      }

      return (
        <div>
          {/* Admin Seeder Box if database has zero records to boot layout natively */}
          {posts.length === 0 && isAdmin && (
            <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center select-none">
              <Sparkles className="mx-auto h-6 w-6 text-amber-500" />
              <h4 className="mt-2.5 font-display text-sm font-semibold text-amber-800">首次建立个人博屋：一键种子发布样章</h4>
              <p className="mt-1.5 font-sans text-xs text-amber-600 max-w-md mx-auto">
                尊敬的站长！目前您的 Firestore 数据库没有检测到任何文章。点击下方的一键发布，即可自动生成 3 篇为您量身定做、具备完整 MarkDown、标签和分类的阅读与生活美学优雅博客，秒速激活整站视觉！
              </p>
              <button
                type="button"
                disabled={isSeeding}
                onClick={handleSeedSamples}
                className="mt-4 flex mx-auto items-center gap-2 rounded-full bg-amber-600 px-5 py-1.5 font-sans text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSeeding ? '发布中...' : '一键生成 3 篇高质量样章'}
              </button>
            </div>
          )}

          <BlogList
            posts={posts}
            onPostSelect={selectPostToView}
            onEditPost={selectPostToEdit}
            isAdmin={isAdmin}
          />
        </div>
      );
    }

    if (currentTab === 'post' && selectedPost) {
      return (
        <BlogDetail
          post={selectedPost}
          user={user}
          onBack={() => handleTabChange('feed')}
          onLogin={handleLogin}
          onRefresh={loadPosts}
        />
      );
    }

    if (currentTab === 'write' && isAdmin) {
      return (
        <BlogEditor
          post={null}
          onSave={handleSavePost}
          onCancel={() => handleTabChange('feed')}
        />
      );
    }

    if (currentTab === 'edit' && editingPost && isAdmin) {
      return (
        <BlogEditor
          post={editingPost}
          onSave={handleSavePost}
          onCancel={() => handleTabChange('feed')}
        />
      );
    }

    // Default Fallback
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <Compass className="h-8 w-8 text-gray-300" />
        <h4 className="mt-3 font-display text-base font-semibold text-gray-700">您似乎迷路了</h4>
        <button 
          onClick={() => handleTabChange('feed')}
          className="mt-4 rounded-full bg-gray-900 px-4 py-1.5 font-sans text-xs font-semibold text-white cursor-pointer"
        >
          返回博客大厅
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f4eb]">
      <Header
        user={user}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {renderContent()}
      </main>

      {/* Elegant minimalist Human Credit footer */}
      <footer className="border-t border-amber-100/40 bg-white/20 py-8 text-center select-none">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs text-gray-500">
          <span>© 2026 因爱而美小雨如酥生活美学馆. All Rights Reserved.</span>
          <div className="flex items-center gap-2">
            <span>寻回阅读真意</span>
            <span>•</span>
            <span>体验生活美学</span>
            {isAdmin && (
              <>
                <span>•</span>
                <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold uppercase select-all">
                  管理终端
                </span>
              </>
            )}
          </div>
        </div>
      </footer>

      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setUser(getSavedUser());
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}
