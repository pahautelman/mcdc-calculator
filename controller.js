class MCDCController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async processExpression(expression, maxTries) {
        try {
            const parsed = await this.parseExpression(expression);
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
        // This would call your existing parser implementation
        return parseExpression(expression);
    }
}
