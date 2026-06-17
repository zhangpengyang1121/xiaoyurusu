import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import Markdown from 'react-markdown';
import { PenTool, Eye, CheckCircle2, X, AlertCircle, Compass, FileText, Upload } from 'lucide-react';
import mammoth from 'mammoth';

interface BlogEditorProps {
  post: Post | null;
  onSave: (data: {
    title: string;
    slug: string;
    content: string;
    summary: string;
    category: string;
    categories?: string[];
    tags: string[];
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function BlogEditor({ post, onSave, onCancel }: BlogEditorProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categories, setCategories] = useState<string[]>(['读书']);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [published, setPublished] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportingWord, setIsImportingWord] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize fields if editing existing post
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      if (post.categories && post.categories.length > 0) {
        setCategories(post.categories);
      } else {
        setCategories([post.category || '读书']);
      }
      setSummary(post.summary || '');
      setContent(post.content || '');
      setTagsText(post.tags ? post.tags.join(', ') : '');
      setPublished(post.published ?? false);
    } else {
      // Defaults for new post
      setTitle('');
      setSlug('');
      setCategories(['读书']);
      setSummary('');
      setContent('');
      setTagsText('');
      setPublished(false);
    }
  }, [post]);

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s-]/g, '') // keeps alphanumeric & Chinese
      .replace(/\s+/g, '-')
      .slice(0, 100);
  };

  // Auto generate slug from title when editing/typing
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!post) {
      setSlug(generateSlug(val));
    }
  };

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setErrorMsg('系统仅支持解析 Word (.docx) 格式的电子稿件。请确保您选择的文件正确。');
      return;
    }

    setIsImportingWord(true);
    setErrorMsg('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      const text = result.value;
      const lines = text.split('\n').filter(line => line.trim());
      
      const title = lines[0] || '无标题';
      const content = lines.slice(1).join('\n\n');
      
      if (title) {
        setTitle(title);
        if (!post) {
          setSlug(generateSlug(title));
        }
      }
      
      if (content) {
        setContent(content);
      }

      const summary = content.slice(0, 200).replace(/\n/g, ' ') + (content.length > 200 ? '...' : '');
      setSummary(summary);
      
      setActiveTab('write');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('解析 Word 文件失败，请确保文件格式正确。');
    } finally {
      setIsImportingWord(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || categories.length === 0 || !content.trim()) {
      setErrorMsg('请写下标题、至少选择一个分类和博文内容再保存。');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Format tags
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 30)
      .slice(0, 10); // max 10 tags limit for database array guarding

    try {
      await onSave({
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        content: content.trim(),
        summary: summary.trim() || content.slice(0, 150).replace(/[#*`]/g, '') + '...',
        category: categories[0] || '读书',
        categories,
        tags,
        published,
      });
    } catch (err: any) {
      setErrorMsg(err.message || '保存文章时出现错误。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10" id="blog-editor-container">
      {/* Editorial Header */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {post ? '编辑博文文章' : '写下新的随笔'}
          </h1>
          <p className="mt-1 font-sans text-xs text-gray-400">
            {post ? `修改正在拟定的"${post.title}"内容` : '编辑生动的文字，分享您的探寻与思考'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Word (.docx) Import Button */}
          <label
            className={`flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 font-sans text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 transition-colors cursor-pointer ${
              isImportingWord ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            id="word-import-trigger"
          >
            <Upload className={`h-3.5 w-3.5 text-blue-500 ${isImportingWord ? 'animate-bounce' : ''}`} />
            <span>{isImportingWord ? '正在解析 Word... (含图片)' : '导入 Word 稿件'}</span>
            <input
              type="file"
              accept=".docx"
              onChange={handleWordUpload}
              disabled={isImportingWord}
              className="hidden"
            />
          </label>

          <button
            onClick={onCancel}
            className="rounded-full border border-gray-200 bg-white p-1.5 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
            title="关闭编辑器"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error reporting banner */}
      {errorMsg && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-red-50 p-4 text-red-700" id="editor-error-banner">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="font-sans text-xs leading-normal">{errorMsg}</p>
        </div>
      )}

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Title input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-bold text-gray-700">文章标题</label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="请输入引人入胜的博客标题..."
              className="h-11 rounded-xl border border-gray-100 bg-white px-4 font-sans text-sm text-gray-800 outline-hidden transition-all focus:border-gray-200"
              id="editor-title-input"
            />
          </div>

          {/* Alias / Slug input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-bold text-gray-700">文章专属 URL 别名 (Slug)</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="e.g. dynamic-web-components"
              className="h-11 rounded-xl border border-gray-100 bg-white px-4 font-mono text-sm text-gray-800 outline-hidden transition-all focus:border-gray-200"
              id="editor-slug-input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Categories select multiple via dynamic tags */}
          <div className="flex flex-col gap-1.5 sm:col-span-1">
            <label className="font-sans text-xs font-bold text-gray-700">文章分类 (可多选)</label>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-100 bg-white p-2" id="editor-categories-choices">
              {['读书', '生活美学', '随笔', '日记', '艺术', '摄影'].map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (categories.length > 1) {
                          setCategories(categories.filter((c) => c !== cat));
                        }
                      } else {
                        setCategories([...categories, cat]);
                      }
                    }}
                    className={`rounded-lg px-2.5 py-1 font-sans text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gray-900 border-transparent text-white shadow-3xs'
                        : 'bg-[#fafafa] border-gray-100 text-gray-500 hover:bg-gray-100/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags visually list */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="font-sans text-xs font-bold text-gray-700">标签 (Tags, 逗号分隔, 限制10个内)</label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="例如：React19, TypeScript, 思考, CSS4"
              className="h-11 rounded-xl border border-gray-100 bg-white px-4 font-sans text-sm text-gray-800 outline-hidden transition-all focus:border-gray-200"
              id="editor-tags-input"
            />
          </div>
        </div>

        {/* Short Summary text area */}
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-bold text-gray-700">博文大纲概要 (1000字符内)</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="写一个吸引读者的简要简述，将显示在首页博客流中..."
            rows={2}
            className="rounded-xl border border-gray-100 bg-white p-3.5 font-sans text-sm text-gray-800 outline-hidden transition-all focus:border-gray-200"
            id="editor-summary-textarea"
          />
        </div>

        {/* Content Tabs (Write vs Preview) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <label className="font-sans text-xs font-bold text-gray-700">文章正文内容 (Markdown格式)</label>
            
            <div className="flex rounded-lg bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`flex items-center gap-1 rounded-md px-3 py-1 font-sans text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTab === 'write' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <PenTool className="h-3 w-3" />
                <span>撰写内容</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 rounded-md px-3 py-1 font-sans text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTab === 'preview' ? 'bg-white text-gray-900 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>实时预览</span>
              </button>
            </div>
          </div>

          {activeTab === 'write' ? (
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# 欢迎开始写作！

使用标准的 Markdown 语法可以轻松发表您的文章。

## 支持的排版例子
- **粗体内容**与*斜体部分*
- 代码短语： `const blog = 'great'`
- 分割线和高亮区。

可以用 AI 辅助创作一键初始化大纲哦！"
              rows={16}
              className="w-full rounded-2xl border border-gray-100 bg-white p-4.5 font-mono text-sm leading-relaxed text-gray-800 outline-hidden transition-all focus:border-gray-200"
              id="editor-body-textarea"
            />
          ) : (
            <div className="min-h-[350px] max-h-[500px] overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/40 p-6 shadow-inset select-none">
              {content ? (
                <div className="markdown-body transition-fade">
                  <Markdown>{content}</Markdown>
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                  <Compass className="h-8 w-8 text-gray-300" />
                  <p className="mt-2.5 font-sans text-xs text-gray-400">尚未在左侧编辑任何内容，快写点什么吧...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bottom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
          {/* Draft toggle checkbox */}
          <label className="flex cursor-pointer items-center gap-2 font-sans text-sm select-none">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded-md border-gray-200 text-gray-900 focus:ring-gray-900 cursor-pointer"
              id="draft-status-toggle"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700">公开并发布此文章</span>
              <span className="text-[10px] text-gray-400">
                勾选即将文章直接向所有读者公开；否则会存为仅自己可见的"草稿"。
              </span>
            </div>
          </label>

          {/* Form buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="rounded-full border border-gray-200 bg-white px-5 py-2 font-sans text-xs font-semibold text-gray-500 shadow-2xs hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-full bg-gray-900 px-6 py-2 font-sans text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              id="submit-save-article"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? '正在发布...' : (post ? '更新博文' : '发布文章')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
