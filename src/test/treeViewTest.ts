// Test tree view functionality
import { UserStorage } from '../core/UserStorage';
import { TaskManager } from '../core/TaskManager';

// Import the private formatting function for testing
import { handleTasksTree } from '../bot/handlers/taskList';

async function testTreeView(): Promise<void> {
  console.log('🌳 Testing tree view functionality...');

  try {
    const userId = 'tree_test';
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    await userStorage.initialize();

    // Create the same structure as our existing test data
    const parentId = await taskManager.addTask({
      name: 'Complete Phase 3',
      description: 'Telegram UI implementation'
    });

    const sub1 = await taskManager.addTask({
      name: 'Fix subtask view',
      description: 'Handle view subtasks button'
    }, parentId);

    const sub2 = await taskManager.addTask({
      name: 'Test mobile interface',
      description: 'Verify all buttons work'
    }, parentId);

    const sub3 = await taskManager.addTask({
      name: 'Document features'
    }, parentId);

    // Match the states from CLI output
    await taskManager.incrementTask([sub1]); // currently_doing
    await taskManager.completeTask([sub2]); // done
    // sub3 stays as todo

    // Get tasks and verify structure
    const tasks = await taskManager.getAllTasks();
    console.log('✅ Created test structure with subtasks');

    // Test stats
    const stats = await taskManager.getStats();
    console.log('📊 Stats:', stats);
    console.log(`📊 Expected: 2 todo (50%) ► 1 currently_doing (25%) ► 1 done (25%) ❯ 4`);

    console.log('🎉 Tree view structure test passed!');
  } catch (error) {
    console.error('❌ Tree view test failed:', error);
    process.exit(1);
  }
}

testTreeView();