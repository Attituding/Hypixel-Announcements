import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';
import { Options } from '../utility/Options';

export class TestCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'test',
            description: 'Does stuff',
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
                    name: 'delete',
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    description: 'Delete all of your data',
                    options: [
                        {
                            name: 'view',
                            description: 'Returns a file with all of your data',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'command',
                                    type: ApplicationCommandOptionType.String,
                                    description:
                                        'A command to get info about. This parameter is completely optional',
                                    required: false,
                                },
                            ],
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
        await interaction.followUp({
            content: 'e',
        });

        throw new TypeError();
    }
}
