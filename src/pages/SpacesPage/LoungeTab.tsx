import dayjs from 'dayjs';
import { useState } from 'react';
import { Badge, LEVEL_LABEL, LEVEL_VAR } from '../../components/Badge';
import { useAppStore } from '../../store/AppStore';
import type { CongestionLevel, VoteLevel } from '../../types';
import { minutesAgo } from '../../utils/date';
import { useNow } from '../../utils/useNow';
import s from './LoungeTab.module.css';

const BAR_COUNT: Record<CongestionLevel, number> = { RELAXED: 1, NORMAL: 2, CROWDED: 3, UNKNOWN: 0 };
const VOTE_OPTIONS: VoteLevel[] = ['RELAXED', 'NORMAL', 'CROWDED'];

export function LoungeTab() {
  const { places, vote } = useAppStore();
  const now = useNow(15_000);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <p className={s.note}>최근 30분 동안의 투표로 계산해요 · 당겨서 새로고침</p>
      <ul className={s.list}>
        {places.map((p) => {
          const isOpen = openId === p.id;
          const locked = !!p.canVoteAt && now.isBefore(dayjs(p.canVoteAt));
          const myVote = locked ? p.myVote : undefined;
          const bars = BAR_COUNT[p.level];
          const barColor = LEVEL_VAR[p.level].fg;
          const panelId = `place-${p.id}`;
          return (
            <li key={p.id} className={[s.card, isOpen && s.open].filter(Boolean).join(' ')}>
              <button
                type="button"
                className={s.head}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : p.id)}
              >
                <div className={s.info}>
                  <span className={s.name}>{p.name}</span>
                  <span className={s.bars} aria-hidden>
                    {[1, 2, 3].map((k) => (
                      <span key={k} className={s.bar} style={{ background: k <= bars ? barColor : undefined }} />
                    ))}
                  </span>
                  <span className={s.meta}>
                    {p.voteCount && p.lastVotedAt
                      ? `유효 투표 ${p.voteCount}건 · 마지막 투표 ${minutesAgo(p.lastVotedAt, now)}`
                      : '최근 30분 동안 투표가 없어요'}
                  </span>
                </div>
                <Badge variant="status" level={p.level} />
              </button>

              {isOpen && (
                <div id={panelId} className={s.panel}>
                  <span className={s.ask}>지금 여기 어때요?</span>
                  <div className={s.options}>
                    {VOTE_OPTIONS.map((lv) => {
                      const on = myVote === lv;
                      const c = LEVEL_VAR[lv];
                      return (
                        <button
                          key={lv}
                          type="button"
                          aria-pressed={on}
                          disabled={!!myVote && !on}
                          className={[s.option, on && s.optionOn].filter(Boolean).join(' ')}
                          style={{ color: on ? '#fff' : c.fg, background: on ? c.fg : undefined, borderColor: on ? c.fg : undefined }}
                          onClick={() => !myVote && vote(p.id, lv)}
                        >
                          {LEVEL_LABEL[lv]}
                        </button>
                      );
                    })}
                  </div>
                  {myVote && <span className={s.voted}>투표했어요 · 10분 뒤에 다시 투표할 수 있어요</span>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
