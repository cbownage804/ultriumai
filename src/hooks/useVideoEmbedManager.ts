import { useState, useCallback } from 'react';

export interface VideoEmbed {
  id: string;
  url: string;
  platform: 'youtube' | 'vimeo' | 'loom' | 'unknown';
  videoId: string;
  title: string;
  thumbnailUrl: string;
  embedCode: string;
  responsive: boolean;
}

function detectPlatform(url: string): { platform: VideoEmbed['platform']; videoId: string } {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { platform: 'youtube', videoId: ytMatch[1] };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { platform: 'vimeo', videoId: vimeoMatch[1] };
  const loomMatch = url.match(/loom\.com\/share\/([a-f0-9]+)/);
  if (loomMatch) return { platform: 'loom', videoId: loomMatch[1] };
  return { platform: 'unknown', videoId: '' };
}

function getThumbnail(platform: VideoEmbed['platform'], videoId: string): string {
  switch (platform) {
    case 'youtube': return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'vimeo': return `https://vumbnail.com/${videoId}.jpg`;
    case 'loom': return `https://cdn.loom.com/sessions/thumbnails/${videoId}-with-play.gif`;
    default: return '';
  }
}

function getEmbedUrl(platform: VideoEmbed['platform'], videoId: string): string {
  switch (platform) {
    case 'youtube': return `https://www.youtube.com/embed/${videoId}`;
    case 'vimeo': return `https://player.vimeo.com/video/${videoId}`;
    case 'loom': return `https://www.loom.com/embed/${videoId}`;
    default: return '';
  }
}

export function useVideoEmbedManager() {
  const [embeds, setEmbeds] = useState<VideoEmbed[]>([]);

  const addEmbed = useCallback((url: string, title?: string): VideoEmbed | null => {
    const { platform, videoId } = detectPlatform(url);
    if (platform === 'unknown') return null;
    const embedUrl = getEmbedUrl(platform, videoId);
    const embed: VideoEmbed = {
      id: crypto.randomUUID(),
      url,
      platform,
      videoId,
      title: title || `${platform} video`,
      thumbnailUrl: getThumbnail(platform, videoId),
      embedCode: `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px">\n  <iframe\n    src="${embedUrl}"\n    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"\n    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"\n    allowfullscreen\n    loading="lazy"\n    title="${title || platform + ' video'}"\n  ></iframe>\n</div>`,
      responsive: true,
    };
    setEmbeds(prev => [...prev, embed]);
    return embed;
  }, []);

  const removeEmbed = useCallback((id: string) => {
    setEmbeds(prev => prev.filter(e => e.id !== id));
  }, []);

  return { embeds, addEmbed, removeEmbed };
}
