import { setTimeout } from 'node:timers/promises';
import {
    type ActionRowBuilder,
    ButtonBuilder,
    type EmbedBuilder,
    type NewsChannel,
    roleMention,
} from 'discord.js';
import type { RSS } from '../@types/RSS';
import { Base } from '../structures/Base';
import { Options } from '../utility/Options';

/* eslint-disable no-await-in-loop */

export class Dispatch extends Base {
    public async dispatch(
        embeds: EmbedBuilder[],
        components: ActionRowBuilder<ButtonBuilder>[],
        data: RSS,
    ) {
        const { channelId, roleId } = this.container.categories.find(
            (category) => category.category === data.title,
        )!;

        const channel = (await this.container.client.channels.fetch(channelId)) as NewsChannel;

        const editedThreadIds = data.items
            .filter((item) => item.edited === true)
            .map((item) => item.id);

        const editedPosts = editedThreadIds.length > 0
            ? await this.postsGet(data, editedThreadIds)
            : [];

        if (data.items.some((item) => item.edited === false)) {
            await channel.send({
                content: roleMention(roleId),
                allowedMentions: {
                    parse: ['roles'],
                },
            });
        }

        for (let index = 0; index < embeds.length; index += 1) {
            const item = data.items[index]!;
            const embed = embeds[index]!;
            const actionRow = components[index]!;

            const editedPost = editedPosts.find((post) => post.id === item.id)!;

            const payload = {
                embeds: [embed],
                components: [actionRow],
            };

            if (item.edited === false) {
                const message = await channel.send(payload);

                if (message.crosspostable === true) {
                    await message.crosspost();
                }

                await this.postSet(data, item.id, message.id);
            } else {
                const message = await channel.messages.fetch(editedPost.message!);

                await message.edit(payload);
            }

            await setTimeout(Options.coreDispatchTimeout);
        }
    }

    private async postsGet(data: RSS, editedThreadIds: string[]) {
        return this.container.database.announcements.findMany({
            select: {
                id: true,
                message: true,
            },
            where: {
                category: data.title,
                AND: [
                    {
                        id: {
                            in: editedThreadIds,
                        },
                    },
                ],
            },
        });
    }

    private async postSet(data: RSS, id: string, messageId: string) {
        await this.container.database.announcements.update({
            data: {
                message: {
                    set: messageId,
                },
            },
            where: {
                category_id: {
                    category: data.title,
                    id: id,
                },
            },
        });
    }
}
