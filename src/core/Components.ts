import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { RSS } from '../@types/RSS';
import { Base } from '../structures/Base';

export class Components extends Base {
    public create(data: RSS) {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        data.items.forEach((item) => {
            const button = new ButtonBuilder()
                .setLabel(this.container.i18n.getMessage('coreComponentsButtonsReadMoreLabel'))
                .setStyle(ButtonStyle.Link)
                .setURL(item.link);

            const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button);

            rows.unshift(row);
        });

        return rows;
    }
}
