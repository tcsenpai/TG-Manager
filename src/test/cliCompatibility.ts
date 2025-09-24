// CLI compatibility test - Generate tasks.json and test with CLI tool
// This verifies our bot creates exactly compatible JSON structure

import { UserStorage } from '../core/UserStorage';
import { TaskManager } from '../core/TaskManager';
import { DEFAULT_TASK_STATES } from '../types/cli';

async function testCLICompatibility(): Promise<void> {
  console.log('🧪 Testing CLI Compatibility...\n');

  try {
    // Create test user storage
    const userStorage = new UserStorage('test_user');
    const taskManager = new TaskManager(userStorage);

    console.log('1. Initializing user storage...');
    await userStorage.initialize();

    console.log('2. Creating test tasks to match CLI patterns...');

    // Create tasks matching the structure from your tasks/tasks.json
    const syncTaskId = await taskManager.addTask({
      name: 'Sync with linux PCs',
      state: 'todo'
    });

    // Add subtasks
    await taskManager.addTask({
      name: 'Sync solana wallet',
      state: 'todo'
    }, syncTaskId);

    await taskManager.addTask({
      name: 'Sync tasks.json',
      state: 'done'
    }, syncTaskId);

    await taskManager.addTask({
      name: 'Link /Users to /home on linux machines',
      state: 'done'
    }, syncTaskId);

    // Create another top-level task
    const fixTaskId = await taskManager.addTask({
      name: 'Fix tg identities',
      state: 'done'
    });

    await taskManager.addTask({
      name: 'Fix tg identities backend (node)',
      state: 'done'
    }, fixTaskId);

    await taskManager.addTask({
      name: 'Fix tg identities PoC',
      state: 'currently_doing'
    }, fixTaskId);

    // Simple task without subtasks
    await taskManager.addTask({
      name: 'Make a tg alt',
      state: 'todo'
    });

    console.log('3. Testing state transitions...');

    // Test incrementing state
    const testTaskId = await taskManager.addTask({
      name: 'Test task for state changes',
      state: 'todo'
    });

    console.log(`   Created task ${testTaskId} in 'todo' state`);

    await taskManager.incrementTask([testTaskId]);
    const task = await taskManager.getTask(testTaskId);
    console.log(`   Incremented to '${task.state}' state`);

    await taskManager.completeTask([testTaskId]);
    const completedTask = await taskManager.getTask(testTaskId);
    console.log(`   Completed to '${completedTask.state}' state`);

    console.log('4. Testing search functionality...');
    const searchResults = await taskManager.searchTasks('sync');
    console.log(`   Found ${searchResults.length} tasks matching 'sync'`);

    console.log('5. Getting task statistics...');
    const stats = await taskManager.getStats();
    console.log('   Task stats:', stats);

    console.log('6. Generated JSON file location:');
    console.log(`   📁 ${userStorage.getTasksFilePath()}`);

    console.log('\n✅ CLI compatibility test completed successfully!');
    console.log('\n🔍 Next steps:');
    console.log('   1. cd CLI-Manager && bun run build');
    console.log(`   2. cd ${userStorage.getUserDirectory()}`);
    console.log('   3. ../../CLI-Manager/build/main.js');
    console.log('   4. Verify the tasks display correctly in CLI format');

  } catch (error) {
    console.error('❌ CLI compatibility test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCLICompatibility();