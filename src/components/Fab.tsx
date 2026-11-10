import { Icon, type IconName } from './Icon';
import s from './Fab.module.css';

interface FabProps {
  icon: IconName;
  label: string;
  onClick: () => void;
  /** 하단 탭바 위에 띄울지 (없는 화면은 bottom: 28px) */
  withTabBar?: boolean;
}

export function Fab({ icon, label, onClick, withTabBar = true }: FabProps) {
  return (
    <button type="button" className={[s.fab, withTabBar ? s.aboveTab : s.noTab].join(' ')} onClick={onClick}>
      <Icon name={icon} size={22} />
      {label}
    </button>
  );
}
