import Turndown from 'turndown';
import type { BaseRss } from '../@types/BaseRss';
import { Base } from '../structures/Base';

export class Normalize extends Base {
    public readonly turndown: Turndown;

    public constructor() {
        super();

        this.turndown = new Turndown({
            codeBlockStyle: 'fenced',
        })
            .addRule('horizontal', {
                filter: ['hr'],
                replacement: () => '',
            })
            .addRule('header', {
                filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                replacement: (content) => `**${content}**`,
            })
            .addRule('list', {
                filter: ['li'],
                replacement: (content) => `• ${content.replaceAll('\n', '')}\n`,
            });
    }

    public normalize(baseRSS: BaseRss) {
        // Parsing taken and modified from https://github.com/nasa8x/rss-to-json under the MIT License

        let { channel } = baseRSS.rss;

        if (Array.isArray(channel)) {
            [channel] = channel;
        }

        if (typeof channel.item === 'undefined') {
            const message = 'Expected <Channel>.item to be an object or array; received undefined';

            this.container.logger.error(`${this.constructor.name}:`, message);

            throw new Error(message);
        }

        const items = Array.isArray(channel.item) ? channel.item : [channel.item];

        const rss = {
            title: channel.title.text,
            description: channel.description.text,
            link: channel.link.text,
            items: items.map((item) => {
                const obj = {
                    id: item.guid.text,
                    title: item.title.text,
                    link: item.link.text,
                    author: item['dc:creator'].text,
                    published: Date.parse(item.pubDate.text),
                    edited: false,
                    category: item.category.text,
                    comments: Number(item['slash:comments'].text) ?? 0,
                    content: item['content:encoded'].text,
                    attachments: [] as string[],
                };

                obj.attachments = this.matchAttachments(obj.content);

                obj.content = this.turndown.turndown(obj.content);

                obj.content = this.contentFix(obj.content);

                // Icon/Emoji handling
                obj.content = [...obj.content.matchAll(/!\[(\S+)\]\(.*?\)/gm)].reduce(
                    (acc, current) => acc.replace(current[0]!, current[1]!),
                    obj.content,
                );

                return obj;
            }),
        };

        return rss;
    }

    private contentFix(content: string): string {
        return content
            .replace(/^!?\[\S*?\]\(.+\)/, '') // Remove the first image at the beginning, if any
            .replaceAll(/\n!\[\S*?\]/gm, '[Image]') // Replace image hyperlink text with [Image]
            .replaceAll(/ "\S+\.(png|jpg)"/gm, '') // Replace image descriptions at the end of hyperlinks
            .replaceAll('  \n', '\n') // Remove weird newlines
            .replace(/\n{3,}/gm, '\n\n') // Remove extra newlines
            .replace(/(^\n+|(\n+)+$)/g, '') // Remove newlines at the end and start
            .replace(/\*\*\n\n•/gm, '**\n•') // Remove weird newlines with lists
            .replace(/\n\n\[Read more\]\(.+\)/m, ''); // Remove "Read More" text
    }

    private matchAttachments(content: string): string[] {
        return [
            ...content.matchAll(/https:\/\/staticassets\.hypixel\.net\/(\S)*\.(png|jpg)/gm),
            ...content.matchAll(/https:\/\/i\.imgur\.com\/(\S)*\.(png|jpg)/gm),
            ...content.matchAll(/https:\/\/hypixel\.net\/attachments\/(\S)*\//gm),
        ]
            .sort((primary, secondary) => primary.index! - secondary.index!)
            .map((array) => array[0]!);
    }
}
