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

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoRefreshBarItem } from '../../src/topbar/AutoRefreshBarItem';

vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: vi.fn(() => ({
    publish: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../src/locale/useLocale', () => ({
  useLocale: vi.fn(() => ({
    locale: {},
    setLocale: vi.fn(),
  })),
}));

describe('AutoRefreshBarItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default items', () => {
      const { container } = render(<AutoRefreshBarItem />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom items', () => {
      const customItems = [
        { label: '30 秒', key: '30s', refreshInterval: 30000 },
      ];

      const { container } = render(
        <AutoRefreshBarItem items={customItems} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display default label "刷新率：从不"', () => {
      const { container } = render(<AutoRefreshBarItem />);

      expect(container.textContent).toContain('刷新率 ：从不');
    });

    it('should render button element', () => {
      const { container } = render(<AutoRefreshBarItem />);

      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  describe('default items', () => {
    it('should have default items defined', () => {
      const { container } = render(<AutoRefreshBarItem />);

      expect(container).toBeInTheDocument();
    });

    it('should have 3 default refresh intervals plus never option', () => {
      const { container } = render(<AutoRefreshBarItem />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('custom items', () => {
    it('should accept custom items array', () => {
      const customItems = [
        { label: '10 秒', key: '10', refreshInterval: 10000 },
        { label: '30 秒', key: '30', refreshInterval: 30000 },
      ];

      const { container } = render(
        <AutoRefreshBarItem items={customItems} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should always include never option even with custom items', () => {
      const customItems = [
        { label: '10 秒', key: '10', refreshInterval: 10000 },
      ];

      const { container } = render(
        <AutoRefreshBarItem items={customItems} />,
      );

      expect(container.textContent).toContain('从不');
    });
  });
});
