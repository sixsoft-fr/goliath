export type Resource<T> = {
    data: T;
}

export type TableQueries = {
    total?: number
    page?: number
    per_page?: number
    query?: string
    filters?: Record<string, unknown>
    sort?: string
}
