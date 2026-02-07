import React, { createContext, useContext, useMemo, useReducer } from 'react';

export type LiveMode = 'live' | 'battle';

export type BattleEnterPayload = {
  source?: 'user' | 'promo' | 'deeplink';
  streamId?: string;
  opponent?: string;
};

type UiSnapshot = {
  isChatVisible: boolean;
};

type LiveModeState = {
  mode: LiveMode;
  snapshot: UiSnapshot | null;
  battle: BattleEnterPayload | null;
};

type LiveModeAction =
  | { type: 'ENTER_BATTLE'; payload: BattleEnterPayload; snapshot: UiSnapshot }
  | { type: 'EXIT_BATTLE' }
  | { type: 'SET_CHAT_VISIBLE'; isChatVisible: boolean };

type LiveModeApi = {
  mode: LiveMode;
  isBattle: boolean;
  battle: BattleEnterPayload | null;
  snapshot: UiSnapshot | null;
  enterBattle: (payload?: BattleEnterPayload) => void;
  exitBattle: () => void;
  setChatVisible: (isChatVisible: boolean) => void;
};

const LiveModeContext = createContext<LiveModeApi | null>(null);

const FADE_MS = 300;

const dispatchEventSafe = (name: string, detail?: unknown) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const reducer = (state: LiveModeState, action: LiveModeAction): LiveModeState => {
  switch (action.type) {
    case 'ENTER_BATTLE':
      return { mode: 'battle', snapshot: action.snapshot, battle: action.payload };
    case 'EXIT_BATTLE':
      return { mode: 'live', snapshot: null, battle: null };
    case 'SET_CHAT_VISIBLE':
      if (state.mode === 'battle' && state.snapshot) {
        return { ...state, snapshot: { ...state.snapshot, isChatVisible: action.isChatVisible } };
      }
      return state;
    default:
      return state;
  }
};

export function LiveModeProvider({
  children,
  initialChatVisible = true,
}: {
  children: React.ReactNode;
  initialChatVisible?: boolean;
}) {
  const [state, dispatch] = useReducer(reducer, {
    mode: 'live',
    snapshot: null,
    battle: null,
  });

  const api = useMemo<LiveModeApi>(() => {
    const enterBattle = (payload: BattleEnterPayload = {}) => {
      const snapshot: UiSnapshot = { isChatVisible: initialChatVisible };
      dispatchEventSafe('beforeEnterBattle', { payload, snapshot });
      dispatch({ type: 'ENTER_BATTLE', payload, snapshot });
      window.setTimeout(() => dispatchEventSafe('afterEnterBattle', { payload, snapshot }), FADE_MS);
    };

    const exitBattle = () => {
      dispatchEventSafe('beforeExitBattle', { snapshot: state.snapshot });
      dispatch({ type: 'EXIT_BATTLE' });
      window.setTimeout(() => dispatchEventSafe('afterExitBattle', { snapshot: state.snapshot }), FADE_MS);
    };

    const setChatVisible = (isChatVisible: boolean) => {
      dispatch({ type: 'SET_CHAT_VISIBLE', isChatVisible });
    };

    return {
      mode: state.mode,
      isBattle: state.mode === 'battle',
      battle: state.battle,
      snapshot: state.snapshot,
      enterBattle,
      exitBattle,
      setChatVisible,
    };
  }, [initialChatVisible, state.battle, state.mode, state.snapshot]);

  return <LiveModeContext.Provider value={api}>{children}</LiveModeContext.Provider>;
}

export function useLiveMode() {
  const ctx = useContext(LiveModeContext);
  if (!ctx) {
    throw new Error('useLiveMode must be used within LiveModeProvider');
  }
  return ctx;
}

