import { XMLParser } from 'fast-xml-parser';
import Turndown from 'turndown';
import type { BaseRss } from '../@types/BaseRss';
import { Base } from '../structures/Base';

export class Parser extends Base {
    validation: {
        version: string;
        namespaces: string[];
    };

    turndown: Turndown;

    parser: XMLParser;

    public constructor() {
        super();

        this.validation = {
            version: '2.0',
            namespaces: ['xmlns:atom', 'xmlns:dc', 'xmlns:content', 'xmlns:slash'],
        };

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

        this.parser = new XMLParser({
            alwaysCreateTextNode: true,
            attributeNamePrefix: '',
            ignoreAttributes: false,
            parseTagValue: false,
            textNodeName: 'text',
        });
    }

    public parse(xml: string) {
        // Parsing taken and modified from https://github.com/nasa8x/rss-to-json under the MIT License

        // &#8203; seems to add a lot of random new lines
        const rss = this.parser.parse(xml.replaceAll('&#8203;', '')) as BaseRss;

        this.validate(rss);

        return rss;
    }

    public validate(rss: BaseRss) {
        const { namespaces, version } = this.validation;

        if (rss.rss.version !== version) {
            const message = `Expected RSS version ${version}; got version ${rss.rss.version}.`;

            this.container.logger.error(this, message);

            throw new Error(message);
        }

        const missingNamespaces = namespaces.filter(
            (value) => typeof rss.rss[value as keyof typeof rss.rss] === 'undefined',
        );

        if (missingNamespaces.length !== 0) {
            const message = `Expected ${
                namespaces.length
            } RSS namespaces; missing ${missingNamespaces.join(', ')}.`;

            this.container.logger.error(this, message);

            throw new Error(message);
        }
    }
}
