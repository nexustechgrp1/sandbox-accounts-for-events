import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react"
import userEvent from "@testing-library/user-event";
import CreateEventModal from "./CreateEventModal";
import { Provider } from "react-redux";
import store from "../../redux/store";
import * as actions from "../../redux/actions/events";
import moment from "moment";

const ReduxProvider = ({ children, reduxStore }) => <Provider store={reduxStore}>{children}</Provider>;

test("renders CreateEventModal, cannot submit empty dialog", async () => {

    await act(async () => {
        render(
            <ReduxProvider reduxStore={store}>
                <CreateEventModal />
            </ReduxProvider>
        );
    })
    const createButtonElement = screen.getByRole("button", { name: "Create" })

    expect(screen.getByText(/create new event/i)).toBeInTheDocument();

    expect(createButtonElement).toBeEnabled()
    await act(async () => {
        await userEvent.click(createButtonElement)
    })
    expect(createButtonElement).toBeDisabled()
});

test("renders CreateEventModal, enters valid and invalid texts, submits", async () => {

    const testObject = {
        id: '',
        eventName: 'testname',
        eventOwner: 'testemail@domain.org',
        eventDays: '10',
        eventHours: '8',
        eventBudget: '10',
        maxAccounts: '10',
        eventDateInput: '2099-01-01',
        eventTimeInput: '10:00',
        eventStatus: 'Waiting'
    }
    testObject.eventOn = moment(testObject.eventDateInput + " " + testObject.eventTimeInput).unix()
    await act(async () => {
        render(
            <ReduxProvider reduxStore={store}>
                <CreateEventModal />
            </ReduxProvider>
        );
    })
    expect(screen.getByText(/create new event/i)).toBeInTheDocument();
    const nameInputElement = screen.getByLabelText(/event name/i);
    const dateInputElement = screen.getByPlaceholderText("YYYY/MM/DD");
    const timeInputElement = screen.getByPlaceholderText("00:00");
    const ownerInputElement = screen.getByLabelText(/event owner email address/i);
    const durationDaysInputElement = screen.getByPlaceholderText("0");
    const durationHoursInputElement = screen.getByPlaceholderText("8");
    const accountsInputElement = screen.getByLabelText(/maximum number of aws accounts/i);
    const budgetInputElement = screen.getByLabelText(/budget in usd/i);
    const createButtonElement = screen.getByRole("button", { name: "Create" })

    // check if submit button is initially enabled
    expect(createButtonElement).toBeEnabled()
    await act(async () => {
        await userEvent.type(nameInputElement, testObject.eventName)
    })

    // try invalid and valid email address
    await act(async () => {
        await userEvent.type(ownerInputElement, "testowner")
    })
    expect(createButtonElement).toBeDisabled()
    await act(async () => {
        await userEvent.clear(ownerInputElement)
        await userEvent.type(ownerInputElement, testObject.eventOwner)
    })
    expect(createButtonElement).toBeEnabled()

    // try invalid and valid date
    await act(async () => {
        await userEvent.clear(timeInputElement)
        fireEvent.change(timeInputElement, { target: { value: testObject.eventTimeInput } } )
        await userEvent.clear(dateInputElement)
        fireEvent.change(dateInputElement, { target: { value: "2021-01-01" } } )
    })
    expect(createButtonElement).toBeDisabled()
    await act(async () => {
        await userEvent.clear(dateInputElement)
        fireEvent.change(dateInputElement, { target: { value: testObject.eventDateInput.replaceAll("-", "/") } } )
    })
    expect(createButtonElement).toBeEnabled()

    // try invalid and valid duration
    await act(async () => {
        await userEvent.clear(durationDaysInputElement)
        await userEvent.type(durationDaysInputElement, testObject.eventDays)
        await userEvent.type(durationHoursInputElement, '25')
    })
    expect(createButtonElement).toBeDisabled()
    await act(async () => {
        await userEvent.clear(durationHoursInputElement)
        await userEvent.type(durationHoursInputElement, testObject.eventHours)
    })
    expect(createButtonElement).toBeEnabled()

    // try invalid and valid number of accounts
    await act(async () => {
        await userEvent.type(accountsInputElement, '5a')
    })
    expect(createButtonElement).toBeDisabled()
    await act(async () => {
        await userEvent.clear(accountsInputElement)
        await userEvent.type(accountsInputElement, testObject.maxAccounts)
    })
    expect(createButtonElement).toBeEnabled()

    // try invalid and valid budget
    await act(async () => {
        await userEvent.type(budgetInputElement, '5a')
    })
    expect(createButtonElement).toBeDisabled()
    await act(async () => {
        await userEvent.clear(budgetInputElement)
        await userEvent.type(budgetInputElement, testObject.eventBudget)
    })
    expect(createButtonElement).toBeEnabled()

    // submit and test redux action call payload
    const createEventAction = jest.spyOn(actions, "createEvent").mockImplementation((event) => () => event)
    await act(async () => {
        await userEvent.click(createButtonElement)
    })
    expect(createEventAction.mock.lastCall[0]).toMatchObject(testObject)

});
