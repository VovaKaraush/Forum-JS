import './style.css';

function Header() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="logo">3Chan</div>

        <div className="search">
          <input type="text" placeholder="Rechercher dans le forum" />
        </div>

        <div className="auth">
          <a href="#" className="btn btn-outline">Connexion</a>
          <a href="#" className="btn btn-primary">Inscription</a>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <section className="welcome-card">
        <div className="banner"></div>
        <div className="welcome-content">
          <h2>Bienvenue sur 3Chan</h2>
          <p>Connecte-toi pour créer des posts, commenter et voter.</p>
          <a href="#" className="btn btn-primary">Créer un post</a>
        </div>
      </section>

      <section className="card">
        <h3>NAVIGATION</h3>
        <nav className="nav-list">
          <a href="#" className="active">Accueil</a>
          <a href="#">Populaire</a>
          <a href="#">Nouveautés</a>
          <a href="#">Mes posts</a>
          <a href="#">Posts likés</a>
        </nav>
      </section>
    </aside>
  );
}

function Content() {
  return (
    <section className="content">
      <section className="create-card">
        <div className="fake-input">Créer une publication</div>
        <button>Image</button>
        <button>Lien</button>
      </section>

      <section className="tabs">
        <a href="#" className="active">Hot</a>
        <a href="#">New</a>
        <a href="#">Top</a>
        <a href="#">Commentés</a>
      </section>

      <section className="forum-card">
        <div className="forum-header">À propos du forum</div>
        <div className="forum-body">
          <h1>3Chan</h1>
          <p>Un forum communautaire inspiré de Reddit pour discuter, poster et commenter.</p>
          <div className="stats">
            <div>
              <strong>1.2k</strong>
              <span>Membres</span>
            </div>
            <div>
              <strong>48</strong>
              <span>En ligne</span>
            </div>
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
    </section>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main className="layout">
        <Sidebar />
        <Content />
      </main>
    </>
  );
}
