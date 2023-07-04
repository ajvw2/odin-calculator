function getSolution() {
  valueStack = [];
  operatorStack = [];

  const operation = currentDisplay.querySelectorAll("div");
  const length = operation.length;

  let currentValue = null;
  for (let i = 0; i < length; i++) {
    if (operation[i].classList.contains("num")) {
      if (operation[i].classList.contains("pi")) {
        currentValue = Math.PI;
      } else if (operation[i].classList.contains("e")) {
        currentValue = Math.E;
      } else if (operation[i].classList.contains("answer")) {
        currentValue = lastAnswer;
      } else {
        currentValue =
          currentValue === null
            ? operation[i].textContent
            : currentValue + operation[i].textContent;
      }
      if (
        operation[i + 1] === undefined ||
        operation[i + 1].classList.contains("op")
      ) {
        valueStack.push(currentValue);
        currentValue = null;
      }
    } else if (operation[i].classList.contains("op")) {
      operation[i].classList.remove("op");
      const operator = operation[i].getAttribute("class");
      if (operator === "factorial" || operator === "percentage") {
        const previousValue = valueStack.pop();
        valueStack.push(calculate(operator, previousValue));
      } else if (operator === "subtraction") {
        // Convert subtraction to multiplication by -1 and addition if a number
        // proceeds the minus operator. This allows for correct evaluation of
        // inputs like 6 - 3 - 3 - 3.
        valueStack.push(-1);
        console.log(operation[i - 1]);
        if (
          i >= 1 &&
          (operation[i - 1].classList.contains("num") ||
            operation[i - 1].classList.contains("closing-bracket"))
        ) {
          operatorStack.push("addition");
        } else if (i >= 1 && operation[i - 1].classList.contains("power")) {
          // If the previous entry is a power operator (e.g. in the case of
          // 8^-3), a virtual opening bracket is added to ensure correct order
          // of operations in evaluatePart()
          operatorStack.push("opening-bracket");
        }
        operatorStack.push("multiplication");
      } else if (operator === "closing-bracket") {
        evaluatePart();
      } else {
        operatorStack.push(operator);
      }
    }
  }
  while (valueStack.length > 1) {
    evaluatePart();
  }

  return valueStack[0];
}

