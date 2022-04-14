import type { ClientCommand } from '../@types/client';
import {
    BetterEmbed,
    cleanLength,
    cleanRound,
} from '../utility/utility';
import { Constants } from '../utility/Constants';
import { RegionLocales } from '../locales/RegionLocales';
import process from 'node:process';

export const properties: ClientCommand['properties'] = {
    name: 'system',
    description: 'View system information.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    structure: {
        name: 'system',
        description: 'View system information',
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
): Promise<void> => {
    const text = RegionLocales.locale(interaction.locale).commands.system;
    const { replace } = RegionLocales;

    const memoryMegaBytes = process.memoryUsage.rss() / (2 ** 20);

    const responseEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.embed.title)
        .addFields(
            {
                name: text.embed.field1.name,
                value: replace(text.embed.field1.value, {
                    uptime: cleanLength(process.uptime() * 1000)!,
                }),
            },
            {
                name: text.embed.field2.name,
                value: replace(text.embed.field2.value, {
                    memoryMegaBytes: cleanRound(memoryMegaBytes, 1),
                }),
            },
            {
                name: text.embed.field3.name,
                value: replace(text.embed.field3.value, {
                    servers: interaction.client.guilds.cache.size,
                }),
            },
            {
                name: text.embed.field4.name,
                value: replace(text.embed.field4.value, {
                    users: interaction.client.guilds.cache.reduce(
                        (acc, guild) => acc + guild.memberCount,
                        0,
                    ),
                }),
            },
        );

    await interaction.editReply({
        embeds: [responseEmbed],
    });
};