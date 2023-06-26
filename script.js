function getSolution(operation) {
  valueStack = [];
  operatorStack = [];
  const length = operation.length;
  let currentValue = null;
  let containsDecimalPoint = false;
  const operators = ["/", "*", "+", "-", "^", "("];
  const singleArgumentOperators = ["!", "s", "l", "n", "%"];

  for (let i = 0; i < length; i++) {
    const char = operation[i];
    const nextChar = operation[i + 1];
    if (isNumeric(char) || isDot(char)) {
      if (isDot(char)) containsDecimalPoint = true;
      currentValue = currentValue === null ? char : currentValue + char;
      if (
        nextChar === undefined ||
        (!isNumeric(nextChar) && !isDot(nextChar))
      ) {
        if (isValidValue(currentValue)) valueStack.push(currentValue);
        currentValue = null;
        containsDecimalPoint = false;
      }
    } else if (char === "e") {
      valueStack.push(Math.E);
    } else if (char === "p") {
      valueStack.push(Math.PI);
    } else if (operators.includes(char)) {
      operatorStack.push(char);
    } else if (char === ")") {
      evaluatePart();
    } else if (singleArgumentOperators.includes(char)) {
      let previousValue = valueStack.pop();
      valueStack.push(calculate(char, previousValue));
    }
  }

  evaluatePart();

  return valueStack[0];
}

function isNumeric(char) {
  const charCode = char.charCodeAt(0);
  return charCode >= 48 && charCode <= 57;
}

function isDot(char) {
  const charCode = char.charCodeAt(0);
  return charCode === 46;
}

function isValidValue(value) {
  return !(value === null || value.endsWith("."));
}

function evaluatePart() {
  let a;
  let b;
  let c;
  let d;
  let operator;
  let nextOperator;
  let nextNextOperator;
  const lowOrderOps = ["+", "-"];
  const midOrderOps = ["*", "/"];

  while (valueStack.length > 1) {
    operator = operatorStack.pop();
    if (operator === "(" || operator === undefined) {
      break;
    }
    a = valueStack.pop();
    b = valueStack.pop();

    if (
      (lowOrderOps.includes(operator) || midOrderOps.includes(operator)) &&
      valueStack.length > 0
    ) {
      nextOperator = operatorStack.pop();
      if (
        !lowOrderOps.includes(nextOperator) &&
        !midOrderOps.includes(nextOperator)
      ) {
        c = valueStack.pop();
        valueStack.push(calculate(nextOperator, c, b));
        valueStack.push(a);
        operatorStack.push(operator);
        continue;
      }
      if (
        midOrderOps.includes(nextOperator) &&
        lowOrderOps.includes(operator)
      ) {
        c = valueStack.pop();
        nextNextOperator = operatorStack.pop();
        if (
          !lowOrderOps.includes(nextNextOperator) &&
          !midOrderOps.includes(nextNextOperator) &&
          valueStack.length > 0
        ) {
          d = valueStack.pop();
          valueStack.push(calculate(nextNextOperator, d, c));
          valueStack.push(b);
          valueStack.push(a);
          operatorStack.push(nextOperator);
          operatorStack.push(operator);
          continue;
        }
        operatorStack.push(nextNextOperator);
        valueStack.push(calculate(nextOperator, c, b));
        valueStack.push(a);
        operatorStack.push(operator);
        continue;
      }
      operatorStack.push(nextOperator);
    }
    valueStack.push(calculate(operator, b, a));
  }
}

function calculate(operator, ...args) {
  switch (operator) {
    case "!":
      return factorial(+args[0]);
    case "s":
      return Math.sqrt(+args[0]);
    case "l":
      return Math.log10(+args[0]);
    case "n":
      return Math.log(+args[0]);
    case "%":
      return +args[0] / 100;
    case "^":
      return Math.pow(+args[0], +args[1]);
    case "/":
      return +args[0] / +args[1];
    case "*":
      return +args[0] * +args[1];
    case "+":
      return +args[0] + +args[1];
    case "-":
      return +args[0] - +args[1];
    default:
      return;
  }
}

