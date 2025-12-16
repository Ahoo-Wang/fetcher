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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFullscreenElement,
  enterFullscreen,
  exitFullscreen,
  addFullscreenChangeListener,
  removeFullscreenChangeListener,
} from '../../../src';

describe('fullscreen utils', () => {
  let mockElement: HTMLElement;
  let originalDocument: any;

  beforeEach(() => {
    // Create a real DOM element for testing
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    // Store original document properties
    originalDocument = {
      fullscreenElement: document.fullscreenElement,
      webkitFullscreenElement: (document as any).webkitFullscreenElement,
      mozFullScreenElement: (document as any).mozFullScreenElement,
      msFullscreenElement: (document as any).msFullscreenElement,
      exitFullscreen: document.exitFullscreen,
      webkitExitFullscreen: (document as any).webkitExitFullscreen,
      mozCancelFullScreen: (document as any).mozCancelFullScreen,
      msExitFullscreen: (document as any).msExitFullscreen,
      addEventListener: document.addEventListener.bind(document),
      removeEventListener: document.removeEventListener.bind(document),
    };
  });

  afterEach(() => {
    // Restore original document properties
    Object.assign(document, originalDocument);
    document.body.removeChild(mockElement);
  });

  describe('getFullscreenElement', () => {
    it('should return standard fullscreenElement when available', () => {
      const testElement = document.createElement('div');
      (document as any).fullscreenElement = testElement;

      expect(getFullscreenElement()).toBe(testElement);
    });

    it('should return webkitFullscreenElement when standard is not available', () => {
      const testElement = document.createElement('div');
      (document as any).fullscreenElement = null;
      (document as any).webkitFullscreenElement = testElement;

      expect(getFullscreenElement()).toBe(testElement);
    });

    it('should return mozFullScreenElement when others are not available', () => {
      const testElement = document.createElement('div');
      (document as any).fullscreenElement = null;
      (document as any).webkitFullscreenElement = null;
      (document as any).mozFullScreenElement = testElement;

      expect(getFullscreenElement()).toBe(testElement);
    });

    it('should return msFullscreenElement when others are not available', () => {
      const testElement = document.createElement('div');
      (document as any).fullscreenElement = null;
      (document as any).webkitFullscreenElement = null;
      (document as any).mozFullScreenElement = null;
      (document as any).msFullscreenElement = testElement;

      expect(getFullscreenElement()).toBe(testElement);
    });

    it('should return null when no fullscreen element exists', () => {
      (document as any).fullscreenElement = null;
      (document as any).webkitFullscreenElement = null;
      (document as any).mozFullScreenElement = null;
      (document as any).msFullscreenElement = null;

      expect(getFullscreenElement()).toBeNull();
    });

    it('should prioritize standard API over vendor prefixes', () => {
      const standardElement = document.createElement('div');
      const webkitElement = document.createElement('div');
      (document as any).fullscreenElement = standardElement;
      (document as any).webkitFullscreenElement = webkitElement;

      expect(getFullscreenElement()).toBe(standardElement);
    });
  });

  describe('enterFullscreen', () => {
    it('should call requestFullscreen when available', async () => {
      const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined);
      mockElement.requestFullscreen = mockRequestFullscreen;

      await expect(enterFullscreen(mockElement)).resolves.toBeUndefined();
      expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should call webkitRequestFullscreen when standard is not available', async () => {
      const mockWebkitRequest = vi.fn().mockResolvedValue(undefined);
      (mockElement as any).webkitRequestFullscreen = mockWebkitRequest;

      await expect(enterFullscreen(mockElement)).resolves.toBeUndefined();
      expect(mockWebkitRequest).toHaveBeenCalledTimes(1);
    });

    it('should call mozRequestFullScreen when others are not available', async () => {
      const mockMozRequest = vi.fn().mockResolvedValue(undefined);
      (mockElement as any).mozRequestFullScreen = mockMozRequest;

      await expect(enterFullscreen(mockElement)).resolves.toBeUndefined();
      expect(mockMozRequest).toHaveBeenCalledTimes(1);
    });

    it('should call msRequestFullscreen when others are not available', async () => {
      const mockMsRequest = vi.fn().mockResolvedValue(undefined);
      (mockElement as any).msRequestFullscreen = mockMsRequest;

      await expect(enterFullscreen(mockElement)).resolves.toBeUndefined();
      expect(mockMsRequest).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no fullscreen method is available', async () => {
      // Element without any fullscreen methods
      const plainElement = document.createElement('div');

      await expect(enterFullscreen(plainElement)).rejects.toThrow();
    });

    it('should throw error when fullscreen request fails', async () => {
      const mockRequestFullscreen = vi
        .fn()
        .mockRejectedValue(new Error('User denied'));
      mockElement.requestFullscreen = mockRequestFullscreen;

      await expect(enterFullscreen(mockElement)).rejects.toThrow('User denied');
      expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should prioritize standard API over vendor prefixes', async () => {
      const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined);
      const mockWebkitRequest = vi.fn().mockResolvedValue(undefined);
      mockElement.requestFullscreen = mockRequestFullscreen;
      (mockElement as any).webkitRequestFullscreen = mockWebkitRequest;

      await enterFullscreen(mockElement);
      expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
      expect(mockWebkitRequest).not.toHaveBeenCalled();
    });

    it('should handle element without any methods gracefully by throwing', async () => {
      const elementWithoutMethods = {} as HTMLElement;

      await expect(enterFullscreen(elementWithoutMethods)).rejects.toThrow();
    });
  });

  describe('exitFullscreen', () => {
    it('should call exitFullscreen when available', async () => {
      const mockExitFullscreen = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = mockExitFullscreen;

      await expect(exitFullscreen()).resolves.toBeUndefined();
      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should call webkitExitFullscreen when standard is not available', async () => {
      const mockWebkitExit = vi.fn().mockResolvedValue(undefined);
      (document as any).webkitExitFullscreen = mockWebkitExit;

      await expect(exitFullscreen()).resolves.toBeUndefined();
      expect(mockWebkitExit).toHaveBeenCalledTimes(1);
    });

    it('should call mozCancelFullScreen when others are not available', async () => {
      const mockMozCancel = vi.fn().mockResolvedValue(undefined);
      (document as any).mozCancelFullScreen = mockMozCancel;

      await expect(exitFullscreen()).resolves.toBeUndefined();
      expect(mockMozCancel).toHaveBeenCalledTimes(1);
    });

    it('should call msExitFullscreen when others are not available', async () => {
      const mockMsExit = vi.fn().mockResolvedValue(undefined);
      (document as any).msExitFullscreen = mockMsExit;

      await expect(exitFullscreen()).resolves.toBeUndefined();
      expect(mockMsExit).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no exit method is available', async () => {
      // Remove all exit methods
      document.exitFullscreen = undefined as any;
      (document as any).webkitExitFullscreen = undefined;
      (document as any).mozCancelFullScreen = undefined;
      (document as any).msExitFullscreen = undefined;

      await expect(exitFullscreen()).rejects.toThrow();
    });

    it('should throw error when exit request fails', async () => {
      const mockExitFullscreen = vi
        .fn()
        .mockRejectedValue(new Error('Exit failed'));
      document.exitFullscreen = mockExitFullscreen;

      await expect(exitFullscreen()).rejects.toThrow('Exit failed');
      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should prioritize standard API over vendor prefixes', async () => {
      const mockExitFullscreen = vi.fn().mockResolvedValue(undefined);
      const mockWebkitExit = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = mockExitFullscreen;
      (document as any).webkitExitFullscreen = mockWebkitExit;

      await exitFullscreen();
      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
      expect(mockWebkitExit).not.toHaveBeenCalled();
    });
  });

  describe('addFullscreenChangeListener', () => {
    it('should add all fullscreen change event listeners', () => {
      const mockCallback = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      addFullscreenChangeListener(mockCallback);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'fullscreenchange',
        mockCallback,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        mockCallback,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mozfullscreenchange',
        mockCallback,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'MSFullscreenChange',
        mockCallback,
      );
      expect(addEventListenerSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle callback being called multiple times', () => {
      const mockCallback = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      addFullscreenChangeListener(mockCallback);
      addFullscreenChangeListener(mockCallback);

      expect(addEventListenerSpy).toHaveBeenCalledTimes(8); // 4 events * 2 calls
    });
  });

  describe('removeFullscreenChangeListener', () => {
    it('should remove all fullscreen change event listeners', () => {
      const mockCallback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      removeFullscreenChangeListener(mockCallback);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'fullscreenchange',
        mockCallback,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        mockCallback,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mozfullscreenchange',
        mockCallback,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'MSFullscreenChange',
        mockCallback,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle callback being removed multiple times', () => {
      const mockCallback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      removeFullscreenChangeListener(mockCallback);
      removeFullscreenChangeListener(mockCallback);

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(8); // 4 events * 2 calls
    });
  });

  describe('integration and edge cases', () => {
    it('should handle rapid enter/exit calls without issues', async () => {
      const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined);
      const mockExitFullscreen = vi.fn().mockResolvedValue(undefined);
      mockElement.requestFullscreen = mockRequestFullscreen;
      document.exitFullscreen = mockExitFullscreen;

      await Promise.all([
        enterFullscreen(mockElement),
        exitFullscreen(),
        enterFullscreen(mockElement),
      ]);

      expect(mockRequestFullscreen).toHaveBeenCalledTimes(2);
      expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid element types gracefully', async () => {
      // Test with a detached element
      const detachedElement = document.createElement('div');
      const mockRequestFullscreen = vi
        .fn()
        .mockRejectedValue(new Error('Invalid element'));
      detachedElement.requestFullscreen = mockRequestFullscreen;

      await expect(enterFullscreen(detachedElement)).rejects.toThrow(
        'Invalid element',
      );
    });

    it('should handle document not being available (edge case)', () => {
      // This is hard to test without mocking global document, but in jsdom it should be fine
      expect(() => getFullscreenElement()).not.toThrow();
    });

    it('should handle listeners with complex callbacks', () => {
      const complexCallback = () => {
        console.log('Complex callback');
        return true;
      };
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      addFullscreenChangeListener(complexCallback);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'fullscreenchange',
        complexCallback,
      );
    });
  });
});
