import { isFullPage } from '@notionhq/client';
import { notion } from '@src/sdks/notion';
import { twitter } from '@src/sdks/twitter';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = string[];

function fetchFromTwitter() {
  return twitter.tweets.usersIdLikedTweets(process.env.TWITTER_USER_ID, {
    expansions: ['author_id'],
    'user.fields': ['description'],
    'tweet.fields': ['created_at'],
  });
}

async function fetchFromNotion() {
  const { results } = await notion.databases.query({
    database_id: '57dae7d18f6d4045956e894a03d6c81f',
    page_size: 100,
    sorts: [{ property: 'Index', direction: 'descending' }],
  });

  return results
    .map((result) => {
      if (!result || !isFullPage(result)) return;

      if (result.properties.ID['type'] !== 'title') return;

      return result.properties.ID.title?.[0].plain_text;
    })
    .filter(Boolean) as string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const ids = await fetchFromNotion();
  const { data: tweets = [], includes } = await fetchFromTwitter();

  const newLikes = tweets.filter((tweet) => {
    return !ids.includes(tweet.id);
  });

  const users = includes?.users || [];

  const now = Date.now();
  const result = newLikes.map((tweet, i) => {
    const { id, text, author_id, created_at } = tweet;
    const user = users.find((user) => user.id === author_id);
    const data = {
      id,
      index: i + 1,
      text,
      url: `https://twitter.com/${user?.username}/status/${id}`,
      user,
      created_at,
    };

    notion.pages.create({
      parent: { database_id: '57dae7d18f6d4045956e894a03d6c81f' },
      properties: {
        ID: {
          title: [{ text: { content: data.id } }],
        },
        URL: {
          url: data.url,
        },
        Index: {
          number: now + 0.001 * (1000 - data.index),
        },
        Text: {
          rich_text: [{ text: { content: data.text } }],
        },
      },
    });

    return data;
  });

  res.status(200).json(result.map((item) => item.id));
}
