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
    /**
     * If true, the user can switch between teams.
     */
    allowSwitchingTeams: false,
    
    /**
     * Teams are used to group users and projects.
     * If allowSwitchingTeams is false, only the first team will be shown.
     */
    teams: [
        {
            id: "1",
            name: "Team 1",
            logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
            plan: "Tailor",
        }    
    ],
}