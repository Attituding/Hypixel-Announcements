import { Events, Listener } from '@sapphire/framework';
import { type Interaction, Message, MessageFlags } from 'discord.js';
import { InteractionErrorHandler } from '../errors/InteractionErrorHandler';
import { i18n } from '../locales/i18n';
import { CustomId } from '../structures/CustomId';
import { interactionLogContext } from '../utility/utility';

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
            const flags = interaction.message instanceof Message
                ? interaction.message.flags
                : new MessageFlags(interaction.message.flags);

            // Is a sort of persistent listener
            if (
                flags.has(MessageFlags.FLAGS.EPHEMERAL) === false
                && (
                    interaction.message.type === 'DEFAULT'
                    || interaction.message.type === 0
                )
            ) {
                this.container.logger.info(
                    interactionLogContext(interaction),
                    `${this.constructor.name}:`,
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
