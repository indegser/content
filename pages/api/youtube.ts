import { isFullPage } from '@notionhq/client';
import { notion } from '@src/sdks/notion';
import { youtube } from '@src/sdks/youtube';
import { NextApiRequest, NextApiResponse } from 'next';

type Data = object;

async function fetchYoutube() {
  return youtube.playlistItems.list({
    playlistId: 'PL9NwvAnCybEKcEldIp9NXoOOlDfzzrc4k',
    part: ['snippet', 'contentDetails'],
  });
}

async function fetchFromNotion() {
  const { results } = await notion.databases.query({
    database_id: '22bb63060d624e398960b42c7afb7348',
    page_size: 100,
    sorts: [{ property: 'PublishedAt', direction: 'descending' }],
  });

  return results
    .map((result) => {
      if (!result || !isFullPage(result)) return;

      if (result.properties.Title['type'] !== 'title') return;

      return result.properties.Title.title?.[0].plain_text;
    })
    .filter(Boolean) as string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const {
    data: { items = [] },
  } = await fetchYoutube();

  const notionTitles = await fetchFromNotion();

  const promises = items.map((item) => {
    if (!item.snippet) return;
    const { title = '' } = item.snippet!;

    if (notionTitles.includes(title || '')) return;

    return notion.pages.create({
      parent: { database_id: '22bb63060d624e398960b42c7afb7348' },
      cover: {
        external: { url: item.snippet.thumbnails?.maxres?.url || '' },
      },
      properties: {
        Title: { title: [{ text: { content: item.snippet.title || '' } }] },
        Description: {
          rich_text: [{ text: { content: item.snippet.description || '' } }],
        },
        PublishedAt: {
          date: {
            start: item.snippet.publishedAt!,
          },
        },
      },
    });
  });

  const result = await Promise.all(promises);

  res.json(result.map((item) => item?.id));
}
