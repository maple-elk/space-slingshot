import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../utils/EventBus';

describe('EventBus System', () => {
  it('registers and emits events with payloads', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('COLLISION', handler);
    bus.emit('COLLISION', { type: 'target', x: 100, y: 200 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'target', x: 100, y: 200 });
  });

  it('unsubscribes listeners correctly', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('LAUNCH', handler);
    bus.emit('LAUNCH', { angle: 45 });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    bus.emit('LAUNCH', { angle: 90 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clears all listeners', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('EVENT_A', h1);
    bus.on('EVENT_B', h2);
    bus.clear();

    bus.emit('EVENT_A', {});
    bus.emit('EVENT_B', {});

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });
});
