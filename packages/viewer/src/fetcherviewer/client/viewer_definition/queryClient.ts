import { QueryClientFactory, QueryClientOptions, ResourceAttributionPathSpec } from "@ahoo-wang/fetcher-wow";
import { ViewerDefinitionAggregatedFields, ViewerDefinitionSaved } from "./types";
import { VIEWER_BOUNDED_CONTEXT_ALIAS } from "../boundedContext";
import { ViewDefinition } from '../../../viewer';

const DEFAULT_QUERY_CLIENT_OPTIONS: QueryClientOptions = {
    contextAlias: VIEWER_BOUNDED_CONTEXT_ALIAS,
    aggregateName: 'viewer_definition',
    resourceAttribution: ResourceAttributionPathSpec.NONE,
};

export enum ViewerDefinitionDomainEventTypeMapTitle {
    viewer_definition_saved = 'viewer_definition_saved'
}

export type ViewerDefinitionDomainEventType = ViewerDefinitionSaved;

export const viewerDefinitionQueryClientFactory = new QueryClientFactory<ViewDefinition, ViewerDefinitionAggregatedFields | string, ViewerDefinitionDomainEventType>(DEFAULT_QUERY_CLIENT_OPTIONS);
