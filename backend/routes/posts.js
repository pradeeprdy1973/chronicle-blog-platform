const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

function enrichPost(post, userId) {
  if (!post) return null;
  const author = db.get('SELECT id, username, avatar, bio FROM users WHERE id = ?', [post.author_id]);
  const commentCount = (db.get('SELECT COUNT(*) as c FROM comments WHERE post_id = ?', [post.id]) || {c:0}).c;
  const likeCount = (db.get('SELECT COUNT(*) as c FROM likes WHERE post_id = ?', [post.id]) || {c:0}).c;
  const liked = userId ? !!db.get('SELECT 1 as x FROM likes WHERE post_id = ? AND user_id = ?', [post.id, userId]) : false;
  return { ...post, tags: JSON.parse(post.tags || '[]'), author, commentCount, likeCount, liked };
}

router.get('/', optionalAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const tag = req.query.tag;
  const search = req.query.search;
  const authorId = req.query.author;

  let where = 'WHERE published = 1';
  let params = [];
  if (authorId) { where += ' AND author_id = ?'; params.push(authorId); }
  if (tag) { where += ' AND tags LIKE ?'; params.push(`%"${tag}"%`); }
  if (search) { where += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const totalRow = db.get(`SELECT COUNT(*) as c FROM posts ${where}`, params);
  const totalCount = totalRow?.c || 0;

  const posts = db.all(`SELECT * FROM posts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ posts: posts.map(p => enrichPost(p, req.user?.id)), total: totalCount, page, totalPages: Math.ceil(totalCount / limit) });
});

router.get('/:slug', optionalAuth, (req, res) => {
  const post = db.get('SELECT * FROM posts WHERE slug = ?', [req.params.slug]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
  res.json(enrichPost({ ...post, views: (post.views || 0) + 1 }, req.user?.id));
});

router.post('/', authenticate, (req, res) => {
  const { title, content, excerpt, cover_image, tags, published } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const slug = makeSlug(title);
  const result = db.run(
    'INSERT INTO posts (title, slug, content, excerpt, cover_image, author_id, tags, published) VALUES (?,?,?,?,?,?,?,?)',
    [title, slug, content, excerpt || content.slice(0, 160) + '...', cover_image || null, req.user.id, JSON.stringify(tags || []), published !== false ? 1 : 0]
  );
  res.status(201).json(enrichPost(db.get('SELECT * FROM posts WHERE id = ?', [result.lastInsertRowid]), req.user.id));
});

router.put('/:id', authenticate, (req, res) => {
  const post = db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { title, content, excerpt, cover_image, tags, published } = req.body;
  db.run(
    'UPDATE posts SET title=?, content=?, excerpt=?, cover_image=?, tags=?, published=?, updated_at=datetime("now") WHERE id=?',
    [title||post.title, content||post.content, excerpt||post.excerpt, cover_image!==undefined?cover_image:post.cover_image,
     JSON.stringify(tags||JSON.parse(post.tags)), published!==undefined?(published?1:0):post.published, post.id]
  );
  res.json(enrichPost(db.get('SELECT * FROM posts WHERE id = ?', [post.id]), req.user.id));
});

router.delete('/:id', authenticate, (req, res) => {
  const post = db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.run('DELETE FROM posts WHERE id = ?', [post.id]);
  res.json({ message: 'Post deleted' });
});

router.post('/:id/like', authenticate, (req, res) => {
  const post = db.get('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const existing = db.get('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
  if (existing) {
    db.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
    res.json({ liked: false });
  } else {
    db.run('INSERT INTO likes (post_id, user_id) VALUES (?,?)', [post.id, req.user.id]);
    res.json({ liked: true });
  }
});

module.exports = router;
