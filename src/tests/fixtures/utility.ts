// Another test fixture with different patterns

export function utilityFunction(a: number, b: number): number {
  return a + b;
}

export function complexFunction() {
  const x = utilityFunction(1, 2);
  const y = utilityFunction(3, 4);
  
  if (x > 0) {
    utilityFunction(x, y);
  }
  
  return utilityFunction(x, y);
}

// Method calls
const obj = {
  helper: function() {
    return utilityFunction(5, 6);
  }
};

export default obj;
