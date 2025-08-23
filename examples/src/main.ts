import { initBasicGetExample } from './basicGetExample';
import { initPathParamExample } from './pathParamExample';
import { initQueryParamExample } from './queryParamExample';
import { initPostExample } from './postExample';
import { initInterceptorExample } from './interceptorExample';
import { initTimeoutExample } from './timeoutExample';

// Initialize all examples when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initBasicGetExample();
  initPathParamExample();
  initQueryParamExample();
  initPostExample();
  initInterceptorExample();
  initTimeoutExample();
});
