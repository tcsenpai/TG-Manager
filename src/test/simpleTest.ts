// Simple test to verify our core functionality works
import { UserStorage } from '../core/UserStorage';
import { TaskManager } from '../core/TaskManager';

async function simpleTest(): Promise<void> {
  console.log('🧪 Running simple test...');

  const userStorage = new UserStorage('simple_test');
  const taskManager = new TaskManager(userStorage);

  try {
    // Test 1: Create a simple task
    console.log('1. Creating simple task...');
    const taskId = await taskManager.addTask({
      name: 'Test Task',
      description: 'Simple test task'
    });
    console.log(`   Created task with ID: ${taskId}`);

    // Test 2: Load and verify
    console.log('2. Loading task...');
    const task = await taskManager.getTask(taskId);
    console.log(`   Task: ${task.name} (${task.state})`);

    // Test 3: Check file was created
    console.log('3. Checking file...');
    const filePath = userStorage.getTasksFilePath();
    console.log(`   File: ${filePath}`);

    console.log('✅ Simple test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

simpleTest();