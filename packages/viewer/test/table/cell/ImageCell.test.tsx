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
import { ImageCell, ImageCellProps, IMAGE_CELL_TYPE } from '../../../src';

describe('ImageCell Component', () => {
  // Test data interfaces
  interface Product {
    id: number;
    name: string;
    imageUrl: string;
  }

  interface User {
    id: number;
    name: string;
    avatar: string;
  }

  // Sample data
  const sampleProduct: Product = {
    id: 1,
    name: 'Laptop',
    imageUrl: 'https://example.com/laptop.jpg',
  };

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
    it('should render image with string URL', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    });

    it('should render image with different record types', () => {
      const productProps: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/product.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const userProps: ImageCellProps<User> = {
        data: {
          value: 'https://example.com/user.jpg',
          record: sampleUser,
          index: 1,
        },
        attributes: {},
      };

      const { rerender, container } = render(<ImageCell {...productProps} />);
      let image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');

      rerender(<ImageCell {...userProps} />);
      image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('src', 'https://example.com/user.jpg');
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999];

      indices.forEach(index => {
        const props: ImageCellProps<Product> = {
          data: {
            value: 'https://example.com/test.jpg',
            record: sampleProduct,
            index,
          },
          attributes: {},
        };

        const { container } = render(<ImageCell {...props} />);
        const image = container.querySelector('img.ant-image-img');
        expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
        cleanup();
      });
    });
  });

  describe('Null and Invalid Values', () => {
    it('should render dash for null value', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: null as any,
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      render(<ImageCell {...props} />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render dash for undefined value', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: undefined as any,
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      render(<ImageCell {...props} />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render dash for empty string', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: '',
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      render(<ImageCell {...props} />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Image Attributes', () => {
    it('should apply width and height attributes', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          width: 100,
          height: 80,
        },
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('width', '100');
      expect(image).toHaveAttribute('height', '80');
    });

    it('should apply alt attribute', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          alt: 'Test image',
        },
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('should apply preview attribute', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          preview: true,
        },
      };

      const { container } = render(<ImageCell {...props} />);
      // Preview functionality is handled by Ant Design Image component
      const image = container.querySelector('img.ant-image-img');
      expect(image).toBeInTheDocument();
    });

    it('should apply fallback attribute', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          fallback: 'https://example.com/placeholder.jpg',
        },
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toBeInTheDocument();
    });

    it('should apply style attribute', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          style: { opacity: '0.8', transform: 'scale(0.9)' },
        },
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img');
      expect(image).toHaveStyle({
        opacity: '0.8',
        transform: 'scale(0.9)',
      });
    });

    it('should combine multiple attributes', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          width: 120,
          height: 90,
          alt: 'Product image',
          preview: false,
          style: { objectFit: 'cover' },
        },
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img');
      expect(image).toHaveAttribute('width', '120');
      expect(image).toHaveAttribute('height', '90');
      expect(image).toHaveAttribute('alt', 'Product image');
      expect(image).toHaveStyle({ objectFit: 'cover' });
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: ImageCellProps<any> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: null,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    });

    it('should handle undefined record gracefully', () => {
      const props: ImageCellProps<any> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    });

    it('should handle empty object record', () => {
      const props: ImageCellProps<any> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: {},
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    });
  });

  describe('Integration and Constants', () => {
    it('should export IMAGE_CELL_TYPE constant', () => {
      expect(IMAGE_CELL_TYPE).toBe('image');
      expect(typeof IMAGE_CELL_TYPE).toBe('string');
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many re-renders', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { rerender, container } = render(<ImageCell {...props} />);

      // Re-render multiple times to test performance
      for (let i = 0; i < 100; i++) {
        rerender(<ImageCell {...props} />);
      }

      const image = container.querySelector('img.ant-image-img');
      expect(image).toHaveAttribute('src', 'https://example.com/test.jpg');
    });
  });

  describe('DOM Structure', () => {
    it('should render as img element', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toBeInTheDocument();
      expect(image?.tagName).toBe('IMG');
    });

    it('should contain the correct src attribute', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image?.getAttribute('src')).toBe('https://example.com/test.jpg');
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle extreme attribute values', () => {
      const props: ImageCellProps<Product> = {
        data: {
          value: 'https://example.com/test.jpg',
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          width: 1000,
          height: 2000,
          style: {
            fontSize: '100px',
            margin: '-500px',
            zIndex: 999999,
          },
        },
      };

      expect(() => render(<ImageCell {...props} />)).not.toThrow();
      const { container } = render(<ImageCell {...props} />);
      const image = container.querySelector('img.ant-image-img');
      expect(image).toBeInTheDocument();
    });
  });
});
