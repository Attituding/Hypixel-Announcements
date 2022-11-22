import { HTTPError } from '../errors/HTTPError';
import { Base } from '../structures/Base';
import { Request } from '../structures/Request';

export class Requests extends Base {
    public async request(url: string) {
        const response = await Request.request(url);

        if (response.ok === false) {
            throw new HTTPError({
                response: response,
                url: url,
            });
        }

        return response.text();
    }
}
