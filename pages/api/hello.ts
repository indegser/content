import { twitter } from '@src/sdks/twitter';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = Awaited<ReturnType<typeof fetcher>>;

function fetcher() {
  return twitter.tweets.findTweetById('20');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const tweet = await fetcher();
  res.status(200).json(tweet);
}
