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

import { cloneSnapshot } from '../../lib/types.js';
import type {
  RecordSession,
  ViewHost,
  ViewInstance,
  ViewInstancePermissions,
} from '../recordModel.js';
import { isSystemSession } from './sessionState.js';

export function permissionsFor(
  host: ViewHost,
  session?: RecordSession,
): ViewInstancePermissions {
  const denied = {
    save: false,
    saveAsPersonal: false,
    saveAsShared: false,
    delete: false,
    rename: false,
  };
  if (!session || !host.getInstancePermissions) return denied;
  try {
    const permissions = host.getInstancePermissions(
      cloneSnapshot<ViewInstance>(session.instance),
    );
    const system = isSystemSession(session);
    return {
      delete:
        !system &&
        typeof host.deleteInstance === 'function' &&
        permissions?.delete === true,
      rename:
        !system &&
        typeof host.renameInstance === 'function' &&
        permissions?.rename === true,
      save:
        typeof host.saveInstance === 'function' && permissions?.save === true,
      saveAsPersonal:
        typeof host.createInstance === 'function' &&
        permissions?.saveAsPersonal === true,
      saveAsShared:
        typeof host.createInstance === 'function' &&
        permissions?.saveAsShared === true,
    };
  } catch {
    return denied;
  }
}
