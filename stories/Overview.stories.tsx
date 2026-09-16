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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

const meta = {
  id: 'overview',
  title: '开始使用',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const entries = [
  {
    title: 'HTTP',
    task: '发送第一个请求',
    description: 'Fetcher 请求、参数、错误处理与 OpenAI 流式响应。',
    href: './?path=/docs/http-fetcher--docs',
  },
  {
    title: '事件',
    task: '订阅与消费事件',
    description: '比较 Event Bus 执行顺序，读取和取消 SSE。',
    href: './?path=/docs/事件与存储-event-bus--docs',
  },
  {
    title: '存储',
    task: '保存与观察状态',
    description: '序列化、变更监听与监听器清理。',
    href: './?path=/docs/事件与存储-storage--docs',
  },
  {
    title: 'React Hooks',
    task: '驱动异步状态',
    description: '加载、失败、重试、取消与 Wow 查询。',
    href: './?path=/docs/react-hooks-async-state--docs',
  },
  {
    title: 'Viewer',
    task: '组合业务界面',
    description: 'Ant Design 输入、过滤器、表格与完整业务流程。',
    href: './?path=/docs/viewer-完整业务流程-viewer--docs',
  },
];

export const StartHere: Story = {
  render: () => (
    <main aria-labelledby="storybook-title" className="story-overview">
      <header className="story-overview-hero">
        <p className="story-overview-eyebrow">Fetcher · Developer Guide</p>
        <h1 id="storybook-title">从示例开始接入</h1>
        <p>
          选择能力，操作示例，再查看对应接入代码。普通演示使用本地数据，交互回归独立运行。
        </p>
      </header>
      <section aria-labelledby="capabilities-title">
        <h2 id="capabilities-title">选择你需要的能力</h2>
        <nav className="story-overview-grid" aria-label="能力导航">
          {entries.map(entry => (
            <a key={entry.title} href={entry.href} target="_top">
              <span>{entry.title}</span>
              <strong>{entry.task}</strong>
              <p>{entry.description}</p>
            </a>
          ))}
        </nav>
      </section>
      <footer className="story-overview-footer">
        <p>
          打开示例不会自动创建或删除记录。回归测试通过 pnpm test:storybook
          执行。
        </p>
        <a href="https://fetcher.ahoo.me/start/first-request">
          阅读完整接入指南
        </a>
      </footer>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: '从示例开始接入' }),
    ).toBeVisible();
    const navigation = within(
      canvas.getByRole('navigation', { name: '能力导航' }),
    );
    for (const name of [
      '发送第一个请求',
      '订阅与消费事件',
      '保存与观察状态',
      '驱动异步状态',
      '组合业务界面',
    ]) {
      await expect(
        navigation.getByRole('link', { name: new RegExp(name) }),
      ).toBeVisible();
    }
  },
};
