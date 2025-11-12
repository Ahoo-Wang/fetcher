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

import type { Meta, StoryObj } from '@storybook/react';
import { ImageGroupCell } from '../ImageGroupCell';

const meta: Meta<typeof ImageGroupCell> = {
  title: 'Table/Cell/ImageGroupCell',
  component: ImageGroupCell,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ImageGroupCell 使用 Ant Design 的 Image.PreviewGroup 组件显示图片组，支持预览和导航。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: '单元格数据',
      control: { type: 'object' },
    },
    attributes: {
      description: '图片属性',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageGroupCell>;

const sampleProduct = {
  id: 1,
  name: 'MacBook Pro',
  images: [
    'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  ],
};

const sampleGallery = {
  id: 2,
  name: 'Travel Photos',
  photos: [
    'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  ],
};

export const Basic: Story = {
  args: {
    data: {
      value: sampleProduct.images,
      record: sampleProduct,
      index: 0,
    },
    attributes: {
      width: 80,
      height: 80,
      preview: true,
    },
  },
};

export const WithCustomSize: Story = {
  args: {
    data: {
      value: sampleGallery.photos,
      record: sampleGallery,
      index: 0,
    },
    attributes: {
      width: 120,
      height: 90,
      preview: true,
      style: { borderRadius: '8px' },
    },
  },
};

export const WithoutPreview: Story = {
  args: {
    data: {
      value: sampleProduct.images.slice(0, 2),
      record: sampleProduct,
      index: 0,
    },
    attributes: {
      width: 100,
      height: 100,
      preview: false,
    },
  },
};

export const WithFallback: Story = {
  args: {
    data: {
      value: [
        'https://invalid-url.com/image1.jpg',
        'https://invalid-url.com/image2.jpg',
      ],
      record: sampleProduct,
      index: 0,
    },
    attributes: {
      width: 80,
      height: 80,
      preview: true,
      fallback:
        'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
  },
};

export const EmptyArray: Story = {
  args: {
    data: {
      value: [],
      record: sampleProduct,
      index: 0,
    },
    attributes: {
      width: 80,
      height: 80,
    },
  },
};

export const NullValue: Story = {
  args: {
    data: {
      value: null as any,
      record: sampleProduct,
      index: 0,
    },
    attributes: {
      width: 80,
      height: 80,
    },
  },
};
