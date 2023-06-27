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
        valueStack.push(-1);

        if (i >= 1 && operation[i - 1].classList.contains("num")) {
          operatorStack.push("addition");
        }
        operatorStack.push("multiplication");
      } else if (operator === "closing-bracket") {
        evaluatePart();
      } else {
        operatorStack.push(operator);
      }
    }
  }

  evaluatePart();

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
    // console.log("VALUE STACK");
    // console.log(valueStack);
    // console.log("OPERATOR STACK");
    // console.log(operatorStack);

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
      return +args[0] / +args[1];
    case "multiplication":
      return +args[0] * +args[1];
    case "addition":
      return +args[0] + +args[1];
    // case "subtraction":
    //   return +args[0] - +args[1];
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

function getActiveElement() {
  const powerElements = document.querySelectorAll(".power.active");
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
      break;
    case "answer":
      newNumber.innerHTML += "";
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
      activeElement = updateActiveElement(activeElement);
      break;
    case "equals":
      const solution = getSolution();
      newOperator.innerHTML = ` = `;

      const solutionDiv = document.createElement("div");
      solutionDiv.classList.add("num");
      solutionDiv.classList.add("solution");
      solutionDiv.textContent = `${solution}`;

      currentDisplay.appendChild(newOperator);
      currentDisplay.appendChild(solutionDiv);

      previousDisplay.innerHTML = "";
      const operation = currentDisplay.querySelectorAll("div");
      operation.forEach((element) => {
        previousDisplay.appendChild(element);
      });

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
  if (!currentDisplay.children.length > 0) {
    setOperatorButtonDisabledTo(true, (subset = "after"));
    setNumberButtonDisabledTo(false);
    return;
  }

  let last;
  const length = currentDisplay.children.length;
  for (let i = 0; i < length; i++) {
    let next = currentDisplay.children[i + 1];
    if (i === length - 1 || next.classList.contains("anticipating")) {
      last = currentDisplay.children[i];
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
  } else if (last.classList.contains("op")) {
    setNumberButtonDisabledTo(false);
    setOperatorButtonDisabledTo(true, (subset = "after"));
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
setButtons();

numberButtons.forEach((numberButton) => {
  numberButton.addEventListener("click", () => {
    const id = numberButton.getAttribute("id");
    addNumberToCurrentDisplay(id);
    setButtons();
  });
});

operatorButtons.forEach((operatorButton) => {
  operatorButton.addEventListener("click", () => {
    const id = operatorButton.getAttribute("id");
    addOperatorToCurrentDisplay(id);
    setButtons();
  });
});

clearButton.addEventListener("click", () => {
  if (currentDisplay.hasChildNodes()) {
    let indexToRemove;
    for (let i = 0; i < currentDisplay.children.length; i++) {
      if (
        i === currentDisplay.children.length - 1 ||
        currentDisplay.children[i + 1].classList.contains("anticipating")
      ) {
        indexToRemove = i;
        break;
      }
    }

    if (
      currentDisplay.children[indexToRemove].classList.contains(
        "closing-bracket"
      )
    ) {
      currentDisplay.children[indexToRemove].classList.add("anticipating");
      bracketDepth++;
    } else if (
      currentDisplay.children[indexToRemove].classList.contains(
        "opening-bracket"
      ) ||
      currentDisplay.children[indexToRemove].classList.contains("sqrt") ||
      currentDisplay.children[indexToRemove].classList.contains("log") ||
      currentDisplay.children[indexToRemove].classList.contains("ln")
    ) {
      currentDisplay.removeChild(currentDisplay.children[indexToRemove]);
      currentDisplay.removeChild(currentDisplay.children[indexToRemove]);
      bracketDepth--;
    } else if (indexToRemove === 0) {
      currentDisplay.removeChild(currentDisplay.children[indexToRemove]);
      previousDisplay.innerHTML = "";
    } else {
      currentDisplay.removeChild(currentDisplay.children[indexToRemove]);
    }
  }
  setButtons();
});
