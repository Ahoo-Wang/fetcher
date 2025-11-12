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
import {
  ImageGroupCell,
  ImageGroupCellProps,
  IMAGE_GROUP_CELL_TYPE,
} from '../../../src';

describe('ImageGroupCell Component', () => {
  // Test data interfaces
  interface Product {
    id: number;
    name: string;
    images: string[];
  }

  interface Gallery {
    id: number;
    name: string;
    photos: string[];
  }

  // Sample data
  const sampleProduct: Product = {
    id: 1,
    name: 'Laptop',
    images: [
      'https://example.com/laptop1.jpg',
      'https://example.com/laptop2.jpg',
    ],
  };

  const sampleGallery: Gallery = {
    id: 1,
    name: 'Vacation',
    photos: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
    ],
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render image group with string array', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/test1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/test2.jpg');
    });

    it('should render image group with different record types', () => {
      const productProps: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/product1.jpg',
            'https://example.com/product2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const galleryProps: ImageGroupCellProps<Gallery> = {
        data: {
          value: [
            'https://example.com/gallery1.jpg',
            'https://example.com/gallery2.jpg',
          ],
          record: sampleGallery,
          index: 1,
        },
        attributes: {},
      };

      const { rerender, container } = render(
        <ImageGroupCell {...productProps} />,
      );
      let images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute(
        'src',
        'https://example.com/product1.jpg',
      );

      rerender(<ImageGroupCell {...galleryProps} />);
      images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute(
        'src',
        'https://example.com/gallery1.jpg',
      );
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999];

      indices.forEach(index => {
        const props: ImageGroupCellProps<Product> = {
          data: {
            value: ['https://example.com/test.jpg'],
            record: sampleProduct,
            index,
          },
          attributes: {},
        };

        const { container } = render(<ImageGroupCell {...props} />);
        const images = container.querySelectorAll('img.ant-image-img');
        expect(images).toHaveLength(1);
        expect(images[0]).toHaveAttribute(
          'src',
          'https://example.com/test.jpg',
        );
        cleanup();
      });
    });
  });

  describe('Null and Invalid Values', () => {
    it('should render empty for null value', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: null as any,
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(0);
    });

    it('should render empty for undefined value', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: undefined as any,
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(0);
    });

    it('should render empty for empty array', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [],
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(0);
    });

    it('should render empty for non-array value', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: 'not-an-array' as any,
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(0);
    });
  });

  describe('Image Attributes', () => {
    it('should apply width and height attributes to all images', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          width: 100,
          height: 80,
        },
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      images.forEach(img => {
        expect(img).toHaveAttribute('width', '100');
        expect(img).toHaveAttribute('height', '80');
      });
    });

    it('should apply alt attribute to all images', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          alt: 'Test image',
        },
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      images.forEach(img => {
        expect(img).toHaveAttribute('alt', 'Test image');
      });
    });

    it('should apply preview attribute', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          preview: true,
        },
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
    });

    it('should apply fallback attribute to all images', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          fallback: 'https://example.com/placeholder.jpg',
        },
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
    });

    it('should apply style attribute to all images', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {
          style: { borderRadius: '8px', border: '1px solid #ccc' },
        },
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      images.forEach(img => {
        expect(img).toHaveStyle({
          borderRadius: '8px',
          border: '1px solid #ccc',
        });
      });
    });

    it('should combine multiple attributes', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
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

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      images.forEach(img => {
        expect(img).toHaveAttribute('width', '120');
        expect(img).toHaveAttribute('height', '90');
        expect(img).toHaveAttribute('alt', 'Product image');
        expect(img).toHaveStyle({ objectFit: 'cover' });
      });
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: ImageGroupCellProps<any> = {
        data: {
          value: ['https://example.com/test.jpg'],
          record: null,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/test.jpg');
    });

    it('should handle undefined record gracefully', () => {
      const props: ImageGroupCellProps<any> = {
        data: {
          value: ['https://example.com/test.jpg'],
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/test.jpg');
    });

    it('should handle empty object record', () => {
      const props: ImageGroupCellProps<any> = {
        data: {
          value: ['https://example.com/test.jpg'],
          record: {},
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/test.jpg');
    });
  });

  describe('Integration and Constants', () => {
    it('should export IMAGE_GROUP_CELL_TYPE constant', () => {
      expect(IMAGE_GROUP_CELL_TYPE).toBe('image-group');
      expect(typeof IMAGE_GROUP_CELL_TYPE).toBe('string');
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many images', () => {
      const manyImages = Array.from(
        { length: 10 },
        (_, i) => `https://example.com/test${i}.jpg`,
      );
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: manyImages,
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(10);
      images.forEach((img, index) => {
        expect(img).toHaveAttribute(
          'src',
          `https://example.com/test${index}.jpg`,
        );
      });
    });
  });

  describe('DOM Structure', () => {
    it('should render as multiple img elements', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
      images.forEach(img => {
        expect(img.tagName).toBe('IMG');
      });
    });

    it('should contain the correct src attributes', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
          record: sampleProduct,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images[0].getAttribute('src')).toBe(
        'https://example.com/test1.jpg',
      );
      expect(images[1].getAttribute('src')).toBe(
        'https://example.com/test2.jpg',
      );
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle extreme attribute values', () => {
      const props: ImageGroupCellProps<Product> = {
        data: {
          value: [
            'https://example.com/test1.jpg',
            'https://example.com/test2.jpg',
          ],
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

      expect(() => render(<ImageGroupCell {...props} />)).not.toThrow();
      const { container } = render(<ImageGroupCell {...props} />);
      const images = container.querySelectorAll('img.ant-image-img');
      expect(images).toHaveLength(2);
    });
  });
});
