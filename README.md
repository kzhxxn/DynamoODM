# dynodeodm

dynodeodm은 AWS DynamoDB와 상호작용하기 위한 간단하고 사용하기 쉬운 Object-Document Mapper(ODM)입니다.

## 기능

- DynamoDB에서 아이템 가져오기
- 아이템 생성
- 아이템 삭제
- 아이템 업데이트
- 아이템 목록 가져오기

## 설치

```bash
npm install dynodeodm
```

## 설정

DynamoODM을 사용하려면 AWS SDK 및 DynamoDB 구성 설정이 필요합니다. `env` 파일을 사용하여 아래의 값을 설정해줍니다.

```env
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

your-region, your-access-key-id, your-secret-access-key를 실제 AWS 자격 증명으로 대체합니다.

## 사용법

DynamoODM 클래스를 선언하고 각 메소드에 맞게 사용합니다.

```typescript
import { DynamoODM } from 'dynodeodm';
const dynamoODM = new DynamoODM();
```

---

### 아이템 가져오기

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    key: {
      pk: 'partition-key-value',
      sk: 'sort-key-value',
    },
  },
};

const item = await dynamoODM.getItem(params);
```

---

### 아이템 생성

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    attributes: {
      pk: 'partition-key-value',
      sk: 'sort-key-value',
      otherAttribute: 'attribute-value',
    },
  },
};

const createdItem = await dynamoODM.create(params);
console.log(createdItem);
```

---

### 아이템 삭제

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    key: {
      pk: 'partition-key-value',
      sk: 'sort-key-value',
    },
  },
};

await dynamoODM.delete(params);
```

---

### 아이템 업데이트

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    key: {
      pk: 'partition-key-value',
      sk: 'sort-key-value',
    },
    data: {
      attributeToUpdate: 'new-value',
      // 예: 배열 속성 업데이트
      arrayAttribute: {
        add: ['newElement1', 'newElement2'],
        remove: ['oldElement1'],
      },
      // 예: 객체 속성 업데이트
      objectAttribute: {
        add: {
          newKey1: 'newValue1',
          newKey2: 'newValue2',
        },
        remove: 'oldKey',
      },
    },
  },
};

const updatedItem = await dynamoODM.updateItem(params);
```

업데이트 동작설명

- 기본 속성 업데이트: data 객체에 단순 속성 값을 지정하면 해당 속성 값이 기존 값에 덮어씌워집니다.
- 배열 속성 업데이트:
  - add와 remove 속성을 사용하지 않는 경우, 새로운 배열 값이 기존 배열 값을 덮어씁니다.
  - add를 사용하면 지정된 요소가 기존 배열에 추가됩니다.
  - remove를 사용하면 지정된 요소가 기존 배열에서 제거됩니다.
- 객체 속성 업데이트:
  - add와 remove 속성을 사용하지 않는 경우, 새로운 객체 속성이 기존 객체 속성에 병합됩니다.
  - 동일한 키가 있는 경우 새로운 값이 기존 값을 덮어씁니다. 새로운 키는 기존 키와 함께 추가됩니다.
  - add를 사용하면 지정된 키-값 쌍이 기존 객체에 병합됩니다.
  - remove를 사용하면 지정된 키가 기존 객체에서 제거됩니다.

---

### 아이템 목록 가져오기

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    pk: 'partition-key-value',
    filters: [
      {
        field: 'attributeName',
        value: 'attributeValue',
        operator: 'eq', // DynamoDB 조건 연산자
      },
      {
        field: 'anotherAttribute',
        value: 'anotherValue',
        operator: 'begins_with',
      },
    ],
    sort: 'DESC',
    pagination: {
      perPage: 10,
    },
  },
};

const items = await dynamoODM.getList(params);
```

getList 메서드는 주어진 조건에 맞는 아이템 목록을 가져옵니다. params 객체에는 다음과 같은 요소가 포함됩니다:

- pk: Partition Key 값 또는 객체 (필수)
- filters: 조건 연산자와 함께 필터링할 속성 목록 (선택)
- field: 필터링할 속성 이름
- value: 필터링할 값
- operator: 조건 연산자 (eq, begins_with, contains, between 등)
- sort: 정렬 순서 (ASC 또는 DESC)
- pagination: 페이지네이션 설정 (선택)
- perPage: 한 페이지당 아이템 수
- indexName: 보조 인덱스 이름 (선택)
- startKey: 페이징 시작 키 (선택)

> 예제케이스

1. 기본 조건

   Partition Key가 주어진 값과 일치하는 모든 항목 가져오기

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    pk: 'partition-key-value',
  },
};

const items = await dynamoODM.getList(params);
```

2. 필터링과 정렬

   특정 속성이 특정 값과 일치하고, 다른 속성이 특정 값으로 시작하는 항목을 내림차순으로 가져오기

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    pk: 'partition-key-value',
    filters: [
      {
        field: 'attributeName',
        value: 'attributeValue',
        operator: 'eq',
      },
      {
        field: 'anotherAttribute',
        value: 'anotherValue',
        operator: 'begins_with',
      },
    ],
    sort: 'DESC',
  },
};

const items = await dynamoODM.getList(params);
```

3. 페이지네이션

   한 페이지당 10개의 항목을 가져오기

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    pk: 'partition-key-value',
    pagination: {
      perPage: 10,
    },
  },
};

const items = await dynamoODM.getList(params);
```

4. 보조 인덱스 사용

   보조 인덱스를 사용하여 항목 가져오기

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    pk: 'partition-key-value',
  },
  indexName: 'your-index-name',
};

const items = await dynamoODM.getList(params);
```

5. 페이징 시작 키 사용

   특정 키에서부터 페이징 시작

```typescript
const params = {
  tableName: 'your-table-name',
  params: {
    pk: 'partition-key-value',
    startKey: 'your-start-key',
  },
};

const items = await dynamoODM.getList(params);
```
