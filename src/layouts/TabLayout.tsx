import { Outlet } from 'react-router-dom';
import { BottomTabBar } from '../components/BottomTabBar';
import s from './TabLayout.module.css';

/** 하단 탭바가 있는 화면 공통 레이아웃 */
export function TabLayout() {
  return (
    <>
      <main className={s.content}>
        <Outlet />
      </main>
      <BottomTabBar />
    </>
  );
}
