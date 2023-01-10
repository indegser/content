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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const {
    data: { items = [] },
  } = await fetchYoutube();

  const promises = items.map((item) => {
    if (!item.snippet) return;
    return notion.pages.create({
      parent: { database_id: '22bb63060d624e398960b42c7afb7348' },
      cover: {
        type: 'external',
        external: { url: item.snippet.thumbnails?.maxres?.url || '' },
      },
      properties: {
        title: [{ text: { content: item.snippet.title || '' } }],
        Description: [{ text: { content: item.snippet.description || '' } }],
      },
    });
  });

  const result = await Promise.all(promises);

  res.json(result.map((item) => item?.id));
}
