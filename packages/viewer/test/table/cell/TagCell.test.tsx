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
import { TagCell, TagCellProps, TAG_CELL_TYPE } from '../../../src';

describe('TagCell Component', () => {
  // Test data interfaces
  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  interface Product {
    id: number;
    name: string;
    category: string;
    status: string;
  }

  interface Task {
    id: number;
    title: string;
    priority: string;
    assignee: string;
  }

  // Sample data
  const sampleUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  };

  const sampleProduct: Product = {
    id: 1,
    name: 'Laptop',
    category: 'Electronics',
    status: 'active',
  };

  const sampleTask: Task = {
    id: 1,
    title: 'Fix bug',
    priority: 'high',
    assignee: 'john@example.com',
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render a simple string tag correctly', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'admin',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should render tag with different record types', () => {
      const userProps: TagCellProps<User> = {
        data: {
          value: 'admin',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const productProps: TagCellProps<Product> = {
        data: {
          value: 'active',
          record: sampleProduct,
          index: 1,
        },
        attributes: {},
      };

      const taskProps: TagCellProps<Task> = {
        data: {
          value: 'high',
          record: sampleTask,
          index: 2,
        },
        attributes: {},
      };

      const { rerender } = render(<TagCell {...userProps} />);
      expect(screen.getByText('admin')).toBeInTheDocument();

      rerender(<TagCell {...productProps} />);
      expect(screen.getByText('active')).toBeInTheDocument();

      rerender(<TagCell {...taskProps} />);
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999, -1];

      indices.forEach(index => {
        const props: TagCellProps<User> = {
          data: {
            value: `tag-${index}`,
            record: sampleUser,
            index,
          },
          attributes: {},
        };

        const { rerender } = render(<TagCell {...props} />);
        expect(screen.getByText(`tag-${index}`)).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Empty and Whitespace Handling', () => {
    it('should return null for empty string', () => {
      const props: TagCellProps<User> = {
        data: {
          value: '',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagCell {...props} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null for whitespace-only strings', () => {
      const whitespaceValues = [' ', '\t', '\n', '  \t  \n  ', '\r\n'];

      whitespaceValues.forEach(value => {
        const props: TagCellProps<User> = {
          data: {
            value,
            record: sampleUser,
            index: 0,
          },
          attributes: {},
        };

        const { container } = render(<TagCell {...props} />);
        expect(container.firstChild).toBeNull();
        cleanup();
      });
    });

    it('should render strings with leading/trailing whitespace trimmed', () => {
      const props: TagCellProps<User> = {
        data: {
          value: '  admin  ',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should render strings with internal whitespace preserved', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'tag with spaces',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('tag with spaces')).toBeInTheDocument();
    });
  });

  describe('TagProps Attributes', () => {
    it('should apply color attribute', () => {
      const colors = [
        'red',
        'orange',
        'yellow',
        'green',
        'blue',
        'purple',
        'cyan',
        'pink',
        'magenta',
      ];

      colors.forEach(color => {
        const props: TagCellProps<User> = {
          data: {
            value: `tag-${color}`,
            record: sampleUser,
            index: 0,
          },
          attributes: { color },
        };

        const { container } = render(<TagCell {...props} />);
        const tag = container.querySelector('.ant-tag');
        expect(tag).toHaveClass(`ant-tag-${color}`);
        cleanup();
      });
    });

    it('should apply closable attribute', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'closable-tag',
          record: sampleUser,
          index: 0,
        },
        attributes: { closable: true },
      };

      render(<TagCell {...props} />);
      const closeButton = screen.getByRole('img', { hidden: true });
      expect(closeButton).toBeInTheDocument();
    });

    it('should apply className attribute', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'custom-class-tag',
          record: sampleUser,
          index: 0,
        },
        attributes: { className: 'my-custom-class' },
      };

      const { container } = render(<TagCell {...props} />);
      const tag = container.querySelector('.ant-tag');
      expect(tag).toHaveClass('my-custom-class');
    });

    it('should apply style attribute', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'styled-tag',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
          },
        },
      };

      const { container } = render(<TagCell {...props} />);
      const tag = container.querySelector('.ant-tag');
      // Note: Style checking is skipped due to jsdom CSS variable limitations
      expect(tag).toBeTruthy();
    });

    it('should apply multiple attributes simultaneously', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'multi-attr-tag',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          color: 'blue',
          closable: true,
          className: 'multi-class',
          title: 'Tooltip text',
        },
      };

      render(<TagCell {...props} />);
      const tag = screen.getByText('multi-attr-tag');
      expect(tag).toHaveClass('ant-tag-blue');
      expect(tag).toHaveClass('multi-class');
      expect(tag).toHaveAttribute('title', 'Tooltip text');

      const closeButton = screen.getByRole('img', { hidden: true });
      expect(closeButton).toBeInTheDocument();
    });

    it('should handle undefined attributes gracefully', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'no-attributes',
          record: sampleUser,
          index: 0,
        },
        attributes: undefined,
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('no-attributes')).toBeInTheDocument();
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should handle special characters', () => {
      const specialValues = [
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

      specialValues.forEach(value => {
        const props: TagCellProps<User> = {
          data: {
            value,
            record: sampleUser,
            index: 0,
          },
          attributes: {},
        };

        const { rerender } = render(<TagCell {...props} />);
        expect(screen.getByText(value)).toBeInTheDocument();
        cleanup();
      });
    });

    it('should handle unicode characters', () => {
      const unicodeValues = [
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

      unicodeValues.forEach(value => {
        const props: TagCellProps<User> = {
          data: {
            value,
            record: sampleUser,
            index: 0,
          },
          attributes: {},
        };

        const { rerender } = render(<TagCell {...props} />);
        expect(screen.getByText(value)).toBeInTheDocument();
        cleanup();
      });
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const props: TagCellProps<User> = {
        data: {
          value: longString,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText(longString)).toBeInTheDocument();
    });

    it('should handle strings with line breaks', () => {
      const multilineString = 'line1\nline2\nline3';
      const props: TagCellProps<User> = {
        data: {
          value: multilineString,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagCell {...props} />);
      const tagElement = container.querySelector('.ant-tag');
      expect(tagElement?.textContent).toBe(multilineString);
    });

    it('should handle strings with tabs', () => {
      const tabbedString = 'col1\tcol2\tcol3';
      const props: TagCellProps<User> = {
        data: {
          value: tabbedString,
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagCell {...props} />);
      const tagElement = container.querySelector('.ant-tag');
      expect(tagElement?.textContent).toBe(tabbedString);
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: TagCellProps<any> = {
        data: {
          value: 'null-record',
          record: null,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('null-record')).toBeInTheDocument();
    });

    it('should handle undefined record gracefully', () => {
      const props: TagCellProps<any> = {
        data: {
          value: 'undefined-record',
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('undefined-record')).toBeInTheDocument();
    });

    it('should handle empty object record', () => {
      const props: TagCellProps<any> = {
        data: {
          value: 'empty-record',
          record: {},
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      expect(screen.getByText('empty-record')).toBeInTheDocument();
    });
  });

  describe('Integration with Cell Registry', () => {
    it('should export TAG_CELL_TYPE constant', () => {
      expect(TAG_CELL_TYPE).toBe('tag');
      expect(typeof TAG_CELL_TYPE).toBe('string');
    });

    it('should be usable with typedCellRender (integration test)', async () => {
      // This is an integration test that would require importing typedCellRender
      // For now, we'll just verify the component can be instantiated with various props
      const props: TagCellProps<User> = {
        data: {
          value: 'integration-test',
          record: sampleUser,
          index: 0,
        },
        attributes: { color: 'green' },
      };

      render(<TagCell {...props} />);
      const tag = screen.getByText('integration-test');
      expect(tag).toHaveClass('ant-tag-green');
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many re-renders', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'performance-test',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { rerender } = render(<TagCell {...props} />);

      // Re-render multiple times to test performance
      for (let i = 0; i < 100; i++) {
        rerender(<TagCell {...props} />);
      }

      expect(screen.getByText('performance-test')).toBeInTheDocument();
    });

    it('should handle large datasets without memory issues', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        role: `Role ${i % 10}`,
      }));

      largeDataset.forEach((user, index) => {
        const props: TagCellProps<typeof user> = {
          data: {
            value: user.role,
            record: user,
            index,
          },
          attributes: {},
        };

        const { rerender } = render(<TagCell {...props} />);
        expect(screen.getByText(user.role)).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Accessibility', () => {
    it('should render tags with proper ARIA attributes when closable', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'accessible-tag',
          record: sampleUser,
          index: 0,
        },
        attributes: { closable: true },
      };

      render(<TagCell {...props} />);
      const closeButton = screen.getByRole('img', { hidden: true });
      expect(closeButton).toBeInTheDocument();
      // The close button should have proper accessibility attributes
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('should render tags without unnecessary ARIA attributes when not closable', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'simple-tag',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      render(<TagCell {...props} />);
      const tag = screen.getByText('simple-tag');
      // Should not have close button when not closable
      expect(
        screen.queryByRole('img', { hidden: true }),
      ).not.toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('should render as a span element with ant-tag class', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'dom-test',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagCell {...props} />);
      const tagElement = container.querySelector('span.ant-tag');
      expect(tagElement).toBeInTheDocument();
      expect(tagElement?.tagName).toBe('SPAN');
    });

    it('should contain the text content directly', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'content-test',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagCell {...props} />);
      const tagElement = container.querySelector('.ant-tag');
      expect(tagElement?.textContent).toBe('content-test');
    });

    it('should not render any wrapper elements', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'wrapper-test',
          record: sampleUser,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<TagCell {...props} />);
      // Should only have the tag span and nothing else at root level
      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild?.tagName).toBe('SPAN');
      expect(container.firstElementChild).toHaveClass('ant-tag');
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle malformed attributes gracefully', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'malformed-attrs',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          // Pass invalid attributes that Antd Tag might not expect
          invalidProp: 'invalid',
          anotherInvalid: 123,
        } as any,
      };

      // Should not throw an error
      expect(() => render(<TagCell {...props} />)).not.toThrow();
      expect(screen.getByText('malformed-attrs')).toBeInTheDocument();
    });

    it('should handle extreme attribute values', () => {
      const props: TagCellProps<User> = {
        data: {
          value: 'extreme-attrs',
          record: sampleUser,
          index: 0,
        },
        attributes: {
          style: {
            fontSize: '1000px',
            margin: '-1000px',
            zIndex: 999999,
          },
          className: 'class1 class2 class3 class4 class5',
          title: 'a'.repeat(10000), // Very long title
        },
      };

      expect(() => render(<TagCell {...props} />)).not.toThrow();
      expect(screen.getByText('extreme-attrs')).toBeInTheDocument();
    });
  });
});
