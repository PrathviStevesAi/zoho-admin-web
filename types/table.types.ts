import { ReactNode } from "react";

export type TableColumn<T = any> = {
    key: keyof T & string;
    header: string;
    width?: string;
    align?: "left" | "center" | "right";
    render?: (row: T) => ReactNode; 
};