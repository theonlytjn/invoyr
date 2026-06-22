import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from 'invoyr';

export const PaymentTerms = () => (
  <div className="w-64">
    <Select defaultValue="30">
      <SelectTrigger>
        <SelectValue placeholder="Payment terms" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">Net 7</SelectItem>
        <SelectItem value="14">Net 14</SelectItem>
        <SelectItem value="30">Net 30</SelectItem>
        <SelectItem value="60">Net 60</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export const Currency = () => (
  <div className="w-64">
    <Select defaultValue="GBP">
      <SelectTrigger>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Common</SelectLabel>
          <SelectItem value="GBP">GBP — British Pound</SelectItem>
          <SelectItem value="USD">USD — US Dollar</SelectItem>
          <SelectItem value="EUR">EUR — Euro</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
