/**
 * 문자열의 기호를 주어진 대체 문자열로 대체합니다.
 *
 * @param {string} str - 입력 문자열.
 * @param {string} [replacer=''] - 대체 문자열.
 * @returns {string} - 수정된 문자열.
 */
export const replaceSymbol = (str: string, replacer = ''): string => {
  const regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"\s]/gi;
  return str.replace(regExp, replacer);
};

/**
 * 값이 비어 있지 않은 배열인지 확인합니다.
 *
 * @param {any} value - 확인할 값.
 * @returns {boolean} - 값이 비어 있지 않은 배열인 경우 true, 그렇지 않으면 false.
 */
export const isIterableArray = (value: any): value is any[] => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * 논리 연산자를 대문자로 변환합니다.
 *
 * @param {string} operator - 논리 연산자.
 * @returns {string} - 대문자로 변환된 논리 연산자.
 * @throws {Error} - 연산자가 알 수 없는 경우 오류를 발생시킵니다.
 */
export const convertLogicalOperator = (operator: string): string => {
  const upperCaseOperator = operator.toUpperCase();
  switch (upperCaseOperator) {
    case 'AND':
      return 'AND';
    case 'OR':
      return 'OR';
    default:
      throw new Error(`알 수 없는 논리 연산자: ${operator}`);
  }
};

/**
 * 주어진 매개변수를 기반으로 연산자 문자열을 설정합니다.
 *
 * @param {Object} params - 매개변수 객체.
 * @param {string} params.keyName - 키 이름.
 * @param {string} params.valueName - 값 이름.
 * @param {string} params.value2Name - 두 번째 값 이름 (BETWEEN 연산자 용).
 * @param {string} params.operator - 연산자.
 * @returns {string} - 형식화된 연산자 문자열.
 */
export const setOperator = ({
  keyName,
  valueName,
  value2Name,
  operator,
}: {
  keyName: string;
  valueName: string;
  value2Name: string;
  operator: string;
}): string => {
  switch (operator.toLowerCase()) {
    case 'begins_with':
    case 'contains':
      return `${operator.toLowerCase()}(${keyName}, ${valueName})`;
    case 'neq':
      return `${keyName} <> ${valueName}`;
    case 'less_than':
      return `${keyName} < ${valueName}`;
    case 'less_or_equal':
      return `${keyName} <= ${valueName}`;
    case 'greater_than':
      return `${keyName} > ${valueName}`;
    case 'greater_or_equal':
      return `${keyName} >= ${valueName}`;
    case 'between':
      return `${keyName} BETWEEN ${valueName} AND ${value2Name}`;
    case 'attribute_not_exists':
      return `attribute_not_exists(${keyName})`;
    case 'attribute_exists':
      return `attribute_exists(${keyName})`;
    case 'attribute_type':
    case 'size':
    default:
      return `${keyName} = ${valueName}`;
  }
};

/**
 * 주어진 길이의 해시 문자열을 생성합니다.
 *
 * @param {number} [length=8] - 해시 길이.
 * @returns {string} - 생성된 해시 문자열.
 */
export const hashGenerator = (length: number = 8): string => {
  let hash = '';
  while (hash.length < length) {
    hash += Math.random().toString(36).substring(2, 15);
  }
  return hash.substring(0, length);
};

/**
 * 값을 DynamoDB 형식으로 변환합니다.
 *
 * @param {any} value - 변환할 값.
 * @returns {any} - DynamoDB 형식으로 변환된 값.
 * @throws {Error} - 지원되지 않는 속성 값 유형인 경우 오류를 발생시킵니다.
 */
export const toDynamoDBValue = (value: any): any => {
  if (typeof value === 'string' || value instanceof String) {
    return value;
  } else if (typeof value === 'number' || value instanceof Number) {
    return value.toString();
  } else if (Array.isArray(value)) {
    return value.map(toDynamoDBValue);
  } else if (typeof value === 'boolean') {
    return value;
  } else if (value === null || value === undefined) {
    return null;
  }
  // 필요한 경우 더 많은 유형 변환 추가
  throw new Error('지원되지 않는 속성 값 유형');
};
