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

/**
 * A stable marker for "this browser has been through the gate", derived from the
 * phrase itself so that changing the phrase invalidates every remembered unlock.
 * It is not a secret and is not meant to be one — see the note above.
 */
export const UNLOCK_TOKEN = (() => {
  let h = 0x811c9dc5;
  for (const ch of PASSPHRASE) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `v1-${h.toString(36)}`;
})();

export const UNLOCK_KEY = 'chroniclers-table.unlocked';

export function isRemembered(): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY) === UNLOCK_TOKEN;
  } catch {
    return false;
  }
}

export function forgetUnlock(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* nothing to clean up if storage is unavailable */
  }
}

interface PasswordGateProps {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [remember, setRemember] = useState(true);
  const [shown, setShown] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value !== PASSPHRASE) {
      setError(true);
      setValue('');
      return;
    }
    try {
      if (remember) localStorage.setItem(UNLOCK_KEY, UNLOCK_TOKEN);
      else localStorage.removeItem(UNLOCK_KEY);
    } catch {
      // Private browsing can refuse storage; the unlock still holds for this visit.
    }
    onUnlock();
  };

  return (
    <div className="gate">
      <form className="gate-panel parchment-surface" onSubmit={submit}>
        <div className="gate-seal" aria-hidden="true">
          <Icon name="book" size={30} />
        </div>

        <h2 className="gate-title">Behind the DM Screen</h2>
        <p className="gate-blurb">
          Beyond this door you can rewrite the races, the classes and the rules themselves. Speak the words.
        </p>

        <label className="field-label gate-label" htmlFor="gate-input">
          Passphrase
        </label>
        <div className="gate-input-wrap">
          <input
            id="gate-input"
            className="input"
            type={shown ? 'text' : 'password'}
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="…"
          />
          <button
            type="button"
            className="gate-peek"
            onClick={() => setShown(!shown)}
            aria-label={shown ? 'Hide the passphrase' : 'Show the passphrase'}
            aria-pressed={shown}
            title={shown ? 'Hide' : 'Show'}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={17} />
          </button>
        </div>

        {error && <p className="gate-error">Those are not the words.</p>}

        <label className="gate-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me on this device
        </label>

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
