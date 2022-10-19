import type { Events as SapphireEvents } from '@sapphire/framework';

const Events = {
    PersistentNotification: 'persistentNotification',
} as const;

export type Event =
    | typeof SapphireEvents[keyof typeof SapphireEvents]
    | typeof Events[keyof typeof Events];
