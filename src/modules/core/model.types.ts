export type Model = {
    readonly id: number;
    readonly uuid: string;
    slug?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    readonly morph_name: string;
}

export type DynamicModel<T> = Model & T & Record<string, unknown>;
