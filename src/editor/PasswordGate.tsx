import { useState } from 'react';
import { Icon } from '../components/Icon';
import './PasswordGate.css';

/*
 * This is a doormat, not a lock.
 *
 * The site is static, so this check runs in the browser and the passphrase
 * ships inside the bundle — anyone determined can read it in a minute. It is
 * here to stop casual wandering, nothing more. The real boundary is the GitHub
 * token, which lives only in the visitor's own session and is never published.
 */
const PASSPHRASE = 'Dungeons & Dragons';

interface PasswordGateProps {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSPHRASE) {
      onUnlock();
    } else {
      setError(true);
      setValue('');
    }
  };

  return (
    <div className="gate">
      <form className="gate-panel parchment-surface" onSubmit={submit}>
        <div className="gate-seal" aria-hidden="true">
          <Icon name="book" size={30} />
        </div>

        <h2 className="gate-title">The Loremaster's Study</h2>
        <p className="gate-blurb">
          Beyond this door you can rewrite the races, the classes and the rules themselves. Speak the words.
        </p>

        <label className="field-label gate-label" htmlFor="gate-input">
          Passphrase
        </label>
        <input
          id="gate-input"
          className="input"
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="…"
        />

        {error && <p className="gate-error">Those are not the words.</p>}

        <button className="btn btn-primary gate-submit" type="submit">
          Enter
        </button>

        <p className="gate-note">
          This gate is a courtesy, not security — the site is static, so the phrase is readable in the page
          source. Nothing you do here reaches the live game until a pull request is reviewed and merged.
        </p>
      </form>
    </div>
  );
}
