function getSolution() {
  /***************************************************************************
   * Adaptation of Dijkstra's Two-Stack Algorithm to evaluate the mathemati- *
   * cal expression and return the solution. The elements of the expression  *
   * are put on the display in separate divs with unique classes, i.e. there *
   * is a unique div type for each number and operator. This function loops  *
   * through the divs and pushed the contents of the divs onto the right     *
   * stacks, according to the classes of the divs.                           *
   ***************************************************************************/
  valueStack = [];
  operatorStack = [];

  const expression = currentDisplay.querySelectorAll("div");
  const length = expression.length;

  let currentValue = null;
  let negativePower = false;
  for (let i = 0; i < length; i++) {
    const element = expression[i];
    if (element.matches(".num")) {
      if (element.matches(".pi")) {
        currentValue = Math.PI;
      } else if (element.matches(".e")) {
        currentValue = Math.E;
      } else if (element.matches(".answer")) {
        currentValue = lastAnswer;
      } else {
        // Concatenate numbers 0-9 and decimal point to currentValue
        const number = element.textContent;
        currentValue = !currentValue ? number : currentValue + number;
      }
      // Push currentValue to valueStack whe full number is processed.
      const next = expression[i + 1];
      if (!next || next.matches(".op")) {
        valueStack.push(currentValue);
        currentValue = null;
        if (negativePower) {
          evaluate(); // Evaluates up to virtual opening bracket
          negativePower = false;
        }
        evaluatePower();
      }
    } else if (element.matches(".op")) {
      element.classList.remove("op");
      const operator = expression[i].getAttribute("class");
      if (operator === "factorial" || operator === "percentage") {
        const previousValue = valueStack.pop();
        valueStack.push(calculate(operator, previousValue));
      } else if (operator === "subtraction") {
        // Convert subtraction to easier to handle format (multiplication
        // by -1 and, if necessary, addition)
        valueStack.push(-1);
        const previous = expression[i - 1];
        if (i >= 1 && previous.matches(".num, .closing-bracket")) {
          operatorStack.push("addition");
        } else if (i >= 1 && previous.matches(".power")) {
          // Add virtual opening bracket to ensure correct order of operations
          operatorStack.push("opening-bracket");
          negativePower = true;
        }
        operatorStack.push("multiplication");
      } else if (operator === "closing-bracket") {
        evaluate(); // Runs until opening bracket is encountered
        evaluatePower();
      } else {
        operatorStack.push(operator);
      }
    }
  }
  evaluate();
  return valueStack[0];
}

function evaluate() {
  while (valueStack.length > 1 || operatorStack.length > 0) {
    // Break condition 1: opening bracket or end of operator stack
    const operator = operatorStack.pop();
    if (operator === "opening-bracket" || !operator) break;

    // Break condition 2: single argument operation
    const a = valueStack.pop();
    if (["sqrt", "log", "ln"].includes(operator)) {
      valueStack.push(calculate(operator, a));
      break;
    }

    // Note: At this point, the only possible operators that are encountered
    // will be: multiplication, division, addition, and opening bracket.

    const b = valueStack.pop();
    if (valueStack.length < 1) {
      valueStack.push(calculate(operator, b, a));
      continue;
    }

    const c = valueStack.pop();
    const nextOperator = operatorStack.pop();
    if (operator === "division" && nextOperator === "division") {
      evaluateDivisionChain(a, b, c);
      continue;
    }
    if (
      operator === "division" ||
      ["addition", "opening-bracket"].includes(nextOperator)
    ) {
      valueStack.push(c, calculate(operator, b, a));
      operatorStack.push(nextOperator);
      continue;
    }

    const nextNextOperator = operatorStack.pop();
    if (nextOperator === "division" && nextNextOperator === "division") {
      const d = valueStack.pop();
      evaluateDivisionChain(b, c, d);
    } else {
      valueStack.push(calculate(nextOperator, c, b));
      if (nextNextOperator) operatorStack.push(nextNextOperator);
    }
    valueStack.push(a);
    operatorStack.push(operator);
  }
}

function evaluatePower() {
  const operator = operatorStack.pop();
  if (operator === "power") {
    const a = valueStack.pop();
    const b = valueStack.pop();
    valueStack.push(calculate(operator, b, a));
  } else if (operator) {
    operatorStack.push(operator);
  }
}

