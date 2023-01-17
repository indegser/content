import { notion } from '@src/sdks/notion';
import { supabase } from '@src/sdks/supabase';
import { NextApiRequest, NextApiResponse } from 'next';

type Result = {
  id: string;
  created_time: string;
  last_edited_time: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { results } = (await notion.databases.query({
    database_id: '82649fda5ba84801a464d7ef2f7552b3',
    page_size: 100,
    filter: {
      property: '_status',
      select: {
        equals: 'Production',
      },
    },
  })) as { results: Result[] };

  await supabase
    .from('journal')
    .delete()
    .not('id', 'in', `(${results.map((result) => result.id).join(',')})`);

  const values = results.map((result) => {
    const payload = {
      id: result.id,
      data: result,
      created_time: result.created_time,
      last_edited_time: result.last_edited_time,
    };

    return payload;
  });

  await supabase.from('journal').upsert(values);

  res.end();
}
