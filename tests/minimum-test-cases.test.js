function runTests() {
    let passedTests = 0;
    let totalTests = 0;

    const tests = [
        {
            name: "Single variable A",
            variables: ["A"],
            decisionFunction: (A) => A,
            expectedMinimalCount: 2,
            expectCoverageValid: true
        },
        {
            name: "A OR B",
            variables: ["A", "B"],
            decisionFunction: (A, B) => A || B,
            expectedMinimalCount: 3,
            expectCoverageValid: true
        },
        {
            name: "A AND B",
            variables: ["A", "B"],
            decisionFunction: (A, B) => A && B,
            expectedMinimalCount: 3,
            expectCoverageValid: true
        },
        {
            name: "Three variables: (A AND B) OR C",
            variables: ["A", "B", "C"],
            decisionFunction: (A, B, C) => (A && B) || C,
            expectedMinimalCount: 4,
            expectCoverageValid: true
        },
        {
            name: "A XOR B",
            variables: ["A", "B"],
            decisionFunction: (A, B) => A !== B,
            expectedMinimalCount: 3,
            expectCoverageValid: true
        },
        {
            name: "Complex expression with three variables",
            variables: ["A", "B", "C"],
            decisionFunction: (A, B, C) => (A || B) && C,
            expectedMinimalCount: 4,
            expectCoverageValid: true
        }
    ];

    tests.forEach(test => {
        console.group(`Test: ${test.name}`);
        totalTests++;
        let passed = true;

        try {
            const model = new MCDCModel();
            model.variables = test.variables;
            model.decisionFunction = test.decisionFunction;

            // Generate truth table and find pairs
            model.generateTruthTable();
            model.findIndependencePairs();
            
            // Find minimal test cases
            const minimalTestCases = model.findMinimumTestCases();
            
            // Verify coverage
            const coverageValid = model.verifyCoverage();

            // 1. Check minimal test cases count
            if (minimalTestCases.length !== test.expectedMinimalCount) {
                console.error(`FAIL: Expected ${test.expectedMinimalCount} test cases, got ${minimalTestCases.length}`);
                passed = false;
            }

            // 2. Check coverage validation
            if (coverageValid !== test.expectCoverageValid) {
                console.error(`FAIL: Expected coverage ${test.expectCoverageValid}, got ${coverageValid}`);
                passed = false;
            }

            // 3. Direct verification of coverage criteria
            if (passed) {
                // Check variable coverage
                const variableCoverageValid = test.variables.every(variable => {
                    const values = minimalTestCases.map(tc => tc[variable]);
                    return values.includes(true) && values.includes(false);
                });

                // Check decision coverage
                const decisionCoverageValid = minimalTestCases.some(tc => tc.decision) && 
                                           minimalTestCases.some(tc => !tc.decision);

                if (!variableCoverageValid || !decisionCoverageValid) {
                    console.error(`FAIL: Coverage criteria not met`);
                    console.error(`Variable coverage: ${variableCoverageValid}`);
                    console.error(`Decision coverage: ${decisionCoverageValid}`);
                    passed = false;
                }
            }

            if (passed) {
                passedTests++;
                console.log("PASSED");
            } else {
                console.log("FAILED");
            }
        } catch (e) {
            console.error("Test execution error:", e);
            passed = false;
        }
        console.groupEnd();
    });

    console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`);
}

// Run the tests
runTests();
