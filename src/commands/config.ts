import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import { type CommandInteraction, Constants } from 'discord.js';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import { interactionLogContext } from '../utility/utility';

export class ConfigCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'config',
            description: 'Configure and change settings',
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
                    name: 'core',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Toggle the core',
                },
                {
                    name: 'devmode',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Toggle Developer Mode',
                },
                {
                    name: 'interval',
                    description: 'Set the RSS fetch interval',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'milliseconds',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The interval in milliseconds',
                            required: true,
                            minValue: 60,
                            maxValue: 3600000,
                        },
                    ],
                },
                {
                    name: 'loglevel',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Set the minimum severity for logs to appear',
                    options: [
                        {
                            name: 'level',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The minimum level for logs to appear',
                            required: true,
                            choices: [
                                {
                                    name: 'Trace',
                                    value: 10,
                                },
                                {
                                    name: 'Debug',
                                    value: 20,
                                },
                                {
                                    name: 'Info',
                                    value: 30,
                                },
                                {
                                    name: 'Warn',
                                    value: 40,
                                },
                                {
                                    name: 'Error',
                                    value: 50,
                                },
                                {
                                    name: 'Fatal',
                                    value: 60,
                                },
                                {
                                    name: 'None',
                                    value: 100,
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'ownerguilds',
                    description: 'Set the guild(s) where owner commands should be set',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'guilds',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
                            description: 'The Ids of the guilds separated by a comma (no spaces)',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'owners',
                    description: 'Set the application owner(s)',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'owners',
                            type: Constants.ApplicationCommandOptionTypes.STRING,
                            description: 'The Ids of the owners separated by a comma (no spaces)',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'requesttimeout',
                    description: 'Set the request timeout before an abort error is thrown',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'milliseconds',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The timeout in milliseconds',
                            required: true,
                            minValue: 0,
                            maxValue: 100000,
                        },
                    ],
                },
                {
                    name: 'requestretrylimit',
                    description: 'Set the number of request retries before throwing',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            name: 'limit',
                            type: Constants.ApplicationCommandOptionTypes.INTEGER,
                            description: 'The number of retries',
                            required: true,
                            minValue: 0,
                            maxValue: 100,
                        },
                    ],
                },
                {
                    name: 'view',
                    description: 'View the current configuration',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'core':
                await this.core(interaction);
                break;
            case 'devmode':
                await this.devModeCommand(interaction);
                break;
            case 'interval':
                await this.interval(interaction);
                break;
            case 'loglevel':
                await this.logLevel(interaction);
                break;
            case 'restrequesttimeout':
                await this.requestTimeout(interaction);
                break;
            case 'retrylimit':
                await this.requestRetryLimit(interaction);
                break;
            case 'ownerguilds':
                await this.ownerGuilds(interaction);
                break;
            case 'owners':
                await this.owners(interaction);
                break;
            case 'view':
                await this.view(interaction);
                break;
            default:
                throw new RangeError();
        }
    }

    public async core(interaction: CommandInteraction) {
        const { i18n } = interaction;

        this.container.config.core = !this.container.config.core;

        await this.container.database.config.update({
            data: {
                core: this.container.config.core,
            },
            where: {
                index: 0,
            },
        });

        const coreEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigCoreTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigCoreDescription', [
                    this.container.config.core === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                ]),
            );

        await interaction.editReply({
            embeds: [coreEmbed],
        });

        const state = this.container.config.core === true ? 'on' : 'off';

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The core is now ${state}.`,
        );
    }

    public async devModeCommand(interaction: CommandInteraction) {
        const { i18n } = interaction;

        this.container.config.devMode = !this.container.config.devMode;

        await this.container.database.config.update({
            data: {
                devMode: this.container.config.devMode,
            },
            where: {
                index: 0,
            },
        });

        const devModeEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigDevModeTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigDevModeDescription', [
                    this.container.config.devMode === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                ]),
            );

        await interaction.editReply({ embeds: [devModeEmbed] });

        const state = this.container.config.devMode === true ? 'on' : 'off';

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `Developer Mode is now ${state}.`,
        );
    }

    public async interval(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const milliseconds = interaction.options.getInteger('milliseconds', true);

        this.container.config.interval = milliseconds;

        await this.container.database.config.update({
            data: {
                interval: this.container.config.interval,
            },
            where: {
                index: 0,
            },
        });

        const intervalEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigIntervalTitle'))
            .setDescription(i18n.getMessage('commandsConfigIntervalDescription', [milliseconds]));

        await interaction.editReply({ embeds: [intervalEmbed] });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The interval is now ${milliseconds}ms.`,
        );
    }

    public async logLevel(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const level = interaction.options.getInteger('level', true);

        this.container.config.logLevel = level;

        // @ts-ignore
        this.container.logger.level = this.container.config.logLevel;

        await this.container.database.config.update({
            data: {
                logLevel: this.container.config.logLevel,
            },
            where: {
                index: 0,
            },
        });

        const logLevelEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigLogLevelTitle'))
            .setDescription(i18n.getMessage('commandsConfigLogLevelDescription', [level]));

        await interaction.editReply({ embeds: [logLevelEmbed] });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The minimum log level for logs to appear is now ${level}.`,
        );
    }

    public async ownerGuilds(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const guilds = interaction.options.getString('guilds', true).split(',');

        this.container.config.ownerGuilds = guilds;

        await this.container.database.config.update({
            data: {
                ownerGuilds: this.container.config.ownerGuilds,
            },
            where: {
                index: 0,
            },
        });

        const ownerGuildsEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigOwnerGuildsTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigOwnerGuildsDescription', [guilds.join(', ')]),
            );

        await interaction.editReply({ embeds: [ownerGuildsEmbed] });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The owner guilds are now ${guilds.join(', ')}.`,
        );
    }

    public async owners(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const owners = interaction.options.getString('owners', true).split(',');

        this.container.config.owners = owners;

        await this.container.database.config.update({
            data: {
                owners: this.container.config.owners,
            },
            where: {
                index: 0,
            },
        });

        const ownersEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigOwnersTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigOwnersDescription', [owners.join(', ')]),
            );

        await interaction.editReply({ embeds: [ownersEmbed] });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The owners are now ${owners.join(', ')}.`,
        );
    }

    public async requestTimeout(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const milliseconds = interaction.options.getInteger('milliseconds', true);

        this.container.config.requestTimeout = milliseconds;

        await this.container.database.config.update({
            data: {
                requestTimeout: this.container.config.requestTimeout,
            },
            where: {
                index: 0,
            },
        });

        const requestTimeoutEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigRequestTimeoutTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigRequestTimeoutDescription', [milliseconds]),
            );

        await interaction.editReply({
            embeds: [requestTimeoutEmbed],
        });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The request timeout is now ${milliseconds}ms.`,
        );
    }

    public async requestRetryLimit(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const limit = interaction.options.getInteger('limit', true);

        this.container.config.requestRetryLimit = limit;

        await this.container.database.config.update({
            data: {
                requestRetryLimit: this.container.config.requestRetryLimit,
            },
            where: {
                index: 0,
            },
        });

        const requestRetryLimitEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigRequestRetryLimitTitle'))
            .setDescription(i18n.getMessage('commandsConfigRequestRetryLimitDescription', [limit]));

        await interaction.editReply({ embeds: [requestRetryLimitEmbed] });

        this.container.logger.info(
            interactionLogContext(interaction),
            `${this.constructor.name}:`,
            `The request retry limit is now ${limit}.`,
        );
    }

    public async view(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const { config } = this.container;

        const viewEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsConfigViewTitle'))
            .setDescription(
                i18n.getMessage('commandsConfigViewDescription', [
                    config.core === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                    config.devMode === true
                        ? i18n.getMessage('on')
                        : i18n.getMessage('off'),
                    config.interval,
                    config.logLevel,
                    config.ownerGuilds.join(', '),
                    config.owners.join(', '),
                    config.requestTimeout,
                    config.requestRetryLimit,
                ]),
            );

        await interaction.editReply({ embeds: [viewEmbed] });
    }
}
