export type PaginatedResponse<T, M = {}> = {
    data: T[];
    meta: M & {
      current_page: number;
      from: number;
      last_page: number;
      path: string;
      per_page: number;
      to: number;
      total: number;
      links: PaginatedLink[];
    }
    links: {
      first: string | null;
      last: string | null;
      next: string | null;
      prev: string | null;
    }
  }
  
  export type PaginatedLink = {
    url: string;
    label: string;
    active: boolean;
  }
  