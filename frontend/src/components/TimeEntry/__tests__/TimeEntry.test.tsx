import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeEntry from '../TimeEntry';
import { useTimeEntry } from '../../../hooks/useTimeEntry';

// Mock des useTimeEntry Hooks
jest.mock('../../../hooks/useTimeEntry', () => ({
  useTimeEntry: jest.fn(),
}));

describe('TimeEntry Component', () => {
  const mockCreateTimeEntry = jest.fn();
  const mockUpdateTimeEntry = jest.fn();
  const mockDeleteTimeEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeEntry as jest.Mock).mockReturnValue({
      createTimeEntry: mockCreateTimeEntry,
      updateTimeEntry: mockUpdateTimeEntry,
      deleteTimeEntry: mockDeleteTimeEntry,
      loading: false,
      error: null,
    });
  });

  it('renders time entry form correctly', () => {
    render(<TimeEntry />);
    
    expect(screen.getByTestId('time-entry-form')).toBeInTheDocument();
    expect(screen.getByTestId('project-select')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('start-time-input')).toBeInTheDocument();
    expect(screen.getByTestId('end-time-input')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TimeEntry />);
    
    fireEvent.click(screen.getByTestId('submit-time-entry'));
    
    await waitFor(() => {
      expect(screen.getByText('Bitte wählen Sie ein Projekt aus')).toBeInTheDocument();
      expect(screen.getByText('Bitte geben Sie eine Beschreibung ein')).toBeInTheDocument();
      expect(screen.getByText('Bitte geben Sie gültige Start- und Endzeiten ein')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const timeEntryData = {
      projectId: '1',
      description: 'Test Description',
      startTime: '09:00',
      endTime: '17:00',
    };

    mockCreateTimeEntry.mockResolvedValueOnce({ id: '1', ...timeEntryData });

    render(<TimeEntry />);
    
    // Simuliere die Projektauswahl
    const projectSelect = screen.getByTestId('project-select');
    fireEvent.mouseDown(projectSelect);
    fireEvent.change(projectSelect, { target: { value: '1' } });
    
    await userEvent.type(screen.getByTestId('description-input'), timeEntryData.description);
    await userEvent.type(screen.getByTestId('start-time-input'), timeEntryData.startTime);
    await userEvent.type(screen.getByTestId('end-time-input'), timeEntryData.endTime);
    
    fireEvent.click(screen.getByTestId('submit-time-entry'));
    
    await waitFor(() => {
      expect(mockCreateTimeEntry).toHaveBeenCalledWith(timeEntryData);
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    const errorMessage = 'Ein Fehler ist aufgetreten';
    mockCreateTimeEntry.mockRejectedValueOnce(new Error(errorMessage));

    render(<TimeEntry />);
    
    // Simuliere die Projektauswahl
    const projectSelect = screen.getByTestId('project-select');
    fireEvent.mouseDown(projectSelect);
    fireEvent.change(projectSelect, { target: { value: '1' } });
    
    await userEvent.type(screen.getByTestId('description-input'), 'Test Description');
    await userEvent.type(screen.getByTestId('start-time-input'), '09:00');
    await userEvent.type(screen.getByTestId('end-time-input'), '17:00');
    
    fireEvent.click(screen.getByTestId('submit-time-entry'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
  });
}); 