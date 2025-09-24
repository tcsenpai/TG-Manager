// Debug test to isolate the hanging issue
import { UserStorage } from '../core/UserStorage';

async function debugTest(): Promise<void> {
  console.log('🔍 Debug test starting...');

  try {
    console.log('1. Creating UserStorage...');
    const userStorage = new UserStorage('debug_test');

    console.log('2. Initializing...');
    await userStorage.initialize();
    console.log('   Initialize completed');

    console.log('3. Loading storage...');
    const data = await userStorage.loadStorage();
    console.log('   Storage loaded:', JSON.stringify(data, null, 2));

    console.log('✅ Debug test completed!');
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }

  // Force exit to prevent hang
  process.exit(0);
}

debugTest();