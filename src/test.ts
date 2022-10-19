import { Normalize } from './core/Normalize';
import { Parser } from './core/Parser';

const xml = `
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/">
  <channel>
    <title>News and Announcements</title>
    <description>Important announcements regarding the network are posted in this forum.

If you click the "Watch" button in this forum you can be alerted whenever a new announcement is posted!</description>
    <pubDate>Wed, 22 Jun 2022 19:32:03 +0000</pubDate>
    <lastBuildDate>Wed, 22 Jun 2022 19:32:03 +0000</lastBuildDate>
    <generator>Hypixel - Minecraft Server and Maps</generator>
    <link>https://hypixel.net/</link>
    <atom:link rel="self" type="application/rss+xml" href="https://hypixel.net/forums/news-and-announcements.4/index.rss"/>
    <item>
      <title>Summer Event and Sale 2022</title>
      <pubDate>Thu, 23 Jun 2022 18:42:00 +0000</pubDate>
      <link>https://hypixel.net/threads/summer-event-and-sale-2022.4994707/</link>
      <guid isPermaLink="false">4994707</guid>
      <author>invalid@example.com (Hypixel Team)</author>
      <category domain="https://hypixel.net/forums/news-and-announcements.4/"><![CDATA[News and Announcements]]></category>
      <dc:creator>Hypixel Team</dc:creator>
      <content:encoded><![CDATA[<div class="bbWrapper"><a href="https://store.hypixel.net/sum2022main" target="_blank" class="link link--external" rel="nofollow ugc noopener">
	<img src="https://staticassets.hypixel.net/news/687eecc3-aa85-4c5c-b35d-59b2c53a95a1.summer-forums.png" data-url="https://staticassets.hypixel.net/news/687eecc3-aa85-4c5c-b35d-59b2c53a95a1.summer-forums.png" class="bbImage " loading="lazy"
		 style="" width="" height="" />

</a><br />
<br />
Hey all!<br />
<br />
<b>The Hypixel Suummer Event</b> is upon us and we have some big changes hopefully making summer a little cooler (pun intended) for everyone! We've put together some new content for players to enjoy on the server during the summer months! Here's what's included:<br />
<ul>
<li data-xf-list-type="ul"><span style="font-size: 18px"><i><span style="color: rgb(184, 49, 47)"><b><i>Summer Sale - up to 25% off on the in-game store!</i></b></span></i></span>...</li>
</ul><br />
<a href="https://hypixel.net/threads/summer-event-and-sale-2022.4994707/" class="link link--internal">Read more</a></div>]]></content:encoded>
      <slash:comments>18</slash:comments>
    </item>
  </channel>
</rss>
`;

const rss = new Parser().parse(xml);
const output = new Normalize().normalize(rss);

console.log(JSON.stringify(output));
