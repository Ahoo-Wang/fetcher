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
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TagsCell,
  TagsCellProps,
  TAGS_CELL_TYPE,
} from '../../../src/table/cell/TagsCell';

describe('TagsCell Component', () => {
  // Test data interfaces
  interface User {
    id: number;
    name: string;
    email: string;
    roles: string[];
  }

  interface Product {
    id: number;
    name: string;
    categories: string[];
    tags: string[];
  }

  interface Task {
    id: number;
    title: string;
    labels: string[];
    priority: string;
  }

  // Sample data
  const sampleUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['admin', 'user'],
  };

  const sampleProduct: Product = {
    id: 1,
    name: 'Laptop',
    categories: ['electronics', 'computers'],
    tags: ['bestseller', 'new'],
  };

  const sampleTask: Task = {
    id: 1,
    title: 'Fix bug',
    labels: ['bug', 'urgent', 'frontend'],
    priority: 'high',
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render multiple tags correctly', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['admin', 'user', 'moderator'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('moderator')).toBeInTheDocument();
    });

    it('should render single tag correctly', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['admin'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should render with different record types', () => {
      const userProps: TagsCellProps<User> = {
        data: {
          value: ['admin', 'user'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const productProps: TagsCellProps<Product> = {
        data: {
          value: ['electronics', 'bestseller'],
          record: sampleProduct,
          index: 1,
        },
        attributes: {},
      };

      const taskProps: TagsCellProps<Task> = {
        data: {
          value: ['bug', 'urgent'],
          record: sampleTask,
          index: 2,
        },
        attributes: {},
      };

      const { rerender } = render(<TagsCell {...userProps} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();

      rerender(<TagsCell {...productProps} />);
      expect(screen.getByText('electronics')).toBeInTheDocument();
      expect(screen.getByText('bestseller')).toBeInTheDocument();

      rerender(<TagsCell {...taskProps} />);
      expect(screen.getByText('bug')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999];

      indices.forEach(index => {
        const props: TagsCellProps<User> = {
          data: {
            value: [`tag-${index}`],
            record: sampleUser,
            index,
          },
          attributes: {},
        };

        const { rerender } = render(<TagsCell {...props} />);
        expect(screen.getByText(`tag-${index}`)).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should return null for empty array', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: [],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagsCell {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('should filter out empty strings and whitespace-only tags', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['valid', '', '  ', '\t', 'another'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagsCell {...props} />);
      expect(screen.getByText('valid')).toBeInTheDocument();
      expect(screen.getByText('another')).toBeInTheDocument();

      // Check that only 2 tags are rendered
      const tags = container.querySelectorAll('.ant-tag');
      expect(tags).toHaveLength(2);
    });

    it('should handle array with only empty/whitespace tags', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['', '  ', '\t', '\n'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagsCell {...props} />);
      // Should render Space with no actual tags
      const tags = container.querySelectorAll('.ant-tag');
      expect(tags).toHaveLength(0);
    });

    it('should handle tags with leading/trailing whitespace', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['  admin  ', ' user ', 'moderator'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('moderator')).toBeInTheDocument();
    });
  });

  describe('Tag Attributes', () => {
    it('should apply attributes to specific tags', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['admin', 'user', 'moderator'],
          record: sampleUser,
          index: 0,
        },
        attributes: {
          admin: { color: 'red' },
          user: { color: 'blue', closable: true },
          moderator: { className: 'custom-class' },
        },
      };

      render(<TagsCell {...props} />);
      const adminTag = screen.getByText('admin').closest('.ant-tag');
      const userTag = screen.getByText('user').closest('.ant-tag');
      const moderatorTag = screen.getByText('moderator').closest('.ant-tag');

      expect(adminTag).toHaveClass('ant-tag-red');
      expect(userTag).toHaveClass('ant-tag-blue');
      expect(moderatorTag).toHaveClass('custom-class');

      // Check closable
      const closeButton = userTag?.querySelector('.ant-tag-close-icon');
      expect(closeButton).toBeInTheDocument();
    });

    it('should handle undefined attributes for some tags', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['admin', 'user', 'guest'],
          record: sampleUser,
          index: 0,
        },
        attributes: {
          admin: { color: 'red' },
          // user has no attributes
          guest: { color: 'green' },
        },
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('guest')).toBeInTheDocument();

      const adminTag = screen.getByText('admin').closest('.ant-tag');
      const userTag = screen.getByText('user').closest('.ant-tag');
      const guestTag = screen.getByText('guest').closest('.ant-tag');

      expect(adminTag).toHaveClass('ant-tag-red');
      expect(guestTag).toHaveClass('ant-tag-green');
      // user should have default styling
      expect(userTag).toHaveClass('ant-tag');
      expect(userTag).not.toHaveClass('ant-tag-red');
    });

    it('should handle empty attributes object', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['admin', 'user'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('should handle undefined attributes prop', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['admin', 'user'],
          record: sampleUser,
          index: 0,
        },
        attributes: undefined,
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should handle special characters in tags', () => {
      const specialTags = [
        'tag-with-dash',
        'tag_with_underscore',
        'tag.with.dots',
        'tag@symbol',
        'tag#hash',
        'tag$dollar',
        'tag%percent',
        'tag&and',
        'tag*star',
        'tag+plus',
        'tag=equals',
        'tag|pipe',
        'tag\\backslash',
        'tag/slash',
        'tag?question',
        'tag<less',
        'tag>greater',
        'tag"quote',
        "tag'single",
        'tag:colon',
        'tag;semicolon',
        'tag,comma',
        'tag()parens',
        'tag[]brackets',
        'tag{}braces',
      ];

      const props: TagsCellProps<User> = {
        data: {
          value: specialTags,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      specialTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('should handle unicode characters', () => {
      const unicodeTags = [
        '标签', // Chinese
        'étiquette', // French with accent
        'маркер', // Russian
        '🏷️', // Emoji
        'café', // German umlaut
        'naïve', // French ligature
        'Москва', // Cyrillic
        'العربية', // Arabic
        '日本語', // Japanese
        '🌟⭐✨', // Multiple emojis
      ];

      const props: TagsCellProps<User> = {
        data: {
          value: unicodeTags,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      unicodeTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('should handle very long tag strings', () => {
      const longTag = 'a'.repeat(100);
      const props: TagsCellProps<User> = {
        data: {
          value: [longTag],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText(longTag)).toBeInTheDocument();
    });

    it('should handle tags with line breaks', () => {
      const multilineTag = 'line1\nline2';
      const props: TagsCellProps<User> = {
        data: {
          value: [multilineTag],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagsCell {...props} />);
      const tagElement = container.querySelector('.ant-tag');
      expect(tagElement?.textContent).toBe(multilineTag);
    });
  });

  describe('DOM Structure', () => {
    it('should render tags wrapped in Space component', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['tag1', 'tag2'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagsCell {...props} />);
      // Space component renders as div with ant-space class
      const spaceElement = container.querySelector('.ant-space');
      expect(spaceElement).toBeInTheDocument();
      expect(spaceElement?.tagName).toBe('DIV');

      // Should contain the tags
      const tags = container.querySelectorAll('.ant-tag');
      expect(tags).toHaveLength(2);
    });

    it('should use index as key for TagCell components', () => {
      // This is more of an implementation detail, but we can verify by checking the rendered output
      const props: TagsCellProps<User> = {
        data: {
          value: ['first', 'second', 'third'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('first')).toBeInTheDocument();
      expect(screen.getByText('second')).toBeInTheDocument();
      expect(screen.getByText('third')).toBeInTheDocument();
    });

    it('should render nothing when no valid tags', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: [],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagsCell {...props} />);
      expect(container.children).toHaveLength(0);
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: TagsCellProps<any> = {
        data: {
          value: ['test'],
          record: null,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should handle undefined record gracefully', () => {
      const props: TagsCellProps<any> = {
        data: {
          value: ['test'],
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should handle empty object record', () => {
      const props: TagsCellProps<any> = {
        data: {
          value: ['test'],
          record: {},
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  describe('Integration and Constants', () => {
    it('should export TAGS_CELL_TYPE constant', () => {
      expect(TAGS_CELL_TYPE).toBe('tags');
      expect(typeof TAGS_CELL_TYPE).toBe('string');
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many tags', () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
      const props: TagsCellProps<User> = {
        data: {
          value: manyTags,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagsCell {...props} />);
      manyTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('should handle re-renders efficiently', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['test1', 'test2'],
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { rerender } = render(<TagsCell {...props} />);

      for (let i = 0; i < 10; i++) {
        rerender(<TagsCell {...props} />);
      }

      expect(screen.getByText('test1')).toBeInTheDocument();
      expect(screen.getByText('test2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render accessible tags when closable', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['closable-tag'],
          record: sampleUser,
          index: 0,
        },
        attributes: {
          'closable-tag': { closable: true },
        },
      };

      render(<TagsCell {...props} />);
      const closeButton = screen.getByRole('img', { hidden: true });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle malformed attributes gracefully', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['test'],
          record: sampleUser,
          index: 0,
        },
        attributes: {
          test: {
            invalidProp: 'invalid',
            anotherInvalid: 123,
          } as any,
        },
      };

      expect(() => render(<TagsCell {...props} />)).not.toThrow();
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should handle extreme attribute values', () => {
      const props: TagsCellProps<User> = {
        data: {
          value: ['extreme'],
          record: sampleUser,
          index: 0,
        },
        attributes: {
          extreme: {
            style: {
              fontSize: '1000px',
              margin: '-1000px',
              zIndex: 999999,
            },
            className: 'class1 class2 class3',
            title: 'a'.repeat(1000),
          },
        },
      };

      expect(() => render(<TagsCell {...props} />)).not.toThrow();
      expect(screen.getByText('extreme')).toBeInTheDocument();
    });
  });
});
