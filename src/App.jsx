import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import './style.css';

// ─── UTILS ────────────────────────────────────────────────────────────────────

function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── HEADER ───────────────────────────────────────────────────────────────────

function Header({ user, onNav, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => onNav('home')}>3Chan</div>
        <div className="search">
          <input type="text" placeholder="Rechercher dans le forum" />
        </div>
        <div className="auth">
          {user ? (
            <>
              <span style={{ fontWeight: 700, fontSize: 15 }}>👤 {user.name}</span>
              <button className="btn btn-outline" onClick={onLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => onNav('login', { tab: 'login' })}>Connexion</button>
              <button className="btn btn-primary" onClick={() => onNav('login', { tab: 'register' })}>Inscription</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ user, filter, onFilter, categories, activeCat, onCat, onNav, postCount }) {
  return (
    <aside className="sidebar">
      <section className="welcome-card">
        <div className="banner"></div>
        <div className="welcome-content">
          {user ? (
            <>
              <h2>Bonjour, {user.name} 👋</h2>
              <p>Prêt à partager quelque chose ?</p>
              <button className="btn btn-primary" onClick={() => onNav('new-post')}>Créer un post</button>
            </>
          ) : (
            <>
              <h2>Bienvenue sur 3Chan</h2>
              <p>Connecte-toi pour créer des posts, commenter et voter.</p>
              <button className="btn btn-primary" onClick={() => onNav('login', { tab: 'register' })}>Créer un compte</button>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h3>NAVIGATION</h3>
        <nav className="nav-list">
          <a href="#" className={!filter && !activeCat ? 'active' : ''} onClick={e => { e.preventDefault(); onFilter(null); onCat(null); }}>🏠 Accueil</a>
          {user && <a href="#" className={filter === 'mine' ? 'active' : ''} onClick={e => { e.preventDefault(); onFilter('mine'); onCat(null); }}>📝 Mes posts</a>}
          {user && <a href="#" className={filter === 'liked' ? 'active' : ''} onClick={e => { e.preventDefault(); onFilter('liked'); onCat(null); }}>❤️ Posts likés</a>}
        </nav>
      </section>

      {categories.length > 0 && (
        <section className="card">
          <h3>CATÉGORIES</h3>
          <nav className="nav-list">
            {categories.map(c => (
              <a key={c.id} href="#" className={activeCat === c.id ? 'active' : ''} onClick={e => { e.preventDefault(); onCat(activeCat === c.id ? null : c.id); onFilter(null); }}>
                # {c.name}
              </a>
            ))}
          </nav>
        </section>
      )}

      <section className="card">
        <h3>À PROPOS</h3>
        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
          <p>3Chan — un forum communautaire pour discuter, poster et commenter.</p>
          <div className="stats" style={{ marginTop: 12 }}>
            <div><strong>{postCount}</strong><span>Posts</span></div>
            <div><strong>{categories.length}</strong><span>Catégories</span></div>
          </div>
        </div>
      </section>

      <section className="card rules">
        <h3>RÈGLES</h3>
        <ol>
          <li>Respecter les autres utilisateurs</li>
          <li>Pas de spam</li>
          <li>Utiliser les bonnes catégories</li>
          <li>Rester dans le sujet</li>
        </ol>
      </section>
    </aside>
  );
}

// ─── VOTE BUTTONS ─────────────────────────────────────────────────────────────

function VoteButtons({ likes, dislikes, myVote, onVote, targetId, targetType }) {
  const [l, setL] = useState(likes || 0);
  const [d, setD] = useState(dislikes || 0);
  const [mv, setMv] = useState(myVote || null);

  useEffect(() => { setL(likes || 0); setD(dislikes || 0); setMv(myVote || null); }, [likes, dislikes, myVote]);

  async function vote(type) {
    if (!onVote) return;
    const res = await onVote(targetId, targetType, type);
    if (res && res.success) {
      setL(res.likes);
      setD(res.dislikes);
      setMv(res.action === 'removed' ? null : type);
    }
  }

  return (
    <div className="vote-inline">
      <button className={`vote-btn-inline ${mv === 'like' ? 'active-like' : ''}`} onClick={() => vote('like')}>▲ {l}</button>
      <button className={`vote-btn-inline ${mv === 'dislike' ? 'active-dislike' : ''}`} onClick={() => vote('dislike')}>▼ {d}</button>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────

function PostCard({ post, user, onNav, onVote }) {
  return (
    <article className="post-card">
      <div className="vote">
        <button className={`vote-up ${post.myVote === 'like' ? 'voted' : ''}`} onClick={() => onVote && onVote(post.id, 'post', 'like')}>▲</button>
        <span>{(post.likes || 0) - (post.dislikes || 0)}</span>
        <button className={`vote-down ${post.myVote === 'dislike' ? 'voted' : ''}`} onClick={() => onVote && onVote(post.id, 'post', 'dislike')}>▼</button>
      </div>
      <div className="post-content">
        <div className="meta">
          par <strong>{post.author}</strong> · {fmtDate(post.created_at)}
        </div>
        <h2 style={{ cursor: 'pointer' }} onClick={() => onNav('post', { id: post.id })}>{post.title}</h2>
        <p style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {post.body}
        </p>
        {post.categories && post.categories.length > 0 && (
          <div className="tags">
            {post.categories.map(c => <span key={c}>{c}</span>)}
          </div>
        )}
        <div className="actions">
          <span style={{ cursor: 'pointer' }} onClick={() => onNav('post', { id: post.id })}>💬 {post.comment_count || 0} commentaires</span>
          <span>👍 {post.likes || 0}</span>
          <span>👎 {post.dislikes || 0}</span>
        </div>
      </div>
    </article>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ user, onNav, filter, activeCat }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = {};
    if (filter === 'mine') params.mine = true;
    if (filter === 'liked') params.liked = true;
    if (activeCat) params.category = activeCat;
    const d = await api.getPosts(params);
    setPosts(d.posts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter, activeCat]);

  async function handleVote(postId, targetType, type) {
    if (!user) { onNav('login', { tab: 'login' }); return; }
    const res = await api.vote(postId, targetType, type);
    if (res.success) {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const newMyVote = res.action === 'removed' ? null : type;
        return { ...p, likes: res.likes, dislikes: res.dislikes, myVote: newMyVote };
      }));
    }
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Chargement...</div>;

  return (
    <div>
      <section className="create-card" style={{ cursor: 'pointer' }} onClick={() => user ? onNav('new-post') : onNav('login', { tab: 'login' })}>
        <div className="fake-input">Créer une publication...</div>
        <button onClick={e => { e.stopPropagation(); user ? onNav('new-post') : onNav('login', { tab: 'login' }); }}>📷 Image</button>
        <button onClick={e => { e.stopPropagation(); user ? onNav('new-post') : onNav('login', { tab: 'login' }); }}>🔗 Lien</button>
      </section>

      <section className="tabs">
        <a href="#" className="active">Récents</a>
      </section>

      {posts.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #cfd6dc', borderRadius: 6, padding: 48, textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <p>Aucun post trouvé</p>
          {user && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNav('new-post')}>Créer le premier post</button>}
        </div>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} user={user} onNav={onNav} onVote={handleVote} />)
      )}
    </div>
  );
}

