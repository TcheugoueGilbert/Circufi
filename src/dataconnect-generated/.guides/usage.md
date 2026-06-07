# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createTask, updateTaskStatus, listGroupTasks, getUserTasks } from '@dataconnect/generated';


// Operation CreateTask:  For variables, look at type CreateTaskVars in ../index.d.ts
const { data } = await CreateTask(dataConnect, createTaskVars);

// Operation UpdateTaskStatus:  For variables, look at type UpdateTaskStatusVars in ../index.d.ts
const { data } = await UpdateTaskStatus(dataConnect, updateTaskStatusVars);

// Operation ListGroupTasks:  For variables, look at type ListGroupTasksVars in ../index.d.ts
const { data } = await ListGroupTasks(dataConnect, listGroupTasksVars);

// Operation GetUserTasks: 
const { data } = await GetUserTasks(dataConnect);


```