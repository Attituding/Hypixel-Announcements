import {
    type ApplicationCommandRegistry,
    BucketScope,
    Command,
    RegisterBehavior,
} from '@sapphire/framework';
import { type CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { interactionLogContext } from '../utility/utility';

export class LinkCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'link',
            description: 'Links/unlinks a message ID to an ID',
            cooldownLimit: 0,
            cooldownDelay: 0,
            cooldownScope: BucketScope.User,
            preconditions: [
                'Base',
                'DevMode',
                'OwnerOnly',
            ],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand({
            name: 'link',
            description: 'Links/unlinks a message ID to an ID',
            options: [
                {
                    name: 'link',
                    type: ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Links a message ID to an ID',
                    options: [
                        {
                            name: 'category',
                            description: 'Used for the link option',
                            type: ApplicationCommandOptionTypes.STRING,
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
                            description: 'The ID to link the message to',
                            type: ApplicationCommandOptionTypes.STRING,
                            required: true,
                        },
                        {
                            name: 'message',
                            description: 'The message to link to the ID',
                            type: ApplicationCommandOptionTypes.STRING,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'unlink',
                    description: 'Unlinks a message ID from an ID',
                    type: ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'category',
                            description: 'Used for the link option',
                            type: ApplicationCommandOptionTypes.STRING,
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
                            type: ApplicationCommandOptionTypes.STRING,
                            description: 'The ID to unlink the message from',
                            required: true,
                        },
                    ],
                },
            ],
        }, {
            guildIds: this.options.preconditions?.find(
                (condition) => condition === 'OwnerOnly',
            )
                ? this.container.config.ownerGuilds
                : undefined,
            registerCommandIfMissing: true,
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
        });
    }

    public async chatInputRun(interaction: CommandInteraction) {
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

        const linkEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal);

        if (interaction.options.getSubcommand() === 'link') {
            linkEmbed
                .setTitle(i18n.getMessage('commandsLinkLinkedTitle'))
                .setDescription(
                    i18n.getMessage(
                        'commandsLinkLinkedDescription', [
                            id,
                            message!,
                        ],
                    ),
                );
        } else {
            linkEmbed
                .setTitle(i18n.getMessage('commandsLinkUnlinkedTitle'))
                .setDescription(
                    i18n.getMessage(
                        'commandsLinkUnlinkedDescription', [
                            id,
                        ],
                    ),
                );
        }

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            interaction.options.getSubcommand() === 'link'
                ? `Linked the ID ${id} to ${message}.`
                : `Unlinked the ID ${id} from a message.`,
        );

        await interaction.editReply({ embeds: [linkEmbed] });
    }
}