// ─── POST PAGE ────────────────────────────────────────────────────────────────

function PostPage({ postId, user, onNav }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentErr, setCommentErr] = useState('');
  const [editPost, setEditPost] = useState(null);
  const [editComment, setEditComment] = useState(null);
  const [postVote, setPostVote] = useState({ likes: 0, dislikes: 0, myVote: null });

  async function load() {
    setLoading(true);
    const d = await api.getPost(postId);
    if (d.success) {
      setPost(d.post);
      setComments(d.comments || []);
      setPostVote({ likes: d.post.likes || 0, dislikes: d.post.dislikes || 0, myVote: d.post.myVote });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [postId]);

  async function handlePostVote(type) {
    if (!user) { onNav('login', { tab: 'login' }); return; }
    const res = await api.vote(postId, 'post', type);
    if (res.success) setPostVote({ likes: res.likes, dislikes: res.dislikes, myVote: res.action === 'removed' ? null : type });
  }

  async function handleCommentVote(commentId, type) {
    if (!user) { onNav('login', { tab: 'login' }); return; }
    const res = await api.vote(commentId, 'comment', type);
    if (res.success) {
      setComments(prev => prev.map(c => c.id === commentId
        ? { ...c, likes: res.likes, dislikes: res.dislikes, myVote: res.action === 'removed' ? null : type }
        : c
      ));
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    setCommentErr('');
    if (!commentText.trim()) { setCommentErr('Commentaire vide'); return; }
    const res = await api.createComment(postId, commentText.trim());
    if (res.success) { setCommentText(''); load(); }
    else setCommentErr(res.message);
  }

  async function handleDeletePost() {
    if (!confirm('Supprimer ce post ?')) return;
    const res = await api.deletePost(postId);
    if (res.success) onNav('home');
  }

  async function handleEditPost(e) {
    e.preventDefault();
    const res = await api.updatePost(postId, editPost.title, editPost.body);
    if (res.success) { setEditPost(null); load(); }
  }

  async function handleDeleteComment(id) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    const res = await api.deleteComment(id);
    if (res.success) load();
  }

  async function handleEditComment(e) {
    e.preventDefault();
    const res = await api.updateComment(editComment.id, editComment.content);
    if (res.success) { setEditComment(null); load(); }
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Chargement...</div>;
  if (!post) return <div style={{ padding: 32, textAlign: 'center' }}>Post introuvable. <button className="btn btn-outline" onClick={() => onNav('home')}>Retour</button></div>;

  const isPostOwner = user && user.id === post.user_id;

  return (
    <div>
      <button className="btn btn-outline" style={{ marginBottom: 16, fontSize: 13 }} onClick={() => onNav('home')}>← Retour</button>

      {/* POST */}
      <article className="post-card" style={{ marginBottom: 0, borderRadius: '6px 6px 0 0' }}>
        <div className="vote">
          <button className={`vote-up ${postVote.myVote === 'like' ? 'voted' : ''}`} onClick={() => handlePostVote('like')}>▲</button>
          <span>{postVote.likes - postVote.dislikes}</span>
          <button className={`vote-down ${postVote.myVote === 'dislike' ? 'voted' : ''}`} onClick={() => handlePostVote('dislike')}>▼</button>
        </div>
        <div className="post-content">
          <div className="meta">par <strong>{post.author}</strong> · {fmtDate(post.created_at)}</div>
          {editPost ? (
            <form onSubmit={handleEditPost} style={{ marginTop: 8 }}>
              <input className="edit-input" value={editPost.title} onChange={e => setEditPost({ ...editPost, title: e.target.value })} required />
              <textarea className="edit-textarea" value={editPost.body} onChange={e => setEditPost({ ...editPost, body: e.target.value })} rows={6} required />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Enregistrer</button>
                <button type="button" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setEditPost(null)}>Annuler</button>
              </div>
            </form>
          ) : (
            <>
              <h2>{post.title}</h2>
              {post.image_url && <img src={post.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, margin: '12px 0' }} />}
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.body}</p>
              {post.categories && post.categories.length > 0 && (
                <div className="tags">{post.categories.map(c => <span key={c}>{c}</span>)}</div>
              )}
              <div className="actions">
                <span>👍 {postVote.likes}</span>
                <span>👎 {postVote.dislikes}</span>
                {isPostOwner && (
                  <>
                    <button className="action-btn" onClick={() => setEditPost({ title: post.title, body: post.body })}>✏️ Modifier</button>
                    <button className="action-btn danger" onClick={handleDeletePost}>🗑️ Supprimer</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </article>

      {/* COMMENTS */}
      <div className="comments-wrapper">
        <div className="comments-header">💬 {comments.length} commentaire{comments.length !== 1 ? 's' : ''}</div>

        {user && (
          <form className="comment-form" onSubmit={submitComment}>
            <textarea
              placeholder="Ajouter un commentaire..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={3}
            />
            {commentErr && <div className="form-err">{commentErr}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>Commenter</button>
            </div>
          </form>
        )}
        {!user && (
          <div className="comment-login-prompt">
            <button className="btn btn-outline" onClick={() => onNav('login', { tab: 'login' })}>Connectez-vous</button> pour commenter
          </div>
        )}

        {comments.length === 0 && (
          <div style={{ padding: '24px 20px', color: '#6b7280', fontSize: 14 }}>Aucun commentaire. Soyez le premier !</div>
        )}

        {comments.map(c => {
          const isCOwner = user && user.id === c.user_id;
          return (
            <div key={c.id} className="comment-item">
              <div className="comment-meta">
                <strong>{c.author}</strong> · {fmtDate(c.created_at)}
                {c.updated_at !== c.created_at && <span style={{ fontSize: 11, color: '#9ca3af' }}> (modifié)</span>}
              </div>
              {editComment && editComment.id === c.id ? (
                <form onSubmit={handleEditComment}>
                  <textarea className="edit-textarea" style={{ minHeight: 60 }} value={editComment.content} onChange={e => setEditComment({ ...editComment, content: e.target.value })} required />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }}>OK</button>
                    <button type="button" className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setEditComment(null)}>Annuler</button>
                  </div>
                </form>
              ) : (
                <div className="comment-body">{c.content}</div>
              )}
              <div className="comment-actions">
                <button className={`vote-btn-inline ${c.myVote === 'like' ? 'active-like' : ''}`} onClick={() => handleCommentVote(c.id, 'like')}>▲ {c.likes || 0}</button>
                <button className={`vote-btn-inline ${c.myVote === 'dislike' ? 'active-dislike' : ''}`} onClick={() => handleCommentVote(c.id, 'dislike')}>▼ {c.dislikes || 0}</button>
                {isCOwner && !editComment && (
                  <>
                    <button className="action-btn" onClick={() => setEditComment({ id: c.id, content: c.content })}>✏️</button>
                    <button className="action-btn danger" onClick={() => handleDeleteComment(c.id)}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage({ onNav, onLogin, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    const res = await api.login(loginForm.username, loginForm.password);
    setLoading(false);
    if (res.success) onLogin(res.user);
    else setErr(res.message);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    const res = await api.register(regForm.username, regForm.email, regForm.password, regForm.confirm);
    setLoading(false);
    if (res.success) onLogin(res.user);
    else setErr(res.message);
  }

  return (
    <div style={{ maxWidth: 460, margin: '40px auto' }}>
      <div style={{ background: '#fff', border: '1px solid #cfd6dc', borderRadius: 6, overflow: 'hidden' }}>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>Connexion</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErr(''); }}>Inscription</button>
        </div>

        <div style={{ padding: 28 }}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Pseudo</label>
                <input type="text" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} required placeholder="Votre pseudo" />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required placeholder="Votre mot de passe" />
              </div>
              {err && <div className="form-err">{err}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6b7280' }}>
                Pas encore de compte ? <button type="button" className="link-btn" onClick={() => { setTab('register'); setErr(''); }}>S'inscrire</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Pseudo</label>
                <input type="text" value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} required placeholder="Choisissez un pseudo" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required placeholder="votre@email.com" />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} required placeholder="Au moins 6 caractères" />
              </div>
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input type="password" value={regForm.confirm} onChange={e => setRegForm({ ...regForm, confirm: e.target.value })} required placeholder="Répétez le mot de passe" />
              </div>
              {err && <div className="form-err">{err}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Inscription...' : 'Créer un compte'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#6b7280' }}>
                Déjà un compte ? <button type="button" className="link-btn" onClick={() => { setTab('login'); setErr(''); }}>Se connecter</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW POST PAGE ────────────────────────────────────────────────────────────

function NewPostPage({ user, onNav, categories }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);
  const [image, setImage] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) { onNav('login', { tab: 'login' }); return null; }

  function toggleCat(id) {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (selectedCats.length === 0) { setErr('Sélectionnez au moins une catégorie'); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('title', title);
    fd.append('body', body);
    selectedCats.forEach(c => fd.append('categories', c));
    if (image) fd.append('image', image);
    const res = await api.createPost(fd);
    setLoading(false);
    if (res.success) onNav('post', { id: res.postId });
    else setErr(res.message);
  }

  return (
    <div>
      <button className="btn btn-outline" style={{ marginBottom: 16, fontSize: 13 }} onClick={() => onNav('home')}>← Retour</button>
      <div style={{ background: '#fff', border: '1px solid #cfd6dc', borderRadius: 6, padding: 28 }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>✏️ Créer un post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titre *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titre de votre post" />
          </div>

          <div className="form-group">
            <label>Catégories * (au moins une)</label>
            <div className="cat-grid">
              {categories.map(c => (
                <label key={c.id} className={`cat-chip ${selectedCats.includes(c.id) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={selectedCats.includes(c.id)} onChange={() => toggleCat(c.id)} style={{ display: 'none' }} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Contenu *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} required placeholder="Rédigez votre post..." rows={8} />
          </div>

          <div className="form-group">
            <label>Image (optionnel — JPEG/PNG/GIF, max 20 Mo)</label>
            <input type="file" accept=".jpg,.jpeg,.png,.gif" onChange={e => setImage(e.target.files[0])} style={{ fontSize: 14 }} />
          </div>

          {err && <div className="form-err">{err}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={() => onNav('home')}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Publication...' : 'Publier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [page, setPage] = useState('home');
  const [pageData, setPageData] = useState({});
  const [filter, setFilter] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [categories, setCategories] = useState([]);
  const [postCount, setPostCount] = useState(0);

  // Load session on mount
  useEffect(() => {
    api.getMe().then(d => setUser(d.user || null)).catch(() => setUser(null));
    api.getCategories().then(d => setCategories(d.categories || []));
    api.getPosts().then(d => setPostCount((d.posts || []).length));
  }, []);

  function navigate(p, data = {}) {
    setPage(p);
    setPageData(data);
    window.scrollTo(0, 0);
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    navigate('home');
  }

  function handleLogin(u) {
    setUser(u);
    navigate('home');
  }

  if (user === undefined) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>Chargement...</div>;
  }

  function renderPage() {
    switch (page) {
      case 'login':
        return <LoginPage onNav={navigate} onLogin={handleLogin} initialTab={pageData.tab || 'login'} />;
      case 'post':
        return <PostPage postId={pageData.id} user={user} onNav={navigate} />;
      case 'new-post':
        return <NewPostPage user={user} onNav={navigate} categories={categories} />;
      default:
        return <HomePage user={user} onNav={navigate} filter={filter} activeCat={activeCat} />;
    }
  }

  const showSidebar = page === 'home' || page === 'post';

  return (
    <>
      <Header user={user} onNav={navigate} onLogout={handleLogout} />
      <main className="layout" style={!showSidebar ? { gridTemplateColumns: '1fr', maxWidth: 700 } : {}}>
        {showSidebar && (
          <Sidebar
            user={user}
            filter={filter}
            onFilter={f => { setFilter(f); navigate('home'); }}
            categories={categories}
            activeCat={activeCat}
            onCat={c => { setActiveCat(c); navigate('home'); }}
            onNav={navigate}
            postCount={postCount}
          />
        )}
        <section className="content">
          {renderPage()}
        </section>
      </main>
    </>
  );
}
