"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeWeCodePost = void 0;
const vscode_1 = require("vscode");
/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
function WeWeCodePost(context) {
    return __awaiter(this, void 0, void 0, function* () {
        class MyButton {
            constructor(iconPath, tooltip) {
                this.iconPath = iconPath;
                this.tooltip = tooltip;
            }
        }
        const createResourceGroupButton = new MyButton({
            dark: vscode_1.Uri.file(context.asAbsolutePath('resources/dark/add.svg')),
            light: vscode_1.Uri.file(context.asAbsolutePath('resources/light/add.svg')),
        }, 'Create Resource Group');
        const resourceGroups = ['Peer', 'Mentor']
            .map(label => ({ label }));
        function collectInputs() {
            return __awaiter(this, void 0, void 0, function* () {
                const state = {};
                yield MultiStepInput.run(input => inputLink(input, state));
                return state;
            });
        }
        const title = 'WeWe Code Post';
        // Prompts for the Live Share link for the project
        function inputLink(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.link = yield input.showInputBox({
                    title,
                    step: 1,
                    totalSteps: 4,
                    value: state.link || '',
                    prompt: 'Paste the Visual Studio Live Share link',
                    validate: validateNameIsUnique,
                    shouldResume: shouldResume
                });
                return (input) => inputProjectTitle(input, state);
            });
        }
        // Prompts for the title of the project
        function inputProjectTitle(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.projectTitle = yield input.showInputBox({
                    title,
                    step: 2,
                    totalSteps: 4,
                    value: state.projectTitle || '',
                    prompt: 'Title of your project',
                    validate: validateNameIsUnique,
                    shouldResume: shouldResume
                });
                return (input) => inputProjectDescription(input, state);
            });
        }
        // Prompts for the description of the project
        function inputProjectDescription(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                state.projectDescription = yield input.showInputBox({
                    title,
                    step: 3,
                    totalSteps: 4,
                    value: state.projectDescription || '',
                    prompt: 'Describe your project (languages and/or frameworks)',
                    validate: validateNameIsUnique,
                    shouldResume: shouldResume
                });
                return (input) => pickPeerLimit(input, state);
            });
        }
        // Prompts for the peer limit of the project
        function pickPeerLimit(input, state) {
            return __awaiter(this, void 0, void 0, function* () {
                const peerlimits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
                    .map(label => ({ label }));
                ;
                state.peerLimit = yield input.showQuickPick({
                    title,
                    step: 4,
                    totalSteps: 4,
                    placeholder: 'Pick the number of people you want working on this project',
                    items: peerlimits,
                    activeItem: state.peerLimit,
                    shouldResume: shouldResume
                });
            });
        }
        function shouldResume() {
            // Could show a notification with the option to resume.
            return new Promise((resolve, reject) => {
                // noop
            });
        }
        function validateNameIsUnique(name) {
            return __awaiter(this, void 0, void 0, function* () {
                // ...validate...
                yield new Promise(resolve => setTimeout(resolve, 1000));
                return name === 'vscode' ? 'Name not unique' : undefined;
            });
        }
        const state = yield collectInputs();
        const data = JSON.stringify({ link: state.link,
            title: state.projectTitle,
            description: state.projectDescription,
            peerlimit: state.peerLimit.label
        });
        const axios = require('axios');
        axios.post("https://wewecode.herokuapp.com/projects/add", data, { headers: { "Content-Type": "application/json" } });
        vscode_1.window.showInformationMessage(`Posting your project '${state.projectTitle}' with peer limit of '${state.peerLimit.label}' to WeWe Code'`);
    });
}
exports.WeWeCodePost = WeWeCodePost;
// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------
class InputFlowAction {
}
InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static run(start) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = new MultiStepInput();
            return input.stepThrough(start);
        });
    }
    stepThrough(start) {
        return __awaiter(this, void 0, void 0, function* () {
            let step = start;
            while (step) {
                this.steps.push(step);
                if (this.current) {
                    this.current.enabled = false;
                    this.current.busy = true;
                }
                try {
                    step = yield step(this);
                }
                catch (err) {
                    if (err === InputFlowAction.back) {
                        this.steps.pop();
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.resume) {
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.cancel) {
                        step = undefined;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (this.current) {
                this.current.dispose();
            }
        });
    }
    showQuickPick({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createQuickPick();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.placeholder = placeholder;
                    input.items = items;
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidChangeSelection(items => resolve(items[0])), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
    showInputBox({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }) {
        return __awaiter(this, void 0, void 0, function* () {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode_1.window.createInputBox();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.value = value || '';
                    input.prompt = prompt;
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    let validating = validate('');
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode_1.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(yield validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    })), input.onDidChangeValue((text) => __awaiter(this, void 0, void 0, function* () {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = yield current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    })), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
}
//# sourceMappingURL=multiStepInput.js.map