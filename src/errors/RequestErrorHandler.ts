import { AbortError } from './AbortError';
import { BaseErrorHandler } from './BaseErrorHandler';
import type { Core } from '../core/Core';
import { ErrorHandler } from './ErrorHandler';
import { HTTPError } from './HTTPError';

export class RequestErrorHandler<E> extends BaseErrorHandler<E> {
    public readonly core: Core;

    public constructor(error: E, core: Core) {
        super(error);
        this.core = core;

        const { errors: coreErrors } = this.core;

        if (this.error instanceof AbortError) {
            this.sentry.setSeverity('warning');
            coreErrors.addAbort();
        } else if (this.error instanceof HTTPError) {
            this.sentry.setSeverity('warning');
            coreErrors.addHTTP();
        } else {
            coreErrors.addGeneric();
        }

        this.sentry.requestContext(this.error, this.core);
    }

    public init() {
        try {
            if (this.error instanceof AbortError) {
                this.log(this.error.name);
                this.sentry.captureException(this.error);
            } else {
                this.report();
            }
        } catch (error) {
            new ErrorHandler(error, this.incidentId).init();
        }
    }
}
