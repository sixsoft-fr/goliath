import { api } from "@/lib/api";
import { type Resource, type TableQueries } from "@/modules/core/service/api.types";
import type { KyResponse } from "ky";
import type { PaginatedResponse } from "./paginated.types";
import { adaptFilters } from "./list.utils";

/**
 * Service class is a base class for all services.
 * Its goal is to provide a base for all services to inherit from.
 */
export class Service {
    public resource: string | undefined = undefined;
    public identifier: string | number | undefined = undefined;
    public meta: Record<string, any> = {};

    constructor(resource?: string, identifier?: string) {
        this.resource = resource ?? undefined;
        this.identifier = identifier ?? undefined;
    }

    /**
     * Set the resource of the service.
     * @param resource - The resource of the service.
     * @returns 
     */
    setResource(resource: string): this {
        this.resource = resource;
        return this;
    }

    /**
     * Set the identifier of the resource.
     * @param identifier - The identifier of the resource.
     * @returns 
     */
    setIdentifier(identifier: string | number): this {
        this.identifier = identifier;
        return this;
    }

    async get<T>(): Promise<KyResponse<Resource<T>>> {
        const response = await api.get<Resource<T>>(`/${this.resource}/${this.identifier}`);
        return response;
    }

    async list<T>(queryElements: TableQueries): Promise<KyResponse<PaginatedResponse<T>>> {
        const response = await api.get<PaginatedResponse<T>>(`/${this.resource}`, {
            searchParams: adaptFilters(queryElements),
        });
        return response;
    }

    async create<T>(data: any): Promise<KyResponse<Resource<T>>> {
        const response = await api.post(`/${this.resource}`, data);
        return response;
    }

    async update<T>(data: any): Promise<KyResponse<Resource<T>>> {
        const response = await api.put(`/${this.resource}/${this.identifier}`, data);
        return response;
    }

    async delete<T>(): Promise<KyResponse<Resource<T>>> {
        const response = await api.delete(`/${this.resource}/${this.identifier}`);
        return response;
    }
}

export const service = new Service();
