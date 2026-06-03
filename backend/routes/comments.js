const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../models/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

function enrichComment(c) {
  const author = db.get('SELECT id, username, avatar FROM users WHERE id = ?', [c.author_id]);
  const replies = db.all('SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at ASC', [c.id]).map(enrichComment);
  return { ...c, author, replies };
}

router.get('/', optionalAuth, (req, res) => {
  const post = db.get('SELECT id FROM posts WHERE slug = ?', [req.params.slug]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const comments = db.all('SELECT * FROM comments WHERE post_id = ? AND parent_id IS NULL ORDER BY created_at ASC', [post.id]);
  res.json(comments.map(enrichComment));
});

router.post('/', authenticate, (req, res) => {
  const { content, parent_id } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment content required' });
  const post = db.get('SELECT id FROM posts WHERE slug = ?', [req.params.slug]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const result = db.run(
    'INSERT INTO comments (content, post_id, author_id, parent_id) VALUES (?,?,?,?)',
    [content.trim(), post.id, req.user.id, parent_id || null]
  );
  res.status(201).json(enrichComment(db.get('SELECT * FROM comments WHERE id = ?', [result.lastInsertRowid])));
});

router.put('/:commentId', authenticate, (req, res) => {
  const comment = db.get('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  db.run('UPDATE comments SET content = ?, updated_at = datetime("now") WHERE id = ?', [content.trim(), comment.id]);
  res.json(enrichComment(db.get('SELECT * FROM comments WHERE id = ?', [comment.id])));
});

router.delete('/:commentId', authenticate, (req, res) => {
  const comment = db.get('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.author_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.run('DELETE FROM comments WHERE id = ?', [comment.id]);
  res.json({ message: 'Comment deleted' });
});

module.exports = router;
