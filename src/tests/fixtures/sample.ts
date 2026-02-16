// Test fixture for parser and reference finder tests

export function testFunction(param: string): string {
  return `Hello ${param}`;
}

export function callerFunction() {
  const result = testFunction('world');
  console.log(result);
  return result;
}

export function anotherCaller() {
  testFunction('test');
  const value = testFunction('value');
  return value;
}

export class TestClass {
  method() {
    testFunction('from class');
  }
}

// Arrow function
export const arrowCaller = () => {
  return testFunction('arrow');
};

// Nested calls
export function nestedCaller() {
  const inner = () => {
    testFunction('nested');
  };
  inner();
}
