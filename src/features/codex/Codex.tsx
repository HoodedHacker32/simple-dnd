import { RULE_SECTIONS } from '../../data/rules';
import { RACES } from '../../data/races';
import { CLASSES, classDisplayName } from '../../data/classes';
import { STATS, STAT_ORDER } from '../../types/character';
import { formatModifier } from '../../engine/statCalculator';
import { Icon } from '../../components/Icon';
import './Codex.css';

export function Codex() {
  return (
    <div className="codex">
      <section className="codex-intro parchment-surface">
        <h2 className="codex-intro-title">How this game works</h2>
        <p className="illuminated">
          Every character has six attributes, each scored from 0 to 3. That score is not a number you do
          sums with — it is a row you look up on a small table. Find the row, read what it says, roll the
          die it tells you to. That is the entire system. No modifiers to stack, no proficiency bonuses, no
          arithmetic in your head at the table.
        </p>
        <p>
          Below is every table in the game, with a plain-English explanation of what it is for. Your
          character sheet already has your personal numbers filled in, so most of the time you will not need
          to come here at all.
        </p>
      </section>

      {RULE_SECTIONS.map((section) => (
        <section className="codex-section" key={section.stat}>
          <header className="codex-section-header">
            <span className="codex-abbr">{STATS[section.stat].abbr}</span>
            <div>
              <h3 className="codex-stat-name">{STATS[section.stat].label}</h3>
              <p className="codex-headline">{section.headline}</p>
            </div>
          </header>

          <p className="codex-plain">{section.plainEnglish}</p>

          <div className="codex-tables">
            {section.tables.map((table) => (
              <div className="codex-table parchment-surface" key={table.title}>
                <h4 className="codex-table-title">{table.title}</h4>
                {table.intro && <p className="codex-table-intro">{table.intro}</p>}
                <table>
                  <thead>
                    <tr>
                      <th>{table.columns[0]}</th>
                      <th>{table.columns[1]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.key}>
                        <td className="codex-key">{row.key}</td>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {table.footnote && <p className="codex-footnote">{table.footnote}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="codex-section">
        <header className="codex-section-header">
          <span className="codex-abbr">
            <Icon name="star" size={24} />
          </span>
          <div>
            <h3 className="codex-stat-name">Reference tables</h3>
            <p className="codex-headline">Every race and class at a glance.</p>
          </div>
        </header>

        <div className="codex-table parchment-surface codex-wide">
          <h4 className="codex-table-title">Races</h4>
          <div className="table-scroll">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Race</th>
                  {STAT_ORDER.map((key) => (
                    <th key={key} title={STATS[key].label}>
                      {STATS[key].abbr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RACES.map((race) => (
                  <tr key={race.id}>
                    <td className="codex-key">
                      <span className="swatch" style={{ background: race.accent }} />
                      {race.name}
                    </td>
                    {STAT_ORDER.map((key) => (
                      <td key={key} className={race.modifiers[key] === 0 ? 'zero' : ''}>
                        {formatModifier(race.modifiers[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="codex-table parchment-surface codex-wide">
          <h4 className="codex-table-title">Classes</h4>
          <div className="table-scroll">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Class</th>
                  {STAT_ORDER.map((key) => (
                    <th key={key} title={STATS[key].label}>
                      {STATS[key].abbr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((cls) => (
                  <tr key={cls.id} className={cls.placeholder ? 'row-pending' : ''}>
                    <td className="codex-key">
                      <span className="swatch" style={{ background: cls.accent }} />
                      {classDisplayName(cls)}
                    </td>
                    {cls.placeholder ? (
                      <td colSpan={STAT_ORDER.length} className="pending-cell">
                        Not yet designed
                      </td>
                    ) : (
                      STAT_ORDER.map((key) => (
                        <td key={key} className={cls.modifiers[key] === 0 ? 'zero' : ''}>
                          {formatModifier(cls.modifiers[key])}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
