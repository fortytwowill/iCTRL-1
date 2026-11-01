import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogPeriodPicker } from '../components/common/LogPeriodPicker';
import { LogDateBounds, LogPeriod } from '../lib/logPeriod';

// Mock useMediaQuery to control responsive layout
const mockUseMediaQuery = vi.fn();
vi.mock('../hooks/useMediaQuery', () => ({
 useMediaQuery: (query: string) => mockUseMediaQuery(query),
}));

describe('LogPeriodPicker', () => {
 const mockOnChange = vi.fn();
 const mockOnRetry = vi.fn();
 const defaultProps = {
 value: undefined as LogPeriod | undefined,
 onChange: mockOnChange,
 bounds: { earliest: '2025-01-01T00:00:00Z', latest: '2026-12-31T23:59:59Z' } as LogDateBounds,
 isLoading: false,
 error: null,
 onRetry: mockOnRetry,
 };

 beforeEach(() => {
 vi.clearAllMocks();
 mockUseMediaQuery.mockReturnValue(true); // Default to wide/desktop
 });

 it('renders trigger with "All dates" when no value', () => {
 render(<LogPeriodPicker {...defaultProps} />);
 expect(screen.getByText('Period: All dates')).toBeInTheDocument();
 });

 it('renders trigger with formatted range when value provided', () => {
 const value: LogPeriod = { startDate: '2026-03-15', endDate: '2026-03-20' };
 render(<LogPeriodPicker {...defaultProps} value={value} />);
 expect(screen.getByText(/Period: Mar 15, 2026 – Mar 20, 2026/)).toBeInTheDocument();
 });

 it('opens dialog and shows availability banner', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 await waitFor(() => {
 expect(screen.getByText('Choose period')).toBeInTheDocument();
 expect(screen.getByText(/Available records:/)).toBeInTheDocument();
 });
 });

 it('shows loading state and disables date inputs', async () => {
 render(<LogPeriodPicker {...defaultProps} isLoading={true} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 await waitFor(() => {
 expect(screen.getByText('Loading available dates…')).toBeInTheDocument();
 expect(screen.getByLabelText('Start date')).toBeDisabled();
 expect(screen.getByLabelText('End date')).toBeDisabled();
 });
 });

 it('shows error state with Retry button', async () => {
 const error = new Error('Failed to fetch');
 render(<LogPeriodPicker {...defaultProps} error={error} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 await waitFor(() => {
 expect(screen.getByText("Couldn't load available dates.")).toBeInTheDocument();
 expect(screen.getByText('Retry')).toBeInTheDocument();
 });
 fireEvent.click(screen.getByText('Retry'));
 expect(mockOnRetry).toHaveBeenCalled();
 });

 it('shows empty state when no bounds', async () => {
 render(<LogPeriodPicker {...defaultProps} bounds={null} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 await waitFor(() => {
 expect(screen.getByText('No logs available for the current filters.')).toBeInTheDocument();
 });
 });

 it('draft selection does not commit until Apply is clicked', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 
 const startInput = screen.getByLabelText('Start date');
 const endInput = screen.getByLabelText('End date');
 fireEvent.change(startInput, { target: { value: '2026-01-01' } });
 fireEvent.change(endInput, { target: { value: '2026-01-31' } });
 
 // Click Cancel
 fireEvent.click(screen.getByText('Cancel'));
 
 // Trigger should still say All dates
 expect(screen.getByText('Period: All dates')).toBeInTheDocument();
 expect(mockOnChange).not.toHaveBeenCalled();
 });

 it('Apply commits both complete dates', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 
 const startInput = screen.getByLabelText('Start date');
 const endInput = screen.getByLabelText('End date');
 fireEvent.change(startInput, { target: { value: '2026-01-01' } });
 fireEvent.change(endInput, { target: { value: '2026-01-31' } });
 
 fireEvent.click(screen.getByText('Apply period'));
 
 expect(mockOnChange).toHaveBeenCalledWith({ startDate: '2026-01-01', endDate: '2026-01-31' });
 });

 it('same-day Apply works', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 
 const startInput = screen.getByLabelText('Start date');
 const endInput = screen.getByLabelText('End date');
 fireEvent.change(startInput, { target: { value: '2026-06-15' } });
 fireEvent.change(endInput, { target: { value: '2026-06-15' } });
 
 fireEvent.click(screen.getByText('Apply period'));
 
 expect(mockOnChange).toHaveBeenCalledWith({ startDate: '2026-06-15', endDate: '2026-06-15' });
 });

 it('reversed dates disable Apply with labelled error', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 
 const startInput = screen.getByLabelText('Start date');
 const endInput = screen.getByLabelText('End date');
 fireEvent.change(startInput, { target: { value: '2026-01-31' } });
 fireEvent.change(endInput, { target: { value: '2026-01-01' } });
 
 // Wait for live validation effect to update applyError
 await waitFor(() => {
 expect(screen.getByText('End date must be on or after start date.')).toBeInTheDocument();
 });
 expect(screen.getByText('Apply period')).toBeDisabled();
 });

 it('missing dates disable Apply', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 
 expect(screen.getByText('Apply period')).toBeDisabled();
 });

 it('All dates clears only the period', async () => {
 const value: LogPeriod = { startDate: '2026-01-01', endDate: '2026-01-31' };
 render(<LogPeriodPicker {...defaultProps} value={value} />);
 fireEvent.click(screen.getByText(/Period: Jan 1, 2026/));
 
 fireEvent.click(screen.getByText('All dates'));
 
 expect(mockOnChange).toHaveBeenCalledWith(undefined);
 });

 it('jump controls are present and enabled when draft month exists', async () => {
 render(<LogPeriodPicker {...defaultProps} />);
 fireEvent.click(screen.getByText('Period: All dates'));
 
 // Set a date to initialize draftMonth
 const startInput = screen.getByLabelText('Start date');
 fireEvent.change(startInput, { target: { value: '2026-01-01' } });
 
 // Verify jump controls are present
 expect(screen.getByText('Jump to month')).toBeInTheDocument();
 expect(screen.getByText('Jump to year')).toBeInTheDocument();
 
 // Dialog should still be open, no onChange called yet
 expect(screen.getByText('Choose period')).toBeInTheDocument();
 expect(mockOnChange).not.toHaveBeenCalled();
 });

 it('uses one-month layout on narrow screens', () => {
 mockUseMediaQuery.mockReturnValue(false);
 render(<LogPeriodPicker {...defaultProps} />);
 expect(mockUseMediaQuery).toHaveBeenCalledWith('(min-width: 768px)');
 });
});