// parser.test.js

function runTests() {
    let passedTests = 0;
    let totalTests = 0;
  
    // Positive test cases for valid expressions
    const tests = [
      {
        name: "Simple variable test",
        input: "x",
        expectedVariables: ["x"],
        testCases: [
          { vars: { x: true }, expected: true },
          { vars: { x: false }, expected: false }
        ]
      },
      {
        name: "Basic AND operation",
        input: "x and y",
        expectedVariables: ["x", "y"],
        testCases: [
          { vars: { x: true, y: true }, expected: true },
          { vars: { x: true, y: false }, expected: false },
          { vars: { x: false, y: true }, expected: false },
          { vars: { x: false, y: false }, expected: false }
        ]
      },
      {
        name: "Basic OR operation",
        input: "x or y",
        expectedVariables: ["x", "y"],
        testCases: [
          { vars: { x: true, y: true }, expected: true },
          { vars: { x: true, y: false }, expected: true },
          { vars: { x: false, y: true }, expected: true },
          { vars: { x: false, y: false }, expected: false }
        ]
      },
      {
        name: "NOT operation",
        input: "not x",
        expectedVariables: ["x"],
        testCases: [
          { vars: { x: true }, expected: false },
          { vars: { x: false }, expected: true }
        ]
      },
      {
        name: "Complex expression with parentheses",
        input: "(x and y) or (not z)",
        expectedVariables: ["x", "y", "z"],
        testCases: [
          { vars: { x: true, y: true, z: true }, expected: true },
          { vars: { x: true, y: true, z: false }, expected: true },
          { vars: { x: false, y: true, z: true }, expected: false },
          { vars: { x: false, y: false, z: false }, expected: true }
        ]
      },
      {
        name: "Literal values",
        input: "x and true",
        expectedVariables: ["x"],
        testCases: [
          { vars: { x: true }, expected: true },
          { vars: { x: false }, expected: false }
        ]
      },
      {
        name: "Multiple NOT operations",
        input: "not not x",
        expectedVariables: ["x"],
        testCases: [
          { vars: { x: true }, expected: true },
          { vars: { x: false }, expected: false }
        ]
      },
      {
        name: "Complex nested expression",
        input: "not (x and y) or (z and not w)",
        expectedVariables: ["x", "y", "z", "w"],
        testCases: [
          { vars: { x: true, y: true, z: true, w: false }, expected: true },
          { vars: { x: true, y: true, z: true, w: true }, expected: false },
          { vars: { x: false, y: true, z: false, w: true }, expected: true }
        ]
      }
    ];
  
    tests.forEach(test => {
      console.group(`Test: ${test.name}`);
      try {
        const result = parseExpression(test.input);
  
        // Test variables collection
        const varsMatch =
          JSON.stringify(result.variables.sort()) ===
          JSON.stringify(test.expectedVariables.sort());
        console.log(`Variables match: ${varsMatch}`);
        if (!varsMatch) {
          console.error(`Expected variables: ${test.expectedVariables}`);
          console.error(`Got variables: ${result.variables}`);
        }
        totalTests++;
        if (varsMatch) passedTests++;
  
        // Test boolean evaluation for each test case
        test.testCases.forEach((testCase, index) => {
          totalTests++;
          try {
            // Ensure variables are provided in the same order as returned by the parser
            const actual = result.decisionFunction(
              ...result.variables.map(v => testCase.vars[v])
            );
            const passed = actual === testCase.expected;
            console.log(`Case ${index + 1}: ${passed ? "PASSED" : "FAILED"}`);
            if (!passed) {
              console.error(`Expected: ${testCase.expected}`);
              console.error(`Got: ${actual}`);
              console.error(`Variables:`, testCase.vars);
            }
            if (passed) passedTests++;
          } catch (e) {
            console.error(`Error in test case ${index + 1}:`, e);
          }
        });
      } catch (e) {
        console.error(`Error parsing expression:`, e);
        totalTests++; // Count parsing failure as a test
      }
      console.groupEnd();
    });
  
    // Negative tests: these expressions should throw errors during parsing
    const negativeTests = [
      { name: "Missing operand after operator", input: "x and" },
      { name: "Missing operand before operator", input: "and x" },
      { name: "Mismatched parentheses (missing closing)", input: "(x and y" },
      { name: "Extra closing parenthesis", input: "x and y)" },
      { name: "Invalid token", input: "x $ y" },
      { name: "Consecutive operands without operator", input: "x y" },
      { name: "Missing operand after not", input: "not" }
    ];
  
    negativeTests.forEach(test => {
      console.group(`Negative Test: ${test.name}`);
      try {
        const result = parseExpression(test.input);
        console.error(
          `FAIL: Expected error, but parsing succeeded with result:`,
          result
        );
        totalTests++;
      } catch (e) {
        console.log(`PASS: Expected error thrown: ${e.message}`);
        passedTests++;
        totalTests++;
      }
      console.groupEnd();
    });
  
    console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`);
  }
  
  // Run the tests
  runTests();
  