function factorial(n) {
  let value = 1;
  for (let i = 2; i <= n; i++) {
    value *= i;
  }
  return value;
}

function addNumberToCurrentDisplay(buttonID) {
  if (buttonID.startsWith("n") && buttonID.length === 2) {
    buttonID = buttonID.substring(1);
  }

  if (superscriptOn) {
    const supElement = document.getElementById(`sup${supID}`);
    switch (buttonID) {
      case "pi":
        supElement.innerHTML += "&pi;";
        break;
      case "dot":
        supElement.innerHTML += ".";
        numberButtons[12].disabled = true;
        break;
      case "answer":
        supElement.innerHTML += "";
        break;
      default:
        supElement.innerHTML += `${buttonID}`;
    }
  } else {
    switch (buttonID) {
      case "pi":
        currentDisplay.innerHTML += "&pi;";
        break;
      case "dot":
        currentDisplay.innerHTML += ".";
        numberButtons[12].disabled = true;
        break;
      case "answer":
        currentDisplay.innerHTML += "";
        break;
      default:
        currentDisplay.innerHTML += `${buttonID}`;
    }
  }
}

function addOperatorToCurrentDisplay(buttonID) {
  switch (buttonID) {
    case "addition":
      if (openForOperator) {
        currentDisplay.innerHTML += " + ";
        openForOperator = false;
        break;
      }
    case "subtraction":
      if (openForOperator) {
        currentDisplay.innerHTML += " - ";
        openForOperator = false;
        break;
      }
    case "multiplication":
      if (openForOperator) {
        currentDisplay.innerHTML += " &times; ";
        openForOperator = false;
        break;
      }
    case "division":
      if (openForOperator) {
        currentDisplay.innerHTML += " &div; ";
        openForOperator = false;
        break;
      }
    case "factorial":
      if (openForOperator) {
        currentDisplay.innerHTML += "!";
        break;
      }
    case "percentage":
      if (openForOperator) {
        currentDisplay.innerHTML += "%";
        break;
      }
    case "power":
      if (openForOperator) {
        supID++;
        currentDisplay.innerHTML += `<sup id="sup${supID}"></sup>`;
        openForOperator = false;
        superscriptOn = true;
        break;
      }
    case "sqrt":
      currentDisplay.innerHTML += "&Sqrt;";
      break;
    case "log":
      currentDisplay.innerHTML += "log(";
      break;
    case "ln":
      currentDisplay.innerHTML += "ln(";
      break;
    case "opening-bracket":
      if (openForOpeningBracket) {
        currentDisplay.innerHTML += "(";
        bracketDepth++;
        break;
      }
    case "closing-bracket":
      if (bracketDepth > 0 && openForClosingBracket) {
        currentDisplay.innerHTML += ")";
        bracketDepth--;
      }
      break;
  }
}

const numberButtons = document.querySelectorAll("button.number");
const operatorButtons = document.querySelectorAll("button.operator");
const currentDisplay = document.querySelector(".display .current");

let openForDecimal = true;
let openForOperator = false;
let superscriptOn = false;
let supID = 0;
let bracketDepth = 0;
let openForOpeningBracket = true;
let openForClosingBracket = false;
let bracketOpenedOnSupNumber = 0;

numberButtons.forEach((numberButton) => {
  numberButton.addEventListener("click", () => {
    const id = numberButton.getAttribute("id");
    addNumberToCurrentDisplay(id);
    openForOperator = true;
    openForOpeningBracket = false;
    openForClosingBracket = true;
  });
});

operatorButtons.forEach((operatorButton) => {
  operatorButton.addEventListener("click", () => {
    if (superscriptOn) superscriptOn = false;
    const id = operatorButton.getAttribute("id");
    addOperatorToCurrentDisplay(id);
    numberButtons[12].disabled = false;
    openForOpeningBracket = true;
    openForClosingBracket = false;
  });
});

console.log(operatorButtons);

let operatorStack = new Array();
let valueStack = new Array();
