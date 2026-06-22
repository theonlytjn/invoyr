import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Button } from 'invoyr';

export const Default = () => (
  <TooltipProvider>
    <div className="flex gap-4 pt-8">
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">Send Invoice</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send to client via email</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm">Preview</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open PDF preview</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);
