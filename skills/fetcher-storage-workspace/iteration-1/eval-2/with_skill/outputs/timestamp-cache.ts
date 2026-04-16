import { KeyStorage, Serializer } from '@ahoo-wang/fetcher-storage';

export class DateSerializer implements Serializer<string, Date> {
  serialize(value: Date): string {
    return JSON.stringify({ __type: 'Date', value: value.toISOString() });
  }

  deserialize(value: string): Date {
    const parsed = JSON.parse(value);
    return new Date(parsed.value);
  }
}

const dateSerializer = new DateSerializer();

export const timestampStorage = new KeyStorage<Date>({
  key: 'last-modified-timestamps',
  serializer: dateSerializer,
});

export function getTimestamp(key: string): Date | null {
  return timestampStorage.get();
}

export function setTimestamp(key: string, timestamp: Date): void {
  timestampStorage.set(timestamp);
}

export function removeTimestamp(key: string): void {
  timestampStorage.remove();
}