function evaluateDivisionChain(a, b, c) {
  /* Handles chain division inputs, e.g. 5 / 5 / 5 / 5. */
  let divisionStack = [a, b, c];
  let divisionDepth = 2;
  let operator = operatorStack.pop();
  while (operator === "division") {
    divisionDepth++;
    operator = operatorStack.pop();
  }

  // Populate division stack in reverse order of value stack, based on number
  // of division operators (i.e. divisionDepth)
  for (let i = divisionDepth; i > 2; i--) {
    divisionStack.push(valueStack.pop());
  }

  if (operator === "power") {
    const powerValue = calculate(
      "power",
      valueStack.pop(),
      divisionStack.pop()
    );
    divisionStack.push(powerValue);
  } else if (operator && operator !== "division") {
    operatorStack.push(operator);
  }

  valueStack.push(divisionStack.pop());
  for (let i = 0; i < divisionDepth; i++) {
    a = valueStack.pop();
    b = divisionStack.pop();
    valueStack.push(calculate("division", a, b));
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
      if (+args[1] === 0) {
        return NaN; // Will result in an error on the display
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
  if (n % 1 === 0) {
    let value = 1;
    for (let i = 2; i <= n; i++) {
      value *= i;
    }
    return value;
  } else {
    // Stirling's approximation of gamma function for factorial of decimal
    // values. Source: https://en.wikipedia.org/wiki/Stirling%27s_approximation
    n += 1.0;
    let gamma =
      Math.sqrt((2 * Math.PI) / n) *
      Math.pow((1 / Math.E) * (n + 1 / (12 * n - 1 / (10 * n))), n);
    return gamma;
  }
}

function getActiveElement() {
  /* Returns HTML element that is currently active for input. This will be the
   * current display or a 'power' div, which is nested within current display
   * or another 'power' div.
   */
  const powerElements = currentDisplay.querySelectorAll(".power.active");
  if (powerElements.length !== 0) {
    return powerElements[powerElements.length - 1];
  } else {
    return currentDisplay;
  }
}

function updateActiveElement(a) {
  /* Updates the active element when certain operator buttons are clicked,
   * e.g. +. When there aren't any unclosed closing brackets in a 'power' div,
   * the function checks the parent 'power' div for unclosed brackets, and
   * returns that as the active element when there is at least one such
   * bracket. If there isn't an unclosed closing bracket, it recursively checks
   * the parent of the parent, etc., until it reaches the current display (and
   * returns that as active element).
   */

  if (a === currentDisplay) return currentDisplay;
  if (a.contains(document.querySelector(".unclosed"))) return a;

  a.classList.remove("active");
  a = getActiveElement();
  return updateActiveElement(a);
}

function deactivateAllPowerElements() {
  const powerElements = currentDisplay.querySelectorAll(".power.active");
  powerElements.forEach((powerElement) => {
    powerElement.classList.remove("active");
  });
}

function createInputSquare() {
  const square = document.createElement("div");
  square.classList.add("input-square");
  square.innerHTML = "&#9633;";

  const a = getActiveElement();
  a.insertBefore(square, a.querySelector(".unclosed"));
}

function removeInputSquare() {
  const square = document.querySelector(".input-square");
  const a = getActiveElement();
  a.removeChild(square);
}

function addNumber(buttonId) {
  const activeElement = getActiveElement();
  const number = document.createElement("div");
  number.classList.add("num");
  number.classList.add(buttonId);

  if (buttonId.startsWith("n") && buttonId.length === 2) {
    buttonId = buttonId.substring(1);
  }

  switch (buttonId) {
    case "pi":
      number.innerHTML += "&pi;";
      break;
    case "dot":
      number.innerHTML += ".";
      hasDecimal = true;
      break;
    case "answer":
      number.innerHTML += "Ans";
      break;
    default:
      number.innerHTML += `${buttonId}`;
  }

  activeElement.insertBefore(number, activeElement.querySelector(".unclosed"));
}

function addOperator(buttonId) {
  let activeElement = getActiveElement();
  const operator = document.createElement("div");
  operator.classList.add("op");
  operator.classList.add(buttonId);
  hasDecimal = false;

  switch (buttonId) {
    case "factorial":
      operator.innerHTML = "!";
      break;
    case "percentage":
      operator.innerHTML = "%";
      break;
    case "power":
      operator.classList.add("active");
      break;
    case "sqrt":
      operator.innerHTML = "&Sqrt;(";
      bracketDepth++;
      addUnclosedClosingBracket();
      break;
    case "log":
      operator.innerHTML = "log(";
      bracketDepth++;
      addUnclosedClosingBracket();
      break;
    case "ln":
      operator.innerHTML = "ln(";
      bracketDepth++;
      addUnclosedClosingBracket();
      break;
    case "opening-bracket":
      operator.innerHTML = "(";
      bracketDepth++;
      addUnclosedClosingBracket();
      break;
    case "closing-bracket":
      activeElement = updateActiveElement(activeElement);
      const firstClosingBracket = document.querySelector(".unclosed");
      firstClosingBracket.classList.remove("unclosed");
      bracketDepth--;
      return;
    case "division":
      operator.innerHTML = " &div; ";
      activeElement = updateActiveElement(activeElement);
      break;
    case "multiplication":
      operator.innerHTML = " &times; ";
      activeElement = updateActiveElement(activeElement);
      break;
    case "addition":
      operator.innerHTML = " + ";
      activeElement = updateActiveElement(activeElement);
      break;
    case "subtraction":
      operator.innerHTML = " - ";
      // Condition allows for powers of negative numbers to be calculated
      // without having to use brackets.
      if (activeElement.children.length > 0) {
        activeElement = updateActiveElement(activeElement);
      }
      break;
    case "equals":
      deactivateAllPowerElements();
      let solution = getSolution();
      // Quick fix for floating point imprecision
      solution = parseFloat(Number(solution).toFixed(10));

      operator.innerHTML = ` = `;
      currentDisplay.appendChild(operator);

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
    operator,
    activeElement.querySelector(".unclosed")
  );
}

function addUnclosedClosingBracket() {
  const bracket = document.createElement("div");
  bracket.classList.add("op");
  bracket.classList.add("closing-bracket");
  bracket.classList.add("unclosed");
  bracket.innerHTML = ")";

  const a = getActiveElement();
  a.insertBefore(bracket, a.querySelector(".unclosed"));
}

function disableNumButtons(setting, subset = "all") {
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

function disableOpButtons(setting, subset = "all") {
  // prettier-ignore
  const set1 = [
    "factorial", "percentage", "power", "division", "multiplication",
    "addition", "closing-bracket", "equals"
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

function setButtons() {
  /* Activate and deactivate buttons based on the last entry on the display. */
  const activeElement = getActiveElement();

  if (activeElement.children.length === 0) {
    disableOpButtons(true, (subset = "after"));
    disableNumButtons(false);
    return;
  }

  let last;
  const length = activeElement.children.length;
  for (let i = 0; i < length; i++) {
    let next = activeElement.children[i + 1];
    if (i === length - 1 || next.matches(".unclosed")) {
      // Last child or last before unclosed closing bracket
      last = activeElement.children[i];
      break;
    }
  }

  if (last.matches(".pi, .e, .answer")) {
    disableNumButtons(true);
    disableOpButtons(false, (subset = "after-including-minus"));
  } else if (last.matches(".dot")) {
    disableNumButtons(true, (subset = "dot-and-special-numbers"));
    disableOpButtons(true);
  } else if (last.matches(".num")) {
    if (last.matches(".solution")) {
      disableNumButtons(true);
      disableOpButtons(false, (subset = "after-including-minus"));
    } else {
      disableNumButtons(true, (subset = "special-numbers"));
      disableOpButtons(false, (subset = "after-including-minus"));
    }
  } else if (last.matches(".factorial, .percentage, .closing-bracket")) {
    disableNumButtons(true);
    disableOpButtons(false, (subset = "after-including-minus"));
  } else if (last.matches(".power")) {
    disableNumButtons(true);
    disableOpButtons(true, (subset = "after"));
  } else if (last.matches(".op")) {
    disableNumButtons(false);
    disableOpButtons(true, (subset = "after"));
  }
}

function clear() {
  /* Backspace function, remove previous input of current operation */
  let activeElement = getActiveElement();

  // If 'power' div is empty, go to parent. This will allow for removal
  // of the 'power' div itself. The parent will always have children,
  // since (a) it contains a 'power' div, and (b) a 'power' div can only
  // follow a number.
  if (activeElement.children.length < 1) {
    activeElement.classList.remove("active");
    activeElement = getActiveElement();
  }

  // Don't do anything when the active element is empty. As per the
  // condition above, this can only be the case when the active element
  // is currentDisplay.
  const length = activeElement.children.length;
  if (length < 1) return;

  let indexToRemove;
  for (let i = 0; i < length; i++) {
    const next = activeElement.children[i + 1];
    if (i === length - 1 || next.matches(".unclosed")) {
      indexToRemove = i;
      break;
    }
  }

  const removee = activeElement.children[indexToRemove];
  if (removee.matches(".power") && !removee.matches(".active")) {
    if (removee.children.length > 0) {
      removee.classList.add("active");
    } else {
      activeElement.removeChild(removee);
    }
  } else if (removee.matches(".closing-bracket")) {
    removee.classList.add("unclosed");
    bracketDepth++;
  } else if (removee.matches(".opening-bracket, .sqrt, .log, .ln")) {
    // Remove the removee div and then the closing bracket that takes
    // its index on the children node list.
    activeElement.removeChild(removee);
    activeElement.removeChild(activeElement.children[indexToRemove]);
    bracketDepth--;
  } else {
    activeElement.removeChild(removee);
  }
}

function updatePrevious() {
  /* Update display of previous operation */
  const length = previousDisplay.children.length;
  if (previousDisplay.children[length - 1].matches(".equals")) {
    // Clear previousDisplay when the previous calculation didn't have an
    // answer, i.e. when an error was thrown.
    previousDisplay.innerHTML = "";
  } else if (length > 3 || !previousDisplay.children[0].matches(".answer")) {
    // Replace the full previous operation by "Ans", i.e. '5 + 1 = 6' becomes
    // 'Ans = 6'.
    while (!previousDisplay.children[0].matches(".equals")) {
      previousDisplay.removeChild(previousDisplay.children[0]);
    }
    const answer = document.createElement("div");
    answer.classList.add("num");
    answer.classList.add("answer");
    answer.textContent = "Ans";
    previousDisplay.insertBefore(answer, previousDisplay.children[0]);
  }
}

function hasTouch() {
  return (
    "ontouchstart" in document.documentElement ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function setViewportHeightUnit() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function switchColorMode() {
  document.documentElement.classList.toggle("dark");
  document.documentElement.classList.toggle("light");

  const userPreference = document.documentElement.classList.value;
  localStorage.setItem("mode", userPreference);
}

function setColorModeFromPreference() {
  const userPreference = localStorage.getItem("mode");

  if (userPreference === "dark") {
    document.documentElement.classList.toggle("dark");
    colorModeSwitch.checked = true;
  } else {
    // Set light mode when user preference is light or
    // when no user preference exists in local storage
    document.documentElement.classList.toggle("light");
    colorModeSwitch.checked = false;
  }
}

// prettier-ignore
const keyMap = {
  "!": "factorial",       "p": "pi",              "e": "e",               
  "%": "percentage",      "^": "power",           "s": "sqrt",            
  "l": "log",             "n": "ln",              "(": "opening-bracket", 
  ")": "closing-bracket", "a": "answer",          "Backspace": "clear",
  "/": "division",        "*": "multiplication",  "+": "addition",        
  "-": "subtraction",     ".": "dot",             "Enter": "equals",      
  "=": "equals"
};
[...Array(10).keys()].map((i) => (keyMap[i] = `n${i}`));

let valueStack = [];
let operatorStack = [];
let bracketDepth = 0;
let hasDecimal = false;
let lastAnswer = null;

const colorModeSwitch = document.querySelector("#color-mode-switch");
const numberButtons = document.querySelectorAll("button.number");
const operatorButtons = document.querySelectorAll("button.operator");
const clearButton = document.querySelector("#clear");
const previousDisplay = document.querySelector(".display .previous");
const currentDisplay = document.querySelector(".display .current");

setViewportHeightUnit();
if (!hasTouch()) document.body.className += " has-hover";
setColorModeFromPreference();
setButtons();
createInputSquare();

window.addEventListener("resize", setViewportHeightUnit);
colorModeSwitch.addEventListener("change", switchColorMode);

numberButtons.forEach((numberButton) => {
  numberButton.addEventListener("click", () => {
    const id = numberButton.getAttribute("id");
    removeInputSquare();
    addNumber(id);
    setButtons();
    createInputSquare();
    clearButton.textContent = "CE";
    if (previousDisplay.children.length > 0) updatePrevious();
    numberButton.blur();
  });
});

operatorButtons.forEach((operatorButton) => {
  operatorButton.addEventListener("click", () => {
    const id = operatorButton.getAttribute("id");
    removeInputSquare();
    addOperator(id);
    setButtons();
    createInputSquare();
    clearButton.textContent = id === "equals" ? "AC" : "CE";
    if (previousDisplay.children.length > 0 && id !== "equals") {
      updatePrevious();
    }
    operatorButton.blur();
  });
});

clearButton.addEventListener("click", () => {
  removeInputSquare();
  clear();
  setButtons();
  createInputSquare();
  clearButton.textContent = "CE";
  if (previousDisplay.children.length > 0) updatePrevious();
  clearButton.blur();
});

window.addEventListener("keydown", function (e) {
  console.log(e);

  let button;
  if (e.key === "Dead" && e.code === "Digit6") {
    button = keyMap["^"];
  } else {
    button = keyMap[e.key];
  }
  if (button) document.getElementById(button).click();
});
