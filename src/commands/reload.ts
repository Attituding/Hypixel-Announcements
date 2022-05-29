import type {
    Command,
    CommandStatic,
} from '../@types/Command';
import type { Event } from '../@types/Event';
import { BetterEmbed } from '../utility/BetterEmbed';
import { CommandInteraction } from 'discord.js';
import { Log } from '../utility/Log';
import { Options } from '../utility/Options';

//Determines if the runtime is using .js or ts-node
let extension: string;

try {
    require('../main.js');
    extension = '.js';
} catch {
    extension = '.ts';
}

export default class implements CommandStatic {
    static cooldown = 0;
    static ephemeral = true;
    static noDM = false;
    static ownerOnly = true;
    static permissions = {
        bot: {
            global: [],
            local: [],
        },
        user: {
            global: [],
            local: [],
        },
    };
    static structure = {
        name: 'reload',
        description: 'Reloads all imports or a single import',
        options: [
            {
                name: 'all',
                type: 1,
                description: 'Refreshes all imports',
            },
            {
                name: 'single',
                type: 1,
                description: 'Refresh a single command',
                options: [
                    {
                        name: 'type',
                        type: 3,
                        description: 'The category to refresh',
                        required: true,
                        choices: [
                            {
                                name: 'commands',
                                value: 'commands',
                            },
                            {
                                name: 'events',
                                value: 'events',
                            },
                            {
                                name: 'modules',
                                value: 'modules',
                            },
                        ],
                    },
                    {
                        name: 'item',
                        type: 3,
                        description: 'The item to refresh',
                        required: true,
                    },
                ],
            },
        ],
    };

    static async execute(interaction: CommandInteraction) {
        const { i18n } = interaction;

        switch (interaction.options.getSubcommand()) {
            case 'all': await reloadAll();
                break;
            case 'single': await reloadSingle();
                break;
            //no default
        }

        async function reloadAll() {
            const now = Date.now();
            const promises: Promise<void>[] = [];

            for (const [command] of interaction.client.commands) {
                promises.push(commandRefresh(interaction, command));
            }

            for (const [event] of interaction.client.events) {
                promises.push(eventRefresh(interaction, event));
            }

            await Promise.all(promises);

            const reloadedEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsReloadAllTitle'))
                .setDescription(i18n.getMessage('commandsReloadAllDescription', [
                    promises.length,
                    Date.now() - now,
                ]));

            Log.interaction(interaction, `All imports have been reloaded after ${Date.now() - now
                } milliseconds.`);

            await interaction.editReply({ embeds: [reloadedEmbed] });
        }

        async function reloadSingle() {
            const now = Date.now();
            const typeName = interaction.options.getString('type', true);
            const type =
                interaction.client[
                typeName as keyof Pick<
                    typeof interaction.client,
                    'commands' | 'events'
                >
                ];
            const item = interaction.options.getString('item')!;
            const selected = type.get(item);

            if (typeof selected === 'undefined') {
                const undefinedSelected = new BetterEmbed(interaction)
                    .setColor(Options.colorsWarning)
                    .setTitle(i18n.getMessage('commandsReloadSingleUnknownTitle'))
                    .setDescription(
                        i18n.getMessage('commandsReloadSingleUnknownDescription', [
                            typeName,
                            item,
                        ],
                        ));

                await interaction.editReply({ embeds: [undefinedSelected] });
                return;
            }

            if (typeName === 'commands') {
                commandRefresh(
                    interaction,
                    (selected as Command).structure.name,
                );
            } else if (typeName === 'events') {
                eventRefresh(
                    interaction,
                    (selected as Event).event,
                );
            }

            const reloadedEmbed = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsReloadSingleSuccessTitle'))
                .setDescription(
                    i18n.getMessage('commandsReloadSingleSuccessDescription', [
                        typeName,
                        item,
                        Date.now() - now,
                    ],
                    ));

            Log.interaction(interaction, `${typeName}.${item} was successfully reloaded after ${Date.now() - now
                } milliseconds.`);

            await interaction.editReply({ embeds: [reloadedEmbed] });
        }
    }
}

async function commandRefresh(interaction: CommandInteraction, item: string) {
    const refreshed = await reload<Command>(`${item}`);
    interaction.client.commands.set(refreshed.structure.name, refreshed);
}

async function eventRefresh(interaction: CommandInteraction, item: string) {
    const refreshed = await reload<Event>(`../events/${item}`);
    interaction.client.events.set(refreshed.event, refreshed);
}

function reload<Type>(path: string) {
    return new Promise<Type>(resolve => {
        delete require.cache[require.resolve(`${__dirname}/${path}${extension}`)];

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const refreshed: Type = require(
            `${__dirname}/${path}${extension}`,
        ).default;

        resolve(refreshed);
    });
}