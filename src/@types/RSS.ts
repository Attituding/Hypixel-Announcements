export interface RSS {
    title: string;
    description: string;
    link: string;
    items: {
        id: string;
        title: string;
        link: string;
        author: string;
        published: number;
        edited: boolean;
        category: string;
        comments: number;
        content: string;
        attachments: string[];
    }[];
}
