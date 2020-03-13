
import { mockMethodsIn, clearAllMockedMethodsIn }
from '../index';

class TestClass {
  method1(): void {}
  method2(): void {}
  method3(): void {}
  method4(): void {}
}

describe(clearAllMockedMethodsIn.name, () => {
  let testClass: TestClass;

  beforeEach(() => {
    testClass = new TestClass();
  }); 

  it('should reset all methods that are mocks', () => {
    mockMethodsIn(testClass);

    testClass.method1();
    testClass.method2();
    testClass.method3();
    testClass.method4();

    clearAllMockedMethodsIn(testClass);

    expect(testClass.method1).not.toHaveBeenCalled();
    expect(testClass.method2).not.toHaveBeenCalled();
    expect(testClass.method3).not.toHaveBeenCalled();
    expect(testClass.method4).not.toHaveBeenCalled();
  });
});
