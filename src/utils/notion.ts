import { isFullPage } from '@notionhq/client';
import {
  ListBlockChildrenParameters,
  PageObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { notion } from '@src/sdks/notion';

const getTitleList = (
  results: Array<PageObjectResponse | PartialPageObjectResponse>
) => {
  return results
    .map((result) => {
      if (!result || !isFullPage(result)) return;

      for (const key in result.properties) {
        const property = result.properties[key];
        if (property.type === 'title') {
          return property.title[0].plain_text;
        }
      }
    })
    .filter(Boolean) as string[];
};

const getBlock = async (id: string) => {
  const fetchNextPage = async (args: ListBlockChildrenParameters) => {
    const result = await notion.blocks.children.list(args);

    if (result.has_more) {
      const nextResult = await fetchNextPage({
        ...args,
        start_cursor: result.next_cursor || undefined,
      });
      result.results = [...result.results, ...nextResult.results];
    }

    return result;
  };

  return fetchNextPage({ block_id: id });
};

export const notionUtils = {
  getTitleList,
  getBlock,
};
