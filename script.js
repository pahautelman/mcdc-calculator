document.addEventListener('DOMContentLoaded', () => {
    const model = new MCDCModel();
    const view = new MCDCView();
    const controller = new MCDCController(model, view);

    view.setSubmitHandler(async (expression) => {
        const results = await controller.processExpression(expression);
        view.displayResults(results);
    });
});
