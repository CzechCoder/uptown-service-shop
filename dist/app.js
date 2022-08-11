"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RepairStatus;
(function (RepairStatus) {
    RepairStatus[RepairStatus["Active"] = 0] = "Active";
    RepairStatus[RepairStatus["Finished"] = 1] = "Finished";
})(RepairStatus || (RepairStatus = {}));
class Repair {
    constructor(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
}
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
class RepairState extends State {
    constructor() {
        super();
        this.repairs = [];
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new RepairState();
        return this.instance;
    }
    addRepair(title, description, numOfPeople) {
        const newRepair = new Repair(Math.random().toString(), title, description, numOfPeople, RepairStatus.Active);
        this.repairs.push(newRepair);
        this.updateListeners();
    }
    moveRepair(repairId, newStatus) {
        const repair = this.repairs.find(prj => prj.id === repairId);
        if (repair && repair.status !== newStatus) {
            repair.status = newStatus;
            this.updateListeners();
        }
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.repairs.slice());
        }
    }
}
const repairState = RepairState.getInstance();
function validate(validatableInput) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null &&
        typeof validatableInput.value === 'string') {
        isValid =
            isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null &&
        typeof validatableInput.value === 'string') {
        isValid =
            isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null &&
        typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null &&
        typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}
function autobind(_, _2, descriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor;
}
class Component {
    constructor(templateId, hostElementId, insertAtStart, newElementId) {
        this.templateElement = document.getElementById(templateId);
        this.hostElement = document.getElementById(hostElementId);
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.attach(insertAtStart);
    }
    attach(insertAtBeginning) {
        this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
    }
}
class RepairItem extends Component {
    constructor(hostId, repair) {
        super('single-repair', hostId, false, repair.id);
        this.repair = repair;
        this.configure();
        this.renderContent();
    }
    get persons() {
        if (this.repair.people === 1) {
            return '1 serviceman';
        }
        else {
            return `${this.repair.people} servicemen`;
        }
    }
    dragStartHandler(event) {
        event.dataTransfer.setData('text/plain', this.repair.id);
        event.dataTransfer.effectAllowed = 'move';
    }
    dragEndHandler(_) {
        console.log('DragEnd');
    }
    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
    }
    renderContent() {
        this.element.querySelector('h2').textContent = this.repair.title;
        this.element.querySelector('h3').textContent = this.persons + ' assigned';
        this.element.querySelector('p').textContent = this.repair.description;
    }
}
__decorate([
    autobind
], RepairItem.prototype, "dragStartHandler", null);
class RepairList extends Component {
    constructor(type) {
        super('repair-list', 'app', false, `${type}-repairs`);
        this.type = type;
        this.assignedRepairs = [];
        this.configure();
        this.renderContent();
    }
    dragOverHandler(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEl = this.element.querySelector('ul');
            listEl.classList.add('droppable');
        }
    }
    dropHandler(event) {
        const prjId = event.dataTransfer.getData('text/plain');
        repairState.moveRepair(prjId, this.type === 'active' ? RepairStatus.Active : RepairStatus.Finished);
    }
    dragLeaveHandler(_) {
        const listEl = this.element.querySelector('ul');
        listEl.classList.remove('droppable');
    }
    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
        repairState.addListener((repairs) => {
            const relevantRepairs = repairs.filter(prj => {
                if (this.type === 'active') {
                    return prj.status === RepairStatus.Active;
                }
                return prj.status === RepairStatus.Finished;
            });
            this.assignedRepairs = relevantRepairs;
            this.renderRepairs();
        });
    }
    renderContent() {
        const listId = `${this.type}-repairs-list`;
        this.element.querySelector('ul').id = listId;
        this.element.querySelector('h2').textContent =
            this.type.toUpperCase() + ' REPAIRS';
    }
    renderRepairs() {
        const listEl = document.getElementById(`${this.type}-repairs-list`);
        listEl.innerHTML = '';
        for (const prjItem of this.assignedRepairs) {
            new RepairItem(this.element.querySelector('ul').id, prjItem);
        }
    }
}
__decorate([
    autobind
], RepairList.prototype, "dragOverHandler", null);
__decorate([
    autobind
], RepairList.prototype, "dropHandler", null);
__decorate([
    autobind
], RepairList.prototype, "dragLeaveHandler", null);
class RepairInput extends Component {
    constructor() {
        super('repair-input', 'app', true, 'user-input');
        this.titleInputElement = this.element.querySelector('#title');
        this.descriptionInputElement = this.element.querySelector('#description');
        this.peopleInputElement = this.element.querySelector('#people');
        this.configure();
    }
    configure() {
        this.element.addEventListener('submit', this.submitHandler);
    }
    renderContent() { }
    gatherUserInput() {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;
        const titleValidatable = {
            value: enteredTitle,
            required: true
        };
        const descriptionValidatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        };
        const peopleValidatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 10
        };
        if (!validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)) {
            alert('Please make sure you input at least 5 characters into description and that you have assigned 10 servicemen or less!');
            return;
        }
        else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }
    clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }
    submitHandler(event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            repairState.addRepair(title, desc, people);
            this.clearInputs();
        }
    }
}
__decorate([
    autobind
], RepairInput.prototype, "submitHandler", null);
const prjInput = new RepairInput();
const activePrjList = new RepairList('active');
const finishedPrjList = new RepairList('finished');
//# sourceMappingURL=app.js.map