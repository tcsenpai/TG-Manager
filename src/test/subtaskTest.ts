// Test subtask functionality
import { UserStorage } from '../core/UserStorage';
import { TaskManager } from '../core/TaskManager';

async function testSubtasks(): Promise<void> {
  console.log('🧪 Testing subtask functionality...');

  try {
    const userId = 'subtask_test';
    const userStorage = new UserStorage(userId);
    const taskManager = new TaskManager(userStorage);

    await userStorage.initialize();

    // Create parent task
    const parentId = await taskManager.addTask({
      name: 'Complete Phase 3',
      description: 'Telegram UI implementation'
    });
    console.log(`✅ Parent task created: ${parentId}`);

    // Create subtasks
    const subtask1 = await taskManager.addTask({
      name: 'Fix subtask view',
      description: 'Handle view subtasks button'
    }, parentId);

    const subtask2 = await taskManager.addTask({
      name: 'Test mobile interface',
      description: 'Verify all buttons work'
    }, parentId);

    const subtask3 = await taskManager.addTask({
      name: 'Document features'
    }, parentId);

    console.log(`✅ Subtasks created: ${subtask1}, ${subtask2}, ${subtask3}`);

    // Change some subtask states
    await taskManager.incrementTask([subtask1]); // to currently_doing
    await taskManager.completeTask([subtask2]); // to done

    // Get parent with subtasks
    const parentTask = await taskManager.getTask(parentId);
    console.log(`✅ Parent task has ${parentTask.subtasks?.length} subtask(s)`);

    if (parentTask.subtasks) {
      console.log('📋 Subtasks:');
      parentTask.subtasks.forEach(subtask => {
        console.log(`  - ${subtask.state}: ${subtask.name}`);
      });
    }

    console.log('🎉 Subtask functionality test passed!');
  } catch (error) {
    console.error('❌ Subtask test failed:', error);
    process.exit(1);
  }
}

testSubtasks();