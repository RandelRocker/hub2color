import { useEffect, useState } from "react";

import * as config from "../../../../../../config";

import { TagFromApi } from "../types";

type TagTypeId = "custom_css" | "custom_js" | "custom_tag_type";

export const useTagsByType = (tagTypeId: TagTypeId, open: boolean) => {
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<TagFromApi[]>([]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch(`${config.HUB2COLOR_PUBLIC_PATH}/config/tags.json`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch tags: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    const filteredTags = (data.tags || []).filter(
                        (tag: TagFromApi) => tag.tagTypeId === tagTypeId
                    );
                    setTags(filteredTags);
                })
                .catch((error) => {
                    console.error("Failed to load tags:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [tagTypeId, open]);

    return { tags, loading };
};
