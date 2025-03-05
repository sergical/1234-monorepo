export interface Task {
  id: number;
  title: string;
  priority: number; // 1-4, where 1 is highest
  inbox: boolean; // Whether task is in inbox
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface TaskInput {
  title: string;
  priority: number;
  inbox: boolean;
  completed: boolean;
  createdAt: Date;
}
