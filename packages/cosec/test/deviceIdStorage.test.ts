import { describe, it, expect } from 'vitest';
import { DeviceIdStorage } from '../src';
import { InMemoryStorage } from '../src';

describe('DeviceIdStorage', () => {
  it('should get existing device ID', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);

    storage.setItem('test-device-id', 'existing-device-id');

    const deviceId = deviceIdStorage.get();
    expect(deviceId).toBe('existing-device-id');
  });

  it('should set device ID', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);

    deviceIdStorage.set('new-device-id');

    const deviceId = storage.getItem('test-device-id');
    expect(deviceId).toBe('new-device-id');
  });

  it('should generate new device ID', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);

    const deviceId1 = deviceIdStorage.generateDeviceId();
    const deviceId2 = deviceIdStorage.generateDeviceId();

    expect(deviceId1).toBeDefined();
    expect(deviceId2).toBeDefined();
    expect(deviceId1).not.toBe(deviceId2);
  });

  it('should get or create device ID', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);

    // First call should generate and store a new device ID
    const deviceId1 = deviceIdStorage.getOrCreate();
    expect(deviceId1).toBeDefined();

    // Second call should return the same device ID
    const deviceId2 = deviceIdStorage.getOrCreate();
    expect(deviceId2).toBe(deviceId1);
  });

  it('should clear stored device ID', () => {
    const storage = new InMemoryStorage();
    const deviceIdStorage = new DeviceIdStorage('test-device-id', storage);

    deviceIdStorage.set('test-device-id');
    expect(deviceIdStorage.get()).toBe('test-device-id');

    deviceIdStorage.clear();
    expect(deviceIdStorage.get()).toBeNull();
  });
});
