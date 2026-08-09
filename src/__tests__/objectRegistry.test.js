import { describe, it, expect } from 'vitest';
import { spaceObjectRegistry, registerSpaceObject, getAllRegisteredSpaceObjects } from '../game/registry/objectRegistry';

describe('Data-Driven Space Object Registry', () => {
  it('contains essential space object types with physics and renderer configs', () => {
    expect(spaceObjectRegistry.planet).toBeDefined();
    expect(spaceObjectRegistry.black_hole).toBeDefined();
    expect(spaceObjectRegistry.asteroid).toBeDefined();
    expect(spaceObjectRegistry.wormhole).toBeDefined();
    expect(spaceObjectRegistry.pulsar).toBeDefined();
    expect(spaceObjectRegistry.booster).toBeDefined();
    expect(spaceObjectRegistry.shield).toBeDefined();

    expect(spaceObjectRegistry.planet.physicsConfig.behavior).toBe('attract');
    expect(spaceObjectRegistry.black_hole.physicsConfig.behavior).toBe('destroy');
    expect(spaceObjectRegistry.asteroid.physicsConfig.behavior).toBe('drag');
    expect(spaceObjectRegistry.wormhole.physicsConfig.behavior).toBe('teleport');
    expect(spaceObjectRegistry.pulsar.physicsConfig.behavior).toBe('repel');
    expect(spaceObjectRegistry.booster.physicsConfig.behavior).toBe('boost');
    expect(spaceObjectRegistry.shield.physicsConfig.behavior).toBe('bounce');
  });

  it('getAllRegisteredSpaceObjects returns array of object configs', () => {
    const list = getAllRegisteredSpaceObjects();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(7);
  });

  it('registerSpaceObject registers new custom space object', () => {
    const customConfig = {
      type: 'nebula',
      name: 'Ionizing Nebula',
      icon: '🌌',
      category: 'modifier',
      physicsConfig: { behavior: 'slow' },
      generatorConfig: { clearanceRadius: 60 },
    };

    registerSpaceObject('nebula', customConfig);

    expect(spaceObjectRegistry.nebula).toBeDefined();
    expect(spaceObjectRegistry.nebula.name).toBe('Ionizing Nebula');
  });
});
