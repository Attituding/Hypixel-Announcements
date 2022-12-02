import { Listener } from '@sapphire/framework';
import { type MessageComponentInteraction, MessageEmbed } from 'discord.js';
import { Event } from '../../enums/Event';
import { InteractionErrorHandler } from '../../errors/InteractionErrorHandler';
import type { CustomId } from '../../structures/CustomId';
import { Logger } from '../../structures/Logger';
import { Options } from '../../utility/Options';

export class PersistentNotificationListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Event.PersistentNotification,
        });
    }

    public async run(interaction: MessageComponentInteraction<'cached'>, customId: CustomId) {
        try {
            const selectedCategory = customId.category;

            if (typeof selectedCategory === 'undefined') {
                this.container.logger.info(
                    this,
                    Logger.interactionLogContext(interaction),
                    'Category is undefined.',
                );

                return;
            }

            const { roleId } = this.container.categories.find(
                (announcement) => announcement.category === selectedCategory,
            )!;

            const memberRoles = interaction.member.roles;
            const hasRole = memberRoles.cache.has(roleId);

            const notificationsEmbed = new MessageEmbed().setColor(Options.colorsNormal);

            if (hasRole === true) {
                await memberRoles.remove(roleId);

                notificationsEmbed
                    .setTitle(
                        interaction.i18n.getMessage('persistentNotificationRemoveTitle', [
                            selectedCategory,
                        ]),
                    )
                    .setDescription(
                        interaction.i18n.getMessage('persistentNotificationRemoveDescription', [
                            selectedCategory,
                        ]),
                    );
            } else {
                await memberRoles.add(roleId);

                notificationsEmbed
                    .setTitle(
                        interaction.i18n.getMessage('persistentNotificationAddTitle', [
                            selectedCategory,
                        ]),
                    )
                    .setDescription(
                        interaction.i18n.getMessage('persistentNotificationAddDescription', [
                            selectedCategory,
                        ]),
                    );
            }

            await interaction.member.fetch();

            notificationsEmbed.addFields([
                {
                    name: interaction.i18n.getMessage('persistentNotificationCurrentName'),
                    value:
                        this.container.categories
                            .filter((category) => memberRoles.cache.has(category.roleId))
                            .map((category) => category.category)
                            .join(', ') || interaction.i18n.getMessage('none'),
                },
            ]);

            await interaction.reply({
                embeds: [notificationsEmbed],
                ephemeral: true,
            });
        } catch (error) {
            await new InteractionErrorHandler(error, interaction).init();
        }
    }
}
