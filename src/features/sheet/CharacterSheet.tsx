import { forwardRef } from 'react';
import type { Character, DndClass, Race, StatBlock } from '../../types/character';
import { STATS, STAT_ORDER } from '../../types/character';
import { classDisplayName } from '../../data/classes';
import { formatModifier, type DerivedStats } from '../../engine/statCalculator';
import { StatPips } from '../../components/StatPips';
import './CharacterSheet.css';

interface CharacterSheetProps {
  character: Character;
  race: Race | null;
  dndClass: DndClass | null;
  stats: StatBlock;
  derived: DerivedStats;
}

function multiplierText(value: number | null, suffix = 'x'): string {
  return value === null ? 'Unable' : `${value}${suffix}`;
}

export const CharacterSheet = forwardRef<HTMLDivElement, CharacterSheetProps>(function CharacterSheet(
  { character, race, dndClass, stats, derived },
  ref,
) {
  const accent = dndClass?.accent ?? race?.accent ?? 'var(--gold)';

  return (
    <article className="sheet parchment-surface" ref={ref} style={{ '--sheet-accent': accent } as React.CSSProperties}>
      <header className="sheet-header">
        <div className="sheet-heraldry" aria-hidden="true">
          <svg viewBox="0 0 64 74" className="crest">
            <path
              d="M32 2 L60 12 V38 C60 56 46 68 32 72 C18 68 4 56 4 38 V12 Z"
              fill="var(--sheet-accent)"
              stroke="var(--ink)"
              strokeWidth="2.5"
              opacity="0.85"
            />
            <path d="M32 2 L60 12 V38 C60 56 46 68 32 72 Z" fill="rgba(0,0,0,0.18)" />
            <path
              d="M32 16 L38 30 L52 30 L41 39 L45 53 L32 45 L19 53 L23 39 L12 30 L26 30 Z"
              fill="var(--parchment-light)"
              stroke="var(--ink)"
              strokeWidth="1.4"
              opacity="0.92"
            />
          </svg>
        </div>

        <div className="sheet-titles">
          <h2 className="sheet-name">{character.name || 'Unnamed Wanderer'}</h2>
          <p className="sheet-subtitle">
            {[race?.name, dndClass ? classDisplayName(dndClass) : null].filter(Boolean).join(' · ') ||
              'No race or class chosen'}
          </p>
          <p className="sheet-meta">
            {[
              character.age !== '' ? `Age ${character.age}` : null,
              character.gender || null,
              character.pronouns || null,
              character.alignment || null,
            ]
              .filter(Boolean)
              .join('  •  ')}
          </p>
        </div>

        <div className="sheet-hp">
          <span className="hp-label">Hit Points</span>
          <span className="hp-value">{derived.hitPoints}</span>
        </div>
      </header>

      <span className="filigree sheet-filigree">Attributes</span>

      <section className="sheet-stats">
        {STAT_ORDER.map((key) => (
          <div className="stat-row" key={key}>
            <span className="stat-abbr">{STATS[key].abbr}</span>
            <span className="stat-name">{STATS[key].label}</span>
            <StatPips value={stats[key]} accent={accent} />
            <span className="stat-total">{formatModifier(stats[key])}</span>
          </div>
        ))}
      </section>

      <span className="filigree sheet-filigree">What that means in play</span>

      <section className="sheet-derived">
        <div className="derived-item">
          <span className="derived-label">Weapons</span>
          <span className="derived-value">{derived.weaponAccess}</span>
        </div>
        <div className="derived-item">
          <span className="derived-label">Spell power</span>
          <span className="derived-value">{multiplierText(derived.magicMultiplier)}</span>
        </div>
        <div className="derived-item">
          <span className="derived-label">Movement (d4)</span>
          <span className="derived-value">
            {derived.movementMultiplier}x — {derived.movementRange.min}–{derived.movementRange.max}
          </span>
        </div>
        <div className="derived-item">
          <span className="derived-label">Bow range</span>
          <span className="derived-value">
            {derived.archerBowMultiplier !== null
              ? `${derived.archerBowMultiplier}x (Archer)`
              : multiplierText(derived.bowMultiplier)}
          </span>
        </div>
        <div className="derived-item">
          <span className="derived-label">Social rolls</span>
          <span className="derived-value">{derived.charismaMultiplier}x</span>
        </div>
        <div className="derived-item">
          <span className="derived-label">Stealth (likely / unlikely)</span>
          <span className="derived-value">
            {derived.stealthLikely}+ / {derived.stealthUnlikely}+
          </span>
        </div>
        {derived.bareFistMultiplier !== null && (
          <div className="derived-item">
            <span className="derived-label">Bare fists</span>
            <span className="derived-value">{derived.bareFistMultiplier}x damage</span>
          </div>
        )}
      </section>

      <section className="sheet-dodge">
        <span className="dodge-title">Dodging — roll a d20</span>
        <div className="dodge-grid">
          {derived.dodgeTable.map((row) => (
            <div className="dodge-cell" key={row.comparison}>
              <span className="dodge-comparison">{row.comparison}</span>
              <span className="dodge-target">{row.target}+</span>
            </div>
          ))}
        </div>
      </section>

      {dndClass && (
        <>
          <span className="filigree sheet-filigree">Abilities</span>
          <section className="sheet-abilities">
            {dndClass.abilities.map((ability) => (
              <div className="sheet-ability" key={ability.name}>
                <h4>{ability.name}</h4>
                <p>{ability.description}</p>
              </div>
            ))}
          </section>
        </>
      )}

      {character.backstory.trim() && (
        <>
          <span className="filigree sheet-filigree">Backstory</span>
          <section className="sheet-backstory">
            <p className="illuminated">{character.backstory}</p>
          </section>
        </>
      )}

      <footer className="sheet-footer">
        <span>Scribed with the Chronicler's Table</span>
        <span>{new Date(character.updatedAt).toLocaleDateString()}</span>
      </footer>
    </article>
  );
});
