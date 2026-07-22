export type Model = {
    id: number;
    uuid: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export type DynamicModel<T> = Model & T & Record<string, any>;