function evaluatePart() {
  let a;
  let b;
  let c;
  let d;
  let operator;
  let nextOperator;
  let nextNextOperator;
  const lowOrderOps = ["addition"];
  const midOrderOps = ["multiplication", "division"];
  const singleArgumentOps = ["sqrt", "log", "ln"];

  while (valueStack.length > 1 || operatorStack.length > 0) {
    console.log("VALUE STACK");
    console.log(valueStack);
    console.log("OPERATOR STACK");
    console.log(operatorStack);

    operator = operatorStack.pop();
    if (operator === "opening-bracket" || operator === undefined) {
      break;
    }

    a = valueStack.pop();

    if (singleArgumentOps.includes(operator)) {
      valueStack.push(calculate(operator, a));
      break;
    }

    b = valueStack.pop();

    if (
      (lowOrderOps.includes(operator) || midOrderOps.includes(operator)) &&
      valueStack.length > 0
    ) {
      nextOperator = operatorStack.pop();
      if (
        !lowOrderOps.includes(nextOperator) &&
        !midOrderOps.includes(nextOperator) &&
        nextOperator !== "opening-bracket" &&
        !singleArgumentOps.includes(nextOperator)
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
        if (valueStack.length > 0) {
          nextNextOperator = operatorStack.pop();
          if (
            !lowOrderOps.includes(nextNextOperator) &&
            !midOrderOps.includes(nextNextOperator) &&
            valueStack.length > 0 &&
            nextNextOperator !== "opening-bracket" &&
            !singleArgumentOps.includes(nextNextOperator)
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
        }
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
    case "factorial":
      return factorial(+args[0]);
    case "sqrt":
      return Math.sqrt(+args[0]);
    case "log":
      return Math.log10(+args[0]);
    case "ln":
      return Math.log(+args[0]);
    case "percentage":
      return +args[0] / 100;
    case "power":
      return Math.pow(+args[0], +args[1]);
    case "division":
      // Allow for zero division error to occur
      if (+args[1] === 0) {
        return NaN;
      } else {
        return +args[0] / +args[1];
      }
    case "multiplication":
      return +args[0] * +args[1];
    case "addition":
      return +args[0] + +args[1];
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

  // TODO Gamma function https://math.stackexchange.com/questions/454053/how-do-we-calculate-factorials-for-numbers-with-decimal-places
}

function setNumberButtonDisabledTo(setting, subset = "all") {
  // Subset
  const set1 = ["pi", "e", "answer"];
  const set2 = [...set1];
  set2.push("dot");

  numberButtons.forEach((numberButton) => {
    let setterCondition;
    switch (subset) {
      case "all":
        numberButton.disabled = setting;
        break;
      case "special-numbers":
        setterCondition = set1.includes(numberButton.getAttribute("id"));
        numberButton.disabled = setterCondition ? setting : !setting;
        break;
      case "dot-and-special-numbers":
        setterCondition = set2.includes(numberButton.getAttribute("id"));
        numberButton.disabled = setterCondition ? setting : !setting;
        break;
    }
  });

  if (lastAnswer === null) {
    numberButtons[2].disabled = true; // Disable 'Ans' button
  }

  if (hasDecimal) {
    numberButtons[12].disabled = true; // Disable decimal button
  }
}

function setOperatorButtonDisabledTo(setting, subset = "all") {
  const set1 = [
    "factorial",
    "percentage",
    "power",
    "division",
    "multiplication",
    "addition",
    "closing-bracket",
    "equals",
  ];
  const set2 = [...set1];
  set2.push("subtraction");

  operatorButtons.forEach((operatorButton) => {
    let setterCondition;
    switch (subset) {
      case "all":
        operatorButton.disabled = setting;
        break;
      case "after":
        setterCondition = set1.includes(operatorButton.getAttribute("id"));
        operatorButton.disabled = setterCondition ? setting : !setting;
        break;
      case "after-including-minus":
        setterCondition = set2.includes(operatorButton.getAttribute("id"));
        operatorButton.disabled = setterCondition ? setting : !setting;
        break;
    }
  });

  if (bracketDepth === 0) {
    operatorButtons[7].disabled = true; // Disable closing bracket button
  } else {
    operatorButtons[11].disabled = true; // Disable equals button
  }
}

function createInputSquare() {
  const inputSquare = document.createElement("div");
  inputSquare.classList.add("input-square");
  inputSquare.innerHTML = "&#9633;";

  let activeElement = getActiveElement();
  activeElement.insertBefore(
    inputSquare,
    activeElement.querySelector(".closing-bracket.anticipating")
  );
}

function removeInputSquare() {
  const inputSquare = document.querySelector(".input-square");
  let activeElement = getActiveElement();
  activeElement.removeChild(inputSquare);
}

function getActiveElement() {
  const powerElements = currentDisplay.querySelectorAll(".power.active");
  if (powerElements.length !== 0) {
    return powerElements[powerElements.length - 1];
  } else {
    return currentDisplay;
  }
}

function updateActiveElement(activeElement) {
  if (activeElement === currentDisplay) {
    return currentDisplay;
  }

  if (
    activeElement.contains(
      document.querySelector(".closing-bracket.anticipating")
    )
  ) {
    return activeElement;
  }

  activeElement.classList.remove("active");
  activeElement = getActiveElement();
  return updateActiveElement(activeElement);
}

function deactivateAllPowerElements() {
  const powerElements = currentDisplay.querySelectorAll(".power.active");
  powerElements.forEach((powerElement) =>
    powerElement.classList.remove("active")
  );
}

function addNumberToCurrentDisplay(buttonID) {
  const activeElement = getActiveElement();
  const newNumber = document.createElement("div");
  newNumber.classList.add("num");
  newNumber.classList.add(buttonID);

  if (buttonID.startsWith("n") && buttonID.length === 2) {
    buttonID = buttonID.substring(1);
  }

  switch (buttonID) {
    case "pi":
      newNumber.innerHTML += "&pi;";
      break;
    case "e":
      newNumber.innerHTML += "e";
      break;
    case "dot":
      newNumber.innerHTML += ".";
      hasDecimal = true;
      break;
    case "answer":
      newNumber.innerHTML += "Ans";
      break;
    default:
      newNumber.innerHTML += `${buttonID}`;
  }

  activeElement.insertBefore(
    newNumber,
    activeElement.querySelector(".closing-bracket.anticipating")
  );
}

function addOperatorToCurrentDisplay(buttonID) {
  let activeElement = getActiveElement();
  const newOperator = document.createElement("div");
  newOperator.classList.add("op");
  newOperator.classList.add(buttonID);
  hasDecimal = false;

  switch (buttonID) {
    case "factorial":
      newOperator.innerHTML = "!";
      break;
    case "percentage":
      newOperator.innerHTML = "%";
      break;
    case "power":
      newOperator.classList.add("active");
      break;
    case "sqrt":
      newOperator.innerHTML = "&Sqrt;(";
      bracketDepth++;
      addNewAnticipatingClosingBracket();
      break;
    case "log":
      newOperator.innerHTML = "log(";
      bracketDepth++;
      addNewAnticipatingClosingBracket();
      break;
    case "ln":
      newOperator.innerHTML = "ln(";
      bracketDepth++;
      addNewAnticipatingClosingBracket();
      break;
    case "opening-bracket":
      newOperator.innerHTML = "(";
      bracketDepth++;
      addNewAnticipatingClosingBracket();
      break;
    case "closing-bracket":
      activeElement = updateActiveElement(activeElement);
      const firstClosingBracket = document.querySelector(
        ".closing-bracket.anticipating"
      );
      firstClosingBracket.classList.remove("anticipating");
      bracketDepth--;
      return;
    case "division":
      newOperator.innerHTML = " &div; ";
      activeElement = updateActiveElement(activeElement);
      break;
    case "multiplication":
      newOperator.innerHTML = " &times; ";
      activeElement = updateActiveElement(activeElement);
      break;
    case "addition":
      newOperator.innerHTML = " + ";
      activeElement = updateActiveElement(activeElement);
      break;
    case "subtraction":
      newOperator.innerHTML = " - ";
      // Active element doesn't get updated when it is empty.
      // This allows for powers of negative numbers to be calculated
      // without using brackets.
      if (activeElement.children.length > 0) {
        activeElement = updateActiveElement(activeElement);
      }
      break;
    case "equals":
      deactivateAllPowerElements();
      let solution = getSolution();
      solution = parseFloat(Number(solution).toFixed(10));

      newOperator.innerHTML = ` = `;
      currentDisplay.appendChild(newOperator);

      const solutionDiv = document.createElement("div");
      solutionDiv.classList.add("num");
      solutionDiv.classList.add("solution");

      if (isNaN(solution)) {
        solutionDiv.textContent = "Error";
        lastAnswer = null;
      } else {
        solutionDiv.textContent = `${solution}`;
        lastAnswer = solution;
        currentDisplay.appendChild(solutionDiv);
      }

      previousDisplay.innerHTML = "";
      while (currentDisplay.children.length > 0) {
        previousDisplay.appendChild(currentDisplay.children[0]);
      }

      currentDisplay.innerHTML = "";
      const solutionDivClone = solutionDiv.cloneNode(true);
      currentDisplay.appendChild(solutionDivClone);
      return;
  }

  activeElement.insertBefore(
    newOperator,
    activeElement.querySelector(".closing-bracket.anticipating")
  );
}

function addNewAnticipatingClosingBracket() {
  const activeElement = getActiveElement();

  const newClosingBracket = document.createElement("div");
  newClosingBracket.classList.add("op");
  newClosingBracket.classList.add("closing-bracket");
  newClosingBracket.classList.add("anticipating");
  newClosingBracket.innerHTML = ")";
  activeElement.insertBefore(
    newClosingBracket,
    activeElement.querySelector(".closing-bracket.anticipating")
  );
}

function setButtons() {
  const activeElement = getActiveElement();

  if (activeElement.children.length === 0) {
    setOperatorButtonDisabledTo(true, (subset = "after"));
    setNumberButtonDisabledTo(false);
    return;
  }

  let last;
  const length = activeElement.children.length;
  for (let i = 0; i < length; i++) {
    let next = activeElement.children[i + 1];
    if (i === length - 1 || next.classList.contains("anticipating")) {
      last = activeElement.children[i];
      break;
    }
  }

  if (
    last.classList.contains("pi") ||
    last.classList.contains("e") ||
    last.classList.contains("answer")
  ) {
    setNumberButtonDisabledTo(true);
    setOperatorButtonDisabledTo(false, (subset = "after-including-minus"));
  } else if (last.classList.contains("dot")) {
    setNumberButtonDisabledTo(true, (subset = "dot-and-special-numbers"));
    setOperatorButtonDisabledTo(true);
  } else if (last.classList.contains("num")) {
    if (last.classList.contains("solution")) {
      setNumberButtonDisabledTo(true);
      setOperatorButtonDisabledTo(false, (subset = "after-including-minus"));
    } else {
      setNumberButtonDisabledTo(true, (subset = "special-numbers"));
      setOperatorButtonDisabledTo(false, (subset = "after-including-minus"));
    }
  } else if (
    last.classList.contains("factorial") ||
    last.classList.contains("percentage") ||
    last.classList.contains("closing-bracket")
  ) {
    setNumberButtonDisabledTo(true);
    setOperatorButtonDisabledTo(false, (subset = "after-including-minus"));
  } else if (last.classList.contains("power")) {
    setNumberButtonDisabledTo(true);
    setOperatorButtonDisabledTo(true, (subset = "after"));
  } else if (last.classList.contains("op")) {
    setNumberButtonDisabledTo(false);
    setOperatorButtonDisabledTo(true, (subset = "after"));
  }
}

function updatePrevious() {
  const length = previousDisplay.children.length;

  // Clear previousDisplay when the previous calculation didn't have an
  // answer, i.e. when an error was thrown
  if (previousDisplay.children[length - 1].classList.contains("equals")) {
    previousDisplay.innerHTML = "";
  } else if (
    length > 3 ||
    !previousDisplay.children[0].classList.contains("answer")
  ) {
    while (!previousDisplay.children[0].classList.contains("equals")) {
      previousDisplay.removeChild(previousDisplay.children[0]);
    }

    const answer = document.createElement("div");
    answer.classList.add("num");
    answer.classList.add("answer");
    answer.textContent = "Ans";
    previousDisplay.insertBefore(answer, previousDisplay.children[0]);
  }
}

const numberButtons = document.querySelectorAll("button.number");
const operatorButtons = document.querySelectorAll("button.operator");
const clearButton = document.querySelector("#clear");
const previousDisplay = document.querySelector(".display .previous");
const currentDisplay = document.querySelector(".display .current");

let valueStack = new Array();
let operatorStack = new Array();
let bracketDepth = 0;
let hasDecimal = false;
let lastAnswer = null;
setButtons();
createInputSquare();

numberButtons.forEach((numberButton) => {
  numberButton.addEventListener("click", () => {
    const id = numberButton.getAttribute("id");
    removeInputSquare();
    addNumberToCurrentDisplay(id);
    clearButton.textContent = "CE";
    setButtons();
    if (previousDisplay.children.length > 0) updatePrevious();
    createInputSquare();
  });
});

operatorButtons.forEach((operatorButton) => {
  operatorButton.addEventListener("click", () => {
    const id = operatorButton.getAttribute("id");
    removeInputSquare();
    addOperatorToCurrentDisplay(id);
    setButtons();
    if (previousDisplay.children.length > 0 && id !== "equals")
      updatePrevious();
    if (id === "equals") {
      clearButton.textContent = "AC";
    } else {
      clearButton.textContent = "CE";
    }
    createInputSquare();
  });
});

clearButton.addEventListener("click", () => {
  removeInputSquare();
  clearButton.textContent = "CE";
  let activeElement = getActiveElement();

  if (activeElement.children.length < 1) {
    activeElement.classList.remove("active");
    activeElement = getActiveElement();
  }

  if (activeElement.children.length > 0) {
    let indexToRemove;
    for (let i = 0; i < activeElement.children.length; i++) {
      if (
        i === activeElement.children.length - 1 ||
        activeElement.children[i + 1].classList.contains("anticipating")
      ) {
        indexToRemove = i;
        break;
      }
    }

    let elementToRemove = activeElement.children[indexToRemove];

    if (
      elementToRemove.classList.contains("power") &&
      !elementToRemove.classList.contains("active")
    ) {
      if (elementToRemove.children.length > 0) {
        elementToRemove.classList.add("active");
      } else {
        activeElement.removeChild(elementToRemove);
      }
    } else if (elementToRemove.classList.contains("closing-bracket")) {
      elementToRemove.classList.add("anticipating");
      bracketDepth++;
    } else if (
      elementToRemove.classList.contains("opening-bracket") ||
      elementToRemove.classList.contains("sqrt") ||
      elementToRemove.classList.contains("log") ||
      elementToRemove.classList.contains("ln")
    ) {
      activeElement.removeChild(activeElement.children[indexToRemove]);
      activeElement.removeChild(activeElement.children[indexToRemove]);
      bracketDepth--;
    } else {
      activeElement.removeChild(elementToRemove);
    }
  }
  setButtons();
  if (previousDisplay.children.length > 0) updatePrevious();
  createInputSquare();
});

window.addEventListener("keydown", function (e) {
  switch (e.key) {
    case "!":
      document.getElementById("factorial").click();
      break;
    case "p":
      document.getElementById("pi").click();
      break;
    case "e":
      document.getElementById("e").click();
      break;
    case "%":
      document.getElementById("percentage").click();
      break;
    case "^":
      document.getElementById("power").click();
      break;
    case "s":
      document.getElementById("sqrt").click();
      break;
    case "l":
      document.getElementById("log").click();
      break;
    case "n":
      document.getElementById("ln").click();
      break;
    case "(":
      document.getElementById("opening-bracket").click();
      break;
    case ")":
      document.getElementById("closing-bracket").click();
      break;
    case "a":
      document.getElementById("answer").click();
      break;
    case "Backspace":
      document.getElementById("clear").click();
      break;
    case "/":
      document.getElementById("division").click();
      break;
    case "*":
      document.getElementById("multiplication").click();
      break;
    case "+":
      document.getElementById("addition").click();
      break;
    case ".":
      document.getElementById("dot").click();
      break;
    case "Enter":
      document.getElementById("equals").click();
      break;
    case "=":
      document.getElementById("equals").click();
      break;
    case "-":
      document.getElementById("subtraction").click();
      break;
  }

  if (Number(e.key) >= 0 && Number(e.key) <= 9) {
    document.getElementById(`n${e.key}`).click();
  }
});
