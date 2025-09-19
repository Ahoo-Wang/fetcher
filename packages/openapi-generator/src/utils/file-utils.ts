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

import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from './logger';

export class FileUtils {
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      Logger.error(`Failed to create directory: ${dirPath}`);
      throw error;
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    await FileUtils.ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}