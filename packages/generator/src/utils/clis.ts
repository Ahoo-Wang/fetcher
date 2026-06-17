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
 * Returns true when `hostname` refers to a host the generator should refuse to
 * fetch a remote OpenAPI spec from. Used to block SSRF: a crafted `-i` input
 * could otherwise make the generator host probe sensitive internal endpoints
 * (cloud metadata services, RFC1918 ranges).
 *
 * Loopback (localhost / 127.0.0.0/8 / ::1) is INTENTIONALLY ALLOWED: the
 * generator is a developer-run CLI, and pointing it at a local mock server
 * (`http://localhost:8080/api-docs`) is a legitimate, common workflow. The
 * SSRF threat model here is non-loopback internal services (cloud metadata,
 * private subnets), not the developer's own machine.
 *
 * Note on IPv6: the WHATWG `URL` parser normalizes IPv4-mapped IPv6 addresses
 * (e.g. `[::ffff:169.254.169.254]`) to pure hex form, so the dotted-quad tail
 * is gone by the time we see the hostname. A hex-encoded v4-mapped private
 * address is not caught here — accepting this residual risk in exchange for
 * not rejecting legitimate public IPv6 hosts.
 */
function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|]$/g, '');

  // IPv4 literal checks. (Bare octets >255 yield an invalid URL earlier, so
  // every octet here is already 0–255.) 127.0.0.0/8 is loopback → allowed.
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    // 0.0.0.0/8 "this host", 169.254.0.0/16 link-local
    // (incl. cloud metadata 169.254.169.254), RFC1918 private ranges.
    return (
      a === 0 ||
      (a === 169 && b === 254) ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  // IPv6: ::1 loopback → allowed. Block link-local fe80::/10 and ULA fc00::/7.
  if (host.includes(':')) {
    const lower6 = host.toLowerCase();
    if (lower6 === '::') return true;
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
