let i = 1;
let result = '';

while (true) {
  result += i;
  i++;

  // Break out of the loop when the length of the result reaches a limit
  if (result.length >= 10) {
    break;
  }
}

// This line will be reached after the loop breaks
console.log(result);
