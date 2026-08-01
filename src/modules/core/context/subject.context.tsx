import { createContext, useContext, useState } from "react"
import type { Model } from "@/modules/core/model.types";

interface SubjectContextProps {
    resource: string;
    identifier?: string | number;
    identifierType: "uuid" | "id" | "slug" | undefined;
    model?: Model & unknown;
    setContext?: (value: SubjectContextProps) => void
}

const initialState: SubjectContextProps = {
    resource: "",
    identifier: undefined,
    identifierType: undefined,
    model: undefined,
    setContext: undefined,
}

export const SubjectContext = createContext<SubjectContextProps>(initialState)

export const useSubject = () => {
    const context = useContext(SubjectContext)
    if (!context) {
        throw new Error("useSubject must be used within a SubjectProvider")
    }
    return context
}

export const SubjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [context, setContext] = useState<SubjectContextProps>(initialState)
    return (
        <SubjectContext.Provider value={{ ...context, setContext }}>
            {children}
        </SubjectContext.Provider>
    )
}