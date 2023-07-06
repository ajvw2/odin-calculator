function getSolution() {
  /* Adaptation of Dijkstra's Two-Stack Algorithm to
   * evaluate the mathematical expression and return the
   * solution.
   */
  valueStack = [];
  operatorStack = [];

  const expression = currentDisplay.querySelectorAll("div");
  const length = expression.length;

  let currentValue = null;
  for (let i = 0; i < length; i++) {
    const element = expression[i];
    if (element.matches(".num")) {
      // Update currentValue when the current expression element
      // is a number
      if (element.matches(".pi")) {
        currentValue = Math.PI;
      } else if (element.matches(".e")) {
        currentValue = Math.E;
      } else if (element.matches(".answer")) {
        currentValue = lastAnswer;
      } else {
        // Concatenate numbers 0-9 and decimal point to currentValue
        const n = element.textContent;
        currentValue = !currentValue ? n : currentValue + n;
      }
      // Push currentValue to valueStack when the full number has
      // been read into currentValue. Reset currentValue.
      const next = expression[i + 1];
      if (!next || next.matches(".op")) {
        valueStack.push(currentValue);
        currentValue = null;
      }
    } else if (element.matches(".op")) {
      element.classList.remove("op");
      const operator = expression[i].getAttribute("class");
      if (operator === "factorial" || operator === "percentage") {
        const previousValue = valueStack.pop();
        valueStack.push(calculate(operator, previousValue));
      } else if (operator === "subtraction") {
        // Convert subtraction to multiplication by -1 and addition
        // if a number proceeds the minus operator. This allows for
        // correct evaluation of multiple chained subtractions.
        valueStack.push(-1);
        const previous = expression[i - 1];
        if (i >= 1 && previous.matches(".num, .closing-bracket")) {
          operatorStack.push("addition");
        } else if (i >= 1 && previous.matches(".power")) {
          // Add virtual opening bracket to ensure correct order of operations
          // inside evaluatePart()
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
      if (operator === "division" && nextOperator === "division") {
        // For chain division inputs, e.g. 5 / 5 / 5 / 5 / 5.
        c = valueStack.pop();
        let divisionStack = [a, b, c];
        let divisionDepth = 2;
        nextOperator = operatorStack.pop();
        while (nextOperator === "division") {
          divisionDepth++;
          nextOperator = operatorStack.pop();
        }
        // Push back the last popped operator if it isn't undefined
        // (i.e. end of stack was reached) or isn't 'division'.
        if (nextOperator && nextOperator !== "division")
          operatorStack.push(nextOperator);

        for (let i = divisionDepth; i > 2; i--) {
          divisionStack.push(valueStack.pop());
        }

        valueStack.push(divisionStack.pop());

        for (let i = 0; i < divisionDepth; i++) {
          a = valueStack.pop();
          b = divisionStack.pop();
          valueStack.push(calculate("division", a, b));
        }
        continue;
      }
      if (
        midOrderOps.includes(nextOperator) &&
        (lowOrderOps.includes(operator) || operator === "multiplication")
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
          if (nextOperator === "division" && nextNextOperator === "division") {
            d = valueStack.pop();
            let divisionStack = [b, c, d];
            let divisionDepth = 2;
            nextNextOperator = operatorStack.pop();

            while (nextNextOperator === "division") {
              divisionDepth++;
              nextNextOperator = operatorStack.pop();
            }
            // Push back the last popped operator if it isn't undefined
            // (i.e. end of stack was reached) or isn't 'division'.
            if (nextNextOperator && nextNextOperator !== "division")
              operatorStack.push(nextNextOperator);

            for (let i = divisionDepth; i > 2; i--) {
              divisionStack.push(valueStack.pop());
            }

            valueStack.push(divisionStack.pop());

            for (let i = 0; i < divisionDepth; i++) {
              b = valueStack.pop();
              c = divisionStack.pop();
              valueStack.push(calculate("division", b, c));
            }
            valueStack.push(a);
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
  /* Take operator and necessary arguments for a mathematical
   * operation and return the result.
   */
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
      // Return NaN when dividing by zero, which
      // will result in an error
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
  /* Calculate the factorial of a number n, differentiating
   * between non-decimal and decimal numbers.
   */
  if (n % 1 === 0) {
    let value = 1;
    for (let i = 2; i <= n; i++) {
      value *= i;
    }
    return value;
  } else {
    n += 1.0;
    // Stirling's approximation of gamma function for factorial of decimal values
    // https://en.wikipedia.org/wiki/Stirling%27s_approximation#Versions_suitable_for_calculators
    let gamma =
      Math.sqrt((2 * Math.PI) / n) *
      Math.pow((1 / Math.E) * (n + 1 / (12 * n - 1 / (10 * n))), n);
    return gamma;
  }
}

function getActiveElement() {
  /* Returns HTML element that is currently active for input.
   * This will be the current display or a 'power' div, which
   * is nested within current display or another 'power' div,
   * and appears in superscript.
   */
  const powerElements = currentDisplay.querySelectorAll(".power.active");
  if (powerElements.length !== 0) {
    return powerElements[powerElements.length - 1];
  } else {
    return currentDisplay;
  }
}

function updateActiveElement(activeElement) {
  /* Updates the active element when certain operator buttons
   * are clicked, e.g. +. When there aren't any unclosed closing
   * brackets in a 'power' div, the function checks the parent
   * 'power' div for unclosed brackets, and returns that as the
   * active element when there is at least one such bracket. If
   * there isn't an unclosed closing bracket, it recursively
   * checks the parent of the parent, etc., until it reaches the
   * current display (and returns that as active element).
   */

  // Base case 1: Active element is current display
  if (activeElement === currentDisplay) return currentDisplay;

  // Base case 2: Active element contains unclosed closing bracket
  if (
    activeElement.contains(
      document.querySelector(".closing-bracket.anticipating")
    )
  ) {
    return activeElement;
  }

  // Deactivate current active element, get next active element
  // (i.e. the parent), then recursively call this function on it.
  activeElement.classList.remove("active");
  activeElement = getActiveElement();
  return updateActiveElement(activeElement);
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
  a.insertBefore(square, a.querySelector(".closing-bracket.anticipating"));
}

function removeInputSquare() {
  const square = document.querySelector(".input-square");
  const a = getActiveElement();
  a.removeChild(square);
}

function addNumberToCurrentDisplay(buttonId) {
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

  activeElement.insertBefore(
    number,
    activeElement.querySelector(".closing-bracket.anticipating")
  );
}

function addOperatorToCurrentDisplay(buttonId) {
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
      addNewAnticipatingClosingBracket();
      break;
    case "log":
      operator.innerHTML = "log(";
      bracketDepth++;
      addNewAnticipatingClosingBracket();
      break;
    case "ln":
      operator.innerHTML = "ln(";
      bracketDepth++;
      addNewAnticipatingClosingBracket();
      break;
    case "opening-bracket":
      operator.innerHTML = "(";
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
  /* Activate and deactivate buttons based on the last entry
   * on the display.
   */
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
    // Set 'last' to last child in children or last child before
    // non-closed closing bracket
    if (i === length - 1 || next.matches(".anticipating")) {
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
    if (i === length - 1 || next.matches(".anticipating")) {
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
    removee.classList.add("anticipating");
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
    // Clear previousDisplay when the previous calculation didn't
    // have an answer, i.e. when an error was thrown
    previousDisplay.innerHTML = "";
  } else if (length > 3 || !previousDisplay.children[0].matches(".answer")) {
    // Replace the full previous operation by "Ans", i.e.
    // '5 + 1 = 6' becomes 'Ans = 6'.
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
  /* Detect touch screen */
  return (
    "ontouchstart" in document.documentElement ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function setViewportHeightUnit() {
  let vh = window.innerHeight * 0.01;
  // Set vh in --vh custom property to the root of the document
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
    addNumberToCurrentDisplay(id);
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
    addOperatorToCurrentDisplay(id);
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
  const button = keyMap[e.key];
  if (button) document.getElementById(button).click();
});
