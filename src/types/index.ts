// *****************************************************************************
// Common Types
// *****************************************************************************

export type Key = {
  pk: string;
  sk: string;
};

export type OperatorType =
  | 'begins_with'
  | 'contains'
  | 'neq'
  | 'less_than'
  | 'less_or_equal'
  | 'greater_than'
  | 'greater_or_equal'
  | 'between'
  | 'attribute_not_exists'
  | 'attribute_exists'
  | 'attribute_type'
  | 'size';

export type ParamsInfo = {
  pk: string | Record<string, string>;
  filters?: FilterInfo[];
  sort?: string;
  pagination?: Pagination;
  startKey?: string;
  verCheck?: string;
  keyConditionLogicalOperator?: string;
  filterLogicalOperator?: string;
};

export type FilterInfo = {
  field: string;
  value: string;
  value2?: string;
  operator: OperatorType;
};

export type Pagination = {
  page: number;
  perPage: number;
};

export type Options = {
  overwriting?: boolean;
  ConditionExpression?: string;
};

export enum DynamoErrorCode {
  ProvisionedThroughputExceeded = 'ProvisionedThroughputExceededException',
  ResourceNotFound = 'ResourceNotFoundException',
  ConditionalCheckFailed = 'ConditionalCheckFailedException',
  TransactionConflict = 'TransactionConflictException',
  RequestLimitExceeded = 'RequestLimitExceeded',
  InternalServerError = 'InternalServerError',
  ThrottlingException = 'ThrottlingException',
  ValidationException = 'ValidationException',
  ServiceUnavailable = 'ServiceUnavailableException',
}

export interface CustomError extends Error {
  code?: DynamoErrorCode;
  statusCode?: number;
}

export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

// *****************************************************************************
// DynamoDB Types
// *****************************************************************************

export interface DynamoDBItem {
  pk: string;
  sk: string;
  [key: string]: any; // 추가적인 속성을 허용
}

export interface DynamoDBGetItemResponse {
  Item?: DynamoDBItem;
}

export interface DynamoDBQueryResponse {
  Items?: DynamoDBItem[];
  Count?: number;
  ScannedCount?: number;
  [key: string]: any;
}

export interface DynamoDBPutItemResponse {
  [key: string]: any;
}
