def greet(name):
    message = f"Hello, {name}!"
    print(message)
    return message

class Calculator:
    def add(self, a, b):
        return a + b
    
    def subtract(self, a, b):
        return a - b

def main():
    greet("World")
    calc = Calculator()
    result = calc.add(1, 2)
    print(result)

if __name__ == "__main__":
    main()
