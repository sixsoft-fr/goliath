export type Notification = {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: string;

    // ponytail: ../shared n'existe pas encore, typer large en attendant
    notifiable?: Record<string, unknown>;
    data: string;
    read_at: number | null;
    created_at: number;
    updated_at: number;
};
