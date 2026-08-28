/*
 * Storage Module — Content Automation Platform
 * Provides StorageProvider via NestJS DI.
 */

import { Module, Global, Provider } from '@nestjs/common';
import { createStorageProvider } from './storage.service';

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

const storageProvider: Provider = {
  provide: STORAGE_PROVIDER,
  useFactory: () => createStorageProvider(),
};

@Global()
@Module({
  providers: [storageProvider],
  exports: [storageProvider],
})
export class StorageModule {}
