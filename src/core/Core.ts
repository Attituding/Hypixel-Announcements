import { setTimeout } from 'node:timers/promises';
import { Changes } from './Changes';
import { Components } from './Components';
import { Dispatch } from './Dispatch';
import { Embeds } from './Embeds';
import { Errors } from './Errors';
import { ErrorHandler } from '../errors/ErrorHandler';
import { HTTPError } from '../errors/HTTPError';
import { RequestErrorHandler } from '../errors/RequestErrorHandler';
import { Normalize } from './Normalize';
import { Parser } from './Parser';
import { Requests } from './Requests';
import { Base } from '../structures/Base';
import { Performance } from '../structures/Performance';
import { Options } from '../utility/Options';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    public readonly changes: Changes;

    public readonly components: Components;

    public readonly dispatch: Dispatch;

    public readonly embeds: Embeds;

    public readonly errors: Errors;

    public readonly format: Normalize;

    public readonly parser: Parser;

    public readonly requests: Requests;

    public readonly performance: Performance;

    public uses: number;

    public constructor() {
        super();

        this.changes = new Changes();
        this.components = new Components();
        this.dispatch = new Dispatch();
        this.embeds = new Embeds();
        this.errors = new Errors();
        this.format = new Normalize();
        this.parser = new Parser();
        this.requests = new Requests();

        this.performance = new Performance();
        this.uses = 0;
    }

    public async init() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                await this.checkSystem();
            } catch (error) {
                new ErrorHandler(error).init();
            }
        }
    }

    private async checkSystem() {
        if (this.errors.isTimeout()) {
            await setTimeout(this.errors.getTimeout());
        }

        if (this.container.config.core === false) {
            await setTimeout(Options.coreDisabledTimeout);
            return;
        }

        const urls = this.container.categories.map((category) => category.url);

        if (urls.length === 0) {
            await setTimeout(Options.coreDisabledTimeout);
            return;
        }

        await this.refresh(urls);
    }

    private async refresh(urls: string[]) {
        // Array Iterations do not allow async
        // eslint-disable-next-line no-restricted-syntax
        for (const url of urls) {
            try {
                this.performance.set('fetch');
                const xml = await this.requests.request(url);

                this.performance.set('parse');
                const rss = this.parser.parse(xml);
                const rssJSON = this.format.normalize(rss);

                this.performance.set('check');
                const changes = await this.changes.check(rssJSON);

                this.performance.set('send');
                if (changes.items.length > 0) {
                    const newPosts = changes.items.filter((item) => item.edited === false);

                    const editedPosts = changes.items.filter((item) => item.edited === true);

                    const postLinks = newPosts.map((post) => post.link).join(', ');

                    this.container.logger.info(
                        this,
                        `New Posts Found: ${newPosts.length} ${postLinks}.`,
                        newPosts.length > 0 ? `Links: ${postLinks}.` : '',
                    );

                    const editedPostLinks = newPosts.map((post) => post.link).join(', ');

                    this.container.logger.info(
                        this,
                        `Edited Posts Found: ${editedPosts.length}.`,
                        editedPosts.length > 0 ? `Links: ${editedPostLinks}.` : '',
                    );

                    const embeds = this.embeds.create(changes);
                    const components = this.components.create(changes);
                    await this.dispatch.dispatch(embeds, components, changes);

                    this.container.logger.info(
                        this,
                        `Finished dispatching messages from ${changes.title}.`,
                    );
                }

                this.performance.addDataPoint();
                this.uses += 1;
            } catch (error) {
                if (error instanceof HTTPError) {
                    new RequestErrorHandler(error, this).init();
                } else {
                    this.errors.addGeneric();
                    new ErrorHandler(error).init();
                }

                const regularInterval = this.container.config.interval
                / this.container.categories.length;

                if (regularInterval > this.errors.getTimeout()) {
                    await setTimeout(regularInterval);
                }

                return;
            }

            await setTimeout(this.container.config.interval / this.container.categories.length);
        }
    }
}
