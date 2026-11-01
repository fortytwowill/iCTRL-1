import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

 import { Button, Select, Modal, TextInput, Stack, Group, Text } from '@mantine/core';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LogDateBounds, LogPeriod, parseLogDate } from '@/lib/logPeriod';
 import { DatePickerInput } from '@mantine/dates';

type LogPeriodPickerProps = {
  value: LogPeriod | undefined;
  onChange: (period: LogPeriod | undefined) => void;
  bounds: LogDateBounds | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
};

export function LogPeriodPicker({
  value,
  onChange,
  bounds,
  isLoading,
  error,
  onRetry,
}: LogPeriodPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draftStart, setDraftStart] = React.useState<string>('');
  const [draftEnd, setDraftEnd] = React.useState<string>('');
  const [draftRange, setDraftRange] = React.useState<[Date | null, Date | null]>([null, null]);
  const [applyError, setApplyError] = React.useState<string | null>(null);

  const wide = useMediaQuery('(min-width: 768px)');

  React.useEffect(() => {
    if (open) {
      if (value) {
        setDraftStart(value.startDate);
        setDraftEnd(value.endDate);
        const start = parseLogDate(value.startDate);
        const end = parseLogDate(value.endDate);
        setDraftRange([start || null, end || null]);
      } else {
        setDraftStart('');
        setDraftEnd('');
        setDraftRange([null, null]);
      }
      setApplyError(null);
    }
  }, [open, value, bounds]);

  const minDate = React.useMemo(() => {
    if (bounds?.earliest) return parseISO(bounds.earliest);
    if (value?.startDate) return parseLogDate(value.startDate) || undefined;
    return undefined;
  }, [bounds, value]);

  const maxDate = React.useMemo(() => {
    if (bounds?.latest) return parseISO(bounds.latest);
    if (value?.endDate) return parseLogDate(value.endDate) || undefined;
    return undefined;
  }, [bounds, value]);

  const minYear = React.useMemo(() => {
    const years: number[] = [];
    if (bounds?.earliest) years.push(parseISO(bounds.earliest).getFullYear());
    if (bounds?.latest) years.push(parseISO(bounds.latest).getFullYear());
    if (value?.startDate) years.push(parseISO(value.startDate).getFullYear());
    if (value?.endDate) years.push(parseISO(value.endDate).getFullYear());
    return years.length ? Math.min(...years) : new Date().getFullYear() - 5;
  }, [bounds, value]);

  const maxYear = React.useMemo(() => {
    const years: number[] = [];
    if (bounds?.earliest) years.push(parseISO(bounds.earliest).getFullYear());
    if (bounds?.latest) years.push(parseISO(bounds.latest).getFullYear());
    if (value?.startDate) years.push(parseISO(value.startDate).getFullYear());
    if (value?.endDate) years.push(parseISO(value.endDate).getFullYear());
    return years.length ? Math.max(...years) : new Date().getFullYear() + 1;
  }, [bounds, value]);

  const handleRangeChange = (val: [Date | null, Date | null]) => {
    setDraftRange(val);
    if (val[0]) {
      setDraftStart(format(val[0], 'yyyy-MM-dd'));
    } else {
      setDraftStart('');
    }
    if (val[1]) {
      setDraftEnd(format(val[1], 'yyyy-MM-dd'));
    } else {
      setDraftEnd('');
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraftStart(val);
    const date = parseLogDate(val);
    if (date) {
      setDraftRange(prev => [date, prev[1]]);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraftEnd(val);
    const date = parseLogDate(val);
    if (date) {
      setDraftRange(prev => [prev[0], date]);
    }
  };

  const handleApply = () => {
    const start = parseLogDate(draftStart);
    const end = parseLogDate(draftEnd);
    if (!start || !end) {
      setApplyError('Select a valid start and end date.');
      return;
    }
    if (end < start) {
      setApplyError('End date must be on or after start date.');
      return;
    }
    onChange({ startDate: draftStart, endDate: draftEnd });
    setOpen(false);
  };

  const handleAllDates = () => {
    onChange(undefined);
    setOpen(false);
  };

  const triggerLabel = value
    ? `Period: ${format(parseISO(value.startDate), 'MMM d, yyyy')} – ${format(parseISO(value.endDate), 'MMM d, yyyy')}`
    : 'Period: All dates';

  const availabilityLabel = bounds
    ? `Available records: ${format(parseISO(bounds.earliest), 'MMM d, yyyy')} – ${format(parseISO(bounds.latest), 'MMM d, yyyy')}`
    : null;

  const startValid = parseLogDate(draftStart);
  const endValid = parseLogDate(draftEnd);
  const isReversed = startValid && endValid && endValid < startValid;
  const isApplyDisabled = isLoading || !!error || !draftStart || !draftEnd || !!applyError || isReversed;

  React.useEffect(() => {
    if (startValid && endValid && endValid < startValid) {
      setApplyError('End date must be on or after start date.');
    } else if (applyError === 'End date must be on or after start date.') {
      setApplyError(null);
    }
  }, [draftStart, draftEnd, startValid, endValid]);

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)} fullWidth style={{ justifyContent: 'flex-start' }}>
        <CalendarIcon size={16} style={{ marginRight: 8 }} />
        {triggerLabel}
      </Button>
      <Modal opened={open} onClose={() => setOpen(false)} title="Choose period" size={wide ? "xl" : "md"}>
        <Stack gap="md">
          {isLoading ? (
            <Text size="sm" c="dimmed">Loading available dates…</Text>
          ) : error ? (
            <Stack gap="xs">
              <Text size="sm" c="red">Couldn't load available dates.</Text>
              <Button variant="default" size="xs" onClick={onRetry}>
                Retry
              </Button>
            </Stack>
          ) : !bounds ? (
            <Text size="sm" c="dimmed">No logs available for the current filters.</Text>
          ) : (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">{availabilityLabel}</Text>
              <Text size="xs" c="dimmed">Some dates within this span may have no logs.</Text>
            </Stack>
          )}

          <Group grow>
            <TextInput
              label="Start date"
              type="date"
              value={draftStart}
              onChange={handleStartChange}
              disabled={isLoading || !!error}
              min={`${minYear}-01-01`}
              max={`${maxYear}-12-31`}
              error={!!applyError && !draftStart}
            />
            <TextInput
              label="End date"
              type="date"
              value={draftEnd}
              onChange={handleEndChange}
              disabled={isLoading || !!error}
              min={`${minYear}-01-01`}
              max={`${maxYear}-12-31`}
              error={!!applyError && !draftEnd}
            />
          </Group>

          {applyError && (
            <Text size="sm" c="red" role="alert">
              {applyError}
            </Text>
          )}

          <DatePickerInput
            type="range"
            label="Calendar"
            placeholder="Pick dates range"
            value={draftRange}
            onChange={handleRangeChange}
            minDate={minDate}
            maxDate={maxDate}
            numberOfColumns={wide ? 2 : 1}
            size="md"
          />

          <div aria-live="polite" className="sr-only">
            {draftRange[0] && draftRange[1]
              ? `Selected period: ${format(draftRange[0], 'MMM d, yyyy')} to ${format(draftRange[1], 'MMM d, yyyy')}`
              : draftRange[0]
              ? `Start date selected: ${format(draftRange[0], 'MMM d, yyyy')}. Select end date.`
              : 'No dates selected.'}
          </div>

          <Group justify="flex-end" gap="xs" mt="md">
            <Button variant="default" onClick={handleAllDates}>
              All dates
            </Button>
            <Button variant="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isApplyDisabled}>
              Apply period
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}