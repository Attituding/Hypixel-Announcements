export interface CustomId {
    event: string;
    value: string;
}

export class CustomId {
    public static create(customId: CustomId) {
        return JSON.stringify(customId);
    }

    public static parse(customId: string) {
        return JSON.parse(customId) as CustomId;
    }
}
