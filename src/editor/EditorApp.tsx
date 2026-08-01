import { TextureDefs } from '../theme/TextureDefs';

export function EditorApp() {
  return (
    <div className="app wood-surface">
      <TextureDefs />
      <header className="app-header">
        <div className="brand">
          <h1 className="display-title brand-title">Loremaster</h1>
          <p className="brand-sub">Content editor for The Chronicler's Table</p>
        </div>
      </header>
    </div>
  );
}
