import { categories as Category, config as Config, PrismaClient } from '@prisma/client';
import { container, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Options, type PresenceData, Sweepers } from 'discord.js';
import { Core } from '../core/Core';
import { i18n } from '../locales/i18n';
import { Logger } from './Logger';

export class Client extends SapphireClient {
    public constructor(config: Config) {
        super({
            allowedMentions: {
                parse: ['users'],
                repliedUser: true,
            },
            failIfNotExists: false,
            intents: [GatewayIntentBits.Guilds],
            loadDefaultErrorListeners: false,
            logger: {
                instance: new Logger({
                    level: config.logLevel,
                    depth: 5,
                }),
            },
            makeCache: Options.cacheWithLimits({
                GuildBanManager: 0,
                GuildInviteManager: 0,
                GuildMemberManager: 25,
                GuildEmojiManager: 0,
                GuildScheduledEventManager: 0,
                GuildStickerManager: 0,
                MessageManager: 50,
                PresenceManager: 0,
                ReactionManager: 0,
                ReactionUserManager: 0,
                StageInstanceManager: 0,
                ThreadManager: 0,
                ThreadMemberManager: 0,
                VoiceStateManager: 0,
            }),
            presence: {
                status: 'online',
            },
            sweepers: {
                guildMembers: {
                    interval: 600,
                    filter: Sweepers.filterByLifetime({
                        lifetime: 60,
                    }),
                },
                messages: {
                    interval: 600,
                    lifetime: 60,
                },
                threadMembers: {
                    interval: 600,
                    filter: Sweepers.filterByLifetime({
                        lifetime: 1,
                    }),
                },
                threads: {
                    interval: 600,
                    lifetime: 30,
                },
                users: {
                    interval: 3600,
                    filter: Sweepers.filterByLifetime({
                        lifetime: 3600,
                    }),
                },
            },
        });
    }

    public static async init() {
        const startTime = Date.now();

        container.database = new PrismaClient();

        const { config, categories } = container.database;
        container.categories = await categories.findMany();
        container.config = (await config.findFirst()) as Config;

        const client = new Client(container.config);

        container.core = new Core();
        container.customPresence = null;
        container.i18n = new i18n();

        await client.login();

        container.logger.info(
            this,
            `Initialized container after ${Date.now() - startTime}ms.`,
        );
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        categories: Category[];
        config: Config;
        core: Core;
        customPresence: PresenceData | null;
        database: PrismaClient;
        i18n: i18n;
    }
}
