import { Model } from "../shared";

export type Notification = {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: string;

    notifiable?: Model;
    data: string;
    read_at: number | null;
    created_at: number;
    updated_at: number;
};
