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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AvatarCell, AvatarCellProps, AVATAR_CELL_TYPE } from '../../../src';

describe('AvatarCell Component', () => {
  // Test data interfaces
  interface User {
    id: number;
    name: string;
    avatar?: string;
  }

  // Sample data
  const sampleUser: User = {
    id: 1,
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render avatar with image URL', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'https://example.com/avatar.jpg',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
      const img = avatar?.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render avatar with text when value is not a URL', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('JD');
    });

    it('should render avatar with different record types', () => {
      const userProps: AvatarCellProps<User> = {
        data: {
          value: 'https://example.com/user.jpg',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...userProps} />);
      const avatar = container.querySelector('.ant-avatar');
      const img = avatar?.querySelector('img');
      expect(img).toHaveAttribute('src', 'https://example.com/user.jpg');
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999];

      indices.forEach(index => {
        const props: AvatarCellProps<User> = {
          data: {
            value: 'JD',
            record: sampleUser,
            index,
          },
          attributes: {},
        };

        const { container } = render(<AvatarCell {...props} />);
        const avatar = container.querySelector('.ant-avatar');
        expect(avatar).toHaveTextContent('JD');
        cleanup();
      });
    });
  });

  describe('Null and Invalid Values', () => {
    it('should render avatar for null value', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: null as any,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
      // Avatar component renders a default icon when no content
      expect(avatar?.children).toHaveLength(1);
    });

    it('should render avatar for undefined value', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: undefined as any,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
      // Avatar component renders a default icon when no content
      expect(avatar?.children).toHaveLength(1);
    });

    it('should render avatar for empty string', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: '',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
      // Avatar component renders a default icon when no content
      expect(avatar?.children).toHaveLength(1);
    });
  });

  describe('Avatar Attributes', () => {
    it('should apply size attribute', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          size: 40,
        },
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should apply size as string', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          size: 'large',
        },
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveClass('ant-avatar-lg');
    });

    it('should apply alt attribute to image', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'https://example.com/avatar.jpg',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          alt: 'User avatar',
        },
      };

      const { container } = render(<AvatarCell {...props} />);
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('alt', 'User avatar');
    });

    it('should apply style attribute', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          style: { backgroundColor: '#1890ff' },
        },
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveStyle({
        backgroundColor: '#1890ff',
      });
    });

    it('should combine multiple attributes', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          size: 32,
          style: { backgroundColor: '#1890ff' },
        },
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveStyle({
        width: '32px',
        height: '32px',
        backgroundColor: '#1890ff',
      });
    });
  });

  describe('URL vs Text Detection', () => {
    it('should detect HTTP URLs as images', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'http://example.com/avatar.jpg',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://example.com/avatar.jpg');
    });

    it('should detect HTTPS URLs as images', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'https://example.com/avatar.jpg',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should detect relative URLs as images', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: '/avatars/avatar.jpg',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/avatars/avatar.jpg');
    });

    it('should treat non-URL strings as text', () => {
      const testCases = ['JD', 'John', 'User', 'A', '123'];

      testCases.forEach(text => {
        const props: AvatarCellProps<User> = {
          data: {
            value: text,
            record: sampleUser,
            index: 0,
          },
          attributes: {},
        };

        const { container } = render(<AvatarCell {...props} />);
        const avatar = container.querySelector('.ant-avatar');
        expect(avatar).toHaveTextContent(text);
        cleanup();
      });
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: AvatarCellProps<any> = {
        data: {
          value: 'JD',
          record: null,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveTextContent('JD');
    });

    it('should handle undefined record gracefully', () => {
      const props: AvatarCellProps<any> = {
        data: {
          value: 'JD',
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveTextContent('JD');
    });

    it('should handle empty object record', () => {
      const props: AvatarCellProps<any> = {
        data: {
          value: 'JD',
          record: {},
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveTextContent('JD');
    });
  });

  describe('Integration and Constants', () => {
    it('should export AVATAR_CELL_TYPE constant', () => {
      expect(AVATAR_CELL_TYPE).toBe('avatar');
      expect(typeof AVATAR_CELL_TYPE).toBe('string');
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many re-renders', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { rerender, container } = render(<AvatarCell {...props} />);

      // Re-render multiple times to test performance
      for (let i = 0; i < 100; i++) {
        rerender(<AvatarCell {...props} />);
      }

      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toHaveTextContent('JD');
    });
  });

  describe('DOM Structure', () => {
    it('should render as span with ant-avatar class', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar?.tagName).toBe('SPAN');
    });

    it('should contain text content when not an image', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar?.textContent).toBe('JD');
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle extreme attribute values', () => {
      const props: AvatarCellProps<User> = {
        data: {
          value: 'JD',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          size: 1000,
          style: {
            fontSize: '100px',
            margin: '-500px',
            zIndex: 999999,
          },
        },
      };

      expect(() => render(<AvatarCell {...props} />)).not.toThrow();
      const { container } = render(<AvatarCell {...props} />);
      const avatar = container.querySelector('.ant-avatar');
      expect(avatar).toBeInTheDocument();
    });
  });
});
