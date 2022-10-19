// Typings for RSS 2.0 and the elements that XenForo/Hypixel uses

export interface BaseRss {
    ['?xml']: {
        version: string;
        encoding: string;
    };
    rss: {
        channel: Channel;
        version: string;
        ['xmls:atom']?: string;
        ['xmls:dc']?: string;
        ['xmls:content']?: string;
        ['xmls:slash']?: string;
    };
}

export interface Channel {
    title: TextNode;
    description: TextNode;
    pubDate?: TextNode;
    lastBuildDate?: TextNode;
    generator?: TextNode;
    link: TextNode;
    item?: Item | Item[];
}

export interface Item {
    title: TextNode;
    pubDate: TextNode;
    link: TextNode;
    guid: TextNode;
    author: TextNode;
    category: TextNode;
    ['dc:creator']: TextNode;
    ['content:encoded']: TextNode;
    ['slash:comments']: TextNode;
}

interface TextNode {
    text: string;
}
