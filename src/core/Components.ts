import { Constants, MessageActionRow, MessageButton } from 'discord.js';
import type { RSS } from '../@types/RSS';
import { Base } from '../structures/Base';

export class Components extends Base {
    public create(data: RSS) {
        const rows: MessageActionRow[] = [];

        data.items.forEach((item) => {
            const button = new MessageButton()
                .setLabel(this.container.i18n.getMessage('coreComponentsButtonsReadMoreLabel'))
                .setStyle(Constants.MessageButtonStyles.LINK)
                .setURL(item.link);

            const row = new MessageActionRow().setComponents(button);

            rows.unshift(row);
        });

        return rows;
    }
}
