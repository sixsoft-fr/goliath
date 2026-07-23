export type Model = {
    id: number;
    uuid: string;
    slug?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    morph_name: string;
}

export type DynamicModel<T> = Model & T & Record<string, any>;
