import { isFullPage } from '@notionhq/client';
import {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

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

export const notionUtils = {
  getTitleList,
};
