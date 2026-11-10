import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import s from './BottomTabBar.module.css';

const TABS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: '캘린더', icon: 'calendar', end: true },
  { to: '/timetable', label: '내 시간표', icon: 'timetable' },
  { to: '/spaces', label: '공간', icon: 'sofa' },
  { to: '/notices', label: '공지', icon: 'megaphone' },
];

export function BottomTabBar() {
  return (
    <nav className={s.bar} aria-label="주요 메뉴">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => [s.tab, isActive && s.active].filter(Boolean).join(' ')}
        >
          <Icon name={t.icon} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
