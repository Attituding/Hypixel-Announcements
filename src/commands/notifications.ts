import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type CommandInteraction,
    Constants,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    type TextChannel,
} from 'discord.js';
import { CustomIdType } from '../enums/CustomIdType';
import { Event } from '../enums/Event';
import { BetterEmbed } from '../structures/BetterEmbed';
import { CustomId } from '../structures/CustomId';
import { Options } from '../utility/Options';

export class NotificationsCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'notifications',
            description: 'Add a notifications selector to a channel',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'OwnerOnly', 'GuildOnly'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'channel',
                    description: 'The channel to add the selector to',
                    type: Constants.ApplicationCommandOptionTypes.CHANNEL,
                    channel_types: [Constants.ChannelTypes.GUILD_TEXT],
                    required: true,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const notificationsEmbed = new MessageEmbed()
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsNotificationsPublicTitle'))
            .setDescription(i18n.getMessage('commandsNotificationsPublicDescription'));

        const actionRow = new MessageActionRow().setComponents(
            this.container.categories.map((category) => new MessageButton()
                .setCustomId(
                    CustomId.create({
                        category: category.category,
                        event: Event.PersistentNotification,
                        type: CustomIdType.Persistent,
                    }),
                )
                .setLabel(category.category)
                .setStyle(Constants.MessageButtonStyles.PRIMARY)),
        );

        const channel = interaction.options.getChannel('channel', true) as TextChannel;

        await channel.send({
            embeds: [notificationsEmbed],
            components: [actionRow],
        });

        const embed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsNotificationsPrivateTitle'));

        await interaction.editReply({
            embeds: [embed],
        });
    }
}
