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
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip } from 'antd';
import { ShareLinkBarItem } from '../../src/topbar/ShareLinkBarItem';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Tooltip: ({ title, children, className, style }: any) => (
      <div className={className} style={style} data-testid="tooltip">
        {children}
      </div>
    ),
    message: {
      useMessage: () => [
        {
          success: vi.fn(),
          error: vi.fn(),
        },
        vi.fn(),
      ],
    },
  };
});

describe('ShareLinkBarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ShareLinkBarItem />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ShareLinkBarItem className="custom-class" />,
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should render with custom style', () => {
      const style = { marginTop: '10px' };
      const { container } = render(
        <ShareLinkBarItem style={style} />,
      );
      const target = container.querySelector('[style]');
      expect(target).toHaveStyle(style);
    });
  });

  describe('click behavior', () => {
    it('should call navigator.clipboard.writeText when clicked', async () => {
      const { container } = render(<ShareLinkBarItem />);

      const clickTarget = container.querySelector('[data-testid="tooltip"] > div') || container.querySelector('[data-testid="tooltip"]');
      fireEvent.click(clickTarget as HTMLElement);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          window.location.href,
        );
      });
    });

    it('should handle clipboard error gracefully', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
        new Error('Clipboard error'),
      );

      const { container } = render(<ShareLinkBarItem />);

      const clickTarget = container.querySelector('[data-testid="tooltip"] > div') || container.querySelector('[data-testid="tooltip"]');
      fireEvent.click(clickTarget as HTMLElement);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe('props', () => {
    it('should accept style prop', () => {
      const style = { padding: '8px' };
      const { container } = render(
        <ShareLinkBarItem style={style} />,
      );
      const target = container.querySelector('[style]');
      expect(target).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(
        <ShareLinkBarItem className="test-class" />,
      );
      expect(container.querySelector('.test-class')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should render with Tooltip', () => {
      const { container } = render(<ShareLinkBarItem />);
      expect(container.querySelector('[data-testid="tooltip"]')).toBeInTheDocument();
    });
  });
});
