/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Entries scripts/verify-storybook-browser.mjs opens by id. The static index
 * check (scripts/verify-storybook.mjs, run by `pnpm build-storybook`) requires
 * every one of them, so moving or renaming a story fails the build instead of
 * the browser acceptance run.
 */
export const browserTargets = {
  /** Landing page: heading, chapter links and narrow layout. */
  startHere: 'overview--start-here',
  /** A request example that must not send anything until the user acts. */
  passiveStory: 'http-fetcher--basic-request',
  /** Docs page that mounts only its primary story iframe. */
  isolatedDocs: 'http-fetcher--docs',
  /** Story opened beside the docs page to check the iframes stay isolated. */
  isolatedStory: 'http-fetcher--path-and-query',
};

/** Browser targets the Storybook index does not contain. */
export function missingBrowserTargets(index) {
  return Object.entries(browserTargets)
    .filter(([, id]) => !index.entries?.[id])
    .map(([name, id]) => `${name} (${id})`);
}
