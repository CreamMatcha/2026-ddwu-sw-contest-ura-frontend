import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { PageHeader } from '../../components/PageHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useToast } from '../../components/Toast';
import { useAppStore } from '../../store/AppStore';
import s from './SpacesPage.module.css';

type Tab = 'lounge' | 'rooms';

export function SpacesPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const { refreshPlaces } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const tab: Tab = pathname.endsWith('/rooms') ? 'rooms' : 'lounge';

  // TODO: 당겨서 새로고침(pull-to-refresh)은 버튼으로 먼저 구현
  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      refreshPlaces();
      setRefreshing(false);
      toast('최신 정보로 바꿨어요');
    }, 600);
  };

  return (
    <>
      <PageHeader
        variant="title"
        title="공간"
        actions={
          tab === 'lounge' ? (
            <IconButton
              icon="refresh"
              tone="muted"
              aria-label="새로고침"
              className={refreshing ? s.spinning : undefined}
              aria-busy={refreshing}
              onClick={refresh}
            />
          ) : (
            <button
              type="button"
              className={s.register}
              onClick={() => toast('강의실 시간표 등록은 준비 중이에요')}
            >
              <Icon name="camera" size={18} />
              강의실 시간표 등록
            </button>
          )
        }
      >
        <SegmentedControl<Tab>
          label="공간 종류"
          value={tab}
          onChange={(v) => navigate(`/spaces/${v}`)}
          options={[
            { value: 'lounge', label: '라운지' },
            { value: 'rooms', label: '빈 강의실' },
          ]}
        />
      </PageHeader>
      <Outlet />
    </>
  );
}
