import { HugeiconsIcon } from "@hugeicons/react";
import { LayoutBottomIcon } from "@hugeicons/core-free-icons";

export type TeamConfig = {
    allowSwitchingTeams: boolean;
    teams: Team[];
}

export type Team = {
    id: string;
    name: string;
    logo: React.ReactNode;
    plan: string;
}

export const teamConfig: TeamConfig = {
    allowSwitchingTeams: false,
    teams: [
        {
            id: "1",
            name: "Team 1",
            logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
            plan: "Tailor",
        }    
    ],
}