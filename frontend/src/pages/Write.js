import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Write.css';

export default function Write() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', cover_image: '', tags: '', published: true });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isEdit) {
      api.get(`/posts/${id}`)
        .then(res => {
          const p = res.data;
          if (p.author?.id !== user.id) { navigate('/'); return; }
          setForm({ title: p.title, content: p.content, excerpt: p.excerpt || '', cover_image: p.cover_image || '', tags: (p.tags || []).join(', '), published: !!p.published });
        })
        .catch(() => navigate('/'));
    }
  }, [id, user, navigate, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content are required'); return; }
    setLoading(true);
    const payload = {
      title: form.title,
      content: form.content,
      excerpt: form.excerpt || form.content.slice(0, 160),
      cover_image: form.cover_image || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      published: form.published,
    };
    try {
      let res;
      if (isEdit) res = await api.put(`/posts/${id}`, payload);
      else res = await api.post('/posts', payload);
      toast.success(isEdit ? 'Post updated!' : 'Post published!');
      navigate(`/post/${res.data.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save post');
    } finally { setLoading(false); }
  };

  return (
    <div className="write-page">
      <div className="container-narrow">
        <div className="write-header">
          <h1>{isEdit ? 'Edit story' : 'New story'}</h1>
          <div className="write-actions">
            <button type="button" className="btn-ghost" onClick={() => setPreview(p => !p)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button form="write-form" type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (isEdit ? 'Update' : 'Publish')}
            </button>
          </div>
        </div>

        {preview ? (
          <div className="write-preview card">
            <h1 className="preview-title">{form.title || 'Untitled'}</h1>
            {form.cover_image && <img src={form.cover_image} alt="" className="preview-cover" />}
            <div className="preview-content" style={{ whiteSpace: 'pre-wrap' }}>{form.content}</div>
          </div>
        ) : (
          <form id="write-form" onSubmit={handleSubmit} className="write-form">
            <div className="form-group">
              <input
                className="title-input"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Story title…"
                required
              />
            </div>

            <div className="form-group">
              <label>Cover Image URL <span className="optional">(optional)</span></label>
              <input value={form.cover_image} onChange={e => setForm({...form, cover_image: e.target.value})} placeholder="https://images.unsplash.com/…" />
              {form.cover_image && <img src={form.cover_image} alt="" className="cover-preview" onError={e => e.target.style.display='none'} />}
            </div>

            <div className="form-group">
              <label>Content</label>
              <textarea
                className="content-textarea"
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                placeholder="Tell your story…"
                rows={20}
                required
              />
            </div>

            <div className="form-group">
              <label>Excerpt <span className="optional">(optional — auto-generated if blank)</span></label>
              <textarea value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} placeholder="A short summary for the feed…" rows={2} />
            </div>

            <div className="form-group">
              <label>Tags <span className="optional">(comma-separated)</span></label>
              <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="technology, writing, design" />
            </div>

            <div className="form-group publish-toggle">
              <label className="toggle-label">
                <input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} />
                <span>Publish immediately</span>
              </label>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
