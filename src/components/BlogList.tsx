import React, { useState, useMemo } from 'react';
import { Post } from '../types';
import BlogCard from './BlogCard';
import { Search, Compass, ListFilter, ArrowUpDown, Tag, Sparkles } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface BlogListProps {
  posts: Post[];
  onPostSelect: (post: Post) => void;
  onEditPost: (post: Post) => void;
  isAdmin: boolean;
}

type SortOption = 'newest' | 'likes' | 'views';

export default function BlogList({ posts, onPostSelect, onEditPost, isAdmin }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Dynamically calculate active categories present in the system
  const categories = useMemo(() => {
    const list = new Set<string>();
    posts.forEach((p) => {
      if (p.categories && p.categories.length > 0) {
        p.categories.forEach((cat) => list.add(cat));
      } else if (p.category) {
        list.add(p.category);
      }
    });
    return ['全部', ...Array.from(list)];
  }, [posts]);

  // Dynamically calculate top 12 tags present in the system
  const commonTags = useMemo(() => {
    const counts: { [key: string]: number } = {};
    posts.forEach((p) => {
      p.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);
  }, [posts]);

  // Filter & Sort core logic (All client-side for immediate responsiveness)
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // 1. Hide drafts if not Admin
    if (!isAdmin) {
      result = result.filter((p) => p.published);
    }

    // 2. Category filter
    if (selectedCategory !== '全部') {
      result = result.filter((p) => {
        if (p.categories && p.categories.length > 0) {
          return p.categories.includes(selectedCategory);
        }
        return p.category === selectedCategory;
      });
    }

    // 3. Tag filter
    if (selectedTag) {
      result = result.filter((p) => p.tags?.includes(selectedTag));
    }

    // 4. Seach query filter
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'likes') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortBy === 'views') {
        return (b.views || 0) - (a.views || 0);
      }
      // default: newest
      const getTimeOf = (ts: any): number => {
        if (!ts) return 0;
        if (typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (ts.seconds) return ts.seconds * 1000;
        return new Date(ts).getTime();
      };
      const tA = getTimeOf(a.createdAt);
      const tB = getTimeOf(b.createdAt);
      return tB - tA;
    });

    return result;
  }, [posts, selectedCategory, selectedTag, debouncedSearchQuery, sortBy, isAdmin]);

  const clearFilters = () => {
    setSelectedCategory('全部');
    setSelectedTag(null);
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10" id="blog-feed-container">
      {/* Editorial Intro Banner */}
      <div className="mb-12 text-center md:mb-16">
        <h1 className="font-display text-4.5xl font-medium tracking-wide text-[#33251a] md:text-5.5xl">
          记录书香墨影与生活美学
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed text-gray-500">
          你好！欢迎来到我的个人写作空间。这里汇集了我关于经典阅读、生活美学、艺术随笔与日常感悟的探寻与思索。
        </p>
      </div>

      {/* Bento Filter & Search Controls */}
      <div className="mb-10 grid gap-4 md:grid-cols-12">
        {/* Search Input Card */}
        <div className="relative md:col-span-6">
          <Search className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜寻文章、话题、或标签的内容..."
            className="h-11 w-full rounded-xl border border-gray-100 bg-white pr-4 pl-11 font-sans text-sm text-gray-800 outline-hidden transition-all placeholder:text-gray-400 focus:border-gray-200 focus:ring-2 focus:ring-gray-100 shadow-3xs"
            id="search-input"
          />
        </div>

        {/* Category Selector Card */}
        <div className="relative md:col-span-3">
          <ListFilter className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedTag(null); // Clear tag selection when changing category
            }}
            className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-white pr-10 pl-11 font-sans text-sm text-gray-700 outline-hidden transition-all focus:border-gray-200 shadow-3xs cursor-pointer"
            id="category-dropdown"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === '全部' ? '分类：显示全部' : `分类：${cat}`}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
            <Compass className="h-4 w-4" />
          </div>
        </div>

        {/* Sorting Dropdown Card */}
        <div className="relative md:col-span-3">
          <ArrowUpDown className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 w-full appearance-none rounded-xl border border-gray-100 bg-white pr-10 pl-11 font-sans text-sm text-gray-700 outline-hidden transition-all focus:border-gray-200 shadow-3xs cursor-pointer"
            id="sort-dropdown"
          >
            <option value="newest">按最新时间排序</option>
            <option value="likes">按点赞数排行</option>
            <option value="views">按浏览量排序</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
            <Compass className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Horizontal Tag Filters */}
      {commonTags.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-2" id="tag-cloud-container">
          <span className="flex items-center gap-1 font-sans text-xs font-semibold text-gray-400 mr-1.5 uppercase tracking-wide">
            <Tag className="h-3 w-3" /> 推荐标签:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-all cursor-pointer ${
              selectedTag === null
                ? 'bg-gray-900 text-white shadow-3xs'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {commonTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-gray-900 text-white shadow-3xs'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid View */}
      {filteredAndSortedPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" id="posts-grid">
          {filteredAndSortedPosts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onClick={() => onPostSelect(post)}
              onEdit={() => onEditPost(post)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        /* Clean Empty States */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center" id="empty-state">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-gray-900">未找到相应的文章</h3>
          <p className="mt-1.5 font-sans text-sm text-gray-500 max-w-xs">
            当前筛选条件下没有任何文章发布，或者正在拟定您的新一篇随笔。
          </p>
          {(searchQuery || selectedCategory !== '全部' || selectedTag) && (
            <button
              onClick={clearFilters}
              className="mt-5 rounded-full bg-gray-900 px-4 py-1.5 font-sans text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
            >
              重置过滤条件
            </button>
          )}

          {isAdmin && !searchQuery && selectedCategory === '全部' && !selectedTag && (
            <p className="mt-4 font-mono text-xs font-bold text-amber-600">
              提示：您可以点击右上角的 "撰写新文章" 来创建您的第一篇个人博文！
            </p>
          )}
        </div>
      )}
    </div>
  );
}
