import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Contribution_Key {
  id: UUIDString;
  __typename?: 'Contribution_Key';
}

export interface CreateTaskData {
  task_insert: Task_Key;
}

export interface CreateTaskVariables {
  title: string;
  dueDate: TimestampString;
  userId?: UUIDString | null;
  groupId: UUIDString;
}

export interface GetUserTasksData {
  tasks: ({
    id: UUIDString;
    title: string;
    dueDate: TimestampString;
    status?: string | null;
  } & Task_Key)[];
}

export interface Group_Key {
  id: UUIDString;
  __typename?: 'Group_Key';
}

export interface ListGroupTasksData {
  tasks: ({
    id: UUIDString;
    title: string;
    status?: string | null;
    dueDate: TimestampString;
    user?: {
      fullName: string;
    };
  } & Task_Key)[];
}

export interface ListGroupTasksVariables {
  groupId: UUIDString;
}

export interface Membership_Key {
  id: UUIDString;
  __typename?: 'Membership_Key';
}

export interface Payout_Key {
  id: UUIDString;
  __typename?: 'Payout_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface UpdateTaskStatusData {
  task_update?: Task_Key | null;
}

export interface UpdateTaskStatusVariables {
  id: UUIDString;
  status: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
  operationName: string;
}
export const createTaskRef: CreateTaskRef;

export function createTask(vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;
export function createTask(dc: DataConnect, vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;

interface UpdateTaskStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTaskStatusVariables): MutationRef<UpdateTaskStatusData, UpdateTaskStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTaskStatusVariables): MutationRef<UpdateTaskStatusData, UpdateTaskStatusVariables>;
  operationName: string;
}
export const updateTaskStatusRef: UpdateTaskStatusRef;

export function updateTaskStatus(vars: UpdateTaskStatusVariables): MutationPromise<UpdateTaskStatusData, UpdateTaskStatusVariables>;
export function updateTaskStatus(dc: DataConnect, vars: UpdateTaskStatusVariables): MutationPromise<UpdateTaskStatusData, UpdateTaskStatusVariables>;

interface ListGroupTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListGroupTasksVariables): QueryRef<ListGroupTasksData, ListGroupTasksVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListGroupTasksVariables): QueryRef<ListGroupTasksData, ListGroupTasksVariables>;
  operationName: string;
}
export const listGroupTasksRef: ListGroupTasksRef;

export function listGroupTasks(vars: ListGroupTasksVariables, options?: ExecuteQueryOptions): QueryPromise<ListGroupTasksData, ListGroupTasksVariables>;
export function listGroupTasks(dc: DataConnect, vars: ListGroupTasksVariables, options?: ExecuteQueryOptions): QueryPromise<ListGroupTasksData, ListGroupTasksVariables>;

interface GetUserTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserTasksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserTasksData, undefined>;
  operationName: string;
}
export const getUserTasksRef: GetUserTasksRef;

export function getUserTasks(options?: ExecuteQueryOptions): QueryPromise<GetUserTasksData, undefined>;
export function getUserTasks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserTasksData, undefined>;

