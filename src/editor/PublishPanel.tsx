import { useState } from 'react';
import { saveAs } from 'file-saver';
import type { ContentPack } from '../content';
import { parseContentPack, PackError } from '../content';
import { Icon } from '../components/Icon';
import { getToken, proposeContentChange, setToken, REPO_OWNER, REPO_NAME } from './github';
import './PublishPanel.css';

interface PublishPanelProps {
  pack: ContentPack;
  isDirty: boolean;
  onLabelChange: (label: string) => void;
  onImport: (pack: ContentPack) => void;
  onReset: () => void;
}

export function PublishPanel({ pack, isDirty, onLabelChange, onImport, onReset }: PublishPanelProps) {
  const [token, setTokenState] = useState(getToken);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ prUrl: string; prNumber: number } | null>(null);

  const summary = pack.label.trim() || 'Untitled change';

  const propose = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // Validate before spending a round trip — the app refuses to boot on a bad pack.
      parseContentPack(JSON.parse(JSON.stringify(pack)));
      setToken(token);
      setResult(await proposeContentChange(token, pack, summary));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const body = JSON.stringify(pack, null, 2) + '\n';
    saveAs(new Blob([body], { type: 'application/json;charset=utf-8' }), 'pack.json');
  };

  const importFile = async (file: File) => {
    setError(null);
    try {
      onImport(parseContentPack(JSON.parse(await file.text())));
    } catch (err) {
      setError(err instanceof PackError || err instanceof Error ? err.message : 'That file could not be read.');
    }
  };

  return (
    <div className="publish parchment-surface">
      <div className="publish-grid">
        <div className="field field-full">
          <label className="field-label" htmlFor="pack-label">
            What changed?
          </label>
          <input
            id="pack-label"
            className="input"
            value={pack.label}
            placeholder="Added the Rogue's stat block"
            onChange={(e) => onLabelChange(e.target.value)}
          />
          <p className="hint">Becomes the title of the pull request and the commit message.</p>
        </div>

        <div className="field field-full">
          <label className="field-label" htmlFor="gh-token">
            GitHub token
          </label>
          <input
            id="gh-token"
            className="input"
            type="password"
            value={token}
            placeholder="github_pat_…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setTokenState(e.target.value)}
          />
          <p className="hint">
            Kept in this tab only and forgotten when you close it. Never committed, never sent anywhere but
            GitHub.
          </p>
        </div>
      </div>

      <details className="token-help">
        <summary>How to make a token</summary>
        <ol>
          <li>
            Go to <strong>GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
            tokens</strong>, and choose <strong>Generate new token</strong>.
          </li>
          <li>
            Under <strong>Repository access</strong> pick <strong>Only select repositories</strong>, and choose
            just <code>{REPO_OWNER}/{REPO_NAME}</code>.
          </li>
          <li>
            Under <strong>Repository permissions</strong> set <strong>Contents</strong> to
            <em> Read and write</em> and <strong>Pull requests</strong> to <em>Read and write</em>. Leave
            everything else alone.
          </li>
          <li>Give it a short expiry, generate it, and paste it above.</li>
        </ol>
        <p className="token-warning">
          Do not use a classic token. A classic token with <code>repo</code> scope would give this page access
          to every repository you own, rather than just this one.
        </p>
      </details>

      {error && (
        <div className="publish-error">
          <Icon name="close" size={15} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="publish-success">
          <p>
            Pull request <strong>#{result.prNumber}</strong> opened. Review the diff, then merge it to publish.
          </p>
          <a className="btn btn-primary" href={result.prUrl} target="_blank" rel="noreferrer noopener">
            Open pull request
          </a>
        </div>
      )}

      <div className="publish-actions">
        <button className="btn btn-primary publish-main" disabled={busy || !token || !isDirty} onClick={propose}>
          <Icon name="scroll" size={15} />
          {busy ? 'Opening…' : 'Propose these changes'}
        </button>

        <button className="btn" onClick={download}>
          <Icon name="save" size={15} />
          Download pack
        </button>

        <label className="btn publish-import">
          <Icon name="document" size={15} />
          Load pack
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFile(file);
              e.target.value = '';
            }}
          />
        </label>

        <button className="btn btn-ghost publish-reset" disabled={!isDirty} onClick={onReset}>
          Discard changes
        </button>
      </div>

      {!isDirty && <p className="publish-clean">Nothing has changed yet — this draft matches the live game.</p>}
    </div>
  );
}
