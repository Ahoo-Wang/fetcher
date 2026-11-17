#!/bin/sh

#
# Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#      http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Stop at the first failing step: a failed install, format, lint, build or test
# must not run the later steps or print the success message. `sh` runs this
# script (package.json "init"), so only POSIX options are used.
set -eu

# Install dependencies
pnpm install
# Format all packages
pnpm format
# Lint all packages
pnpm lint
# Build all packages
pnpm run build
# Run tests
pnpm run test

echo "Fetcher project initialized successfully!"
