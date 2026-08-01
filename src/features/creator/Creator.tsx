import { useMemo, useRef, useState } from 'react';
import type { Character } from '../../types/character';
import { RACE_BY_ID } from '../../data/races';
import { CLASS_BY_ID } from '../../data/classes';
import { calculateStats, deriveStats } from '../../engine/statCalculator';
import { CharacterSheet } from '../sheet/CharacterSheet';
import { RacePicker } from './RacePicker';
import { ClassPicker } from './ClassPicker';
import { DetailsForm } from './DetailsForm';
import { ExportBar } from './ExportBar';
import { Icon } from '../../components/Icon';
import './Creator.css';

interface CreatorProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

type Step = 'race' | 'class' | 'details' | 'sheet';

const STEPS: { id: Step; label: string; numeral: string }[] = [
  { id: 'race', label: 'Race', numeral: 'I' },
  { id: 'class', label: 'Class', numeral: 'II' },
  { id: 'details', label: 'Details', numeral: 'III' },
  { id: 'sheet', label: 'Sheet', numeral: 'IV' },
];

export function Creator({ character, onChange }: CreatorProps) {
  const [step, setStep] = useState<Step>('race');
  const sheetRef = useRef<HTMLDivElement>(null);

  const race = character.raceId ? (RACE_BY_ID.get(character.raceId) ?? null) : null;
  const dndClass = character.classId ? (CLASS_BY_ID.get(character.classId) ?? null) : null;

  // A pack update can remove a race or class that existing characters still point at.
  // Say so plainly rather than silently showing them as "not yet chosen".
  const missing = [
    character.raceId && !race ? `race "${character.raceId}"` : null,
    character.classId && !dndClass ? `class "${character.classId}"` : null,
  ].filter(Boolean);

  const stats = useMemo(
    () => calculateStats(race, dndClass, character.statMode, character),
    [race, dndClass, character],
  );
  const derived = useMemo(() => deriveStats(stats, dndClass), [stats, dndClass]);

  const handleRaceSelect = (raceId: string) => {
    const nextRace = RACE_BY_ID.get(raceId);
    // Age defaults follow the race until the player types their own.
    const shouldSeedAge = character.age === '' || character.age === race?.defaultAge;
    onChange({
      raceId,
      ...(shouldSeedAge && nextRace ? { age: nextRace.defaultAge } : {}),
    });
  };

  const oath = dndClass?.oathState;
  const isComplete = Boolean(race && dndClass);

  return (
    <div className="creator">
      <ol className="steps">
        {STEPS.map((s) => {
          const done =
            (s.id === 'race' && race) ||
            (s.id === 'class' && dndClass) ||
            (s.id === 'details' && character.name.trim());
          return (
            <li key={s.id}>
              <button
                className={`step${step === s.id ? ' step-active' : ''}${done ? ' step-done' : ''}`}
                onClick={() => setStep(s.id)}
              >
                <span className="step-numeral">{s.numeral}</span>
                <span className="step-label">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {missing.length > 0 && (
        <div className="missing-content">
          <h4 className="missing-title">Missing from the current rules</h4>
          <p className="missing-body">
            This character uses {missing.join(' and ')}, which no longer exists. Pick a replacement below — the
            rest of the character is untouched.
          </p>
        </div>
      )}

      <div className="creator-body">
        {step === 'race' && <RacePicker selectedId={character.raceId} onSelect={handleRaceSelect} />}

        {step === 'class' && (
          <>
            <ClassPicker selectedId={character.classId} onSelect={(classId) => onChange({ classId })} />
            {oath && (
              <div className="oath-panel">
                <div>
                  <h4 className="oath-title">The Oath</h4>
                  <p className="oath-warning">{oath.warning}</p>
                </div>
                <button className="btn" onClick={() => onChange({ classId: oath.partnerId })}>
                  {oath.label}
                </button>
              </div>
            )}
          </>
        )}

        {step === 'details' && <DetailsForm character={character} race={race} onChange={onChange} />}

        {step === 'sheet' &&
          (isComplete ? (
            <div className="sheet-stage">
              <ExportBar character={character} race={race} dndClass={dndClass} stats={stats} derived={derived} sheetRef={sheetRef} />
              <CharacterSheet
                ref={sheetRef}
                character={character}
                race={race}
                dndClass={dndClass}
                stats={stats}
                derived={derived}
              />
            </div>
          ) : (
            <div className="empty-state parchment-surface">
              <h3>The page is still blank</h3>
              <p>Choose a race and a class first, and your sheet will write itself.</p>
            </div>
          ))}
      </div>

      <div className="creator-nav">
        <button
          className="btn btn-ghost nav-btn"
          disabled={step === 'race'}
          onClick={() => setStep(STEPS[STEPS.findIndex((s) => s.id === step) - 1].id)}
        >
          <Icon name="chevronLeft" size={15} />
          Back
        </button>
        <button
          className="btn btn-primary nav-btn"
          disabled={step === 'sheet'}
          onClick={() => setStep(STEPS[STEPS.findIndex((s) => s.id === step) + 1].id)}
        >
          Next
          <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </div>
  );
}
