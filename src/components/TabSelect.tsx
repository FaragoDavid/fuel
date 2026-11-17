import { ChevronDown } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

export default function TabSelect({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="tab-btn year-select">
        <Select.Value />
        <Select.Icon asChild>
          <ChevronDown size={12} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="year-select-content" position="popper" sideOffset={4}>
          <Select.Viewport>
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value} className="year-select-item">
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
