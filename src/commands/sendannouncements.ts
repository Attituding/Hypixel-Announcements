import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    type ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    type MessageComponentInteraction,
    type NewsChannel,
    roleMention,
} from 'discord.js';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';
import { awaitComponent, disableComponents } from '../utility/utility';

export class SendAnnouncementsCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'sendannouncements',
            description: 'Manually send announcements',
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
                    description: 'The channel to send the announcement to',
                    type: ApplicationCommandOptionType.Channel,
                    channel_types: [
                        ChannelType.GuildAnnouncement,
                        ChannelType.GuildText,
                    ],
                    required: true,
                },
                {
                    name: 'title',
                    description: 'The title for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'description',
                    description: 'The description for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'image',
                    description: 'The image for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'url',
                    description: 'The url for the embed',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'author',
                    description: 'The author of the announcement',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'role',
                    description: 'The role to mention with the announcement',
                    type: ApplicationCommandOptionType.Role,
                    required: false,
                },
                {
                    name: 'crosspost',
                    description: 'Whether to crosspost the announcement (default to true)',
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

        const channel = interaction.options.getChannel('channel', true) as NewsChannel;

        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const image = interaction.options.getString('image', false);
        const url = interaction.options.getString('url', false);
        const author = interaction.options.getString('author', false);

        const announcement = new EmbedBuilder()
            .setAuthor({
                name: i18n.getMessage('commandsSendAnnouncementsEmbedAuthorName'),
            })
            .setDescription(description)
            .setFooter({
                text: i18n.getMessage('commandsSendAnnouncementsEmbedFooterName'),
                iconURL:
                    'https://cdn.discordapp.com/icons/489529070913060867/f7df056de15eabfc0a0e178d641f812b.webp?size=128',
            })
            .setTitle(title);

        if (image !== null) {
            announcement.setImage(image);
        }

        if (url !== null) {
            announcement.setURL(url);
        }

        if (author !== null) {
            announcement.setAuthor({ name: author });
        }

        const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setCustomId('true')
                .setLabel(i18n.getMessage('commandsSendAnnouncementsPreviewButtonLabel'))
                .setStyle(ButtonStyle.Primary),
        );

        const previewEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsSendAnnouncementsPreviewTitle'))
            .setDescription(i18n.getMessage('commandsSendAnnouncementsPreviewDescription'));

        const reply = await interaction.followUp({
            embeds: [previewEmbed, announcement],
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
            'Sending message...',
        );

        const role = interaction.options.getRole('role', false);

        if (role !== null) {
            await channel.send({
                content: roleMention(role.id),
                allowedMentions: {
                    parse: ['roles'],
                },
            });
        }

        const sentAnnouncement = await channel.send({ embeds: [announcement] });

        if (
            sentAnnouncement.crosspostable === true
            && interaction.options.getBoolean('crosspost', false) !== false
        ) {
            await sentAnnouncement.crosspost();
        }

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            'Published announcement!',
        );

        const successEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsSendAnnouncementsSuccessTitle'))
            .setDescription(i18n.getMessage('commandsSendAnnouncementsSuccessDescription'));

        await previewButton.update({
            embeds: [successEmbed],
            components: disabledRows,
        });
    }
}
