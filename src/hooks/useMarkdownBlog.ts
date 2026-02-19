import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
  author?: string;
}

export function useMarkdownBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  const generateBlogSystem = useCallback((postCount = 3): ProjectFile[] => {
    const samplePosts: BlogPost[] = Array.from({ length: postCount }, (_, i) => ({
      slug: `post-${i + 1}`,
      title: [`Getting Started with React`, `Building Modern UIs`, `Deploying to Production`][i] || `Blog Post ${i + 1}`,
      date: new Date(Date.now() - i * 86400000 * 7).toISOString().split('T')[0],
      tags: [['react', 'tutorial'], ['ui', 'design'], ['devops', 'deploy']][i] || ['general'],
      excerpt: `This is a sample blog post about modern web development techniques.`,
      content: `# ${[`Getting Started with React`, `Building Modern UIs`, `Deploying to Production`][i] || `Blog Post ${i + 1}`}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\n## Key Points\n\n- Point one about the topic\n- Point two with more detail\n- Point three conclusion\n\n> A wise quote about development.\n\nMore content follows here with detailed explanations and code examples.`,
      author: 'Admin',
    }));
    setPosts(samplePosts);

    const files: ProjectFile[] = [];

    // Blog index page
    files.push({
      path: 'pages/blog/index.html',
      content: `<!DOCTYPE html>\n<html><head><title>Blog</title><meta name="description" content="Latest blog posts"></head>\n<body>\n<main>\n<h1>Blog</h1>\n<div class="posts">\n${samplePosts.map(p => `  <article>\n    <h2><a href="/blog/${p.slug}">${p.title}</a></h2>\n    <time>${p.date}</time>\n    <p>${p.excerpt}</p>\n    <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</div>\n  </article>`).join('\n')}\n</div>\n</main>\n</body></html>`,
      language: 'html',
    });

    // Individual posts
    for (const post of samplePosts) {
      files.push({
        path: `pages/blog/${post.slug}.md`,
        content: `---\ntitle: "${post.title}"\ndate: "${post.date}"\ntags: [${post.tags.map(t => `"${t}"`).join(', ')}]\nauthor: "${post.author}"\nexcerpt: "${post.excerpt}"\n---\n\n${post.content}`,
        language: 'markdown',
      });
    }

    // RSS feed
    files.push({
      path: 'pages/blog/rss.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>Blog</title>\n<description>Latest posts</description>\n${samplePosts.map(p => `<item>\n  <title>${p.title}</title>\n  <pubDate>${p.date}</pubDate>\n  <description>${p.excerpt}</description>\n</item>`).join('\n')}\n</channel>\n</rss>`,
      language: 'xml',
    });

    return files;
  }, []);

  const addPost = useCallback((post: BlogPost) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const removePost = useCallback((slug: string) => {
    setPosts(prev => prev.filter(p => p.slug !== slug));
  }, []);

  return { posts, generateBlogSystem, addPost, removePost };
}
