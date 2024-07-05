import { DynamoDBService } from './aws/DynamoDBService';
import _ from 'lodash';
import {
  replaceSymbol,
  isIterableArray,
  hashGenerator,
  convertLogicalOperator,
  setOperator,
  toDynamoDBValue,
} from './utils/helpers';
import {
  Key,
  ParamsInfo,
  Options,
  LogicalOperator,
  DynamoDBPutItemResponse,
  DynamoDBGetItemResponse,
} from './types';
import { QueryCommandInput, AttributeValue } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';

dotenv.config();

interface GetItemParams {
  tableName: string;
  params: {
    key: Key;
  };
}

interface CreateItemParams {
  tableName: string;
  params: {
    attributes: Record<string, any>;
  };
  options?: Options;
}

interface UpdateItemParams {
  tableName: string;
  params: {
    key: Key;
    data: Record<string, any>;
  };
}

interface DeleteItemParams {
  tableName: string;
  params: {
    key: Key;
  };
}

interface DbService {
  putItem(params: any): Promise<any>;
  getItem(params: any): Promise<any>;
  deleteItem(params: any): Promise<any>;
  query(params: any): Promise<any>;
  handleError(error: any, functionName: string): void;
}

// *****************************************************************************
// DynamoODM Class
// *****************************************************************************

