import { type Command, container, RegisterBehavior } from '@sapphire/framework';
import { PresenceUpdateStatus } from 'discord-api-types/v10';
import { ColorResolvable, Constants, PresenceData } from 'discord.js';
import { Time } from '../enums/Time';
import type { locales } from '../locales/locales';

export class Options {
    static readonly colorsError: ColorResolvable = 0xaa0000;

    static readonly colorsWarning: ColorResolvable = 0xff5555;

    static readonly colorsNormal: ColorResolvable = 0x2f3136;

    static readonly colorsOk: ColorResolvable = 0xffaa00;

    static readonly colorsOn: ColorResolvable = 0x00aa00;

    static readonly cooldownMinimum = Time.Second * 2.5;

    static readonly coreDisabledTimeout = Time.Second * 2.5;

    static readonly coreDispatchTimeout = Time.Second * 2.5;

    static readonly commandRegistry = (command: Command) => ({
        guildIds: command.options.preconditions?.find((condition) => condition === 'OwnerOnly')
        && process.env.ENVIRONMENT === 'production'
            ? container.config.ownerGuilds
            : undefined,
        registerCommandIfMissing: true,
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
    });

    static readonly defaultLocale: keyof typeof locales = 'en-US';

    static readonly performanceInterval = Time.Hour / 2;

    static readonly performanceMaxDataPoints = 100;

    static readonly performanceHistory = 50;

    static readonly pingOkMinimum = 300;

    static readonly pingOnMinimum = 150;

    static readonly presence: PresenceData = {
        activities: [
            {
                name: 'Hypixel News',
                type: Constants.ActivityTypes.WATCHING,
            },
        ],
        status: PresenceUpdateStatus.Online,
    };

    static readonly restRequestTimeout = Time.Second * 5;

    static readonly retryLimit = 2;

    static readonly timeoutBaseTimeout = Time.Minute;

    static readonly timeoutMaxTimeout = Time.Day / 2;

    static readonly timeoutResetAfter = Time.Minute * 10;
}
