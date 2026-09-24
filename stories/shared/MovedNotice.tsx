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
import { useId } from 'react';

/** The Wow repository's Storybook, where the moved stories now live. */
export const WOW_STORYBOOK = 'https://wow.ahoo.me/storybook/';

/** A docs page in the Wow Storybook, by its story id (as its `index.json` lists it). */
export function wowStory(id: string): string {
  return `${WOW_STORYBOOK}?path=/docs/${encodeURIComponent(id)}`;
}

interface MovedNoticeProps {
  /** What used to be here, e.g. "View Engine". */
  subject: string;
  /** Where it went, in one sentence. */
  summary: string;
  /**
   * The package names after the migration. Names only: they are published to
   * npm with Wow's first stable release (wow-view-engine once it is stable),
   * so `availability` must say what to use until then.
   */
  packages: readonly string[];
  /** The label before the names; defaults to 「迁移后的包名」. */
  packagesLabel?: string;
  /** Whether the packages are on npm yet, and what to use until they are. */
  availability: string;
  link: { href: string; label: string };
  /** Direct links to the moved pages, when there are several worth naming. */
  pages?: readonly { href: string; label: string }[];
}

/**
 * The page left behind for a story group that moved out of this repository,
 * so an old bookmark or a link in the docs lands on directions, not a 404.
 */
export function MovedNotice({
  subject,
  summary,
  packages,
  packagesLabel = '迁移后的包名',
  availability,
  link,
  pages = [],
}: MovedNoticeProps) {
  const headingId = useId();
  return (
    <article aria-labelledby={headingId} className="story-scene">
      <header className="story-scene-header">
        <p className="story-scene-domain">已迁移</p>
        <h2 id={headingId}>{subject}</h2>
        <p className="story-scene-summary">{summary}</p>
      </header>
      <div className="story-scene-stage">
        <div className="story-stack">
          <p>
            {packagesLabel}：
            {packages.map((name, index) => (
              <span key={name}>
                {index > 0 && '、'}
                <code>{name}</code>
              </span>
            ))}
          </p>
          <p>{availability}</p>
          <a href={link.href} target="_top">
            {link.label}
          </a>
          {pages.length > 0 && (
            <ul aria-label="迁移后的页面">
              {pages.map(page => (
                <li key={page.href}>
                  <a href={page.href} target="_top">
                    {page.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
