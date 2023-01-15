import { notion } from '@src/sdks/notion';
import { youtube } from '@src/sdks/youtube';
import { notionUtils } from '@src/utils/notion';
import { youtube_v3 } from 'googleapis';
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

  return notionUtils.getTitleList(results);
}

function getThumbnailUrl(
  thumbnails: youtube_v3.Schema$ThumbnailDetails | undefined
) {
  const resolutions = ['maxres', 'high', 'medium', 'default'] as const;

  if (!thumbnails) return '';

  for (const resolution of resolutions) {
    const thumbnail = thumbnails[resolution];
    if (thumbnail) return thumbnail.url || '';
  }

  return '';
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

    const thumbnailUrl = getThumbnailUrl(item.snippet.thumbnails);

    return notion.pages.create({
      parent: { database_id: '22bb63060d624e398960b42c7afb7348' },
      cover: {
        external: { url: thumbnailUrl },
      },
      properties: {
        Title: { title: [{ text: { content: item.snippet.title || '' } }] },
        Description: {
          rich_text: [
            {
              text: { content: item.snippet.description?.slice(0, 2000) || '' },
            },
          ],
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