class DynamoODM {
  private dbService: DbService;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing required environment variables for AWS configuration'
      );
    }

    this.dbService = new DynamoDBService({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // *****************************************************************************
  // CRUD Operation
  // *****************************************************************************

  /**
   * DynamoDB 항목을 가져옵니다.
   *
   * @param {GetItemParams} params - 항목 조회 매개변수.
   * @returns {Promise<Record<string, any>>} 조회된 항목.
   * @throws {Error} - 조회 실패 시 에러를 던집니다.
   */
  async getItem({
    tableName,
    params: { key },
  }: GetItemParams): Promise<Record<string, any> | undefined> {
    const funcName = 'DynamoODM.getItem';
    console.log(`[${funcName}] Input:`, { tableName, key });

    try {
      const response = await this.dbService.getItem({
        tableName,
        key,
      });
      if (!response?.Item) {
        throw new Error(
          `[${funcName}] DynamoDB에서 항목을 가져오지 못했습니다.`
        );
      }
      return response.Item as Record<string, any>;
    } catch (err) {
      this.dbService.handleError(err, funcName);
    }
  }

  /**
   * DynamoDB 항목을 생성합니다.
   *
   * @param {CreateItemParams} params - 항목 생성 매개변수.
   * @returns {Promise<Record<string, any> | undefined>} 생성된 항목.
   */
  async createItem({
    tableName,
    params: { attributes },
    options,
  }: CreateItemParams): Promise<Record<string, any> | undefined> {
    const funcName = 'DynamoODM.create';
    console.log(`[${funcName}] Input:`, { tableName, attributes, options });

    const timeStamp = new Date().toISOString();
    const { pk, sk } = attributes;
    const key = { pk, sk };

    const itemAttributes = {
      ...attributes,
      created_at: timeStamp,
    };

    const opts: any = {
      overwriting: true,
      ...options,
    };

    if (!opts.overwriting) {
      opts.ConditionExpression = `attribute_not_exists(pk) and attribute_not_exists(sk)`;
    }

    try {
      const putResponse = await this.dbService.putItem({
        tableName,
        attributes: itemAttributes,
        options: opts,
      });

      if (!putResponse) {
        throw new Error(`[${funcName}] No response from DynamoDB`);
      }

      const response = await this.dbService.getItem({
        tableName,
        key,
      });

      if (!response?.Item) {
        throw new Error(`[${funcName}] No response from DynamoDB`);
      }

      return response.Item as Record<string, any>;
    } catch (err) {
      this.dbService.handleError(err, funcName);
    }
  }

  /**
   * DynamoDB 항목을 삭제합니다.
   *
   * @param {DeleteItemParams} params - 항목 삭제 매개변수.
   * @returns {Promise<void>} - 성공 시 아무 값도 반환하지 않습니다.
   * @throws {Error} - 삭제 실패 시 에러를 던집니다.
   */
  async deleteItem({
    tableName,
    params: { key },
  }: DeleteItemParams): Promise<void> {
    const funcName = 'DynamoODM.delete';
    console.log(`[${funcName}] Input:`, { tableName, key });

    try {
      await this.dbService.deleteItem({
        tableName,
        key,
      });
    } catch (err) {
      this.dbService.handleError(err, funcName);
    }
  }

  /**
   * DynamoDB 항목을 업데이트합니다.
   *
   * @param {UpdateItemParams} params - 항목 업데이트 매개변수.
   * @returns {Promise<Record<string, any>>} - 업데이트된 항목.
   * @throws {Error} - 업데이트 실패 시 에러를 던집니다.
   */
  async updateItem({
    tableName,
    params,
  }: UpdateItemParams): Promise<Record<string, any> | undefined> {
    const funcName = 'DynamoODM.update';
    console.log(`[${funcName}] Input:`, { tableName, params });

    const { key, data } = params;
    const timeStamp = new Date().toISOString();

    // getItem 호출에서 undefined가 반환될 경우를 처리
    const getItemResponse = await this.dbService.getItem({
      tableName,
      key,
    });

    const previousData = getItemResponse?.Item as
      | Record<string, any>
      | undefined;

    if (!previousData) {
      throw new Error(
        `[${funcName}] No previous data found for the given key.`
      );
    }

    let requestData = { ...previousData };

    for (const attr in data) {
      if (Array.isArray(data[attr]?.add) || Array.isArray(data[attr]?.remove)) {
        if (data[attr]?.add !== undefined && !previousData?.[attr])
          previousData[attr] = [];
        const arrValue = [
          ...new Set(
            data[attr].add
              ? [...data[attr].add, ...previousData[attr]]
              : previousData[attr]
          ),
        ];
        data[attr] = arrValue.filter((v) => !data[attr].remove?.includes(v));
        requestData = {
          ...requestData,
          ...(data[attr].length > 0 && { [attr]: data[attr] }),
        };
      } else if (
        data[attr]?.add &&
        Object.keys(data[attr].add) &&
        !Array.isArray(data[attr].add)
      ) {
        if (!requestData[attr]) {
          requestData = {
            ...requestData,
            [attr]: {
              ...requestData[attr],
              ...data[attr].add,
            },
          };
        }
        _.merge(requestData?.[attr], data[attr]?.add);
      } else if (data[attr]?.remove && typeof data[attr]?.remove === 'string') {
        _.unset(requestData?.[attr], data[attr]?.remove);
      } else {
        requestData = {
          ...requestData,
          [attr]: data[attr],
        };
      }
    }

    try {
      const putResponse: DynamoDBPutItemResponse | undefined =
        await this.dbService.putItem({
          tableName: tableName,
          attributes: { ...requestData, updated_at: timeStamp },
        });

      if (!putResponse) {
        throw new Error(
          `[${funcName}] No response from DynamoDB during put operation.`
        );
      }

      const updatedResponse = await this.dbService.getItem({
        tableName,
        key,
      });

      if (!updatedResponse || !updatedResponse.Item) {
        throw new Error(`[${funcName}] No response from DynamoDB`);
      }
      return updatedResponse.Item as Record<string, any>;
    } catch (err) {
      this.dbService.handleError(err, funcName);
    }
    return undefined; // 오류가 발생하면 undefined 반환
  }

  /**
   * DynamoDB 항목 목록을 가져옵니다.
   *
   * @param {object} params - 항목 목록 조회 매개변수.
   * @returns {Promise<Record<string, any>[]>} 조회된 항목 목록.
   * @throws {Error} - 조회 실패 시 에러를 던집니다.
   */
  async getList({
    tableName,
    params,
    indexName,
  }: {
    tableName: string;
    params: ParamsInfo;
    indexName?: string;
  }): Promise<Record<string, any>[]> {
    const funcName = 'DynamoODM.getList';

    let {
      pk,
      filters = [],
      keyConditionLogicalOperator = LogicalOperator.AND,
      filterLogicalOperator = LogicalOperator.AND,
      sort,
      pagination,
      startKey,
    } = params;
    const limit = pagination?.perPage;

    const [attrKey, attrValue] =
      typeof pk === 'object' ? Object.entries(pk).flat() : ['pk', pk];

    const pkObj = {
      attrKeyName: '#' + replaceSymbol(attrKey),
      attrValueName: ':' + replaceSymbol(attrKey),
      attrKey,
      attrValue: toDynamoDBValue(attrValue), // 여기에서 DynamoDB 형식으로 변환합니다.
    };
    const reqKeyConditionExpression = [
      `${pkObj.attrKeyName} = ${pkObj.attrValueName}`,
    ];
    const reqExpressionAttributeNames: { [key: string]: string } = {
      [pkObj.attrKeyName]: pkObj.attrKey,
    };
    const reqExpressionAttributeValues: Record<string, AttributeValue> = {
      [pkObj.attrValueName]: pkObj.attrValue,
    };
    const reqFilterExpression: string[] = [];

    for (const { field, value, value2, operator } of filters) {
      const keyName = '#' + field;
      let valueName = ':' + field;
      let value2Name = ':' + `${field}2`;
      reqExpressionAttributeNames[keyName] = field;
      if (reqExpressionAttributeValues.hasOwnProperty(valueName)) {
        valueName = valueName + hashGenerator();
      }
      reqExpressionAttributeValues[valueName] = toDynamoDBValue(value);
      if (value2 !== undefined) {
        reqExpressionAttributeValues[value2Name] = toDynamoDBValue(value2);
      }

      if (field === 'sk') {
        reqKeyConditionExpression.push(
          setOperator({ keyName, valueName, value2Name, operator })
        );
      } else if (indexName && field === 'date') {
        reqKeyConditionExpression.push(
          setOperator({ keyName, valueName, value2Name, operator })
        );
      } else {
        reqFilterExpression.push(
          setOperator({ keyName, valueName, value2Name, operator })
        );
      }
    }

    const options: Partial<QueryCommandInput> = {
      TableName: tableName,
      KeyConditionExpression: reqKeyConditionExpression.join(
        convertLogicalOperator(keyConditionLogicalOperator)
      ),
      ExpressionAttributeNames: reqExpressionAttributeNames,
      ExpressionAttributeValues: reqExpressionAttributeValues,
      ScanIndexForward: sort === 'DESC' ? false : true,
      Limit: limit,
      ...(indexName && { IndexName: indexName }),
      ...(startKey && { ExclusiveStartKey: toDynamoDBValue(startKey) }), // startKey를 올바른 형식으로 변환
      ...(isIterableArray(reqFilterExpression) && {
        FilterExpression: reqFilterExpression.join(
          convertLogicalOperator(filterLogicalOperator)
        ),
      }),
    };

    try {
      const queryResponse = await this.dbService.query({
        tableName,
        options,
      });
      if (!queryResponse || !queryResponse.Items) {
        throw new Error(`[${funcName}] No response from DynamoDB`);
      }
      return queryResponse.Items.map(
        (item: Record<string, any>) => item as Record<string, any>
      );
    } catch (err) {
      this.dbService.handleError(err, funcName);
    }
    return []; // 오류가 발생하면 빈 배열 반환
  }
}

export { DynamoODM };
