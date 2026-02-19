import { ServerResponseType } from "../../../../store/types";

export interface ServerResponseFormItem {
    requestId: number;
    description: string;
    isEnabled: boolean;
    responseType: ServerResponseType;
    responseDelay: string;
    responseBody: string;
    responseBodyError: string | null;
}
