import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)="([^"]+)"/);
  if (match) env[match[1]] = match[2];
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Clearing old data...');
  // Hack to delete all: delete where id is not null
  await supabase.from('likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Old data cleared.');

  const mdDir = path.resolve('md');
  const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const match = file.match(/^\[(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\](.+)\.md$/);
    if (!match) continue;
    
    const [_, year, month, day, hour, minute, titleRaw] = match;
    const createdAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+08:00`);
    const title = titleRaw.trim();
    
    // Local heuristic categorization
    let category = '随笔';
    if (/访谈/.test(title)) category = '访谈实录';
    else if (/整理|留白|美|因爱而美/.test(title)) category = '生活美学';
    else if (/教育|成长|有心无痕/.test(title)) category = '家庭教育';
    else if (/读/.test(title)) category = '读书笔记';
    else if (/书|字|艺/.test(title)) category = '艺术修养';
    else if (/女人|人物|董宇辉/.test(title)) category = '人物观察';
    
    let content = fs.readFileSync(path.join(mdDir, file), 'utf8');
    
    // Remove header metadata
    content = content.replace(/在小说阅读器读本章/g, '');
    content = content.replace(/去阅读/g, '');

    // Truncate at footer
    const footerPatterns = [
      '预览时标签不可点',
      '微信扫一扫',
      '关注该公众号',
      '轻点两下取消赞'
    ];
    
    let cutoffIndex = content.length;
    for (const pattern of footerPatterns) {
      const idx = content.indexOf(pattern);
      if (idx !== -1 && idx < cutoffIndex) {
        // Only consider it a footer if it's in the second half of the document to be safe
        if (idx > content.length / 3) {
          cutoffIndex = idx;
        }
      }
    }
    
    content = content.substring(0, cutoffIndex).trim();
    
    let textForSummary = content.replace(/!\[.*?\]\(.*?\)/g, ''); // strip images
    textForSummary = textForSummary.replace(/\[.*?\]\(.*?\)/g, ''); // strip links
    textForSummary = textForSummary.replace(/(http|https):\/\/[^\s]+/g, ''); // strip naked urls
    const summary = textForSummary.replace(/[#*`_\[\]()!\n]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150) + '...';
    
    const post = {
      title,
      slug: `post-${year}${month}${day}-${Math.random().toString(36).substr(2, 6)}`,
      summary,
      content,
      published: true,
      category,
      categories: [category],
      tags: ['小雨如酥', category],
      views: 0,
      likes_count: 0,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
      author_id: '1633886b-ffd4-4e72-9302-839b69ebb962',
      author_name: '小雨如酥'
    };
    
    const { error } = await supabase.from('posts').insert(post);
    if (error) {
      console.error(`Failed to insert ${title}:`, error);
    } else {
      console.log(`Successfully imported: ${title} [${category}]`);
    }
  }
  
  console.log('Import complete.');
}

main().catch(console.error);
