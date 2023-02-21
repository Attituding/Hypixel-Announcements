import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    type ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    type MessageComponentInteraction,
} from 'discord.js';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';
import { awaitComponent, disableComponents } from '../utility/utility';

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
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'title',
                    description: 'The new title for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'description',
                    description: 'The new description for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'image',
                    description: 'The new image for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'url',
                    description: 'The new url for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'crosspost',
                    description:
                        'Whether to crosspost the announcement, if not already (defaults to true)',
                    type: ApplicationCommandOptionType.Boolean,
                    required: false,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const messageId = interaction.options.getString('message', true);
        const title = interaction.options.getString('title', false);
        const description = interaction.options.getString('description', false);
        const image = interaction.options.getString('image', false);
        const url = interaction.options.getString('url', false);

        const message = await interaction.channel!.messages.fetch(messageId);

        const tempEmbed = new EmbedBuilder(message.embeds[0]?.data);

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

        const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setCustomId('true')
                .setLabel(i18n.getMessage('commandsEditAnnouncementsPreviewButtonLabel'))
                .setStyle(ButtonStyle.Primary),
        );

        const previewEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsEditAnnouncementsPreviewTitle'))
            .setDescription(i18n.getMessage('commandsEditAnnouncementsPreviewDescription'));

        const reply = await interaction.followUp({
            embeds: [previewEmbed, tempEmbed],
            components: [button],
        });

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === reply.id;
        };

        await interaction.client.channels.fetch(interaction.channelId);

        const disabledRows = disableComponents([button]);

        const previewButton = await awaitComponent(interaction.channel!, {
            componentType: ComponentType.Button,
            filter: componentFilter,
            idle: Time.Minute,
        });

        if (previewButton === null) {
            this.container.logger.info(
                this,
                Logger.interactionLogContext(interaction),
                'Ran out of time.',
            );

            await interaction.editReply({
                components: disabledRows,
            });

            return;
        }

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            'Sending edit...',
        );

        const editedAnnouncement = await message.edit({
            embeds: message.embeds,
        });

        // Case for when a channel is converted to an announcement channel
        if (
            editedAnnouncement.crosspostable === true
            && interaction.options.getBoolean('crosspost', false)
        ) {
            await editedAnnouncement.crosspost();
        }

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
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
