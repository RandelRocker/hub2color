export interface TagFromApi {
    tagId: string;
    tagTypeId: string;
    name: string;
    description: string;
    config: {
        style?: string;
        code?: string;
        beforeEndHead?: string;
        beforeEndBody?: string;
        [key: string]: unknown;
    };
}
