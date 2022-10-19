import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type CommandInteraction,
    Constants as DiscordConstants,
    MessageActionRow,
    MessageButton,
    type MessageComponentInteraction,
    MessageEmbed,
} from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { awaitComponent, disableComponents, interactionLogContext } from '../utility/utility';

export class EditAnnouncementsCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'editannouncements',
            description: 'Edit announcements',
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
                    name: 'message',
                    description: 'The message to target',
                    type: ApplicationCommandOptionTypes.STRING,
                    required: true,
                },
                {
                    name: 'title',
                    description: 'The new title for the embed',
                    type: ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'description',
                    description: 'The new description for the embed',
                    type: ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'image',
                    description: 'The new image for the embed',
                    type: ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'url',
                    description: 'The new url for the embed',
                    type: ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'crosspost',
                    description:
                        'Whether to crosspost the announcement, if not already (defaults to true)',
                    type: ApplicationCommandOptionTypes.BOOLEAN,
                    required: false,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const messageId = interaction.options.getString('message', true);
        const title = interaction.options.getString('title', false);
        const description = interaction.options.getString('description', false);
        const image = interaction.options.getString('image', false);
        const url = interaction.options.getString('url', false);

        const message = await interaction.channel!.messages.fetch(messageId);

        const tempEmbed = new MessageEmbed(message.embeds[0]);

        if (title !== null) {
            tempEmbed.setTitle(title);
        }

        if (description !== null) {
            tempEmbed.setDescription(description);
        }

        if (image !== null) {
            tempEmbed.setImage(image);
        }

        if (url !== null) {
            tempEmbed.setURL(url);
        }

        message.embeds[0] = tempEmbed;

        const button = new MessageActionRow().setComponents(
            new MessageButton()
                .setCustomId('true')
                .setLabel(i18n.getMessage('commandsEditAnnouncementsPreviewButtonLabel'))
                .setStyle(DiscordConstants.MessageButtonStyles.PRIMARY),
        );

        const previewEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsEditAnnouncementsPreviewTitle'))
            .setDescription(i18n.getMessage('commandsEditAnnouncementsPreviewDescription'));

        const reply = await interaction.followUp({
            embeds: [previewEmbed, ...message.embeds],
            components: [button],
        });

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === reply.id;
        };

        await interaction.client.channels.fetch(interaction.channelId);

        const disabledRows = disableComponents([button]);

        const previewButton = await awaitComponent(interaction.channel!, {
            componentType: 'BUTTON',
            filter: componentFilter,
            idle: Time.Minute,
        });

        if (previewButton === null) {
            await interaction.editReply({
                components: disabledRows,
            });

            return;
        }

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            'Sending edit...',
        );

        const editedAnnouncement = await message.edit({
            embeds: message.embeds,
        });

        // Case for when a channel is converted to an announcement channel
        if (
            editedAnnouncement.crosspostable === true
            && interaction.options.getBoolean('crosspost', false) !== false
        ) {
            await editedAnnouncement.crosspost();
        }

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            'Published edit!',
        );

        const successEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsEditAnnouncementsSuccessTitle'))
            .setDescription(i18n.getMessage('commandsEditAnnouncementsSuccessDescription'));

        await previewButton.update({
            embeds: [successEmbed],
            components: disabledRows,
        });
    }
}
