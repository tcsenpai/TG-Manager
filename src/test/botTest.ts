// Simple bot functionality test
import { UserStorage } from '../core/UserStorage';
import { TaskManager } from '../core/TaskManager';

async function testBotBasics(): Promise<void> {
  console.log('🧪 Testing bot core functionality...');

  try {
    const userId = 'bot_test';
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    // Initialize storage
    await userStorage.initialize();
    console.log('✅ User storage initialized');

    // Test adding a task
    const taskId = await taskManager.addTask({ name: 'Test bot task' });
    console.log(`✅ Task created with ID: ${taskId}`);

    // Test viewing tasks
    const tasks = await taskManager.getAllTasks();
    console.log(`✅ Found ${tasks.length} task(s)`);

    // Test task statistics
    const stats = await taskManager.getStats();
    console.log('✅ Stats:', stats);

    // Test search
    const searchResults = await taskManager.searchTasks('test');
    console.log(`✅ Search found ${searchResults.length} result(s)`);

    // Test status change
    await taskManager.incrementTask([taskId]);
    console.log('✅ Task status changed');

    // Clean up
    await taskManager.deleteTask([taskId]);
    console.log('✅ Test task deleted');

    console.log('🎉 All bot core tests passed!');
  } catch (error) {
    console.error('❌ Bot test failed:', error);
    process.exit(1);
  }
}

testBotBasics();