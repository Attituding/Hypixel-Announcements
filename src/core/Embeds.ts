import { EmbedBuilder } from 'discord.js';
import type { RSS } from '../@types/RSS';
import { Base } from '../structures/Base';

export class Embeds extends Base {
    public create(data: RSS) {
        const posts: EmbedBuilder[] = [];

        data.items.forEach((item) => {
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: item.author,
                })
                .setDescription(item.content)
                .setFooter({
                    text: data.title,
                    iconURL:
                        'https://cdn.discordapp.com/icons/489529070913060867/f7df056de15eabfc0a0e178d641f812b.webp?size=128',
                })
                .setTitle(item.title)
                .setURL(item.link);

            const mainImage = item.attachments[0];

            if (typeof mainImage !== 'undefined') {
                embed.setImage(mainImage);
            }

            posts.unshift(embed);
        });

        return posts;
    }
}
