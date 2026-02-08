import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveModeProvider, useLiveMode } from './LiveModeContext';

function Harness() {
  const { mode, enterBattle, exitBattle } = useLiveMode();
  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <button type="button" onClick={() => enterBattle({ source: 'user', streamId: 's1', opponent: 'o1' })}>
        enter
      </button>
      <button type="button" onClick={() => exitBattle()}>
        exit
      </button>
    </div>
  );
}

describe('LiveModeContext', () => {
  it('switches mode live ↔ battle', () => {
    const r = render(
      <LiveModeProvider>
        <Harness />
      </LiveModeProvider>
    );

    expect(r.getByTestId('mode').textContent).toBe('live');
    act(() => r.getByText('enter').click());
    expect(r.getByTestId('mode').textContent).toBe('battle');
    act(() => r.getByText('exit').click());
    expect(r.getByTestId('mode').textContent).toBe('live');
  });

  it('emits transition events', () => {
    vi.useFakeTimers();
    const events: string[] = [];
    const onBeforeEnter = () => events.push('beforeEnterBattle');
    const onAfterEnter = () => events.push('afterEnterBattle');
    const onBeforeExit = () => events.push('beforeExitBattle');
    const onAfterExit = () => events.push('afterExitBattle');

    window.addEventListener('beforeEnterBattle', onBeforeEnter);
    window.addEventListener('afterEnterBattle', onAfterEnter);
    window.addEventListener('beforeExitBattle', onBeforeExit);
    window.addEventListener('afterExitBattle', onAfterExit);

    const r = render(
      <LiveModeProvider>
        <Harness />
      </LiveModeProvider>
    );

    act(() => r.getByText('enter').click());
    expect(events).toEqual(['beforeEnterBattle']);
    act(() => vi.advanceTimersByTime(300));
    expect(events).toEqual(['beforeEnterBattle', 'afterEnterBattle']);

    act(() => r.getByText('exit').click());
    expect(events).toEqual(['beforeEnterBattle', 'afterEnterBattle', 'beforeExitBattle']);
    act(() => vi.advanceTimersByTime(300));
    expect(events).toEqual(['beforeEnterBattle', 'afterEnterBattle', 'beforeExitBattle', 'afterExitBattle']);

    window.removeEventListener('beforeEnterBattle', onBeforeEnter);
    window.removeEventListener('afterEnterBattle', onAfterEnter);
    window.removeEventListener('beforeExitBattle', onBeforeExit);
    window.removeEventListener('afterExitBattle', onAfterExit);
    vi.useRealTimers();
  });
});

