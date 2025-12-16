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

/**
 * Get the current fullscreen element across different browsers.
 * @returns The fullscreen element or null if not in fullscreen.
 */
export function getFullscreenElement(): HTMLElement | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Request fullscreen for a given element.
 * @param element The element to make fullscreen.
 * @throws Error if fullscreen request fails.
 */
export async function enterFullscreen(element: HTMLElement): Promise<void> {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    } else {
      throw new Error('Fullscreen API not supported');
    }
  } catch (error) {
    console.error('Failed to enter fullscreen:', error);
    throw error;
  }
}

/**
 * Exit fullscreen mode.
 * @throws Error if fullscreen exit fails.
 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    } else {
      throw new Error('Fullscreen API not supported');
    }
  } catch (error) {
    console.error('Failed to exit fullscreen:', error);
    throw error;
  }
}

/**
 * Add fullscreen change event listeners across different browsers.
 * @param callback The callback function to execute when fullscreen changes.
 */
export function addFullscreenChangeListener(callback: () => void): void {
  document.addEventListener('fullscreenchange', callback);
  document.addEventListener('webkitfullscreenchange', callback);
  document.addEventListener('mozfullscreenchange', callback);
  document.addEventListener('MSFullscreenChange', callback);
}

/**
 * Remove fullscreen change event listeners across different browsers.
 * @param callback The callback function to remove.
 */
export function removeFullscreenChangeListener(callback: () => void): void {
  document.removeEventListener('fullscreenchange', callback);
  document.removeEventListener('webkitfullscreenchange', callback);
  document.removeEventListener('mozfullscreenchange', callback);
  document.removeEventListener('MSFullscreenChange', callback);
}
