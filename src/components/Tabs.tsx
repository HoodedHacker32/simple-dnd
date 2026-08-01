import { Icon, type IconName } from './Icon';
import './Tabs.css';

export interface TabDef {
  id: string;
  label: string;
  icon: IconName;
}

interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tab${active === tab.id ? ' tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <Icon name={tab.icon} size={17} className="tab-glyph" />
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
