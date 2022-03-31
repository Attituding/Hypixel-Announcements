"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.properties = void 0;
const utility_1 = require("../utility/utility");
const Constants_1 = require("../utility/Constants");
const Log_1 = require("../utility/Log");
const RegionLocales_1 = require("../locales/RegionLocales");
exports.properties = {
    name: 'reload',
    description: 'Reloads all imports or a single import.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'reload',
        description: 'Reload',
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
    },
};
const execute = async (interaction) => {
    const text = RegionLocales_1.RegionLocales.locale(interaction.locale).commands.reload;
    const { replace } = RegionLocales_1.RegionLocales;
    switch (interaction.options.getSubcommand()) {
        case 'all':
            await reloadAll();
            break;
        case 'single':
            await reloadSingle();
            break;
        //no default
    }
    async function reloadAll() {
        const now = Date.now();
        const promises = [];
        for (const [command] of interaction.client.commands) {
            promises.push(commandRefresh(interaction, command));
        }
        for (const [event] of interaction.client.events) {
            promises.push(eventRefresh(interaction, event));
        }
        await Promise.all(promises);
        const reloadedEmbed = new utility_1.BetterEmbed(interaction)
            .setColor(Constants_1.Constants.colors.normal)
            .setTitle(text.all.title)
            .setDescription(replace(text.all.description, {
            imports: promises.length,
            timeTaken: Date.now() - now,
        }));
        Log_1.Log.interaction(interaction, `All imports have been reloaded after ${Date.now() - now} milliseconds.`);
        await interaction.editReply({ embeds: [reloadedEmbed] });
    }
    async function reloadSingle() {
        const now = Date.now();
        const typeName = interaction.options.getString('type', true);
        const type = interaction.client[typeName];
        const item = interaction.options.getString('item');
        const selected = type.get(item);
        if (typeof selected === 'undefined') {
            const undefinedSelected = new utility_1.BetterEmbed(interaction)
                .setColor(Constants_1.Constants.colors.warning)
                .setTitle(text.single.unknown.title)
                .setDescription(replace(text.single.unknown.description, {
                typeName: typeName,
                item: item,
            }));
            await interaction.editReply({ embeds: [undefinedSelected] });
            return;
        }
        if (typeName === 'commands') {
            commandRefresh(interaction, selected.properties.name);
        }
        else if (typeName === 'events') {
            eventRefresh(interaction, selected.properties.name);
        }
        const reloadedEmbed = new utility_1.BetterEmbed(interaction)
            .setColor(Constants_1.Constants.colors.normal)
            .setTitle(text.single.success.title)
            .setDescription(replace(text.single.success.description, {
            typeName: typeName,
            item: item,
            timeTaken: Date.now() - now,
        }));
        Log_1.Log.interaction(interaction, `${typeName}.${item} was successfully reloaded after ${Date.now() - now} milliseconds.`);
        await interaction.editReply({ embeds: [reloadedEmbed] });
    }
};
exports.execute = execute;
async function commandRefresh(interaction, item) {
    const refreshed = await reload(`${item}.js`);
    interaction.client.commands.set(refreshed.properties.name, refreshed);
}
async function eventRefresh(interaction, item) {
    const refreshed = await reload(`../events/${item}.js`);
    interaction.client.events.set(refreshed.properties.name, refreshed);
}
function reload(path) {
    return new Promise(resolve => {
        delete require.cache[require.resolve(`${__dirname}/${path}`)];
        const refreshed = require(`${__dirname}/${path}`); //eslint-disable-line @typescript-eslint/no-var-requires
        resolve(refreshed);
    });
}