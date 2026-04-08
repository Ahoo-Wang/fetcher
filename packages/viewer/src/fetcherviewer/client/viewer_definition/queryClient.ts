import type { QueryClientOptions} from "@ahoo-wang/fetcher-wow";
import { QueryClientFactory, ResourceAttributionPathSpec } from "@ahoo-wang/fetcher-wow";
import type { ViewerDefinitionAggregatedFields } from "./types";
import { VIEWER_BOUNDED_CONTEXT_ALIAS } from "../boundedContext";
import type { ViewDefinition } from '../../../viewer';

const DEFAULT_QUERY_CLIENT_OPTIONS: QueryClientOptions = {
    contextAlias: VIEWER_BOUNDED_CONTEXT_ALIAS,
    aggregateName: 'viewer_definition',
    resourceAttribution: ResourceAttributionPathSpec.NONE,
};

export enum ViewerDefinitionDomainEventTypeMapTitle {
    viewer_definition_saved = 'viewer_definition_saved'
}

export type ViewerDefinitionDomainEventType = any;

export const viewerDefinitionQueryClientFactory = new QueryClientFactory<ViewDefinition, ViewerDefinitionAggregatedFields | string, ViewerDefinitionDomainEventType>(DEFAULT_QUERY_CLIENT_OPTIONS);
