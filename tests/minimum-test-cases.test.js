function runTests() {
    let passedTests = 0;
    let totalTests = 0;

    const tests = [
        {
            name: "Single variable A",
            variables: ["A"],
            decisionFunction: (A) => A,
        },
        {
            name: "A OR B",
            variables: ["A", "B"],
            decisionFunction: (A, B) => A || B,
        },
        {
            name: "A AND B",
            variables: ["A", "B"],
            decisionFunction: (A, B) => A && B,
        },
        {
            name: "Three variables: (A AND B) OR C",
            variables: ["A", "B", "C"],
            decisionFunction: (A, B, C) => (A && B) || C,
        },
        {
            name: "A XOR B",
            variables: ["A", "B"],
            decisionFunction: (A, B) => A !== B,
        },
        {
            name: "Complex expression with three variables",
            variables: ["A", "B", "C"],
            decisionFunction: (A, B, C) => (A || B) && C,
        },
        {
            name: "Complex expression with eight variables",
            variables: ["A", "B", "C", "D", "E", "F", "G", "H"],
            decisionFunction: (A, B, C, D, E, F, G, H) => ((A && B) || (!C && D)) && ((E || F) && (!G || H)),
        },
        {
            name: "Complex expression with eight variables and repeated checks",
            variables: ["A", "B", "C", "D", "E", "F", "G", "H"],
            decisionFunction: (A, B, C, D, E, F, G, H) => 
                ((A && B) || (A && !C)) && ((D || E) && (E || F) && (!G || H)),
        },
        {
            name: "Complex expression with nine variables",
            variables: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            decisionFunction: (A, B, C, D, E, F, G, H, I) => 
                ((A && !B) || (C && D)) && ((E || F) && (!G || (H && I))),
        },
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
            const minimalTestCases = model.findMinimumTestCases(500);
            
            // Verify coverage
            const results = model.verifyCoverage();

            const expectedMinimalCount = test.variables.length + 1;

            // 1. Check minimal test cases count
            if (minimalTestCases.length !== expectedMinimalCount) {
                console.error(`FAIL: Expected ${expectedMinimalCount} test cases, got ${minimalTestCases.length}`);
                passed = false;
            }

            // 2. Check coverage validation
            if (results.coverageValid !== true) {
                console.error(`FAIL: Expected coverage ${true}, got ${coverageValid}`);
                passed = false;
            }

            // 3. Check optimal solution
            if (results.optimalSolution !== true) {
                console.error(`FAIL: Expected optimal solution, got ${results.optimalSolution}`);
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
