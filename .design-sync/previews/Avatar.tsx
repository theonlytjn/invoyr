import { Avatar, AvatarImage, AvatarFallback } from 'invoyr';

export const WithFallback = () => (
  <div className="flex gap-3 items-center">
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>AC</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>TN</AvatarFallback>
    </Avatar>
  </div>
);

export const Sizes = () => (
  <div className="flex gap-3 items-center">
    <Avatar className="h-8 w-8">
      <AvatarFallback className="text-xs">JD</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <Avatar className="h-14 w-14">
      <AvatarFallback className="text-lg">JD</AvatarFallback>
    </Avatar>
  </div>
);
