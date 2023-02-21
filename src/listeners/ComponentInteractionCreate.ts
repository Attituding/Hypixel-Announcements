import { Events, Listener } from '@sapphire/framework';
import { type Interaction, MessageFlags, MessageType } from 'discord.js';
import { InteractionErrorHandler } from '../errors/InteractionErrorHandler';
import { i18n } from '../locales/i18n';
import { CustomId } from '../structures/CustomId';
import { Logger } from '../structures/Logger';

export class ComponentInteractionCreateListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.InteractionCreate,
        });
    }

    public run(interaction: Interaction) {
        if (!interaction.isMessageComponent()) {
            return;
        }

        try {
            const { flags } = interaction.message;

            // Is a sort of persistent listener
            if (
                flags.has(MessageFlags.Ephemeral) === false
                && (
                    interaction.message.type === MessageType.Default
                    // TODO: please double check this
                    // || interaction.message.type === 0
                )
            ) {
                this.container.logger.info(
                    this,
                    Logger.interactionLogContext(interaction),
                    `CustomId is ${interaction.customId}.`,
                );

                Object.defineProperty(interaction, 'i18n', {
                    value: new i18n(interaction.locale),
                });

                const customId = CustomId.parse(interaction.customId);

                if (customId.event) {
                    this.container.client.emit(customId.event, interaction, customId);
                }
            }
        } catch (error) {
            new InteractionErrorHandler(error, interaction).init();
        }
    }
}
