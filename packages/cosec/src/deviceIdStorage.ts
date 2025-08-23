import {getStorage} from "./inMemoryStorage";
import {idGenerator} from "./idGenerator";

const defaultCoSecDeviceIdKey = 'cosec-device-id';

/**
 * Device ID storage class for managing device identifiers
 */
export class DeviceIdStorage {
    private readonly deviceIdKey: string;
    private storage: Storage;

    constructor(deviceIdKey: string = defaultCoSecDeviceIdKey, storage: Storage = getStorage()) {
        this.deviceIdKey = deviceIdKey;
        this.storage = storage;
    }

    /**
     * Get the current device ID
     */
    get(): string | null {
        return this.storage.getItem(this.deviceIdKey);
    }

    /**
     * Set a device ID
     */
    set(deviceId: string): void {
        this.storage.setItem(this.deviceIdKey, deviceId);
    }

    generateDeviceId(): string {
        return idGenerator.generateId();
    }

    /**
     * Get or create a device ID
     */
    getOrCreate(providedDeviceId?: string): string {
        // If a device ID was provided, use it
        if (providedDeviceId) {
            return providedDeviceId;
        }

        // Try to get existing device ID from storage
        let deviceId = this.get();
        if (!deviceId) {
            // Generate a new device ID and store it
            deviceId = this.generateDeviceId();
            this.set(deviceId);
        }

        return deviceId;
    }

    /**
     * Clear the stored device ID
     */
    clearDeviceId(): void {
        this.storage.removeItem(this.deviceIdKey);
    }

}
