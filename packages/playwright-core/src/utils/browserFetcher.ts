/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import extract from 'extract-zip';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { existsAsync, download } from './utils';
import { debugLogger } from './debugLogger';

export async function downloadBrowserWithProgressBar(title: string, browserDirectory: string, executablePath: string, downloadURL: string, downloadFileName: string): Promise<boolean> {
  const progressBarName = `Playwright build of ${title}`;
  if (await existsAsync(browserDirectory)) {
    // Already downloaded.
    debugLogger.log('install', `browser ${title} is already downloaded.`);
    return false;
  }

  const url = downloadURL;
  const zipPath = path.join(os.tmpdir(), downloadFileName);
  try {
    await download(url, zipPath, {
      progressBarName,
      log: debugLogger.log.bind(debugLogger, 'install')
    });
    debugLogger.log('install', `extracting archive`);
    debugLogger.log('install', `-- zip: ${zipPath}`);
    debugLogger.log('install', `-- location: ${browserDirectory}`);
    await extract(zipPath, { dir: browserDirectory });
    debugLogger.log('install', `fixing permissions at ${executablePath}`);
    await fs.promises.chmod(executablePath, 0o755);
  } catch (e) {
    debugLogger.log('install', `FAILED installation ${progressBarName} with error: ${e}`);
    process.exitCode = 1;
    throw e;
  } finally {
    if (await existsAsync(zipPath))
      await fs.promises.unlink(zipPath);
  }
  logPolitely(`${progressBarName} downloaded to ${browserDirectory}`);
  return true;
}


export function logPolitely(toBeLogged: string) {
  const logLevel = process.env.npm_config_loglevel;
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel || '') > -1;

  if (!logLevelDisplay)
    console.log(toBeLogged);  // eslint-disable-line no-console
}
