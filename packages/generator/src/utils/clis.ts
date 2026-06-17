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

import { CodeGenerator } from '../index';
import type { GeneratorOptions } from '../types';
import { ConsoleLogger } from './logger';
import packageJson from '../../package.json';

/**
 * Returns true when `hostname` refers to a private/loopback/link-local or
 * otherwise non-public host. Used to block SSRF: the generator fetches remote
 * OpenAPI specs via `fetch(url)`, so a crafted input could otherwise make the
 * generator host probe internal services (cloud metadata endpoints, RFC1918
 * ranges, localhost, etc.). File paths are not subject to this check.
 *
 * Note on IPv6: the WHATWG `URL` parser normalizes IPv4-mapped IPv6 addresses
 * (e.g. `[::ffff:169.254.169.254]`) to pure hex form (`[::ffff:a9fe:a9fe]`),
 * so the dotted-quad tail is gone by the time we see the hostname. We detect
 * link-local ULA (`fc00::/7`, `fd…`), link-local (`fe80::/10`), loopback
 * (`::1`), and unspecified (`::`) by prefix. A hex-encoded v4-mapped private
 * address (e.g. `::ffff:a9fe:a9fe`) is not caught here — accepting this
 * residual risk in exchange for not rejecting legitimate public IPv6 hosts.
 */
function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|]$/g, '');

  const lower = host.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost')) {
    return true;
  }

  // IPv4 literal checks. (Bare octets >255 yield an invalid URL earlier, so
  // every octet here is already 0–255.)
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    // 127.0.0.0/8 loopback, 0.0.0.0/8 "this host", 169.254.0.0/16 link-local
    // (incl. cloud metadata 169.254.169.254), RFC1918 private ranges.
    return (
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  // IPv6 literal checks: ::1 loopback, :: unspecified, fe80::/10 link-local,
  // fc00::/7 unique-local.
  if (host.includes(':')) {
    const lower6 = host.toLowerCase();
    if (lower6 === '::1' || lower6 === '::') return true;
    if (lower6.startsWith('fe80:')) return true;
    if (lower6.startsWith('fc') || lower6.startsWith('fd')) return true;
  }

  return false;
}

/**
 * Validates the input path or URL.
 * @param input - Input path or URL
 * @returns true if valid
 */
export function validateInput(input: string): boolean {
  if (!input) return false;

  // Check if it's a URL
  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // SSRF guard: block private/loopback/link-local hosts for remote inputs.
    if (isPrivateOrLoopbackHost(url.hostname)) {
      return false;
    }
    return true;
  } catch {
    // Not a URL, check if it's a file path
    // For file paths, we'll let parseOpenAPI handle it
    return input.length > 0;
  }
}

/**
 * Action handler for the generate command.
 * @param options - Command options
 */
export async function generateAction(options: {
  input: string;
  output: string;
  config?: string;
  tsConfigFilePath?: string;
}) {
  const logger = new ConsoleLogger();

  // Handle signals
  process.on('SIGINT', () => {
    logger.error('Generation interrupted by user');
    process.exit(130);
  });

  // Validate input
  if (!validateInput(options.input)) {
    logger.error('Invalid input: must be a valid file path or HTTP/HTTPS URL');
    process.exit(2);
  }

  try {
    logger.info(`Fetcher Generator v${packageJson.version}`);
    logger.info('Starting code generation...');
    const generatorOptions: GeneratorOptions = {
      inputPath: options.input,
      outputDir: options.output,
      configPath: options.config,
      tsConfigFilePath: options.tsConfigFilePath,
      logger,
    };
    const codeGenerator = new CodeGenerator(generatorOptions);
    await codeGenerator.generate();
    logger.success(
      `Code generation completed successfully! Files generated in: ${options.output}`,
    );
  } catch (error) {
    logger.error(`Error during code generation: \n`, error);
    process.exit(1);
  }
}
