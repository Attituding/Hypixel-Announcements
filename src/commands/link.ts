import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Logger } from '../structures/Logger';
import { Options } from '../utility/Options';

export class LinkCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'link',
            description: 'Links/unlinks a message Id to an Id',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'OwnerOnly'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'link',
                    type: ApplicationCommandOptionType.Subcommand,
                    description: 'Links a message Id to an Id',
                    options: [
                        {
                            name: 'category',
                            description: 'Used for the link option',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'News and Announcements',
                                    value: 'News and Announcements',
                                },
                                {
                                    name: 'SkyBlock Patch Notes',
                                    value: 'SkyBlock Patch Notes',
                                },
                                {
                                    name: 'Moderation Information and Changes',
                                    value: 'Moderation Information and Changes',
                                },
                            ],
                        },
                        {
                            name: 'id',
                            description: 'The Id to link the message to',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'message',
                            description: 'The message to link to the Id',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'unlink',
                    description: 'Unlinks a message Id from an Id',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'category',
                            description: 'Used for the link option',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'News and Announcements',
                                    value: 'News and Announcements',
                                },
                                {
                                    name: 'SkyBlock Patch Notes',
                                    value: 'SkyBlock Patch Notes',
                                },
                                {
                                    name: 'Moderation Information and Changes',
                                    value: 'Moderation Information and Changes',
                                },
                            ],
                        },
                        {
                            name: 'id',
                            type: ApplicationCommandOptionType.String,
                            description: 'The Id to unlink the message from',
                            required: true,
                        },
                    ],
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { i18n } = interaction;

        const category = interaction.options.getString('category', true);
        const id = interaction.options.getString('id', true);
        const message = interaction.options.getString('message', false);

        await this.container.database.announcements.update({
            data: {
                message: message,
            },
            where: {
                category_id: {
                    category: category,
                    id: id,
                },
            },
        });

        const linkEmbed = new BetterEmbed(interaction).setColor(Options.colorsNormal);

        if (interaction.options.getSubcommand() === 'link') {
            linkEmbed
                .setTitle(i18n.getMessage('commandsLinkLinkedTitle'))
                .setDescription(i18n.getMessage('commandsLinkLinkedDescription', [id, message!]));
        } else {
            linkEmbed
                .setTitle(i18n.getMessage('commandsLinkUnlinkedTitle'))
                .setDescription(i18n.getMessage('commandsLinkUnlinkedDescription', [id]));
        }

        this.container.logger.info(
            this,
            Logger.interactionLogContext(interaction),
            interaction.options.getSubcommand() === 'link'
                ? `Linked the Id ${id} to ${message}.`
                : `Unlinked the Id ${id} from a message.`,
        );

        await interaction.editReply({ embeds: [linkEmbed] });
    }
}
