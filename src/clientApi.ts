export interface BlogUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'admin' | 'reader';
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  categories?: string[];
  tags: string[];
  createdAt: any;
  updatedAt: any;
  published: boolean;
  views: number;
  likesCount: number;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

export interface Reply {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  createdAt: any;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  approved: boolean;
  replies?: Reply[];
  createdAt: any;
}

// Client-side session management
export function getSavedUser(): BlogUser | null {
  const data = localStorage.getItem('blog_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveUser(user: BlogUser) {
  localStorage.setItem('blog_user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('blog_user');
}

// Helper for making standard API requests
async function apiRequest(path: string, options: RequestInit = {}) {
  const user = getSavedUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as Record<string, string>;

  if (user) {
    headers['X-User-Email'] = user.email;
    headers['X-User-Id'] = user.uid;
    headers['X-User-Name'] = encodeURIComponent(user.displayName);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `API error: ${response.status}`);
  }

  return response.json();
}

// Auth API calls
export async function registerUser(email: string, pass: string, displayName: string): Promise<BlogUser> {
  const result = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, pass, displayName }),
  });
  saveUser(result.user);
  return result.user;
}

export async function loginUser(email: string, pass: string): Promise<BlogUser> {
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, pass }),
  });
  saveUser(result.user);
  return result.user;
}

// Posts API calls
export async function fetchPosts(): Promise<Post[]> {
  return apiRequest('/api/posts');
}

export async function createPost(postData: Partial<Post>): Promise<Post> {
  return apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
}

export async function updatePost(id: string, postData: Partial<Post>): Promise<Post> {
  return apiRequest(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
}

export async function deletePost(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/posts/${id}`, {
    method: 'DELETE',
  });
}

// Comments API calls
export async function fetchComments(postId: string): Promise<Comment[]> {
  return apiRequest(`/api/posts/${postId}/comments`);
}

export async function addComment(postId: string, commentData: Partial<Comment>): Promise<Comment> {
  return apiRequest(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
}

export async function approveComment(postId: string, commentId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/posts/${postId}/comments/${commentId}/approve`, {
    method: 'POST',
  });
}

export async function replyComment(postId: string, commentId: string, content: string): Promise<Comment> {
  return apiRequest(`/api/posts/${postId}/comments/${commentId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(postId: string, commentId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// Likes API calls
export async function toggleLike(postId: string): Promise<{ likesCount: number; hasLiked: boolean }> {
  return apiRequest(`/api/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function checkHasLiked(postId: string): Promise<{ hasLiked: boolean }> {
  return apiRequest(`/api/posts/${postId}/like/check`);
}

// Seed samples
export async function seedServerSamples(): Promise<{ success: boolean }> {
  return apiRequest('/api/posts/seed', {
    method: 'POST',
  });
}

// Gemini Content Generator Proxy
export async function generateAIPost(theme: string): Promise<any> {
  return apiRequest('/api/generate-post', {
    method: 'POST',
    body: JSON.stringify({ prompt: theme }),
  });
}
