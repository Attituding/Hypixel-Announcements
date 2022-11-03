import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type CommandInteraction,
    Constants,
    Constants as DiscordConstants,
    Formatters,
    MessageActionRow,
    MessageButton,
    type MessageComponentInteraction,
    MessageEmbed,
    type NewsChannel,
} from 'discord.js';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { awaitComponent, disableComponents, interactionLogContext } from '../utility/utility';

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
                    type: Constants.ApplicationCommandOptionTypes.CHANNEL,
                    channel_types: [
                        Constants.ChannelTypes.GUILD_NEWS,
                        Constants.ChannelTypes.GUILD_TEXT,
                    ],
                    required: true,
                },
                {
                    name: 'title',
                    description: 'The title for the embed',
                    type: Constants.ApplicationCommandOptionTypes.STRING,
                    required: true,
                },
                {
                    name: 'description',
                    description: 'The description for the embed',
                    type: Constants.ApplicationCommandOptionTypes.STRING,
                    required: true,
                },
                {
                    name: 'image',
                    description: 'The image for the embed',
                    type: Constants.ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'url',
                    description: 'The url for the embed',
                    type: Constants.ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'author',
                    description: 'The author of the announcement',
                    type: Constants.ApplicationCommandOptionTypes.STRING,
                    required: false,
                },
                {
                    name: 'role',
                    description: 'The role to mention with the announcement',
                    type: Constants.ApplicationCommandOptionTypes.ROLE,
                    required: false,
                },
                {
                    name: 'crosspost',
                    description: 'Whether to crosspost the announcement (default to true)',
                    type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
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

        const channel = interaction.options.getChannel('channel', true) as NewsChannel;

        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const image = interaction.options.getString('image', false);
        const url = interaction.options.getString('url', false);
        const author = interaction.options.getString('author', false);

        const announcement = new MessageEmbed()
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

        const button = new MessageActionRow().setComponents(
            new MessageButton()
                .setCustomId('true')
                .setLabel(i18n.getMessage('commandsSendAnnouncementsPreviewButtonLabel'))
                .setStyle(DiscordConstants.MessageButtonStyles.PRIMARY),
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
            componentType: Constants.MessageComponentTypes.BUTTON,
            filter: componentFilter,
            idle: Time.Minute,
        });

        if (previewButton === null) {
            this.container.logger.info(
                interactionLogContext(interaction),
                `${this.constructor.name}:`,
                'Ran out of time.',
            );

            await interaction.editReply({
                components: disabledRows,
            });

            return;
        }

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            'Sending message...',
        );

        const role = interaction.options.getRole('role', false);

        if (role !== null) {
            await channel.send({
                content: Formatters.roleMention(role.id),
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
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
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
