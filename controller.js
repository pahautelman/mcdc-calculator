class MCDCController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async processExpression(expression, maxTries) {
        try {
            const parsed = await this.parseExpression(expression);

            // Check if the expression contains more than 15 variables
            if (parsed.variables.length > 15) {
                const warningMessage = `Warning: You have entered ${parsed.variables.length} variables. Execution might be slow. It is recommended to start with a lower maxTries value and increase it if an optimal solution is not found. Do you wish to continue?`;
                const userConfirmed = await this.view.showConfirmation(warningMessage);
                if (!userConfirmed) {
                    throw new Error('Execution cancelled by user.');
                }
            }

            this.model.variables = parsed.variables;
            this.model.decisionFunction = parsed.decisionFunction;

            this.model.generateTruthTable();
            this.model.findIndependencePairs();
            this.model.findMinimumTestCases(maxTries);
            this.model.verifyCoverage();

            return {
                variables: this.model.variables,
                truthTable: this.model.truthTable,
                independencePairs: this.model.independencePairs,
                minimalTestCases: this.model.minimalTestCases,
                coverageValid: this.model.coverageValid,
                optimalSolution: this.model.optimalSolution
            };
        } catch (error) {
            throw new Error(`Processing failed: ${error.message}`);
        }
    }

    async parseExpression(expression) {
        return parseExpression(expression);
    }
}
