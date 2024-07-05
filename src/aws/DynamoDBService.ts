import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {
  CustomError,
  DynamoDBGetItemResponse,
  DynamoDBPutItemResponse,
  DynamoDBQueryResponse,
  DynamoErrorCode,
  Key,
} from '../types';

// *****************************************************************************
// DynamoDB Service Class
// *****************************************************************************

class DynamoDBService {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor(config: DynamoDBClientConfig) {
    this.client = new DynamoDBClient(config);
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  // *****************************************************************************
  // Error Handling
  // *****************************************************************************
  handleError(err: unknown, funcName: string) {
    if (err instanceof Error) {
      const customError = err as CustomError;
      customError.code =
        customError.code || DynamoErrorCode.InternalServerError;

      console.error(`[${funcName}] Error:`, {
        message: customError.message,
        code: customError.code,
        stack: customError.stack,
      });

      switch (customError.code) {
        case DynamoErrorCode.ProvisionedThroughputExceeded:
          console.error(
            `[${funcName}] Error: Provisioned throughput exceeded.`,
            customError
          );
          break;
        case DynamoErrorCode.ResourceNotFound:
          console.error(
            `[${funcName}] Error: Resource not found.`,
            customError
          );
          break;
        case DynamoErrorCode.ConditionalCheckFailed:
          console.error(
            `[${funcName}] Error: Conditional check failed.`,
            customError
          );
          break;
        case DynamoErrorCode.TransactionConflict:
          console.error(
            `[${funcName}] Error: Transaction conflict.`,
            customError
          );
          break;
        case DynamoErrorCode.RequestLimitExceeded:
          console.error(
            `[${funcName}] Error: Request limit exceeded.`,
            customError
          );
          break;
        case DynamoErrorCode.InternalServerError:
          console.error(
            `[${funcName}] Error: Internal server error.`,
            customError
          );
          break;
        case DynamoErrorCode.ThrottlingException:
          console.error(
            `[${funcName}] Error: Throttling exception.`,
            customError
          );
          break;
        case DynamoErrorCode.ValidationException:
          console.error(
            `[${funcName}] Error: Validation exception.`,
            customError
          );
          break;
        case DynamoErrorCode.ServiceUnavailable:
          console.error(
            `[${funcName}] Error: Service unavailable.`,
            customError
          );
          break;
        default:
          console.error(`[${funcName}] Error:`, customError);
      }
      throw new Error(`Error in ${funcName}: ${customError.message}`);
    } else {
      console.error(`[${funcName}] Unexpected Error:`, err);
      throw new Error(`Unexpected error in ${funcName}`);
    }
  }

  // *****************************************************************************
  // CRUD Operation
  // *****************************************************************************
  async getItem({
    tableName,
    key,
  }: {
    tableName: string;
    key: Key;
  }): Promise<DynamoDBGetItemResponse | undefined> {
    const funcName = 'getItem';
    const commandInput: GetCommandInput = { TableName: tableName, Key: key };
    const getCommand = new GetCommand(commandInput);

    try {
      const response: GetCommandOutput = await this.docClient.send(getCommand);
      return response as DynamoDBGetItemResponse;
    } catch (err) {
      this.handleError(err, funcName);
    }
  }

  async putItem({
    tableName,
    attributes,
    options,
  }: {
    tableName: string;
    attributes: Record<string, any>;
    options?: Partial<PutCommandInput>;
  }): Promise<DynamoDBPutItemResponse | undefined> {
    const funcName = 'putItem';
    const commandInput: PutCommandInput = {
      TableName: tableName,
      Item: attributes,
      ...options,
    };
    const putCommand = new PutCommand(commandInput);

    try {
      const response = await this.docClient.send(putCommand);
      return response as DynamoDBPutItemResponse;
    } catch (err) {
      this.handleError(err, funcName);
    }
  }

  async deleteItem({
    tableName,
    key,
  }: {
    tableName: string;
    key: Key;
  }): Promise<void> {
    const funcName = 'deleteItem';
    const commandInput = {
      TableName: tableName,
      Key: key,
    };
    const deleteCommand = new DeleteCommand(commandInput);

    try {
      await this.docClient.send(deleteCommand);
    } catch (err) {
      this.handleError(err, funcName);
    }
  }

  async query({
    tableName,
    options,
  }: {
    tableName: string;
    options: Partial<QueryCommandInput>;
  }): Promise<DynamoDBQueryResponse | undefined> {
    const funcName = 'query';
    const commandInput: QueryCommandInput = {
      TableName: tableName,
      ...options,
    };
    const queryCommand = new QueryCommand(commandInput);

    try {
      const response = await this.docClient.send(queryCommand);
      return response as DynamoDBQueryResponse;
    } catch (err) {
      this.handleError(err, funcName);
    }
  }
}

export { DynamoDBService };
