import type { PaginatedResponse } from './paginated.types';

export const getNextPage = (lastPage: PaginatedResponse<any>): number | undefined => {
  console.log('nextPage', lastPage)
  return (lastPage.meta.current_page < lastPage.meta.last_page) ? lastPage.meta.current_page + 1 : undefined;
}
